/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { compressImageFile } from '@/lib/images/compress'
import { getTodayDateSP } from '@/lib/utils/date'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB (antes da compressão)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const VALID_MOMENTOS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']
const VALID_POSICOES = ['frontal', 'lateral_d', 'lateral_e', 'costas']

async function requireAdminOrProfessional(patientId?: string) {
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

// GET - Listar fotos do paciente (opcionalmente filtradas por momento)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const auth = await requireAdminOrProfessional(patientId)
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const { searchParams } = new URL(request.url)
    const momento = searchParams.get('momento')

    let query = supabaseAdmin
      .from('fitness_progress_photos')
      .select('id, data, tipo, foto_url, momento_avaliacao, posicao, peso_no_dia, notas, created_at')
      .eq('user_id', patientId)
      .order('data', { ascending: false })

    if (momento) {
      query = query.eq('momento_avaliacao', momento)
    }

    const { data: photos, error } = await query

    if (error) {
      console.error('Erro ao buscar fotos:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar fotos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photos: photos || [] })
  } catch (error) {
    console.error('Erro na API de fotos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Upload de uma foto (multipart: file + momento + posicao)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const auth = await requireAdminOrProfessional(patientId)
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const momento = formData.get('momento_avaliacao') as string | null
    const posicao = formData.get('posicao') as string | null
    const data = (formData.get('data') as string | null) || getTodayDateSP()

    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo obrigatório' }, { status: 400 })
    }
    if (!momento || !VALID_MOMENTOS.includes(momento)) {
      return NextResponse.json({ success: false, error: 'Momento inválido (M0-M6)' }, { status: 400 })
    }
    if (!posicao || !VALID_POSICOES.includes(posicao)) {
      return NextResponse.json({ success: false, error: 'Posição inválida' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Tipo de arquivo não permitido' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Arquivo muito grande (máx. 15MB)' }, { status: 400 })
    }

    // Comprime com sharp: WebP 1080px q82 (~150-250 KB)
    const compressed = await compressImageFile(file)
    const fileName = `${patientId}/${momento}_${posicao}_${Date.now()}.${compressed.extension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('progress-photos')
      .upload(fileName, compressed.buffer, {
        contentType: compressed.contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ success: false, error: 'Erro ao fazer upload da imagem' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('progress-photos')
      .getPublicUrl(fileName)

    // Insere o registro
    const { data: photo, error: insertError } = await supabaseAdmin
      .from('fitness_progress_photos')
      .insert({
        user_id: patientId,
        data,
        tipo: posicao,
        foto_url: publicUrl,
        momento_avaliacao: momento,
        posicao,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao inserir foto:', insertError)
      // tenta remover o arquivo órfão
      await supabaseAdmin.storage.from('progress-photos').remove([fileName]).catch(() => {})
      return NextResponse.json({ success: false, error: 'Erro ao salvar metadados' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo })
  } catch (error) {
    console.error('Erro na API de fotos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Remove uma foto (por id)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const auth = await requireAdminOrProfessional(patientId)
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photo_id')

    if (!photoId) {
      return NextResponse.json({ success: false, error: 'photo_id obrigatório' }, { status: 400 })
    }

    // Busca para pegar a URL e deletar do Storage depois
    const { data: photo } = await supabaseAdmin
      .from('fitness_progress_photos')
      .select('foto_url, user_id')
      .eq('id', photoId)
      .single()

    if (!photo || photo.user_id !== patientId) {
      return NextResponse.json({ success: false, error: 'Foto não encontrada' }, { status: 404 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('fitness_progress_photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      console.error('Erro ao deletar foto:', deleteError)
      return NextResponse.json({ success: false, error: 'Erro ao deletar' }, { status: 500 })
    }

    // Tentar remover do Storage (não bloqueante)
    try {
      const url = new URL(photo.foto_url)
      const pathMatch = url.pathname.match(/\/progress-photos\/(.+)$/)
      if (pathMatch) {
        await supabaseAdmin.storage.from('progress-photos').remove([pathMatch[1]])
      }
    } catch {
      // silent
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de fotos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
