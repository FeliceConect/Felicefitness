/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Get the most interacted post from the past 7 days
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Posts from the last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: posts } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('*')
      .eq('is_visible', true)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })

    if (!posts || posts.length === 0) {
      return NextResponse.json({ success: true, highlight: null })
    }

    // Find the post with the highest interaction score
    let bestPost = null
    let bestScore = 0

    for (const post of posts) {
      const reactionsTotal = Object.values(post.reactions_count || {}).reduce(
        (sum, count) => sum + (count as number), 0
      )
      const commentsTotal = post.comments_count || 0
      // Weight comments 2x since they require more effort
      const score = reactionsTotal + commentsTotal * 2

      if (score > bestScore) {
        bestScore = score
        bestPost = post
      }
    }

    if (!bestPost || bestScore < 3) {
      // Minimum 3 interactions to qualify as highlight
      return NextResponse.json({ success: true, highlight: null })
    }

    // Enrich with author info
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, display_name, apelido_ranking, role, status_tier')
      .eq('id', bestPost.user_id)
      .single()

    const displayName = profile?.display_name || profile?.apelido_ranking || profile?.nome?.split(' ')[0] || 'Anônimo'

    // Get user's reactions on this post
    const { data: userReactions } = await supabaseAdmin
      .from('fitness_community_reactions')
      .select('reaction_type')
      .eq('post_id', bestPost.id)
      .eq('user_id', user.id)

    const reactionsTotal = Object.values(bestPost.reactions_count || {}).reduce(
      (sum, count) => sum + (count as number), 0
    )

    const enrichedPost = {
      ...bestPost,
      author_name: displayName,
      author_initial: displayName.charAt(0).toUpperCase(),
      author_role: profile?.role || 'client',
      author_tier: profile?.status_tier || 'bronze',
      is_own: bestPost.user_id === user.id,
      user_reactions: (userReactions || []).map(r => r.reaction_type),
      comment_count: bestPost.comments_count || 0,
      total_reactions: reactionsTotal,
    }

    return NextResponse.json({ success: true, highlight: enrichedPost })
  } catch (error) {
    console.error('Erro na API weekly-highlight:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
