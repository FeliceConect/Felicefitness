// Helpers para alimentos de plano alimentar com "grupos de escolha".
//
// A nutri monta refeições onde alguns componentes são "escolher 1" (ex.:
// Proteína: frango OU peixe OU carne; Carboidrato: arroz OU batata-doce OU...).
// Representamos isso marcando cada alimento de um conjunto de escolha com o
// mesmo `group` (ex.: "Proteína"). Alimentos fixos ficam sem `group`.

export interface PlanFood {
  name: string
  quantity?: number | null
  unit?: string | null
  portion_label?: string | null
  calories?: number | null
  protein?: number | null
  carbs?: number | null
  fat?: number | null
  // Conjunto de escolha ("escolher 1"): alimentos com o mesmo group são
  // alternativas entre si. Ausente/null = alimento fixo da refeição.
  group?: string | null
  choice?: boolean | null
}

export interface FoodGroupBlock {
  /** Nome do componente quando é um conjunto de escolha; null = alimento fixo. */
  group: string | null
  /** true quando há mais de uma opção a escolher. */
  isChoice: boolean
  items: PlanFood[]
}

/**
 * Agrupa os alimentos preservando a ordem de aparição. Alimentos sem `group`
 * viram blocos individuais (fixos); alimentos com o mesmo `group` são reunidos
 * num bloco de escolha ("escolher 1").
 */
export function groupPlanFoods(foods: PlanFood[] | null | undefined): FoodGroupBlock[] {
  const result: FoodGroupBlock[] = []
  const indexByGroup = new Map<string, number>()

  for (const food of foods || []) {
    const g = food.group && String(food.group).trim() ? String(food.group).trim() : null
    if (!g) {
      result.push({ group: null, isChoice: false, items: [food] })
      continue
    }
    let idx = indexByGroup.get(g)
    if (idx === undefined) {
      idx = result.length
      indexByGroup.set(g, idx)
      result.push({ group: g, isChoice: false, items: [] })
    }
    result[idx].items.push(food)
    result[idx].isChoice = result[idx].items.length > 1
  }

  return result
}

/** Texto da quantidade de um alimento ("120 g", "3 colher de sopa", "à vontade"). */
export function formatFoodAmount(food: PlanFood): string {
  if (food.portion_label && String(food.portion_label).trim()) return String(food.portion_label).trim()
  const unit = food.unit ? String(food.unit).trim() : ''
  if (food.quantity == null || food.quantity === undefined) {
    return unit || 'à vontade'
  }
  // unidades curtas colam no número (120g, 200ml); medidas por extenso ganham espaço
  const compact = ['g', 'kg', 'ml', 'l', '%'].includes(unit.toLowerCase())
  return compact ? `${food.quantity}${unit}` : `${food.quantity}${unit ? ` ${unit}` : ''}`.trim()
}
