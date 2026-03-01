import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Buscar dados do profissional logado
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

    // Usar admin client para buscar dados do profissional
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

    const { data: professional, error } = await supabaseAdmin
      .from('fitness_professionals')
      .select('*')
      .eq('user_id', user.id)
      .in('type', ['nutritionist', 'trainer', 'coach'])
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar profissional:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados do profissional' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      professional: professional || null
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
