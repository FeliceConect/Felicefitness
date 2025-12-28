import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Listar todos os profissionais
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
    const type = searchParams.get('type') || ''
    const active = searchParams.get('active')

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

    // Buscar profissionais
    let query = supabaseAdmin
      .from('fitness_professionals')
      .select('*')

    // Filtrar por tipo
    if (type) {
      query = query.eq('type', type)
    }

    // Filtrar por status
    if (active !== null && active !== '') {
      query = query.eq('is_active', active === 'true')
    }

    const { data: professionals, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar profissionais' },
        { status: 500 }
      )
    }

    // Buscar perfis dos profissionais separadamente
    const userIds = professionals?.map(p => p.user_id) || []
    const profilesMap: Record<string, { nome: string; email: string }> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email')
        .in('id', userIds)

      profiles?.forEach(p => {
        profilesMap[p.id] = { nome: p.nome, email: p.email }
      })
    }

    // Adicionar dados do perfil aos profissionais
    const professionalsWithProfiles = professionals?.map(p => ({
      ...p,
      fitness_profiles: profilesMap[p.user_id] || { nome: 'Sem nome', email: '' }
    }))

    // Buscar contagem de clientes para cada profissional
    const professionalIds = professionalsWithProfiles?.map(p => p.id) || []

    const { data: clientCounts } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('professional_id')
      .in('professional_id', professionalIds)
      .eq('is_active', true)

    // Mapear contagens
    const countByProfessional: Record<string, number> = {}
    clientCounts?.forEach(c => {
      countByProfessional[c.professional_id] = (countByProfessional[c.professional_id] || 0) + 1
    })

    // Adicionar contagem aos profissionais
    const professionalsWithCounts = professionalsWithProfiles?.map(p => ({
      ...p,
      clientCount: countByProfessional[p.id] || 0
    }))

    return NextResponse.json({
      success: true,
      professionals: professionalsWithCounts
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar um novo profissional
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
    const { userId, type, registration, specialty, bio, maxClients, displayName, avatarUrl } = body

    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: 'userId e type são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!['nutritionist', 'trainer'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use "nutritionist" ou "trainer"' },
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

    // Verificar se usuário já é profissional
    const { data: existing } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Este usuário já está cadastrado como profissional' },
        { status: 400 }
      )
    }

    // Criar profissional
    console.log('Criando profissional com dados:', {
      user_id: userId,
      type,
      registration: registration || null,
      specialty: specialty || null,
      bio: bio || null,
      max_clients: maxClients || 30,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      is_active: true
    })

    const { data: newProfessional, error: insertError } = await supabaseAdmin
      .from('fitness_professionals')
      .insert({
        user_id: userId,
        type,
        registration: registration || null,
        specialty: specialty || null,
        bio: bio || null,
        max_clients: maxClients || 30,
        display_name: displayName || null,
        avatar_url: avatarUrl || null,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar profissional:', insertError)
      return NextResponse.json(
        { success: false, error: `Erro ao criar profissional: ${insertError.message}` },
        { status: 500 }
      )
    }

    // Atualizar role do usuário
    const roleToSet = type === 'nutritionist' ? 'nutritionist' : 'trainer'
    await supabaseAdmin
      .from('fitness_profiles')
      .update({ role: roleToSet })
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      professional: newProfessional,
      message: 'Profissional criado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição POST /api/admin/professionals:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: `Erro interno do servidor: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar profissional
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
    const { professionalId, registration, specialty, bio, maxClients, isActive, displayName, avatarUrl } = body

    if (!professionalId) {
      return NextResponse.json(
        { success: false, error: 'professionalId é obrigatório' },
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

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}
    if (registration !== undefined) updateData.registration = registration
    if (specialty !== undefined) updateData.specialty = specialty
    if (bio !== undefined) updateData.bio = bio
    if (maxClients !== undefined) updateData.max_clients = maxClients
    if (isActive !== undefined) updateData.is_active = isActive
    if (displayName !== undefined) updateData.display_name = displayName
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl

    const { error: updateError } = await supabaseAdmin
      .from('fitness_professionals')
      .update(updateData)
      .eq('id', professionalId)

    if (updateError) {
      console.error('Erro ao atualizar profissional:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar profissional' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profissional atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover profissional
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
    const professionalId = searchParams.get('id')

    if (!professionalId) {
      return NextResponse.json(
        { success: false, error: 'id é obrigatório' },
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

    // Buscar user_id do profissional antes de deletar
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('user_id')
      .eq('id', professionalId)
      .single()

    // Deletar profissional (as atribuições serão deletadas em cascata)
    const { error: deleteError } = await supabaseAdmin
      .from('fitness_professionals')
      .delete()
      .eq('id', professionalId)

    if (deleteError) {
      console.error('Erro ao deletar profissional:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar profissional' },
        { status: 500 }
      )
    }

    // Atualizar role do usuário para client
    if (professional?.user_id) {
      await supabaseAdmin
        .from('fitness_profiles')
        .update({ role: 'client' })
        .eq('id', professional.user_id)
    }

    return NextResponse.json({
      success: true,
      message: 'Profissional removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
