'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile } from '@/hooks/use-profile'
import { validateEmail, validatePhone } from '@/lib/settings/validators'
import { toast } from 'sonner'

export default function EditarPerfilPage() {
  const router = useRouter()
  const { profile, loading, updateProfile } = useProfile()

  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    data_nascimento: '',
    genero: 'masculino' as 'masculino' | 'feminino' | 'outro',
    altura: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || '',
        sobrenome: profile.sobrenome || '',
        email: profile.email || '',
        telefone: profile.telefone || '',
        data_nascimento: profile.data_nascimento || '',
        genero: profile.genero || 'masculino',
        altura: profile.altura || 0
      })
    }
  }, [profile])

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.telefone && !validatePhone(formData.telefone)) {
      newErrors.telefone = 'Telefone inválido'
    }

    if (formData.altura && (formData.altura < 100 || formData.altura > 250)) {
      newErrors.altura = 'Altura deve estar entre 100 e 250 cm'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      await updateProfile({
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        telefone: formData.telefone,
        data_nascimento: formData.data_nascimento,
        genero: formData.genero,
        altura: formData.altura
      })
      toast.success('Perfil atualizado com sucesso!')
      router.back()
    } catch {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 p-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold">Editar Perfil</h1>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold">Editar Perfil</h1>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Dados pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Seu nome"
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Sobrenome</Label>
                <Input
                  value={formData.sobrenome}
                  onChange={(e) => handleChange('sobrenome', e.target.value)}
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seu@email.com"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Para alterar o email, vá em Configurações &gt; Conta
              </p>
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                type="tel"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="+55 11 99999-9999"
                className={errors.telefone ? 'border-destructive' : ''}
              />
              {errors.telefone && (
                <p className="text-xs text-destructive">{errors.telefone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => handleChange('data_nascimento', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select
                value={formData.genero}
                onValueChange={(value) => handleChange('genero', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dados físicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados Físicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Altura</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.altura || ''}
                  onChange={(e) => handleChange('altura', Number(e.target.value))}
                  placeholder="181"
                  className={errors.altura ? 'border-destructive' : ''}
                />
                <span className="text-muted-foreground">cm</span>
              </div>
              {errors.altura && (
                <p className="text-xs text-destructive">{errors.altura}</p>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Para atualizar peso e composição corporal, use a página de medições.
            </p>

            <Button variant="outline" className="w-full" onClick={() => router.push('/corpo/nova-medicao')}>
              Registrar Medição
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
