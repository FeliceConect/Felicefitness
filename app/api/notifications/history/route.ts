import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// NOTE: Tables fitness_notification_history, fitness_push_subscriptions,
// and fitness_notification_preferences need to be created in Supabase.
// Using type assertions until types are generated.

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter parâmetros de paginação
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Construir query - using any to bypass type checking for unregistered table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('fitness_notification_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

    if (unreadOnly) {
      query = query.is('read_at', null)
    }

    const { data: notifications, error: queryError, count } = await query

    if (queryError) {
      console.error('Erro ao buscar histórico:', queryError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar histórico' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter ação do request
    const body = await request.json()
    const { action, notificationIds } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Ação não especificada' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    switch (action) {
      case 'markAsRead': {
        // Marcar uma ou mais notificações como lidas
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { success: false, error: 'IDs não fornecidos' },
            { status: 400 }
          )
        }

        const { error: updateError } = await db
          .from('fitness_notification_history')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('id', notificationIds)

        if (updateError) {
          console.error('Erro ao marcar como lida:', updateError)
          return NextResponse.json(
            { success: false, error: 'Erro ao atualizar' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Notificações marcadas como lidas'
        })
      }

      case 'markAllAsRead': {
        // Marcar todas como lidas
        const { error: updateError } = await db
          .from('fitness_notification_history')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .is('read_at', null)

        if (updateError) {
          console.error('Erro ao marcar todas como lidas:', updateError)
          return NextResponse.json(
            { success: false, error: 'Erro ao atualizar' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Todas as notificações foram marcadas como lidas'
        })
      }

      case 'recordClick': {
        // Registrar clique em uma notificação
        const { notificationId } = body

        if (!notificationId) {
          return NextResponse.json(
            { success: false, error: 'ID não fornecido' },
            { status: 400 }
          )
        }

        const { error: updateError } = await db
          .from('fitness_notification_history')
          .update({
            clicked_at: new Date().toISOString(),
            read_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('id', notificationId)

        if (updateError) {
          console.error('Erro ao registrar clique:', updateError)
          return NextResponse.json(
            { success: false, error: 'Erro ao atualizar' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Clique registrado'
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Ação inválida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro ao processar ação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter IDs para deletar
    const body = await request.json()
    const { notificationIds, deleteAll } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    if (deleteAll) {
      // Deletar todas as notificações do usuário
      const { error: deleteError } = await db
        .from('fitness_notification_history')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Erro ao deletar todas:', deleteError)
        return NextResponse.json(
          { success: false, error: 'Erro ao deletar' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Histórico limpo com sucesso'
      })
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, error: 'IDs não fornecidos' },
        { status: 400 }
      )
    }

    // Deletar notificações específicas
    const { error: deleteError } = await db
      .from('fitness_notification_history')
      .delete()
      .eq('user_id', user.id)
      .in('id', notificationIds)

    if (deleteError) {
      console.error('Erro ao deletar:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notificações deletadas'
    })

  } catch (error) {
    console.error('Erro ao deletar:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
