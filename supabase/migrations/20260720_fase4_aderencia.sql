-- =============================================================
-- FASE 4 — Aderência real ao plano alimentar
-- Rodar ANTES do deploy do código da fase 4.
-- =============================================================

-- 1. Vínculo da refeição registrada com a refeição do plano + status
--    de aderência: seguiu | substituiu | fora_do_plano | pulou
ALTER TABLE fitness_meals ADD COLUMN IF NOT EXISTS plan_meal_id UUID;
ALTER TABLE fitness_meals ADD COLUMN IF NOT EXISTS adherence_status VARCHAR(15);

ALTER TABLE fitness_meals DROP CONSTRAINT IF EXISTS fitness_meals_adherence_status_check;
ALTER TABLE fitness_meals ADD CONSTRAINT fitness_meals_adherence_status_check
  CHECK (adherence_status IS NULL OR adherence_status IN ('seguiu', 'substituiu', 'fora_do_plano', 'pulou'));

CREATE INDEX IF NOT EXISTS idx_meals_plan_meal ON fitness_meals(plan_meal_id) WHERE plan_meal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meals_user_data ON fitness_meals(user_id, data);

-- 2. Flag "só em dia de treino" nas refeições do plano (antes o badge era
--    cosmético: o save não persistia e o app não filtrava)
ALTER TABLE fitness_meal_plan_meals ADD COLUMN IF NOT EXISTS is_training_day_only BOOLEAN NOT NULL DEFAULT false;

-- 3. fitness_meal_plan_adherence já existe (010_professional_plans.sql, com
--    UNIQUE(meal_plan_id, client_id, date)) mas nunca foi preenchida em
--    produção. O cron semanal passa a gravar nela via upsert.
