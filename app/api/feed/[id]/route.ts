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

// DELETE - Delete/hide a post (own post or admin)
export async function DELETE(
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

    // Check if user is the author or admin
    const { data: post } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post nao encontrado' }, { status: 404 })
    }

    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'
    const isAuthor = post.user_id === user.id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ success: false, error: 'Sem permissao' }, { status: 403 })
    }

    // Hide post (soft delete)
    await supabaseAdmin
      .from('fitness_community_posts')
      .update({ is_visible: false })
      .eq('id', postId)

    return NextResponse.json({ success: true, message: 'Post removido' })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
