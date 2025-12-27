import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/admin/types'

// GET - Obter role do usuário atual
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

    // Buscar perfil com role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (supabase as any)
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // Se não encontrou perfil, assume role 'client' (padrão)
      return NextResponse.json({
        success: true,
        role: 'client' as UserRole,
        user_id: user.id,
        email: user.email
      })
    }

    // Se role não estiver definido, assume 'client'
    const role = (profile?.role as UserRole) || 'client'

    return NextResponse.json({
      success: true,
      role,
      user_id: user.id,
      email: user.email
    })

  } catch (error) {
    console.error('Erro ao buscar role do usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
