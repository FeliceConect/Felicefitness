-- FeliceFit - Chat System (Phase 4)
-- Execute este arquivo no Supabase SQL Editor
-- Sistema de mensagens entre clientes e profissionais

-- ============================================
-- 1. TABELA DE CONVERSAS
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES fitness_professionals(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_unread_count INTEGER DEFAULT 0,
  professional_unread_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, professional_id)
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_fitness_conversations_updated_at ON fitness_conversations;
CREATE TRIGGER update_fitness_conversations_updated_at
  BEFORE UPDATE ON fitness_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_fitness_conversations_client ON fitness_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_fitness_conversations_professional ON fitness_conversations(professional_id);
CREATE INDEX IF NOT EXISTS idx_fitness_conversations_last_message ON fitness_conversations(last_message_at DESC);

-- RLS
ALTER TABLE fitness_conversations ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Clientes podem ver suas conversas" ON fitness_conversations;
DROP POLICY IF EXISTS "Profissionais podem ver suas conversas" ON fitness_conversations;
DROP POLICY IF EXISTS "Admins podem ver todas conversas" ON fitness_conversations;
DROP POLICY IF EXISTS "Sistema pode criar conversas" ON fitness_conversations;
DROP POLICY IF EXISTS "Participantes podem atualizar conversas" ON fitness_conversations;

-- Políticas RLS
CREATE POLICY "Clientes podem ver suas conversas"
  ON fitness_conversations FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Profissionais podem ver suas conversas"
  ON fitness_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_professionals
      WHERE id = professional_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem ver todas conversas"
  ON fitness_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Sistema pode criar conversas"
  ON fitness_conversations FOR INSERT
  WITH CHECK (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM fitness_professionals
      WHERE id = professional_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participantes podem atualizar conversas"
  ON fitness_conversations FOR UPDATE
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM fitness_professionals
      WHERE id = professional_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- 2. TABELA DE MENSAGENS
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES fitness_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'client', 'professional'
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'feedback', 'meal_comment', 'workout_comment'
  metadata JSONB, -- Para anexar referências a refeições, treinos, etc.
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fitness_messages_conversation ON fitness_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_fitness_messages_sender ON fitness_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_fitness_messages_created ON fitness_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fitness_messages_unread ON fitness_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- RLS
ALTER TABLE fitness_messages ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Participantes podem ver mensagens" ON fitness_messages;
DROP POLICY IF EXISTS "Participantes podem enviar mensagens" ON fitness_messages;
DROP POLICY IF EXISTS "Destinatário pode marcar como lida" ON fitness_messages;
DROP POLICY IF EXISTS "Admins podem ver todas mensagens" ON fitness_messages;

-- Políticas RLS
CREATE POLICY "Participantes podem ver mensagens"
  ON fitness_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_conversations c
      WHERE c.id = conversation_id
      AND (
        c.client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM fitness_professionals p
          WHERE p.id = c.professional_id AND p.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Participantes podem enviar mensagens"
  ON fitness_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM fitness_conversations c
      WHERE c.id = conversation_id
      AND (
        c.client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM fitness_professionals p
          WHERE p.id = c.professional_id AND p.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Destinatário pode marcar como lida"
  ON fitness_messages FOR UPDATE
  USING (
    sender_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM fitness_conversations c
      WHERE c.id = conversation_id
      AND (
        c.client_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM fitness_professionals p
          WHERE p.id = c.professional_id AND p.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins podem ver todas mensagens"
  ON fitness_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- 3. FUNÇÃO PARA ATUALIZAR CONTADORES DE NÃO LIDAS
-- ============================================

CREATE OR REPLACE FUNCTION update_conversation_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar last_message_at e contadores
  IF NEW.sender_type = 'client' THEN
    UPDATE fitness_conversations
    SET
      last_message_at = NEW.created_at,
      professional_unread_count = professional_unread_count + 1,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE fitness_conversations
    SET
      last_message_at = NEW.created_at,
      client_unread_count = client_unread_count + 1,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nova mensagem
DROP TRIGGER IF EXISTS on_new_message ON fitness_messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON fitness_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_unread_count();

-- ============================================
-- 4. FUNÇÃO PARA MARCAR MENSAGENS COMO LIDAS
-- ============================================

CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID,
  p_user_type VARCHAR(20)
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Marcar mensagens não lidas como lidas
  UPDATE fitness_messages
  SET is_read = TRUE, read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Resetar contador de não lidas
  IF p_user_type = 'client' THEN
    UPDATE fitness_conversations
    SET client_unread_count = 0, updated_at = NOW()
    WHERE id = p_conversation_id;
  ELSE
    UPDATE fitness_conversations
    SET professional_unread_count = 0, updated_at = NOW()
    WHERE id = p_conversation_id;
  END IF;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNÇÃO PARA OBTER OU CRIAR CONVERSA
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_client_id UUID,
  p_professional_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Tentar encontrar conversa existente
  SELECT id INTO v_conversation_id
  FROM fitness_conversations
  WHERE client_id = p_client_id AND professional_id = p_professional_id;

  -- Se não existe, criar nova
  IF v_conversation_id IS NULL THEN
    INSERT INTO fitness_conversations (client_id, professional_id)
    VALUES (p_client_id, p_professional_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE fitness_conversations IS 'Conversas entre clientes e profissionais';
COMMENT ON TABLE fitness_messages IS 'Mensagens dentro das conversas';
COMMENT ON COLUMN fitness_messages.message_type IS 'Tipo: text, image, feedback, meal_comment, workout_comment';
COMMENT ON COLUMN fitness_messages.metadata IS 'Dados extras como referência a refeição, treino, etc';
