-- FeliceFit - Onboarding e LGPD (Phase 6)
-- Execute este arquivo no Supabase SQL Editor
-- Sistema de onboarding e conformidade LGPD

-- ============================================
-- 1. ADICIONAR CAMPOS DE ONBOARDING NO PERFIL
-- ============================================

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS termos_aceitos BOOLEAN DEFAULT FALSE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS termos_aceitos_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS termos_versao VARCHAR(20);

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS privacidade_aceita BOOLEAN DEFAULT FALSE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS privacidade_aceita_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS privacidade_versao VARCHAR(20);

-- Preferências de privacidade
ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS compartilhar_progresso BOOLEAN DEFAULT FALSE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS receber_notificacoes_email BOOLEAN DEFAULT TRUE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS receber_notificacoes_push BOOLEAN DEFAULT TRUE;

ALTER TABLE fitness_profiles
ADD COLUMN IF NOT EXISTS dados_anonimos_pesquisa BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. TABELA DE HISTÓRICO DE CONSENTIMENTO
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_consent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'termos', 'privacidade', 'marketing', 'pesquisa'
  consent_version VARCHAR(20) NOT NULL,
  accepted BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_history_user ON fitness_consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_type ON fitness_consent_history(consent_type);

-- RLS
ALTER TABLE fitness_consent_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios veem seu historico de consentimento" ON fitness_consent_history;
CREATE POLICY "Usuarios veem seu historico de consentimento" ON fitness_consent_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios podem registrar consentimento" ON fitness_consent_history;
CREATE POLICY "Usuarios podem registrar consentimento" ON fitness_consent_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. TABELA DE SOLICITAÇÕES LGPD
-- ============================================

CREATE TABLE IF NOT EXISTS fitness_lgpd_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL, -- 'export_data', 'delete_data', 'anonymize_data'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  notes TEXT,
  data_file_url TEXT -- URL do arquivo exportado (se aplicável)
);

CREATE INDEX IF NOT EXISTS idx_lgpd_requests_user ON fitness_lgpd_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_lgpd_requests_status ON fitness_lgpd_requests(status);

-- RLS
ALTER TABLE fitness_lgpd_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios veem suas solicitacoes LGPD" ON fitness_lgpd_requests;
CREATE POLICY "Usuarios veem suas solicitacoes LGPD" ON fitness_lgpd_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios podem criar solicitacoes LGPD" ON fitness_lgpd_requests;
CREATE POLICY "Usuarios podem criar solicitacoes LGPD" ON fitness_lgpd_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. FUNÇÃO PARA REGISTRAR CONSENTIMENTO
-- ============================================

CREATE OR REPLACE FUNCTION register_consent(
  p_user_id UUID,
  p_consent_type VARCHAR(50),
  p_consent_version VARCHAR(20),
  p_accepted BOOLEAN,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  -- Inserir registro de consentimento
  INSERT INTO fitness_consent_history (
    user_id, consent_type, consent_version, accepted, ip_address, user_agent
  )
  VALUES (
    p_user_id, p_consent_type, p_consent_version, p_accepted, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_consent_id;

  -- Atualizar perfil do usuário
  IF p_consent_type = 'termos' THEN
    UPDATE fitness_profiles
    SET
      termos_aceitos = p_accepted,
      termos_aceitos_em = CASE WHEN p_accepted THEN NOW() ELSE NULL END,
      termos_versao = CASE WHEN p_accepted THEN p_consent_version ELSE NULL END
    WHERE id = p_user_id;
  ELSIF p_consent_type = 'privacidade' THEN
    UPDATE fitness_profiles
    SET
      privacidade_aceita = p_accepted,
      privacidade_aceita_em = CASE WHEN p_accepted THEN NOW() ELSE NULL END,
      privacidade_versao = CASE WHEN p_accepted THEN p_consent_version ELSE NULL END
    WHERE id = p_user_id;
  END IF;

  RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FUNÇÃO PARA MARCAR ONBOARDING COMPLETO
-- ============================================

CREATE OR REPLACE FUNCTION complete_onboarding(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE fitness_profiles
  SET
    onboarding_completed = TRUE,
    onboarding_step = 999
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNÇÃO PARA EXPORTAR DADOS DO USUÁRIO (LGPD)
-- ============================================

CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(fp) FROM fitness_profiles fp WHERE fp.id = p_user_id),
    'workouts', (SELECT jsonb_agg(row_to_json(w)) FROM fitness_workouts w WHERE w.user_id = p_user_id),
    'meals', (SELECT jsonb_agg(row_to_json(m)) FROM fitness_meals m WHERE m.user_id = p_user_id),
    'water_logs', (SELECT jsonb_agg(row_to_json(wl)) FROM fitness_water_logs wl WHERE wl.user_id = p_user_id),
    'sleep_logs', (SELECT jsonb_agg(row_to_json(sl)) FROM fitness_sleep_logs sl WHERE sl.user_id = p_user_id),
    'body_compositions', (SELECT jsonb_agg(row_to_json(bc)) FROM fitness_body_compositions bc WHERE bc.user_id = p_user_id),
    'achievements', (SELECT jsonb_agg(row_to_json(au)) FROM fitness_achievements_users au WHERE au.user_id = p_user_id),
    'consent_history', (SELECT jsonb_agg(row_to_json(ch)) FROM fitness_consent_history ch WHERE ch.user_id = p_user_id),
    'exported_at', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION register_consent(UUID, VARCHAR, VARCHAR, BOOLEAN, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;
