import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Buscar conversas do usuário
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
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

    // Verificar se é profissional
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    let conversations = []

    if (professional) {
      // É profissional - buscar conversas onde é o profissional
      const { data, error } = await supabaseAdmin
        .from('fitness_conversations')
        .select(`
          id,
          client_id,
          professional_id,
          last_message_at,
          professional_unread_count,
          is_active,
          created_at
        `)
        .eq('professional_id', professional.id)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Buscar dados dos clientes
      const clientIds = data?.map(c => c.client_id) || []
      const { data: clients } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email')
        .in('id', clientIds)

      const clientMap = new Map(clients?.map(c => [c.id, c]) || [])

      // Buscar última mensagem de cada conversa
      const conversationIds = data?.map(c => c.id) || []
      const { data: lastMessages } = await supabaseAdmin
        .from('fitness_messages')
        .select('conversation_id, content, sender_type, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })

      const lastMessageMap = new Map<string, { content: string; sender_type: string; created_at: string }>()
      lastMessages?.forEach(msg => {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg)
        }
      })

      conversations = data?.map(conv => {
        const client = clientMap.get(conv.client_id)
        return {
        id: conv.id,
        participant: client || { id: conv.client_id, nome: 'Cliente', email: '' },
        unreadCount: conv.professional_unread_count,
        lastMessage: lastMessageMap.get(conv.id) || null,
        lastMessageAt: conv.last_message_at,
        isActive: conv.is_active
      }}) || []

    } else {
      // É cliente - buscar conversas onde é o cliente
      const { data, error } = await supabaseAdmin
        .from('fitness_conversations')
        .select(`
          id,
          client_id,
          professional_id,
          last_message_at,
          client_unread_count,
          is_active,
          created_at
        `)
        .eq('client_id', user.id)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Buscar dados dos profissionais
      const professionalIds = data?.map(c => c.professional_id) || []
      const { data: professionals } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, user_id, type, specialty')
        .in('id', professionalIds)

      const professionalUserIds = professionals?.map(p => p.user_id) || []
      const { data: professionalProfiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email')
        .in('id', professionalUserIds)

      const profileMap = new Map(professionalProfiles?.map(p => [p.id, p]) || [])
      const professionalMap = new Map(professionals?.map(p => [p.id, {
        ...p,
        profile: profileMap.get(p.user_id)
      }]) || [])

      // Buscar última mensagem de cada conversa
      const conversationIds = data?.map(c => c.id) || []
      const { data: lastMessages } = await supabaseAdmin
        .from('fitness_messages')
        .select('conversation_id, content, sender_type, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })

      const lastMessageMap = new Map<string, { content: string; sender_type: string; created_at: string }>()
      lastMessages?.forEach(msg => {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg)
        }
      })

      conversations = data?.map(conv => {
        const prof = professionalMap.get(conv.professional_id)
        return {
          id: conv.id,
          participant: {
            id: prof?.user_id || '',
            nome: prof?.profile?.nome || (prof?.type === 'nutritionist' ? 'Nutricionista' : 'Personal Trainer'),
            email: prof?.profile?.email || '',
            foto: null,
            type: prof?.type,
            specialty: prof?.specialty
          },
          unreadCount: conv.client_unread_count,
          lastMessage: lastMessageMap.get(conv.id) || null,
          lastMessageAt: conv.last_message_at,
          isActive: conv.is_active
        }
      }) || []
    }

    return NextResponse.json({
      success: true,
      conversations,
      userType: professional ? 'professional' : 'client'
    })

  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova conversa
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
    const { clientId, professionalId } = body

    if (!clientId || !professionalId) {
      return NextResponse.json(
        { success: false, error: 'clientId e professionalId são obrigatórios' },
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

    // Verificar se a conversa já existe
    const { data: existing } = await supabaseAdmin
      .from('fitness_conversations')
      .select('id')
      .eq('client_id', clientId)
      .eq('professional_id', professionalId)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        conversation: { id: existing.id },
        isNew: false
      })
    }

    // Criar nova conversa
    const { data: newConversation, error } = await supabaseAdmin
      .from('fitness_conversations')
      .insert({
        client_id: clientId,
        professional_id: professionalId
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      conversation: newConversation,
      isNew: true
    })

  } catch (error) {
    console.error('Erro ao criar conversa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
