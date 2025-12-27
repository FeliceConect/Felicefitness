"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, User, Loader2 } from 'lucide-react'

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

interface Participant {
  id: string
  nome: string
  email?: string
  foto?: string | null
  type?: string
  specialty?: string
}

interface ChatWindowProps {
  conversationId: string
  participant: Participant
  currentUserId: string
  userType: 'client' | 'professional'
  onBack?: () => void
  onNewMessage?: () => void
}

export function ChatWindow({
  conversationId,
  participant,
  currentUserId,
  userType: _userType,
  onBack,
  onNewMessage
}: ChatWindowProps) {
  // userType pode ser usado futuramente para lógica específica
  void _userType
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchMessages = useCallback(async (before?: string) => {
    try {
      const url = `/api/chat/messages?conversationId=${conversationId}${before ? `&before=${before}` : ''}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        if (before) {
          setMessages(prev => [...data.messages, ...prev])
        } else {
          setMessages(data.messages)
        }
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchMessages()

    // Polling para novas mensagens (a cada 5 segundos)
    const interval = setInterval(() => {
      fetchMessages()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    // Scroll para o fim quando novas mensagens chegam
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: messageContent
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessages(prev => [...prev, data.message])
        onNewMessage?.()
      } else {
        setNewMessage(messageContent) // Restaurar mensagem em caso de erro
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setNewMessage(messageContent)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }

  // Agrupar mensagens por data
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-800 border-b border-slate-700">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center overflow-hidden">
          {participant.foto ? (
            <img src={participant.foto} alt={participant.nome} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-violet-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{participant.nome}</h3>
          {participant.specialty && (
            <p className="text-xs text-slate-400 truncate">{participant.specialty}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">Nenhuma mensagem ainda</p>
            <p className="text-sm text-slate-500 mt-1">Envie a primeira mensagem!</p>
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={() => fetchMessages(messages[0]?.created_at)}
                className="w-full py-2 text-sm text-violet-400 hover:text-violet-300"
              >
                Carregar mensagens anteriores
              </button>
            )}
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-slate-700" />
                  <span className="text-xs text-slate-500">{date}</span>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>
                <div className="space-y-2">
                  {msgs.map((message) => {
                    const isMine = message.sender_id === currentUserId
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                            isMine
                              ? 'bg-violet-600 text-white rounded-br-md'
                              : 'bg-slate-700 text-white rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-violet-200' : 'text-slate-400'}`}>
                            {formatTime(message.created_at)}
                            {isMine && message.is_read && (
                              <span className="ml-2">Lida</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-full text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-3 rounded-full bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
