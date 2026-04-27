-- ============================================================
-- META DE ÁGUA — BASE 2L PARA TODOS
-- Data: 2026-04-27
-- ------------------------------------------------------------
-- Decisão de produto: a meta diária de água começa em 2L (2000 ml)
-- para todo mundo. Cada paciente pode customizar individualmente
-- depois (via Configurações ou pelo profissional).
--
-- Esta migration:
--   1) Atualiza o DEFAULT da coluna fitness_profiles.meta_agua_ml
--   2) Reseta TODOS os perfis para 2000 ml (decisão do superadmin —
--      se algum profissional tinha customizado um paciente, deverá
--      reaplicar depois).
--   3) Atualiza a função get_today_water_summary que estava com
--      fallback de 3000.
--
-- Idempotente: pode rodar múltiplas vezes sem efeito colateral.
-- ============================================================

BEGIN;

-- 1) Novo default para futuros usuários
ALTER TABLE fitness_profiles
  ALTER COLUMN meta_agua_ml SET DEFAULT 2000;

-- 2) Aplicação em massa para usuários existentes
UPDATE fitness_profiles
SET meta_agua_ml = 2000
WHERE meta_agua_ml IS DISTINCT FROM 2000;

-- 3) Atualiza fallback da função SQL get_today_water_summary
--    (definida em 003_functions.sql; assinatura mantida)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_today_water_summary'
  ) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION get_today_water_summary(p_user_id UUID)
      RETURNS JSONB AS $body$
      DECLARE
        v_total_ml INTEGER;
        v_profile  RECORD;
        v_result   JSONB;
      BEGIN
        SELECT meta_agua_ml INTO v_profile
        FROM fitness_profiles
        WHERE id = p_user_id;

        SELECT COALESCE(SUM(quantidade_ml), 0) INTO v_total_ml
        FROM fitness_water_logs
        WHERE user_id = p_user_id
          AND DATE(data) = CURRENT_DATE;

        v_result := jsonb_build_object(
          'total_ml', v_total_ml,
          'meta_ml', COALESCE(v_profile.meta_agua_ml, 2000)
        );

        RETURN v_result;
      END;
      $body$ LANGUAGE plpgsql SECURITY DEFINER;
    $func$;
  END IF;
END $$;

COMMIT;

-- ============================================================
-- VERIFICAÇÃO — rode após o COMMIT.
-- ============================================================
-- SELECT
--   COUNT(*)                                            AS total_perfis,
--   COUNT(*) FILTER (WHERE meta_agua_ml = 2000)         AS perfis_2l,
--   COUNT(*) FILTER (WHERE meta_agua_ml <> 2000)        AS perfis_diferente
-- FROM fitness_profiles;
--
-- Confirma o novo DEFAULT:
-- SELECT column_name, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'fitness_profiles' AND column_name = 'meta_agua_ml';
