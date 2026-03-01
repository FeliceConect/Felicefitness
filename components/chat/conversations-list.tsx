"use client"

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, User, Loader2, RefreshCw } from 'lucide-react'

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

interface ConversationsListProps {
  onSelectConversation: (conversation: Conversation) => void
  selectedId?: string
}

export function ConversationsList({ onSelectConversation, selectedId }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchConversations = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()

      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()

    // Polling para novas conversas/mensagens
    const interval = setInterval(() => {
      fetchConversations()
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchConversations])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  const truncateMessage = (content: string, maxLength = 40) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-dourado animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-dourado" />
          Mensagens
        </h2>
        <button
          onClick={() => fetchConversations(true)}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-background-elevated transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-foreground-muted ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 rounded-full bg-background-elevated flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-border" />
            </div>
            <p className="text-foreground-muted">Nenhuma conversa</p>
            <p className="text-sm text-foreground-muted mt-1">
              Suas conversas aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-background-elevated transition-colors text-left ${
                  selectedId === conv.id ? 'bg-background-elevated' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-dourado/15 flex items-center justify-center overflow-hidden">
                    {conv.participant.foto ? (
                      <img
                        src={conv.participant.foto}
                        alt={conv.participant.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-dourado" />
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-dourado text-white text-xs flex items-center justify-center">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground-secondary'}`}>
                      {conv.participant.nome}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-foreground-muted flex-shrink-0">
                        {formatTime(conv.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground-secondary' : 'text-foreground-muted'}`}>
                      {conv.lastMessage.sender_type === 'professional' ? 'Você: ' : ''}
                      {truncateMessage(conv.lastMessage.content)}
                    </p>
                  )}
                  {conv.participant.specialty && (
                    <p className="text-xs text-foreground-muted truncate">
                      {conv.participant.specialty}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
