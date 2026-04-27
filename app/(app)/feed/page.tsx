'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useShareImage } from '@/hooks/use-share-image'
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
  PenLine,
  Camera,
  ArrowUp,
  Sparkles,
  ChevronLeft,
  Share2,
  Heart,
} from 'lucide-react'
import { toast } from 'sonner'
import { useUnreadFeed } from '@/hooks/use-unread-feed'
import { compressImageClient } from '@/lib/images/compress-client'

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
  level_up: { label: 'Level Up', color: 'bg-red-50 text-red-600' },
}

const ENERGY_LEVELS = [
  { value: 1, emoji: '😴', label: 'Baixa' },
  { value: 2, emoji: '😐', label: 'Moderada' },
  { value: 3, emoji: '🙂', label: 'Boa' },
  { value: 4, emoji: '😊', label: 'Alta' },
  { value: 5, emoji: '🔥', label: 'Máxima' },
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

interface ActiveChallenge {
  id: string
  title: string
  description: string
  end_date: string
  participant_count: number
  is_joined: boolean
  user_score: number
  has_started: boolean
}

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
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Unread feed badge + new posts banner
  const { markAsRead, details: unreadDetails, refetch: refetchUnread } = useUnreadFeed()
  const [newPostsBannerCount, setNewPostsBannerCount] = useState(0)
  const latestPostTimestamp = useRef<string | null>(null)
  const [interactionsBanner, setInteractionsBanner] = useState<string | null>(null)

  // Community stats + masonry
  const [, setCommunityStats] = useState<CommunityStats | null>(null)
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Double-tap to like
  const lastTap = useRef<Record<string, number>>({})
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heartBurst, setHeartBurst] = useState<string | null>(null)

  // Compartilhar post como story (PNG)
  const storyTemplateRef = useRef<HTMLDivElement>(null)
  const { generateImage, downloadImage, isGenerating: sharing } = useShareImage({ pixelRatio: 2, backgroundColor: '#322b29' })
  const handleShareStory = async () => {
    if (!storyTemplateRef.current) return
    try {
      const blob = await generateImage(storyTemplateRef.current)
      if (blob) {
        downloadImage(blob, `felice-feed-${Date.now()}.png`)
        toast.success('Story salvo! Compartilhe nas suas redes 📸')
      } else {
        toast.error('Não foi possível gerar a imagem')
      }
    } catch {
      toast.error('Erro ao gerar story')
    }
  }

  // Menções @paciente em comentários
  interface MentionSuggestion {
    user_id: string
    name: string
    handle: string
    initial: string
    role: string
  }
  const [mentionResults, setMentionResults] = useState<MentionSuggestion[]>([])
  const [mentionOpen, setMentionOpen] = useState(false)
  const mentionDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)

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
    // Fetch community stats
    fetch('/api/feed/community-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCommunityStats(data.stats)
      })
      .catch(() => {})
    // Fetch desafio ativo (mais recente em curso) para card no topo do feed
    fetch('/api/challenges')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.challenges)) {
          const current = data.challenges.find((c: ActiveChallenge) => c.has_started)
          if (current) setActiveChallenge(current)
        }
      })
      .catch(() => {})
    // Fetch quem postou hoje (timezone SP correto via endpoint) — usado na barra de avatares
    fetch('/api/feed/active-today')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.active_users)) {
          setActiveUsers(data.active_users)
        }
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
  }, [posts.length])

  useEffect(() => {
    fetchPosts(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setMentionOpen(false)
    setMentionResults([])
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
  // Foto é obrigatória em todos os posts do usuário
  const canPost = !!selectedImage && (newPostContent.trim() || hasMetadata || true)

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
      // Upload image first if selected (comprime no client para evitar 413/timeout)
      let imageUrl: string | null = null
      if (selectedImage) {
        let fileToUpload: File = selectedImage
        try {
          fileToUpload = await compressImageClient(selectedImage)
        } catch {
          // Se a compressão falhar, segue com o arquivo original
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)
        const uploadRes = await fetch('/api/feed/upload', {
          method: 'POST',
          body: formData,
        })
        if (!uploadRes.ok) {
          const status = uploadRes.status
          if (status === 413) {
            toast.error('Imagem muito grande. Tente uma foto menor.')
          } else if (status === 401) {
            toast.error('Sessão expirada. Faça login novamente.')
          } else if (status >= 500) {
            toast.error('Servidor indisponível ao enviar imagem. Tente de novo.')
          } else {
            const txt = await uploadRes.text().catch(() => '')
            toast.error(txt ? `Erro ao enviar imagem (${status})` : 'Erro ao enviar imagem')
          }
          setCreating(false)
          return
        }
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
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Sessão expirada. Faça login novamente.')
        } else if (res.status >= 500) {
          toast.error('Servidor indisponível. Tente de novo em instantes.')
        } else {
          const data = await res.json().catch(() => null)
          toast.error(data?.error || `Erro ao publicar (${res.status})`)
        }
        setCreating(false)
        return
      }
      const data = await res.json()
      if (data.success) {
        setShowCreate(false)
        resetForm()
        fetchPosts(true)
        if (data.points_awarded > 0) {
          toast.success(`Post publicado! +${data.points_awarded} pts`)
        } else {
          toast.success('Post publicado!')
        }
      } else {
        toast.error(data.error || 'Erro ao publicar')
      }
    } catch (error) {
      console.error('Erro ao criar post:', error)
      const msg = error instanceof Error ? error.message : ''
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) {
        toast.error('Sem conexão. Verifique sua internet.')
      } else {
        toast.error('Erro ao publicar post. Tente novamente.')
      }
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

  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) || null : null

  const scrollToPost = (postId: string) => {
    const el = document.getElementById(`post-${postId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Extrai o termo após "@" imediatamente antes do cursor (retorna null se não houver)
  const getMentionQuery = (value: string): string | null => {
    const m = value.match(/(?:^|\s)@([a-z0-9._-]{0,20})$/i)
    return m ? m[1] : null
  }

  const handleCommentChange = (value: string) => {
    setNewComment(value)
    const q = getMentionQuery(value)
    if (q === null) {
      setMentionOpen(false)
      return
    }
    setMentionOpen(true)
    if (mentionDebounce.current) clearTimeout(mentionDebounce.current)
    mentionDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/feed/mentions?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (data.success) setMentionResults(data.results || [])
      } catch {
        // silent
      }
    }, 180)
  }

  const selectMention = (m: MentionSuggestion) => {
    const replaced = newComment.replace(/(^|\s)@([a-z0-9._-]{0,20})$/i, `$1@${m.handle} `)
    setNewComment(replaced)
    setMentionOpen(false)
    setMentionResults([])
    commentInputRef.current?.focus()
  }

  // Renderiza texto com @menções destacadas em dourado
  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@[a-z0-9._-]+)/gi)
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="text-dourado font-semibold">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  // Masonry card renderer — estilo Instagram: foto grande em destaque, overlays com metadata
  const renderMasonryCard = (post: Post) => {
    const totalReactions = getTotalReactions(post.reactions_count)
    const hasInteractions = totalReactions > 0 || post.comment_count > 0

    // Chip de tipo (canto superior esquerdo sobre a foto)
    const typeChip = (() => {
      if (post.post_type === 'workout') {
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm uppercase tracking-wider">
            <Dumbbell className="w-2.5 h-2.5" /> Treino
          </span>
        )
      }
      if (post.post_type === 'meal') {
        const mealLabel = MEAL_TYPE_OPTIONS.find(m => m.value === post.metadata?.tipo_refeicao)?.label || 'Refeição'
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm uppercase tracking-wider">
            <Coffee className="w-2.5 h-2.5" /> {mealLabel}
          </span>
        )
      }
      if (post.post_type === 'achievement') {
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-dourado/90 text-white backdrop-blur-sm uppercase tracking-wider">
            🏆 Conquista
          </span>
        )
      }
      if (post.post_type === 'level_up') {
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-vinho to-dourado text-white backdrop-blur-sm uppercase tracking-wider">
            ⬆️ Level Up
          </span>
        )
      }
      return null
    })()

    // Metadata chips (sobre a foto, parte inferior)
    const metaChips: React.ReactNode[] = []
    if (post.post_type === 'workout' && post.metadata) {
      if (post.metadata.duracao_min) metaChips.push(<span key="dur" className="text-[10px] text-white font-semibold bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">{post.metadata.duracao_min}min</span>)
      if (post.metadata.exercicios) metaChips.push(<span key="ex" className="text-[10px] text-white font-semibold bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">{post.metadata.exercicios} exerc.</span>)
      if (post.metadata.calorias) metaChips.push(<span key="kcal" className="text-[10px] text-white font-semibold bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">{post.metadata.calorias} kcal</span>)
      if (post.metadata.energia) {
        const e = ENERGY_LEVELS.find(x => x.value === post.metadata?.energia)
        if (e) metaChips.push(<span key="en" className="text-[11px] bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">{e.emoji}</span>)
      }
    } else if (post.post_type === 'meal' && post.metadata) {
      if (post.metadata.calorias) metaChips.push(<span key="kcal" className="text-[10px] text-white font-semibold bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">{post.metadata.calorias} kcal</span>)
      if (post.metadata.proteinas) metaChips.push(<span key="prot" className="text-[10px] text-white font-semibold bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">{post.metadata.proteinas}g prot</span>)
    } else if (post.post_type === 'achievement' && post.metadata?.titulo) {
      metaChips.push(<span key="tit" className="text-[10px] text-white font-bold bg-dourado/80 px-2 py-0.5 rounded backdrop-blur-sm">{post.metadata.titulo}</span>)
    } else if (post.post_type === 'level_up' && post.metadata?.nivel) {
      metaChips.push(<span key="lvl" className="text-[10px] text-white font-bold bg-vinho/80 px-2 py-0.5 rounded backdrop-blur-sm">Nível {post.metadata.nivel}</span>)
    }

    const handleCardTap = () => {
      const now = Date.now()
      const prev = lastTap.current[post.id] || 0
      if (now - prev < 280) {
        // Double tap — curtir com heart
        if (openTimer.current) {
          clearTimeout(openTimer.current)
          openTimer.current = null
        }
        if (!post.user_reactions.includes('heart')) {
          handleReaction(post.id, 'heart')
        }
        setHeartBurst(post.id)
        setTimeout(() => setHeartBurst(prevId => prevId === post.id ? null : prevId), 800)
        lastTap.current[post.id] = 0
      } else {
        lastTap.current[post.id] = now
        if (openTimer.current) clearTimeout(openTimer.current)
        openTimer.current = setTimeout(() => {
          if (lastTap.current[post.id] === now) {
            setSelectedPostId(post.id)
          }
          openTimer.current = null
        }, 280)
      }
    }

    return (
      <div
        onClick={handleCardTap}
        className="rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-[0.98] bg-white border border-border"
      >
        {/* Foto em destaque */}
        {post.image_url && (
          <div className="relative">
            <img src={post.image_url} alt="" className="w-full object-cover block" />

            {/* Heart burst (double-tap anim) */}
            {heartBurst === post.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Heart className="w-20 h-20 text-white fill-red-500 drop-shadow-lg animate-heart-burst" />
              </div>
            )}

            {/* Overlay topo: chip de tipo + badge Equipe Felice */}
            {(typeChip || post.admin_reacted) && (
              <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1 pointer-events-none">
                {typeChip}
                {post.admin_reacted && (
                  <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-dourado/90 text-white font-semibold backdrop-blur-sm">
                    <Sparkles className="w-2.5 h-2.5" /> Felice
                  </span>
                )}
              </div>
            )}

            {/* Overlay bottom: metadata chips */}
            {metaChips.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-6">
                <div className="flex gap-1 flex-wrap">{metaChips}</div>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo texto */}
        {post.content && (
          <p className="px-3 pt-2 pb-0.5 text-foreground text-[12px] leading-snug line-clamp-2">{post.content}</p>
        )}

        {/* Footer: autor + reações */}
        <div className="px-3 py-2 flex items-center justify-between text-foreground-secondary">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-foreground-muted/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-foreground-secondary">{post.author_initial}</span>
            </div>
            <span className="text-[11px] font-medium truncate">{post.author_name}</span>
            {post.is_highlight_author && <span className="text-[10px] flex-shrink-0">⭐</span>}
            {post.author_tier && post.author_tier !== 'bronze' && (
              <span className="text-[10px] flex-shrink-0">{TIER_ICONS[post.author_tier]}</span>
            )}
            <span className="text-[10px] opacity-60 flex-shrink-0">· {formatDate(post.created_at)}</span>
          </div>
          {hasInteractions && (
            <div className="flex items-center gap-1.5 text-[10px] opacity-70 flex-shrink-0">
              {totalReactions > 0 && <span>❤️ {totalReactions}</span>}
              {post.comment_count > 0 && <span>💬 {post.comment_count}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header — Compartilhe seu dia (sticky, CTA principal) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="px-3 py-3">
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
      </div>

      {/* Desafio ativo — card fixo no topo com CTA */}
      {activeChallenge && (
        <div className="mx-3 mt-2 mb-1">
          <div className="relative overflow-hidden rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #663739 0%, #c29863 100%)' }}>
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm uppercase tracking-wider">
                🏆 Desafio ativo
              </span>
            </div>
            <p className="font-heading font-bold text-base leading-tight pr-20">{activeChallenge.title}</p>
            {activeChallenge.description && (
              <p className="text-[11px] text-white/80 mt-1 line-clamp-2">{activeChallenge.description}</p>
            )}
            <div className="flex items-center justify-between mt-3 gap-2">
              <div className="flex items-center gap-3 text-[11px] text-white/80">
                <span>👥 {activeChallenge.participant_count}</span>
                {activeChallenge.is_joined && <span>⭐ {activeChallenge.user_score} pts</span>}
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="px-3 py-1.5 rounded-full bg-white text-vinho text-xs font-semibold hover:bg-white/90 transition-colors active:scale-95"
              >
                Postar progresso
              </button>
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

      {/* Postaram hoje — avatares com ring dourado (clique abre post da pessoa) */}
      {activeUsers.length > 0 && (
        <div className="mx-3 mt-2 mb-1">
          <div className="flex gap-3 px-1 py-2 overflow-x-auto">
            {activeUsers.map(u => (
              <button
                key={u.user_id}
                onClick={() => {
                  const p = posts.find(post => post.user_id === u.user_id)
                  if (p) scrollToPost(p.id)
                }}
                className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform"
                aria-label={`Ver post de ${u.name}`}
              >
                <div className="p-[2px] rounded-full bg-gradient-to-br from-dourado via-dourado/80 to-vinho">
                  <div className="p-[2px] rounded-full bg-background">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-dourado/30 to-vinho/30 flex items-center justify-center overflow-hidden">
                      {u.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.foto_url} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-foreground">{u.initial}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-foreground-secondary font-medium max-w-[56px] truncate">{u.name}</span>
              </button>
            ))}
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
            {/* Masonry 2-col manual: intercala por índice para manter a ordem
                cronológica na leitura visual (esquerda-direita, topo-baixo).
                CSS `columns: 2` enche uma coluna inteira antes da outra,
                quebrando a percepção de "mais novo primeiro". */}
            <div className="grid grid-cols-2 gap-2.5 items-start">
              <div className="flex flex-col gap-2.5">
                {posts.filter((_, i) => i % 2 === 0).map(post => (
                  <div key={post.id} id={`post-${post.id}`}>
                    {renderMasonryCard(post)}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2.5">
                {posts.filter((_, i) => i % 2 === 1).map(post => (
                  <div key={post.id} id={`post-${post.id}`}>
                    {renderMasonryCard(post)}
                  </div>
                ))}
              </div>
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

      {/* Template oculto para exportar como story (1080x1920) */}
      {selectedPost && selectedPost.image_url && (
        <div
          ref={storyTemplateRef}
          style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            width: '1080px',
            height: '1920px',
            background: 'linear-gradient(135deg, #322b29 0%, #663739 60%, #c29863 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '80px 60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          aria-hidden="true"
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '28px', letterSpacing: '6px', textTransform: 'uppercase', margin: 0 }}>Comunidade</p>
            <p style={{ color: '#c29863', fontSize: '64px', fontWeight: 700, letterSpacing: '2px', margin: '8px 0 0 0' }}>Complexo Felice</p>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              borderRadius: '32px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              background: '#fff',
            }}>
              <img
                src={selectedPost.image_url}
                alt=""
                crossOrigin="anonymous"
                style={{ width: '100%', display: 'block', objectFit: 'cover' }}
              />
              {selectedPost.content && (
                <p style={{ padding: '32px 40px', fontSize: '28px', color: '#322b29', lineHeight: 1.4, margin: 0 }}>{selectedPost.content}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #c29863, #663739)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '40px', fontWeight: 700,
            }}>
              {selectedPost.author_initial}
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: '36px', fontWeight: 600, margin: 0 }}>{selectedPost.author_name}</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '22px', margin: '4px 0 0 0' }}>@complexofelice</p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Post Modal */}
      {selectedPost && (
        <div className="fixed inset-x-0 top-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center" style={{ height: '100dvh', paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }} onClick={() => setSelectedPostId(null)}>
          <div
            className="w-full bg-white rounded-t-3xl overflow-hidden flex flex-col animate-slide-up"
            style={{ maxHeight: 'calc(100dvh - 80px - env(safe-area-inset-bottom, 0px))' }}
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
              <button
                onClick={handleShareStory}
                disabled={sharing || !selectedPost.image_url}
                className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-muted hover:text-dourado disabled:opacity-40 transition-colors"
                aria-label="Compartilhar como story"
                title="Compartilhar como story"
              >
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              </button>
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
                          <p className="text-xs text-foreground-secondary leading-relaxed">{renderTextWithMentions(comment.content)}</p>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Add comment input */}
                <div className="relative border-t border-border">
                  {mentionOpen && mentionResults.length > 0 && (
                    <div className="absolute bottom-full left-3 right-3 mb-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-white shadow-lg z-10">
                      {mentionResults.map(m => (
                        <button
                          key={m.user_id}
                          onClick={() => selectMention(m)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-background-elevated text-left transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-dourado/40 to-vinho/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-foreground">{m.initial}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{m.name}</p>
                            <p className="text-[10px] text-foreground-muted truncate">@{m.handle}</p>
                          </div>
                          {PROFESSIONAL_ROLES[m.role] && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${PROFESSIONAL_ROLES[m.role].color}`}>
                              {PROFESSIONAL_ROLES[m.role].label}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="p-3 flex items-center gap-2">
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={newComment}
                      onChange={(e) => handleCommentChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !submittingComment && handleComment(selectedPost.id)}
                      className="flex-1 px-3 py-2 rounded-full bg-background-input border border-border text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:ring-1 focus:ring-dourado/50"
                      placeholder="Comentar... (@ para mencionar)"
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
        </div>
      )}

      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-x-0 top-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:pb-0" style={{ height: '100dvh', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col" style={{ maxHeight: 'calc(100dvh - 100px - env(safe-area-inset-bottom, 0px))' }}>
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg border-2 border-dashed border-dourado/40 bg-dourado/5 text-dourado hover:bg-dourado/10 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-sm font-semibold">Adicionar foto (obrigatória)</span>
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
