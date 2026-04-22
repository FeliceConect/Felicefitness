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

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// POST - Upload image for feed post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo obrigatório' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Arquivo muito grande. Máximo 10MB' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // Comprime com sharp (WebP 1080px q82) — reduz ~16× o tamanho final
    const compressed = await compressImageFile(file)
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${compressed.extension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('feed-images')
      .upload(fileName, compressed.buffer, {
        contentType: compressed.contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ success: false, error: 'Erro ao fazer upload da imagem' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('feed-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ success: true, image_url: publicUrl })
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
