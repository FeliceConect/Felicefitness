import { NextRequest, NextResponse } from 'next/server'
import { requirePhotoAccess } from '@/lib/auth/patient-photos'

export const maxDuration = 20

/**
 * Proxy de imagens do bucket `progress-photos` — único caminho de leitura das
 * fotos de evolução. São fotos de corpo em roupa íntima (dado sensível, LGPD),
 * então a imagem só sai daqui depois de checar sessão, papel e vínculo do
 * profissional com o paciente.
 *
 * Efeito colateral útil: como serve do mesmo origin, o <canvas> não fica
 * "tainted" na exportação (html-to-image / toPng) da comparação.
 *
 * Query: ?photo_id=<uuid da linha em fitness_progress_photos>
 *
 * O parâmetro é o id da foto, e não a URL: assim o caminho do objeto é
 * derivado no servidor (nada de path vindo do cliente), o user_id do paciente
 * não viaja na query string, e a URL não termina em .webp — o que a faria cair
 * na regra de cache de imagens do service worker.
 */

const BUCKET = 'progress-photos'
const ALLOWED_CONTENT_TYPES = ['image/webp', 'image/jpeg', 'image/png']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const auth = await requirePhotoAccess(patientId)
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const photoId = new URL(request.url).searchParams.get('photo_id')
    if (!photoId) {
      return NextResponse.json({ success: false, error: 'photo_id obrigatório' }, { status: 400 })
    }

    const { data: photo } = await supabaseAdmin
      .from('fitness_progress_photos')
      .select('foto_url, user_id')
      .eq('id', photoId)
      .maybeSingle()

    // Confere a posse aqui: sem isso, trocar o :id da rota leria a foto de
    // outro paciente com a autorização deste.
    if (!photo || photo.user_id !== patientId) {
      return NextResponse.json({ success: false, error: 'Foto não encontrada' }, { status: 404 })
    }

    // `foto_url` é gravada pelo cliente em alguns fluxos, então o caminho
    // derivado dela é tratado como não confiável: tem que cair dentro da pasta
    // do próprio paciente, sem subir de diretório.
    const marker = `/${BUCKET}/`
    const markerAt = photo.foto_url.indexOf(marker)
    const objectPath = markerAt === -1
      ? null
      : decodeURIComponent(photo.foto_url.slice(markerAt + marker.length).split('?')[0])

    if (!objectPath || objectPath.includes('..') || !objectPath.startsWith(`${patientId}/`)) {
      return NextResponse.json({ success: false, error: 'Caminho inválido' }, { status: 400 })
    }

    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(objectPath)

    if (downloadError || !blob) {
      // Objeto sumiu do storage mas a linha ficou: é 404, não falha de infra —
      // 502 aqui polui o alerta de erro da plataforma.
      console.warn('[image-proxy] objeto ausente', { patientId, photoId, message: downloadError?.message })
      return NextResponse.json({ success: false, error: 'Imagem não encontrada' }, { status: 404 })
    }

    // Serve só tipo de imagem conhecido. O conteúdo vem do storage e é servido
    // no origin do app: devolver text/html daqui seria XSS na sessão de quem
    // enxerga o prontuário.
    if (!ALLOWED_CONTENT_TYPES.includes(blob.type)) {
      console.warn('[image-proxy] tipo recusado', { patientId, photoId, type: blob.type })
      return NextResponse.json({ success: false, error: 'Tipo de arquivo inválido' }, { status: 415 })
    }

    return new NextResponse(blob.stream(), {
      status: 200,
      headers: {
        'Content-Type': blob.type,
        // O nome do objeto carrega timestamp, então o conteúdo é imutável.
        // `private` mantém fora de cache compartilhado; a hora de validade
        // evita reabrir 28 invocações a cada troca de aba.
        'Cache-Control': 'private, max-age=3600, immutable',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Erro image proxy:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
