-- FeliceFit - Migration 007: Admin Create Profile Function
-- Execute este arquivo no Supabase SQL Editor

-- Função para criar perfil de usuário via admin (bypassa RLS)
CREATE OR REPLACE FUNCTION admin_create_profile(
  p_user_id UUID,
  p_email TEXT,
  p_nome TEXT,
  p_role TEXT DEFAULT 'client'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Inserir o perfil ou atualizar se já existir
  -- onboarding_completed = FALSE para forçar onboarding no primeiro acesso
  INSERT INTO fitness_profiles (
    id,
    email,
    nome,
    role,
    onboarding_completed,
    onboarding_step,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_nome,
    p_role,
    FALSE,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    updated_at = NOW();

  -- Retornar sucesso
  v_result := json_build_object(
    'success', TRUE,
    'user_id', p_user_id
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Retornar erro
  v_result := json_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
  RETURN v_result;
END;
$$;

-- Dar permissão para service_role executar a função
GRANT EXECUTE ON FUNCTION admin_create_profile TO service_role;

-- Também adicionar política para permitir admins lerem todos os perfis
DO $$
BEGIN
  -- Verificar se a política já existe antes de criar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fitness_profiles'
    AND policyname = 'Admins podem ver todos os perfis'
  ) THEN
    CREATE POLICY "Admins podem ver todos os perfis"
      ON fitness_profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM fitness_profiles fp
          WHERE fp.id = auth.uid()
          AND fp.role IN ('super_admin', 'admin')
        )
        OR auth.uid() = id
      );
  END IF;
END $$;
