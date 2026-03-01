'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'

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
  is_own: boolean
  user_reactions: string[]
}

interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  author_name: string
  is_own: boolean
}

const POST_TYPES = [
  { value: 'free_text', label: 'Texto', icon: PenLine },
  { value: 'workout', label: 'Treino', icon: Dumbbell },
  { value: 'meal', label: 'Refeicao', icon: Coffee },
  { value: 'achievement', label: 'Conquista', icon: Award },
  { value: 'check_in', label: 'Check-in', icon: CheckCircle },
]

const REACTIONS = [
  { type: 'fire', emoji: '🔥', label: 'Fogo' },
  { type: 'heart', emoji: '❤️', label: 'Amor' },
  { type: 'strength', emoji: '💪', label: 'Forca' },
  { type: 'clap', emoji: '👏', label: 'Palmas' },
  { type: 'star', emoji: '⭐', label: 'Estrela' },
]

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  free_text: { label: 'Post', color: 'bg-foreground-muted/10 text-foreground-secondary' },
  workout: { label: 'Treino', color: 'bg-blue-50 text-blue-600' },
  meal: { label: 'Refeicao', color: 'bg-green-50 text-green-600' },
  achievement: { label: 'Conquista', color: 'bg-yellow-50 text-yellow-600' },
  check_in: { label: 'Check-in', color: 'bg-purple-50 text-purple-600' },
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

  // Comments
  const [expandedComments, setExpandedComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Filter
  const [filterType, setFilterType] = useState('')

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

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: newPostType,
          content: newPostContent.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreate(false)
        setNewPostContent('')
        setNewPostType('free_text')
        fetchPosts(true)
      }
    } catch (error) {
      console.error('Erro ao criar post:', error)
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
    }
  }

  const toggleComments = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null)
      return
    }
    setExpandedComments(postId)
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
      }
    } catch (error) {
      console.error('Erro:', error)
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
      }
    } catch (error) {
      console.error('Erro:', error)
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
              <div key={post.id} className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Post header */}
                <div className="flex items-center gap-3 p-4 pb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dourado to-vinho flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{post.author_initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{post.author_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground-muted">{formatDate(post.created_at)}</span>
                      {POST_TYPE_LABELS[post.post_type] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${POST_TYPE_LABELS[post.post_type].color}`}>
                          {POST_TYPE_LABELS[post.post_type].label}
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

                {/* Content */}
                <div className="px-4 pb-3">
                  <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>

                {/* Image */}
                {post.image_url && (
                  <div className="px-4 pb-3">
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full rounded-lg object-cover max-h-80"
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
                        {(comments[post.id] || []).map(comment => (
                          <div key={comment.id} className="px-4 py-2.5 flex gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-foreground-muted/30 to-foreground-muted/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-foreground-secondary text-xs font-medium">
                                {comment.author_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-medium text-foreground">{comment.author_name}</span>
                                <span className="text-[10px] text-foreground-muted">{formatDate(comment.created_at)}</span>
                              </div>
                              <p className="text-xs text-foreground-secondary leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}

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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Novo Post</h3>
              <button
                onClick={() => { setShowCreate(false); setNewPostContent(''); setNewPostType('free_text') }}
                className="p-2 hover:bg-background-elevated rounded-lg"
              >
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Post type selector */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {POST_TYPES.map(pt => {
                  const Icon = pt.icon
                  return (
                    <button
                      key={pt.value}
                      onClick={() => setNewPostType(pt.value)}
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

              {/* Content */}
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-3 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                placeholder={
                  newPostType === 'workout' ? 'Conte sobre seu treino de hoje...' :
                  newPostType === 'meal' ? 'Compartilhe sua refeicao...' :
                  newPostType === 'achievement' ? 'Celebre sua conquista!' :
                  newPostType === 'check_in' ? 'Como voce esta hoje?' :
                  'O que voce quer compartilhar?'
                }
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCreate(false); setNewPostContent(''); setNewPostType('free_text') }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || creating}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
