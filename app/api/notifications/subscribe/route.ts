import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// NOTE: Table fitness_push_subscriptions needs to be created in Supabase.
// Using type assertions until types are generated.

export async function POST(request: NextRequest) {
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

    // Obter subscription do request
    const body = await request.json()
    const { subscription, userAgent } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Subscription inválida' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Verificar se a subscription já existe
    const { data: existing } = await db
      .from('fitness_push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existing) {
      // Atualizar subscription existente
      const { error: updateError } = await db
        .from('fitness_push_subscriptions')
        .update({
          keys_p256dh: subscription.keys.p256dh,
          keys_auth: subscription.keys.auth,
          last_used: new Date().toISOString(),
          active: true,
          user_agent: userAgent || null
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Erro ao atualizar subscription:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar subscription' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription atualizada',
        subscriptionId: existing.id
      })
    }

    // Criar nova subscription
    const { data: newSub, error: insertError } = await db
      .from('fitness_push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys_p256dh: subscription.keys.p256dh,
        keys_auth: subscription.keys.auth,
        user_agent: userAgent || null,
        active: true
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Erro ao criar subscription:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription criada com sucesso',
      subscriptionId: newSub.id
    })

  } catch (error) {
    console.error('Erro no subscribe:', error)
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

    // Obter endpoint do request
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint não fornecido' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Desativar subscription
    const { error: updateError } = await db
      .from('fitness_push_subscriptions')
      .update({ active: false })
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (updateError) {
      console.error('Erro ao desativar subscription:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao desativar subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription desativada'
    })

  } catch (error) {
    console.error('Erro no unsubscribe:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
