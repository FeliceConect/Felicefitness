'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-slate-400">
            Esta funcionalidade é exclusiva para superadmins.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Cleanup</h1>
          <p className="text-slate-400">Restaurar acesso ao app de cliente</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-white">Limpar Registro de Profissional</h2>
            <p className="text-sm text-slate-400 mt-1">
              Se você foi registrado como profissional por engano e perdeu acesso ao app de cliente,
              use esta opção para limpar o registro e restaurar seu acesso normal.
            </p>
          </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
          <p className="text-sm text-amber-400">
            <strong>Atenção:</strong> Após a limpeza, você será deslogado automaticamente.
            Faça login novamente para acessar o app normalmente.
          </p>
        </div>

        {result && (
          <div className={`p-4 rounded-lg flex items-start gap-3 mb-4 ${
            result.success
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
            <p className={`text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cleaning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5" />
                Limpar Registro de Profissional
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-white font-semibold mb-2">O que aconteceu?</h3>
        <p className="text-sm text-slate-400">
          Ao importar um plano alimentar como superadmin, foi criado automaticamente um registro de profissional.
          Isso fez com que o sistema te reconhecesse como nutricionista, bloqueando o acesso ao app de cliente.
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Após limpar o registro, você terá acesso normal ao app de cliente novamente, podendo acessar treinos,
          alimentação, hidratação e todas as outras funcionalidades.
        </p>
      </div>
    </div>
  )
}
