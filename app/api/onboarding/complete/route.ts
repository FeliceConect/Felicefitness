import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { goals, notificationsEnabled, termsVersion, privacyVersion } = body

    // Primeiro, atualizar campos basicos que sempre existem
    // A coluna 'objetivo' e VARCHAR(100), entao salvamos os goals como string separada por virgula
    const objetivoString = Array.isArray(goals) ? goals.join(',') : goals || ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: basicUpdateError } = await (supabase as any)
      .from('fitness_profiles')
      .update({
        objetivo: objetivoString,
        onboarding_completed: true,
        onboarding_step: 999
      })
      .eq('id', user.id)

    if (basicUpdateError) {
      console.error('Erro ao atualizar perfil (basico):', basicUpdateError)
      throw basicUpdateError
    }

    // Tentar atualizar campos de LGPD (podem nao existir se migration nao foi executada)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: lgpdUpdateError } = await (supabase as any)
      .from('fitness_profiles')
      .update({
        termos_aceitos: true,
        termos_aceitos_em: new Date().toISOString(),
        termos_versao: termsVersion,
        privacidade_aceita: true,
        privacidade_aceita_em: new Date().toISOString(),
        privacidade_versao: privacyVersion,
        receber_notificacoes_push: notificationsEnabled,
        receber_notificacoes_email: notificationsEnabled
      })
      .eq('id', user.id)

    // Se der erro na atualizacao LGPD, apenas log (colunas podem nao existir ainda)
    if (lgpdUpdateError) {
      console.warn('Aviso: campos LGPD nao atualizados (execute migration 20241227_onboarding_lgpd.sql):', lgpdUpdateError.message)
    }

    // Tentar registrar consentimento no historico (tabela pode nao existir)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('fitness_consent_history')
        .insert([
          {
            user_id: user.id,
            consent_type: 'termos',
            consent_version: termsVersion,
            accepted: true,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent')
          },
          {
            user_id: user.id,
            consent_type: 'privacidade',
            consent_version: privacyVersion,
            accepted: true,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            user_agent: request.headers.get('user-agent')
          }
        ])
    } catch (consentError) {
      console.warn('Aviso: historico de consentimento nao registrado (execute migration 20241227_onboarding_lgpd.sql)')
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao completar onboarding:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Verificar status do onboarding
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (supabase as any)
      .from('fitness_profiles')
      .select('onboarding_completed, onboarding_step, termos_aceitos, privacidade_aceita')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // Perfil ainda nao existe
      return NextResponse.json({
        success: true,
        onboardingCompleted: false,
        currentStep: 0
      })
    }

    return NextResponse.json({
      success: true,
      onboardingCompleted: profile?.onboarding_completed || false,
      currentStep: profile?.onboarding_step || 0,
      termsAccepted: profile?.termos_aceitos || false,
      privacyAccepted: profile?.privacidade_aceita || false
    })

  } catch (error) {
    console.error('Erro ao verificar onboarding:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
