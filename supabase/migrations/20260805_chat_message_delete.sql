-- Apagar mensagem do chat (paciente ↔ profissional ↔ equipe)
-- Quem enviou pode apagar a própria mensagem, para os dois lados.
--
-- Decisões:
-- * Soft delete: a linha permanece (mantém a linha do tempo e os contadores
--   coerentes), mas o CONTEÚDO é purgado de verdade. O caso de uso é "mandei
--   errado / mandei para a pessoa errada" — muitas vezes com dado clínico —
--   então não faz sentido guardar o texto original.
-- * Auditoria preservada: deleted_at + deleted_by registram QUE existiu uma
--   mensagem e quem a apagou, sem guardar o que ela dizia.
-- * Sem janela de tempo: um envio errado pode ser percebido dias depois.
-- * Só o remetente apaga. Nem o destinatário nem o admin apagam mensagem alheia.
--
-- Como usar: cole no SQL Editor do Supabase e execute (self-hosted roda à mão).

-- ============================================
-- 1. COLUNAS
-- ============================================

ALTER TABLE fitness_messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN fitness_messages.deleted_at IS
  'Quando a mensagem foi apagada pelo remetente. Conteúdo e anexo são purgados; a linha vira lápide.';
COMMENT ON COLUMN fitness_messages.deleted_by IS
  'Quem apagou (sempre o próprio remetente, na regra atual).';

-- Índice parcial: consultas de lápides são raras, mas o filtro fica barato.
CREATE INDEX IF NOT EXISTS idx_fitness_messages_deleted
  ON fitness_messages(conversation_id, deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ============================================
-- 2. FUNÇÃO DE APAGAR
-- ============================================
-- Faz tudo em uma transação:
--   a) valida que quem pede é o remetente
--   b) purga conteúdo e metadata
--   c) acerta o contador de não lidas do destinatário (se ainda não tinha lido)
--   d) devolve o storage_path do anexo, para a rota remover o arquivo do bucket
--
-- Idempotente: apagar duas vezes devolve success = true sem efeito colateral.

CREATE OR REPLACE FUNCTION delete_chat_message(
  p_message_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_conversation_id UUID;
  v_sender_id UUID;
  v_sender_type VARCHAR(20);
  v_is_read BOOLEAN;
  v_deleted_at TIMESTAMPTZ;
  v_storage_path TEXT;
BEGIN
  SELECT
    m.conversation_id,
    m.sender_id,
    m.sender_type,
    m.is_read,
    m.deleted_at,
    m.metadata->>'storage_path'
  INTO
    v_conversation_id, v_sender_id, v_sender_type, v_is_read, v_deleted_at, v_storage_path
  FROM fitness_messages m
  WHERE m.id = p_message_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'not_found');
  END IF;

  IF v_sender_id IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'forbidden');
  END IF;

  IF v_deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'already_deleted', TRUE,
      'conversation_id', v_conversation_id
    );
  END IF;

  UPDATE fitness_messages
  SET content      = '',
      message_type = 'deleted',
      metadata     = NULL,
      deleted_at   = NOW(),
      deleted_by   = p_user_id,
      -- deixa de contar como pendente para o destinatário
      is_read      = TRUE,
      read_at      = COALESCE(read_at, NOW())
  WHERE id = p_message_id;

  IF v_is_read IS NOT TRUE THEN
    IF v_sender_type = 'client' THEN
      UPDATE fitness_conversations
      SET professional_unread_count = GREATEST(0, professional_unread_count - 1),
          updated_at = NOW()
      WHERE id = v_conversation_id;
    ELSE
      UPDATE fitness_conversations
      SET client_unread_count = GREATEST(0, client_unread_count - 1),
          updated_at = NOW()
      WHERE id = v_conversation_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'conversation_id', v_conversation_id,
    'storage_path', v_storage_path
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Só a rota (service role) chama. Não é exposta ao cliente porque p_user_id é
-- parâmetro — quem chamasse direto poderia se passar por outro remetente.
REVOKE ALL ON FUNCTION delete_chat_message(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_chat_message(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION delete_chat_message(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION delete_chat_message(UUID, UUID) TO service_role;

COMMENT ON FUNCTION delete_chat_message IS
  'Apaga (soft delete com purga de conteúdo) uma mensagem do chat. Só o remetente pode. Usada por DELETE /api/chat/messages.';
