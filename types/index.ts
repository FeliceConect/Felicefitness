// FeliceFit - Tipos auxiliares
// Tipos e constantes utilizados em todo o app

// Re-exportar tipos do banco de dados
export * from './database'

// ============================================
// TIPOS DE REFEIÇÃO
// ============================================

export type TipoRefeicao =
  | 'cafe_manha'
  | 'lanche_manha'
  | 'almoco'
  | 'lanche_tarde'
  | 'jantar'
  | 'ceia'
  | 'pre_treino'
  | 'pos_treino'

export const TIPOS_REFEICAO: TipoRefeicao[] = [
  'cafe_manha',
  'lanche_manha',
  'almoco',
  'lanche_tarde',
  'jantar',
  'ceia',
  'pre_treino',
  'pos_treino',
]

export const TIPOS_REFEICAO_LABELS: Record<TipoRefeicao, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
  ceia: 'Ceia',
  pre_treino: 'Pré-Treino',
  pos_treino: 'Pós-Treino',
}

export const TIPOS_REFEICAO_HORARIOS: Record<TipoRefeicao, string> = {
  cafe_manha: '06:00',
  lanche_manha: '09:30',
  almoco: '12:00',
  lanche_tarde: '15:30',
  jantar: '19:00',
  ceia: '21:00',
  pre_treino: '05:00',
  pos_treino: '06:30',
}

// ============================================
// TIPOS DE TREINO
// ============================================

export type StatusTreino = 'pendente' | 'em_andamento' | 'concluido' | 'pulado'

export const STATUS_TREINO_LABELS: Record<StatusTreino, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  pulado: 'Pulado',
}

export type TipoTreino = 'tradicional' | 'circuito' | 'hiit' | 'mobilidade'

export const TIPOS_TREINO: TipoTreino[] = ['tradicional', 'circuito', 'hiit', 'mobilidade']

export const TIPOS_TREINO_LABELS: Record<TipoTreino, string> = {
  tradicional: 'Tradicional',
  circuito: 'Circuito',
  hiit: 'HIIT',
  mobilidade: 'Mobilidade',
}

export type FaseTreino = 'base' | 'construcao' | 'pico' | 'deload'

export const FASES_TREINO: FaseTreino[] = ['base', 'construcao', 'pico', 'deload']

export const FASES_TREINO_LABELS: Record<FaseTreino, string> = {
  base: 'Base',
  construcao: 'Construção',
  pico: 'Pico',
  deload: 'Deload',
}

// ============================================
// GRUPOS MUSCULARES
// ============================================

export type GrupoMuscular =
  | 'pernas'
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'cardio'

export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  'pernas',
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'core',
  'cardio',
]

export const GRUPOS_MUSCULARES_LABELS: Record<GrupoMuscular, string> = {
  pernas: 'Pernas',
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Core',
  cardio: 'Cardio',
}

export const GRUPOS_MUSCULARES_ICONES: Record<GrupoMuscular, string> = {
  pernas: '🦵',
  peito: '💪',
  costas: '🔙',
  ombros: '🏋️',
  biceps: '💪',
  triceps: '💪',
  core: '🎯',
  cardio: '❤️',
}

// ============================================
// DIAS DA SEMANA
// ============================================

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = domingo

export const DIAS_SEMANA_LABELS: Record<DiaSemana, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

export const DIAS_SEMANA_ABREV: Record<DiaSemana, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}

// ============================================
// OBJETIVOS
// ============================================

export type Objetivo = 'definicao' | 'hipertrofia' | 'emagrecimento' | 'saude'

export const OBJETIVOS: Objetivo[] = ['definicao', 'hipertrofia', 'emagrecimento', 'saude']

export const OBJETIVOS_LABELS: Record<Objetivo, string> = {
  definicao: 'Definição Muscular',
  hipertrofia: 'Ganho de Massa',
  emagrecimento: 'Emagrecimento',
  saude: 'Saúde e Bem-estar',
}

export const OBJETIVOS_DESCRICAO: Record<Objetivo, string> = {
  definicao: 'Reduzir gordura mantendo massa muscular',
  hipertrofia: 'Ganhar massa muscular e força',
  emagrecimento: 'Perder peso de forma saudável',
  saude: 'Manter um estilo de vida ativo',
}

// ============================================
// NÍVEL DE ATIVIDADE
// ============================================

export type NivelAtividade = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'atleta'

export const NIVEIS_ATIVIDADE: NivelAtividade[] = [
  'sedentario',
  'leve',
  'moderado',
  'intenso',
  'atleta',
]

