/**
 * Auditoria dos pontos de bioimpedância.
 *
 * Compara, para cada paciente, o que ESTÁ lançado em fitness_point_transactions
 * (category = 'bioimpedance') com o que a fórmula atual calcularia hoje. Serve
 * tanto para a tela de conferência do admin quanto para prever o efeito de um
 * recálculo antes de aplicá-lo.
 *
 * Divergências têm causas conhecidas: mudanças na regra de pontuação ao longo do
 * tempo (ex.: o commit que passou a ignorar registros só-de-peso como base de
 * comparação) deixam transações antigas congeladas no valor da regra anterior.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { calculateBioimpedancePoints, type BioSnapshot } from './points-calculator'

type AdminClient = any

export interface ChainRow extends BioSnapshot {
  id: string
  user_id: string
  data: string
  created_at: string
  fonte: string | null
}

export interface BioAuditRecord {
  id: string
  data: string
  fonte: string | null
  esperado: number
  concedido: number
  diferenca: number
  motivo: string
  /** true quando a trava de plausibilidade ignorou alguma métrica. */
  revisar: boolean
}

export interface BioAuditPatient {
  user_id: string
  nome: string
  role: string | null
  ativo: boolean
  medicoes: number
  concedido: number
  esperado: number
  diferenca: number
  divergentes: number
  registros: BioAuditRecord[]
}

export interface BioAuditResult {
  pacientes: BioAuditPatient[]
  totais: { concedido: number; esperado: number; diferenca: number; medicoes: number; divergentes: number }
  /** Transações de bio cujo registro de origem não existe mais. */
  orfas: Array<{ id: string; user_id: string; nome: string; points: number; reason: string }>
}

export function hasComposition(r: BioSnapshot): boolean {
  return r.massa_gordura_kg != null || r.massa_muscular_esqueletica_kg != null || r.gordura_visceral != null
}

/**
 * "Anterior" = bioimpedância REAL mais recente com data ESTRITAMENTE menor.
 * Espelha getPreviousRecord() de award.ts: ignora registros que só têm peso,
 * pois eles zerariam os deltas indevidamente.
 * `chain` deve vir ordenada por (data, created_at) crescente.
 */
export function previousOf(chain: ChainRow[], i: number): ChainRow | null {
  for (let j = i - 1; j >= 0; j--) {
    if (chain[j].data < chain[i].data && hasComposition(chain[j])) return chain[j]
  }
  return null
}

/** Carrega todas as medições agrupadas por paciente, ordenadas por (data, created_at) asc. */
export async function loadChains(supabaseAdmin: AdminClient): Promise<Map<string, ChainRow[]>> {
  const { data: rows } = await supabaseAdmin
    .from('fitness_body_compositions')
    .select('id, user_id, data, created_at, fonte, massa_gordura_kg, massa_muscular_esqueletica_kg, gordura_visceral')
    .order('data', { ascending: true })
    .order('created_at', { ascending: true })

  const byUser = new Map<string, ChainRow[]>()
  for (const r of (rows || []) as ChainRow[]) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, [])
    byUser.get(r.user_id)!.push(r)
  }
  return byUser
}

export async function auditBioimpedancePoints(supabaseAdmin: AdminClient): Promise<BioAuditResult> {
  const byUser = await loadChains(supabaseAdmin)
  const userIds = Array.from(byUser.keys())

  const { data: txs } = await supabaseAdmin
    .from('fitness_point_transactions')
    .select('id, user_id, points, reason, reference_id')
    .eq('category', 'bioimpedance')
  const transactions = (txs || []) as Array<{ id: string; user_id: string; points: number; reason: string; reference_id: string | null }>

  // Índice por reference_id: evita varrer a lista de transações para cada
  // medição (a tela recarrega isto a cada abertura e o histórico só cresce).
  const txByRecord = new Map<string, { points: number }>()
  for (const t of transactions) {
    if (!t.reference_id) continue
    const prev = txByRecord.get(t.reference_id)
    // Defensivo: se houver mais de uma transação para a mesma medição, soma —
    // é o mesmo critério de removeBioimpedanceTransaction().
    txByRecord.set(t.reference_id, { points: (prev?.points ?? 0) + t.points })
  }

  // Perfis de quem tem medição + de quem só tem transação (para nomear órfãs)
  const allIds = Array.from(new Set([...userIds, ...transactions.map(t => t.user_id)]))
  const { data: profs } = allIds.length
    ? await supabaseAdmin.from('fitness_profiles').select('id, nome, role, is_active').in('id', allIds)
    : { data: [] }
  const profMap = new Map((profs || []).map((p: any) => [p.id, p]))

  const pacientes: BioAuditPatient[] = []
  for (const [uid, chain] of Array.from(byUser.entries())) {
    const registros: BioAuditRecord[] = []
    let concedido = 0
    let esperado = 0
    let divergentes = 0

    for (let i = 0; i < chain.length; i++) {
      const row = chain[i]
      const bd = calculateBioimpedancePoints(previousOf(chain, i), row)
      const exp = bd?.total ?? 0
      const act = txByRecord.get(row.id)?.points ?? 0
      esperado += exp
      concedido += act

      // Registro sem pontuação em ambos os lados não interessa na conferência.
      if (exp === 0 && act === 0) continue
      if (exp !== act) divergentes++
      registros.push({
        id: row.id,
        data: row.data,
        fonte: row.fonte,
        esperado: exp,
        concedido: act,
        diferenca: exp - act,
        motivo: bd?.reason ?? 'sem medição anterior para comparar',
        revisar: bd?.reason.includes('implausível') ?? false,
      })
    }

    const prof: any = profMap.get(uid)
    pacientes.push({
      user_id: uid,
      nome: prof?.nome || '(sem nome)',
      role: prof?.role ?? null,
      ativo: prof?.is_active !== false,
      medicoes: chain.length,
      concedido,
      esperado,
      diferenca: esperado - concedido,
      divergentes,
      registros,
    })
  }

  // Maiores divergências primeiro; depois por pontuação.
  pacientes.sort((a, b) =>
    Math.abs(b.diferenca) - Math.abs(a.diferenca) ||
    b.concedido - a.concedido ||
    a.nome.localeCompare(b.nome)
  )

  const allRecordIds = new Set(Array.from(byUser.values()).flat().map(r => r.id))
  const orfas = transactions
    .filter(t => !t.reference_id || !allRecordIds.has(t.reference_id))
    .map(t => ({
      id: t.id,
      user_id: t.user_id,
      nome: (profMap.get(t.user_id) as any)?.nome || '(sem nome)',
      points: t.points,
      reason: t.reason,
    }))

  return {
    pacientes,
    totais: {
      concedido: pacientes.reduce((s, p) => s + p.concedido, 0),
      esperado: pacientes.reduce((s, p) => s + p.esperado, 0),
      diferenca: pacientes.reduce((s, p) => s + p.diferenca, 0),
      medicoes: pacientes.reduce((s, p) => s + p.medicoes, 0),
      divergentes: pacientes.reduce((s, p) => s + p.divergentes, 0),
    },
    orfas,
  }
}
