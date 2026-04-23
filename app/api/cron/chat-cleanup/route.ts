import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Chat Attachment Cleanup — roda diariamente.
 *
 * 1. Busca anexos expirados via RPC list_expired_chat_attachments
 * 2. Remove os arquivos do bucket chat-attachments (em lote de até 100)
 * 3. Marca cada mensagem como "expired" via RPC mark_chat_attachment_expired
 *
 * Autenticação: header Authorization: Bearer $CRON_SECRET (mesma lógica dos outros crons).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: expired, error: listError } = await (db as any).rpc(
      'list_expired_chat_attachments',
      { p_limit: 500 }
    )

    if (listError) {
      console.error('Erro ao listar anexos expirados:', listError)
      return NextResponse.json(
        { success: false, error: 'Erro ao listar anexos expirados' },
        { status: 500 }
      )
    }

    const items = (expired || []) as Array<{ message_id: string; storage_path: string }>
    if (items.length === 0) {
      return NextResponse.json({ success: true, removed: 0 })
    }

    // Remove em lotes de 100 (limite do storage.remove)
    const chunkSize = 100
    let removedFiles = 0
    let markedMessages = 0

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize)
      const paths = chunk.map(it => it.storage_path).filter(Boolean)

      if (paths.length > 0) {
        const { error: removeError } = await db.storage
          .from('chat-attachments')
          .remove(paths)
        if (removeError) {
          console.error('Erro ao remover arquivos:', removeError)
          // Continua mesmo com erro — marca as mensagens mesmo assim
          // para não ficar em loop eterno.
        } else {
          removedFiles += paths.length
        }
      }

      // Marca cada mensagem como expired
      for (const it of chunk) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (db as any).rpc('mark_chat_attachment_expired', {
          p_message_id: it.message_id,
        })
        if (!error) markedMessages++
      }
    }

    return NextResponse.json({
      success: true,
      total_expired: items.length,
      removed_files: removedFiles,
      marked_messages: markedMessages,
    })
  } catch (error) {
    console.error('Chat cleanup cron error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
