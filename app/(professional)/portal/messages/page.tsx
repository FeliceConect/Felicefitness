"use client"

import { useState, useEffect } from 'react'
import { ConversationsList } from '@/components/chat/conversations-list'
import { ChatWindow } from '@/components/chat/chat-window'
import { BroadcastModal } from '@/components/chat/broadcast-modal'
import { useProfessional } from '@/hooks/use-professional'
import { createBrowserClient } from '@supabase/ssr'
import { MessageSquare, Megaphone } from 'lucide-react'

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

export default function MessagesPage() {
  useProfessional() // Verifica se é profissional
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)

  useEffect(() => {
    // Check se é mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Mobile: mostrar só lista ou só chat
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        {selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation.id}
            participant={selectedConversation.participant}
            currentUserId={currentUserId}
            userType="professional"
            onBack={handleBack}
          />
        ) : (
          <div className="flex flex-col h-full gap-3">
            <button
              onClick={() => setShowBroadcast(true)}
              className="inline-flex items-center justify-center gap-2 py-2.5 bg-dourado text-white rounded-xl font-medium hover:bg-dourado/90 transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              Mensagem para todos
            </button>
            <div className="bg-white rounded-xl border border-border flex-1 overflow-hidden">
              <ConversationsList
                onSelectConversation={setSelectedConversation}
                selectedId={undefined}
              />
            </div>
          </div>
        )}
        <BroadcastModal isOpen={showBroadcast} onClose={() => setShowBroadcast(false)} />
      </div>
    )
  }

  // Desktop: lado a lado
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
          <p className="text-foreground-secondary">Comunique-se com seus clientes</p>
        </div>
        <button
          onClick={() => setShowBroadcast(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-dourado text-white rounded-lg font-medium hover:bg-dourado/90 transition-colors"
        >
          <Megaphone className="w-5 h-5" />
          Mensagem para todos
        </button>
      </div>

      {/* Chat Layout */}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-14rem)]">
        {/* Lista de Conversas */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <ConversationsList
            onSelectConversation={setSelectedConversation}
            selectedId={selectedConversation?.id}
          />
        </div>

        {/* Chat Window */}
        <div className="col-span-2 bg-white rounded-xl border border-border overflow-hidden">
          {selectedConversation ? (
            <ChatWindow
              conversationId={selectedConversation.id}
              participant={selectedConversation.participant}
              currentUserId={currentUserId}
              userType="professional"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-background-elevated flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-foreground-muted" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Selecione uma conversa</h3>
              <p className="text-foreground-secondary max-w-sm">
                Escolha uma conversa da lista ao lado para ver as mensagens e responder seus clientes.
              </p>
            </div>
          )}
        </div>
      </div>

      <BroadcastModal isOpen={showBroadcast} onClose={() => setShowBroadcast(false)} />
    </div>
  )
}
