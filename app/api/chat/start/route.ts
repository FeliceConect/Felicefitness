import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// POST - Iniciar conversa com cliente (apenas profissionais)
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
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId é obrigatório' },
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

    // Verificar se é profissional
    const { data: professional, error: profError } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profError || !professional) {
      return NextResponse.json(
        { success: false, error: 'Você não é um profissional' },
        { status: 403 }
      )
    }

    // Verificar se o cliente está atribuído a este profissional
    const { data: assignment } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id')
      .eq('professional_id', professional.id)
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Cliente não está atribuído a você' },
        { status: 403 }
      )
    }

    // Verificar se já existe conversa
    const { data: existing } = await supabaseAdmin
      .from('fitness_conversations')
      .select('id')
      .eq('client_id', clientId)
      .eq('professional_id', professional.id)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        conversationId: existing.id,
        isNew: false
      })
    }

    // Criar nova conversa
    const { data: newConversation, error } = await supabaseAdmin
      .from('fitness_conversations')
      .insert({
        client_id: clientId,
        professional_id: professional.id
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      conversationId: newConversation.id,
      isNew: true
    })

  } catch (error) {
    console.error('Erro ao iniciar conversa:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
