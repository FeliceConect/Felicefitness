-- FeliceFit - Admin Module Phase 1: Foundation
-- Execute este arquivo no Supabase SQL Editor
-- IMPORTANTE: Esta migration apenas ADICIONA novas estruturas, não modifica as existentes

-- ============================================
-- 1. ADICIONAR CAMPO ROLE NA TABELA fitness_profiles
-- ============================================

-- Adicionar coluna role se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fitness_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE fitness_profiles ADD COLUMN role VARCHAR(20) DEFAULT 'client';
  END IF;
END $$;

-- Criar índice para busca por role
CREATE INDEX IF NOT EXISTS idx_fitness_profiles_role ON fitness_profiles(role);

-- ============================================
-- 2. FITNESS_PROFESSIONALS (Profissionais - Nutri/Personal)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'nutritionist', 'trainer'
  registration VARCHAR(50), -- CRN ou CREF
  specialty VARCHAR(100),
  bio TEXT,
  max_clients INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_fitness_professionals_updated_at ON fitness_professionals;
CREATE TRIGGER update_fitness_professionals_updated_at
  BEFORE UPDATE ON fitness_professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_fitness_professionals_user_id ON fitness_professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_professionals_type ON fitness_professionals(type);
CREATE INDEX IF NOT EXISTS idx_fitness_professionals_is_active ON fitness_professionals(is_active);

-- RLS
ALTER TABLE fitness_professionals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Admins podem ver todos os profissionais
CREATE POLICY "Admins podem ver todos profissionais"
  ON fitness_professionals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Profissionais podem ver seu próprio registro
CREATE POLICY "Profissionais podem ver seu registro"
  ON fitness_professionals FOR SELECT
  USING (user_id = auth.uid());

-- Admins podem criar profissionais
CREATE POLICY "Admins podem criar profissionais"
  ON fitness_professionals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins podem atualizar profissionais
CREATE POLICY "Admins podem atualizar profissionais"
  ON fitness_professionals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Profissionais podem atualizar alguns campos do seu registro
CREATE POLICY "Profissionais podem atualizar seu registro"
  ON fitness_professionals FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- 3. FITNESS_CLIENT_ASSIGNMENTS (Atribuição Cliente-Profissional)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES fitness_professionals(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, professional_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fitness_client_assignments_client ON fitness_client_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_fitness_client_assignments_professional ON fitness_client_assignments(professional_id);
CREATE INDEX IF NOT EXISTS idx_fitness_client_assignments_is_active ON fitness_client_assignments(is_active);

-- RLS
ALTER TABLE fitness_client_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Admins podem ver todas as atribuições
CREATE POLICY "Admins podem ver todas atribuições"
  ON fitness_client_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Profissionais podem ver suas próprias atribuições
CREATE POLICY "Profissionais podem ver suas atribuições"
  ON fitness_client_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_professionals
      WHERE id = professional_id AND user_id = auth.uid()
    )
  );

-- Clientes podem ver a quem estão atribuídos
CREATE POLICY "Clientes podem ver suas atribuições"
  ON fitness_client_assignments FOR SELECT
  USING (client_id = auth.uid());

-- Admins podem criar atribuições
CREATE POLICY "Admins podem criar atribuições"
  ON fitness_client_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins podem atualizar atribuições
CREATE POLICY "Admins podem atualizar atribuições"
  ON fitness_client_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Admins podem deletar atribuições
