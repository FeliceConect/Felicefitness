import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Listar todas as atribuições
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
    const professionalId = searchParams.get('professionalId') || ''
    const clientId = searchParams.get('clientId') || ''
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

    // Buscar atribuições
    let query = supabaseAdmin
      .from('fitness_client_assignments')
      .select('*')

    // Filtros
    if (professionalId) {
      query = query.eq('professional_id', professionalId)
    }

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (active !== null && active !== '') {
      query = query.eq('is_active', active === 'true')
    }

    const { data: assignments, error } = await query
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar atribuições:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar atribuições' },
        { status: 500 }
      )
    }

    // Coletar IDs únicos
    const clientIds = Array.from(new Set(assignments?.map(a => a.client_id) || []))
    const professionalIds = Array.from(new Set(assignments?.map(a => a.professional_id) || []))
    const assignedByIds = Array.from(new Set(assignments?.filter(a => a.assigned_by).map(a => a.assigned_by) || []))

    // Buscar perfis de clientes
    const clientsMap: Record<string, { id: string; nome: string; email: string; avatar_url?: string }> = {}
    if (clientIds.length > 0) {
      const { data: clients } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email, avatar_url')
        .in('id', clientIds)

      clients?.forEach(c => {
        clientsMap[c.id] = c
      })
    }

    // Buscar profissionais
    const professionalsMap: Record<string, { id: string; type: string; user_id: string; display_name: string | null; avatar_url: string | null }> = {}
    const professionalUserIds: string[] = []
    if (professionalIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, type, user_id, display_name, avatar_url')
        .in('id', professionalIds)

      profs?.forEach(p => {
        professionalsMap[p.id] = p
        professionalUserIds.push(p.user_id)
      })
    }

    // Buscar perfis dos profissionais
    const professionalProfilesMap: Record<string, { nome: string; email: string; avatar_url?: string }> = {}
    if (professionalUserIds.length > 0) {
      const { data: profProfiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email, avatar_url')
        .in('id', professionalUserIds)

      profProfiles?.forEach(p => {
        professionalProfilesMap[p.id] = { nome: p.nome, email: p.email, avatar_url: p.avatar_url }
      })
    }

    // Buscar quem atribuiu
    const assignedByMap: Record<string, { nome: string; email: string }> = {}
    if (assignedByIds.length > 0) {
      const { data: assigners } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email')
        .in('id', assignedByIds)

      assigners?.forEach(a => {
        assignedByMap[a.id] = { nome: a.nome, email: a.email }
      })
    }

    // Montar resposta com dados relacionados
    const assignmentsWithData = assignments?.map(a => {
      const prof = professionalsMap[a.professional_id]
      return {
        ...a,
        client: clientsMap[a.client_id] || { id: a.client_id, nome: 'Cliente', email: '' },
        professional: prof ? {
          ...prof,
          fitness_profiles: professionalProfilesMap[prof.user_id] || { nome: 'Profissional', email: '' }
        } : null,
        assigned_by_user: a.assigned_by ? assignedByMap[a.assigned_by] : null
      }
    })

    return NextResponse.json({
      success: true,
      assignments: assignmentsWithData || []
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar uma nova atribuição
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
    const { clientId, professionalId, notes } = body

    if (!clientId || !professionalId) {
      return NextResponse.json(
        { success: false, error: 'clientId e professionalId são obrigatórios' },
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

    // Verificar se atribuição já existe
    const { data: existing } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id, is_active')
      .eq('client_id', clientId)
      .eq('professional_id', professionalId)
      .single()

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { success: false, error: 'Este cliente já está atribuído a este profissional' },
          { status: 400 }
        )
      } else {
        // Reativar atribuição existente
        const { error: updateError } = await supabaseAdmin
          .from('fitness_client_assignments')
          .update({ is_active: true, notes: notes || null })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Erro ao reativar atribuição:', updateError)
          return NextResponse.json(
            { success: false, error: 'Erro ao reativar atribuição' },
            { status: 500 }
          )
        }

        // Criar conversa automaticamente ao reativar
        try {
          await supabaseAdmin.rpc('get_or_create_conversation', {
            p_client_id: clientId,
            p_professional_id: professionalId
          })
        } catch (convError) {
          console.error('Erro ao criar conversa na reativação:', convError)
        }

        return NextResponse.json({
          success: true,
          message: 'Atribuição reativada com sucesso'
        })
      }
    }

    // Verificar limite de clientes do profissional
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('max_clients')
      .eq('id', professionalId)
      .single()

    const { count: currentClients } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('is_active', true)

    if (professional && currentClients !== null && currentClients >= professional.max_clients) {
      return NextResponse.json(
        { success: false, error: `Este profissional já atingiu o limite de ${professional.max_clients} clientes` },
        { status: 400 }
      )
    }

    // Criar atribuição
    const { data: newAssignment, error: insertError } = await supabaseAdmin
      .from('fitness_client_assignments')
      .insert({
        client_id: clientId,
        professional_id: professionalId,
        assigned_by: user.id,
        notes: notes || null,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar atribuição:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar atribuição' },
        { status: 500 }
      )
    }

    // Criar conversa automaticamente entre cliente e profissional
    try {
      const { data: conversationResult, error: conversationError } = await supabaseAdmin
        .rpc('get_or_create_conversation', {
          p_client_id: clientId,
          p_professional_id: professionalId
        })

      if (conversationError) {
        console.error('Erro ao criar conversa:', conversationError)
        // Não falhar a atribuição por causa da conversa
      } else {
        console.log('Conversa criada/obtida:', conversationResult)
      }
    } catch (convError) {
      console.error('Erro ao criar conversa (catch):', convError)
    }

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
      message: 'Cliente atribuído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar atribuição (ativar/desativar)
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
    const { assignmentId, isActive, notes } = body

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: 'assignmentId é obrigatório' },
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

    const updateData: Record<string, unknown> = {}
    if (isActive !== undefined) updateData.is_active = isActive
    if (notes !== undefined) updateData.notes = notes

    const { error: updateError } = await supabaseAdmin
      .from('fitness_client_assignments')
      .update(updateData)
      .eq('id', assignmentId)

    if (updateError) {
      console.error('Erro ao atualizar atribuição:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar atribuição' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Atribuição atualizada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover atribuição
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
    const assignmentId = searchParams.get('id')

    if (!assignmentId) {
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

    const { error: deleteError } = await supabaseAdmin
      .from('fitness_client_assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error('Erro ao deletar atribuição:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar atribuição' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Atribuição removida com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
