'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Loader2,
  RefreshCw,
  Plus,
  Stethoscope,
  Dumbbell,
  Brain,
  ChevronRight,
  X,
  Check,
  CheckCheck,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Participant {
  id: string
  nome: string
  email?: string
  foto?: string | null
  type?: string
  specialty?: string
}

interface LastMessage {
  content: string
  sender_type: string
  created_at: string
}

interface Conversation {
  id: string
  participant: Participant
  unreadCount: number
  lastMessage: LastMessage | null
  lastMessageAt: string
  isActive: boolean
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'professional'
  content: string
  message_type: string
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatConversationTime(dateStr: string): string {
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
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function truncate(text: string, max = 45): string {
  return text.length <= max ? text : text.substring(0, max) + '...'
}

function professionalTypeLabel(type?: string): string {
  const map: Record<string, string> = {
    nutritionist: 'Nutricionista',
    trainer: 'Personal Trainer',
    coach: 'Coach',
  }
  return type ? map[type] || type : ''
}

function professionalTypeIcon(type?: string) {
  switch (type) {
    case 'nutritionist':
      return Stethoscope
    case 'trainer':
      return Dumbbell
    case 'coach':
      return Brain
    default:
      return User
  }
}

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-background-elevated" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-background-elevated rounded" />
          <div className="h-3 w-10 bg-background-elevated rounded" />
        </div>
        <div className="h-3 w-48 bg-background-elevated rounded" />
      </div>
    </div>
  )
}

function MessageSkeleton({ align }: { align: 'left' | 'right' }) {
  return (
    <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'} animate-pulse`}>
      <div
        className={`rounded-2xl ${align === 'right' ? 'rounded-br-md' : 'rounded-bl-md'} bg-background-elevated`}
        style={{ width: `${Math.random() * 40 + 30}%`, height: 44 }}
      />
    </div>
  )
}

function MessagesLoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <MessageSkeleton align="left" />
      <MessageSkeleton align="right" />
      <MessageSkeleton align="left" />
      <MessageSkeleton align="right" />
      <MessageSkeleton align="left" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type View = 'list' | 'thread'

