import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product'

interface OpenFoodFactsProduct {
  product_name?: string
  brands?: string
  categories_tags?: string[]
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    sodium_100g?: number
    'nova-group'?: number
  }
  serving_size?: string
  serving_quantity?: number
  image_url?: string
  code?: string
}

function mapOpenFoodFactsCategory(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return 'outros'

  const tagStr = tags.join(' ').toLowerCase()

  if (tagStr.includes('meat') || tagStr.includes('carne') || tagStr.includes('fish') || tagStr.includes('peixe') || tagStr.includes('chicken') || tagStr.includes('frango'))
    return 'proteina'
  if (tagStr.includes('dairy') || tagStr.includes('milk') || tagStr.includes('leite') || tagStr.includes('cheese') || tagStr.includes('queijo') || tagStr.includes('yogurt') || tagStr.includes('iogurte'))
    return 'laticinio'
  if (tagStr.includes('cereal') || tagStr.includes('bread') || tagStr.includes('pao') || tagStr.includes('pasta') || tagStr.includes('rice') || tagStr.includes('arroz'))
    return 'carboidrato'
  if (tagStr.includes('fruit') || tagStr.includes('fruta'))
    return 'fruta'
  if (tagStr.includes('vegetable') || tagStr.includes('vegetal') || tagStr.includes('legume'))
    return 'vegetal'
  if (tagStr.includes('oil') || tagStr.includes('oleo') || tagStr.includes('fat') || tagStr.includes('butter') || tagStr.includes('manteiga'))
    return 'gordura'
  if (tagStr.includes('beverage') || tagStr.includes('drink') || tagStr.includes('bebida') || tagStr.includes('water') || tagStr.includes('agua'))
    return 'bebida'
  if (tagStr.includes('juice') || tagStr.includes('suco'))
    return 'suco'
  if (tagStr.includes('sweet') || tagStr.includes('chocolate') || tagStr.includes('candy') || tagStr.includes('doce') || tagStr.includes('cake') || tagStr.includes('bolo'))
    return 'sobremesa'
  if (tagStr.includes('sauce') || tagStr.includes('molho') || tagStr.includes('spice') || tagStr.includes('condiment'))
    return 'condimento'
  if (tagStr.includes('supplement') || tagStr.includes('suplemento') || tagStr.includes('protein-powder'))
    return 'suplemento'
  if (tagStr.includes('meal') || tagStr.includes('prepared') || tagStr.includes('pizza'))
    return 'prato_pronto'

  return 'outros'
}

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/**
 * GET /api/foods/barcode?code=7891234567890
 * Busca alimento por código de barras:
 * 1. Primeiro verifica cache local (fitness_global_foods)
 * 2. Se não encontrar, busca na API Open Food Facts
 * 3. Se encontrar no OFF, salva no cache local
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const code = new URL(request.url).searchParams.get('code')?.trim()

    if (!code) {
      return NextResponse.json({ error: 'Código de barras obrigatório' }, { status: 400 })
    }

    // 1. Verificar cache local
    const { data: cached } = await (supabase as SupabaseAny)
      .from('fitness_global_foods')
      .select('*')
      .eq('codigo_barras', code)
      .eq('is_active', true)
      .single()

    if (cached) {
      return NextResponse.json({
        success: true,
        food: {
          id: cached.id,
          nome: cached.nome,
          categoria: cached.categoria,
          marca: null,
          porcao_padrao: cached.porcao_padrao,
          unidade: cached.unidade,
          calorias: Number(cached.calorias),
          proteinas: Number(cached.proteinas),
          carboidratos: Number(cached.carboidratos),
          gorduras: Number(cached.gorduras),
          fibras: cached.fibras ? Number(cached.fibras) : null,
          sodio: cached.sodio ? Number(cached.sodio) : null,
          porcoes_comuns: cached.porcoes_comuns,
          source: 'openfoodfacts',
          is_user_created: false,
        },
        cached: true,
      })
    }

    // 2. Buscar no Open Food Facts
    const offResponse = await fetch(
      `${OPEN_FOOD_FACTS_API}/${code}.json`,
      {
        headers: {
          'User-Agent': 'ComplexoWellness/1.0 (contato@feliceconect.com.br)',
        },
      }
    )

    if (!offResponse.ok) {
      return NextResponse.json(
        { error: 'Produto não encontrado', code },
        { status: 404 }
      )
    }

    const offData = await offResponse.json()

    if (offData.status !== 1 || !offData.product) {
      return NextResponse.json(
        { error: 'Produto não encontrado no Open Food Facts', code },
        { status: 404 }
      )
    }

    const product: OpenFoodFactsProduct = offData.product
    const nutriments = product.nutriments || {}

    const nome = [product.product_name, product.brands]
      .filter(Boolean)
      .join(' - ')
      .trim() || `Produto ${code}`

    const food = {
      nome,
      nome_busca: removeAccents(nome),
      categoria: mapOpenFoodFactsCategory(product.categories_tags),
      source: 'openfoodfacts' as const,
      source_id: code,
      codigo_barras: code,
      porcao_padrao: 100,
      unidade: 'g' as const,
      calorias: Math.round((nutriments['energy-kcal_100g'] || 0) * 100) / 100,
      proteinas: Math.round((nutriments.proteins_100g || 0) * 100) / 100,
      carboidratos: Math.round((nutriments.carbohydrates_100g || 0) * 100) / 100,
      gorduras: Math.round((nutriments.fat_100g || 0) * 100) / 100,
      fibras: nutriments.fiber_100g ? Math.round(nutriments.fiber_100g * 100) / 100 : null,
      sodio: nutriments.sodium_100g ? Math.round(nutriments.sodium_100g * 1000 * 100) / 100 : null, // Convert g to mg
    }

    // 3. Salvar no cache local (via admin client para bypass RLS)
    try {
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await adminClient
        .from('fitness_global_foods')
        .insert(food)
    } catch (cacheError) {
      console.error('Erro ao salvar cache do OFF:', cacheError)
      // Não falha a request se o cache falhar
    }

    return NextResponse.json({
      success: true,
      food: {
        ...food,
        id: `off-${code}`,
        marca: product.brands || null,
        porcoes_comuns: null,
        is_user_created: false,
        is_favorite: false,
      },
      cached: false,
    })
  } catch (error) {
    console.error('Erro na API barcode:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
