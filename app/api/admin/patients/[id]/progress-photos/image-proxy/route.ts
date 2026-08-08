import { NextRequest, NextResponse } from 'next/server'
import { requirePhotoAccess } from '@/lib/auth/patient-photos'
import { serveProgressPhoto } from '@/lib/photos/serve'

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

    return await serveProgressPhoto(supabaseAdmin, photo.foto_url, patientId, {
      route: 'image-proxy',
      actorId: auth.user.id,
      role: auth.role,
      patientId,
      photoId,
    })
  } catch (error) {
    console.error('Erro image proxy:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
