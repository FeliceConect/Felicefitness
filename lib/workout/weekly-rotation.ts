import { differenceInCalendarWeeks, parseISO } from 'date-fns'

// Forma mínima de um dia de treino necessária para a rotação.
export interface RotationDay {
  day_of_week: number | null
}

export interface RotationSlot<T> {
  day: T
  dayOfWeek: number
}

// Distribuição padrão de dias da semana (1=seg ... 6=sáb, 0=dom), evita domingo por padrão.
const DAY_DISTRIBUTION: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
}

// Ordena dias da semana com segunda primeiro e domingo por último.
const weekdayOrder = (wd: number) => (wd === 0 ? 7 : wd)

/**
 * Distribui os treinos do split (A/B/C...) pelos dias da semana, com ROTAÇÃO CÍCLICA
 * quando o paciente treina mais dias (days_per_week) do que a quantidade de treinos
 * cadastrados — ex.: 3 treinos ABC em 6 dias → ABC ABC, deslocando por semana
 * (semana 0: A B C / semana 1: B C A ...).
 *
 * Treinos com `day_of_week` fixado pelo profissional permanecem no dia escolhido;
 * os demais são distribuídos automaticamente nos dias livres.
 *
 * FONTE ÚNICA: usada tanto na página de Treino (use-workouts) quanto no Dashboard
 * (use-dashboard-data), para que "o treino de hoje" seja idêntico nas duas telas.
 *
 * @returns slots ordenados por dia da semana (seg → dom).
 */
export function computeWeeklyTrainingSlots<T extends RotationDay>(params: {
  splitDays: T[]
  daysPerWeek?: number | null
  anchorDate?: string | null
  now?: Date
}): Array<RotationSlot<T>> {
  const { splitDays } = params
  if (!splitDays || splitDays.length === 0) return []

  const n = splitDays.length
  // Quantos dias por semana o paciente treina (definido pelo profissional).
  const daysPerWeek = Math.min(Math.max(params.daysPerWeek || n, 1), 7)
  const now = params.now ?? new Date()

  // Índice da semana atual no programa — gira a rotação a cada semana.
  // Âncora: data de início; se ausente, data de criação do programa.
  let weekIndex = 0
  if (params.anchorDate) {
    try {
      weekIndex = Math.max(
        0,
        differenceInCalendarWeeks(now, parseISO(params.anchorDate), { weekStartsOn: 1 })
      )
    } catch {
      weekIndex = 0
    }
  }

  // 1) Treinos com dia da semana FIXADO pelo profissional — mantém como está.
  const usedWeekdays = new Set<number>()
  const slots: Array<RotationSlot<T>> = []
  for (const day of splitDays) {
    if (day.day_of_week != null) {
      slots.push({ day, dayOfWeek: day.day_of_week })
      usedWeekdays.add(day.day_of_week)
    }
  }

  // 2) Preenche os dias restantes (até daysPerWeek) automaticamente,
  //    girando os treinos não-fixados (ou todos, se todos forem fixados).
  const autoSlots = Math.max(0, daysPerWeek - slots.length)
  if (autoSlots > 0) {
    const unpinned = splitDays.filter((d) => d.day_of_week == null)
    const pool = unpinned.length > 0 ? unpinned : splitDays

    const preferred = DAY_DISTRIBUTION[daysPerWeek] || DAY_DISTRIBUTION[7]
    const freeWeekdays: number[] = []
    for (const wd of preferred) {
      if (!usedWeekdays.has(wd)) freeWeekdays.push(wd)
    }
    // Fallback: se faltarem dias livres, varre seg→sáb→dom.
    if (freeWeekdays.length < autoSlots) {
      for (const wd of [1, 2, 3, 4, 5, 6, 0]) {
        if (freeWeekdays.length >= autoSlots) break
        if (!usedWeekdays.has(wd) && !freeWeekdays.includes(wd)) freeWeekdays.push(wd)
      }
    }

    for (let k = 0; k < autoSlots && k < freeWeekdays.length; k++) {
      const day = pool[(weekIndex * autoSlots + k) % pool.length]
      slots.push({ day, dayOfWeek: freeWeekdays[k] })
      usedWeekdays.add(freeWeekdays[k])
    }
  }

  // Ordena os treinos da semana por dia (seg → dom).
  slots.sort((a, b) => weekdayOrder(a.dayOfWeek) - weekdayOrder(b.dayOfWeek))
  return slots
}
