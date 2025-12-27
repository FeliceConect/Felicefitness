import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENT_TERMS_VERSION } from '@/lib/admin/types'

// GET - Verificar se usuário aceitou os termos atuais
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

    // Verificar se existe aceite da versão atual
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: acceptance, error } = await (supabase as any)
      .from('fitness_terms_acceptance')
      .select('*')
      .eq('user_id', user.id)
      .eq('version', CURRENT_TERMS_VERSION)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (ok, significa que não aceitou)
      console.error('Erro ao verificar termos:', error)
    }

    return NextResponse.json({
      success: true,
      accepted: !!acceptance,
      current_version: CURRENT_TERMS_VERSION,
      acceptance: acceptance || null
    })

  } catch (error) {
    console.error('Erro ao verificar termos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Aceitar termos
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

    // Pegar informações do request
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Inserir aceite
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('fitness_terms_acceptance')
      .insert({
        user_id: user.id,
        version: CURRENT_TERMS_VERSION,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single()

    if (error) {
      // Se já existe, não é erro
      if (error.code === '23505') { // unique violation
        return NextResponse.json({
          success: true,
          message: 'Termos já foram aceitos anteriormente',
          already_accepted: true
        })
      }
      console.error('Erro ao registrar aceite:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao registrar aceite' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Termos aceitos com sucesso',
      acceptance: data
    })

  } catch (error) {
    console.error('Erro ao processar aceite:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
