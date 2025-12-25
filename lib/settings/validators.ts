// Validadores para configurações

import type { Goals, RevoladeSettings, WorkoutPreferences } from '@/types/settings'

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

// Validar metas
export function validateGoals(goals: Partial<Goals>): ValidationResult {
  const errors: Record<string, string> = {}

  // Calorias
  if (goals.calorias !== undefined) {
    if (goals.calorias < 1000) {
      errors.calorias = 'Calorias mínimo: 1000 kcal'
    } else if (goals.calorias > 5000) {
      errors.calorias = 'Calorias máximo: 5000 kcal'
    }
  }

  // Proteína
  if (goals.proteina !== undefined) {
    if (goals.proteina < 50) {
      errors.proteina = 'Proteína mínimo: 50g'
    } else if (goals.proteina > 400) {
      errors.proteina = 'Proteína máximo: 400g'
    }
  }

  // Carboidratos
  if (goals.carboidratos !== undefined) {
    if (goals.carboidratos < 0) {
      errors.carboidratos = 'Carboidratos não pode ser negativo'
    } else if (goals.carboidratos > 600) {
      errors.carboidratos = 'Carboidratos máximo: 600g'
    }
  }

  // Gordura
  if (goals.gordura !== undefined) {
    if (goals.gordura < 20) {
      errors.gordura = 'Gordura mínimo: 20g'
    } else if (goals.gordura > 200) {
      errors.gordura = 'Gordura máximo: 200g'
    }
  }

  // Água
  if (goals.agua !== undefined) {
    if (goals.agua < 1000) {
      errors.agua = 'Água mínimo: 1000ml'
    } else if (goals.agua > 6000) {
      errors.agua = 'Água máximo: 6000ml'
    }
  }

  // Treinos por semana
  if (goals.treinos_semana !== undefined) {
    if (goals.treinos_semana < 1) {
      errors.treinos_semana = 'Mínimo: 1 treino por semana'
    } else if (goals.treinos_semana > 7) {
      errors.treinos_semana = 'Máximo: 7 treinos por semana'
    }
  }

  // Peso meta
  if (goals.peso_meta !== undefined) {
    if (goals.peso_meta < 40) {
      errors.peso_meta = 'Peso meta mínimo: 40kg'
    } else if (goals.peso_meta > 200) {
      errors.peso_meta = 'Peso meta máximo: 200kg'
    }
  }

  // Gordura meta
  if (goals.gordura_meta !== undefined) {
    if (goals.gordura_meta < 3) {
      errors.gordura_meta = 'Gordura corporal mínimo: 3%'
    } else if (goals.gordura_meta > 50) {
      errors.gordura_meta = 'Gordura corporal máximo: 50%'
    }
  }

  // Músculo meta
  if (goals.musculo_meta !== undefined) {
    if (goals.musculo_meta < 20) {
      errors.musculo_meta = 'Massa muscular mínimo: 20kg'
    } else if (goals.musculo_meta > 80) {
      errors.musculo_meta = 'Massa muscular máximo: 80kg'
    }
  }

  // Horas de sono
  if (goals.horas_sono !== undefined) {
    if (goals.horas_sono < 4) {
      errors.horas_sono = 'Sono mínimo: 4 horas'
    } else if (goals.horas_sono > 12) {
      errors.horas_sono = 'Sono máximo: 12 horas'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Validar configurações do Revolade
export function validateRevoladeSettings(settings: Partial<RevoladeSettings>): ValidationResult {
  const errors: Record<string, string> = {}

  // Validar formato de hora
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

  if (settings.horario_medicamento && !timeRegex.test(settings.horario_medicamento)) {
    errors.horario_medicamento = 'Formato inválido. Use HH:mm'
  }

  if (settings.jejum_inicio && !timeRegex.test(settings.jejum_inicio)) {
    errors.jejum_inicio = 'Formato inválido. Use HH:mm'
  }

  if (settings.jejum_fim && !timeRegex.test(settings.jejum_fim)) {
    errors.jejum_fim = 'Formato inválido. Use HH:mm'
  }

  if (settings.restricao_laticinios_fim && !timeRegex.test(settings.restricao_laticinios_fim)) {
    errors.restricao_laticinios_fim = 'Formato inválido. Use HH:mm'
  }

  // Validar lógica de tempo
  if (settings.jejum_inicio && settings.jejum_fim && settings.horario_medicamento) {
    const inicio = parseTime(settings.jejum_inicio)
    const fim = parseTime(settings.jejum_fim)
    const medicamento = parseTime(settings.horario_medicamento)

    if (inicio >= fim) {
      errors.jejum_fim = 'Fim do jejum deve ser após o início'
    }

    if (medicamento < inicio || medicamento > fim) {
      errors.horario_medicamento = 'Medicamento deve ser durante o jejum'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Validar preferências de treino
export function validateWorkoutPreferences(prefs: Partial<WorkoutPreferences>): ValidationResult {
  const errors: Record<string, string> = {}

  // Duração média
  if (prefs.duracao_media !== undefined) {
    if (prefs.duracao_media < 10) {
      errors.duracao_media = 'Duração mínima: 10 minutos'
    } else if (prefs.duracao_media > 180) {
      errors.duracao_media = 'Duração máxima: 180 minutos'
    }
  }

  // Descanso padrão
  if (prefs.descanso_padrao !== undefined) {
    if (prefs.descanso_padrao < 10) {
      errors.descanso_padrao = 'Descanso mínimo: 10 segundos'
    } else if (prefs.descanso_padrao > 300) {
      errors.descanso_padrao = 'Descanso máximo: 300 segundos'
    }
  }

  // Dias preferidos
  if (prefs.dias_preferidos !== undefined) {
    if (prefs.dias_preferidos.length === 0) {
      errors.dias_preferidos = 'Selecione pelo menos um dia'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Helpers
function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Calcular recomendações de macros baseado no peso e objetivo
export function calculateMacroRecommendations(
  peso: number,
  altura: number,
  idade: number,
  genero: 'masculino' | 'feminino',
  nivelAtividade: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso',
  objetivo: 'perder_peso' | 'manter' | 'ganhar_massa'
) {
  // Calcular TMB usando Mifflin-St Jeor
  let tmb: number
  if (genero === 'masculino') {
    tmb = 10 * peso + 6.25 * altura - 5 * idade + 5
  } else {
    tmb = 10 * peso + 6.25 * altura - 5 * idade - 161
  }

  // Fator de atividade
  const fatoresAtividade = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muito_intenso: 1.9
  }
  const fatorAtividade = fatoresAtividade[nivelAtividade]

  // GET (Gasto Energético Total)
  let get = tmb * fatorAtividade

  // Ajuste por objetivo
  if (objetivo === 'perder_peso') {
    get *= 0.85 // Déficit de 15%
  } else if (objetivo === 'ganhar_massa') {
    get *= 1.1 // Superávit de 10%
  }

  // Proteína: 1.8-2.2g/kg para atletas
  const proteinaMin = peso * 1.8
  const proteinaMax = peso * 2.2
  const proteina = Math.round((proteinaMin + proteinaMax) / 2)

  // Gordura: 0.8-1g/kg
  const gorduraMin = peso * 0.8
  const gorduraMax = peso * 1
  const gordura = Math.round((gorduraMin + gorduraMax) / 2)

  // Carboidratos: o que sobra
  const caloriasProteina = proteina * 4
  const caloriasGordura = gordura * 9
  const caloriasCarboidratos = get - caloriasProteina - caloriasGordura
  const carboidratos = Math.round(caloriasCarboidratos / 4)

  // Água: 35ml/kg
  const agua = Math.round(peso * 35)

  return {
    calorias: { min: Math.round(get * 0.95), max: Math.round(get * 1.05) },
    proteina: { min: Math.round(proteinaMin), max: Math.round(proteinaMax) },
    carboidratos: { min: Math.max(100, carboidratos - 30), max: carboidratos + 30 },
    gordura: { min: Math.round(gorduraMin), max: Math.round(gorduraMax) },
    agua
  }
}

// Validar email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar telefone
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s()-]{10,}$/
  return phoneRegex.test(phone)
}
