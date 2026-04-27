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

// POST - Redefinir senha de um usuário (admin/super_admin)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('fitness_profiles')
      .select('role, admin_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, password } = body as { userId?: string; password?: string }

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, error: 'userId e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Para a própria conta o caminho correto é "Configurações > Alterar senha"
    // (que vai pedir a senha atual). Esta rota é só para reset administrativo.
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Para alterar sua própria senha, use Configurações' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getAdminClient()

    const { data: targetProfile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role, email, nome')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Apenas super_admin pode redefinir senha de admins/super_admins
    if (
      ['super_admin', 'admin'].includes(targetProfile.role) &&
      profile.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { success: false, error: 'Apenas super_admin pode redefinir senha de administradores' },
        { status: 403 }
      )
    }

    // Secretária só pode redefinir senha de pacientes
    if (
      profile.role === 'admin' &&
      profile.admin_type === 'secretary' &&
      targetProfile.role !== 'client'
    ) {
      return NextResponse.json(
        { success: false, error: 'Secretaria só pode redefinir senha de pacientes' },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    })

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar senha' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Senha de ${targetProfile.nome || targetProfile.email} redefinida com sucesso`,
    })
  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
