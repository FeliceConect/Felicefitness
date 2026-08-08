import { NextResponse } from 'next/server'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Entrega de uma foto de evolução a partir do storage.
 *
 * Compartilhado entre a rota do profissional e a do paciente: a checagem de
 * quem pode ver muda, mas a parte perigosa (derivar o caminho e decidir o que
 * é seguro devolver) tem que ser uma só.
 */

export const PROGRESS_PHOTOS_BUCKET = 'progress-photos'

const ALLOWED_CONTENT_TYPES = ['image/webp', 'image/jpeg', 'image/png']

export function getStorageAdminClient(): SupabaseClient {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Deriva o caminho do objeto a partir da URL gravada.
 *
 * `foto_url` é gravada pelo cliente em alguns fluxos, então o valor é tratado
 * como não confiável: o objeto tem que estar na pasta do próprio dono, sem
 * subir de diretório. Devolve null quando não passa.
 */
export function resolveObjectPath(fotoUrl: string, ownerId: string): string | null {
  const marker = `/${PROGRESS_PHOTOS_BUCKET}/`
  const markerAt = fotoUrl.indexOf(marker)
  if (markerAt === -1) return null

  let path: string
  try {
    path = decodeURIComponent(fotoUrl.slice(markerAt + marker.length).split('?')[0])
  } catch {
    return null
  }

  if (!path || path.includes('..') || !path.startsWith(`${ownerId}/`)) return null
  return path
}

/**
 * Baixa e devolve a imagem. Assume que a autorização já foi feita por quem
 * chama — aqui só se cuida de caminho e tipo.
 */
export async function serveProgressPhoto(
  supabaseAdmin: SupabaseClient,
  fotoUrl: string,
  ownerId: string,
  logContext: Record<string, unknown>
): Promise<NextResponse> {
  const objectPath = resolveObjectPath(fotoUrl, ownerId)
  if (!objectPath) {
    return NextResponse.json({ success: false, error: 'Caminho inválido' }, { status: 400 })
  }

  const { data: blob, error: downloadError } = await supabaseAdmin.storage
    .from(PROGRESS_PHOTOS_BUCKET)
    .download(objectPath)

  if (downloadError || !blob) {
    // Objeto sumiu do storage mas a linha ficou: é 404, não falha de infra —
    // 502 aqui polui o alerta de erro da plataforma.
    console.warn('[progress-photo] objeto ausente', { ...logContext, message: downloadError?.message })
    return NextResponse.json({ success: false, error: 'Imagem não encontrada' }, { status: 404 })
  }

  // Serve só tipo de imagem conhecido. O conteúdo vem do storage e é servido
  // no origin do app: devolver text/html daqui seria XSS na sessão de quem vê.
  if (!ALLOWED_CONTENT_TYPES.includes(blob.type)) {
    console.warn('[progress-photo] tipo recusado', { ...logContext, type: blob.type })
    return NextResponse.json({ success: false, error: 'Tipo de arquivo inválido' }, { status: 415 })
  }

  return new NextResponse(blob.stream(), {
    status: 200,
    headers: {
      'Content-Type': blob.type,
      // O nome do objeto carrega timestamp, então o conteúdo é imutável.
      // `private` mantém fora de cache compartilhado.
      'Cache-Control': 'private, max-age=3600, immutable',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
