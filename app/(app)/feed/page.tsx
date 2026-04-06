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
  Sparkles,
  Star,
  ChevronLeft,
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
  admin_reacted?: boolean
  is_highlight_author?: boolean
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

const TEMPLATE_BACKGROUNDS = [
  { id: 'cafe_dourado', label: 'Elegante', gradient: 'linear-gradient(135deg, #322b29 0%, #c29863 100%)' },
  { id: 'vinho_dourado', label: 'Premium', gradient: 'linear-gradient(135deg, #663739 0%, #c29863 100%)' },
  { id: 'nude_seda', label: 'Suave', gradient: 'linear-gradient(135deg, #ae9b89 0%, #ddd5c7 100%)' },
  { id: 'azul_cafe', label: 'Oceano', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #322b29 100%)' },
  { id: 'roxo_vinho', label: 'Noite', gradient: 'linear-gradient(135deg, #4c1d6e 0%, #663739 100%)' },
  { id: 'verde_cafe', label: 'Natural', gradient: 'linear-gradient(135deg, #1a4731 0%, #322b29 100%)' },
]

interface CommunityStats {
  active_today: number
  posts_week: number
  workouts_week: number
  reactions_week: number
  user_posted_today: boolean
}

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

  // Active users today (kept for potential future use)
  const [, setActiveUsers] = useState<{ user_id: string; name: string; role: string }[]>([])

  // Unread feed badge + new posts banner
  const { markAsRead, details: unreadDetails, refetch: refetchUnread } = useUnreadFeed()
  const [newPostsBannerCount, setNewPostsBannerCount] = useState(0)
  const latestPostTimestamp = useRef<string | null>(null)
  const [interactionsBanner, setInteractionsBanner] = useState<string | null>(null)

  // Community stats + weekly highlight + masonry
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null)
  const [weeklyHighlight, setWeeklyHighlight] = useState<Post | null>(null)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

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
    // Fetch community stats
    fetch('/api/feed/community-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCommunityStats(data.stats)
      })
      .catch(() => {})
    // Fetch weekly highlight
    fetch('/api/feed/weekly-highlight')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.highlight) setWeeklyHighlight(data.highlight)
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

  // Auto-load comments when fullscreen modal opens
  useEffect(() => {
    if (selectedPostId && !comments[selectedPostId]) {
      setLoadingComments(selectedPostId)
      fetch(`/api/feed/${selectedPostId}/comments`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setComments(prev => ({ ...prev, [selectedPostId]: data.comments || [] }))
          }
        })
        .catch(() => {})
        .finally(() => setLoadingComments(null))
    }
    setNewComment('')
  }, [selectedPostId]) // eslint-disable-line react-hooks/exhaustive-deps

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
    setSelectedTemplate(null)
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
          metadata: (hasMetadata || selectedTemplate) ? { ...postMetadata, ...(selectedTemplate ? { template_bg: selectedTemplate } : {}) } : null,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) || weeklyHighlight : null

  // Masonry card renderer
  const renderMasonryCard = (post: Post) => {
    const totalReactions = getTotalReactions(post.reactions_count)
    const hasInteractions = totalReactions > 0 || post.comment_count > 0

    const cardFooter = (textColor: string, bgColor: string) => (
      <div className={`px-3 pb-3 flex items-center justify-between ${textColor}`}>
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full ${bgColor} flex items-center justify-center`}>
            <span className={`text-[9px] font-bold ${textColor}`}>{post.author_initial}</span>
          </div>
          <span className="text-[11px] font-medium truncate max-w-[80px]">{post.author_name}</span>
          {post.is_highlight_author && <span className="text-[10px]">⭐</span>}
          {post.author_tier && post.author_tier !== 'bronze' && (
            <span className="text-[10px]">{TIER_ICONS[post.author_tier]}</span>
          )}
        </div>
        {hasInteractions && (
          <div className="flex items-center gap-1.5 text-[10px] opacity-70">
            {totalReactions > 0 && <span>❤️ {totalReactions}</span>}
            {post.comment_count > 0 && <span>💬 {post.comment_count}</span>}
          </div>
        )}
      </div>
    )

    const adminBadge = post.admin_reacted ? (
      <div className="px-3 pt-2.5">
        <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-dourado/20 text-dourado font-semibold">
          <Sparkles className="w-2.5 h-2.5" /> Equipe Felice
        </span>
      </div>
    ) : null

    // WORKOUT CARD
    if (post.post_type === 'workout') {
      return (
        <div
          onClick={() => setSelectedPostId(post.id)}
          className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #322b29 100%)' }}
        >
          {adminBadge}
          <div className="p-3.5 pb-2">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Dumbbell className="w-3.5 h-3.5 text-white/60" />
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest">Treino</span>
            </div>
            {post.metadata?.duracao_min && (
              <p className="font-heading text-3xl font-bold text-white leading-none">
                {post.metadata.duracao_min}<span className="text-base text-white/50 ml-0.5">min</span>
              </p>
            )}
            <div className="flex gap-3 mt-1.5">
              {post.metadata?.exercicios && (
                <span className="text-[11px] text-white/60">{post.metadata.exercicios} exerc.</span>
              )}
              {post.metadata?.calorias && (
                <span className="text-[11px] text-white/60">{post.metadata.calorias} kcal</span>
              )}
            </div>
            {post.metadata?.energia && (
              <div className="mt-2">
                <span className="text-sm">{ENERGY_LEVELS.find(e => e.value === post.metadata?.energia)?.emoji}</span>
              </div>
            )}
          </div>
          {post.content && (
            <p className="px-3.5 pb-1.5 text-white/60 text-[11px] line-clamp-2">{post.content}</p>
          )}
          {post.image_url && (
            <div className="px-3 pb-2">
              <img src={post.image_url} alt="" className="w-full rounded-lg object-cover max-h-32" />
            </div>
          )}
          {cardFooter('text-white/80', 'bg-white/20')}
        </div>
      )
    }

    // MEAL CARD
    if (post.post_type === 'meal') {
      if (post.image_url) {
        return (
          <div
            onClick={() => setSelectedPostId(post.id)}
            className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98] bg-white border border-border"
          >
            <div className="relative">
              <img src={post.image_url} alt="" className="w-full object-cover" style={{ maxHeight: '180px' }} />
              {post.metadata && Object.keys(post.metadata).length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
                  <div className="flex gap-2">
                    {post.metadata.calorias && (
                      <span className="text-[10px] text-white font-semibold bg-white/20 px-1.5 py-0.5 rounded">{post.metadata.calorias} kcal</span>
                    )}
                    {post.metadata.proteinas && (
                      <span className="text-[10px] text-white font-semibold bg-white/20 px-1.5 py-0.5 rounded">{post.metadata.proteinas}g prot</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            {adminBadge}
            {post.content && (
              <p className="px-3 pt-2 pb-1 text-foreground text-[11px] line-clamp-2">{post.content}</p>
            )}
            {cardFooter('text-foreground-secondary', 'bg-foreground-muted/20')}
          </div>
        )
      }
      return (
        <div
          onClick={() => setSelectedPostId(post.id)}
          className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #2d5a3d 0%, #322b29 100%)' }}
        >
          {adminBadge}
          <div className="p-3.5 pb-2">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Coffee className="w-3.5 h-3.5 text-white/60" />
              <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest">
                {MEAL_TYPE_OPTIONS.find(m => m.value === post.metadata?.tipo_refeicao)?.label || 'Refeição'}
              </span>
            </div>
            {post.metadata && (
              <div className="grid grid-cols-2 gap-1.5">
                {post.metadata.calorias && (
                  <div className="bg-white/10 rounded-lg py-1.5 px-2 text-center">
                    <p className="font-heading text-lg font-bold text-white">{post.metadata.calorias}</p>
                    <p className="text-[8px] text-white/50">kcal</p>
                  </div>
                )}
                {post.metadata.proteinas && (
                  <div className="bg-white/10 rounded-lg py-1.5 px-2 text-center">
                    <p className="font-heading text-lg font-bold text-white">{post.metadata.proteinas}g</p>
                    <p className="text-[8px] text-white/50">proteina</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {post.content && (
            <p className="px-3.5 pb-1.5 text-white/60 text-[11px] line-clamp-2">{post.content}</p>
          )}
          {cardFooter('text-white/80', 'bg-white/20')}
        </div>
      )
    }

    // ACHIEVEMENT CARD
    if (post.post_type === 'achievement') {
      return (
        <div
          onClick={() => setSelectedPostId(post.id)}
          className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98] animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, #c29863 0%, #663739 100%)' }}
        >
          {adminBadge}
          <div className="p-4 text-center">
            <span className="text-3xl">🏆</span>
            {post.metadata?.titulo && (
              <p className="font-heading text-base font-bold text-white mt-2 leading-tight">{post.metadata.titulo}</p>
            )}
            <p className="text-[9px] text-white/60 mt-1 uppercase tracking-widest">Conquista Desbloqueada</p>
          </div>
          {post.content && (
            <p className="px-3.5 pb-1.5 text-white/70 text-[11px] line-clamp-2 text-center">{post.content}</p>
          )}
          {cardFooter('text-white/80', 'bg-white/20')}
        </div>
      )
    }

    // LEVEL UP CARD
    if (post.post_type === 'level_up') {
      return (
        <div
          onClick={() => setSelectedPostId(post.id)}
          className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #663739 0%, #c29863 100%)' }}
        >
          <div className="p-4 text-center">
            <span className="text-3xl">⬆️</span>
            {post.metadata?.nivel && (
              <p className="font-heading text-2xl font-bold text-white mt-1">Nível {post.metadata.nivel}</p>
            )}
            {post.metadata?.nome_nivel && (
              <p className="text-sm text-white/80 font-medium">{post.metadata.nome_nivel}</p>
            )}
            <p className="text-[9px] text-white/50 mt-1 uppercase tracking-widest">Level Up!</p>
          </div>
          {post.content && (
            <p className="px-3.5 pb-1.5 text-white/70 text-[11px] line-clamp-2 text-center">{post.content}</p>
          )}
          {cardFooter('text-white/80', 'bg-white/20')}
        </div>
      )
    }

    // CHECK-IN CARD
    if (post.post_type === 'check_in') {
      return (
        <div
          onClick={() => setSelectedPostId(post.id)}
          className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #4c1d6e 0%, #322b29 100%)' }}
        >
          {adminBadge}
          <div className="p-3.5">
            <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest">Check-in</span>
            <div className="flex items-center justify-center gap-4 mt-3 mb-1">
              {post.metadata?.humor && (
                <div className="text-center">
                  <span className="text-2xl">{MOOD_OPTIONS.find(m => m.value === post.metadata?.humor)?.emoji}</span>
                  <p className="text-[9px] text-white/60 mt-0.5">{MOOD_OPTIONS.find(m => m.value === post.metadata?.humor)?.label}</p>
                </div>
              )}
              {post.metadata?.energia && (
                <div className="text-center">
                  <span className="text-2xl">{ENERGY_LEVELS.find(e => e.value === post.metadata?.energia)?.emoji}</span>
                  <p className="text-[9px] text-white/60 mt-0.5">Energia</p>
                </div>
              )}
            </div>
          </div>
          {post.content && (
            <p className="px-3.5 pb-1.5 text-white/60 text-[11px] line-clamp-2">{post.content}</p>
          )}
          {cardFooter('text-white/80', 'bg-white/20')}
        </div>
      )
    }

    // FREE TEXT / DEFAULT CARD
    const templateBg = post.metadata?.template_bg
    const template = templateBg ? TEMPLATE_BACKGROUNDS.find(t => t.id === templateBg) : null

    if (template) {
      // Template card with gradient background
      return (
        <div
          onClick={() => setSelectedPostId(post.id)}
          className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98]"
          style={{ background: template.gradient }}
        >
          {adminBadge}
          <div className="p-4 min-h-[120px] flex flex-col justify-center">
            {post.content && (
              <p className="text-white text-sm font-medium leading-relaxed text-center italic">
                &ldquo;{post.content}&rdquo;
              </p>
            )}
          </div>
          {post.image_url && (
            <div className="px-3 pb-2">
              <img src={post.image_url} alt="" className="w-full rounded-lg object-cover max-h-32" />
            </div>
          )}
          {cardFooter('text-white/80', 'bg-white/20')}
        </div>
      )
    }

    // Plain free text card (white)
    return (
      <div
        onClick={() => setSelectedPostId(post.id)}
        className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98] bg-white border border-border"
      >
        {adminBadge}
        {post.image_url && (
          <img src={post.image_url} alt="" className="w-full object-cover" style={{ maxHeight: '200px' }} />
        )}
        <div className="p-3.5">
          {post.content && (
            <p className="text-foreground text-[13px] leading-relaxed whitespace-pre-wrap line-clamp-4">{post.content}</p>
          )}
        </div>
        {cardFooter('text-foreground-secondary', 'bg-foreground-muted/20')}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-heading font-bold text-lg text-foreground">Comunidade</h1>
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

      {/* Community Live Bar */}
      {communityStats && (
        <div className="mx-3 mt-3 mb-1">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-border overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-heading font-bold text-foreground">{communityStats.active_today}</span>
              <span className="text-foreground-muted">ativos</span>
            </div>
            <div className="w-px h-4 bg-border flex-shrink-0" />
            <div className="flex items-center gap-1 text-xs whitespace-nowrap">
              <span className="text-sm">💪</span>
              <span className="font-heading font-bold text-foreground">{communityStats.workouts_week}</span>
              <span className="text-foreground-muted">treinos</span>
            </div>
            <div className="w-px h-4 bg-border flex-shrink-0" />
            <div className="flex items-center gap-1 text-xs whitespace-nowrap">
              <span className="text-sm">🔥</span>
              <span className="font-heading font-bold text-foreground">{communityStats.reactions_week}</span>
              <span className="text-foreground-muted">reações</span>
            </div>
            <div className="w-px h-4 bg-border flex-shrink-0" />
            <div className="flex items-center gap-1 text-xs whitespace-nowrap">
              <span className="text-sm">📝</span>
              <span className="font-heading font-bold text-foreground">{communityStats.posts_week}</span>
              <span className="text-foreground-muted">posts</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactions banner - comments/reactions on your posts */}
      {interactionsBanner && (
        <div className="mx-3 mt-2 mb-1">
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

      {/* Auto-suggest banner - if user hasn't posted today */}
      {communityStats && !communityStats.user_posted_today && !loading && (
        <div className="mx-3 mt-2 mb-1">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-dourado/10 to-dourado/5 border border-dourado/20 text-left transition-all active:scale-[0.99]"
          >
            <span className="text-xl">✨</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Compartilhe seu dia!</p>
              <p className="text-[11px] text-foreground-muted">Mostre sua evolução para a comunidade</p>
            </div>
            <Plus className="w-5 h-5 text-dourado" />
          </button>
        </div>
      )}

      {/* Weekly Highlight */}
      {weeklyHighlight && (
        <div className="mx-3 mt-3 mb-1">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Star className="w-3.5 h-3.5 text-dourado" />
            <span className="text-[11px] font-semibold text-dourado uppercase tracking-wider">Destaque da Semana</span>
          </div>
          <div
            onClick={() => setSelectedPostId(weeklyHighlight.id)}
            className="rounded-2xl overflow-hidden border-2 border-dourado/30 cursor-pointer shadow-[0_2px_16px_rgba(194,152,99,0.12)] active:scale-[0.99] transition-transform"
            style={{ background: 'linear-gradient(135deg, rgba(194,152,99,0.08) 0%, #ffffff 100%)' }}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-dourado to-vinho flex items-center justify-center flex-shrink-0 ring-2 ring-dourado/30">
                <span className="text-white font-bold text-sm">{weeklyHighlight.author_initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">⭐</span>
                  <p className="font-heading font-bold text-foreground text-sm">{weeklyHighlight.author_name}</p>
                  {weeklyHighlight.author_tier && weeklyHighlight.author_tier !== 'bronze' && (
                    <span className="text-xs">{TIER_ICONS[weeklyHighlight.author_tier]}</span>
                  )}
                </div>
                {weeklyHighlight.content && (
                  <p className="text-xs text-foreground-secondary line-clamp-2 mt-0.5">{weeklyHighlight.content}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {getTotalReactions(weeklyHighlight.reactions_count) > 0 && (
                    <span className="text-[11px] text-foreground-muted">❤️ {getTotalReactions(weeklyHighlight.reactions_count)}</span>
                  )}
                  {weeklyHighlight.comment_count > 0 && (
                    <span className="text-[11px] text-foreground-muted">💬 {weeklyHighlight.comment_count}</span>
                  )}
                  {POST_TYPE_LABELS[weeklyHighlight.post_type] && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${POST_TYPE_LABELS[weeklyHighlight.post_type].color}`}>
                      {POST_TYPE_LABELS[weeklyHighlight.post_type].label}
                    </span>
                  )}
                </div>
              </div>
            </div>
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

      {/* Masonry Feed */}
      <div className="px-3 pt-3 pb-4">
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
            <div style={{ columns: 2, columnGap: '10px' }}>
              {posts.map(post => (
                <div key={post.id} id={`post-${post.id}`} className="break-inside-avoid mb-2.5">
                  {renderMasonryCard(post)}
                </div>
              ))}
            </div>

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

      {/* Fullscreen Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPostId(null)}>
          <div
            className="absolute inset-x-0 bottom-0 max-h-[92vh] bg-white rounded-t-3xl overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
              <button
                onClick={() => setSelectedPostId(null)}
                className="p-1.5 rounded-lg hover:bg-background-elevated transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-dourado to-vinho flex items-center justify-center">
                <span className="text-white font-bold text-xs">{selectedPost.author_initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-foreground text-sm truncate">{selectedPost.author_name}</p>
                  {selectedPost.is_highlight_author && <span className="text-xs">⭐</span>}
                  {selectedPost.author_tier && selectedPost.author_tier !== 'bronze' && (
                    <span className="text-xs">{TIER_ICONS[selectedPost.author_tier]}</span>
                  )}
                  {selectedPost.author_role && PROFESSIONAL_ROLES[selectedPost.author_role] && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${PROFESSIONAL_ROLES[selectedPost.author_role].color}`}>
                      {PROFESSIONAL_ROLES[selectedPost.author_role].label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted">{formatDate(selectedPost.created_at)}</span>
                  {POST_TYPE_LABELS[selectedPost.post_type] && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${POST_TYPE_LABELS[selectedPost.post_type].color}`}>
                      {POST_TYPE_LABELS[selectedPost.post_type].label}
                    </span>
                  )}
                </div>
              </div>
              {selectedPost.is_own && (
                <button
                  onClick={() => { handleDeletePost(selectedPost.id); setSelectedPostId(null); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-foreground-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal content - scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Admin reacted badge */}
              {selectedPost.admin_reacted && (
                <div className="px-4 pt-3">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-dourado/10 text-dourado font-semibold border border-dourado/20">
                    <Sparkles className="w-3 h-3" /> Aprovado pela Equipe Felice
                  </span>
                </div>
              )}

              {/* Type-specific card in modal */}
              {selectedPost.post_type === 'workout' && selectedPost.metadata && Object.keys(selectedPost.metadata).length > 0 && (
                <div className="mx-4 mt-3 p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #322b29 100%)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Dumbbell className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wide">Treino Completo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {selectedPost.metadata.duracao_min && (
                      <div className="bg-white/10 rounded-lg py-2">
                        <p className="text-xl font-heading font-bold text-white">{selectedPost.metadata.duracao_min}</p>
                        <p className="text-[9px] text-white/50">minutos</p>
                      </div>
                    )}
                    {selectedPost.metadata.exercicios && (
                      <div className="bg-white/10 rounded-lg py-2">
                        <p className="text-xl font-heading font-bold text-white">{selectedPost.metadata.exercicios}</p>
                        <p className="text-[9px] text-white/50">exercicios</p>
                      </div>
                    )}
                    {selectedPost.metadata.calorias && (
                      <div className="bg-white/10 rounded-lg py-2">
                        <p className="text-xl font-heading font-bold text-white">{selectedPost.metadata.calorias}</p>
                        <p className="text-[9px] text-white/50">kcal</p>
                      </div>
                    )}
                  </div>
                  {selectedPost.metadata.energia && (
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <span className="text-sm">{ENERGY_LEVELS.find(e => e.value === selectedPost.metadata?.energia)?.emoji}</span>
                      <span className="text-[11px] text-white/60 font-medium">{ENERGY_LEVELS.find(e => e.value === selectedPost.metadata?.energia)?.label}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedPost.post_type === 'meal' && selectedPost.metadata && Object.keys(selectedPost.metadata).length > 0 && (
                <div className="mx-4 mt-3 p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #2d5a3d 0%, #322b29 100%)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Coffee className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wide">
                      {MEAL_TYPE_OPTIONS.find(m => m.value === selectedPost.metadata?.tipo_refeicao)?.label || 'Refeição'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    {selectedPost.metadata.calorias && (
                      <div className="bg-white/10 rounded-lg py-1.5">
                        <p className="text-sm font-heading font-bold text-white">{selectedPost.metadata.calorias}</p>
                        <p className="text-[8px] text-white/50">kcal</p>
                      </div>
                    )}
                    {selectedPost.metadata.proteinas && (
                      <div className="bg-white/10 rounded-lg py-1.5">
                        <p className="text-sm font-heading font-bold text-white">{selectedPost.metadata.proteinas}g</p>
                        <p className="text-[8px] text-white/50">proteina</p>
                      </div>
                    )}
                    {selectedPost.metadata.carboidratos && (
                      <div className="bg-white/10 rounded-lg py-1.5">
                        <p className="text-sm font-heading font-bold text-white">{selectedPost.metadata.carboidratos}g</p>
                        <p className="text-[8px] text-white/50">carbos</p>
                      </div>
                    )}
                    {selectedPost.metadata.gorduras && (
                      <div className="bg-white/10 rounded-lg py-1.5">
                        <p className="text-sm font-heading font-bold text-white">{selectedPost.metadata.gorduras}g</p>
                        <p className="text-[8px] text-white/50">gordura</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPost.post_type === 'achievement' && selectedPost.metadata?.titulo && (
                <div className="mx-4 mt-3 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #c29863 0%, #663739 100%)' }}>
                  <div className="text-center">
                    <span className="text-3xl">🏆</span>
                    <p className="text-base font-heading font-bold text-white mt-1">{selectedPost.metadata.titulo}</p>
                    <p className="text-[10px] text-white/60 mt-0.5 uppercase tracking-wider">Conquista Desbloqueada</p>
                  </div>
                </div>
              )}

              {selectedPost.post_type === 'level_up' && selectedPost.metadata && (
                <div className="mx-4 mt-3 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #663739 0%, #c29863 100%)' }}>
                  <div className="text-center">
                    <span className="text-3xl">⬆️</span>
                    <p className="text-xl font-heading font-bold text-white mt-1">Nível {selectedPost.metadata.nivel}</p>
                    <p className="text-sm text-white/80 font-medium">{selectedPost.metadata.nome_nivel}</p>
                  </div>
                </div>
              )}

              {selectedPost.post_type === 'check_in' && selectedPost.metadata && Object.keys(selectedPost.metadata).length > 0 && (
                <div className="mx-4 mt-3 p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #4c1d6e 0%, #322b29 100%)' }}>
                  <div className="flex items-center justify-center gap-6">
                    {selectedPost.metadata.humor && (
                      <div className="text-center">
                        <span className="text-3xl">{MOOD_OPTIONS.find(m => m.value === selectedPost.metadata?.humor)?.emoji}</span>
                        <p className="text-[10px] text-white/60 font-medium mt-0.5">{MOOD_OPTIONS.find(m => m.value === selectedPost.metadata?.humor)?.label}</p>
                      </div>
                    )}
                    {selectedPost.metadata.energia && (
                      <div className="text-center">
                        <span className="text-3xl">{ENERGY_LEVELS.find(e => e.value === selectedPost.metadata?.energia)?.emoji}</span>
                        <p className="text-[10px] text-white/60 font-medium mt-0.5">Energia</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Template background for free_text */}
              {selectedPost.post_type === 'free_text' && selectedPost.metadata?.template_bg && (
                <div
                  className="mx-4 mt-3 p-6 rounded-lg min-h-[100px] flex items-center justify-center"
                  style={{ background: TEMPLATE_BACKGROUNDS.find(t => t.id === selectedPost.metadata?.template_bg)?.gradient || '' }}
                >
                  {selectedPost.content && (
                    <p className="text-white text-base font-medium leading-relaxed text-center italic">
                      &ldquo;{selectedPost.content}&rdquo;
                    </p>
                  )}
                </div>
              )}

              {/* Content text (if no template) */}
              {selectedPost.content && !(selectedPost.post_type === 'free_text' && selectedPost.metadata?.template_bg) && (
                <div className="px-4 pt-3">
                  <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                </div>
              )}

              {/* Image */}
              {selectedPost.image_url && (
                <div className="px-4 pt-3">
                  <img src={selectedPost.image_url} alt="Post" className="w-full rounded-lg object-contain" />
                </div>
              )}

              {/* Reactions bar */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center gap-1 flex-wrap">
                  {REACTIONS.map(r => {
                    const count = selectedPost.reactions_count[r.type] || 0
                    const isActive = selectedPost.user_reactions.includes(r.type)
                    return (
                      <button
                        key={r.type}
                        onClick={() => handleReaction(selectedPost.id, r.type)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs transition-all ${
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

              {/* Comments section - always visible in modal */}
              <div className="border-t border-border mt-2">
                <div className="px-4 py-2.5">
                  <p className="text-xs font-semibold text-foreground-secondary">
                    {selectedPost.comment_count > 0 ? `${selectedPost.comment_count} comentários` : 'Comentários'}
                  </p>
                </div>
                {loadingComments === selectedPost.id ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="w-5 h-5 text-dourado animate-spin" />
                  </div>
                ) : (
                  (comments[selectedPost.id] || []).map(comment => {
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
                  })
                )}

                {/* Add comment input */}
                <div className="p-3 flex items-center gap-2 border-t border-border">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !submittingComment && handleComment(selectedPost.id)}
                    className="flex-1 px-3 py-2 rounded-full bg-background-input border border-border text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:ring-1 focus:ring-dourado/50"
                    placeholder="Comentar..."
                  />
                  <button
                    onClick={() => handleComment(selectedPost.id)}
                    disabled={!newComment.trim() || submittingComment}
                    className="p-2 rounded-full bg-dourado text-white disabled:opacity-50 hover:bg-dourado/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

              {/* Template selector for free text posts */}
              {newPostType === 'free_text' && (
                <div>
                  <label className="text-[11px] text-foreground-muted block mb-2">Fundo do post (opcional)</label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate(null)}
                      className={`w-12 h-12 rounded-xl border-2 flex-shrink-0 flex items-center justify-center text-xs font-medium transition-all ${
                        !selectedTemplate ? 'border-dourado bg-white text-foreground' : 'border-border bg-background-elevated text-foreground-muted'
                      }`}
                    >
                      Aa
                    </button>
                    {TEMPLATE_BACKGROUNDS.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`w-12 h-12 rounded-xl border-2 flex-shrink-0 transition-all ${
                          selectedTemplate === t.id ? 'border-dourado scale-110 shadow-md' : 'border-transparent'
                        }`}
                        style={{ background: t.gradient }}
                        title={t.label}
                      />
                    ))}
                  </div>
                </div>
              )}

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
