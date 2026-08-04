import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  PROFILE_COOKIE,
  PROFILE_COOKIE_OPTIONS,
  readProfileCookie,
  signProfileCookie,
  type CachedProfile,
} from './profile-cache'

/**
 * Timeout das chamadas ao Supabase feitas pelo middleware.
 *
 * O padrão do undici é 10s. Como o middleware roda em quase toda requisição e
 * fazia até 3 chamadas sequenciais, um Supabase inacessível custava ~30s por
 * página — o app parecia morto. 3s falha rápido e mantém a navegação usável.
 */
const SUPABASE_TIMEOUT_MS = 3000

/**
 * fetch com timeout, preservando um AbortSignal que o supabase-js já tenha
 * passado (não dá para simplesmente sobrescrever `signal`).
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS)
  const upstream = init?.signal
  if (upstream) {
    if (upstream.aborted) controller.abort()
    else upstream.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

/**
 * Erro de INFRAESTRUTURA (não deu para falar com o Supabase) x erro de AUTENTICAÇÃO
 * (o token é inválido/expirado). A distinção é crítica: tratar queda de rede como
 * "não está logado" expulsa todo mundo para /login e cria loop de login — foi o
 * que aconteceu em 29 e 30/07/2026.
 *
 * O supabase-js sinaliza falha de rede com AuthRetryableFetchError (status 0);
 * 5xx também é indisponibilidade, não credencial ruim.
 */
function isInfraError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { name?: string; status?: number; message?: string }
  if (e.name === 'AuthRetryableFetchError') return true
  if (e.name === 'AbortError' || e.name === 'TimeoutError') return true
  if (typeof e.status === 'number' && (e.status === 0 || e.status >= 500)) return true
  return /fetch failed|timeout|ECONNRESET|ENOTFOUND|EAI_AGAIN|network/i.test(e.message || '')
}

