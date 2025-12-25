"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  Utensils,
  Droplets,
  Pill,
  Moon,
  Trophy,
  Clock,
  Bell,
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react'
import type { NotificationPreferences } from '@/types/notifications'
import { cn } from '@/lib/utils'

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences
  onChange: (prefs: Partial<NotificationPreferences>) => void
  disabled?: boolean
}

interface PreferenceRowProps {
  icon: React.ReactNode
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
  children?: React.ReactNode
  disabled?: boolean
}

function PreferenceRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  children,
  disabled
}: PreferenceRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          enabled ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-800 text-slate-500'
        )}>
          {icon}
        </div>

        <div className="flex-1">
          <p className={cn('font-medium', enabled ? 'text-white' : 'text-slate-400')}>
            {label}
          </p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            disabled={disabled}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              enabled ? 'bg-violet-500' : 'bg-slate-700'
            )}
          >
            <motion.div
              animate={{ x: enabled ? 22 : 2 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full"
            />
          </button>

          {children && (
            <ChevronRight className={cn(
              'w-5 h-5 text-slate-500 transition-transform',
              expanded && 'rotate-90'
            )} />
          )}
        </div>
      </button>

      {children && expanded && enabled && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-[#2E2E3E] p-4"
        >
          {children}
        </motion.div>
      )}
    </div>
  )
}

interface TimeInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function TimeInput({ label, value, onChange, disabled }: TimeInputProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-[#0A0A0F] border border-[#2E2E3E] rounded-lg px-3 py-1.5 text-white text-sm"
      />
    </div>
  )
}

interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  disabled?: boolean
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  disabled
}: NumberInputProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={disabled || value <= min}
          className="w-8 h-8 rounded-lg bg-[#0A0A0F] border border-[#2E2E3E] flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-50"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-16 text-center text-white font-medium">
          {value}{suffix}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={disabled || value >= max}
          className="w-8 h-8 rounded-lg bg-[#0A0A0F] border border-[#2E2E3E] flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function NotificationPreferencesForm({
  preferences,
  onChange,
  disabled
}: NotificationPreferencesFormProps) {
  const updateTreino = (updates: Partial<typeof preferences.treino>) => {
    onChange({ treino: { ...preferences.treino, ...updates } })
  }

  const updateAgua = (updates: Partial<typeof preferences.agua>) => {
    onChange({ agua: { ...preferences.agua, ...updates } })
  }

  const updateMedicamento = (updates: Partial<typeof preferences.medicamento>) => {
    onChange({ medicamento: { ...preferences.medicamento, ...updates } })
  }

  const updateSono = (updates: Partial<typeof preferences.sono>) => {
    onChange({ sono: { ...preferences.sono, ...updates } })
  }

  const updateQuietHours = (updates: Partial<typeof preferences.quietHours>) => {
    onChange({ quietHours: { ...preferences.quietHours, ...updates } })
  }

  return (
    <div className="space-y-3">
      {/* Master toggle */}
      <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-white font-medium">Notificações</p>
              <p className="text-xs text-slate-400">Ativar ou desativar todas</p>
            </div>
          </div>
          <button
            onClick={() => onChange({ enabled: !preferences.enabled })}
            disabled={disabled}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              preferences.enabled ? 'bg-violet-500' : 'bg-slate-700'
            )}
          >
            <motion.div
              animate={{ x: preferences.enabled ? 22 : 2 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full"
            />
          </button>
        </div>
      </div>

      {/* Individual preferences */}
      <div className={cn(
        'space-y-3 transition-opacity',
        !preferences.enabled && 'opacity-50 pointer-events-none'
      )}>
        {/* Treino */}
        <PreferenceRow
          icon={<Dumbbell className="w-5 h-5" />}
          label="Treino"
          description="Lembretes antes do treino"
          enabled={preferences.treino.enabled}
          onToggle={() => updateTreino({ enabled: !preferences.treino.enabled })}
          disabled={disabled}
        >
          <NumberInput
            label="Lembrar antes"
            value={preferences.treino.beforeMinutes}
            onChange={(v) => updateTreino({ beforeMinutes: v })}
            min={5}
            max={120}
            step={5}
            suffix="min"
            disabled={disabled}
          />
        </PreferenceRow>

        {/* Refeição */}
        <PreferenceRow
          icon={<Utensils className="w-5 h-5" />}
          label="Refeições"
          description="Lembretes nos horários das refeições"
          enabled={preferences.refeicao.enabled}
          onToggle={() => onChange({
            refeicao: { ...preferences.refeicao, enabled: !preferences.refeicao.enabled }
          })}
          disabled={disabled}
        />

        {/* Água */}
        <PreferenceRow
          icon={<Droplets className="w-5 h-5" />}
          label="Hidratação"
          description="Lembretes para beber água"
          enabled={preferences.agua.enabled}
          onToggle={() => updateAgua({ enabled: !preferences.agua.enabled })}
          disabled={disabled}
        >
          <div className="space-y-3">
            <NumberInput
              label="Intervalo"
              value={preferences.agua.intervalMinutes}
              onChange={(v) => updateAgua({ intervalMinutes: v })}
              min={30}
              max={180}
              step={15}
              suffix="min"
              disabled={disabled}
            />
            <TimeInput
              label="Início"
              value={preferences.agua.startTime}
              onChange={(v) => updateAgua({ startTime: v })}
              disabled={disabled}
            />
            <TimeInput
              label="Fim"
              value={preferences.agua.endTime}
              onChange={(v) => updateAgua({ endTime: v })}
              disabled={disabled}
            />
          </div>
        </PreferenceRow>

        {/* Medicamento */}
        <PreferenceRow
          icon={<Pill className="w-5 h-5" />}
          label="Medicamento"
          description="Lembrete do Revolade"
          enabled={preferences.medicamento.enabled}
          onToggle={() => updateMedicamento({ enabled: !preferences.medicamento.enabled })}
          disabled={disabled}
        >
          <TimeInput
            label="Horário"
            value={preferences.medicamento.times[0] || '09:00'}
            onChange={(v) => updateMedicamento({ times: [v] })}
            disabled={disabled}
          />
        </PreferenceRow>

        {/* Sono */}
        <PreferenceRow
          icon={<Moon className="w-5 h-5" />}
          label="Sono"
          description="Lembretes de descanso"
          enabled={preferences.sono.enabled}
          onToggle={() => updateSono({ enabled: !preferences.sono.enabled })}
          disabled={disabled}
        >
          <div className="space-y-3">
            <TimeInput
              label="Hora de dormir"
              value={preferences.sono.bedtimeReminder}
              onChange={(v) => updateSono({ bedtimeReminder: v })}
              disabled={disabled}
            />
            <TimeInput
              label="Hora de acordar"
              value={preferences.sono.wakeupReminder}
              onChange={(v) => updateSono({ wakeupReminder: v })}
              disabled={disabled}
            />
          </div>
        </PreferenceRow>

        {/* Conquistas */}
        <PreferenceRow
          icon={<Trophy className="w-5 h-5" />}
          label="Conquistas"
          description="Notificações de achievements"
          enabled={preferences.conquistas.enabled}
          onToggle={() => onChange({
            conquistas: { enabled: !preferences.conquistas.enabled }
          })}
          disabled={disabled}
        />

        {/* Horário silencioso */}
        <PreferenceRow
          icon={<Clock className="w-5 h-5" />}
          label="Horário Silencioso"
          description="Pausar notificações à noite"
          enabled={preferences.quietHours.enabled}
          onToggle={() => updateQuietHours({ enabled: !preferences.quietHours.enabled })}
          disabled={disabled}
        >
          <div className="space-y-3">
            <TimeInput
              label="Início"
              value={preferences.quietHours.start}
              onChange={(v) => updateQuietHours({ start: v })}
              disabled={disabled}
            />
            <TimeInput
              label="Fim"
              value={preferences.quietHours.end}
              onChange={(v) => updateQuietHours({ end: v })}
              disabled={disabled}
            />
          </div>
        </PreferenceRow>
      </div>
    </div>
  )
}