export const NIVEIS_ATIVIDADE_LABELS: Record<NivelAtividade, string> = {
  sedentario: 'Sedentário',
  leve: 'Levemente Ativo',
  moderado: 'Moderadamente Ativo',
  intenso: 'Muito Ativo',
  atleta: 'Atleta',
}

export const NIVEIS_ATIVIDADE_DESCRICAO: Record<NivelAtividade, string> = {
  sedentario: 'Pouco ou nenhum exercício',
  leve: 'Exercício leve 1-3 dias/semana',
  moderado: 'Exercício moderado 3-5 dias/semana',
  intenso: 'Exercício intenso 6-7 dias/semana',
  atleta: 'Atleta ou trabalho físico intenso',
}

// Multiplicadores TMB para cada nível
export const NIVEIS_ATIVIDADE_FATOR: Record<NivelAtividade, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  atleta: 1.9,
}

// ============================================
// EQUIPAMENTOS
// ============================================

export type Equipamento =
  | 'livre'
  | 'maquina'
  | 'halteres'
  | 'barra'
  | 'cabo'
  | 'peso_corporal'
  | 'elastico'
  | 'equipamento'

export const EQUIPAMENTOS_LABELS: Record<Equipamento, string> = {
  livre: 'Peso Livre',
  maquina: 'Máquina',
  halteres: 'Halteres',
  barra: 'Barra',
  cabo: 'Cabo/Polia',
  peso_corporal: 'Peso Corporal',
  elastico: 'Elástico',
  equipamento: 'Equipamento',
}

// ============================================
// DIFICULDADE
// ============================================

export type Dificuldade = 'iniciante' | 'intermediario' | 'avancado'

export const DIFICULDADES: Dificuldade[] = ['iniciante', 'intermediario', 'avancado']

export const DIFICULDADES_LABELS: Record<Dificuldade, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

// ============================================
// CATEGORIAS DE ALIMENTOS
// ============================================

export type CategoriaAlimento =
  | 'proteina'
  | 'carboidrato'
  | 'vegetal'
  | 'fruta'
  | 'laticinio'
  | 'gordura'
  | 'bebida'
  | 'suplemento'

export const CATEGORIAS_ALIMENTO: CategoriaAlimento[] = [
  'proteina',
  'carboidrato',
  'vegetal',
  'fruta',
  'laticinio',
  'gordura',
  'bebida',
  'suplemento',
]

export const CATEGORIAS_ALIMENTO_LABELS: Record<CategoriaAlimento, string> = {
  proteina: 'Proteína',
  carboidrato: 'Carboidrato',
  vegetal: 'Vegetal',
  fruta: 'Fruta',
  laticinio: 'Laticínio',
  gordura: 'Gordura',
  bebida: 'Bebida',
  suplemento: 'Suplemento',
}

// ============================================
// TIPOS DE SUPLEMENTO
// ============================================

export type TipoSuplemento =
  | 'proteina'
  | 'creatina'
  | 'vitamina'
  | 'mineral'
  | 'pre_treino'
  | 'outro'

export const TIPOS_SUPLEMENTO: TipoSuplemento[] = [
  'proteina',
  'creatina',
  'vitamina',
  'mineral',
  'pre_treino',
  'outro',
]

export const TIPOS_SUPLEMENTO_LABELS: Record<TipoSuplemento, string> = {
  proteina: 'Proteína',
  creatina: 'Creatina',
  vitamina: 'Vitamina',
  mineral: 'Mineral',
  pre_treino: 'Pré-Treino',
  outro: 'Outro',
}

// ============================================
// TIPOS DE META
// ============================================

export type TipoMeta = 'peso' | 'gordura' | 'musculo' | 'forca' | 'habito' | 'evento'

export const TIPOS_META: TipoMeta[] = ['peso', 'gordura', 'musculo', 'forca', 'habito', 'evento']

export const TIPOS_META_LABELS: Record<TipoMeta, string> = {
  peso: 'Peso',
  gordura: '% Gordura',
  musculo: 'Massa Muscular',
  forca: 'Força',
  habito: 'Hábito',
  evento: 'Evento',
}

// ============================================
// STATUS DE META
// ============================================

export type StatusMeta = 'ativa' | 'concluida' | 'abandonada'

export const STATUS_META_LABELS: Record<StatusMeta, string> = {
  ativa: 'Ativa',
  concluida: 'Concluída',
  abandonada: 'Abandonada',
}

// ============================================
// TIPOS DE FOTO DE PROGRESSO
// ============================================

export type TipoFotoProgresso = 'frente' | 'lado_esquerdo' | 'lado_direito' | 'costas'

export const TIPOS_FOTO_PROGRESSO: TipoFotoProgresso[] = [
  'frente',
  'lado_esquerdo',
  'lado_direito',
  'costas',
]

