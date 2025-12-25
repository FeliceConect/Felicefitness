'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { NewSupplement, Supplement, SupplementType } from '@/types/supplements'
import {
  SUPPLEMENT_TYPES,
  FREQUENCY_OPTIONS,
  MEAL_RELATION_OPTIONS,
  PRIORITY_OPTIONS,
  RESTRICTION_OPTIONS,
  COLOR_OPTIONS,
  WEEKDAYS,
} from '@/types/supplements'
import { Plus, Minus, Save, X } from 'lucide-react'

interface SupplementFormProps {
  supplement?: Supplement
  onSubmit: (data: NewSupplement) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  className?: string
}

export function SupplementForm({
  supplement,
  onSubmit,
  onCancel,
  isLoading,
  className,
}: SupplementFormProps) {
  const [formData, setFormData] = useState<NewSupplement>({
    nome: supplement?.nome || '',
    tipo: supplement?.tipo || 'vitamina',
    dosagem: supplement?.dosagem || '',
    frequencia: supplement?.frequencia || 'diario',
    horarios: supplement?.horarios || ['08:00'],
    dias_semana: supplement?.dias_semana || [0, 1, 2, 3, 4, 5, 6],
    com_refeicao: supplement?.com_refeicao || 'indiferente',
    prioridade: supplement?.prioridade || 'media',
    cor: supplement?.cor || '#3B82F6',
    quantidade_estoque: supplement?.quantidade_estoque || 0,
    alerta_estoque_minimo: supplement?.alerta_estoque_minimo || 10,
    restricoes: supplement?.restricoes || [],
    notas: supplement?.notas || '',
    ativo: supplement?.ativo ?? true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.dosagem.trim()) {
      newErrors.dosagem = 'Dosagem é obrigatória'
    }

    if (formData.horarios.length === 0) {
      newErrors.horarios = 'Pelo menos um horário é obrigatório'
    }

    if (formData.frequencia === 'dias_especificos' && formData.dias_semana?.length === 0) {
      newErrors.dias_semana = 'Selecione pelo menos um dia'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      await onSubmit(formData)
    }
  }

  const addHorario = () => {
    setFormData(prev => ({
      ...prev,
      horarios: [...prev.horarios, '12:00'],
    }))
  }

  const removeHorario = (index: number) => {
    setFormData(prev => ({
      ...prev,
      horarios: prev.horarios.filter((_, i) => i !== index),
    }))
  }

  const updateHorario = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: prev.horarios.map((h, i) => (i === index ? value : h)),
    }))
  }

  const toggleDiaSemana = (day: number) => {
    setFormData(prev => ({
      ...prev,
      dias_semana: prev.dias_semana?.includes(day)
        ? prev.dias_semana.filter(d => d !== day)
        : [...(prev.dias_semana || []), day].sort(),
    }))
  }

  const toggleRestricao = (restricao: string) => {
    setFormData(prev => ({
      ...prev,
      restricoes: prev.restricoes?.includes(restricao)
        ? prev.restricoes.filter(r => r !== restricao)
        : [...(prev.restricoes || []), restricao],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Suplemento *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Vitamina D3"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value as SupplementType }))}
                className="w-full h-10 rounded-md border bg-background px-3"
              >
                {SUPPLEMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <select
                id="prioridade"
                value={formData.prioridade}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    prioridade: e.target.value as 'alta' | 'media' | 'baixa',
                  }))
                }
                className="w-full h-10 rounded-md border bg-background px-3"
              >
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosagem">Dosagem *</Label>
            <Input
              id="dosagem"
              value={formData.dosagem}
              onChange={e => setFormData(prev => ({ ...prev, dosagem: e.target.value }))}
              placeholder="Ex: 2000 UI, 1 cápsula, 5g"
              className={errors.dosagem ? 'border-red-500' : ''}
            />
            {errors.dosagem && <p className="text-sm text-red-500">{errors.dosagem}</p>}
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, cor: color }))}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    formData.cor === color ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Frequência</Label>
            <select
              value={formData.frequencia}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  frequencia: e.target.value as 'diario' | 'dias_especificos' | 'quando_necessario',
                }))
              }
              className="w-full h-10 rounded-md border bg-background px-3"
            >
              {FREQUENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Weekday selector */}
          {formData.frequencia === 'dias_especificos' && (
            <div className="space-y-2">
              <Label>Dias da Semana</Label>
              <div className="flex gap-1">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDiaSemana(day.value)}
                    className={cn(
                      'w-10 h-10 rounded-full text-sm font-medium transition-colors',
                      formData.dias_semana?.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              {errors.dias_semana && <p className="text-sm text-red-500">{errors.dias_semana}</p>}
            </div>
          )}

          {/* Time slots */}
          {formData.frequencia !== 'quando_necessario' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Horários</Label>
                <Button type="button" variant="outline" size="sm" onClick={addHorario}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {formData.horarios.map((horario, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={horario}
                      onChange={e => updateHorario(index, e.target.value)}
                      className="flex-1"
                    />
                    {formData.horarios.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHorario(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.horarios && <p className="text-sm text-red-500">{errors.horarios}</p>}
            </div>
          )}

          {/* Meal relation */}
          <div className="space-y-2">
            <Label>Relação com Refeição</Label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_RELATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      com_refeicao: opt.value as 'jejum' | 'com_refeicao' | 'com_gordura' | 'indiferente',
                    }))
                  }
                  className={cn(
                    'p-3 rounded-lg border text-left transition-colors',
                    formData.com_refeicao === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <span className="text-lg mr-2">{opt.icon}</span>
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Controle de Estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade_estoque">Quantidade Atual</Label>
              <Input
                id="quantidade_estoque"
                type="number"
                min="0"
                value={formData.quantidade_estoque}
                onChange={e =>
                  setFormData(prev => ({ ...prev, quantidade_estoque: parseInt(e.target.value) || 0 }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alerta_estoque_minimo">Alerta Mínimo</Label>
              <Input
                id="alerta_estoque_minimo"
                type="number"
                min="0"
                value={formData.alerta_estoque_minimo}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    alerta_estoque_minimo: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restrições e Interações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Restrições</Label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTION_OPTIONS.map(restricao => (
                <button
                  key={restricao.id}
                  type="button"
                  onClick={() => toggleRestricao(restricao.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-colors',
                    formData.restricoes?.includes(restricao.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {restricao.icon} {restricao.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas Adicionais</Label>
            <Textarea
              id="notas"
              value={formData.notas || ''}
              onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Observações, instruções especiais..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : supplement ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}
