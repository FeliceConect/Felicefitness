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

/**
 * Proxy de imagens do bucket `progress-photos` — serve a imagem via mesmo
 * origem do app, evitando que o <canvas> fique "tainted" durante exportação
 * (html-to-image / toPng) quando o bucket não tem headers CORS permissivos.
 *
 * Query: ?url=<URL absoluta da imagem no storage>
 * Só aceita URLs do bucket `progress-photos` do nosso Supabase.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || !['super_admin', 'admin', 'nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    // Check assignment para roles clínicos
    const clinicalRoles = ['nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo']
    if (clinicalRoles.includes(profile.role)) {
      const { data: professional } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (!professional) {
        return NextResponse.json({ success: false, error: 'Profissional inativo' }, { status: 403 })
      }
      const { data: assignment } = await supabaseAdmin
        .from('fitness_client_assignments')
        .select('id')
        .eq('professional_id', professional.id)
        .eq('client_id', patientId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      if (!assignment) {
        return NextResponse.json({ success: false, error: 'Paciente não vinculado' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'url obrigatório' }, { status: 400 })
    }

    // Whitelist: só aceita URLs que apontam para o nosso bucket progress-photos
    const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const allowedPrefix = `${supabaseBase.replace(/\/$/, '')}/storage/v1/object/public/progress-photos/`
    if (!imageUrl.startsWith(allowedPrefix)) {
      return NextResponse.json({ success: false, error: 'URL não permitida' }, { status: 400 })
    }

    // Verifica que a foto realmente pertence ao paciente (via DB)
    const { data: photo } = await supabaseAdmin
      .from('fitness_progress_photos')
      .select('id')
      .eq('user_id', patientId)
      .eq('foto_url', imageUrl)
      .limit(1)
      .maybeSingle()
    if (!photo) {
      return NextResponse.json({ success: false, error: 'Foto não encontrada' }, { status: 404 })
    }

    // Baixa a imagem server-side e repassa
    const upstream = await fetch(imageUrl)
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ success: false, error: 'Upstream falhou' }, { status: 502 })
    }
    const contentType = upstream.headers.get('content-type') || 'image/webp'
    const buffer = await upstream.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('Erro image proxy:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
