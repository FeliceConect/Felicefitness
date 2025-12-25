'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildUserContext } from '@/lib/coach/context-builder'
import { getActionRoute } from '@/lib/coach/actions'
import { useRouter } from 'next/navigation'
import type {
  CoachMessage,
  CoachConversation,
  CoachAction,
  UserContext,
  UseCoachReturn,
  ChatResponse,
} from '@/types/coach'

export function useCoach(): UseCoachReturn {
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [conversations, setConversations] = useState<CoachConversation[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [context, setContext] = useState<UserContext | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Load user context on mount
  useEffect(() => {
    const loadContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const ctx = await buildUserContext(user.id)
          setContext(ctx)
        }
      } catch (err) {
        console.error('Error loading context:', err)
      }
    }
    loadContext()
  }, [])

  // Refresh context
  const refreshContext = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const ctx = await buildUserContext(user.id)
        setContext(ctx)
      }
    } catch (err) {
      console.error('Error refreshing context:', err)
    }
  }, [])

  // Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from('coach_conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20) as { data: { id: string; title: string; created_at: string; updated_at: string }[] | null; error: unknown }

      if (fetchError) throw fetchError

      const convs: CoachConversation[] = (data || []).map((c) => ({
        id: c.id,
        userId: user.id,
        title: c.title || 'Conversa',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))

      setConversations(convs)
    } catch (err) {
      console.error('Error loading conversations:', err)
    }
  }, [])

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true }) as {
          data: {
            id: string;
            conversation_id: string;
            role: 'user' | 'assistant';
            content: string;
            actions?: CoachAction[];
            created_at: string
          }[] | null;
          error: unknown
        }

      if (fetchError) throw fetchError

      const msgs: CoachMessage[] = (data || []).map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        role: m.role,
        content: m.content,
        actions: m.actions || undefined,
        createdAt: m.created_at,
      }))

      setMessages(msgs)
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }, [])

  // Select a conversation
  const selectConversation = useCallback((id: string) => {
    setConversationId(id)
    loadMessages(id)
  }, [loadMessages])

  // Start new conversation
  const newConversation = useCallback(() => {
    setConversationId(null)
    setMessages([])
  }, [])

  // Clear current conversation
  const clearConversation = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
  }, [])

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    // Optimistically add user message
    const tempUserMessage: CoachMessage = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId || '',
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem')
      }

      const data: ChatResponse = await response.json()

      // Update conversation ID if new
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      // Add assistant message
      const assistantMessage: CoachMessage = {
        id: `msg-${Date.now()}`,
        conversationId: data.conversationId,
        role: 'assistant',
        content: data.message,
        actions: data.actions,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Refresh context after interaction
      await refreshContext()
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Não foi possível enviar a mensagem. Tente novamente.')
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, isLoading, refreshContext])

  // Handle action click
  const handleActionClick = useCallback((action: CoachAction) => {
    const route = getActionRoute(action)
    if (route) {
      router.push(route)
    }
  }, [router])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    context,
    refreshContext,
    conversationId,
    conversations,
    selectConversation,
    newConversation,
    loadConversations,
  }
}
