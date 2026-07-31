/**
 * Leitura das avaliações por ultrassom pelo próprio paciente.
 *
 * Sem rota de API: a policy `usg_owner_select` já restringe as linhas ao
 * titular, então o client do browser lê direto. Escrita não existe aqui de
 * propósito — o dado é produzido por profissional com equipamento, e a RLS da
 * tabela não concede INSERT nem UPDATE a ninguém pelo client.
 */

import { getSupabase, getCurrentUserId, ServiceError } from './base'
import type {
  UsgAssessmentWithSites,
  UsgSiteCode,
  UsgTecido,
} from '@/lib/usg/types'

const SELECT_COMPLETO =
  'id, user_id, data, horario_coleta, momento_avaliacao, avaliador_id, protocolo, sexo, idade, peso_kg, altura_cm, equipamento, transdutor_mhz, soma_gordura_mm, soma_equivalente_mm, soma_muscular_mm, densidade_corporal, percentual_gordura, massa_gorda_kg, massa_magra_kg, equation_version, equacao_densidade, formula_percentual, conversao_id, conversao_fator, conversao_offset, agregacao_repeticoes, estimativa_confiavel, calculo_avisos, interpretacao, created_at, updated_at, medidas:fitness_usg_measurements(id, assessment_id, site, tecido, lado, repeticoes_mm, valor_mm, cv_percent, fora_de_tolerancia, observacao)'

export interface UsgSitePoint {
  data: string
  valor_mm: number
}

/** Histórico do paciente, da avaliação mais recente para a mais antiga. */
export async function getUsgAssessments(
  limit = 20
): Promise<UsgAssessmentWithSites[]> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('fitness_usg_assessments')
    .select(SELECT_COMPLETO)
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .limit(limit)

  if (error) {
    throw new ServiceError(
      'Erro ao buscar avaliações por ultrassom',
      error.code,
      error.message
    )
  }
  return (data ?? []) as UsgAssessmentWithSites[]
}

export async function getUsgAssessment(
  id: string
): Promise<UsgAssessmentWithSites | null> {
  const supabase = getSupabase()
  const userId = await getCurrentUserId()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('fitness_usg_assessments')
    .select(SELECT_COMPLETO)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new ServiceError('Erro ao buscar a avaliação', error.code, error.message)
  }
  return (data as UsgAssessmentWithSites | null) ?? null
}

/**
 * Evolução da espessura de um sítio ao longo do tempo, do mais antigo para o
 * mais recente — é a métrica que não depende de nenhuma conversão.
 */
export async function getUsgSiteHistory(
  site: UsgSiteCode,
  tecido: UsgTecido = 'gordura'
): Promise<UsgSitePoint[]> {
  const assessments = await getUsgAssessments(50)

  return assessments
    .map((a) => {
      const medida = a.medidas?.find((m) => m.site === site && m.tecido === tecido)
      return medida ? { data: a.data, valor_mm: Number(medida.valor_mm) } : null
    })
    .filter((p): p is UsgSitePoint => p !== null)
    .reverse()
}
