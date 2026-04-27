/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { fromZonedTime } from 'date-fns-tz'
import { notifyNewPost } from '@/lib/notifications/social'
import { getTodayDateSP, SAO_PAULO_TIMEZONE } from '@/lib/utils/date'

// Limite diário de posts que rendem pontos (regra de produto: além disso,
// o post é publicado normalmente mas não soma no ranking).
const MAX_POSTS_AWARDED_PER_DAY = 2
const POINTS_PER_POST = 4

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - List feed posts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const filterType = searchParams.get('type') || ''

    let query = supabaseAdmin
      .from('fitness_community_posts')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filterType) {
      query = query.eq('post_type', filterType)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Erro ao buscar posts:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar posts' }, { status: 500 })
    }

    // Enrich with author info
    const userIds = [...new Set((posts || []).map(p => p.user_id))]
    const profileMap: Record<string, { nome: string; display_name: string | null; apelido_ranking: string | null; role: string; status_tier: string }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, display_name, apelido_ranking, role, status_tier')
        .in('id', userIds)

      for (const p of (profiles || [])) {
        profileMap[p.id] = {
          nome: p.nome || '',
          display_name: p.display_name,
          apelido_ranking: p.apelido_ranking,
          role: p.role || 'client',
          status_tier: p.status_tier || 'bronze',
        }
      }
    }

    // Get user's reactions on these posts
    const postIds = (posts || []).map(p => p.id)
    const userReactions: Record<string, string[]> = {}
    if (postIds.length > 0) {
      const { data: reactions } = await supabaseAdmin
        .from('fitness_community_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', postIds)

      for (const r of (reactions || [])) {
        if (!userReactions[r.post_id]) userReactions[r.post_id] = []
        userReactions[r.post_id].push(r.reaction_type)
      }
    }

    // Get comment counts (single query instead of N+1)
    const commentCounts: Record<string, number> = {}
    if (postIds.length > 0) {
      const { data: comments } = await supabaseAdmin
        .from('fitness_community_comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_visible', true)

      for (const c of (comments || [])) {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1
      }
    }

    // Check if any super_admin/admin reacted to each post
    const adminReactedPosts: Set<string> = new Set()
    if (postIds.length > 0) {
      const { data: adminProfiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id')
        .in('role', ['super_admin', 'admin'])

      const adminIds = (adminProfiles || []).map(p => p.id)
      if (adminIds.length > 0) {
        const { data: adminReactions } = await supabaseAdmin
          .from('fitness_community_reactions')
          .select('post_id')
          .in('post_id', postIds)
          .in('user_id', adminIds)

        for (const r of (adminReactions || [])) {
          adminReactedPosts.add(r.post_id)
        }
      }
    }

    // Get weekly highlight post ID for badge
    let highlightPostUserId: string | null = null
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: weekPosts } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('id, user_id, reactions_count, comments_count')
      .eq('is_visible', true)
      .gte('created_at', weekAgo.toISOString())

    if (weekPosts && weekPosts.length > 0) {
      let bestScore = 0
      for (const wp of weekPosts) {
        const rTotal = Object.values(wp.reactions_count || {}).reduce((s, c) => s + (c as number), 0)
        const score = rTotal + (wp.comments_count || 0) * 2
        if (score > bestScore && score >= 3) {
          bestScore = score
          highlightPostUserId = wp.user_id
        }
      }
    }

    const enrichedPosts = (posts || []).map(post => {
      const profile = profileMap[post.user_id]
      const displayName = profile?.display_name || profile?.apelido_ranking || profile?.nome?.split(' ')[0] || 'Anonimo'
      const authorRole = profile?.role || 'client'
      return {
        ...post,
        author_name: displayName,
        author_initial: displayName.charAt(0).toUpperCase(),
        author_role: authorRole,
        author_tier: profile?.status_tier || 'bronze',
        is_own: post.user_id === user.id,
        user_reactions: userReactions[post.id] || [],
        comment_count: commentCounts[post.id] || post.comments_count || 0,
        admin_reacted: adminReactedPosts.has(post.id),
        is_highlight_author: post.user_id === highlightPostUserId,
      }
    })

    return NextResponse.json({
      success: true,
      posts: enrichedPosts,
      has_more: (posts || []).length === limit,
    })
  } catch (error) {
    console.error('Erro na API de feed:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const body = await request.json()
    const { post_type, content, image_url, related_id, is_auto_generated, metadata } = body

    if (!post_type) {
      return NextResponse.json({ success: false, error: 'Tipo de post é obrigatório' }, { status: 400 })
    }

    const validTypes = ['meal', 'workout', 'achievement', 'free_text', 'level_up']
    if (!validTypes.includes(post_type)) {
      return NextResponse.json({ success: false, error: 'Tipo de post inválido' }, { status: 400 })
    }

    // Foto obrigatória para TODOS os posts (inclusive auto-gerados).
    if (!image_url) {
      return NextResponse.json({ success: false, error: 'A foto é obrigatória para publicar no feed' }, { status: 400 })
    }

    const { data: post, error: insertError } = await supabaseAdmin
      .from('fitness_community_posts')
      .insert({
        user_id: user.id,
        post_type,
        content: content?.trim() || '',
        image_url: image_url || null,
        related_id: related_id || null,
        is_auto_generated: is_auto_generated || false,
        metadata: metadata || {},
        reactions_count: {},
        comments_count: 0,
        is_visible: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar post:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao criar post' }, { status: 500 })
    }

    // Cap de pontos: máximo MAX_POSTS_AWARDED_PER_DAY posts/dia (timezone BR).
    // Posts além disso são publicados, mas não somam pontos.
    const startOfDayBR = fromZonedTime(`${getTodayDateSP()}T00:00:00`, SAO_PAULO_TIMEZONE)
    const { count: postsAwardedToday } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'social')
      .eq('reason', 'Post no feed')
      .gte('created_at', startOfDayBR.toISOString())

    // Idempotência por post.id (caso a rota seja chamada duas vezes pro mesmo post)
    const { data: existingPostPoints } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('reference_id', post.id)
      .eq('category', 'social')
      .limit(1)

    const alreadyAwardedForThisPost = (existingPostPoints?.length ?? 0) > 0
    const underDailyCap = (postsAwardedToday ?? 0) < MAX_POSTS_AWARDED_PER_DAY
    let pointsAwarded = 0

    if (!alreadyAwardedForThisPost && underDailyCap) {
      await supabaseAdmin
        .from('fitness_point_transactions')
        .insert({
          user_id: user.id,
          points: POINTS_PER_POST,
          reason: 'Post no feed',
          category: 'social',
          source: 'automatic',
          reference_id: post.id,
        })

      // Atualiza ranking via RPC atômica (sem isso, "Seus pontos" no leaderboard
      // não sobe — bug que deixava usuários com 0 pts mesmo após postar).
      await supabaseAdmin.rpc('fitness_award_points_to_user', {
        p_user_id: user.id,
        p_delta: POINTS_PER_POST,
        p_allowed_ranking_categories: null,
      })

      pointsAwarded = POINTS_PER_POST
    }

    // Notify other users about new post (fire-and-forget)
    notifyNewPost(user.id, post_type).catch(() => {})

    return NextResponse.json({
      success: true,
      post,
      points_awarded: pointsAwarded,
      daily_cap_reached: !underDailyCap && !alreadyAwardedForThisPost,
    })
  } catch (error) {
    console.error('Erro na API de feed:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
