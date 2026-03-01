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

// GET - List comments for a post
export async function GET(
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

    // Enrich with author names
    const userIds = [...new Set((comments || []).map(c => c.user_id))]
    const profileMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, display_name, apelido_ranking')
        .in('id', userIds)

      for (const p of (profiles || [])) {
        profileMap[p.id] = p.display_name || p.apelido_ranking || p.nome?.split(' ')[0] || 'Anonimo'
      }
    }

    const enriched = (comments || []).map(c => ({
      ...c,
      author_name: profileMap[c.user_id] || 'Anonimo',
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
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { id: postId } = await params
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Conteudo obrigatorio' }, { status: 400 })
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

    // Award 1 point for commenting
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
