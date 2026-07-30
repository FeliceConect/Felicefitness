/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { auditBioimpedancePoints } from '@/lib/bioimpedance/audit'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET — conferência dos pontos de bioimpedância de todos os pacientes.
// Somente leitura: compara o que está lançado com o que a fórmula atual calcula.
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Apenas super admin' }, { status: 403 })
    }

    const audit = await auditBioimpedancePoints(supabaseAdmin)
    return NextResponse.json({ success: true, ...audit })
  } catch (error) {
    console.error('Erro na auditoria de bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
