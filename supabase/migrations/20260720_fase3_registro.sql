-- =============================================================
-- FASE 3 — Registro sem dor
-- Rodar ANTES do deploy do código da fase 3.
-- =============================================================

-- 1. Modelos de refeição do paciente ("Minhas refeições")
--    items: [{nome, food_id, quantidade, unidade, calorias, proteinas, carboidratos, gorduras}]
CREATE TABLE IF NOT EXISTS fitness_meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  tipo_refeicao VARCHAR(50),
  items JSONB NOT NULL,
  times_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON fitness_meal_templates(user_id);

ALTER TABLE fitness_meal_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_templates_select_own" ON fitness_meal_templates;
CREATE POLICY "meal_templates_select_own"
  ON fitness_meal_templates FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "meal_templates_insert_own" ON fitness_meal_templates;
CREATE POLICY "meal_templates_insert_own"
  ON fitness_meal_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "meal_templates_update_own" ON fitness_meal_templates;
CREATE POLICY "meal_templates_update_own"
  ON fitness_meal_templates FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "meal_templates_delete_own" ON fitness_meal_templates;
CREATE POLICY "meal_templates_delete_own"
  ON fitness_meal_templates FOR DELETE USING (auth.uid() = user_id);

-- 2. Fila de moderação: alimentos criados por pacientes podem ser promovidos
--    ao banco global pela nutricionista/superadmin.
ALTER TABLE fitness_user_foods
  ADD COLUMN IF NOT EXISTS promote_status VARCHAR(12) NOT NULL DEFAULT 'none'
    CHECK (promote_status IN ('none', 'pending', 'approved', 'rejected'));
ALTER TABLE fitness_user_foods
  ADD COLUMN IF NOT EXISTS promoted_global_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_foods_promote ON fitness_user_foods(promote_status)
  WHERE promote_status = 'pending';
