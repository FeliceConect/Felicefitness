-- Tabela para armazenar push subscriptions dos usuários
-- Necessária para enviar notificações push via web-push

CREATE TABLE IF NOT EXISTS fitness_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW(),

  -- Um usuário pode ter múltiplos devices/browsers, mas cada endpoint é único
  UNIQUE(user_id, endpoint)
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON fitness_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON fitness_push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON fitness_push_subscriptions(endpoint);

-- RLS (Row Level Security)
ALTER TABLE fitness_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view own subscriptions"
  ON fitness_push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON fitness_push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON fitness_push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON fitness_push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Service role pode acessar tudo (para enviar notificações via servidor)
CREATE POLICY "Service role can access all subscriptions"
  ON fitness_push_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
