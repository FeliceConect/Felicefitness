import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Categorias válidas no banco de dados
type ValidCategory = 'proteina' | 'carboidrato' | 'vegetal' | 'fruta' | 'laticinio' | 'gordura' | 'suplemento' | 'bebida' | 'outros'

// Normalizar categoria da IA para o valor válido do banco
function normalizeCategory(cat: string): ValidCategory {
  const normalized = cat.toLowerCase().trim()

  // Mapeamentos diretos
  const mappings: Record<string, ValidCategory> = {
    'proteina': 'proteina',
    'proteína': 'proteina',
    'proteinas': 'proteina',
    'proteínas': 'proteina',
    'carboidrato': 'carboidrato',
    'carboidratos': 'carboidrato',
    'carb': 'carboidrato',
    'carbs': 'carboidrato',
    'vegetal': 'vegetal',
    'vegetais': 'vegetal',
    'legume': 'vegetal',
    'legumes': 'vegetal',
    'verdura': 'vegetal',
    'verduras': 'vegetal',
    'salada': 'vegetal',
    'fruta': 'fruta',
    'frutas': 'fruta',
    'laticinio': 'laticinio',
    'laticínio': 'laticinio',
    'laticinios': 'laticinio',
    'laticínios': 'laticinio',
    'gordura': 'gordura',
    'gorduras': 'gordura',
    'lipidio': 'gordura',
    'lipídio': 'gordura',
    'suplemento': 'suplemento',
    'suplementos': 'suplemento',
    'bebida': 'bebida',
    'bebidas': 'bebida',
    'drink': 'bebida',
    'drinks': 'bebida',
    'outros': 'outros',
    'outro': 'outros',
    'other': 'outros'
  }

  return mappings[normalized] || 'outros'
}

// POST - Salvar novo alimento do usuário
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

    const body = await request.json()
    const {
      nome,
      categoria,
      marca,
      porcao_padrao,
      unidade,
      calorias,
      proteinas,
      carboidratos,
      gorduras,
      fibras,
      porcoes_comuns
    } = body

    // Validação básica
    if (!nome || !categoria || !porcao_padrao || !unidade) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos. Nome, categoria, porção padrão e unidade são obrigatórios.' },
        { status: 400 }
      )
    }

    // Normalizar categoria para valor válido
    const categoriaNormalizada = normalizeCategory(categoria)

    // Log para debug
    console.log('=== Salvando alimento ===')
    console.log('Dados recebidos:', { nome, categoria, porcao_padrao, unidade, calorias, proteinas, carboidratos, gorduras })
    console.log('Categoria normalizada:', categoriaNormalizada)

    // Preparar dados para inserção
    const insertData = {
      user_id: user.id,
      nome,
      categoria: categoriaNormalizada,
      marca: marca || null,
      porcao_padrao: Math.round(porcao_padrao),
      unidade,
      calorias: Math.round(calorias || 0),
      proteinas: Math.round((proteinas || 0) * 10) / 10,
      carboidratos: Math.round((carboidratos || 0) * 10) / 10,
      gorduras: Math.round((gorduras || 0) * 10) / 10,
      fibras: fibras ? Math.round(fibras * 10) / 10 : null,
      porcoes_comuns: porcoes_comuns || null,
      source: 'ai_analysis',
      is_active: true
    }

    console.log('Dados para inserção:', insertData)

    // Usar admin client com service role key para bypass RLS
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

    // Inserir no banco de dados
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('fitness_user_foods')
      .insert(insertData)
      .select()

    console.log('Resultado insert - data:', insertedData)
    console.log('Resultado insert - error:', insertError)

    // Se não houve erro mas data é array vazio, provavelmente RLS bloqueou
    const data = insertedData?.[0] || null
    const error = insertError

    if (error) {
      console.error('=== ERRO SUPABASE ===')
      console.error('Error completo:', JSON.stringify(error, null, 2))
      console.error('Código do erro:', error.code)
      console.error('Mensagem do erro:', error.message)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)

      // Verificar se é erro de tabela não existente
      if (error.code === '42P01') {
        return NextResponse.json(
          { success: false, error: 'Tabela de alimentos do usuário não encontrada. Execute a migração do banco de dados.' },
          { status: 500 }
        )
      }

      // Verificar se é erro de RLS/permissão
      if (error.code === '42501' || error.message?.includes('policy')) {
        return NextResponse.json(
          { success: false, error: 'Erro de permissão. Verifique se você está logado.' },
          { status: 403 }
        )
      }

      // Construir mensagem de erro mais detalhada
      const errorMsg = error.message || error.details || error.hint || `Erro código: ${error.code || 'desconhecido'}`
      return NextResponse.json(
        { success: false, error: `Erro ao salvar: ${errorMsg}` },
        { status: 500 }
      )
    }

    // Verificar se data está vazio (pode ser RLS bloqueando silenciosamente)
    if (!data) {
      console.error('=== INSERT RETORNOU NULL ===')
      console.error('Possível bloqueio por RLS - o usuário pode não ter permissão')
      return NextResponse.json(
        { success: false, error: 'Não foi possível salvar. Verifique se você está logado.' },
        { status: 403 }
      )
    }

    console.log('Alimento salvo:', data)

    return NextResponse.json({
      success: true,
      food: data
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar alimentos do usuário
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

    // Buscar alimentos do usuário
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('fitness_user_foods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar alimentos:', error)

      // Se tabela não existe, retornar array vazio
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          foods: []
        })
      }

      return NextResponse.json(
        { success: false, error: 'Erro ao buscar alimentos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      foods: data || []
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar alimento do usuário
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

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do alimento não fornecido' },
        { status: 400 }
      )
    }

    // Campos permitidos para atualização
    const allowedFields = [
      'nome', 'categoria', 'marca', 'porcao_padrao', 'unidade',
      'calorias', 'proteinas', 'carboidratos', 'gorduras', 'fibras',
      'porcoes_comuns', 'is_favorite'
    ]

    // Filtrar apenas campos permitidos
    const filteredData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updateData && updateData[key] !== undefined) {
        // Normalizar categoria se for atualizada
        if (key === 'categoria') {
          filteredData[key] = normalizeCategory(updateData[key])
        } else {
          filteredData[key] = updateData[key]
        }
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo válido para atualizar' },
        { status: 400 }
      )
    }

    // Usar admin client para bypass RLS
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

    // Atualizar no banco
    const { data, error } = await supabaseAdmin
      .from('fitness_user_foods')
      .update(filteredData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('Erro ao atualizar alimento:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar alimento' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Alimento não encontrado ou sem permissão' },
        { status: 404 }
      )
    }

    console.log('Alimento atualizado:', data[0])

    return NextResponse.json({
      success: true,
      food: data[0]
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover alimento do usuário (soft delete)
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

    const { searchParams } = new URL(request.url)
    const foodId = searchParams.get('id')

    if (!foodId) {
      return NextResponse.json(
        { success: false, error: 'ID do alimento não fornecido' },
        { status: 400 }
      )
    }

    // Soft delete - marcar como inativo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('fitness_user_foods')
      .update({ is_active: false })
      .eq('id', foodId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao remover alimento:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao remover alimento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Alimento removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
