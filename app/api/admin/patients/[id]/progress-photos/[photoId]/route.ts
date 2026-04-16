/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { compressImageFile } from '@/lib/images/compress'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const MAX_FILE_SIZE = 15 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

async function requirePermission(patientId?: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 }) }
  }
  const supabaseAdmin = getAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('fitness_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['super_admin', 'admin', 'nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo'].includes(profile.role)) {
    return { error: NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 }) }
  }

  const clinicalRoles = ['nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo']
  if (patientId && clinicalRoles.includes(profile.role)) {
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!professional) {
      return { error: NextResponse.json({ success: false, error: 'Profissional inativo' }, { status: 403 }) }
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
      return { error: NextResponse.json({ success: false, error: 'Paciente não vinculado' }, { status: 403 }) }
    }
  }

  return { user, supabaseAdmin }
}

// PUT - Substitui a imagem de uma foto existente (mesma célula M/posicao)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: patientId, photoId } = await params
    const auth = await requirePermission(patientId)
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo obrigatório' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Tipo de arquivo não permitido' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Arquivo muito grande (máx. 15MB)' }, { status: 400 })
    }

    // Busca registro atual
    const { data: existing } = await supabaseAdmin
      .from('fitness_progress_photos')
      .select('id, user_id, foto_url, momento_avaliacao, posicao')
      .eq('id', photoId)
      .single()

    if (!existing || existing.user_id !== patientId) {
      return NextResponse.json({ success: false, error: 'Foto não encontrada' }, { status: 404 })
    }

    // Comprime e faz upload do novo arquivo
    const compressed = await compressImageFile(file)
    const fileName = `${patientId}/${existing.momento_avaliacao || 'X'}_${existing.posicao || 'x'}_${Date.now()}.${compressed.extension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('progress-photos')
      .upload(fileName, compressed.buffer, {
        contentType: compressed.contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ success: false, error: 'Erro ao enviar imagem' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('progress-photos')
      .getPublicUrl(fileName)

    // Atualiza o registro para apontar pra nova URL
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('fitness_progress_photos')
      .update({ foto_url: publicUrl })
      .eq('id', photoId)
      .select()
      .single()

    if (updateError) {
      // tenta limpar o arquivo que acabou de subir
      await supabaseAdmin.storage.from('progress-photos').remove([fileName]).catch(() => {})
      return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
    }

    // Remove arquivo antigo do Storage (best-effort)
    try {
      const oldUrl = new URL(existing.foto_url)
      const pathMatch = oldUrl.pathname.match(/\/progress-photos\/(.+)$/)
      if (pathMatch) {
        await supabaseAdmin.storage.from('progress-photos').remove([pathMatch[1]])
      }
    } catch {
      // silent
    }

    return NextResponse.json({ success: true, photo: updated })
  } catch (error) {
    console.error('Erro PUT foto:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
