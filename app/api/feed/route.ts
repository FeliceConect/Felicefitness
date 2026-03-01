/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
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
    const profileMap: Record<string, { nome: string; display_name: string | null; apelido_ranking: string | null }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, display_name, apelido_ranking')
        .in('id', userIds)

      for (const p of (profiles || [])) {
        profileMap[p.id] = {
          nome: p.nome || '',
          display_name: p.display_name,
          apelido_ranking: p.apelido_ranking,
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

    // Get comment counts
    const commentCounts: Record<string, number> = {}
    if (postIds.length > 0) {
      for (const postId of postIds) {
        const { count } = await supabaseAdmin
          .from('fitness_community_comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId)
          .eq('is_visible', true)

        commentCounts[postId] = count || 0
      }
    }

    const enrichedPosts = (posts || []).map(post => {
      const profile = profileMap[post.user_id]
      const displayName = profile?.display_name || profile?.apelido_ranking || profile?.nome?.split(' ')[0] || 'Anonimo'
      return {
        ...post,
        author_name: displayName,
        author_initial: displayName.charAt(0).toUpperCase(),
        is_own: post.user_id === user.id,
        user_reactions: userReactions[post.id] || [],
        comment_count: commentCounts[post.id] || post.comments_count || 0,
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
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const body = await request.json()
    const { post_type, content, image_url, related_id, is_auto_generated } = body

    if (!post_type || !content?.trim()) {
      return NextResponse.json({ success: false, error: 'Tipo e conteudo sao obrigatorios' }, { status: 400 })
    }

    const validTypes = ['meal', 'workout', 'achievement', 'free_text', 'check_in']
    if (!validTypes.includes(post_type)) {
      return NextResponse.json({ success: false, error: 'Tipo de post invalido' }, { status: 400 })
    }

    const { data: post, error: insertError } = await supabaseAdmin
      .from('fitness_community_posts')
      .insert({
        user_id: user.id,
        post_type,
        content: content.trim(),
        image_url: image_url || null,
        related_id: related_id || null,
        is_auto_generated: is_auto_generated || false,
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

    // Award 2 points for posting
    await supabaseAdmin
      .from('fitness_point_transactions')
      .insert({
        user_id: user.id,
        points: 2,
        reason: 'Post no feed',
        category: 'social',
        source: 'automatic',
        reference_id: post.id,
      })

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Erro na API de feed:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