export default function ChatPage() {
  // Auth
  const [currentUserId, setCurrentUserId] = useState<string>('')

  // Conversation list state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Thread state
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  // New conversation modal
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [availableProfessionals, setAvailableProfessionals] = useState<Participant[]>([])
  const [loadingProfessionals, setLoadingProfessionals] = useState(false)

  // View state
  const [view, setView] = useState<View>('list')

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollConversationsRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollMessagesRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // -------------------------------------------------------------------------
  // Auth: get current user id
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    init()
  }, [])

  // -------------------------------------------------------------------------
  // Fetch conversations
  // -------------------------------------------------------------------------
  const fetchConversations = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch('/api/chat/conversations')
      const data = await res.json()
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.error('Erro ao buscar conversas:', err)
    } finally {
      setLoadingConversations(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    pollConversationsRef.current = setInterval(() => fetchConversations(), 15000)
    return () => {
      if (pollConversationsRef.current) clearInterval(pollConversationsRef.current)
    }
  }, [fetchConversations])

  // -------------------------------------------------------------------------
  // Fetch messages for active conversation
  // -------------------------------------------------------------------------
  const fetchMessages = useCallback(async (conversationId: string, before?: string) => {
    try {
      const url = `/api/chat/messages?conversationId=${conversationId}${before ? `&before=${before}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        if (before) {
          setMessages(prev => [...data.messages, ...prev])
        } else {
          setMessages(data.messages)
        }
        setHasMore(data.hasMore)
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // Open a conversation
  const openConversation = useCallback((conv: Conversation) => {
    setActiveConversation(conv)
    setView('thread')
    setMessages([])
    setLoadingMessages(true)
    setNewMessage('')
    fetchMessages(conv.id)
  }, [fetchMessages])

  // Polling for messages when in thread view
  useEffect(() => {
    if (view === 'thread' && activeConversation) {
      pollMessagesRef.current = setInterval(() => {
        fetchMessages(activeConversation.id)
      }, 5000)
    }
    return () => {
      if (pollMessagesRef.current) clearInterval(pollMessagesRef.current)
    }
  }, [view, activeConversation, fetchMessages])

  // Auto-scroll to latest message
  useEffect(() => {
    if (view === 'thread' && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, view])

  // Focus input when entering thread
  useEffect(() => {
    if (view === 'thread' && !loadingMessages) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [view, loadingMessages])

  // -------------------------------------------------------------------------
  // Send message
  // -------------------------------------------------------------------------
  const handleSend = async () => {
    if (!newMessage.trim() || sending || !activeConversation) return

    const content = newMessage.trim()
    setSending(true)
    setNewMessage('')

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_id: currentUserId,
      sender_type: 'client',
      content,
      message_type: 'text',
      metadata: null,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversation.id, content }),
      })
      const data = await res.json()
      if (data.success) {
        // Replace optimistic message with real one
        setMessages(prev =>
          prev.map(m => (m.id === optimisticMsg.id ? data.message : m)),
        )
        // Also refresh conversations to update last message
        fetchConversations()
      } else {
        // Remove optimistic, restore input
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        setNewMessage(content)
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setNewMessage(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // -------------------------------------------------------------------------
  // Back to list
  // -------------------------------------------------------------------------
  const handleBack = () => {
    setView('list')
    setActiveConversation(null)
    setMessages([])
    fetchConversations()
  }

  // -------------------------------------------------------------------------
  // New conversation: fetch available professionals
  // -------------------------------------------------------------------------
  const openNewConversation = async () => {
    setShowNewConversation(true)
    setLoadingProfessionals(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      // Fetch professionals assigned to this client
      const { data: assignments } = await supabase
        .from('fitness_client_assignments')
        .select('professional_id')
        .eq('client_id', currentUserId)
        .eq('is_active', true)

      if (assignments && assignments.length > 0) {
        const profIds = assignments.map(a => a.professional_id)
        const { data: professionals } = await supabase
          .from('fitness_professionals')
          .select('id, user_id, type, specialty')
          .in('id', profIds)

        if (professionals && professionals.length > 0) {
          const userIds = professionals.map(p => p.user_id)
          const { data: profiles } = await supabase
            .from('fitness_profiles')
            .select('id, nome, email')
            .in('id', userIds)

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

          // Filter out professionals that already have a conversation
          const existingProfIds = new Set(
            conversations.map(c => c.participant.id),
          )

          const available: Participant[] = professionals
            .filter(p => !existingProfIds.has(p.user_id))
            .map(p => {
              const profile = profileMap.get(p.user_id)
              return {
                id: p.id, // professional.id for creating conversation
                nome: profile?.nome || professionalTypeLabel(p.type),
                email: profile?.email,
                type: p.type,
                specialty: p.specialty,
              }
            })

          setAvailableProfessionals(available)
        } else {
          setAvailableProfessionals([])
        }
      } else {
        setAvailableProfessionals([])
      }
    } catch (err) {
      console.error('Erro ao buscar profissionais:', err)
      setAvailableProfessionals([])
    } finally {
      setLoadingProfessionals(false)
    }
  }

  const startConversation = async (professional: Participant) => {
    setShowNewConversation(false)
    setLoadingConversations(true)
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentUserId,
          professionalId: professional.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Refresh conversations and open the new one
        await fetchConversations()
        const conv: Conversation = {
          id: data.conversation.id,
          participant: professional,
          unreadCount: 0,
          lastMessage: null,
          lastMessageAt: new Date().toISOString(),
          isActive: true,
        }
        openConversation(conv)
      }
    } catch (err) {
      console.error('Erro ao criar conversa:', err)
      setLoadingConversations(false)
    }
  }

  // -------------------------------------------------------------------------
  // Group messages by date
  // -------------------------------------------------------------------------
  const groupedMessages = messages.reduce<Record<string, Message[]>>((groups, msg) => {
    const dateKey = formatDateSeparator(msg.created_at)
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(msg)
    return groups
  }, {})

  // =========================================================================
  // RENDER: Thread view
  // =========================================================================
  if (view === 'thread' && activeConversation) {
    const TypeIcon = professionalTypeIcon(activeConversation.participant.type)

    return (
      <div className="flex flex-col h-[calc(100dvh-8rem)] bg-background">
        {/* Thread header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl hover:bg-background-elevated transition-colors"
              aria-label="Voltar para conversas"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>

            <div className="w-10 h-10 rounded-full bg-dourado/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {activeConversation.participant.foto ? (
                <img
                  src={activeConversation.participant.foto}
                  alt={activeConversation.participant.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <TypeIcon className="w-5 h-5 text-dourado" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-medium text-foreground truncate">
                {activeConversation.participant.nome}
              </h2>
              {activeConversation.participant.type && (
                <p className="text-xs text-foreground-muted truncate">
                  {activeConversation.participant.specialty || professionalTypeLabel(activeConversation.participant.type)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {loadingMessages ? (
            <MessagesLoadingSkeleton />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-dourado/10 flex items-center justify-center mb-4">
                <Send className="w-7 h-7 text-dourado" />
              </div>
              <p className="text-foreground-secondary font-medium">Nenhuma mensagem ainda</p>
              <p className="text-sm text-foreground-muted mt-1">
                Envie a primeira mensagem para {activeConversation.participant.nome}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {hasMore && (
                <button
                  onClick={() => fetchMessages(activeConversation.id, messages[0]?.created_at)}
                  className="w-full py-2 mb-3 text-sm font-medium text-dourado hover:text-primary-hover transition-colors"
                >
                  Carregar mensagens anteriores
                </button>
              )}

              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date separator */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-foreground-muted font-medium px-2">{date}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Messages */}
                  <div className="space-y-1.5">
                    {msgs.map((msg) => {
                      const isMine = msg.sender_id === currentUserId
                      const isOptimistic = msg.id.startsWith('temp-')

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm ${
                              isMine
                                ? 'bg-vinho text-white rounded-br-md'
                                : 'bg-white border border-border text-foreground rounded-bl-md'
                            } ${isOptimistic ? 'opacity-70' : ''}`}
                          >
                            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                              {msg.content}
                            </p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isMine ? 'text-white/60' : 'text-foreground-muted'
                            }`}>
                              <span className="text-[11px]">
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isMine && !isOptimistic && (
                                msg.is_read ? (
                                  <CheckCheck className="w-3.5 h-3.5" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )
                              )}
                              {isOptimistic && (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message input */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t border-border px-4 py-3 pb-safe">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 bg-background-input border border-border rounded-full text-foreground placeholder:text-foreground-muted text-[15px] focus:outline-none focus:ring-2 focus:ring-dourado/50 focus:border-dourado transition-all"
              disabled={sending}
              aria-label="Mensagem"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="p-3 rounded-full bg-dourado text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
              aria-label="Enviar mensagem"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER: Conversation list view
  // =========================================================================
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-dourado/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-dourado" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">Mensagens</h1>
              <p className="text-xs text-foreground-muted">Fale com seus profissionais</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchConversations(true)}
              disabled={refreshing}
              className="p-2 rounded-xl hover:bg-background-elevated transition-colors disabled:opacity-50"
              aria-label="Atualizar conversas"
            >
              <RefreshCw className={`w-5 h-5 text-foreground-muted ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openNewConversation}
              className="p-2 rounded-xl bg-dourado/10 hover:bg-dourado/20 transition-colors"
              aria-label="Nova conversa"
            >
              <Plus className="w-5 h-5 text-dourado" />
            </button>
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <div className="mt-2 mx-3">
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          {loadingConversations ? (
            <>
              <ConversationSkeleton />
              <div className="border-t border-border" />
              <ConversationSkeleton />
              <div className="border-t border-border" />
              <ConversationSkeleton />
            </>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-dourado/10 flex items-center justify-center mb-5">
                <MessageSquare className="w-8 h-8 text-dourado" />
              </div>
              <h2 className="font-heading text-lg font-bold text-foreground mb-2">
                Nenhuma conversa
              </h2>
              <p className="text-sm text-foreground-secondary max-w-xs mb-6">
                Suas conversas com nutricionistas, personal trainers e coaches aparecerão aqui.
              </p>
              <button
                onClick={openNewConversation}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-dourado text-white text-sm font-medium hover:bg-primary-hover transition-colors active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Iniciar conversa
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => {
                const TypeIcon = professionalTypeIcon(conv.participant.type)

                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-background-elevated/50 active:bg-background-elevated transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-dourado/10 flex items-center justify-center overflow-hidden">
                        {conv.participant.foto ? (
                          <img
                            src={conv.participant.foto}
                            alt={conv.participant.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <TypeIcon className="w-6 h-6 text-dourado" />
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-dourado text-white text-[11px] font-bold flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`font-medium truncate ${
                          conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground-secondary'
                        }`}>
                          {conv.participant.nome}
                        </h3>
                        {conv.lastMessage && (
                          <span className="text-[11px] text-foreground-muted flex-shrink-0">
                            {formatConversationTime(conv.lastMessage.created_at)}
                          </span>
                        )}
                      </div>

                      {conv.lastMessage ? (
                        <p className={`text-sm truncate mt-0.5 ${
                          conv.unreadCount > 0 ? 'text-foreground-secondary font-medium' : 'text-foreground-muted'
                        }`}>
                          {conv.lastMessage.sender_type === 'client' ? 'Voce: ' : ''}
                          {truncate(conv.lastMessage.content)}
                        </p>
                      ) : (
                        <p className="text-sm text-foreground-muted mt-0.5">
                          Nenhuma mensagem ainda
                        </p>
                      )}

                      {conv.participant.type && (
                        <p className="text-[11px] text-foreground-muted mt-0.5">
                          {conv.participant.specialty || professionalTypeLabel(conv.participant.type)}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info footer */}
      {conversations.length > 0 && (
        <div className="mx-3 mt-4 mb-2">
          <div className="bg-background-elevated/50 rounded-xl p-4 border border-border">
            <p className="text-xs text-foreground-muted text-center leading-relaxed">
              As mensagens sao atualizadas automaticamente. Voce tambem pode puxar para atualizar.
            </p>
          </div>
        </div>
      )}

      {/* New conversation modal */}
      {showNewConversation && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-cafe/40 backdrop-blur-sm"
            onClick={() => setShowNewConversation(false)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl border-t border-border animate-slide-up pb-safe">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="font-heading font-bold text-lg text-foreground">
                Nova conversa
              </h2>
              <button
                onClick={() => setShowNewConversation(false)}
                className="p-2 rounded-xl hover:bg-background-elevated transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6">
              {loadingProfessionals ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-dourado animate-spin" />
                </div>
              ) : availableProfessionals.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-background-elevated flex items-center justify-center mx-auto mb-4">
                    <User className="w-7 h-7 text-foreground-muted" />
                  </div>
                  <p className="text-foreground-secondary font-medium mb-1">
                    Nenhum profissional disponivel
                  </p>
                  <p className="text-sm text-foreground-muted max-w-xs mx-auto">
                    Voce ja tem conversas com todos os seus profissionais, ou nenhum profissional foi atribuido a voce ainda.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-foreground-secondary mb-3">
                    Selecione um profissional para iniciar uma conversa:
                  </p>
                  {availableProfessionals.map((prof) => {
                    const ProfIcon = professionalTypeIcon(prof.type)
                    return (
                      <button
                        key={prof.id}
                        onClick={() => startConversation(prof)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-white hover:border-dourado/40 hover:bg-dourado/5 transition-all active:scale-[0.98] text-left"
                      >
                        <div className="w-11 h-11 rounded-full bg-dourado/10 flex items-center justify-center flex-shrink-0">
                          <ProfIcon className="w-5 h-5 text-dourado" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{prof.nome}</h3>
                          <p className="text-xs text-foreground-muted">
                            {prof.specialty || professionalTypeLabel(prof.type)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground-muted flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
