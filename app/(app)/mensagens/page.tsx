"use client"

import { useState, useEffect } from 'react'
import { ConversationsList } from '@/components/chat/conversations-list'
import { ChatWindow } from '@/components/chat/chat-window'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  id: string
  participant: {
    id: string
    nome: string
    email?: string
    foto?: string | null
    type?: string
    specialty?: string
  }
  unreadCount: number
  lastMessage: {
    content: string
    sender_type: string
    created_at: string
  } | null
  lastMessageAt: string
  isActive: boolean
}

export default function MensagensPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    async function getUserId() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    getUserId()
  }, [])

  const handleBack = () => setSelectedConversation(null)

  // Se está em uma conversa, mostrar o chat
  if (selectedConversation) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <ChatWindow
          conversationId={selectedConversation.id}
          participant={selectedConversation.participant}
          currentUserId={currentUserId}
          userType="client"
          onBack={handleBack}
        />
      </div>
    )
  }

  // Lista de conversas
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-lg bg-white hover:bg-background-elevated transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mensagens</h1>
          <p className="text-sm text-foreground-secondary">Fale com seus profissionais</p>
        </div>
      </div>

      {/* Lista de Conversas */}
      <div className="bg-white rounded-xl border border-border min-h-[60vh] overflow-hidden">
        <ConversationsList
          onSelectConversation={setSelectedConversation}
          selectedId={undefined}
        />
      </div>

      {/* Info */}
      <div className="bg-background-elevated/30 rounded-xl p-4 border border-border">
        <p className="text-sm text-foreground-secondary text-center">
          Aqui você pode conversar com seu nutricionista ou personal trainer.
          As conversas são iniciadas automaticamente quando você é atribuído a um profissional.
        </p>
      </div>
    </div>
  )
}
