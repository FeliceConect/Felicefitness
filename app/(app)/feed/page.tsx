'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus,
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  X,
  Dumbbell,
  Award,
  Coffee,
  CheckCircle,
  PenLine,
  Camera,
  ArrowUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useUnreadFeed } from '@/hooks/use-unread-feed'

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉',
  prata: '🥈',
  ouro: '🥇',
  platina: '💎',
}

interface Post {
  id: string
  user_id: string
  post_type: string
  content: string
  image_url: string | null
  is_auto_generated: boolean
  reactions_count: Record<string, number>
  comment_count: number
  created_at: string
  author_name: string
  author_initial: string
  author_role?: string
  author_tier?: string
  is_own: boolean
  user_reactions: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any> | null
}

const PROFESSIONAL_ROLES: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Admin', color: 'bg-dourado/15 text-dourado border-dourado/30' },
  admin: { label: 'Admin', color: 'bg-dourado/15 text-dourado border-dourado/30' },
  nutritionist: { label: 'Nutri', color: 'bg-green-50 text-green-700 border-green-200' },
  trainer: { label: 'Personal', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  coach: { label: 'Coach', color: 'bg-purple-50 text-purple-700 border-purple-200' },
}

interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  author_name: string
  author_role?: string
  is_own: boolean
}

const POST_TYPES = [
  { value: 'free_text', label: 'Texto', icon: PenLine },
  { value: 'workout', label: 'Treino', icon: Dumbbell },
  { value: 'meal', label: 'Refeição', icon: Coffee },
  { value: 'achievement', label: 'Conquista', icon: Award },
  { value: 'check_in', label: 'Check-in', icon: CheckCircle },
]

const REACTIONS = [
  { type: 'fire', emoji: '🔥', label: 'Fogo' },
  { type: 'heart', emoji: '❤️', label: 'Amor' },
  { type: 'strength', emoji: '💪', label: 'Força' },
  { type: 'clap', emoji: '👏', label: 'Palmas' },
  { type: 'star', emoji: '⭐', label: 'Estrela' },
]

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  free_text: { label: 'Post', color: 'bg-foreground-muted/10 text-foreground-secondary' },
  workout: { label: 'Treino', color: 'bg-blue-50 text-blue-600' },
  meal: { label: 'Refeição', color: 'bg-green-50 text-green-600' },
  achievement: { label: 'Conquista', color: 'bg-yellow-50 text-yellow-600' },
  check_in: { label: 'Check-in', color: 'bg-purple-50 text-purple-600' },
  level_up: { label: 'Level Up', color: 'bg-red-50 text-red-600' },
}

const ENERGY_LEVELS = [
  { value: 1, emoji: '😴', label: 'Baixa' },
  { value: 2, emoji: '😐', label: 'Moderada' },
  { value: 3, emoji: '🙂', label: 'Boa' },
  { value: 4, emoji: '😊', label: 'Alta' },
  { value: 5, emoji: '🔥', label: 'Máxima' },
]

const MOOD_OPTIONS = [
  { value: 'triste', emoji: '😢', label: 'Triste' },
  { value: 'cansado', emoji: '😩', label: 'Cansado' },
  { value: 'normal', emoji: '😐', label: 'Normal' },
  { value: 'bem', emoji: '🙂', label: 'Bem' },
  { value: 'feliz', emoji: '😊', label: 'Feliz' },
  { value: 'incrivel', emoji: '🤩', label: 'Incrivel' },
]

