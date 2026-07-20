-- =============================================================
-- FASE 1 — Revisão do módulo Alimentação: correções críticas
-- Rodar ANTES do deploy do código que usa estas estruturas.
-- =============================================================

-- 1. Favoritos de alimentos (funciona para alimentos GLOBAIS e do usuário).
--    Antes só fitness_user_foods.is_favorite existia — impossível favoritar
--    um alimento TACO/TBCA.
CREATE TABLE IF NOT EXISTS fitness_food_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL,
  food_source VARCHAR(10) NOT NULL DEFAULT 'global' CHECK (food_source IN ('global', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, food_id)
);

CREATE INDEX IF NOT EXISTS idx_food_favorites_user ON fitness_food_favorites(user_id);

ALTER TABLE fitness_food_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_favorites_select_own" ON fitness_food_favorites;
CREATE POLICY "food_favorites_select_own"
  ON fitness_food_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "food_favorites_insert_own" ON fitness_food_favorites;
CREATE POLICY "food_favorites_insert_own"
  ON fitness_food_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "food_favorites_delete_own" ON fitness_food_favorites;
CREATE POLICY "food_favorites_delete_own"
  ON fitness_food_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- 2. A FK de fitness_meal_items.food_id aponta para a tabela LEGADA
--    fitness_foods. Os alimentos hoje vivem em fitness_global_foods e
--    fitness_user_foods, então qualquer item com food_id dessas tabelas
--    viola a FK e o insert falha silenciosamente (o loop do app engolia
--    o erro). Removemos a FK: food_id passa a ser referência lógica.
ALTER TABLE fitness_meal_items
  DROP CONSTRAINT IF EXISTS fitness_meal_items_food_id_fkey;

-- 3. Micronutrientes em fitness_user_foods — a API já mapeia esses campos
--    (sempre null hoje porque as colunas não existiam).
ALTER TABLE fitness_user_foods ADD COLUMN IF NOT EXISTS ferro DECIMAL(8,2);
ALTER TABLE fitness_user_foods ADD COLUMN IF NOT EXISTS colesterol DECIMAL(8,2);
ALTER TABLE fitness_user_foods ADD COLUMN IF NOT EXISTS zinco DECIMAL(8,2);
ALTER TABLE fitness_user_foods ADD COLUMN IF NOT EXISTS selenio DECIMAL(8,2);
ALTER TABLE fitness_user_foods ADD COLUMN IF NOT EXISTS magnesio DECIMAL(8,2);
