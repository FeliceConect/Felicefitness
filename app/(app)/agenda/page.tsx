'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Calendar, Clock, History } from 'lucide-react'
import { AppointmentCard } from './components/appointment-card'
import type { AppointmentWithDetails } from '@/types/appointments'

type Tab = 'upcoming' | 'history'

export default function AgendaPage() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [upcoming, setUpcoming] = useState<AppointmentWithDetails[]>([])
  const [history, setHistory] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const todayRef = useRef(new Date().toISOString().split('T')[0])
  const today = todayRef.current

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const [upRes, histRes] = await Promise.all([
        fetch(`/api/appointments?status=scheduled,confirmed,reschedule_requested&dateFrom=${today}`),
        fetch(`/api/appointments?status=completed,cancelled,no_show`),
      ])

      const upData = await upRes.json()
      const histData = await histRes.json()

      if (upData.success) setUpcoming(upData.data || [])
      if (histData.success) setHistory(histData.data || [])
    } catch (err) {
      console.error('Erro ao carregar agenda:', err)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}/confirm`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        showToast('Presença confirmada!', 'success')
        await fetchAppointments()
      } else {
        showToast(data.error || 'Erro ao confirmar', 'error')
      }
    } catch {
      showToast('Erro de conexão', 'error')
    }
  }

  const handleReschedule = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('Solicitação de reagendamento enviada', 'success')
        await fetchAppointments()
      } else {
        showToast(data.error || 'Erro ao solicitar reagendamento', 'error')
      }
    } catch {
      showToast('Erro de conexão', 'error')
    }
  }

  const currentList = tab === 'upcoming' ? upcoming : history

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-[60] p-3 rounded-xl text-sm font-medium text-center transition-all shadow-lg ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-error text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <h1 className="font-heading font-bold text-lg text-foreground">Agenda</h1>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-1 pb-3">
          <button
            onClick={() => setTab('upcoming')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'upcoming'
                ? 'bg-dourado text-white'
                : 'bg-background-elevated text-foreground-secondary hover:bg-border'
            }`}
          >
            <Clock className="w-4 h-4" />
            Próximas
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'history'
                ? 'bg-dourado text-white'
                : 'bg-background-elevated text-foreground-secondary hover:bg-border'
            }`}
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <AgendaSkeleton />
        ) : currentList.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          currentList.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onConfirm={handleConfirm}
              onReschedule={handleReschedule}
              isHistory={tab === 'history'}
            />
          ))
        )}
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-dourado/10 flex items-center justify-center mb-6">
        <Calendar className="w-8 h-8 text-dourado" />
      </div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-2">
        {tab === 'upcoming' ? 'Nenhuma consulta agendada' : 'Nenhuma consulta no histórico'}
      </h2>
      <p className="text-foreground-secondary text-sm max-w-xs">
        {tab === 'upcoming'
          ? 'Quando a equipe agendar suas consultas, elas aparecerão aqui.'
          : 'Suas consultas realizadas e canceladas aparecerão aqui.'}
      </p>
    </div>
  )
}

function AgendaSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-border rounded-2xl p-4 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background-elevated" />
              <div>
                <div className="h-4 w-32 bg-background-elevated rounded mb-1" />
                <div className="h-3 w-20 bg-background-elevated rounded" />
              </div>
            </div>
            <div className="h-5 w-16 bg-background-elevated rounded-full" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-4 w-48 bg-background-elevated rounded" />
            <div className="h-4 w-28 bg-background-elevated rounded" />
            <div className="h-4 w-36 bg-background-elevated rounded" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <div className="h-7 w-24 bg-background-elevated rounded-lg" />
            <div className="h-7 w-24 bg-background-elevated rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
