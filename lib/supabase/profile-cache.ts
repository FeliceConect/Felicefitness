/**
 * Cache assinado do perfil no cookie, para o middleware.
 *
 * PROBLEMA: o middleware roda em quase toda requisição e fazia até 3 chamadas
 * SEQUENCIAIS ao Supabase — `auth.getUser()`, `select` em `fitness_profiles` e
 * `select` em `fitness_professionals`. Com prefetch do Next e polling de
 * notificações, um único usuário navegando gerava rajadas de dezenas de
 * conexões novas por segundo. Em 2026-07-29/30 isso saturou a fila de conexões
 * do Supabase self-hosted: `UND_ERR_CONNECT_TIMEOUT` em massa e usuários
 * expulsos para /login.
 *
 * SOLUÇÃO: guardar role/onboarding/tipo num cookie httpOnly ASSINADO com HMAC,
 * válido por poucos minutos. O `getUser()` continua sendo feito em toda
 * requisição (é ele que valida o JWT — nunca troque por `getSession()`), mas as
 * duas consultas de perfil só acontecem quando o cache expira. Isso derruba as
 * conexões por requisição de 3 para 1.
 *
 * SEGURANÇA: o cookie é assinado com HMAC-SHA256 usando um segredo que só
 * existe no servidor, e carrega o `uid`. Um cookie sem assinatura válida, com
 * `uid` diferente do usuário autenticado, ou expirado é descartado — nesse caso
 * o middleware volta a consultar o banco. Ou seja: forjar o cookie não eleva
 * privilégio. Note que o cookie afeta apenas o ROTEAMENTO; a autorização de
 * dados continua no RLS e nas checagens de role dentro das rotas de API.
 *
 * CUSTO ACEITO: uma mudança de role leva até PROFILE_TTL_MS para valer no
 * roteamento. Para forçar antes, apague o cookie (ver clearProfileCookie).
 */

export const PROFILE_COOKIE = 'ff-profile'

/** Curto de propósito: limita a janela em que uma troca de role fica obsoleta. */
export const PROFILE_TTL_MS = 5 * 60 * 1000

export interface CachedProfile {
  uid: string
  role: string | null
  adminType: string | null
  onboardingCompleted: boolean
  isProfessional: boolean
  isMedicoIntegrativo: boolean
}

interface SignedPayload extends CachedProfile {
  exp: number
}

/**
 * Segredo do HMAC. Usa a service role key, que é server-only e de alta
 * entropia — evita exigir uma variável de ambiente nova no deploy. Se não
 * estiver definida, o cache é simplesmente desligado (o middleware volta a
 * consultar o banco), nunca cai para um modo inseguro.
 */
function getSecret(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  // índice em vez de for..of: o target do projeto é ES5 e iterar Uint8Array
  // exigiria downlevelIteration.
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return new Uint8Array(sig)
}

/** Comparação em tempo constante — não vaza o quanto a assinatura "quase" bateu. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function signProfileCookie(profile: CachedProfile): Promise<string | null> {
  const secret = getSecret()
  if (!secret) return null
  const payload: SignedPayload = { ...profile, exp: Date.now() + PROFILE_TTL_MS }
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const sig = toBase64Url(await hmac(secret, body))
  return `${body}.${sig}`
}

/**
 * Valida e decodifica o cookie. Retorna null se: não há segredo, formato
 * inválido, assinatura errada, expirado, ou o uid não é o do usuário atual.
 */
export async function readProfileCookie(
  raw: string | undefined,
  expectedUid: string
): Promise<CachedProfile | null> {
  const secret = getSecret()
  if (!secret || !raw) return null

  const dot = raw.lastIndexOf('.')
  if (dot <= 0) return null
  const body = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)

  let expected: Uint8Array
  let provided: Uint8Array
  try {
    expected = await hmac(secret, body)
    provided = fromBase64Url(sig)
  } catch {
    return null
  }
  if (!timingSafeEqual(expected, provided)) return null

  let payload: SignedPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)))
  } catch {
    return null
  }

  if (typeof payload?.exp !== 'number' || payload.exp < Date.now()) return null
  if (payload.uid !== expectedUid) return null

  return {
    uid: payload.uid,
    role: payload.role ?? null,
    adminType: payload.adminType ?? null,
    onboardingCompleted: payload.onboardingCompleted === true,
    isProfessional: payload.isProfessional === true,
    isMedicoIntegrativo: payload.isMedicoIntegrativo === true,
  }
}

export const PROFILE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: Math.floor(PROFILE_TTL_MS / 1000),
}
