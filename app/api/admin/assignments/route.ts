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

    // Buscar atribuições com dados relacionados
    let query = supabaseAdmin
      .from('fitness_client_assignments')
      .select(`
        *,
        client:client_id(id, nome, email, avatar_url),
        professional:professional_id(
          id,
          type,
          user_id,
          fitness_profiles:user_id(nome, email, avatar_url)
        ),
        assigned_by_user:assigned_by(nome, email)
      `)

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

    return NextResponse.json({
      success: true,
      assignments: assignments || []
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
