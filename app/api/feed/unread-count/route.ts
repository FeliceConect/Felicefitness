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

// GET - Count unread feed posts since a given timestamp
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    if (!since) {
      return NextResponse.json({ success: false, error: 'Parâmetro "since" é obrigatório' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // 1. Count new posts from others
    const { count: newPostsCount, error: postsError } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_visible', true)
      .neq('user_id', user.id)
      .gt('created_at', since)

    if (postsError) {
      console.error('Erro ao contar posts não lidos:', postsError)
      return NextResponse.json({ success: false, error: 'Erro ao contar posts' }, { status: 500 })
    }

    // 2. Count new comments on YOUR posts from others
    // First get your post IDs, then count new comments on them
    let newCommentsCount = 0
    let newReactionsCount = 0

    const { data: myPosts } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_visible', true)

    if (myPosts && myPosts.length > 0) {
      const myPostIds = myPosts.map(p => p.id)

      const { count: commentsCount } = await supabaseAdmin
        .from('fitness_community_comments')
        .select('*', { count: 'exact', head: true })
        .in('post_id', myPostIds)
        .neq('user_id', user.id)
        .eq('is_visible', true)
        .gt('created_at', since)

      newCommentsCount = commentsCount || 0

      // 3. Count new reactions on YOUR posts from others
      const { count: reactionsCount } = await supabaseAdmin
        .from('fitness_community_reactions')
        .select('*', { count: 'exact', head: true })
        .in('post_id', myPostIds)
        .neq('user_id', user.id)
        .gt('created_at', since)

      newReactionsCount = reactionsCount || 0
    }

    const totalCount = (newPostsCount || 0) + newCommentsCount + newReactionsCount

    return NextResponse.json({
      success: true,
      count: totalCount,
      details: {
        new_posts: newPostsCount || 0,
        new_comments: newCommentsCount,
        new_reactions: newReactionsCount,
      },
    })
  } catch (error) {
    console.error('Erro na API de unread count:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
