'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, MessageSquare, Trash2, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ConversationWithPreview {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage?: string
}

export default function CoachHistoricoPage() {
  const [conversations, setConversations] = useState<ConversationWithPreview[]>([])
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredConversations(filtered)
    } else {
      setFilteredConversations(conversations)
    }
  }, [searchQuery, conversations])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get conversations with message count
      const { data: convData, error: convError } = await supabase
        .from('coach_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }) as { data: { id: string; title: string; created_at: string; updated_at: string }[] | null; error: unknown }

      if (convError) throw convError

      // Get last message for each conversation
      const conversationsWithPreview: ConversationWithPreview[] = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: messages, count } = await supabase
            .from('coach_messages')
            .select('content', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1) as { data: { content: string }[] | null; count: number | null }

          return {
            id: conv.id,
            title: conv.title || 'Conversa',
            createdAt: conv.created_at,
            updatedAt: conv.updated_at,
            messageCount: count || 0,
            lastMessage: messages?.[0]?.content,
          }
        })
      )

      setConversations(conversationsWithPreview)
      setFilteredConversations(conversationsWithPreview)
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteConversation = async (id: string) => {
    try {
      // Delete messages first
      await supabase
        .from('coach_messages')
        .delete()
        .eq('conversation_id', id)

      // Then delete conversation
      await supabase
        .from('coach_conversations')
        .delete()
        .eq('id', id)

      setConversations((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  const openConversation = (id: string) => {
    // Navigate to coach page with conversation loaded
    router.push(`/coach?conversation=${id}`)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/coach">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="font-semibold">Histórico de Conversas</h1>
      </header>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">
              {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? 'Tente buscar por outro termo'
                : 'Inicie uma conversa com o FeliceCoach'}
            </p>
            {!searchQuery && (
              <Link href="/coach" className="mt-4">
                <Button>Iniciar conversa</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <Card
                key={conv.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => openConversation(conv.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{conv.title}</h3>
                      {conv.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.lastMessage}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(conv.updatedAt)}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{conv.messageCount} mensagens</span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Todas as mensagens desta conversa
                            serão permanentemente excluídas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteConversation(conv.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
