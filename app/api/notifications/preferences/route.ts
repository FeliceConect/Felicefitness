import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/notifications'
import type { NotificationPreferences } from '@/types/notifications'

export async function GET() {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Buscar preferências do usuário (tabela fitness_notification_settings)
    const { data: prefs, error: prefError } = await db
      .from('fitness_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Erro ao buscar preferências:', prefError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar preferências' },
        { status: 500 }
      )
    }

    // Se não existir, retornar padrões
    if (!prefs) {
      return NextResponse.json({
        success: true,
        preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        isDefault: true
      })
    }

    // Converter do formato do banco para o formato do tipo
    const preferences: NotificationPreferences = {
      enabled: true,
      treino: {
        enabled: prefs.notif_treino_ativo ?? true,
        beforeMinutes: 30
      },
      refeicao: {
        enabled: prefs.notif_refeicao_ativo ?? true,
        times: ['07:00', '12:00', '19:00']
      },
      agua: {
        enabled: prefs.notif_agua_ativo ?? true,
        intervalMinutes: (prefs.notif_agua_intervalo_horas ?? 2) * 60,
        startTime: '07:00',
        endTime: '22:00'
      },
      medicamento: {
        enabled: prefs.notif_medicamento_ativo ?? true,
        times: ['09:00']
      },
      sono: {
        enabled: prefs.notif_sono_ativo ?? true,
        bedtimeReminder: prefs.notif_sono_horario ?? '22:00',
        wakeupReminder: '06:00'
      },
      conquistas: {
        enabled: true
      },
      quietHours: DEFAULT_NOTIFICATION_PREFERENCES.quietHours
    }

    return NextResponse.json({
      success: true,
      preferences,
      isDefault: false
    })

  } catch (error) {
    console.error('Erro ao buscar preferências:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    // Obter preferências do request
    const body = await request.json()
    const { preferences } = body as { preferences: Partial<NotificationPreferences> }

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'Preferências não fornecidas' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Verificar se já existe
    const { data: existing } = await db
      .from('fitness_notification_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Preparar dados para o banco (mapeando para os nomes corretos das colunas)
    const dbData = {
      user_id: user.id,
      notif_treino_ativo: preferences.treino?.enabled,
      notif_refeicao_ativo: preferences.refeicao?.enabled,
      notif_agua_ativo: preferences.agua?.enabled,
      notif_agua_intervalo_horas: preferences.agua?.intervalMinutes ? Math.round(preferences.agua.intervalMinutes / 60) : undefined,
      notif_medicamento_ativo: preferences.medicamento?.enabled,
      notif_sono_ativo: preferences.sono?.enabled,
      notif_sono_horario: preferences.sono?.bedtimeReminder,
      updated_at: new Date().toISOString()
    }

    if (existing) {
      // Atualizar
      const { error: updateError } = await db
        .from('fitness_notification_settings')
        .update(dbData)
        .eq('id', existing.id)

      if (updateError) {
        console.error('Erro ao atualizar preferências:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar preferências' },
          { status: 500 }
        )
      }
    } else {
      // Criar
      const { error: insertError } = await db
        .from('fitness_notification_settings')
        .insert(dbData)

      if (insertError) {
        console.error('Erro ao criar preferências:', insertError)
        return NextResponse.json(
          { success: false, error: 'Erro ao criar preferências' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Preferências salvas com sucesso'
    })

  } catch (error) {
    console.error('Erro ao salvar preferências:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
