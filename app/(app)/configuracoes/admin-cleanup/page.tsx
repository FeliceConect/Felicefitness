'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const SUPERADMIN_EMAIL = 'felicemed@gmail.com'

export default function AdminCleanupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email === SUPERADMIN_EMAIL) {
        setIsAuthorized(true)
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const handleCleanup = async () => {
    setCleaning(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/cleanup-professional', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setResult({ success: true, message: data.message })
        // Fazer logout após 2 segundos
        setTimeout(async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          router.push('/login')
        }, 2000)
      } else {
        setResult({ success: false, message: data.error || 'Erro desconhecido' })
      }
    } catch {
      setResult({ success: false, message: 'Erro ao executar limpeza' })
    } finally {
      setCleaning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade é exclusiva para superadmins.
            </p>
            <Button onClick={() => router.back()}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Admin Cleanup</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Limpar Registro de Profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se você foi registrado como profissional por engano e perdeu acesso ao app de cliente,
              use esta opção para limpar o registro e restaurar seu acesso normal.
            </p>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>Atenção:</strong> Após a limpeza, você será deslogado automaticamente.
                Faça login novamente para acessar o app normalmente.
              </p>
            </div>

            {result && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                result.success
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <p className={`text-sm ${result.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.message}
                </p>
              </div>
            )}

            <Button
              onClick={handleCleanup}
              disabled={cleaning}
              variant="destructive"
              className="w-full"
            >
              {cleaning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Registro de Profissional
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