const MEAL_TYPE_OPTIONS = [
  { value: 'cafe_manha', label: 'Cafe da manha', emoji: '☕' },
  { value: 'almoco', label: 'Almoco', emoji: '🍽️' },
  { value: 'lanche', label: 'Lanche', emoji: '🥪' },
  { value: 'jantar', label: 'Jantar', emoji: '🌙' },
]

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Create post
  const [showCreate, setShowCreate] = useState(false)
  const [newPostType, setNewPostType] = useState('free_text')
  const [newPostContent, setNewPostContent] = useState('')
  const [creating, setCreating] = useState(false)

  // Image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Post metadata (type-specific fields)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [postMetadata, setPostMetadata] = useState<Record<string, any>>({})

  // Comments
  const [expandedComments, setExpandedComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Filter
  const [filterType, setFilterType] = useState('')

  // Active users today (stories-style avatars)
  interface ActiveUser {
    user_id: string
    name: string
    initial: string
    role: string
    tier: string
    foto_url: string | null
    last_post_type: string
    post_count: number
    is_self: boolean
  }
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])

  // Unread feed badge + new posts banner
  const { markAsRead, details: unreadDetails, refetch: refetchUnread } = useUnreadFeed()
  const [newPostsBannerCount, setNewPostsBannerCount] = useState(0)
  const latestPostTimestamp = useRef<string | null>(null)
  const [interactionsBanner, setInteractionsBanner] = useState<string | null>(null)

  // Mark feed as read on mount + fetch active users
  useEffect(() => {
    // Show interactions banner before marking as read
    const parts: string[] = []
    if (unreadDetails.new_comments > 0) {
      parts.push(`${unreadDetails.new_comments} ${unreadDetails.new_comments === 1 ? 'comentário novo' : 'comentários novos'}`)
    }
    if (unreadDetails.new_reactions > 0) {
      parts.push(`${unreadDetails.new_reactions} ${unreadDetails.new_reactions === 1 ? 'reação nova' : 'reações novas'}`)
    }
    if (parts.length > 0) {
      setInteractionsBanner(`Seus posts receberam ${parts.join(' e ')}`)
    }

    markAsRead()
    refetchUnread()
    // Fetch active users for stories bar
    fetch('/api/feed/active-today')
      .then(res => res.json())
      .then(data => {
        if (data.success) setActiveUsers(data.active_users || [])
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new posts while on the feed page (for the banner)
  useEffect(() => {
    const checkNewPosts = async () => {
      if (!latestPostTimestamp.current) return
      try {
        const res = await fetch(`/api/feed/unread-count?since=${encodeURIComponent(latestPostTimestamp.current)}`)
        const data = await res.json()
        if (data.success && data.count > 0) {
          setNewPostsBannerCount(data.count)
        }
      } catch {
        // Silent fail
      }
    }
    const interval = setInterval(checkNewPosts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLoadNewPosts = () => {
    setNewPostsBannerCount(0)
    fetchPosts(true)
    markAsRead()
  }

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)

    try {
      const offset = reset ? 0 : posts.length
      const params = new URLSearchParams({ limit: '20', offset: String(offset) })
      if (filterType) params.set('type', filterType)

      const res = await fetch(`/api/feed?${params}`)
      const data = await res.json()

      if (data.success) {
        if (reset) {
          setPosts(data.posts || [])
          // Track the newest post timestamp for "new posts" banner
          if (data.posts?.length > 0) {
            latestPostTimestamp.current = data.posts[0].created_at
          }
        } else {
          setPosts(prev => [...prev, ...(data.posts || [])])
        }
        setHasMore(data.has_more)
      }
    } catch (error) {
      console.error('Erro ao buscar feed:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filterType, posts.length])

  useEffect(() => {
    fetchPosts(true)
  }, [filterType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG, GIF ou WebP')
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Maximo 5MB')
      return
    }

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const hasMetadata = Object.keys(postMetadata).length > 0
  const canPost = newPostContent.trim() || selectedImage || hasMetadata

  const resetForm = () => {
    setNewPostContent('')
    setNewPostType('free_text')
    setPostMetadata({})
    removeImage()
  }

  const handleCreatePost = async () => {
    if (!canPost) return
    setCreating(true)
    try {
      // Upload image first if selected
      let imageUrl: string | null = null
      if (selectedImage) {
        const formData = new FormData()
        formData.append('file', selectedImage)
        const uploadRes = await fetch('/api/feed/upload', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (!uploadData.success) {
          toast.error(uploadData.error || 'Erro ao enviar imagem')
          setCreating(false)
          return
        }
        imageUrl = uploadData.image_url
      }

      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: newPostType,
          content: newPostContent.trim(),
          image_url: imageUrl,
          metadata: hasMetadata ? postMetadata : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreate(false)
        resetForm()
        fetchPosts(true)
        toast.success('Post publicado! +2 pts')
      } else {
        toast.error(data.error || 'Erro ao publicar')
      }
    } catch (error) {
      console.error('Erro ao criar post:', error)
      toast.error('Erro ao publicar post')
    } finally {
      setCreating(false)
    }
  }

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      const res = await fetch(`/api/feed/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction_type: reactionType }),
      })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p
          const newUserReactions = data.added
            ? [...p.user_reactions, reactionType]
            : p.user_reactions.filter(r => r !== reactionType)
          return {
            ...p,
            reactions_count: data.reactions_count,
            user_reactions: newUserReactions,
          }
        }))
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao reagir')
    }
  }

  const toggleComments = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null)
      return
    }
    setExpandedComments(postId)
    setNewComment('')
    if (!comments[postId]) {
      setLoadingComments(postId)
      try {
        const res = await fetch(`/api/feed/${postId}/comments`)
        const data = await res.json()
        if (data.success) {
          setComments(prev => ({ ...prev, [postId]: data.comments || [] }))
        }
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoadingComments(null)
      }
    }
  }

  const handleComment = async (postId: string) => {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment],
        }))
        setNewComment('')
        // Update comment count
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
        ))
        toast.success('Comentario enviado! +1 pt')
      } else {
        toast.error(data.error || 'Erro ao comentar')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao enviar comentario')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Remover este post?')) return
    try {
      const res = await fetch(`/api/feed/${postId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId))
        toast.success('Post removido')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao remover post')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin}min`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const getTotalReactions = (reactions: Record<string, number>) => {
    return Object.values(reactions).reduce((sum, count) => sum + count, 0)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-heading font-bold text-lg text-foreground">Feed</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 rounded-full bg-dourado text-white hover:bg-dourado/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !filterType ? 'bg-dourado text-white' : 'bg-background-elevated text-foreground-secondary'
            }`}
          >
            Todos
          </button>
          {POST_TYPES.map(pt => (
            <button
              key={pt.value}
              onClick={() => setFilterType(pt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === pt.value ? 'bg-dourado text-white' : 'bg-background-elevated text-foreground-secondary'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactions banner - comments/reactions on your posts */}
      {interactionsBanner && (
        <div className="mx-4 mt-3 mb-1">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
            <div className="flex items-center gap-2">
              <span className="text-base">❤️</span>
              <p className="text-xs text-foreground-secondary font-medium">{interactionsBanner}</p>
            </div>
            <button
              onClick={() => setInteractionsBanner(null)}
              className="text-foreground-muted hover:text-foreground-secondary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Active users today - Stories-style avatars */}
      {activeUsers.length > 0 && (
        <div className="bg-white border-b border-border px-4 pt-3 pb-3 overflow-visible">
          <div className="flex gap-4 overflow-x-auto pb-1 pt-1">
            {activeUsers.map(u => {
              const isProfessional = ['super_admin', 'admin', 'nutritionist', 'trainer', 'coach'].includes(u.role)
              return (
                <button
                  key={u.user_id}
                  onClick={() => {
                    // Find the first post by this user and scroll to it
                    const postIndex = posts.findIndex(p => p.user_id === u.user_id)
                    if (postIndex !== -1) {
                      const postEl = document.getElementById(`post-${posts[postIndex].id}`)
                      if (postEl) postEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 min-w-[64px] flex-shrink-0"
                >
                  <div className={`p-[3px] rounded-full ${
                    isProfessional
                      ? 'bg-gradient-to-br from-dourado via-yellow-400 to-dourado'
                      : 'bg-gradient-to-br from-nude to-fendi'
                  }`}>
                    <div className="w-12 h-12 rounded-full bg-white p-[2px]">
                      {u.foto_url ? (
                        <img
                          src={u.foto_url}
                          alt={u.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full rounded-full flex items-center justify-center ${
                          isProfessional ? 'bg-gradient-to-br from-dourado to-vinho' : 'bg-gradient-to-br from-nude to-cafe/60'
                        }`}>
                          <span className="text-white font-bold text-sm">{u.initial}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-foreground-secondary truncate max-w-[64px] text-center leading-tight">
                    {u.is_self ? 'Você' : u.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* New posts banner */}
      {newPostsBannerCount > 0 && (
        <div className="sticky top-[105px] z-40 flex justify-center px-4 pt-2">
          <button
            onClick={handleLoadNewPosts}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-dourado text-white text-sm font-medium shadow-lg shadow-dourado/30 hover:bg-dourado/90 transition-all active:scale-95"
          >
            <ArrowUp className="w-4 h-4" />
            {newPostsBannerCount} {newPostsBannerCount === 1 ? 'novo post' : 'novos posts'}
          </button>
        </div>
      )}

      {/* Posts */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-dourado animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
            <p className="text-foreground-secondary">Nenhum post ainda</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-dourado text-sm font-medium"
            >
              Seja o primeiro a postar!
            </button>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <div key={post.id} id={`post-${post.id}`} className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Post header */}
                <div className="flex items-center gap-3 p-4 pb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dourado to-vinho flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{post.author_initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-foreground text-sm truncate">{post.author_name}</p>
                      {post.author_tier && post.author_tier !== 'bronze' && (
                        <span className="text-xs" title={post.author_tier}>{TIER_ICONS[post.author_tier]}</span>
                      )}
                      {post.author_role && PROFESSIONAL_ROLES[post.author_role] && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${PROFESSIONAL_ROLES[post.author_role].color}`}>
                          {PROFESSIONAL_ROLES[post.author_role].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground-muted">{formatDate(post.created_at)}</span>
                      {POST_TYPE_LABELS[post.post_type] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${POST_TYPE_LABELS[post.post_type].color}`}>
                          {POST_TYPE_LABELS[post.post_type].label}
                        </span>
                      )}
                      {post.is_auto_generated && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-dourado/10 text-dourado font-medium">
                          Auto
                        </span>
                      )}
                    </div>
                  </div>
                  {post.is_own && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-foreground-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Type-specific card */}
                {post.post_type === 'workout' && post.metadata && Object.keys(post.metadata).length > 0 && (
                  <div className="mx-4 mb-2 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Treino Concluido</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {post.metadata.duracao_min && (
                        <div className="bg-white/70 rounded-lg py-1.5">
                          <p className="text-base font-heading font-bold text-foreground">{post.metadata.duracao_min}</p>
                          <p className="text-[9px] text-foreground-muted">minutos</p>
                        </div>
                      )}
                      {post.metadata.exercicios && (
                        <div className="bg-white/70 rounded-lg py-1.5">
                          <p className="text-base font-heading font-bold text-foreground">{post.metadata.exercicios}</p>
                          <p className="text-[9px] text-foreground-muted">exercicios</p>
                        </div>
                      )}
                      {post.metadata.calorias && (
                        <div className="bg-white/70 rounded-lg py-1.5">
                          <p className="text-base font-heading font-bold text-foreground">{post.metadata.calorias}</p>
                          <p className="text-[9px] text-foreground-muted">kcal</p>
                        </div>
                      )}
                    </div>
                    {post.metadata.energia && (
                      <div className="mt-2 flex items-center justify-center gap-1">
                        <span className="text-[10px] text-foreground-muted">Energia:</span>
                        <span className="text-sm">{ENERGY_LEVELS.find(e => e.value === post.metadata?.energia)?.emoji}</span>
                        <span className="text-[10px] text-blue-600 font-medium">{ENERGY_LEVELS.find(e => e.value === post.metadata?.energia)?.label}</span>
                      </div>
                    )}
                  </div>
                )}

                {post.post_type === 'meal' && post.metadata && Object.keys(post.metadata).length > 0 && (
                  <div className="mx-4 mb-2 p-3 rounded-lg bg-green-50/60 border border-green-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Coffee className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-[11px] font-semibold text-green-600 uppercase tracking-wide">
                        {MEAL_TYPE_OPTIONS.find(m => m.value === post.metadata?.tipo_refeicao)?.label || 'Refeição'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {post.metadata.calorias && (
                        <div className="bg-white/70 rounded-lg py-1.5">
                          <p className="text-sm font-heading font-bold text-dourado">{post.metadata.calorias}</p>
                          <p className="text-[9px] text-foreground-muted">kcal</p>
                        </div>
                      )}
                      {post.metadata.proteinas && (
                        <div className="bg-white/70 rounded-lg py-1.5">
                          <p className="text-sm font-heading font-bold text-foreground">{post.metadata.proteinas}g</p>
                          <p className="text-[9px] text-foreground-muted">proteina</p>
                        </div>
                      )}
                      {post.metadata.carboidratos && (
                        <div className="bg-white/70 rounded-lg py-1.5">
                          <p className="text-sm font-heading font-bold text-foreground">{post.metadata.carboidratos}g</p>
                          <p className="text-[9px] text-foreground-muted">carbos</p>
                        </div>
                      )}
                      {post.metadata.gorduras && (
                        <div className="bg-white/70 rounded-lg py-1.5">
                          <p className="text-sm font-heading font-bold text-foreground">{post.metadata.gorduras}g</p>
                          <p className="text-[9px] text-foreground-muted">gordura</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {post.post_type === 'achievement' && post.metadata?.titulo && (
                  <div className="mx-4 mb-2 p-3 rounded-lg bg-gradient-to-br from-dourado/10 to-yellow-50 border border-dourado/20">
                    <div className="text-center">
                      <span className="text-2xl">🏆</span>
                      <p className="text-sm font-heading font-bold text-dourado mt-1">{post.metadata.titulo}</p>
                      <p className="text-[10px] text-foreground-muted mt-0.5 uppercase tracking-wider">Conquista Desbloqueada</p>
                    </div>
                  </div>
                )}

                {post.post_type === 'level_up' && post.metadata && (
                  <div className="mx-4 mb-2 p-4 rounded-lg bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border border-red-100">
                    <div className="text-center">
                      <span className="text-3xl">⬆️</span>
                      <p className="text-lg font-heading font-bold text-vinho mt-1">
                        Nível {post.metadata.nivel}
                      </p>
                      <p className="text-sm font-medium text-dourado">{post.metadata.nome_nivel}</p>
                      <p className="text-[10px] text-foreground-muted mt-1 uppercase tracking-wider">Level Up!</p>
                    </div>
                  </div>
                )}

                {post.post_type === 'check_in' && post.metadata && Object.keys(post.metadata).length > 0 && (
                  <div className="mx-4 mb-2 p-3 rounded-lg bg-purple-50/60 border border-purple-100">
                    <div className="flex items-center justify-center gap-4">
                      {post.metadata.humor && (
                        <div className="text-center">
                          <span className="text-2xl">{MOOD_OPTIONS.find(m => m.value === post.metadata?.humor)?.emoji}</span>
                          <p className="text-[10px] text-purple-600 font-medium mt-0.5">{MOOD_OPTIONS.find(m => m.value === post.metadata?.humor)?.label}</p>
                        </div>
                      )}
                      {post.metadata.energia && (
                        <div className="text-center">
                          <span className="text-2xl">{ENERGY_LEVELS.find(e => e.value === post.metadata?.energia)?.emoji}</span>
                          <p className="text-[10px] text-purple-600 font-medium mt-0.5">Energia {ENERGY_LEVELS.find(e => e.value === post.metadata?.energia)?.label}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content */}
                {post.content && (
                  <div className="px-4 pb-3">
                    <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>
                )}

                {/* Image */}
                {post.image_url && (
                  <div className="px-4 pb-3">
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full rounded-lg object-contain"
                    />
                  </div>
                )}

                {/* Reactions bar */}
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-1">
                    {REACTIONS.map(r => {
                      const count = post.reactions_count[r.type] || 0
                      const isActive = post.user_reactions.includes(r.type)
                      return (
                        <button
                          key={r.type}
                          onClick={() => handleReaction(post.id, r.type)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all ${
                            isActive
                              ? 'bg-dourado/15 border border-dourado/30'
                              : 'bg-background-elevated hover:bg-background-elevated/80 border border-transparent'
                          }`}
                        >
                          <span className="text-sm">{r.emoji}</span>
                          {count > 0 && (
                            <span className={`font-medium ${isActive ? 'text-dourado' : 'text-foreground-secondary'}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Stats bar */}
                <div className="px-4 pb-2 flex items-center gap-4">
                  {getTotalReactions(post.reactions_count) > 0 && (
                    <span className="text-xs text-foreground-muted">
                      {getTotalReactions(post.reactions_count)} reacoes
                    </span>
                  )}
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {post.comment_count > 0 ? `${post.comment_count} comentarios` : 'Comentar'}
                  </button>
                </div>

                {/* Comments section */}
                {expandedComments === post.id && (
                  <div className="border-t border-border bg-background-elevated/30">
                    {loadingComments === post.id ? (
                      <div className="p-4 flex justify-center">
                        <Loader2 className="w-5 h-5 text-dourado animate-spin" />
                      </div>
                    ) : (
                      <>
                        {(comments[post.id] || []).map(comment => {
                          const isProfessional = comment.author_role && PROFESSIONAL_ROLES[comment.author_role]
                          return (
                          <div key={comment.id} className={`px-4 py-2.5 flex gap-2.5 ${isProfessional ? 'bg-dourado/5 border-l-2 border-l-dourado' : ''}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isProfessional ? 'bg-gradient-to-br from-dourado to-vinho' : 'bg-gradient-to-br from-foreground-muted/30 to-foreground-muted/10'}`}>
                              <span className={`text-xs font-medium ${isProfessional ? 'text-white' : 'text-foreground-secondary'}`}>
                                {comment.author_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-medium ${isProfessional ? 'text-dourado' : 'text-foreground'}`}>{comment.author_name}</span>
                                {isProfessional && (
                                  <span className={`text-[8px] px-1 py-0.5 rounded-full font-semibold border ${PROFESSIONAL_ROLES[comment.author_role!].color}`}>
                                    {PROFESSIONAL_ROLES[comment.author_role!].label}
                                  </span>
                                )}
                                <span className="text-[10px] text-foreground-muted">{formatDate(comment.created_at)}</span>
                              </div>
                              <p className="text-xs text-foreground-secondary leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                          )
                        })}

                        {/* Add comment */}
                        <div className="p-3 flex items-center gap-2 border-t border-border">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !submittingComment && handleComment(post.id)}
                            className="flex-1 px-3 py-2 rounded-full bg-white border border-border text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:ring-1 focus:ring-dourado/50"
                            placeholder="Comentar..."
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!newComment.trim() || submittingComment}
                            className="p-2 rounded-full bg-dourado text-white disabled:opacity-50 hover:bg-dourado/90 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={() => fetchPosts(false)}
                disabled={loadingMore}
                className="w-full py-3 text-dourado font-medium text-sm hover:text-dourado/80 transition-colors"
              >
                {loadingMore ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Carregar mais'
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center pb-16 sm:pb-0">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground">Novo Post</h3>
              <button
                onClick={() => { setShowCreate(false); resetForm() }}
                className="p-2 hover:bg-background-elevated rounded-lg"
              >
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Post type selector */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {POST_TYPES.map(pt => {
                  const Icon = pt.icon
                  return (
                    <button
                      key={pt.value}
                      onClick={() => { setNewPostType(pt.value); setPostMetadata({}) }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        newPostType === pt.value
                          ? 'bg-dourado text-white'
                          : 'bg-background-elevated text-foreground-secondary'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {pt.label}
                    </button>
                  )
                })}
              </div>

              {/* Type-specific fields */}
              {newPostType === 'workout' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-foreground-muted block mb-1">Duracao (min)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={postMetadata.duracao_min || ''}
                        onChange={(e) => setPostMetadata(prev => ({ ...prev, duracao_min: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-2.5 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm text-center focus:outline-none focus:ring-1 focus:ring-dourado/50"
                        placeholder="45"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground-muted block mb-1">Exercicios</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={postMetadata.exercicios || ''}
                        onChange={(e) => setPostMetadata(prev => ({ ...prev, exercicios: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-2.5 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm text-center focus:outline-none focus:ring-1 focus:ring-dourado/50"
                        placeholder="6"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground-muted block mb-1">Calorias</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={postMetadata.calorias || ''}
                        onChange={(e) => setPostMetadata(prev => ({ ...prev, calorias: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-2.5 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm text-center focus:outline-none focus:ring-1 focus:ring-dourado/50"
                        placeholder="320"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-foreground-muted block mb-1.5">Nivel de energia</label>
                    <div className="flex gap-1.5">
                      {ENERGY_LEVELS.map(e => (
                        <button
                          key={e.value}
                          type="button"
                          onClick={() => setPostMetadata(prev => ({ ...prev, energia: e.value }))}
                          className={`flex-1 py-2 rounded-lg text-center transition-all ${
                            postMetadata.energia === e.value
                              ? 'bg-dourado/15 border-2 border-dourado/40 scale-105'
                              : 'bg-background-elevated border border-transparent'
                          }`}
                        >
                          <span className="text-lg">{e.emoji}</span>
                          <p className="text-[9px] text-foreground-muted mt-0.5">{e.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {newPostType === 'meal' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-foreground-muted block mb-1.5">Tipo de refeição</label>
                    <div className="flex gap-2">
                      {MEAL_TYPE_OPTIONS.map(mt => (
                        <button
                          key={mt.value}
                          type="button"
                          onClick={() => setPostMetadata(prev => ({ ...prev, tipo_refeicao: mt.value }))}
                          className={`flex-1 py-2 px-1 rounded-lg text-center transition-all ${
                            postMetadata.tipo_refeicao === mt.value
                              ? 'bg-dourado/15 border-2 border-dourado/40'
                              : 'bg-background-elevated border border-transparent'
                          }`}
                        >
                          <span className="text-base">{mt.emoji}</span>
                          <p className="text-[9px] text-foreground-muted mt-0.5">{mt.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[11px] text-foreground-muted block mb-1">Calorias</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={postMetadata.calorias || ''}
                        onChange={(e) => setPostMetadata(prev => ({ ...prev, calorias: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-1.5 py-2 rounded-lg border border-border bg-background-input text-foreground text-xs text-center focus:outline-none focus:ring-1 focus:ring-dourado/50"
                        placeholder="450"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground-muted block mb-1">Proteina</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={postMetadata.proteinas || ''}
                        onChange={(e) => setPostMetadata(prev => ({ ...prev, proteinas: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-1.5 py-2 rounded-lg border border-border bg-background-input text-foreground text-xs text-center focus:outline-none focus:ring-1 focus:ring-dourado/50"
                        placeholder="30g"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground-muted block mb-1">Carbos</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={postMetadata.carboidratos || ''}
                        onChange={(e) => setPostMetadata(prev => ({ ...prev, carboidratos: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-1.5 py-2 rounded-lg border border-border bg-background-input text-foreground text-xs text-center focus:outline-none focus:ring-1 focus:ring-dourado/50"
                        placeholder="55g"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-foreground-muted block mb-1">Gordura</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={postMetadata.gorduras || ''}
                        onChange={(e) => setPostMetadata(prev => ({ ...prev, gorduras: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full px-1.5 py-2 rounded-lg border border-border bg-background-input text-foreground text-xs text-center focus:outline-none focus:ring-1 focus:ring-dourado/50"
                        placeholder="15g"
                      />
                    </div>
                  </div>
                </div>
              )}

              {newPostType === 'achievement' && (
                <div>
                  <label className="text-[11px] text-foreground-muted block mb-1">Nome da conquista</label>
                  <input
                    type="text"
                    value={postMetadata.titulo || ''}
                    onChange={(e) => setPostMetadata(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-dourado/50"
                    placeholder="Ex: Primeiro PR no supino!"
                  />
                </div>
              )}

              {newPostType === 'check_in' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-foreground-muted block mb-1.5">Como você está?</label>
                    <div className="flex gap-1.5">
                      {MOOD_OPTIONS.map(m => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setPostMetadata(prev => ({ ...prev, humor: m.value }))}
                          className={`flex-1 py-2 rounded-lg text-center transition-all ${
                            postMetadata.humor === m.value
                              ? 'bg-dourado/15 border-2 border-dourado/40 scale-105'
                              : 'bg-background-elevated border border-transparent'
                          }`}
                        >
                          <span className="text-lg">{m.emoji}</span>
                          <p className="text-[9px] text-foreground-muted mt-0.5">{m.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-foreground-muted block mb-1.5">Nivel de energia</label>
                    <div className="flex gap-1.5">
                      {ENERGY_LEVELS.map(e => (
                        <button
                          key={e.value}
                          type="button"
                          onClick={() => setPostMetadata(prev => ({ ...prev, energia: e.value }))}
                          className={`flex-1 py-2 rounded-lg text-center transition-all ${
                            postMetadata.energia === e.value
                              ? 'bg-dourado/15 border-2 border-dourado/40 scale-105'
                              : 'bg-background-elevated border border-transparent'
                          }`}
                        >
                          <span className="text-lg">{e.emoji}</span>
                          <p className="text-[9px] text-foreground-muted mt-0.5">{e.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={newPostType === 'free_text' ? 4 : 2}
                className="w-full px-3 py-3 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                placeholder={
                  newPostType === 'workout' ? 'Notas sobre o treino (opcional)...' :
                  newPostType === 'meal' ? 'Notas sobre a refeição (opcional)...' :
                  newPostType === 'achievement' ? 'Celebre sua conquista!' :
                  newPostType === 'check_in' ? 'Algo mais que queira compartilhar? (opcional)' :
                  'O que você quer compartilhar?'
                }
                autoFocus={newPostType === 'free_text'}
              />

              {/* Image upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full rounded-lg object-cover max-h-48"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border text-foreground-secondary hover:border-dourado hover:text-dourado transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-sm font-medium">Adicionar foto</span>
                </button>
              )}

            </div>

            <div className="flex gap-3 p-4 border-t border-border flex-shrink-0">
              <button
                onClick={() => { setShowCreate(false); resetForm() }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!canPost || creating}
                className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
              >
                {creating ? (selectedImage ? 'Enviando foto...' : 'Publicando...') : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
