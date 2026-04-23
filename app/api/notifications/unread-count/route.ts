import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase as any)
      .from('fitness_notification_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)

    if (error) {
      console.error('Erro ao contar notificações não lidas:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao contar notificações' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: count ?? 0,
    })
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
