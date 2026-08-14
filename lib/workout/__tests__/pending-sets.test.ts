import { describe, it, expect } from 'vitest'
import { buildPendingSets, resolvePendingSetValues } from '@/lib/workout/pending-sets'
import type { CompletedSet, ExerciseSet, WorkoutExercise } from '@/lib/workout/types'

const makeSet = (n: number, over: Partial<ExerciseSet> = {}): ExerciseSet => ({
  id: `s${n}`,
  workout_exercise_id: 'we1',
  numero_serie: n,
  repeticoes_planejadas: '10',
  carga_planejada: 20,
  status: 'pendente',
  ...over,
})

const makeExercise = (id: string, nSets: number, over: Partial<WorkoutExercise> = {}): WorkoutExercise => ({
  id,
  workout_id: 'w1',
  exercise_id: '',
  nome: `Exercício ${id}`,
  ordem: 0,
  series: Array.from({ length: nSets }, (_, i) => makeSet(i + 1)),
  ...over,
})

const done = (exerciseId: string, setNumber: number, over: Partial<CompletedSet> = {}): CompletedSet => ({
  exerciseId,
  exerciseName: `Exercício ${exerciseId}`,
  setNumber,
  reps: 10,
  weight: 20,
  isPR: false,
  ...over,
})

const resolver = (_ex: WorkoutExercise, set: ExerciseSet) => resolvePendingSetValues(set, null)

describe('resolvePendingSetValues — precedência da carga', () => {
  it('prefere a carga da última sessão à prescrita', () => {
    const r = resolvePendingSetValues(makeSet(1, { carga_planejada: 20 }), { weight: 27.5, reps: 8 })
    expect(r.weight).toBe(27.5)
  })

  it('usa a prescrita quando não há histórico (primeira execução)', () => {
    expect(resolvePendingSetValues(makeSet(1, { carga_planejada: 25 }), null).weight).toBe(25)
  })

  it('cai em 0 quando não há histórico nem prescrição (peso do corpo)', () => {
    expect(resolvePendingSetValues(makeSet(1, { carga_planejada: undefined }), null).weight).toBe(0)
  })

  it('usa as reps planejadas, não as da última sessão', () => {
    const r = resolvePendingSetValues(makeSet(1, { repeticoes_planejadas: '12' }), { weight: 30, reps: 6 })
    expect(r.reps).toBe(12)
  })

  it('extrai o primeiro número de um intervalo ("8-12" → 8, conservador)', () => {
    expect(resolvePendingSetValues(makeSet(1, { repeticoes_planejadas: '8-12' }), null).reps).toBe(8)
  })

  it('sem reps planejadas utilizáveis, cai nas da última sessão e depois em 12', () => {
    expect(resolvePendingSetValues(makeSet(1, { repeticoes_planejadas: 'até a falha' }), { weight: 10, reps: 7 }).reps).toBe(7)
    expect(resolvePendingSetValues(makeSet(1, { repeticoes_planejadas: '' }), null).reps).toBe(12)
  })

  it('em isometria o campo reps carrega os SEGUNDOS', () => {
    const set = makeSet(1, { set_type: 'time', tempo_segundos: 20, repeticoes_planejadas: '20' })
    expect(resolvePendingSetValues(set, null).reps).toBe(20)
  })

  it('em isometria sem tempo_segundos, usa o planejado e por fim 30s', () => {
    expect(resolvePendingSetValues(makeSet(1, { set_type: 'time', tempo_segundos: undefined, repeticoes_planejadas: '45' }), null).reps).toBe(45)
    expect(resolvePendingSetValues(makeSet(1, { set_type: 'time', tempo_segundos: undefined, repeticoes_planejadas: '' }), null).reps).toBe(30)
  })

  it('isometria com carga mantém a carga (ex.: abdominal com halter)', () => {
    const set = makeSet(1, { set_type: 'time', tempo_segundos: 20, carga_planejada: 3.5 })
    expect(resolvePendingSetValues(set, null)).toEqual({ reps: 20, weight: 3.5 })
  })
})

describe('buildPendingSets — quais séries faltam', () => {
  it('preenche o treino inteiro quando nada foi registrado', () => {
    const exs = [makeExercise('a', 3), makeExercise('b', 2)]
    const pending = buildPendingSets(exs, [], resolver)
    expect(pending).toHaveLength(5)
    expect(pending.map(p => `${p.exerciseId}#${p.setNumber}`)).toEqual(['a#1', 'a#2', 'a#3', 'b#1', 'b#2'])
  })

  it('não recria série já registrada — e preserva a carga anotada nela', () => {
    const exs = [makeExercise('a', 3)]
    const jaFeita = done('a', 2, { weight: 42, reps: 6 })
    const pending = buildPendingSets(exs, [jaFeita], resolver)
    expect(pending.map(p => p.setNumber)).toEqual([1, 3])
    // a série 2 não aparece no resultado, então nada sobrescreve os 42kg
    expect(pending.some(p => p.setNumber === 2)).toBe(false)
  })

  it('fecha buracos deixados por pular/voltar (1 e 3 feitas → só a 2 falta)', () => {
    const exs = [makeExercise('a', 3)]
    const pending = buildPendingSets(exs, [done('a', 1), done('a', 3)], resolver)
    expect(pending.map(p => p.setNumber)).toEqual([2])
  })

  it('não gera nada quando o treino já está completo (idempotente)', () => {
    const exs = [makeExercise('a', 2)]
    const completos = [done('a', 1), done('a', 2)]
    expect(buildPendingSets(exs, completos, resolver)).toHaveLength(0)
    // rodar de novo sobre o resultado acumulado continua vazio
    expect(buildPendingSets(exs, [...completos], resolver)).toHaveLength(0)
  })

  it('nunca duplica numero de série dentro do mesmo exercício', () => {
    const exs = [makeExercise('a', 4)]
    const existentes = [done('a', 1)]
    const todos = [...existentes, ...buildPendingSets(exs, existentes, resolver)]
    const numeros = todos.filter(s => s.exerciseId === 'a').map(s => s.setNumber)
    expect(new Set(numeros).size).toBe(numeros.length)
    expect(numeros.sort()).toEqual([1, 2, 3, 4])
  })

  it('isola exercícios diferentes que compartilham número de série', () => {
    const exs = [makeExercise('a', 2), makeExercise('b', 2)]
    // série 1 do 'a' feita não pode marcar a série 1 do 'b' como feita
    const pending = buildPendingSets(exs, [done('a', 1)], resolver)
    expect(pending.map(p => `${p.exerciseId}#${p.setNumber}`)).toEqual(['a#2', 'b#1', 'b#2'])
  })

  it('marca isPR false — o recorde é decidido pelo trigger no banco', () => {
    const pending = buildPendingSets([makeExercise('a', 1)], [], resolver)
    expect(pending.every(p => p.isPR === false)).toBe(true)
  })

  it('leva o nome do exercício junto (o save agrupa as séries por nome)', () => {
    const exs = [makeExercise('a', 1, { nome: 'Supino sentado (Chest press Sel)' })]
    expect(buildPendingSets(exs, [], resolver)[0].exerciseName).toBe('Supino sentado (Chest press Sel)')
  })
})
