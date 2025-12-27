import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Buscar mensagens de uma conversa
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // Para paginação

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'conversationId é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário participa da conversa
    const { data: conversation } = await supabaseAdmin
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

    // Verificar se é profissional ou cliente
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', conversation.professional_id)
      .single()

    const isParticipant = conversation.client_id === user.id || !!professional

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado a ver esta conversa' },
        { status: 403 }
      )
    }

    // Buscar mensagens
    let query = supabaseAdmin
      .from('fitness_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) throw error

    // Marcar mensagens como lidas
    const userType = professional ? 'professional' : 'client'
    await supabaseAdmin.rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_user_id: user.id,
      p_user_type: userType
    })

    return NextResponse.json({
      success: true,
      messages: (messages || []).reverse(), // Ordenar do mais antigo para o mais novo
      hasMore: messages?.length === limit
    })

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Enviar nova mensagem
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { conversationId, content, messageType = 'text', metadata } = body

    if (!conversationId || !content) {
      return NextResponse.json(
        { success: false, error: 'conversationId e content são obrigatórios' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário participa da conversa
    const { data: conversation } = await supabaseAdmin
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

    // Verificar se é profissional ou cliente
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', conversation.professional_id)
      .single()

    const isClient = conversation.client_id === user.id
    const isProfessional = !!professional

    if (!isClient && !isProfessional) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado a enviar mensagem' },
        { status: 403 }
      )
    }

    // Criar mensagem
    const { data: message, error } = await supabaseAdmin
      .from('fitness_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: isClient ? 'client' : 'professional',
        content: content.trim(),
        message_type: messageType,
        metadata: metadata || null
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
