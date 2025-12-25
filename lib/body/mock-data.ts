/**
 * Mock data do histórico de bioimpedância do Leonardo
 * Baseado em 8 medições InBody de Janeiro 2024 a Janeiro 2025
 */

import type { BodyCompositionMeasurement } from './types'

// Dados das medições do Leonardo (43 anos, 180cm)
export const LEONARDO_MEASUREMENTS: BodyCompositionMeasurement[] = [
  // Medição 1 - Janeiro 2024 (início do acompanhamento)
  {
    id: 'med-001',
    user_id: 'leonardo-001',
    data: '2024-01-15',
    horario: '08:30',
    peso: 92.5,
    altura: 180,
    idade: 43,
    composicao: {
      agua_total: 46.2,
      proteina: 12.4,
      minerais: 4.1,
      gordura_corporal: 29.8
    },
    musculo_gordura: {
      peso: 92.5,
      massa_muscular_esqueletica: 35.2,
      massa_gordura_corporal: 29.8,
      imc: 28.5,
      percentual_gordura: 32.2
    },
    adicional: {
      taxa_metabolica_basal: 1812,
      nivel_gordura_visceral: 14,
      massa_magra: 62.7,
      massa_muscular: 59.4,
      agua_intracelular: 28.9,
      agua_extracelular: 17.3,
      relacao_cintura_quadril: 0.95,
      altura: 180,
      idade: 43
    },
    segmental: {
      braco_esquerdo: { massa_magra: 3.2, percentual_gordura: 28.1, avaliacao: 'normal' },
      braco_direito: { massa_magra: 3.4, percentual_gordura: 27.5, avaliacao: 'normal' },
      tronco: { massa_magra: 28.1, percentual_gordura: 35.2, avaliacao: 'alto' },
      perna_esquerda: { massa_magra: 9.1, percentual_gordura: 30.4, avaliacao: 'alto' },
      perna_direita: { massa_magra: 9.3, percentual_gordura: 29.8, avaliacao: 'alto' }
    },
    score: {
      pontuacao: 68,
      categoria: 'abaixo_media'
    },
    fonte: 'inbody',
    notas: 'Primeira avaliação - início do programa',
    created_at: '2024-01-15T08:30:00Z'
  },

  // Medição 2 - Março 2024
  {
    id: 'med-002',
    user_id: 'leonardo-001',
    data: '2024-03-18',
    horario: '07:45',
    peso: 89.8,
    altura: 180,
    idade: 43,
    composicao: {
      agua_total: 46.8,
      proteina: 12.6,
      minerais: 4.2,
      gordura_corporal: 26.2
    },
    musculo_gordura: {
      peso: 89.8,
      massa_muscular_esqueletica: 35.8,
      massa_gordura_corporal: 26.2,
      imc: 27.7,
      percentual_gordura: 29.2
    },
    adicional: {
      taxa_metabolica_basal: 1835,
      nivel_gordura_visceral: 12,
      massa_magra: 63.6,
      massa_muscular: 60.2,
      agua_intracelular: 29.3,
      agua_extracelular: 17.5,
      relacao_cintura_quadril: 0.93,
      altura: 180,
      idade: 43
    },
    segmental: {
      braco_esquerdo: { massa_magra: 3.3, percentual_gordura: 25.4, avaliacao: 'normal' },
      braco_direito: { massa_magra: 3.5, percentual_gordura: 24.8, avaliacao: 'normal' },
      tronco: { massa_magra: 28.6, percentual_gordura: 32.1, avaliacao: 'alto' },
      perna_esquerda: { massa_magra: 9.3, percentual_gordura: 27.6, avaliacao: 'normal' },
      perna_direita: { massa_magra: 9.5, percentual_gordura: 27.2, avaliacao: 'normal' }
    },
    score: {
      pontuacao: 72,
      categoria: 'normal'
    },
    fonte: 'inbody',
    notas: '2 meses de treino - boa evolução',
    created_at: '2024-03-18T07:45:00Z'
  },

  // Medição 3 - Maio 2024
  {
    id: 'med-003',
    user_id: 'leonardo-001',
    data: '2024-05-20',
    horario: '08:00',
    peso: 87.2,
    altura: 180,
    idade: 43,
    composicao: {
      agua_total: 47.4,
      proteina: 12.9,
      minerais: 4.3,
      gordura_corporal: 22.6
    },
    musculo_gordura: {
      peso: 87.2,
      massa_muscular_esqueletica: 36.4,
      massa_gordura_corporal: 22.6,
      imc: 26.9,
      percentual_gordura: 25.9
    },
    adicional: {
      taxa_metabolica_basal: 1862,
      nivel_gordura_visceral: 11,
      massa_magra: 64.6,
      massa_muscular: 61.2,
      agua_intracelular: 29.7,
      agua_extracelular: 17.7,
      relacao_cintura_quadril: 0.91,
      altura: 180,
      idade: 43
    },
    segmental: {
      braco_esquerdo: { massa_magra: 3.4, percentual_gordura: 22.8, avaliacao: 'normal' },
      braco_direito: { massa_magra: 3.6, percentual_gordura: 22.1, avaliacao: 'normal' },
      tronco: { massa_magra: 29.2, percentual_gordura: 28.5, avaliacao: 'alto' },
      perna_esquerda: { massa_magra: 9.5, percentual_gordura: 24.3, avaliacao: 'normal' },
      perna_direita: { massa_magra: 9.7, percentual_gordura: 23.9, avaliacao: 'normal' }
    },
    score: {
      pontuacao: 76,
      categoria: 'normal'
    },
    fonte: 'inbody',
    notas: '4 meses - progresso consistente',
    created_at: '2024-05-20T08:00:00Z'
  },

  // Medição 4 - Julho 2024
  {
    id: 'med-004',
    user_id: 'leonardo-001',
    data: '2024-07-22',
    horario: '07:30',
    peso: 85.4,
    altura: 180,
    idade: 43,
    composicao: {
      agua_total: 48.1,
      proteina: 13.2,
      minerais: 4.4,
      gordura_corporal: 19.7
    },
    musculo_gordura: {
      peso: 85.4,
      massa_muscular_esqueletica: 37.1,
      massa_gordura_corporal: 19.7,
      imc: 26.4,
      percentual_gordura: 23.1
    },
    adicional: {
      taxa_metabolica_basal: 1889,
      nivel_gordura_visceral: 10,
      massa_magra: 65.7,
      massa_muscular: 62.3,
      agua_intracelular: 30.1,
      agua_extracelular: 18.0,
      relacao_cintura_quadril: 0.89,
      altura: 180,
      idade: 43
    },
    segmental: {
      braco_esquerdo: { massa_magra: 3.5, percentual_gordura: 20.2, avaliacao: 'normal' },
      braco_direito: { massa_magra: 3.7, percentual_gordura: 19.5, avaliacao: 'normal' },
      tronco: { massa_magra: 29.8, percentual_gordura: 25.8, avaliacao: 'normal' },
      perna_esquerda: { massa_magra: 9.7, percentual_gordura: 21.4, avaliacao: 'normal' },
      perna_direita: { massa_magra: 9.9, percentual_gordura: 21.0, avaliacao: 'normal' }
    },
    score: {
      pontuacao: 79,
      categoria: 'normal'
    },
    fonte: 'inbody',
    notas: '6 meses - excelente progresso!',
    created_at: '2024-07-22T07:30:00Z'
  },

  // Medição 5 - Setembro 2024
  {
    id: 'med-005',
    user_id: 'leonardo-001',
    data: '2024-09-16',
    horario: '08:15',
    peso: 84.1,
    altura: 180,
    idade: 43,
    composicao: {
      agua_total: 48.6,
      proteina: 13.4,
      minerais: 4.5,
      gordura_corporal: 17.6
    },
    musculo_gordura: {
      peso: 84.1,
      massa_muscular_esqueletica: 37.6,
      massa_gordura_corporal: 17.6,
      imc: 26.0,
      percentual_gordura: 20.9
    },
    adicional: {
      taxa_metabolica_basal: 1912,
      nivel_gordura_visceral: 9,
      massa_magra: 66.5,
      massa_muscular: 63.1,
      agua_intracelular: 30.5,
      agua_extracelular: 18.1,
      relacao_cintura_quadril: 0.87,
      altura: 180,
      idade: 43
    },
    segmental: {
      braco_esquerdo: { massa_magra: 3.6, percentual_gordura: 18.1, avaliacao: 'normal' },
      braco_direito: { massa_magra: 3.8, percentual_gordura: 17.4, avaliacao: 'normal' },
      tronco: { massa_magra: 30.3, percentual_gordura: 23.2, avaliacao: 'normal' },
      perna_esquerda: { massa_magra: 9.9, percentual_gordura: 19.2, avaliacao: 'normal' },
      perna_direita: { massa_magra: 10.1, percentual_gordura: 18.8, avaliacao: 'normal' }
    },
    score: {
      pontuacao: 82,
      categoria: 'bom'
    },
    fonte: 'inbody',
    notas: '8 meses - gordura visceral normalizada!',
    created_at: '2024-09-16T08:15:00Z'
  },

  // Medição 6 - Novembro 2024
  {
    id: 'med-006',
    user_id: 'leonardo-001',
    data: '2024-11-11',
    horario: '07:45',
    peso: 83.2,
    altura: 180,
    idade: 43,
    composicao: {
      agua_total: 49.0,
      proteina: 13.6,
      minerais: 4.5,
      gordura_corporal: 16.1
    },
    musculo_gordura: {
      peso: 83.2,
      massa_muscular_esqueletica: 38.0,
      massa_gordura_corporal: 16.1,
      imc: 25.7,
      percentual_gordura: 19.4
    },
    adicional: {
      taxa_metabolica_basal: 1928,
      nivel_gordura_visceral: 8,
      massa_magra: 67.1,
      massa_muscular: 63.7,
      agua_intracelular: 30.8,
      agua_extracelular: 18.2,
      relacao_cintura_quadril: 0.86,
      altura: 180,
      idade: 43
    },
    segmental: {
      braco_esquerdo: { massa_magra: 3.7, percentual_gordura: 16.5, avaliacao: 'normal' },
      braco_direito: { massa_magra: 3.9, percentual_gordura: 15.8, avaliacao: 'normal' },
      tronco: { massa_magra: 30.7, percentual_gordura: 21.5, avaliacao: 'normal' },
      perna_esquerda: { massa_magra: 10.1, percentual_gordura: 17.8, avaliacao: 'normal' },
      perna_direita: { massa_magra: 10.3, percentual_gordura: 17.4, avaliacao: 'normal' }
    },
    score: {
      pontuacao: 84,
      categoria: 'bom'
    },
    fonte: 'inbody',
    notas: '10 meses - entrando na faixa ideal!',
    created_at: '2024-11-11T07:45:00Z'
  },

  // Medição 7 - Dezembro 2024
  {
    id: 'med-007',
    user_id: 'leonardo-001',
    data: '2024-12-09',
    horario: '08:00',
    peso: 82.8,
    altura: 180,
    idade: 43,
    composicao: {
      agua_total: 49.2,
      proteina: 13.7,
      minerais: 4.6,
      gordura_corporal: 15.3
    },
    musculo_gordura: {
      peso: 82.8,
      massa_muscular_esqueletica: 38.2,
      massa_gordura_corporal: 15.3,
      imc: 25.6,
      percentual_gordura: 18.5
    },
    adicional: {
      taxa_metabolica_basal: 1935,
      nivel_gordura_visceral: 8,
      massa_magra: 67.5,
      massa_muscular: 64.1,
      agua_intracelular: 30.9,
      agua_extracelular: 18.3,
      relacao_cintura_quadril: 0.85,
      altura: 180,
      idade: 43
    },
    segmental: {
      braco_esquerdo: { massa_magra: 3.7, percentual_gordura: 15.8, avaliacao: 'normal' },
      braco_direito: { massa_magra: 3.9, percentual_gordura: 15.2, avaliacao: 'normal' },
      tronco: { massa_magra: 30.9, percentual_gordura: 20.4, avaliacao: 'normal' },
      perna_esquerda: { massa_magra: 10.2, percentual_gordura: 16.9, avaliacao: 'normal' },
      perna_direita: { massa_magra: 10.4, percentual_gordura: 16.5, avaliacao: 'normal' }
    },
    score: {
      pontuacao: 85,
      categoria: 'bom'
    },
    fonte: 'inbody',
    notas: '11 meses - manutenção durante festas',
    created_at: '2024-12-09T08:00:00Z'
  },

  // Medição 8 - Janeiro 2025 (mais recente)
  {
    id: 'med-008',
    user_id: 'leonardo-001',
    data: '2025-01-13',
    horario: '07:30',
    peso: 82.1,
    altura: 180,
    idade: 44,
    composicao: {
      agua_total: 49.5,
      proteina: 13.8,
      minerais: 4.6,
      gordura_corporal: 14.2
    },
    musculo_gordura: {
      peso: 82.1,
      massa_muscular_esqueletica: 38.5,
      massa_gordura_corporal: 14.2,
      imc: 25.3,
      percentual_gordura: 17.3
    },
    adicional: {
      taxa_metabolica_basal: 1948,
      nivel_gordura_visceral: 7,
      massa_magra: 67.9,
      massa_muscular: 64.5,
      agua_intracelular: 31.1,
      agua_extracelular: 18.4,
      relacao_cintura_quadril: 0.84,
      altura: 180,
      idade: 44
    },
    segmental: {
      braco_esquerdo: { massa_magra: 3.8, percentual_gordura: 14.6, avaliacao: 'normal' },
      braco_direito: { massa_magra: 4.0, percentual_gordura: 14.1, avaliacao: 'normal' },
      tronco: { massa_magra: 31.2, percentual_gordura: 19.2, avaliacao: 'normal' },
      perna_esquerda: { massa_magra: 10.3, percentual_gordura: 15.8, avaliacao: 'normal' },
      perna_direita: { massa_magra: 10.5, percentual_gordura: 15.4, avaliacao: 'normal' }
    },
    score: {
      pontuacao: 87,
      categoria: 'bom'
    },
    fonte: 'inbody',
    notas: '1 ano de acompanhamento - resultados excelentes!',
    created_at: '2025-01-13T07:30:00Z'
  }
]

