import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - Desfazer marcação "realizada" (reverte para 'scheduled' e remove pontos de presença)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabaseAdmin = getAdminClient()

    // Somente admin pode reverter
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Apenas admin pode desfazer realização' }, { status: 403 })
    }

    // Verificar status atual
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('fitness_appointments')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ success: false, error: 'Consulta não encontrada' }, { status: 404 })
    }

    if (current.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Só é possível desfazer consultas com status "realizada"' },
        { status: 400 }
      )
    }

    // Remover pontos de presença atribuídos
    await supabaseAdmin
      .from('fitness_point_transactions')
      .delete()
      .eq('reference_id', id)
      .eq('category', 'attendance')

    // Reverter status para 'scheduled'
    const { data: updated, error } = await supabaseAdmin
      .from('fitness_appointments')
      .update({
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao desfazer consulta:', error)
      return NextResponse.json({ success: false, error: 'Erro ao desfazer' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Erro na API de uncomplete:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
