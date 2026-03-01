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

// POST - Toggle a reaction on a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { id: postId } = await params
    const body = await request.json()
    const { reaction_type } = body

    const validReactions = ['fire', 'heart', 'strength', 'clap', 'star']
    if (!reaction_type || !validReactions.includes(reaction_type)) {
      return NextResponse.json({ success: false, error: 'Tipo de reacao invalido' }, { status: 400 })
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

      // Award 1 point for first reaction on this post
      const { data: existingPoint } = await supabaseAdmin
        .from('fitness_point_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('reference_id', postId)
        .eq('category', 'social')
        .eq('reason', 'Interacao no feed')
        .limit(1)

      if (!existingPoint || existingPoint.length === 0) {
        await supabaseAdmin
          .from('fitness_point_transactions')
          .insert({
            user_id: user.id,
            points: 1,
            reason: 'Interacao no feed',
            category: 'social',
            source: 'automatic',
            reference_id: postId,
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