// Função para obter dados mock
export function getMockMeasurements(): BodyCompositionMeasurement[] {
  return [...LEONARDO_MEASUREMENTS].sort((a, b) =>
    new Date(b.data).getTime() - new Date(a.data).getTime()
  )
}

// Obter última medição
export function getLatestMeasurement(): BodyCompositionMeasurement {
  return LEONARDO_MEASUREMENTS[LEONARDO_MEASUREMENTS.length - 1]
}

// Obter medição por ID
export function getMeasurementById(id: string): BodyCompositionMeasurement | undefined {
  return LEONARDO_MEASUREMENTS.find(m => m.id === id)
}

// Metas do Leonardo
export const LEONARDO_GOALS = {
  peso_meta: 80,
  gordura_meta: 15, // Percentual
  musculo_meta: 40, // kg de massa muscular esquelética
  gordura_visceral_meta: 6
}

// Resumo da evolução do Leonardo
export const LEONARDO_EVOLUTION_SUMMARY = {
  periodo: 'Janeiro 2024 - Janeiro 2025',
  peso_perdido: 10.4, // 92.5 - 82.1
  gordura_perdida: 15.6, // 29.8 - 14.2 kg
  gordura_percentual_perdida: 14.9, // 32.2 - 17.3%
  musculo_ganho: 3.3, // 38.5 - 35.2 kg
  score_aumento: 19, // 87 - 68
  gordura_visceral_reducao: 7, // 14 - 7
  tmb_aumento: 136 // 1948 - 1812 kcal
}
