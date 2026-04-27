/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { fromZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notifyReaction } from '@/lib/notifications/social'
import { getTodayDateSP, SAO_PAULO_TIMEZONE } from '@/lib/utils/date'

const MAX_REACTIONS_AWARDED_PER_DAY = 2
const REACTION_REASON = 'Reacao no feed'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - Toggle a reaction on a post
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
    const { reaction_type } = body

    const validReactions = ['fire', 'heart', 'strength', 'clap', 'star']
    if (!reaction_type || !validReactions.includes(reaction_type)) {
      return NextResponse.json({ success: false, error: 'Tipo de reação inválido' }, { status: 400 })
    }

    // Check if reaction already exists
    const { data: existing } = await supabaseAdmin
      .from('fitness_community_reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)
      .limit(1)

    let added = false
    if (existing && existing.length > 0) {
      // Remove reaction (toggle off)
      await supabaseAdmin
        .from('fitness_community_reactions')
        .delete()
        .eq('id', existing[0].id)
    } else {
      // Add reaction (toggle on)
      await supabaseAdmin
        .from('fitness_community_reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type,
        })
      added = true

      // Award 1 pt — 1× por post + cap de 2 reações pontuáveis por dia
      const { data: existingPoint } = await supabaseAdmin
        .from('fitness_point_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('reference_id', postId)
        .eq('category', 'social')
        .eq('reason', REACTION_REASON)
        .limit(1)

      const startOfDayBR = fromZonedTime(`${getTodayDateSP()}T00:00:00`, SAO_PAULO_TIMEZONE)
      const { count: reactionsAwardedToday } = await supabaseAdmin
        .from('fitness_point_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'social')
        .eq('reason', REACTION_REASON)
        .gte('created_at', startOfDayBR.toISOString())

      const alreadyForThisPost = (existingPoint?.length ?? 0) > 0
      const underDailyCap = (reactionsAwardedToday ?? 0) < MAX_REACTIONS_AWARDED_PER_DAY

      if (!alreadyForThisPost && underDailyCap) {
        await supabaseAdmin
          .from('fitness_point_transactions')
          .insert({
            user_id: user.id,
            points: 1,
            reason: REACTION_REASON,
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
    }

    // Update reactions_count on post
    const { data: allReactions } = await supabaseAdmin
      .from('fitness_community_reactions')
      .select('reaction_type')
      .eq('post_id', postId)

    const reactionCounts: Record<string, number> = {}
    for (const r of (allReactions || [])) {
      reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1
    }

    await supabaseAdmin
      .from('fitness_community_posts')
      .update({ reactions_count: reactionCounts })
      .eq('id', postId)

    // Send push notification to post author (fire-and-forget)
    if (added) {
      const { data: post } = await supabaseAdmin
        .from('fitness_community_posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (post) {
        notifyReaction(post.user_id, user.id, reaction_type).catch(() => {})
      }
    }

    return NextResponse.json({
      success: true,
      added,
      reactions_count: reactionCounts,
    })
  } catch (error) {
    console.error('Erro na API de reacoes:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
