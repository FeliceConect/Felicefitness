/**
 * Normaliza agrupamento de circuito (biset/triset) entre o modelo legado
 * (is_superset + superset_grupo) e o novo (circuit_group).
 *
 * Regras:
 * 1. Se circuit_group já está setado → preserva.
 * 2. Se superset_grupo está setado → usa como circuit_group.
 * 3. Se há run consecutivo (≥2) de is_superset=true sem grupo explícito,
 *    atribui um circuit_group sintético compartilhado.
 *
 * Sintéticos começam acima do maior grupo já existente para evitar
 * colisão. A ordenação é por `ordem` antes da detecção de runs.
 */

type GroupableExercise = {
  ordem: number
  is_superset?: boolean | null
  superset_grupo?: number | null
  circuit_group?: number | null
}

export function normalizeCircuitGroups<T extends GroupableExercise>(exercises: T[]): T[] {
  if (!exercises || exercises.length === 0) return exercises

  // Maior grupo existente para evitar colisão com sintéticos
  let maxGroup = 0
  for (const ex of exercises) {
    const g = ex.circuit_group ?? ex.superset_grupo ?? 0
    if (g > maxGroup) maxGroup = g
  }

  const sorted = [...exercises].sort((a, b) => a.ordem - b.ordem)

  // Passo 1: fallback explícito (circuit_group ?? superset_grupo)
  const out: T[] = sorted.map(ex => ({
    ...ex,
    circuit_group: ex.circuit_group ?? ex.superset_grupo ?? null,
  }))

  // Passo 2: detecta runs consecutivos de is_superset sem grupo
  let i = 0
  while (i < out.length) {
    if (out[i].is_superset && out[i].circuit_group == null) {
      let j = i
      while (j < out.length && out[j].is_superset && out[j].circuit_group == null) {
        j++
      }
      if (j - i >= 2) {
        maxGroup++
        for (let k = i; k < j; k++) {
          out[k] = { ...out[k], circuit_group: maxGroup }
        }
      }
      i = j
    } else {
      i++
    }
  }

  return out
}
