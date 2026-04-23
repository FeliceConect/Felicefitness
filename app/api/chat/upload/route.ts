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

// Categoria → limite (bytes) + mime types aceitos
const LIMITS = {
  image: 10 * 1024 * 1024, // 10 MB
  audio: 20 * 1024 * 1024, // 20 MB
  video: 50 * 1024 * 1024, // 50 MB
  pdf: 15 * 1024 * 1024,   // 15 MB
}

const MIMES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  pdf: ['application/pdf'],
}

const EXPIRES_IN_DAYS = 60

type Category = keyof typeof MIMES

function categorize(mime: string): Category | null {
  for (const cat of Object.keys(MIMES) as Category[]) {
    if (MIMES[cat].includes(mime)) return cat
  }
  return null
}

function extFromMime(mime: string, fallback: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/m4a': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'application/pdf': 'pdf',
  }
  return map[mime] || fallback
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversationId') as string | null

    if (!file || !conversationId) {
      return NextResponse.json(
        { success: false, error: 'file e conversationId são obrigatórios' },
        { status: 400 }
      )
    }

    const category = categorize(file.type)
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    if (file.size > LIMITS[category]) {
      const mb = Math.round(LIMITS[category] / (1024 * 1024))
      return NextResponse.json(
        { success: false, error: `Arquivo muito grande. Máximo ${mb}MB para ${category}` },
        { status: 413 }
      )
    }

    const admin = getAdminClient()

    // Valida que o usuário é participante da conversa
    const { data: conversation } = await admin
      .from('fitness_conversations')
      .select('id, client_id, professional_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversa não encontrada' },
        { status: 404 }
      )
    }

    const { data: professional } = await admin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', conversation.professional_id)
      .maybeSingle()

    const isParticipant = conversation.client_id === user.id || !!professional
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado a enviar anexo nesta conversa' },
        { status: 403 }
      )
    }

    // Prepara o buffer final. Só imagem passa pelo sharp.
    let uploadBuffer: Buffer
    let contentType: string
    let extension: string
    let finalSize: number

    if (category === 'image') {
      const compressed = await compressImageFile(file)
      uploadBuffer = compressed.buffer
      contentType = compressed.contentType
      extension = compressed.extension
      finalSize = compressed.buffer.byteLength
    } else {
      const arrayBuffer = await file.arrayBuffer()
      uploadBuffer = Buffer.from(arrayBuffer)
      contentType = file.type
      const originalExt = file.name.split('.').pop()?.toLowerCase() || ''
      extension = extFromMime(file.type, originalExt || 'bin')
      finalSize = uploadBuffer.byteLength
    }

    const timestamp = Date.now()
    const rand = Math.random().toString(36).slice(2, 10)
    const storagePath = `${conversationId}/${timestamp}_${rand}.${extension}`

    const { error: uploadError } = await admin.storage
      .from('chat-attachments')
      .upload(storagePath, uploadBuffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload do chat:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    const expiresAt = new Date(Date.now() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000).toISOString()

    return NextResponse.json({
      success: true,
      category, // 'image' | 'audio' | 'video' | 'pdf'
      storage_path: storagePath,
      mime_type: contentType,
      file_name: file.name,
      file_size: finalSize,
      expires_at: expiresAt,
    })
  } catch (error) {
    console.error('Erro na rota de upload de chat:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
