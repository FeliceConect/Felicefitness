import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hora

// GET /api/chat/attachment?path=<storage_path>
// Retorna signed URL se o usuário é participante da conversa dona do path.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'path é obrigatório' },
        { status: 400 }
      )
    }

    // Primeiro segmento do path é o conversation_id
    const conversationId = path.split('/')[0]
    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'Path inválido' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Valida participante (ou super_admin/admin)
    const { data: profile } = await admin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdminRole = profile?.role === 'super_admin' || profile?.role === 'admin'

    let isParticipant = isAdminRole

    if (!isParticipant) {
      const { data: conversation } = await admin
        .from('fitness_conversations')
        .select('id, client_id, professional_id')
        .eq('id', conversationId)
        .single()

      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversa não encontrada' },
          { status: 404 }
        )
      }

      if (conversation.client_id === user.id) {
        isParticipant = true
      } else {
        const { data: professional } = await admin
          .from('fitness_professionals')
          .select('id')
          .eq('user_id', user.id)
          .eq('id', conversation.professional_id)
          .maybeSingle()
        isParticipant = !!professional
      }
    }

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado a acessar este anexo' },
        { status: 403 }
      )
    }

    const { data, error } = await admin.storage
      .from('chat-attachments')
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

    if (error || !data) {
      console.error('Erro ao gerar signed URL:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao gerar link do anexo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl,
      expires_in: SIGNED_URL_TTL_SECONDS,
    })
  } catch (error) {
    console.error('Erro na rota de anexo:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