/** O usuário tem cookie de sessão do Supabase? Usado para decidir o fail-open. */
function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(c => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user: { id: string } | null = null
  let authInfraDown = false
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data.user
    if (error && isInfraError(error)) authInfraDown = true
  } catch {
    // getUser() normalmente devolve { error }, mas em falha de rede dura pode
    // lançar. Qualquer exceção aqui significa "não deu para determinar a sessão",
    // que é exatamente o caso em que NÃO queremos deslogar ninguém.
    authInfraDown = true
  }

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/registro', '/termos', '/privacidade']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // MODO DEGRADADO: não conseguimos falar com o Supabase.
  // Se existe cookie de sessão, o usuário provavelmente ESTÁ logado — deixamos
  // passar em vez de deslogá-lo. Isso não abre brecha: toda leitura de dados
  // continua protegida por RLS e as rotas de API refazem a checagem de role
  // (e falham fechadas, com 401, quando o Supabase está fora).
  if (authInfraDown) {
    if (!user && !hasSupabaseSessionCookie(request) && !isPublicRoute) {
      // Sem sessão nenhuma: mandar para o login é o comportamento correto.
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    // Marcador para diagnóstico nos logs/DevTools.
    supabaseResponse.headers.set('x-ff-degraded', 'supabase-unreachable')
    return supabaseResponse
  }

  // Rotas que não devem verificar onboarding
  const onboardingExemptRoutes = ['/onboarding', '/api', '/termos', '/privacidade', '/portal']
  const isOnboardingExempt = onboardingExemptRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Rotas do portal (exclusivas para profissionais)
  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal')

  // Rotas do app (exclusivas para pacientes)
  const appRoutes = ['/dashboard', '/treino', '/alimentacao', '/hidratacao', '/agua', '/fotos', '/bioimpedancia', '/sono', '/perfil', '/configuracoes', '/relatorios', '/agenda', '/feed', '/ranking', '/chat', '/mensagens', '/compartilhar', '/notificacoes', '/corpo', '/formularios', '/conquistas']
  const isAppRoute = appRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Se não está autenticado e tentando acessar rota protegida
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rotas do admin
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // Verificar role do usuário
  let isProfessional = false
  let isAdminUser = false
  let isSuperAdmin = false
  let isMedicoIntegrativo = false // acessa app E portal, como super_admin
  let isRestrictedAdmin = false // admin_type secretary/support/manager — sem acesso ao app
  let role: string | null = null
  let adminType: string | null = null
  let onboardingCompleted = true
  // Não conseguimos determinar o perfil? Então NÃO aplicamos redirect por role —
  // errar o role manda o usuário para a área errada (ex.: admin expulso de /admin).
  let profileKnown = false
  let freshProfile: CachedProfile | null = null

  const professionalRoles = ['nutritionist', 'trainer', 'coach', 'physiotherapist']

  if (user) {
    // Cache assinado: evita 2 consultas ao banco em toda requisição.
    const cached = await readProfileCookie(request.cookies.get(PROFILE_COOKIE)?.value, user.id)

    if (cached) {
      role = cached.role
      adminType = cached.adminType
      onboardingCompleted = cached.onboardingCompleted
      isProfessional = cached.isProfessional
      isMedicoIntegrativo = cached.isMedicoIntegrativo
      profileKnown = true
    } else {
      // Em paralelo: antes eram sequenciais, dobrando a latência do pior caso.
      // O `fitness_professionals` é o fallback para quem é profissional sem role
      // próprio — buscar junto custa uma consulta a mais só para quem já tem role.
      const [profileRes, professionalRes] = await Promise.all([
        supabase
          .from('fitness_profiles')
          .select('role, onboarding_completed, admin_type')
          .eq('id', user.id)
          .single(),
        supabase
          .from('fitness_professionals')
          .select('id, is_active, type')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle(),
      ])

      const profileData = profileRes.data
      const professional = professionalRes.data

      if (profileData) {
        role = profileData.role
        adminType = profileData.admin_type ?? null
        onboardingCompleted = profileData.onboarding_completed !== false
        profileKnown = true
      } else if (isInfraError(profileRes.error)) {
        // Supabase caiu no meio: segue sem redirect por role (fail-open no roteamento).
        supabaseResponse.headers.set('x-ff-degraded', 'profile-unreachable')
      } else {
        // Consulta respondeu, mas não há perfil (usuário recém-criado).
        profileKnown = true
      }

      if (professionalRoles.includes(role || '')) {
        isProfessional = true
      } else if (professional) {
        isProfessional = true
        if (professional.type === 'medico_integrativo') {
          isMedicoIntegrativo = true
        }
      }

      if (profileKnown) {
        freshProfile = {
          uid: user.id,
          role,
          adminType,
          onboardingCompleted,
          isProfessional,
          isMedicoIntegrativo,
        }
      }
    }

    if (role === 'super_admin') {
      isSuperAdmin = true
      isAdminUser = true
    } else if (role === 'admin') {
      isAdminUser = true
      if (adminType === 'secretary' || adminType === 'support' || adminType === 'manager') {
        isRestrictedAdmin = true
      }
    }
  }

  // Grava o cache no cookie da resposta que vamos devolver (inclusive redirects).
  const withProfileCookie = async (response: NextResponse): Promise<NextResponse> => {
    if (!freshProfile) return response
    const signed = await signProfileCookie(freshProfile)
    if (signed) response.cookies.set(PROFILE_COOKIE, signed, PROFILE_COOKIE_OPTIONS)
    return response
  }

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    const response = NextResponse.redirect(url)
    // Carrega os cookies que o Supabase pode ter RENOVADO nesta requisição.
    // O setAll() grava o token novo em `supabaseResponse`; um
    // NextResponse.redirect() novo descartava esses cookies, então o navegador
    // seguia com o token velho — uma das causas de "fui deslogado do nada".
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    return withProfileCookie(response)
  }

  // Landing page apropriada para cada tipo de usuário
  const getLanding = (): string => {
    if (isRestrictedAdmin) {
      if (adminType === 'secretary') return '/admin/agenda'
      if (adminType === 'manager') return '/admin/rankings'
      return '/admin/pacientes'
    }
    if (isProfessional && !isSuperAdmin) return '/portal'
    return '/dashboard'
  }

  // Se está autenticado e tentando acessar rota pública (login/registro)
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/registro'))) {
    return redirectTo(getLanding())
  }

  // Sem perfil confirmado, não arriscamos redirect por role — deixa a página abrir.
  if (user && !profileKnown) {
    return withProfileCookie(supabaseResponse)
  }

  // Admin secretary/support tentando acessar rotas do app (paciente) → painel admin
  if (user && isRestrictedAdmin && isAppRoute) {
    return redirectTo(getLanding())
  }

  // Profissional (exceto super_admin e medico_integrativo) tentando acessar rotas do app → portal
  if (user && isProfessional && !isSuperAdmin && !isMedicoIntegrativo && isAppRoute) {
    return redirectTo('/portal')
  }

  // Admin secretary/support tentando acessar portal → painel admin
  if (user && isRestrictedAdmin && isPortalRoute) {
    return redirectTo(getLanding())
  }

  // Cliente (não profissional e não super_admin) tentando acessar portal → app
  if (user && !isProfessional && !isSuperAdmin && !isAdminUser && isPortalRoute) {
    return redirectTo('/dashboard')
  }

  // Se NÃO é admin tentando acessar admin, redirecionar
  if (user && !isAdminUser && isAdminRoute) {
    return redirectTo(isProfessional ? '/portal' : '/dashboard')
  }

  // Se está autenticado (usuário comum), verificar se completou o onboarding
  if (user && !isProfessional && !isAdminUser && !isOnboardingExempt) {
    if (!onboardingCompleted) {
      return redirectTo('/onboarding')
    }
  }

  return withProfileCookie(supabaseResponse)
}
