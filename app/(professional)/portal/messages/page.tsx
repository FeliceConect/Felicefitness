"use client"

import { useState, useEffect } from 'react'
import { ConversationsList } from '@/components/chat/conversations-list'
import { ChatWindow } from '@/components/chat/chat-window'
import { useProfessional } from '@/hooks/use-professional'
import { createBrowserClient } from '@supabase/ssr'

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
          <div className="bg-slate-800 rounded-xl border border-slate-700 h-full overflow-hidden">
            <ConversationsList
              onSelectConversation={setSelectedConversation}
              selectedId={undefined}
            />
          </div>
        )}
      </div>
    )
  }

  // Desktop: lado a lado
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mensagens</h1>
        <p className="text-slate-400">Comunique-se com seus clientes</p>
      </div>

      {/* Chat Layout */}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-14rem)]">
        {/* Lista de Conversas */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <ConversationsList
            onSelectConversation={setSelectedConversation}
            selectedId={selectedConversation?.id}
          />
        </div>

        {/* Chat Window */}
        <div className="col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {selectedConversation ? (
            <ChatWindow
              conversationId={selectedConversation.id}
              participant={selectedConversation.participant}
              currentUserId={currentUserId}
              userType="professional"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Selecione uma conversa</h3>
              <p className="text-slate-400 max-w-sm">
                Escolha uma conversa da lista ao lado para ver as mensagens e responder seus clientes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