CREATE POLICY "Admins podem deletar atribuições"
  ON fitness_client_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- 4. FITNESS_TERMS_ACCEPTANCE (Aceite de Termos - LGPD)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL, -- Ex: '1.0', '1.1'
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  UNIQUE(user_id, version)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fitness_terms_user_id ON fitness_terms_acceptance(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_terms_version ON fitness_terms_acceptance(version);

-- RLS
ALTER TABLE fitness_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários podem ver seus próprios aceites
CREATE POLICY "Usuários podem ver seus aceites"
  ON fitness_terms_acceptance FOR SELECT
  USING (user_id = auth.uid());

-- Usuários podem criar aceites
CREATE POLICY "Usuários podem criar aceites"
  ON fitness_terms_acceptance FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins podem ver todos os aceites
CREATE POLICY "Admins podem ver todos aceites"
  ON fitness_terms_acceptance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- 5. FITNESS_API_USAGE (Monitoramento de custos de API)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature VARCHAR(50) NOT NULL, -- 'food_analysis', 'coach', 'insights'
  model VARCHAR(50), -- 'gpt-4', 'gpt-4-vision', 'gpt-4-turbo'
  endpoint VARCHAR(100),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para relatórios de custo
CREATE INDEX IF NOT EXISTS idx_fitness_api_usage_user ON fitness_api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_api_usage_feature ON fitness_api_usage(feature);
CREATE INDEX IF NOT EXISTS idx_fitness_api_usage_created ON fitness_api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_fitness_api_usage_user_date ON fitness_api_usage(user_id, created_at);

-- RLS
ALTER TABLE fitness_api_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Admins podem ver todos os registros de uso
CREATE POLICY "Admins podem ver todo uso de API"
  ON fitness_api_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Sistema pode inserir (via service role)
-- Nota: inserts serão feitos via service role key no backend

-- ============================================
-- 6. FITNESS_AUDIT_LOG (Auditoria de ações)
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'view_client', 'send_feedback', 'login', etc
  target_type VARCHAR(50), -- 'client', 'meal', 'workout', etc
  target_id UUID,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- para ações em outros usuários
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_fitness_audit_user ON fitness_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_audit_action ON fitness_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_fitness_audit_target_user ON fitness_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_fitness_audit_created ON fitness_audit_log(created_at);

-- RLS
ALTER TABLE fitness_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Apenas admins podem ver logs de auditoria
CREATE POLICY "Admins podem ver logs de auditoria"
  ON fitness_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Sistema pode inserir (via service role)

-- ============================================
-- 7. FUNÇÃO AUXILIAR: Verificar se usuário é admin
-- ============================================

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM fitness_profiles
    WHERE id = user_uuid AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. FUNÇÃO AUXILIAR: Verificar se usuário é profissional
-- ============================================

CREATE OR REPLACE FUNCTION is_professional(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM fitness_profiles
    WHERE id = user_uuid AND role IN ('nutritionist', 'trainer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. FUNÇÃO AUXILIAR: Verificar se profissional tem acesso ao cliente
-- ============================================

CREATE OR REPLACE FUNCTION professional_has_client(professional_user_id UUID, client_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM fitness_client_assignments ca
    JOIN fitness_professionals p ON ca.professional_id = p.id
    WHERE p.user_id = professional_user_id
    AND ca.client_id = client_user_id
    AND ca.is_active = TRUE
    AND p.is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. ATUALIZAR SEU USUÁRIO COMO SUPER_ADMIN
-- ============================================

-- IMPORTANTE: Após executar esta migration, execute o comando abaixo
-- substituindo SEU_USER_ID pelo ID do seu usuário no auth.users
--
UPDATE fitness_profiles SET role = 'super_admin' WHERE id = 6ec8c5cc-b4c3-4d39-a71a-c3204fcbad85;
--
-- Você pode encontrar seu user_id executando:
-- SELECT id, email FROM auth.users;

-- ============================================
-- 11. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE fitness_professionals IS 'Profissionais (nutricionistas e personal trainers) cadastrados no sistema';
COMMENT ON TABLE fitness_client_assignments IS 'Atribuição de clientes a profissionais';
COMMENT ON TABLE fitness_terms_acceptance IS 'Registro de aceite de termos de uso (LGPD)';
COMMENT ON TABLE fitness_api_usage IS 'Registro de uso da API OpenAI para controle de custos';
COMMENT ON TABLE fitness_audit_log IS 'Log de auditoria de ações no sistema';

COMMENT ON COLUMN fitness_profiles.role IS 'Papel do usuário: super_admin, admin, nutritionist, trainer, client';
COMMENT ON COLUMN fitness_professionals.type IS 'Tipo de profissional: nutritionist ou trainer';
COMMENT ON COLUMN fitness_professionals.registration IS 'Registro profissional: CRN (nutri) ou CREF (personal)';
