'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Mail, Lock, LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ContaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [changingEmail, setChangingEmail] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleChangeEmail = async () => {
    if (!email) {
      toast.error('Digite o novo email')
      return
    }

    setChangingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      toast.success('Email de confirmação enviado para o novo endereço')
      setEmail('')
    } catch (err) {
      console.error('Error changing email:', err)
      toast.error('Erro ao alterar email')
    } finally {
      setChangingEmail(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Error changing password:', err)
      toast.error('Erro ao alterar senha')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Error logging out:', err)
      toast.error('Erro ao sair')
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Delete all user data first
      await Promise.all([
        supabase.from('workout_sessions').delete().eq('user_id', user.id),
        supabase.from('nutrition_logs').delete().eq('user_id', user.id),
        supabase.from('water_logs').delete().eq('user_id', user.id),
        supabase.from('body_measurements').delete().eq('user_id', user.id),
        supabase.from('progress_photos').delete().eq('user_id', user.id),
        supabase.from('personal_records').delete().eq('user_id', user.id),
        supabase.from('daily_scores').delete().eq('user_id', user.id),
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('user_settings').delete().eq('user_id', user.id),
        supabase.from('fitness_profiles').delete().eq('id', user.id)
      ])

      // Sign out
      await supabase.auth.signOut()

      toast.success('Conta excluída com sucesso')
      router.push('/login')
    } catch (err) {
      console.error('Error deleting account:', err)
      toast.error('Erro ao excluir conta')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Conta e Segurança</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Change Email */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Alterar Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Novo email</Label>
              <Input
                type="email"
                placeholder="novo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleChangeEmail}
              disabled={changingEmail}
              className="w-full"
            >
              {changingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Alterar Email
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full"
            >
              {changingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Esta ação é irreversível. Todos os seus dados serão permanentemente
              excluídos e sua conta será desativada.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir minha conta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os seus dados, incluindo treinos,
              refeições, fotos e conquistas serão permanentemente excluídos.
              Você não poderá recuperar sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Sim, excluir minha conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
