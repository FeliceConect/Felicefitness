import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// POST - Limpar registro de profissional do superadmin (criado erroneamente)
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Apenas superadmin pode usar este endpoint
    const SUPERADMIN_EMAIL = 'felicemed@gmail.com'
    if (user.email !== SUPERADMIN_EMAIL) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
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

    // Verificar se existe registro de professional para o superadmin
    const { data: prof } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type, specialty')
      .eq('user_id', user.id)
      .single()

    if (!prof) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum registro de profissional encontrado para limpar'
      })
    }

    // Deletar o registro de professional
    const { error } = await supabaseAdmin
      .from('fitness_professionals')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao deletar professional:', error)
      return NextResponse.json({
        error: 'Erro ao limpar registro',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Registro de profissional removido com sucesso. Faça logout e login novamente.',
      deleted: prof
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}
