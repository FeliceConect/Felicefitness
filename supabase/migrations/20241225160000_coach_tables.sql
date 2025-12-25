-- =============================================
-- FeliceFit - Coach Virtual IA Tables
-- Fase 16: Tabelas para conversas e mensagens do coach
-- =============================================

-- Tabela de conversas do coach
CREATE TABLE IF NOT EXISTS public.coach_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Nova Conversa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para coach_conversations
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_id ON public.coach_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_updated_at ON public.coach_conversations(updated_at DESC);

-- Tabela de mensagens do coach
CREATE TABLE IF NOT EXISTS public.coach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    actions JSONB DEFAULT NULL,
    feedback TEXT CHECK (feedback IN ('positive', 'negative', NULL)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para coach_messages
CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation_id ON public.coach_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_created_at ON public.coach_messages(created_at);

-- Trigger para atualizar updated_at na conversa quando uma mensagem é adicionada
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.coach_conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON public.coach_messages;
CREATE TRIGGER trigger_update_conversation_updated_at
    AFTER INSERT ON public.coach_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- RLS (Row Level Security) Policies
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para coach_conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.coach_conversations;
CREATE POLICY "Users can view their own conversations"
    ON public.coach_conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own conversations" ON public.coach_conversations;
CREATE POLICY "Users can create their own conversations"
    ON public.coach_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.coach_conversations;
CREATE POLICY "Users can update their own conversations"
    ON public.coach_conversations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.coach_conversations;
CREATE POLICY "Users can delete their own conversations"
    ON public.coach_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para coach_messages (acesso via conversation)
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.coach_messages;
CREATE POLICY "Users can view messages from their conversations"
    ON public.coach_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_conversations
            WHERE id = coach_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.coach_messages;
CREATE POLICY "Users can create messages in their conversations"
    ON public.coach_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.coach_conversations
            WHERE id = coach_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.coach_messages;
CREATE POLICY "Users can update messages in their conversations"
    ON public.coach_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_conversations
            WHERE id = coach_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON public.coach_messages;
CREATE POLICY "Users can delete messages from their conversations"
    ON public.coach_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.coach_conversations
            WHERE id = coach_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Tabela de feedback do coach (para analytics)
CREATE TABLE IF NOT EXISTS public.coach_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.coach_messages(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para coach_feedback
CREATE INDEX IF NOT EXISTS idx_coach_feedback_user_id ON public.coach_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_feedback_message_id ON public.coach_feedback(message_id);

-- RLS para coach_feedback
ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own feedback" ON public.coach_feedback;
CREATE POLICY "Users can view their own feedback"
    ON public.coach_feedback FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own feedback" ON public.coach_feedback;
CREATE POLICY "Users can create their own feedback"
    ON public.coach_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Comentários nas tabelas
COMMENT ON TABLE public.coach_conversations IS 'Conversas do usuário com o coach virtual FeliceCoach';
COMMENT ON TABLE public.coach_messages IS 'Mensagens das conversas com o coach';
COMMENT ON TABLE public.coach_feedback IS 'Feedback dos usuários sobre as respostas do coach';

COMMENT ON COLUMN public.coach_conversations.title IS 'Título da conversa, gerado automaticamente';
COMMENT ON COLUMN public.coach_messages.role IS 'Papel: user (usuário), assistant (coach), system (sistema)';
COMMENT ON COLUMN public.coach_messages.actions IS 'Ações sugeridas pelo coach em formato JSON';
COMMENT ON COLUMN public.coach_messages.feedback IS 'Feedback do usuário sobre a mensagem';
