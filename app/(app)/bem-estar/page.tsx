'use client'

import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Heart,
  History,
  SmilePlus
} from 'lucide-react'
import Link from 'next/link'

export default function WellnessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading font-bold text-lg text-foreground">Bem-Estar</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Quick Check-in Card */}
        <Link href="/bem-estar/checkin">
          <div className="bg-background-card border border-border rounded-2xl p-6 hover:border-dourado/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-dourado/10 flex items-center justify-center">
                <SmilePlus className="w-6 h-6 text-dourado" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-foreground">Check-in Diario</h2>
                <p className="text-sm text-foreground-secondary">Como voce esta se sentindo hoje?</p>
              </div>
              <Heart className="w-5 h-5 text-foreground-muted" />
            </div>
          </div>
        </Link>

        {/* History Card */}
        <Link href="/bem-estar/historico">
          <div className="bg-background-card border border-border rounded-2xl p-6 hover:border-dourado/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <History className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-foreground">Historico</h2>
                <p className="text-sm text-foreground-secondary">Veja sua evolucao de bem-estar</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
