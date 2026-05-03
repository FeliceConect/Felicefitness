-- ============================================================
-- MICRONUTRIENTES NA BASE DE ALIMENTOS
-- Data: 2026-05-03
-- ------------------------------------------------------------
-- Pedido pela nutricionista: ter ferro, colesterol, zinco, selênio
-- e magnésio disponíveis ao montar o cardápio. Sódio já existia.
--
-- Unidades padrão (por 100g/ml, mesma referência dos macros):
--   ferro      mg
--   colesterol mg
--   zinco      mg
--   selenio    µg (microgramas)  ← bem menor escala que os outros
--   magnesio   mg
--
-- Idempotente — pode rodar múltiplas vezes (IF NOT EXISTS).
-- Sem RLS extra: as policies existentes cobrem as colunas novas.
-- ============================================================

-- 1) Base global (TACO/TBCA/Open Food Facts)
ALTER TABLE fitness_global_foods
  ADD COLUMN IF NOT EXISTS ferro      DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS colesterol DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS zinco      DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS selenio    DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS magnesio   DECIMAL(8,2);

COMMENT ON COLUMN fitness_global_foods.ferro      IS 'Ferro em mg por 100g/ml';
COMMENT ON COLUMN fitness_global_foods.colesterol IS 'Colesterol em mg por 100g/ml';
COMMENT ON COLUMN fitness_global_foods.zinco      IS 'Zinco em mg por 100g/ml';
COMMENT ON COLUMN fitness_global_foods.selenio    IS 'Selênio em µg por 100g/ml';
COMMENT ON COLUMN fitness_global_foods.magnesio   IS 'Magnésio em mg por 100g/ml';

-- 2) Alimentos customizados do usuário (manuais)
ALTER TABLE fitness_foods
  ADD COLUMN IF NOT EXISTS ferro      DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS colesterol DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS zinco      DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS selenio    DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS magnesio   DECIMAL(8,2);

COMMENT ON COLUMN fitness_foods.ferro      IS 'Ferro em mg por 100g/ml';
COMMENT ON COLUMN fitness_foods.colesterol IS 'Colesterol em mg por 100g/ml';
COMMENT ON COLUMN fitness_foods.zinco      IS 'Zinco em mg por 100g/ml';
COMMENT ON COLUMN fitness_foods.selenio    IS 'Selênio em µg por 100g/ml';
COMMENT ON COLUMN fitness_foods.magnesio   IS 'Magnésio em mg por 100g/ml';

-- População dos dados: feita em script separado (TBCA tem todas as 6 colunas).
-- Migration de UPDATE virá depois com matching por source_id.
