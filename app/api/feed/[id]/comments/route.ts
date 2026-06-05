/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { fromZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notifyComment, notifyCommentReply } from '@/lib/notifications/social'
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

    // Aninha respostas (1 nível) sob o comentário pai. Comments já vêm em ordem asc.
    const repliesByParent: Record<string, typeof enriched> = {}
    for (const c of enriched) {
      if (c.parent_comment_id) {
        (repliesByParent[c.parent_comment_id] ||= []).push(c)
      }
    }
    const nested = enriched
      .filter(c => !c.parent_comment_id)
      .map(c => ({
        ...c,
        replies: repliesByParent[c.id] || [],
        reply_count: (repliesByParent[c.id] || []).length,
      }))

    return NextResponse.json({ success: true, comments: nested })
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
    const requestedParentId: string | null = body.parent_comment_id || null

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Conteúdo obrigatório' }, { status: 400 })
    }

    // Resolve a resposta: valida o comentário-alvo e achata para 1 nível.
    // storageParentId = comentário de 1º nível (o que vai pro banco).
    // repliedToAuthorId = autor do comentário em que a pessoa clicou "Responder" (p/ notificar).
    let storageParentId: string | null = null
    let repliedToAuthorId: string | null = null
    if (requestedParentId) {
      const { data: target } = await supabaseAdmin
        .from('fitness_community_comments')
        .select('id, post_id, parent_comment_id, user_id')
        .eq('id', requestedParentId)
        .single()

      if (target && target.post_id === postId) {
        repliedToAuthorId = target.user_id
        storageParentId = target.parent_comment_id || target.id
      }
      // Alvo inválido (não existe / outro post) → vira comentário de 1º nível.
    }

    const { data: comment, error: insertError } = await supabaseAdmin
      .from('fitness_community_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: storageParentId,
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

    // Respostas pontuam igual a comentários: mesma regra (1× por post + teto de 2/dia).
    let pointsAwarded = 0
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
      pointsAwarded = 1
    }

    // Push notifications (fire-and-forget). Para resposta: notifica quem foi
    // respondido + dono do post (sem duplicar e sem notificar a si mesmo).
    const { data: post } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    const preview = content.trim()
    if (storageParentId && repliedToAuthorId) {
      // É uma resposta
      if (repliedToAuthorId !== user.id) {
        notifyCommentReply(repliedToAuthorId, user.id, preview).catch(() => {})
      }
      if (post && post.user_id !== user.id && post.user_id !== repliedToAuthorId) {
        notifyComment(post.user_id, user.id, preview).catch(() => {})
      }
    } else if (post) {
      // Comentário de 1º nível
      notifyComment(post.user_id, user.id, preview).catch(() => {})
    }

    // Get author name + role
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('nome, display_name, apelido_ranking, role')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      points_awarded: pointsAwarded,
      comment: {
        ...comment,
        author_name: profile?.display_name || profile?.apelido_ranking || profile?.nome?.split(' ')[0] || 'Anonimo',
        author_role: profile?.role || 'client',
        replies: [],
        reply_count: 0,
        is_own: true,
      },
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
