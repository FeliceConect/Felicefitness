/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { fromZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notifyComment } from '@/lib/notifications/social'
import { getTodayDateSP, SAO_PAULO_TIMEZONE } from '@/lib/utils/date'

const MAX_COMMENTS_AWARDED_PER_DAY = 2
const COMMENT_REASON = 'Comentario no feed'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - List comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { id: postId } = await params

    const { data: comments, error } = await supabaseAdmin
      .from('fitness_community_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_visible', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar comentarios:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar' }, { status: 500 })
    }

    // Enrich with author names + role
    const userIds = [...new Set((comments || []).map(c => c.user_id))]
    const profileMap: Record<string, { name: string; role: string }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, display_name, apelido_ranking, role')
        .in('id', userIds)

      for (const p of (profiles || [])) {
        profileMap[p.id] = {
          name: p.display_name || p.apelido_ranking || p.nome?.split(' ')[0] || 'Anonimo',
          role: p.role || 'client',
        }
      }
    }

    const enriched = (comments || []).map(c => ({
      ...c,
      author_name: profileMap[c.user_id]?.name || 'Anonimo',
      author_role: profileMap[c.user_id]?.role || 'client',
      is_own: c.user_id === user.id,
    }))

    return NextResponse.json({ success: true, comments: enriched })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { id: postId } = await params
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Conteúdo obrigatório' }, { status: 400 })
    }

    const { data: comment, error: insertError } = await supabaseAdmin
      .from('fitness_community_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        is_visible: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar comentario:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao comentar' }, { status: 500 })
    }

    // Update comments_count on post
    const { count } = await supabaseAdmin
      .from('fitness_community_comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_visible', true)

    await supabaseAdmin
      .from('fitness_community_posts')
      .update({ comments_count: count || 0 })
      .eq('id', postId)

    // Award 1 pt — 1× por post + cap de 2 comentários pontuáveis por dia
    const { data: existingCommentPoints } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('reference_id', postId)
      .eq('category', 'social')
      .eq('reason', COMMENT_REASON)
      .limit(1)

    const startOfDayBR = fromZonedTime(`${getTodayDateSP()}T00:00:00`, SAO_PAULO_TIMEZONE)
    const { count: commentsAwardedToday } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'social')
      .eq('reason', COMMENT_REASON)
      .gte('created_at', startOfDayBR.toISOString())

    const alreadyForThisPost = (existingCommentPoints?.length ?? 0) > 0
    const underDailyCap = (commentsAwardedToday ?? 0) < MAX_COMMENTS_AWARDED_PER_DAY

    if (!alreadyForThisPost && underDailyCap) {
      await supabaseAdmin
        .from('fitness_point_transactions')
        .insert({
          user_id: user.id,
          points: 1,
          reason: COMMENT_REASON,
          category: 'social',
          source: 'automatic',
          reference_id: postId,
        })

      // Sincroniza com leaderboard
      await supabaseAdmin.rpc('fitness_award_points_to_user', {
        p_user_id: user.id,
        p_delta: 1,
        p_allowed_ranking_categories: null,
      })
    }

    // Send push notification to post author (fire-and-forget)
    const { data: post } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (post) {
      notifyComment(post.user_id, user.id, content.trim()).catch(() => {})
    }

    // Get author name
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('nome, display_name, apelido_ranking')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        author_name: profile?.display_name || profile?.apelido_ranking || profile?.nome?.split(' ')[0] || 'Anonimo',
        is_own: true,
      },
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
