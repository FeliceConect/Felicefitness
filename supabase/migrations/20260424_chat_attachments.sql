-- Chat Attachments (Fase 4.1)
-- Suporte a upload de arquivos (imagem, áudio, vídeo, PDF) no chat
-- com expiração automática em 60 dias.
--
-- Como usar: cole no SQL Editor do Supabase e execute.

-- ============================================
-- 1. BUCKET DE STORAGE (PRIVADO)
-- ============================================

-- Cria bucket chat-attachments se ainda não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  FALSE, -- privado: acesso só via signed URL
  52428800, -- 50 MB (maior limite aceito — vídeo)
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
    'audio/mpeg','audio/mp4','audio/m4a','audio/wav','audio/ogg','audio/webm','audio/x-m4a',
    'video/mp4','video/webm','video/quicktime',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 2. RLS DE STORAGE
-- ============================================
-- Políticas: só participantes da conversa (client_id OU professional com user_id match)
-- podem ler/escrever objetos cujo path comece com {conversation_id}/...
-- Super admin também tem acesso total.

-- Remover políticas antigas (idempotente)
DROP POLICY IF EXISTS "chat_attachments_select_participants" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_insert_participants" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_delete_participants" ON storage.objects;

-- SELECT (leitura via signed URL é feita pelo service role, mas policy é necessária
-- caso alguém acesse com o anon client no futuro)
CREATE POLICY "chat_attachments_select_participants"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND (
      -- super_admin
      EXISTS (
        SELECT 1 FROM fitness_profiles
        WHERE id = auth.uid() AND role IN ('super_admin','admin')
      )
      OR EXISTS (
        SELECT 1 FROM fitness_conversations c
        WHERE c.id::text = split_part(name, '/', 1)
          AND (
            c.client_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM fitness_professionals p
              WHERE p.id = c.professional_id AND p.user_id = auth.uid()
            )
          )
      )
    )
  );

-- INSERT (upload direto via client — nosso fluxo usa service role na rota,
-- mas mantemos a policy para consistência)
CREATE POLICY "chat_attachments_insert_participants"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM fitness_conversations c
      WHERE c.id::text = split_part(name, '/', 1)
        AND (
          c.client_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM fitness_professionals p
            WHERE p.id = c.professional_id AND p.user_id = auth.uid()
          )
        )
    )
  );

-- DELETE (o cron usa service role; policy para casos futuros)
CREATE POLICY "chat_attachments_delete_participants"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-attachments'
    AND EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin','admin')
    )
  );

-- ============================================
-- 3. ÍNDICE PARA LIMPEZA EFICIENTE
-- ============================================
-- Índice funcional sobre metadata->>'expires_at' para acelerar o cron.

CREATE INDEX IF NOT EXISTS idx_fitness_messages_attachment_expires
  ON fitness_messages ((metadata->>'expires_at'))
  WHERE metadata ? 'storage_path';

-- ============================================
-- 4. FUNÇÃO DE LIMPEZA DE ANEXOS EXPIRADOS
-- ============================================
-- Retorna lista de storage_paths que devem ser removidos do bucket.
-- A rota de cron chama essa função, apaga os arquivos via service role,
-- e depois chama mark_chat_attachments_expired() para atualizar as mensagens.

CREATE OR REPLACE FUNCTION list_expired_chat_attachments(p_limit INTEGER DEFAULT 500)
RETURNS TABLE(message_id UUID, storage_path TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    (m.metadata->>'storage_path')::TEXT
  FROM fitness_messages m
  WHERE m.metadata ? 'storage_path'
    AND (m.metadata->>'expires_at')::timestamptz < NOW()
    AND (m.metadata->>'expired')::boolean IS NOT TRUE
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION list_expired_chat_attachments(INTEGER) TO service_role;

-- Marca uma mensagem como anexo expirado (arquivo já deletado do bucket).
-- Preserva o registro da mensagem mas remove campos que não fazem mais sentido
-- e adiciona flag "expired": true para a UI exibir placeholder.
CREATE OR REPLACE FUNCTION mark_chat_attachment_expired(p_message_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE fitness_messages
  SET metadata = jsonb_build_object(
    'expired', TRUE,
    'file_name', COALESCE(metadata->>'file_name', 'arquivo'),
    'mime_type', COALESCE(metadata->>'mime_type', 'application/octet-stream')
  )
  WHERE id = p_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_chat_attachment_expired(UUID) TO service_role;

-- ============================================
-- 5. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION list_expired_chat_attachments IS
  'Retorna até p_limit anexos cuja data de expiração passou. Usado pelo cron /api/cron/chat-cleanup.';

COMMENT ON FUNCTION mark_chat_attachment_expired IS
  'Marca uma mensagem como anexo expirado após o arquivo ter sido removido do bucket.';
