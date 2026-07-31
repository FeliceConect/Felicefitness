'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  Plus,
  Pencil,
  Power,
  PowerOff,
  Calendar,
  TrendingUp,
  Zap,
  X,
  Search,
  Users,
  Filter,
  UserCheck,
  CheckSquare,
  Swords,
  Lock,
  Globe,
  Instagram,
  Activity,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

interface Ranking {
  id: string
  name: string
  type: string
  category: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  description: string | null
  point_rules: Record<string, unknown>
  created_at: string
}

// Conferência dos pontos de bioimpedância (GET /api/admin/rankings/bio-audit)
interface BioAuditRecord {
  id: string
  data: string
  fonte: string | null
  esperado: number
  concedido: number
  diferenca: number
  motivo: string
  revisar: boolean
}

interface BioAuditPatient {
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

interface BioAudit {
  pacientes: BioAuditPatient[]
  totais: { concedido: number; esperado: number; diferenca: number; medicoes: number; divergentes: number }
  orfas: Array<{ id: string; user_id: string; nome: string; points: number; reason: string }>
}

interface PointTransaction {
  id: string
  user_id: string
  points: number
  reason: string
  category: string
  source: string
  awarded_by: string | null
  created_at: string
  user_name?: string
}

// Reconstrução do ranking (GET/POST /api/admin/rankings/resync)
interface ResyncChange {
  ranking_id: string
  user_id: string
  nome: string
  before: number
  after: number
}

interface ResyncPreview {
  remocoes: {
    pr_fantasma: { transacoes: number; pontos: number }
    feed_excedente: { transacoes: number; pontos: number }
  }
  participantes_alterados: number
  mudancas: ResyncChange[]
}

// Auditoria do desafio (GET /api/admin/rankings/challenge-audit)
interface AuditFlag { level: 'alto' | 'medio'; text: string }
interface AuditDayItem { reason: string; count: number; points: number }
interface AuditDay {
  date: string
  points: number
  activities: number
  suspicious: boolean
  items: AuditDayItem[]
}
interface AuditManualAward {
  date: string
  reason: string
  points: number
  source: string
  awardedBy: string | null
  awarderName?: string
}
interface AuditParticipant {
  user_id: string
  nome: string
  score: number
  totalAll: number
  maxDayPoints: number
  daysOverCeiling: number
  activityCount: number
  activityExcess: number
  streakCount: number
  byReason: AuditDayItem[]
  days: AuditDay[]
  manualAwards: AuditManualAward[]
  flags: AuditFlag[]
}
interface AuditChallengeInfo {
  id: string
  title: string
  start_date: string
  end_date: string
  scoring_category: string | null
  is_active?: boolean
}
interface ChallengeAuditData {
  challenge: AuditChallengeInfo
  resumo?: { participantes: number; com_bandeira: number }
  participants: AuditParticipant[]
}

interface Client {
  id: string
  nome: string
  email: string
}

interface Professional {
  id: string
  display_name: string
  type: string
}

interface Challenge {
  id: string
  title: string
  description: string
  challenge_type: string
  scoring_category: string | null
  start_date: string
  end_date: string
  is_active: boolean
  is_private: boolean
  participant_count: number
  created_at: string
}

const CHALLENGE_TYPES = [
  { value: 'points', label: 'Mais pontos' },
  { value: 'workouts', label: 'Mais treinos' },
  { value: 'streak', label: 'Maior streak' },
  { value: 'custom', label: 'Pontuação manual' },
]

const SCORING_CATEGORIES = [
  { value: '', label: 'Todas (geral)' },
  { value: 'workout', label: 'Treino' },
  { value: 'nutrition', label: 'Nutrição' },
  { value: 'consistency', label: 'Consistência' },
  { value: 'social', label: 'Social' },
]

type SelectionMode = 'all' | 'filter' | 'manual'

const RANKING_TYPES = [
  { value: 'general', label: 'Geral' },
  { value: 'semester', label: 'Semestral' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'challenge', label: 'Desafio' },
  { value: 'category', label: 'Categoria' },
]

const CATEGORIES = [
  { value: '', label: 'Nenhuma' },
  { value: 'nutrition', label: 'Nutrição' },
  { value: 'workout', label: 'Treino' },
  { value: 'consistency', label: 'Consistência' },
]

export default function AdminRankingsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRanking, setEditingRanking] = useState<Ranking | null>(null)
  const [saving, setSaving] = useState(false)

  // Bio points modal
  const [showBioModal, setShowBioModal] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [bioPoints, setBioPoints] = useState(30)
  const [bioReason, setBioReason] = useState('')
  const [awardingBio, setAwardingBio] = useState(false)

  // Instagram #vivendofelice modal
  const [showInstagramModal, setShowInstagramModal] = useState(false)
  const [instagramClient, setInstagramClient] = useState('')
  const [validatingInstagram, setValidatingInstagram] = useState(false)
  const [instagramFeedback, setInstagramFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Point transactions
  // Conferência de pontos de bioimpedância
  const [showBioAudit, setShowBioAudit] = useState(false)
  const [bioAudit, setBioAudit] = useState<BioAudit | null>(null)
  const [loadingBioAudit, setLoadingBioAudit] = useState(false)
  const [bioAuditError, setBioAuditError] = useState<string | null>(null)
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null)
  const [recalculatingBio, setRecalculatingBio] = useState(false)

  // Reconstrução do ranking (resync)
  const [showResync, setShowResync] = useState(false)
  const [resyncPreview, setResyncPreview] = useState<ResyncPreview | null>(null)
  const [loadingResync, setLoadingResync] = useState(false)
  const [applyingResync, setApplyingResync] = useState(false)
  const [resyncError, setResyncError] = useState<string | null>(null)
  const [resyncDone, setResyncDone] = useState<string | null>(null)

  // Auditoria do desafio
  const [showAudit, setShowAudit] = useState(false)
  const [auditChallenges, setAuditChallenges] = useState<AuditChallengeInfo[]>([])
  const [auditChallengeId, setAuditChallengeId] = useState<string>('')
  const [auditData, setAuditData] = useState<ChallengeAuditData | null>(null)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [expandedAuditUser, setExpandedAuditUser] = useState<string | null>(null)
  const [expandedAuditDay, setExpandedAuditDay] = useState<string | null>(null)

  const [showTransactions, setShowTransactions] = useState(false)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [txSearch, setTxSearch] = useState('')

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: 'general',
    category: '',
    start_date: '',
    end_date: '',
    description: '',
    add_all_clients: true,
  })

  // Patient selection for new ranking
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all')
  const [allClients, setAllClients] = useState<Client[]>([])
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set())
  const [clientSearch, setClientSearch] = useState('')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [filterProfessionalId, setFilterProfessionalId] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [loadingClients, setLoadingClients] = useState(false)

  // Challenges
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [savingChallenge, setSavingChallenge] = useState(false)
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    challenge_type: 'points',
    scoring_category: '',
    start_date: '',
    end_date: '',
    is_private: false,
  })
  const [challengeSelectionMode, setChallengeSelectionMode] = useState<SelectionMode>('all')
  const [challengeSelectedIds, setChallengeSelectedIds] = useState<Set<string>>(new Set())
  const [challengeClientSearch, setChallengeClientSearch] = useState('')
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [challengeLeaderboard, setChallengeLeaderboard] = useState<{ position: number; user_id: string; name: string; tier: string; score: number }[]>([])
  const [loadingChallengeDetail, setLoadingChallengeDetail] = useState(false)

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/challenges')
      const data = await res.json()
      if (data.success) {
        setChallenges(data.challenges || [])
      }
    } catch {
      // silent
    }
  }, [])

  const fetchRankings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rankings')
      const data = await res.json()
      if (data.success) {
        setRankings(data.rankings || [])
      }
    } catch (error) {
      console.error('Erro ao buscar rankings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRankings()
    fetchChallenges()
  }, [fetchRankings, fetchChallenges])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingRanking) {
        const res = await fetch(`/api/rankings/${editingRanking.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if ((await res.json()).success) {
          setShowForm(false)
          setEditingRanking(null)
          fetchRankings()
        }
      } else {
        // Build payload with patient selection
        const payload = {
          ...form,
          add_all_clients: selectionMode === 'all',
          selected_client_ids: selectionMode !== 'all' ? Array.from(selectedClientIds) : undefined,
        }
        const res = await fetch('/api/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if ((await res.json()).success) {
          setShowForm(false)
          fetchRankings()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar ranking:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (ranking: Ranking) => {
    try {
      await fetch(`/api/rankings/${ranking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !ranking.is_active }),
      })
      fetchRankings()
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const openEdit = (ranking: Ranking) => {
    setEditingRanking(ranking)
    setForm({
      name: ranking.name,
      type: ranking.type,
      category: ranking.category || '',
      start_date: ranking.start_date || '',
      end_date: ranking.end_date || '',
      description: ranking.description || '',
      add_all_clients: false,
    })
    setShowForm(true)
  }

  const loadClientsAndProfessionals = async () => {
    setLoadingClients(true)
    try {
      const [clientsRes, profsRes] = await Promise.all([
        fetch('/api/professional/clients?all=true').catch(() => null),
        fetch('/api/professional/list').catch(() => null),
      ])

      if (clientsRes) {
        const data = await clientsRes.json()
        if (data.success && data.data) {
          setAllClients(data.data.map((c: { client_id: string; client_name: string; client_email: string }) => ({
            id: c.client_id,
            nome: c.client_name,
            email: c.client_email,
          })))
        }
      }

      if (profsRes) {
        const data = await profsRes.json()
        if (data.success && data.data) {
          setProfessionals(data.data)
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingClients(false)
    }
  }

  const openNew = () => {
    setEditingRanking(null)
    setForm({
      name: '',
      type: 'general',
      category: '',
      start_date: '',
      end_date: '',
      description: '',
      add_all_clients: true,
    })
    setSelectionMode('all')
    setSelectedClientIds(new Set())
    setClientSearch('')
    setFilterProfessionalId('')
    setFilterStatus('all')
    setShowForm(true)
    loadClientsAndProfessionals()
  }

  // Bioimpedance points
  const openBioModal = async () => {
    setShowBioModal(true)
    try {
      const res = await fetch('/api/admin/users?role=client')
      const data = await res.json()
      if (data.success) {
        setClients(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  const awardBioPoints = async () => {
    if (!selectedClient || !bioReason) return
    setAwardingBio(true)
    try {
      const res = await fetch('/api/admin/rankings/bio-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          points: bioPoints,
          reason: bioReason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowBioModal(false)
        setSelectedClient('')
        setBioPoints(30)
        setBioReason('')
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setAwardingBio(false)
    }
  }

  const openInstagramModal = async () => {
    setShowInstagramModal(true)
    setInstagramFeedback(null)
    // Carrega TODOS os clientes (mesma fonte da modal de bioimpedância).
    // Importante usar /api/admin/users?role=client em vez de
    // /api/professional/clients (que só traz pacientes atribuídos a um pro).
    if (clients.length === 0) {
      try {
        const res = await fetch('/api/admin/users?role=client&limit=500')
        const data = await res.json()
        if (data.success) setClients(data.users || [])
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      }
    }
  }

  const validateInstagramPost = async () => {
    if (!instagramClient) return
    setValidatingInstagram(true)
    setInstagramFeedback(null)
    try {
      const res = await fetch('/api/admin/rankings/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: instagramClient }),
      })
      const data = await res.json()
      if (data.success) {
        setInstagramFeedback({ type: 'success', message: data.message || '5 pts atribuídos' })
        setInstagramClient('')
      } else {
        setInstagramFeedback({ type: 'error', message: data.error || 'Erro ao validar post' })
      }
    } catch (error) {
      console.error('Erro:', error)
      setInstagramFeedback({ type: 'error', message: 'Erro de rede' })
    } finally {
      setValidatingInstagram(false)
    }
  }

  // Conferência de bioimpedância — somente leitura
  const fetchBioAudit = async (keepOpen = false) => {
    if (!keepOpen) setShowBioAudit(true)
    setLoadingBioAudit(true)
    setBioAuditError(null)
    try {
      const res = await fetch('/api/admin/rankings/bio-audit')
      const data = await res.json()
      if (data.success) {
        setBioAudit({ pacientes: data.pacientes || [], totais: data.totais, orfas: data.orfas || [] })
      } else {
        setBioAuditError(data.error || 'Erro ao carregar conferência')
      }
    } catch (error) {
      console.error('Erro:', error)
      setBioAuditError('Erro de rede ao carregar conferência')
    } finally {
      setLoadingBioAudit(false)
    }
  }

  // Recalcula a cadeia de pontos de TODOS os pacientes sob a fórmula atual.
  // Preserva o created_at de cada medição, então não desloca pontos antigos
  // para dentro da janela de um desafio em curso.
  const handleRecalcBio = async () => {
    const pendentes = bioAudit?.totais.divergentes ?? 0
    if (!confirm(
      `Recalcular os pontos de bioimpedância de todos os pacientes?\n\n` +
      `${pendentes} lançamento(s) divergente(s) serão corrigidos. ` +
      `Diferença líquida: ${(bioAudit?.totais.diferenca ?? 0) > 0 ? '+' : ''}${bioAudit?.totais.diferenca ?? 0} pontos.\n\n` +
      `O ranking geral é ajustado automaticamente.`
    )) return

    setRecalculatingBio(true)
    try {
      const res = await fetch('/api/admin/rankings/recalc-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RECALC' }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchBioAudit(true)
        fetchRankings()
      } else {
        setBioAuditError(data.error || 'Erro ao recalcular')
      }
    } catch (error) {
      console.error('Erro:', error)
      setBioAuditError('Erro de rede ao recalcular')
    } finally {
      setRecalculatingBio(false)
    }
  }

  // Reconstrução do ranking: abre o modal e já carrega o PREVIEW (GET, não grava).
  const openResync = async () => {
    setShowResync(true)
    setResyncPreview(null)
    setResyncError(null)
    setResyncDone(null)
    setLoadingResync(true)
    try {
      const res = await fetch('/api/admin/rankings/resync')
      const data = await res.json()
      if (data.success) {
        setResyncPreview({
          remocoes: data.remocoes,
          participantes_alterados: data.participantes_alterados,
          mudancas: data.mudancas || [],
        })
      } else {
        setResyncError(data.error || 'Erro ao pré-visualizar')
      }
    } catch {
      setResyncError('Erro de rede ao pré-visualizar')
    } finally {
      setLoadingResync(false)
    }
  }

  // Aplica a reconstrução (POST { confirm: 'RESYNC' }). Reconstrói total_points
  // a partir do extrato limpo e ajusta o leaderboard.
  const handleApplyResync = async () => {
    if (!confirm(
      `Reconstruir os totais do ranking a partir do extrato de pontos?\n\n` +
      `${resyncPreview?.participantes_alterados ?? 0} participante(s) terão o total ajustado. ` +
      `Remove PR fantasma e excesso de feed e recalcula os pontos.\n\n` +
      `Rode antes o "Recalcular" da bioimpedância se houver divergências.`
    )) return

    setApplyingResync(true)
    setResyncError(null)
    try {
      const res = await fetch('/api/admin/rankings/resync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESYNC' }),
      })
      const data = await res.json()
      if (data.success) {
        setResyncDone(
          `Pronto: ${data.participantes_atualizados} participante(s) atualizados. ` +
          `Removidas ${data.removidas?.pr_fantasma ?? 0} de PR fantasma e ${data.removidas?.feed_excedente ?? 0} de feed.`
        )
        setResyncPreview(null)
        fetchRankings()
      } else {
        setResyncError(data.error || 'Erro ao aplicar')
      }
    } catch {
      setResyncError('Erro de rede ao aplicar')
    } finally {
      setApplyingResync(false)
    }
  }

  // Auditoria do desafio: abre o modal e carrega a lista de desafios pro seletor.
  const openChallengeAudit = async () => {
    setShowAudit(true)
    setAuditData(null)
    setAuditError(null)
    setAuditChallengeId('')
    setExpandedAuditUser(null)
    setExpandedAuditDay(null)
    try {
      const res = await fetch('/api/admin/rankings/challenge-audit')
      const data = await res.json()
      if (data.success) setAuditChallenges(data.challenges || [])
      else setAuditError(data.error || 'Erro ao listar desafios')
    } catch {
      setAuditError('Erro de rede ao listar desafios')
    }
  }

  // Roda a auditoria de um desafio (só leitura).
  const runChallengeAudit = async (challengeId: string) => {
    setAuditChallengeId(challengeId)
    setAuditData(null)
    setExpandedAuditUser(null)
    setExpandedAuditDay(null)
    setAuditError(null)
    if (!challengeId) return
    setLoadingAudit(true)
    try {
      const res = await fetch(`/api/admin/rankings/challenge-audit?challengeId=${challengeId}`)
      const data = await res.json()
      if (data.success) setAuditData(data)
      else setAuditError(data.error || 'Erro na auditoria')
    } catch {
      setAuditError('Erro de rede na auditoria')
    } finally {
      setLoadingAudit(false)
    }
  }

  // Transactions
  const fetchTransactions = async () => {
    setShowTransactions(true)
    setLoadingTransactions(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (txSearch) params.set('search', txSearch)
      const res = await fetch(`/api/admin/rankings/transactions?${params}`)
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Challenge handlers
  const openNewChallenge = () => {
    setChallengeForm({
      title: '',
      description: '',
      challenge_type: 'points',
      scoring_category: '',
      start_date: '',
      end_date: '',
      is_private: false,
    })
    setChallengeSelectionMode('all')
    setChallengeSelectedIds(new Set())
    setChallengeClientSearch('')
    setShowChallengeForm(true)
    loadClientsAndProfessionals()
  }

  const handleSaveChallenge = async () => {
    setSavingChallenge(true)
    try {
      const payload = {
        ...challengeForm,
        scoring_category: challengeForm.scoring_category || null,
        invited_user_ids: challengeForm.is_private
          ? (challengeSelectionMode === 'all'
            ? allClients.map(c => c.id)
            : Array.from(challengeSelectedIds))
          : undefined,
      }
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setShowChallengeForm(false)
        fetchChallenges()
      }
    } catch {
      // silent
    } finally {
      setSavingChallenge(false)
    }
  }

  const openChallengeDetail = async (ch: Challenge) => {
    setSelectedChallenge(ch)
    setLoadingChallengeDetail(true)
    setChallengeLeaderboard([])
    try {
      const res = await fetch(`/api/challenges/${ch.id}`)
      const data = await res.json()
      if (data.success) {
        setChallengeLeaderboard(data.leaderboard || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingChallengeDetail(false)
    }
  }

  const toggleChallengeActive = async (ch: Challenge) => {
    try {
      await fetch('/api/admin/challenges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ch.id, is_active: !ch.is_active }),
      })
      fetchChallenges()
    } catch {
      // silent
    }
  }

  const getTypeLabel = (type: string) => {
    return RANKING_TYPES.find(t => t.value === type)?.label || type
  }

  const getCategoryLabel = (category: string | null) => {
    if (!category) return ''
    return CATEGORIES.find(c => c.value === category)?.label || category
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-dourado" />
            Rankings & Gamificacao
          </h1>
          <p className="text-foreground-secondary text-sm mt-1">
            Gerenciar rankings, pontuacao e bioimpedancia
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openBioModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-vinho text-white rounded-lg text-sm font-medium hover:bg-vinho/80 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Bioimpedancia
          </button>
          <button
            onClick={() => fetchBioAudit()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-vinho/30 text-vinho rounded-lg text-sm font-medium hover:bg-vinho/5 transition-colors"
          >
            <Activity className="w-4 h-4" />
            Pontos de Bio
          </button>
          <button
            onClick={openInstagramModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-cafe text-white rounded-lg text-sm font-medium hover:bg-cafe/80 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            #vivendofelice
          </button>
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2.5 bg-background-elevated text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Transacoes
          </button>
          <button
            onClick={openResync}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-vinho/30 text-vinho rounded-lg text-sm font-medium hover:bg-vinho/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reconstruir ranking
          </button>
          <button
            onClick={openChallengeAudit}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-vinho/30 text-vinho rounded-lg text-sm font-medium hover:bg-vinho/5 transition-colors"
          >
            <Search className="w-4 h-4" />
            Auditar desafio
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-dourado text-foreground rounded-lg text-sm font-medium hover:bg-dourado/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Ranking
          </button>
        </div>
      </div>

      {/* Rankings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-border rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <Trophy className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
          <p className="text-foreground-secondary">Nenhum ranking criado</p>
          <button onClick={openNew} className="mt-3 text-dourado text-sm font-medium hover:text-dourado/80">
            Criar primeiro ranking
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankings.map(ranking => (
            <div
              key={ranking.id}
              className={`bg-white border rounded-xl p-4 ${
                ranking.is_active ? 'border-dourado/30' : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-foreground font-semibold">{ranking.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-dourado/20 text-dourado font-medium">
                      {getTypeLabel(ranking.type)}
                    </span>
                    {ranking.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-vinho/20 text-vinho font-medium">
                        {getCategoryLabel(ranking.category)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(ranking)}
                    className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-secondary"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(ranking)}
                    className={`p-1.5 rounded-lg hover:bg-background-elevated ${
                      ranking.is_active ? 'text-green-400' : 'text-foreground-muted'
                    }`}
                  >
                    {ranking.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {ranking.description && (
                <p className="text-foreground-secondary text-sm mb-3 line-clamp-2">{ranking.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-foreground-muted">
                {ranking.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(ranking.start_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {ranking.end_date && (
                  <span>
                    ate {new Date(ranking.end_date).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ DESAFIOS SECTION ═══ */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Swords className="w-5 h-5 text-vinho" />
          Desafios
        </h2>
        <button
          onClick={openNewChallenge}
          className="flex items-center gap-2 px-4 py-2 bg-vinho text-white rounded-lg text-sm font-medium hover:bg-vinho/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Desafio
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-border">
          <Swords className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
          <p className="text-foreground-secondary text-sm">Nenhum desafio criado</p>
          <button onClick={openNewChallenge} className="mt-2 text-vinho text-sm font-medium hover:text-vinho/80">
            Criar primeiro desafio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map(ch => {
            const daysLeft = Math.ceil((new Date(ch.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            return (
              <div
                key={ch.id}
                onClick={() => openChallengeDetail(ch)}
                className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow ${ch.is_active ? 'border-vinho/30' : 'border-border opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-foreground font-semibold truncate">{ch.title}</h3>
                      {ch.is_private ? (
                        <Lock className="w-3.5 h-3.5 text-vinho shrink-0" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-vinho/15 text-vinho font-medium">
                        {CHALLENGE_TYPES.find(t => t.value === ch.challenge_type)?.label || ch.challenge_type}
                      </span>
                      {ch.is_private && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-foreground-muted/15 text-foreground-muted font-medium">
                          Privado
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleChallengeActive(ch) }}
                    className={`p-1.5 rounded-lg hover:bg-background-elevated ${ch.is_active ? 'text-green-400' : 'text-foreground-muted'}`}
                  >
                    {ch.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                </div>
                {ch.description && (
                  <p className="text-foreground-secondary text-sm mb-2 line-clamp-2">{ch.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {ch.participant_count} participantes
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {daysLeft > 0 ? `${daysLeft}d restantes` : 'Encerrado'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] border border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Swords className="w-5 h-5 text-vinho" />
                  {selectedChallenge.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-vinho/15 text-vinho font-medium">
                    {CHALLENGE_TYPES.find(t => t.value === selectedChallenge.challenge_type)?.label || selectedChallenge.challenge_type}
                  </span>
                  {selectedChallenge.is_private && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-foreground-muted/15 text-foreground-muted font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Privado
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedChallenge.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedChallenge.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedChallenge(null)} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            {/* Info */}
            <div className="p-4 border-b border-border space-y-2">
              {selectedChallenge.description && (
                <p className="text-sm text-foreground-secondary">{selectedChallenge.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-foreground-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedChallenge.start_date).toLocaleDateString('pt-BR')} — {new Date(selectedChallenge.end_date).toLocaleDateString('pt-BR')}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {selectedChallenge.participant_count} participantes
                </span>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 pb-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-dourado" />
                  Classificacao
                </h4>
              </div>
              {loadingChallengeDetail ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-background-elevated rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : challengeLeaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
                  <p className="text-sm text-foreground-secondary">Nenhum participante ainda</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {challengeLeaderboard.map(entry => (
                    <div key={entry.user_id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-8 text-center">
                        {entry.position === 1 ? (
                          <span className="text-yellow-400 text-lg">&#x1F451;</span>
                        ) : entry.position === 2 ? (
                          <span className="text-gray-400 text-lg">&#x1F948;</span>
                        ) : entry.position === 3 ? (
                          <span className="text-amber-600 text-lg">&#x1F949;</span>
                        ) : (
                          <span className="text-foreground-secondary font-bold text-sm">{entry.position}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">{entry.name}</span>
                      </div>
                      <span className="text-xs">
                        {entry.tier === 'platina' ? '💎' : entry.tier === 'ouro' ? '🥇' : entry.tier === 'prata' ? '🥈' : '🥉'}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-foreground">{entry.score}</span>
                        <span className="text-foreground-secondary text-xs ml-1">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex gap-2">
              <button
                onClick={() => { toggleChallengeActive(selectedChallenge); setSelectedChallenge(null) }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedChallenge.is_active
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {selectedChallenge.is_active ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Create Modal */}
      {showChallengeForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Swords className="w-5 h-5 text-vinho" />
                Novo Desafio
              </h3>
              <button onClick={() => setShowChallengeForm(false)} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Titulo *</label>
                <input
                  type="text"
                  value={challengeForm.title}
                  onChange={e => setChallengeForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-vinho/50"
                  placeholder="Ex: Desafio Marco Fitness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Descrição</label>
                <textarea
                  value={challengeForm.description}
                  onChange={e => setChallengeForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-vinho/50 resize-none"
                  placeholder="Quem acumula mais pontos..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Tipo</label>
                  <select
                    value={challengeForm.challenge_type}
                    onChange={e => setChallengeForm(f => ({ ...f, challenge_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                  >
                    {CHALLENGE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Categoria</label>
                  <select
                    value={challengeForm.scoring_category}
                    onChange={e => setChallengeForm(f => ({ ...f, scoring_category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                  >
                    {SCORING_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Inicio *</label>
                  <input
                    type="date"
                    value={challengeForm.start_date}
                    onChange={e => setChallengeForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Fim *</label>
                  <input
                    type="date"
                    value={challengeForm.end_date}
                    onChange={e => setChallengeForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                  />
                </div>
              </div>

              {/* Private Toggle */}
              <div className="flex items-center justify-between p-3 bg-background-elevated rounded-lg">
                <div className="flex items-center gap-2">
                  {challengeForm.is_private ? <Lock className="w-4 h-4 text-vinho" /> : <Globe className="w-4 h-4 text-foreground-muted" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {challengeForm.is_private ? 'Desafio Privado' : 'Desafio Publico'}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {challengeForm.is_private ? 'Apenas convidados podem ver e participar' : 'Todos os pacientes podem participar'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChallengeForm(f => ({ ...f, is_private: !f.is_private }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${challengeForm.is_private ? 'bg-vinho' : 'bg-border'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${challengeForm.is_private ? 'translate-x-5.5 left-0' : 'left-0.5'}`}
                    style={{ transform: challengeForm.is_private ? 'translateX(22px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {/* Participant Selection (shown when private) */}
              {challengeForm.is_private && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground-muted">Convidados</label>

                  <div className="flex gap-1 bg-background-elevated rounded-lg p-1">
                    {([
                      { mode: 'all' as SelectionMode, label: 'Todos', icon: Users },
                      { mode: 'manual' as SelectionMode, label: 'Selecionar', icon: UserCheck },
                    ]).map(({ mode, label, icon: Icon }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setChallengeSelectionMode(mode)
                          if (mode === 'all') setChallengeSelectedIds(new Set())
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          challengeSelectionMode === mode
                            ? 'bg-vinho text-white'
                            : 'text-foreground-secondary hover:text-foreground hover:bg-border'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {challengeSelectionMode === 'all' && (
                    <div className="bg-background-elevated rounded-lg p-3 text-center">
                      <Users className="w-7 h-7 text-vinho mx-auto mb-1" />
                      <p className="text-sm text-foreground-muted">Todos os {allClients.length} pacientes serao convidados</p>
                    </div>
                  )}

                  {challengeSelectionMode === 'manual' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
                        <input
                          type="text"
                          value={challengeClientSearch}
                          onChange={e => setChallengeClientSearch(e.target.value)}
                          placeholder="Buscar paciente..."
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                        />
                      </div>
                      <div className="bg-background-elevated rounded-lg max-h-48 overflow-y-auto">
                        {loadingClients ? (
                          <div className="p-3 text-center text-sm text-foreground-muted">Carregando...</div>
                        ) : (
                          <div className="divide-y divide-border">
                            <button
                              type="button"
                              onClick={() => {
                                if (challengeSelectedIds.size === allClients.length) {
                                  setChallengeSelectedIds(new Set())
                                } else {
                                  setChallengeSelectedIds(new Set(allClients.map(c => c.id)))
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-vinho hover:bg-white font-medium"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              {challengeSelectedIds.size === allClients.length ? 'Desmarcar todos' : 'Selecionar todos'}
                            </button>
                            {allClients
                              .filter(c =>
                                !challengeClientSearch ||
                                c.nome?.toLowerCase().includes(challengeClientSearch.toLowerCase()) ||
                                c.email?.toLowerCase().includes(challengeClientSearch.toLowerCase())
                              )
                              .map(c => (
                                <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={challengeSelectedIds.has(c.id)}
                                    onChange={e => {
                                      const next = new Set(challengeSelectedIds)
                                      if (e.target.checked) next.add(c.id)
                                      else next.delete(c.id)
                                      setChallengeSelectedIds(next)
                                    }}
                                    className="rounded border-border text-vinho focus:ring-vinho w-3.5 h-3.5"
                                  />
                                  <span className="text-sm text-foreground truncate">{c.nome || 'Sem nome'}</span>
                                  <span className="text-xs text-foreground-muted truncate ml-auto">{c.email}</span>
                                </label>
                              ))
                            }
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted text-right">
                        {challengeSelectedIds.size} paciente{challengeSelectedIds.size !== 1 ? 's' : ''} selecionado{challengeSelectedIds.size !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowChallengeForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-muted text-sm font-medium hover:bg-background-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveChallenge}
                  disabled={!challengeForm.title || !challengeForm.start_date || !challengeForm.end_date || savingChallenge || (challengeForm.is_private && challengeSelectionMode === 'manual' && challengeSelectedIds.size === 0)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-vinho text-white text-sm font-medium hover:bg-vinho/90 disabled:opacity-50 transition-colors"
                >
                  {savingChallenge ? 'Criando...' : 'Criar Desafio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {editingRanking ? 'Editar Ranking' : 'Novo Ranking'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingRanking(null) }} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  placeholder="Ex: Ranking Geral 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {RANKING_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Categoria</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Data Inicio</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                  placeholder="Descrição do ranking..."
                />
              </div>

              {!editingRanking && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground-muted">Participantes</label>

                  {/* Selection Mode Tabs */}
                  <div className="flex gap-1 bg-background-elevated rounded-lg p-1">
                    {([
                      { mode: 'all' as SelectionMode, label: 'Todos', icon: Users },
                      { mode: 'filter' as SelectionMode, label: 'Filtros', icon: Filter },
                      { mode: 'manual' as SelectionMode, label: 'Manual', icon: UserCheck },
                    ]).map(({ mode, label, icon: Icon }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setSelectionMode(mode)
                          if (mode === 'all') {
                            setSelectedClientIds(new Set())
                          }
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          selectionMode === mode
                            ? 'bg-dourado text-foreground'
                            : 'text-foreground-secondary hover:text-foreground hover:bg-border'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* All Mode */}
                  {selectionMode === 'all' && (
                    <div className="bg-background-elevated rounded-lg p-3 text-center">
                      <Users className="w-8 h-8 text-dourado mx-auto mb-1" />
                      <p className="text-sm text-foreground-muted">Todos os pacientes serao adicionados automaticamente</p>
                      <p className="text-xs text-foreground-muted mt-1">{allClients.length} pacientes cadastrados</p>
                    </div>
                  )}

                  {/* Filter Mode */}
                  {selectionMode === 'filter' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-foreground-secondary mb-1">Profissional</label>
                          <select
                            value={filterProfessionalId}
                            onChange={e => setFilterProfessionalId(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background-elevated text-foreground text-xs"
                          >
                            <option value="">Todos</option>
                            {professionals.map(p => (
                              <option key={p.id} value={p.id}>{p.display_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-foreground-secondary mb-1">Status</label>
                          <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-background-elevated text-foreground text-xs"
                          >
                            <option value="all">Todos</option>
                            <option value="active">Ativos (ultimos 7 dias)</option>
                            <option value="inactive">Inativos</option>
                          </select>
                        </div>
                      </div>

                      {/* Filtered client list with checkboxes */}
                      <div className="bg-background-elevated rounded-lg max-h-40 overflow-y-auto">
                        {loadingClients ? (
                          <div className="p-3 text-center text-sm text-foreground-muted">Carregando...</div>
                        ) : allClients.length === 0 ? (
                          <div className="p-3 text-center text-sm text-foreground-muted">Nenhum paciente encontrado</div>
                        ) : (
                          <div className="divide-y divide-border">
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedClientIds.size === allClients.length) {
                                  setSelectedClientIds(new Set())
                                } else {
                                  setSelectedClientIds(new Set(allClients.map(c => c.id)))
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dourado hover:bg-background-elevated font-medium"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              {selectedClientIds.size === allClients.length ? 'Desmarcar todos' : 'Selecionar todos filtrados'}
                            </button>
                            {allClients.map(c => (
                              <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-background-elevated cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedClientIds.has(c.id)}
                                  onChange={e => {
                                    const next = new Set(selectedClientIds)
                                    if (e.target.checked) next.add(c.id)
                                    else next.delete(c.id)
                                    setSelectedClientIds(next)
                                  }}
                                  className="rounded border-border text-dourado focus:ring-dourado w-3.5 h-3.5"
                                />
                                <span className="text-sm text-foreground truncate">{c.nome || 'Sem nome'}</span>
                                <span className="text-xs text-foreground-muted truncate ml-auto">{c.email}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted text-right">
                        {selectedClientIds.size} de {allClients.length} selecionados
                      </p>
                    </div>
                  )}

                  {/* Manual Mode */}
                  {selectionMode === 'manual' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={e => setClientSearch(e.target.value)}
                          placeholder="Buscar paciente por nome ou email..."
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                        />
                      </div>

                      <div className="bg-background-elevated rounded-lg max-h-48 overflow-y-auto">
                        {loadingClients ? (
                          <div className="p-3 text-center text-sm text-foreground-muted">Carregando...</div>
                        ) : (
                          <div className="divide-y divide-border">
                            {allClients
                              .filter(c =>
                                !clientSearch ||
                                c.nome?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                c.email?.toLowerCase().includes(clientSearch.toLowerCase())
                              )
                              .map(c => (
                                <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-background-elevated cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedClientIds.has(c.id)}
                                    onChange={e => {
                                      const next = new Set(selectedClientIds)
                                      if (e.target.checked) next.add(c.id)
                                      else next.delete(c.id)
                                      setSelectedClientIds(next)
                                    }}
                                    className="rounded border-border text-dourado focus:ring-dourado w-3.5 h-3.5"
                                  />
                                  <span className="text-sm text-foreground truncate">{c.nome || 'Sem nome'}</span>
                                  <span className="text-xs text-foreground-muted truncate ml-auto">{c.email}</span>
                                </label>
                              ))
                            }
                            {allClients.filter(c =>
                              !clientSearch ||
                              c.nome?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                              c.email?.toLowerCase().includes(clientSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="p-3 text-center text-sm text-foreground-muted">
                                {clientSearch ? 'Nenhum resultado para a busca' : 'Nenhum paciente cadastrado'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted text-right">
                        {selectedClientIds.size} paciente{selectedClientIds.size !== 1 ? 's' : ''} selecionado{selectedClientIds.size !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowForm(false); setEditingRanking(null) }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-muted text-sm font-medium hover:bg-background-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-foreground text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bioimpedance Points Modal */}
      {showBioModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-dourado" />
                Pontos Bioimpedancia
              </h3>
              <button onClick={() => setShowBioModal(false)} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Paciente *</label>
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                >
                  <option value="">Selecione</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nome || c.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">
                  Pontos: {bioPoints}
                </label>
                <input
                  type="range"
                  min={20}
                  max={50}
                  step={5}
                  value={bioPoints}
                  onChange={e => setBioPoints(parseInt(e.target.value))}
                  className="w-full accent-dourado"
                />
                <div className="flex justify-between text-xs text-foreground-muted">
                  <span>20</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Justificativa *</label>
                <textarea
                  value={bioReason}
                  onChange={e => setBioReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                  placeholder="Ex: Reducao de 2% gordura corporal"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBioModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-muted text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={awardBioPoints}
                  disabled={!selectedClient || !bioReason || awardingBio}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-foreground text-sm font-medium disabled:opacity-50"
                >
                  {awardingBio ? 'Atribuindo...' : `Atribuir ${bioPoints} pts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Validation Modal */}
      {showInstagramModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Instagram className="w-5 h-5 text-dourado" />
                Validar #vivendofelice
              </h3>
              <button
                onClick={() => {
                  setShowInstagramModal(false)
                  setInstagramClient('')
                  setInstagramFeedback(null)
                }}
                className="p-2 hover:bg-background-elevated rounded-lg"
              >
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-foreground-muted">
                Atribui 5 pts ao paciente após validar o post no Instagram com a hashtag <span className="text-vinho font-semibold">#vivendofelice</span>. Limite de 1 validação por paciente por dia.
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Paciente *</label>
                <select
                  value={instagramClient}
                  onChange={e => setInstagramClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
                >
                  <option value="">Selecione</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nome || c.email}</option>
                  ))}
                </select>
              </div>

              {instagramFeedback && (
                <div
                  className={`rounded-lg p-3 text-xs ${
                    instagramFeedback.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/30 text-green-700'
                      : 'bg-red-500/10 border border-red-500/30 text-red-600'
                  }`}
                >
                  {instagramFeedback.message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowInstagramModal(false)
                    setInstagramClient('')
                    setInstagramFeedback(null)
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-muted text-sm"
                >
                  Fechar
                </button>
                <button
                  onClick={validateInstagramPost}
                  disabled={!instagramClient || validatingInstagram}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-foreground text-sm font-medium disabled:opacity-50"
                >
                  {validatingInstagram ? 'Validando...' : 'Validar +5 pts'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reconstrução do ranking (resync) — preview + aplicar */}
      {showResync && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] border border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-vinho" />
                  Reconstruir ranking
                </h3>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Recalcula os totais a partir do extrato de pontos (remove PR fantasma e excesso de feed). Confira o antes → depois antes de aplicar.
                </p>
              </div>
              <button onClick={() => setShowResync(false)} className="p-2 hover:bg-background-elevated rounded-lg" aria-label="Fechar">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            {resyncError && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {resyncError}
              </div>
            )}

            {resyncDone && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
                {resyncDone}
              </div>
            )}

            {resyncPreview && !loadingResync && (
              <div className="p-4 border-b border-border flex items-center gap-4 flex-wrap text-sm">
                <span className="text-foreground-secondary">
                  PR fantasma: <strong className="text-foreground">{resyncPreview.remocoes.pr_fantasma.transacoes}</strong> (−{resyncPreview.remocoes.pr_fantasma.pontos} pts)
                </span>
                <span className="text-foreground-secondary">
                  Excesso de feed: <strong className="text-foreground">{resyncPreview.remocoes.feed_excedente.transacoes}</strong> (−{resyncPreview.remocoes.feed_excedente.pontos} pts)
                </span>
                <span className="text-foreground-secondary">
                  Participantes alterados: <strong className="text-foreground">{resyncPreview.participantes_alterados}</strong>
                </span>
                <button
                  onClick={handleApplyResync}
                  disabled={applyingResync}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-vinho text-white rounded-lg text-sm font-medium hover:bg-vinho/80 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${applyingResync ? 'animate-spin' : ''}`} />
                  {applyingResync ? 'Aplicando...' : 'Aplicar reconstrução'}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {loadingResync ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 bg-background-elevated rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : resyncDone ? (
                <p className="text-center text-foreground-muted py-8">Reconstrução aplicada. Você pode fechar esta janela.</p>
              ) : !resyncPreview ? null : resyncPreview.mudancas.length === 0 ? (
                <p className="text-center text-green-600 py-8 font-medium">✓ Nada a corrigir — os totais já batem com o extrato.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-foreground-secondary border-b border-border">
                        <th className="py-2 pr-3 font-medium">Paciente</th>
                        <th className="py-2 px-3 font-medium text-right">Antes</th>
                        <th className="py-2 px-3 font-medium text-right">Depois</th>
                        <th className="py-2 pl-3 font-medium text-right">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resyncPreview.mudancas.map((m, i) => {
                        const delta = m.after - m.before
                        return (
                          <tr key={`${m.ranking_id}-${m.user_id}-${i}`} className="border-b border-border/60">
                            <td className="py-2 pr-3 text-foreground">{m.nome}</td>
                            <td className="py-2 px-3 text-right text-foreground-secondary">{m.before}</td>
                            <td className="py-2 px-3 text-right text-foreground">{m.after}</td>
                            <td className={`py-2 pl-3 text-right font-medium ${delta < 0 ? 'text-red-600' : delta > 0 ? 'text-green-600' : 'text-foreground-muted'}`}>
                              {delta > 0 ? '+' : ''}{delta}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auditoria do desafio (só leitura) */}
      {showAudit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] border border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Search className="w-5 h-5 text-vinho" />
                  Auditoria do desafio
                </h3>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Detalhamento dos pontos de cada participante no período + bandeiras de possível farm. Nada é gravado — é só para decidir a premiação.
                </p>
              </div>
              <button onClick={() => setShowAudit(false)} className="p-2 hover:bg-background-elevated rounded-lg" aria-label="Fechar">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            <div className="p-4 border-b border-border">
              <select
                value={auditChallengeId}
                onChange={(e) => runChallengeAudit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm text-foreground"
              >
                <option value="">Selecione um desafio…</option>
                {auditChallenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.start_date} → {c.end_date}){c.is_active === false ? ' — inativo' : ''}
                  </option>
                ))}
              </select>
            </div>

            {auditError && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {auditError}
              </div>
            )}

            {auditData && !loadingAudit && (
              <div className="px-4 py-3 border-b border-border text-sm text-foreground-secondary flex flex-wrap gap-x-4 gap-y-1">
                <span>{auditData.resumo?.participantes ?? 0} participante(s)</span>
                <span className={(auditData.resumo?.com_bandeira ?? 0) > 0 ? 'text-amber-600 font-medium' : 'text-green-600 font-medium'}>
                  {auditData.resumo?.com_bandeira ?? 0} com bandeira
                </span>
                {auditData.challenge.scoring_category && (
                  <span>categoria: <strong className="text-foreground">{auditData.challenge.scoring_category}</strong></span>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {loadingAudit ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 bg-background-elevated rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : !auditData ? (
                <p className="text-center text-foreground-muted py-8">Selecione um desafio acima para auditar.</p>
              ) : auditData.participants.length === 0 ? (
                <p className="text-center text-foreground-muted py-8">Este desafio não tem participantes.</p>
              ) : (
                <div className="space-y-2">
                  {auditData.participants.map((p, idx) => {
                    const aberto = expandedAuditUser === p.user_id
                    return (
                      <div key={p.user_id} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => { setExpandedAuditUser(aberto ? null : p.user_id); setExpandedAuditDay(null) }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-background-elevated text-left"
                        >
                          <span className="text-sm font-medium text-foreground-muted w-7 shrink-0">{idx + 1}º</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground truncate">{p.nome}</span>
                              {p.flags.some(f => f.level === 'alto') ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                                  <AlertTriangle className="w-3 h-3" /> suspeito
                                </span>
                              ) : p.flags.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                                  <AlertTriangle className="w-3 h-3" /> conferir
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-foreground-secondary">
                              <strong className="text-foreground">{p.score} pts</strong> no desafio · máx {p.maxDayPoints}/dia
                              {p.totalAll !== p.score ? ` · ${p.totalAll} no total` : ''}
                            </div>
                          </div>
                          {aberto ? (
                            <ChevronDown className="w-4 h-4 text-foreground-muted shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-foreground-muted shrink-0" />
                          )}
                        </button>
                        {aberto && (
                          <div className="p-3 border-t border-border bg-background-elevated/40 space-y-3">
                            {/* Chips de resumo */}
                            <div className="flex flex-wrap gap-1.5 text-xs">
                              <span className="px-2 py-1 rounded-md bg-white border border-border text-foreground-secondary">Máx <strong className="text-foreground">{p.maxDayPoints}</strong> pts/dia</span>
                              <span className={`px-2 py-1 rounded-md border ${p.activityExcess > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-border text-foreground-secondary'}`}>
                                {p.activityCount} atividade(s){p.activityExcess > 0 ? ` · ${p.activityExcess} além do cap` : ''}
                              </span>
                              {p.streakCount > 0 && (
                                <span className="px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700">{p.streakCount} bônus de streak</span>
                              )}
                            </div>

                            {/* Bandeiras */}
                            {p.flags.length > 0 && (
                              <div className="space-y-1">
                                {p.flags.map((f, i) => (
                                  <div key={i} className={`text-xs flex items-start gap-1.5 ${f.level === 'alto' ? 'text-red-600' : 'text-amber-600'}`}>
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                    <span>{f.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Pontos lançados à mão — QUEM deu (Instagram, bônus, bio manual…) */}
                            {p.manualAwards.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-foreground-secondary mb-1.5">
                                  Pontos lançados à mão <span className="text-foreground-muted font-normal">(quem deu)</span>
                                </p>
                                <div className="space-y-1">
                                  {p.manualAwards.map((m, i) => {
                                    const [myy, mmm, mdd] = m.date.split('-')
                                    return (
                                      <div key={i} className="flex items-center justify-between gap-2 text-xs rounded-md border border-border bg-white px-2.5 py-1.5">
                                        <div className="min-w-0">
                                          <span className="text-foreground">{m.reason}</span>
                                          <span className="text-foreground-muted"> · {mdd}/{mmm}/{myy}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                          <span className="text-foreground-secondary">por <strong className="text-foreground">{m.awarderName || '—'}</strong></span>
                                          <span className="text-foreground font-medium">{m.points} pts</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Dia a dia — a unidade de verificação. Clique num dia para ver o que aconteceu. */}
                            <div>
                              <p className="text-xs font-medium text-foreground-secondary mb-1.5">
                                Dia a dia <span className="text-foreground-muted font-normal">(clique num dia para ver o que rendeu os pontos)</span>
                              </p>
                              <div className="space-y-1">
                                {p.days.map((day) => {
                                  const dayKey = `${p.user_id}|${day.date}`
                                  const dayOpen = expandedAuditDay === dayKey
                                  const [yy, mm, dd] = day.date.split('-')
                                  return (
                                    <div key={dayKey} className={`rounded-lg border ${day.suspicious ? 'border-red-200 bg-red-50/40' : 'border-border bg-white'}`}>
                                      <button
                                        onClick={() => setExpandedAuditDay(dayOpen ? null : dayKey)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left"
                                      >
                                        {day.suspicious ? (
                                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                        ) : (
                                          <span className="w-3.5 shrink-0" />
                                        )}
                                        <span className="text-sm text-foreground">{dd}/{mm}/{yy}</span>
                                        {day.activities > 2 && (
                                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">{day.activities} atividades</span>
                                        )}
                                        <span className="ml-auto text-sm font-semibold text-foreground">{day.points} pts</span>
                                        {dayOpen ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                                        )}
                                      </button>
                                      {dayOpen && (
                                        <div className="px-3 pb-2 pt-1 border-t border-border/60 space-y-0.5">
                                          {day.items.map((it, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                              <span className="text-foreground-secondary">
                                                {it.reason} <span className="text-foreground-muted">×{it.count}</span>
                                              </span>
                                              <span className="text-foreground font-medium">{it.points} pts</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {/* Conferência dos pontos de bioimpedância por paciente */}
      {showBioAudit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[88vh] border border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-vinho" />
                  Pontos de Bioimpedância
                </h3>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Pontos lançados x o que a fórmula atual calcula. Clique num paciente para ver medição por medição.
                </p>
              </div>
              <button onClick={() => setShowBioAudit(false)} className="p-2 hover:bg-background-elevated rounded-lg" aria-label="Fechar">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            {bioAudit && !loadingBioAudit && (
              <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-foreground-secondary">
                    Lançado: <strong className="text-foreground">{bioAudit.totais.concedido} pts</strong>
                  </span>
                  <span className="text-foreground-secondary">
                    Calculado: <strong className="text-foreground">{bioAudit.totais.esperado} pts</strong>
                  </span>
                  <span className={bioAudit.totais.diferenca === 0 ? 'text-green-600' : 'text-amber-600'}>
                    Diferença: <strong>{bioAudit.totais.diferenca > 0 ? '+' : ''}{bioAudit.totais.diferenca} pts</strong>
                  </span>
                </div>
                {bioAudit.totais.divergentes > 0 ? (
                  <button
                    onClick={handleRecalcBio}
                    disabled={recalculatingBio}
                    className="ml-auto flex items-center gap-2 px-4 py-2 bg-vinho text-white rounded-lg text-sm font-medium hover:bg-vinho/80 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${recalculatingBio ? 'animate-spin' : ''}`} />
                    {recalculatingBio ? 'Recalculando...' : `Recalcular (${bioAudit.totais.divergentes})`}
                  </button>
                ) : (
                  <span className="ml-auto text-sm text-green-600 font-medium">✓ Tudo conferido</span>
                )}
              </div>
            )}

            {bioAuditError && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {bioAuditError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {loadingBioAudit ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-14 bg-background-elevated rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : !bioAudit || bioAudit.pacientes.length === 0 ? (
                <p className="text-center text-foreground-muted py-8">Nenhuma bioimpedância registrada</p>
              ) : (
                <div className="space-y-2">
                  {bioAudit.pacientes.map(p => {
                    const aberto = expandedPatient === p.user_id
                    return (
                      <div key={p.user_id} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedPatient(aberto ? null : p.user_id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-background-elevated transition-colors text-left"
                          aria-expanded={aberto}
                        >
                          {aberto
                            ? <ChevronDown className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                            : <ChevronRight className="w-4 h-4 text-foreground-muted flex-shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground truncate">
                              {p.nome}
                              {!p.ativo && <span className="ml-2 text-[10px] uppercase text-foreground-muted">inativo</span>}
                              {p.role && p.role !== 'client' && (
                                <span className="ml-2 text-[10px] uppercase text-foreground-muted">{p.role}</span>
                              )}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              {p.medicoes} {p.medicoes === 1 ? 'medição' : 'medições'}
                              {p.registros.some(r => r.revisar) && (
                                <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                                  <AlertTriangle className="w-3 h-3" />
                                  revisar
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`font-bold ${p.concedido < 0 ? 'text-red-500' : 'text-dourado'}`}>
                              {p.concedido > 0 ? '+' : ''}{p.concedido}
                            </span>
                            {p.diferenca !== 0 && (
                              <span className="block text-xs text-amber-600">
                                calculado: {p.esperado > 0 ? '+' : ''}{p.esperado}
                              </span>
                            )}
                          </div>
                        </button>

                        {aberto && (
                          <div className="border-t border-border bg-background-elevated/40 divide-y divide-border">
                            {p.registros.length === 0 ? (
                              <p className="text-xs text-foreground-muted p-3">
                                Nenhuma medição pontuável (a primeira medição não pontua — não há anterior para comparar).
                              </p>
                            ) : p.registros.map(r => (
                              <div key={r.id} className="p-3 flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-foreground">
                                    {new Date(`${r.data}T12:00:00`).toLocaleDateString('pt-BR')}
                                    {r.fonte && <span className="ml-2 text-foreground-muted">{r.fonte}</span>}
                                  </p>
                                  <p className="text-xs text-foreground-secondary">{r.motivo}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className={`text-sm font-semibold ${r.concedido < 0 ? 'text-red-500' : 'text-foreground'}`}>
                                    {r.concedido > 0 ? '+' : ''}{r.concedido}
                                  </span>
                                  {r.diferenca !== 0 && (
                                    <span className="block text-[11px] text-amber-600">
                                      deveria ser {r.esperado > 0 ? '+' : ''}{r.esperado}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {bioAudit.orfas.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs font-medium text-amber-800 mb-1">
                        {bioAudit.orfas.length} transação(ões) sem medição de origem
                      </p>
                      {bioAudit.orfas.map(o => (
                        <p key={o.id} className="text-xs text-amber-700">
                          {o.nome}: {o.points > 0 ? '+' : ''}{o.points} — {o.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTransactions && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] border border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Transacoes de Pontos</h3>
              <button onClick={() => setShowTransactions(false)} className="p-2 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchTransactions()}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background-elevated text-foreground text-sm"
                  placeholder="Buscar por nome..."
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingTransactions ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-14 bg-background-elevated rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-foreground-muted py-8">Nenhuma transacao encontrada</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-background-elevated rounded-lg">
                      <div>
                        <p className="text-sm text-foreground">{tx.user_name || tx.user_id.substring(0, 8)}</p>
                        <p className="text-xs text-foreground-secondary">{tx.reason}</p>
                        <p className="text-xs text-foreground-muted">
                          {new Date(tx.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        {/* bioimpedância pode ser negativa — não force o "+" */}
                        <span className={`font-bold ${tx.points < 0 ? 'text-red-500' : 'text-dourado'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </span>
                        <span className="block text-xs text-foreground-muted">{tx.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
