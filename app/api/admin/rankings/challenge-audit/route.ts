/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Auditoria de um desafio (superadmin, SÓ LEITURA).
 *
 * GET sem ?challengeId  → lista os desafios (para o seletor).
 * GET ?challengeId=UUID → para cada participante, o detalhamento dos pontos no
 *   período + bandeiras de farm (dias acima do teto, atividades acima do cap,
 *   bônus de streak). Nada é gravado — é só um relatório para decidir a premiação.
 *
 * A janela é por created_at em [start 00:00 SP, end 23:59 SP] — a MESMA usada
 * pelo placar do desafio (lib/services/challenge-score.ts), então o "score"
 * aqui bate com o placar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { auditParticipant, type AuditTx, type ParticipantAudit } from '@/lib/rankings/challenge-audit'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 }) }
  }
  const admin = getAdminClient()
  const { data: profile } = await admin.from('fitness_profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'super_admin') {
    return { error: NextResponse.json({ success: false, error: 'Apenas super admin' }, { status: 403 }) }
  }
  return { admin }
}

// Início/fim do dia em SP (Brasil sem DST → -03:00), em ISO UTC.
const startISO = (d: string) => new Date(`${d}T00:00:00-03:00`).toISOString()
const endISO = (d: string) => new Date(`${d}T23:59:59.999-03:00`).toISOString()

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperadmin()
    if ('error' in auth) return auth.error
    const admin = auth.admin

    const challengeId = new URL(request.url).searchParams.get('challengeId')

    // Sem challengeId: devolve a lista de desafios para o seletor.
    if (!challengeId) {
      const { data: challenges } = await admin
        .from('fitness_challenges')
        .select('id, title, start_date, end_date, scoring_category, is_active')
        .order('start_date', { ascending: false })
      return NextResponse.json({ success: true, challenges: challenges || [] })
    }

    // Desafio
    const { data: challenge } = await admin
      .from('fitness_challenges')
      .select('id, title, start_date, end_date, scoring_category')
      .eq('id', challengeId)
      .single()
    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Desafio não encontrado' }, { status: 404 })
    }

    // Participantes
    const { data: parts } = await admin
      .from('fitness_challenge_participants')
      .select('user_id')
      .eq('challenge_id', challengeId)
    const userIds = Array.from(new Set((parts || []).map((p: any) => p.user_id))) as string[]
    if (userIds.length === 0) {
      // Inclui `resumo` mesmo vazio — a tela lê resumo.participantes e quebrava
      // (desafios sem participantes, ex.: os desativados).
      return NextResponse.json({
        success: true,
        challenge,
        resumo: { participantes: 0, com_bandeira: 0 },
        participants: [],
      })
    }

    // Nomes
    const nameMap = new Map<string, string>()
    const { data: profiles } = await admin
      .from('fitness_profiles')
      .select('id, nome, display_name, apelido_ranking')
      .in('id', userIds)
    for (const p of (profiles || []) as any[]) {
      nameMap.set(p.id, p.display_name || p.apelido_ranking || p.nome || 'Sem nome')
    }

    // Transações no período (janela por created_at, igual ao placar)
    const { data: txRows } = await admin
      .from('fitness_point_transactions')
      .select('id, user_id, points, reason, category, reference_id, reference_date, created_at, source, awarded_by')
      .in('user_id', userIds)
      .gte('created_at', startISO(challenge.start_date))
      .lte('created_at', endISO(challenge.end_date))
      .limit(50000)

    const txByUser = new Map<string, AuditTx[]>()
    for (const t of (txRows || []) as any[]) {
      const arr = txByUser.get(t.user_id) || []
      arr.push(t as AuditTx)
      txByUser.set(t.user_id, arr)
    }

    const participants: ParticipantAudit[] = userIds
      .map((uid) => auditParticipant(
        uid,
        nameMap.get(uid) || 'Sem nome',
        txByUser.get(uid) || [],
        challenge.scoring_category ?? null,
      ))
      .sort((a, b) => b.score - a.score)

    // Resolve QUEM lançou os pontos manuais (id -> nome + papel), para a
    // auditoria mostrar "dado por Fulana (secretária)".
    const awarderIds = Array.from(new Set(
      participants.flatMap((p) => p.manualAwards.map((m) => m.awardedBy).filter(Boolean))
    )) as string[]
    const awarderMap = new Map<string, string>()
    const secretaryIds = new Set<string>()
    if (awarderIds.length > 0) {
      const { data: awarders } = await admin
        .from('fitness_profiles')
        .select('id, nome, display_name, role, admin_type')
        .in('id', awarderIds)
      for (const a of (awarders || []) as any[]) {
        const base = a.display_name || a.nome || 'Desconhecido'
        const isSecretary = a.role === 'admin' && a.admin_type === 'secretary'
        if (isSecretary) secretaryIds.add(a.id)
        const tag = a.role === 'super_admin'
          ? ' (super admin)'
          : a.role === 'admin'
            ? (isSecretary ? ' (secretária)' : ' (admin)')
            : a.role ? ` (${a.role})` : ''
        awarderMap.set(a.id, base + tag)
      }
    }
    for (const p of participants) {
      for (const m of p.manualAwards) {
        m.awarderName = m.awardedBy
          ? (awarderMap.get(m.awardedBy) || 'Desconhecido')
          : 'Sem registro de quem lançou'
        m.awarderIsSecretary = m.awardedBy ? secretaryIds.has(m.awardedBy) : false
      }
    }

    const flagged = participants.filter((p) => p.flags.length > 0).length

    return NextResponse.json({
      success: true,
      challenge,
      resumo: { participantes: participants.length, com_bandeira: flagged },
      participants,
    })
  } catch (error) {
    console.error('Erro na auditoria do desafio:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
