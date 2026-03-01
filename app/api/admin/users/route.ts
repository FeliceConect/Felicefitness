import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Parâmetros de busca
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Usar admin client
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

    // Construir query
    let query = supabaseAdmin
      .from('fitness_profiles')
      .select('*', { count: 'exact' })

    // Filtrar por busca (sanitize to prevent PostgREST filter injection)
    if (search) {
      const sanitized = search.replace(/[%_,()]/g, '').trim()
      if (sanitized) {
        query = query.or(`nome.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
      }
    }

    // Filtrar por role
    if (role) {
      if (role === 'client') {
        query = query.or('role.eq.client,role.is.null')
      } else if (role === 'not_admin') {
        // Todos que não são admin/super_admin (para adicionar como profissional)
        query = query.or('role.eq.client,role.eq.nutritionist,role.eq.trainer,role.is.null')
      } else {
        query = query.eq('role', role)
      }
    }

    // Filtrar usuários que não estão na tabela de profissionais
    const excludeProfessionals = searchParams.get('excludeProfessionals')
    if (excludeProfessionals === 'true') {
      const { data: existingProfessionals } = await supabaseAdmin
        .from('fitness_professionals')
        .select('user_id')

      const professionalUserIds = existingProfessionals?.map(p => p.user_id) || []
      if (professionalUserIds.length > 0) {
        query = query.not('id', 'in', `(${professionalUserIds.join(',')})`)
      }
    }

    // Ordenar e paginar
    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }

    // Buscar atribuições de profissionais para cada cliente
    const userIds = users?.map(u => u.id) || []

    const { data: assignments } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select(`
        client_id,
        professional_id,
        fitness_professionals!inner(
          id,
          type,
          user_id,
          fitness_profiles:user_id(nome)
        )
      `)
      .in('client_id', userIds)
      .eq('is_active', true)

    // Mapear atribuições por cliente
    const assignmentsByClient: Record<string, Array<{type: string; name: string}>> = {}
    assignments?.forEach(a => {
      if (!assignmentsByClient[a.client_id]) {
        assignmentsByClient[a.client_id] = []
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prof = a.fitness_professionals as any
      assignmentsByClient[a.client_id].push({
        type: prof.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (prof.fitness_profiles as any)?.nome || 'Profissional'
      })
    })

    // Adicionar atribuições aos usuários
    const usersWithAssignments = users?.map(u => ({
      ...u,
      professionals: assignmentsByClient[u.id] || []
    }))

    return NextResponse.json({
      success: true,
      users: usersWithAssignments,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário
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

    // Verificar se é admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, nome, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar role
    const validRoles = ['super_admin', 'admin', 'nutritionist', 'trainer', 'coach', 'client']
    const userRole = role || 'client'
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Role inválido' },
        { status: 400 }
      )
    }

    // Apenas super_admin pode criar outros admins
    if (['super_admin', 'admin'].includes(userRole) && profile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas super_admin pode criar admins' },
        { status: 403 }
      )
    }

    // Usar admin client para criar usuário
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

    // Criar usuário no auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) {
      console.error('Erro ao criar usuário:', createError)
      if (createError.message.includes('already been registered')) {
        return NextResponse.json(
          { success: false, error: 'Este email já está cadastrado' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    // Criar perfil do usuário usando função que bypassa RLS
    const userName = nome || email.split('@')[0]

    const { data: profileResult, error: rpcError } = await supabaseAdmin
      .rpc('admin_create_profile', {
        p_user_id: newUser.user.id,
        p_email: email,
        p_nome: userName,
        p_role: userRole
      })

    if (rpcError) {
      console.error('Erro ao criar perfil (RPC):', rpcError)
      // Tenta deletar o usuário criado se falhar ao criar perfil
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { success: false, error: `Erro ao criar perfil: ${rpcError.message}` },
        { status: 500 }
      )
    }

    // Verificar se a função retornou sucesso
    if (profileResult && !profileResult.success) {
      console.error('Erro ao criar perfil (função):', profileResult.error)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json(
        { success: false, error: `Erro ao criar perfil: ${profileResult.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.user.id,
        email,
        nome: userName,
        role: userRole
      }
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar role de um usuário
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role: newRole } = body

    if (!userId || !newRole) {
      return NextResponse.json(
        { success: false, error: 'userId e role são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar role
    const validRoles = ['super_admin', 'admin', 'nutritionist', 'trainer', 'coach', 'client']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Role inválido' },
        { status: 400 }
      )
    }

    // Apenas super_admin pode criar outros admins
    if (['super_admin', 'admin'].includes(newRole) && profile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas super_admin pode criar admins' },
        { status: 403 }
      )
    }

    // Usar admin client
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

    const { error: updateError } = await supabaseAdmin
      .from('fitness_profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (updateError) {
      console.error('Erro ao atualizar role:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar ou inativar um usuário
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action') || 'deactivate' // 'deactivate', 'activate', 'hard_delete'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Não permitir ações em si mesmo
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Você não pode modificar sua própria conta' },
        { status: 400 }
      )
    }

    // Usar admin client
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

    // Verificar se o usuário a ser modificado existe e seu role
    const { data: targetUser } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role, nome, email, is_active')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Apenas super_admin pode modificar outros admins
    if (['super_admin', 'admin'].includes(targetUser.role) && profile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas super_admin pode modificar administradores' },
        { status: 403 }
      )
    }

    if (action === 'hard_delete') {
      // Hard delete - remove permanentemente
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error('Erro ao deletar usuário:', deleteError)
        return NextResponse.json(
          { success: false, error: 'Erro ao deletar usuário' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Usuário ${targetUser.nome || targetUser.email} excluído permanentemente`
      })

    } else if (action === 'activate') {
      // Reativar usuário
      const { error: updateError } = await supabaseAdmin
        .from('fitness_profiles')
        .update({
          is_active: true,
          deactivated_at: null
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Erro ao ativar usuário:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao ativar usuário' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Usuário ${targetUser.nome || targetUser.email} reativado com sucesso`
      })

    } else {
      // Soft delete - inativar usuário (padrão)
      const { error: updateError } = await supabaseAdmin
        .from('fitness_profiles')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Erro ao inativar usuário:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao inativar usuário' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Usuário ${targetUser.nome || targetUser.email} inativado com sucesso`
      })
    }

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
