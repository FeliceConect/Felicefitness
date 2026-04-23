"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, User, Loader2, Paperclip, X, FileText, Download } from 'lucide-react'
import { compressImageClient } from '@/lib/images/compress-client'
import { toast } from 'sonner'

interface MessageMetadata {
  storage_path?: string
  url?: string
  mime_type?: string
  file_name?: string
  file_size?: number
  expires_at?: string
  expired?: boolean
  [key: string]: unknown
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'professional'
  content: string
  message_type: string
  metadata: MessageMetadata | null
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

const ACCEPT_MIMES = 'image/*,audio/*,video/*,application/pdf'

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 0
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
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
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Cleanup do object URL do preview
  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    }
  }, [pendingPreviewUrl])

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reescolher o mesmo arquivo depois
    if (!file) return

    // Limite client-side de sanidade (50MB — server valida por categoria)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 50MB.')
      return
    }

    setPendingFile(file)
    if (file.type.startsWith('image/')) {
      setPendingPreviewUrl(URL.createObjectURL(file))
    } else {
      setPendingPreviewUrl(null)
    }
  }

  const clearPendingFile = () => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl)
    setPendingFile(null)
    setPendingPreviewUrl(null)
  }

  const uploadPendingFile = async (): Promise<{
    category: 'image' | 'audio' | 'video' | 'pdf'
    storage_path: string
    mime_type: string
    file_name: string
    file_size: number
    expires_at: string
  } | null> => {
    if (!pendingFile) return null

    let fileToUpload: File = pendingFile
    // Comprime imagem no client antes de enviar
    if (pendingFile.type.startsWith('image/') && pendingFile.type !== 'image/gif') {
      try {
        fileToUpload = await compressImageClient(pendingFile)
      } catch {
        // Segue com o arquivo original se compressão falhar
      }
    }

    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('conversationId', conversationId)

    const res = await fetch('/api/chat/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const status = res.status
      if (status === 413) toast.error('Arquivo muito grande.')
      else if (status === 401) toast.error('Sessão expirada. Faça login novamente.')
      else if (status >= 500) toast.error('Servidor indisponível. Tente de novo.')
      else {
        try {
          const err = await res.json()
          toast.error(err.error || 'Erro ao enviar arquivo.')
        } catch {
          toast.error('Erro ao enviar arquivo.')
        }
      }
      return null
    }
    const data = await res.json()
    if (!data.success) {
      toast.error(data.error || 'Erro ao enviar arquivo.')
      return null
    }
    return data
  }

  const handleSend = async () => {
    const hasText = newMessage.trim().length > 0
    const hasFile = !!pendingFile
    if ((!hasText && !hasFile) || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      let messageType: string = 'text'
      let metadata: MessageMetadata | null = null
      let contentToSend = messageContent

      if (hasFile) {
        const uploaded = await uploadPendingFile()
        if (!uploaded) {
          // Reabilita o input e o arquivo em pendência ao falhar
          setNewMessage(messageContent)
          setSending(false)
          return
        }
        messageType = uploaded.category // 'image' | 'audio' | 'video' | 'pdf'
        metadata = {
          storage_path: uploaded.storage_path,
          mime_type: uploaded.mime_type,
          file_name: uploaded.file_name,
          file_size: uploaded.file_size,
          expires_at: uploaded.expires_at,
        }
        // content precisa existir (NOT NULL na tabela). Usa legenda ou placeholder.
        if (!contentToSend) contentToSend = `📎 ${uploaded.file_name}`
      }

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: contentToSend,
          messageType,
          metadata,
        })
      })

      const data = await response.json()

      if (data.success) {
        // A API retorna a mensagem sem signed URL (é inserida "crua").
        // Para exibir o anexo imediatamente, sobrescrevemos metadata.url com
        // o object URL local — no próximo polling vem a signed URL de verdade.
        let msg: Message = data.message
        if (metadata && pendingFile && pendingPreviewUrl) {
          msg = { ...msg, metadata: { ...metadata, url: pendingPreviewUrl } }
        }
        setMessages(prev => [...prev, msg])
        clearPendingFile()
        onNewMessage?.()
      } else {
        setNewMessage(messageContent) // Restaurar em caso de erro
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

  const renderAttachment = (msg: Message, isMine: boolean) => {
    const md = msg.metadata
    if (!md) return null

    // Anexo já expirado (cron removeu do Storage)
    if (md.expired) {
      return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isMine ? 'bg-secondary/60' : 'bg-background-input/60'} text-sm opacity-70`}>
          <FileText className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{md.file_name || 'arquivo'} · expirado</span>
        </div>
      )
    }

    const url = md.url
    if (!url) return null

    if (msg.message_type === 'image') {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={url}
            alt={md.file_name || 'imagem'}
            className="max-w-full max-h-80 rounded-lg object-contain bg-black/5"
            loading="lazy"
          />
        </a>
      )
    }

    if (msg.message_type === 'audio') {
      return (
        <audio controls src={url} className="max-w-full">
          Seu navegador não suporta áudio.
        </audio>
      )
    }

    if (msg.message_type === 'video') {
      return (
        <video controls src={url} className="max-w-full max-h-80 rounded-lg bg-black" preload="metadata">
          Seu navegador não suporta vídeo.
        </video>
      )
    }

    // pdf / outros
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download={md.file_name}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isMine ? 'bg-secondary/60 hover:bg-secondary/80' : 'bg-background-input hover:bg-background-elevated'} transition-colors`}
      >
        <FileText className={`w-5 h-5 flex-shrink-0 ${isMine ? 'text-seda' : 'text-dourado'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isMine ? 'text-secondary-foreground' : 'text-foreground'}`}>
            {md.file_name || 'documento.pdf'}
          </p>
          <p className={`text-xs ${isMine ? 'text-seda' : 'text-foreground-muted'}`}>
            {formatBytes(md.file_size)}
          </p>
        </div>
        <Download className={`w-4 h-4 flex-shrink-0 ${isMine ? 'text-seda' : 'text-foreground-muted'}`} />
      </a>
    )
  }

  const hasAttachment = (msg: Message) =>
    msg.metadata && (msg.metadata.storage_path || msg.metadata.expired)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-background-card border-b border-border">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-background-elevated transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-dourado/15 flex items-center justify-center overflow-hidden">
          {participant.foto ? (
            <img src={participant.foto} alt={participant.nome} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-dourado" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-foreground font-medium truncate">{participant.nome}</h3>
          {participant.specialty && (
            <p className="text-xs text-foreground-muted truncate">{participant.specialty}</p>
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
            <Loader2 className="w-8 h-8 text-dourado animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-background-elevated flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-border" />
            </div>
            <p className="text-foreground-muted">Nenhuma mensagem ainda</p>
            <p className="text-sm text-foreground-muted mt-1">Envie a primeira mensagem!</p>
          </div>
        ) : (
          <>
            {hasMore && (
              <button
                onClick={() => fetchMessages(messages[0]?.created_at)}
                className="w-full py-2 text-sm text-dourado hover:text-primary-hover"
              >
                Carregar mensagens anteriores
              </button>
            )}
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-foreground-muted">{date}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-2">
                  {msgs.map((message) => {
                    const isMine = message.sender_id === currentUserId
                    const attachment = hasAttachment(message)
                    const showContent = message.content && !(attachment && message.content.startsWith('📎 '))
                    const expiresInDays = isMine && message.metadata?.expires_at ? daysUntil(message.metadata.expires_at) : null
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                            isMine
                              ? 'bg-secondary text-secondary-foreground rounded-br-md'
                              : 'bg-background-elevated text-foreground rounded-bl-md'
                          }`}
                        >
                          {attachment && (
                            <div className={showContent ? 'mb-2' : ''}>
                              {renderAttachment(message, isMine)}
                            </div>
                          )}
                          {showContent && (
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                          <p className={`text-xs mt-1 ${isMine ? 'text-seda' : 'text-foreground-muted'}`}>
                            {formatTime(message.created_at)}
                            {expiresInDays !== null && expiresInDays > 0 && (
                              <span className="ml-2 opacity-75">· expira em {expiresInDays}d</span>
                            )}
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

      {/* Preview do arquivo em pendência */}
      {pendingFile && (
        <div className="px-4 pt-3 pb-0 bg-background-card border-t border-border">
          <div className="flex items-center gap-3 p-3 bg-background-elevated rounded-lg">
            {pendingPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingPreviewUrl}
                alt="preview"
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-dourado/15 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-dourado" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{pendingFile.name}</p>
              <p className="text-xs text-foreground-muted">{formatBytes(pendingFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearPendingFile}
              className="p-2 rounded-lg hover:bg-background-card transition-colors"
              aria-label="Remover arquivo"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-background-card border-t border-border">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_MIMES}
            onChange={handleFilePick}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-3 rounded-full bg-background-elevated text-foreground hover:bg-background-input disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={pendingFile ? 'Legenda (opcional)...' : 'Digite sua mensagem...'}
            className="flex-1 px-4 py-3 bg-background-input border border-border rounded-full text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !pendingFile) || sending}
            className="p-3 rounded-full bg-dourado text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
