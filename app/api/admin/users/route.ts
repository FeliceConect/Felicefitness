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
        // Super_admins veem clients + super_admins (para autogestão de bioimpedância/fotos/medidas)
        // Secretárias/admins veem apenas clients
        if (profile.role === 'super_admin') {
          query = query.or('role.eq.client,role.eq.super_admin,role.is.null')
        } else {
          query = query.or('role.eq.client,role.is.null')
        }
      } else if (role === 'assignable') {
        // Clientes + superadmins que também participam do programa
        query = query.or('role.eq.client,role.eq.super_admin,role.is.null')
      } else if (role === 'not_admin') {
        // Todos que não são admin/super_admin (para adicionar como profissional)
        query = query.or('role.eq.client,role.eq.nutritionist,role.eq.trainer,role.eq.coach,role.eq.physiotherapist,role.is.null')
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
      currentUserRole: profile.role,
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
    const { email, password, nome, role, admin_type } = body

    // Secretária só pode criar usuários com role 'client'
    if (profile.role === 'admin' && profile.admin_type === 'secretary' && role && role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Secretaria só pode cadastrar pacientes' },
        { status: 403 }
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar role
    const validRoles = ['super_admin', 'admin', 'nutritionist', 'trainer', 'coach', 'physiotherapist', 'client']
    const userRole = role || 'client'
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Role inválido' },
        { status: 400 }
      )
    }

    // Validar admin_type (somente para role 'admin')
    const validAdminTypes = ['secretary', 'support', null]
    const adminType = userRole === 'admin' ? (admin_type || null) : null
    if (adminType && !validAdminTypes.includes(adminType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de admin inválido' },
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

    // Se admin com admin_type, salvar o admin_type no perfil
    if (adminType) {
      await supabaseAdmin
        .from('fitness_profiles')
        .update({ admin_type: adminType })
        .eq('id', newUser.user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.user.id,
        email,
        nome: userName,
        role: userRole,
        admin_type: adminType
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
      .select('role, admin_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Secretária não pode alterar roles
    if (profile.role === 'admin' && profile.admin_type === 'secretary') {
      return NextResponse.json(
        { success: false, error: 'Secretaria não pode alterar papéis' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role: newRole, admin_type } = body

    if (!userId || !newRole) {
      return NextResponse.json(
        { success: false, error: 'userId e role são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar role
    const validRoles = ['super_admin', 'admin', 'nutritionist', 'trainer', 'coach', 'physiotherapist', 'client']
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

    // Se mudar para admin, salvar admin_type; se sair de admin, limpar
    const updateData: Record<string, unknown> = { role: newRole }
    if (newRole === 'admin') {
      updateData.admin_type = admin_type || null
    } else {
      updateData.admin_type = null
    }

    // Lê o role atual antes de atualizar — precisamos saber se é uma
    // transição que tira o usuário do programa de pacientes.
    // Quem participa do ranking: client + super_admin (líderes também competem).
    // Quem NÃO participa: coach, trainer, nutritionist, physiotherapist, admin.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetCurrent } = await (supabaseAdmin as any)
      .from('fitness_profiles')
      .select('role')
      .eq('id', userId)
      .single()
    const PARTICIPATING_ROLES = new Set(['client', 'super_admin', null, undefined])
    const wasParticipating = PARTICIPATING_ROLES.has(targetCurrent?.role || null)
    const becomesNonParticipating = !PARTICIPATING_ROLES.has(newRole)

    const { error: updateError } = await supabaseAdmin
      .from('fitness_profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('Erro ao atualizar role:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar role' },
        { status: 500 }
      )
    }

    // Quando o usuário deixa de ser participante do programa (paciente ou
    // super_admin) e vira profissional/admin, sai automaticamente do
    // leaderboard e desafios. Líderes (super_admin) continuam competindo.
    if (wasParticipating && becomesNonParticipating) {
      await supabaseAdmin
        .from('fitness_ranking_participants')
        .delete()
        .eq('user_id', userId)
      await supabaseAdmin
        .from('fitness_challenge_participants')
        .delete()
        .eq('user_id', userId)
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
      .select('role, admin_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Secretária não pode deletar/inativar/reativar usuários
    if (profile.role === 'admin' && profile.admin_type === 'secretary') {
      return NextResponse.json(
        { success: false, error: 'Secretaria não pode remover ou inativar usuários' },
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

    // Se não tem profile, criar um profile desativado ou verificar auth
    if (!targetUser) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (!authUser?.user) {
        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      if (action === 'deactivate') {
        // Criar profile desativado para users que só existem no auth
        await supabaseAdmin.from('fitness_profiles').upsert({
          id: userId,
          nome: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'Sem nome',
          email: authUser.user.email || '',
          role: 'client',
          is_active: false,
          deactivated_at: new Date().toISOString()
        })

        // Banir no auth para impedir login
        await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876600h' })

        return NextResponse.json({
          success: true,
          message: `Usuário ${authUser.user.email} desativado com sucesso`
        })
      }

      if (action === 'hard_delete') {
        // Profile já foi deletado (tentativa anterior parcial) — deletar do auth
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) {
          console.error('Erro ao deletar usuário órfão do auth:', deleteError)
          return NextResponse.json(
            { success: false, error: `Erro ao deletar: ${deleteError.message}` },
            { status: 500 }
          )
        }
        return NextResponse.json({
          success: true,
          message: `Usuário ${authUser.user.email} excluído permanentemente`
        })
      }

      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado no sistema' },
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

    // Hard delete só para super_admin
    if (action === 'hard_delete' && profile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas super_admin pode excluir permanentemente' },
        { status: 403 }
      )
    }

    if (action === 'hard_delete') {
      // Hard delete - remove permanentemente
      // Estratégia: limpar TUDO que referencia este user (auth.users ou fitness_profiles)
      // antes de deletar o profile e o auth user.

      // Helper para executar query ignorando erros (tabela pode não existir)
      const safeDelete = async (table: string, column: string) => {
        try { await supabaseAdmin.from(table).delete().eq(column, userId) } catch { /* ignorar */ }
      }
      const safeNullify = async (table: string, column: string) => {
        try { await supabaseAdmin.from(table).update({ [column]: null }).eq(column, userId) } catch { /* ignorar */ }
      }

      // 1. Deletar profissional se existir (e seus appointments/notes vinculados)
      try {
        const { data: prof } = await supabaseAdmin
          .from('fitness_professionals')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        if (prof) {
          await safeDelete('fitness_appointments', 'professional_id')
          await safeDelete('fitness_professional_notes', 'professional_id')
          await safeDelete('fitness_client_assignments', 'professional_id')
          await supabaseAdmin.from('fitness_professionals').delete().eq('id', prof.id)
        }
      } catch { /* ignorar */ }

      // 2. Deletar appointments onde é paciente ou criador
      await safeDelete('fitness_appointments', 'patient_id')
      await safeNullify('fitness_appointments', 'created_by')

      // 3. Nullificar referências em tabelas que usam SET NULL ou sem CASCADE
      await safeNullify('fitness_medical_records', 'updated_by')
      await safeNullify('fitness_medical_records', 'assigned_super_admin_id')
      await safeNullify('fitness_medical_consultations', 'created_by')
      await safeNullify('fitness_rankings', 'created_by')
      await safeNullify('fitness_point_transactions', 'awarded_by')
      await safeNullify('fitness_broadcast_messages', 'sender_id')

      // 4. Deletar community posts (reactions/comments cascade via post_id)
      await safeDelete('fitness_community_reactions', 'user_id')
      await safeDelete('fitness_community_comments', 'user_id')
      await safeDelete('fitness_community_posts', 'user_id')

      // 5. Deletar todas as tabelas com user_id referenciando auth.users ou fitness_profiles
      const tablesToClean = [
        'fitness_meal_items',
        'fitness_meal_plan_adherence',
        'fitness_water_logs',
        'fitness_meals',
        'fitness_workouts',
        'fitness_user_foods',
        'fitness_push_subscriptions',
        'fitness_notifications',
        'fitness_activities',
        'fitness_sleep_logs',
        'fitness_body_composition',
        'fitness_client_assignments',
        'fitness_professional_notes',
        'fitness_chat_messages',
        'fitness_chat_conversations',
        'fitness_ranking_participants',
        'fitness_point_transactions',
        'fitness_challenge_participants',
        'fitness_form_responses',
        'fitness_form_assignments',
        'fitness_broadcast_recipients',
        'fitness_medical_consultations',
        'fitness_medical_records',
        'fitness_onboarding',
        'fitness_terms_acceptance',
        'user_stats',
        'user_achievements',
        'user_insights',
        'user_health_reports',
      ]

      for (const table of tablesToClean) {
        await safeDelete(table, 'user_id')
      }

      // 6. Tabelas com client_id em vez de user_id
      await safeDelete('fitness_form_assignments', 'client_id')
      await safeDelete('fitness_form_responses', 'client_id')
      await safeDelete('fitness_chat_conversations', 'client_id')
      await safeDelete('fitness_client_assignments', 'client_id')
      await safeDelete('fitness_nutrition_plans', 'client_id')
      await safeDelete('fitness_training_programs', 'client_id')
      await safeDelete('fitness_meal_plan_adherence', 'client_id')

      // 4. Deletar profile
      try {
        await supabaseAdmin.from('fitness_profiles').delete().eq('id', userId)
      } catch {
        // Ignorar se falhar
      }

      // 5. Deletar do auth
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error('Erro ao deletar usuário do auth:', deleteError)
        return NextResponse.json(
          { success: false, error: `Erro ao deletar usuário: ${deleteError.message}` },
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

      // Banir no auth para impedir login
      await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876600h' })

      return NextResponse.json({
        success: true,
        message: `Usuário ${targetUser.nome || targetUser.email} desativado com sucesso`
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
