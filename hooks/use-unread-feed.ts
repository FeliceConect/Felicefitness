'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'feed_last_seen'
// 90s em vez de 30s: cada consulta passa pelo middleware e consulta o Supabase
// self-hosted. Com várias abas abertas, 30s gerava carga constante que ajudou a
// saturar a fila de conexões do servidor em 29-30/07/2026.
const POLL_INTERVAL = 90000 // 90 seconds

export interface UnreadDetails {
  new_posts: number
  new_comments: number
  new_reactions: number
}

export function useUnreadFeed() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [details, setDetails] = useState<UnreadDetails>({ new_posts: 0, new_comments: 0, new_reactions: 0 })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getLastSeen = useCallback((): string => {
    if (typeof window === 'undefined') return new Date().toISOString()
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    // First time: set to now so we don't count all old posts
    const now = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, now)
    return now
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const since = getLastSeen()
      const res = await fetch(`/api/feed/unread-count?since=${encodeURIComponent(since)}`)
      const data = await res.json()
      if (data.success) {
        setUnreadCount(data.count)
        if (data.details) setDetails(data.details)
      }
    } catch {
      // Silent fail — badge just won't update
    }
  }, [getLastSeen])

  const markAsRead = useCallback(() => {
    const now = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, now)
    setUnreadCount(0)
    setDetails({ new_posts: 0, new_comments: 0, new_reactions: 0 })
  }, [])

  useEffect(() => {
    // Só consulta com a aba visível. Aba de fundo esquecida aberta ficava
    // consultando indefinidamente sem ninguém para ver o resultado.
    const start = () => {
      if (intervalRef.current) return
      intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL)
    }
    const stop = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount()
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === 'visible') {
      fetchUnreadCount()
      start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [fetchUnreadCount])

  // Has interactions on YOUR posts (comments/reactions)
  const hasInteractions = details.new_comments > 0 || details.new_reactions > 0

  return { unreadCount, details, hasInteractions, markAsRead, refetch: fetchUnreadCount }
}
