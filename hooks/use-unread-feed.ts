'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'feed_last_seen'
const POLL_INTERVAL = 30000 // 30 seconds

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
    fetchUnreadCount()
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchUnreadCount])

  // Has interactions on YOUR posts (comments/reactions)
  const hasInteractions = details.new_comments > 0 || details.new_reactions > 0

  return { unreadCount, details, hasInteractions, markAsRead, refetch: fetchUnreadCount }
}
