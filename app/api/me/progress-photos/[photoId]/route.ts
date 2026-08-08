import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStorageAdminClient, serveProgressPhoto } from '@/lib/photos/serve'

export const maxDuration = 20

/**
 * Foto de evolução do próprio paciente.
 *
 * O titular precisa conseguir ver o que o app coleta dele — a rota do
 * profissional (`/api/admin/patients/...`) nega `client` de propósito, então
 * este é o caminho do paciente. Só serve foto cujo `user_id` é o da sessão.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getStorageAdminClient()
    const { data: photo } = await supabaseAdmin
      .from('fitness_progress_photos')
      .select('foto_url, user_id')
      .eq('id', photoId)
      .maybeSingle()

    // 404 (e não 403) para foto de outra pessoa: responder diferente
    // permitiria descobrir quais ids existem.
    if (!photo || photo.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Foto não encontrada' }, { status: 404 })
    }

    return await serveProgressPhoto(supabaseAdmin, photo.foto_url, user.id, {
      route: 'me/progress-photos',
      userId: user.id,
      photoId,
    })
  } catch (error) {
    console.error('Erro ao servir foto do paciente:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