export const TIPOS_FOTO_PROGRESSO_LABELS: Record<TipoFotoProgresso, string> = {
  frente: 'Frente',
  lado_esquerdo: 'Lado Esquerdo',
  lado_direito: 'Lado Direito',
  costas: 'Costas',
}

// ============================================
// FATORES DE SONO
// ============================================

export const FATORES_SONO = [
  'estresse',
  'cafeina',
  'tela',
  'exercicio_tarde',
  'alimentacao_pesada',
  'alcool',
  'ambiente_quente',
  'barulho',
] as const

export type FatorSono = (typeof FATORES_SONO)[number]

export const FATORES_SONO_LABELS: Record<FatorSono, string> = {
  estresse: 'Estresse',
  cafeina: 'Cafeína',
  tela: 'Tela antes de dormir',
  exercicio_tarde: 'Exercício à noite',
  alimentacao_pesada: 'Alimentação pesada',
  alcool: 'Álcool',
  ambiente_quente: 'Ambiente quente',
  barulho: 'Barulho',
}

// ============================================
// CATEGORIAS DE CONQUISTAS
// ============================================

export type CategoriaConquista = 'streak' | 'treino' | 'alimentacao' | 'agua' | 'peso' | 'pr'

export const CATEGORIAS_CONQUISTA_LABELS: Record<CategoriaConquista, string> = {
  streak: 'Consistência',
  treino: 'Treino',
  alimentacao: 'Alimentação',
  agua: 'Hidratação',
  peso: 'Peso',
  pr: 'Recordes',
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula a Taxa Metabólica Basal (TMB) usando a fórmula de Mifflin-St Jeor
 */
export function calcularTMB(
  peso: number,
  altura: number,
  idade: number,
  sexo: 'masculino' | 'feminino'
): number {
  if (sexo === 'masculino') {
    return 10 * peso + 6.25 * altura - 5 * idade + 5
  } else {
    return 10 * peso + 6.25 * altura - 5 * idade - 161
  }
}

/**
 * Calcula as calorias diárias totais
 */
export function calcularCaloriasDiarias(
  peso: number,
  altura: number,
  idade: number,
  sexo: 'masculino' | 'feminino',
  nivelAtividade: NivelAtividade,
  objetivo: Objetivo
): number {
  const tmb = calcularTMB(peso, altura, idade, sexo)
  const fator = NIVEIS_ATIVIDADE_FATOR[nivelAtividade]
  let calorias = tmb * fator

  // Ajuste baseado no objetivo
  switch (objetivo) {
    case 'emagrecimento':
      calorias *= 0.8 // Déficit de 20%
      break
    case 'hipertrofia':
      calorias *= 1.1 // Superávit de 10%
      break
    case 'definicao':
      calorias *= 0.9 // Déficit leve de 10%
      break
  }

  return Math.round(calorias)
}

/**
 * Calcula os macros baseado nas calorias e objetivo
 */
export function calcularMacros(
  calorias: number,
  peso: number,
  objetivo: Objetivo
): { proteina: number; carboidrato: number; gordura: number } {
  let proteinaPorKg: number
  let gorduraPorcentagem: number

  switch (objetivo) {
    case 'hipertrofia':
      proteinaPorKg = 2.2
      gorduraPorcentagem = 0.25
      break
    case 'definicao':
      proteinaPorKg = 2.4
      gorduraPorcentagem = 0.25
      break
    case 'emagrecimento':
      proteinaPorKg = 2.0
      gorduraPorcentagem = 0.3
      break
    default:
      proteinaPorKg = 1.6
      gorduraPorcentagem = 0.3
  }

  const proteina = Math.round(peso * proteinaPorKg)
  const gordura = Math.round((calorias * gorduraPorcentagem) / 9)
  const caloriasRestantes = calorias - proteina * 4 - gordura * 9
  const carboidrato = Math.round(caloriasRestantes / 4)

  return { proteina, carboidrato, gordura }
}

/**
 * Formata duração em minutos para string legível
 */
export function formatarDuracao(minutos: number): string {
  if (minutos < 60) {
    return `${minutos}min`
  }
  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
}

/**
 * Calcula a idade a partir da data de nascimento
 */
export function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const mesAtual = hoje.getMonth()
  const mesNascimento = nascimento.getMonth()

  if (
    mesAtual < mesNascimento ||
    (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())
  ) {
    idade--
  }

  return idade
}

/**
 * Formata data para exibição
 */
export function formatarData(data: string | Date): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formata data curta (sem ano)
 */
export function formatarDataCurta(data: string | Date): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

/**
 * Formata horário
 */
export function formatarHorario(horario: string): string {
  return horario.substring(0, 5) // Remove segundos se houver
}
