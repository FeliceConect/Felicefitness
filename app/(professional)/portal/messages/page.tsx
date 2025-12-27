"use client"

import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mensagens</h1>
        <p className="text-slate-400">Comunique-se com seus clientes</p>
      </div>

      {/* Coming Soon */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
          <MessageSquare className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Em breve!</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          O sistema de mensagens está sendo desenvolvido e estará disponível em breve.
          Você poderá enviar mensagens, feedbacks e orientações diretamente para seus clientes.
        </p>
      </div>
    </div>
  )
}
