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

// GET - Search profiles for @mention autocomplete in comments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()

    let query = supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, display_name, apelido_ranking, role, status_tier')
      .limit(8)

    if (q.length > 0) {
      query = query.or(
        `nome.ilike.%${q}%,display_name.ilike.%${q}%,apelido_ranking.ilike.%${q}%`
      )
    } else {
      query = query.order('nome', { ascending: true })
    }

    const { data: profiles, error } = await query
    if (error) {
      console.error('Erro ao buscar menções:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar' }, { status: 500 })
    }

    const results = (profiles || [])
      .filter(p => p.id !== user.id)
      .map(p => {
        const displayName = p.display_name || p.apelido_ranking || p.nome?.split(' ')[0] || 'Anônimo'
        const handle = displayName.replace(/\s+/g, '').toLowerCase()
        return {
          user_id: p.id,
          name: displayName,
          handle,
          initial: displayName.charAt(0).toUpperCase(),
          role: p.role || 'client',
          tier: p.status_tier || 'bronze',
        }
      })

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Erro na API mentions:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
