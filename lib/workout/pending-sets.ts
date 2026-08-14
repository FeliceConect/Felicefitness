import type { CompletedSet, ExerciseSet, WorkoutExercise } from '@/lib/workout/types'

/** Última execução registrada de um exercício (vem de use-exercise-history). */
export interface LastSetRef {
  weight: number
  reps: number
}

/**
 * Com que reps/carga uma série pendente é preenchida no
 * "Finalizar e executar todos".
 *
 * Precedência da carga: última sessão → prescrita no treino → 0 (peso do
 * corpo). É a MESMA precedência que a tela de execução já exibe, para o
 * botão nunca gravar um valor diferente do que o paciente estava vendo.
 *
 * Reps: usa o planejado. Em série por tempo (isometria) o "reps" carrega os
 * segundos — é como o resto do app já trata isometria (ver
 * handleCompleteIsometric e o save).
 */
export function resolvePendingSetValues(
  set: Pick<ExerciseSet, 'carga_planejada' | 'repeticoes_planejadas' | 'tempo_segundos' | 'set_type'>,
  last: LastSetRef | null | undefined
): { reps: number; weight: number } {
  const weight = last?.weight ?? set.carga_planejada ?? 0

  const planned = parseInt(set.repeticoes_planejadas || '', 10)
  const hasPlanned = Number.isFinite(planned) && planned > 0

  const reps = set.set_type === 'time'
    ? (set.tempo_segundos ?? (hasPlanned ? planned : 30))
    : (hasPlanned ? planned : last?.reps ?? 12)

  return { reps, weight }
}

/**
 * Monta as séries que faltam para o treino inteiro ficar completo.
 *
 * Séries já registradas NÃO são tocadas: quem anotou carga diferente durante
 * o treino mantém o que anotou. A comparação é por NÚMERO da série (e não por
 * contagem) porque pular/voltar pelo strip pode deixar buracos — ex.: séries
 * 1 e 3 feitas e a 2 pendente.
 */
export function buildPendingSets(
  exercicios: WorkoutExercise[],
  completedSets: CompletedSet[],
  resolve: (exercise: WorkoutExercise, set: ExerciseSet, setNumber: number) => { reps: number; weight: number }
): CompletedSet[] {
  const pending: CompletedSet[] = []

  for (const ex of exercicios) {
    const doneSetNumbers = new Set(
      completedSets.filter(cs => cs.exerciseId === ex.id).map(cs => cs.setNumber)
    )

    ex.series.forEach((set, i) => {
      const setNumber = i + 1
      if (doneSetNumbers.has(setNumber)) return
      const { reps, weight } = resolve(ex, set, setNumber)
      pending.push({
        exerciseId: ex.id,
        exerciseName: ex.nome,
        setNumber,
        reps,
        weight,
        // PR real é decidido no servidor pelo trigger check_and_create_pr.
        isPR: false,
      })
    })
  }

  return pending
}
