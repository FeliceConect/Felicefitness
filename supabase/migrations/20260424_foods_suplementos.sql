-- Seed de suplementos e goma de tapioca na base global de alimentos.
--
-- Fonte dos valores: rótulos oficiais dos fabricantes e médias de mercado
-- coletadas em 2026-04 (Integralmédica, Dux Nutrition, Vitafor, Essential
-- Nutrition, Max Titanium, Topway) + TACO para goma de tapioca hidratada.
--
-- Valores sempre normalizados por 100g. A porção do scoop/dose de cada
-- produto fica em porcoes_comuns (isDefault=true) para a nutri prescrever
-- diretamente "1 scoop" no plano alimentar.
--
-- Idempotente: cada INSERT é guardado por WHERE NOT EXISTS em nome_busca.
-- source='manual' porque suplementos não existem em TACO/TBCA. O portal da
-- nutricionista usa sources=['taco','manual'] para exibi-los por padrão.

-- ============================================================================
-- GOMA DE TAPIOCA HIDRATADA (pronta)
-- ============================================================================
-- TACO: 68 kcal / 100g, 16.5g carbo, 0g prot/fat/fibra/sódio

INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Goma de tapioca hidratada', 'goma de tapioca hidratada', 'carboidrato', 'manual',
  100, 'g',
  68, 0, 16.5, 0, 0, 0,
  jsonb_build_array(
    jsonb_build_object('label', '1 tapioca pequena (50g)', 'grams', 50, 'isDefault', true),
    jsonb_build_object('label', '1 tapioca média (80g)', 'grams', 80),
    jsonb_build_object('label', '1 tapioca grande (120g)', 'grams', 120)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'goma de tapioca hidratada'
);

-- ============================================================================
-- WHEY PROTEIN CONCENTRADO (6 marcas — uma entrada por marca)
-- ============================================================================

-- Whey 100% Pure — Integralmédica
-- Rótulo: scoop 30g → 120 kcal, 24g prot, 2g carbo, 1.5g fat, 80mg sódio
-- Por 100g: 400 / 80 / 6.67 / 5 / 267mg
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Whey Protein Concentrado — Integralmédica (100% Pure)',
  'whey protein concentrado integralmedica 100% pure',
  'suplemento', 'manual',
  100, 'g',
  400, 80, 6.67, 5, 0, 267,
  jsonb_build_array(
    jsonb_build_object('label', '1 scoop (30g)', 'grams', 30, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (60g)', 'grams', 60)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'whey protein concentrado integralmedica 100% pure'
);

-- Whey Protein Concentrado — Dux Nutrition
-- Rótulo: scoop 30g → 20g prot, 3g carbo, 1.5g fat, 110mg sódio, ~120 kcal
-- Por 100g: 400 / 66.67 / 10 / 5 / 367mg
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Whey Protein Concentrado — Dux Nutrition',
  'whey protein concentrado dux nutrition',
  'suplemento', 'manual',
  100, 'g',
  400, 66.67, 10, 5, 0, 367,
  jsonb_build_array(
    jsonb_build_object('label', '1 scoop (30g)', 'grams', 30, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (60g)', 'grams', 60)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'whey protein concentrado dux nutrition'
);

-- Whey Fort 3W — Vitafor (concentrado + isolado + hidrolisado)
-- Rótulo: scoop 31g → 24g prot, ~1.5g carbo, ~1.5g fat, ~90mg sódio, ~125 kcal
-- Por 100g: 403 / 77.42 / 4.84 / 4.84 / 290mg
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Whey Protein — Vitafor (Whey Fort 3W)',
  'whey protein vitafor whey fort 3w',
  'suplemento', 'manual',
  100, 'g',
  403, 77.42, 4.84, 4.84, 0, 290,
  jsonb_build_array(
    jsonb_build_object('label', '1 scoop (31g)', 'grams', 31, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (62g)', 'grams', 62)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'whey protein vitafor whey fort 3w'
);

-- Cacao Whey — Essential Nutrition (hidrolisado + isolado + colágeno)
-- Rótulo: scoop 28g → 104 kcal, 22g prot, 1.9g carbo, 0.9g fat, 89mg sódio
-- Por 100g: 371.43 / 78.57 / 6.79 / 3.21 / 317.86mg
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Cacao Whey — Essential Nutrition',
  'cacao whey essential nutrition',
  'suplemento', 'manual',
  100, 'g',
  371.43, 78.57, 6.79, 3.21, 0, 317.86,
  jsonb_build_array(
    jsonb_build_object('label', '1 scoop (28g)', 'grams', 28, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (56g)', 'grams', 56)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'cacao whey essential nutrition'
);

-- 100% Whey — Max Titanium (concentrado)
-- Rótulo: scoop 30g → 122 kcal, 21g prot, 1g carbo, 1g fat, 50mg sódio
-- Por 100g: 406.67 / 70 / 3.33 / 3.33 / 166.67mg
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Whey Protein Concentrado — Max Titanium (100% Whey)',
  'whey protein concentrado max titanium 100% whey',
  'suplemento', 'manual',
  100, 'g',
  406.67, 70, 3.33, 3.33, 0, 166.67,
  jsonb_build_array(
    jsonb_build_object('label', '1 scoop (30g)', 'grams', 30, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (60g)', 'grams', 60)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'whey protein concentrado max titanium 100% whey'
);

-- 100% Whey — Topway
-- Rótulo: scoop 35g → 21g prot, ~3g carbo, ~1.5g fat, ~60mg sódio, ~140 kcal
-- Por 100g: 400 / 60 / 8.57 / 4.29 / 171.43mg
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Whey Protein Concentrado — Topway (100% Whey)',
  'whey protein concentrado topway 100% whey',
  'suplemento', 'manual',
  100, 'g',
  400, 60, 8.57, 4.29, 0, 171.43,
  jsonb_build_array(
    jsonb_build_object('label', '1 scoop (35g)', 'grams', 35, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (70g)', 'grams', 70)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'whey protein concentrado topway 100% whey'
);

-- ============================================================================
-- SUPLEMENTOS GENÉRICOS (valores médios de mercado — rótulo brasileiro)
-- ============================================================================

-- Creatina Monohidratada (genérica)
-- Rótulo: porção 3g → 0 kcal, 0 prot, 0 carbo, 0 fat (padrão BR)
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Creatina Monohidratada',
  'creatina monohidratada',
  'suplemento', 'manual',
  100, 'g',
  0, 0, 0, 0, 0, 0,
  jsonb_build_array(
    jsonb_build_object('label', '1 dose (3g)', 'grams', 3, 'isDefault', true),
    jsonb_build_object('label', '1 dose (5g)', 'grams', 5)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'creatina monohidratada'
);

-- BCAA em pó (genérico, proporção 10:1:1 ou similar)
-- Rótulo médio: porção 5g → 16 kcal, 3.9g prot, 0g carbo, 0g fat
-- Por 100g: 320 / 78 / 0 / 0
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'BCAA em pó',
  'bcaa em po',
  'suplemento', 'manual',
  100, 'g',
  320, 78, 0, 0, 0, 0,
  jsonb_build_array(
    jsonb_build_object('label', '1 dose (5g)', 'grams', 5, 'isDefault', true),
    jsonb_build_object('label', '1 dose (7g)', 'grams', 7)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'bcaa em po'
);

-- Glutamina em pó (genérica)
-- Rótulo: porção 5g → 20 kcal, 0g prot (rótulo BR — aminoácido isolado), 0 carbo, 0 fat
-- Por 100g: 400 / 0 / 0 / 0
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Glutamina em pó',
  'glutamina em po',
  'suplemento', 'manual',
  100, 'g',
  400, 0, 0, 0, 0, 0,
  jsonb_build_array(
    jsonb_build_object('label', '1 dose (5g)', 'grams', 5, 'isDefault', true),
    jsonb_build_object('label', '2 doses (10g)', 'grams', 10)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'glutamina em po'
);

-- Albumina em pó (clara do ovo desidratada)
-- TACO/rótulo: 100g → ~348 kcal, 82.4g prot, 4.5g carbo, 0g fat
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Albumina em pó',
  'albumina em po',
  'suplemento', 'manual',
  100, 'g',
  348, 82.4, 4.5, 0, 0, 0,
  jsonb_build_array(
    jsonb_build_object('label', '1 dose (10g)', 'grams', 10, 'isDefault', true),
    jsonb_build_object('label', '1 scoop (28g)', 'grams', 28),
    jsonb_build_object('label', '2 scoops (56g)', 'grams', 56)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'albumina em po'
);

-- Caseína em pó (proteína lenta)
-- Rótulo médio: scoop 30g → ~114 kcal, 24g prot, 3g carbo, 1g fat
-- Por 100g: 380 / 80 / 10 / 3.33
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Caseína em pó',
  'caseina em po',
  'suplemento', 'manual',
  100, 'g',
  380, 80, 10, 3.33, 0, 200,
  jsonb_build_array(
    jsonb_build_object('label', '1 scoop (30g)', 'grams', 30, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (60g)', 'grams', 60)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'caseina em po'
);

-- Hipercalórico / Mass Gainer (genérico)
-- Rótulo médio de mercado: 100g → 380 kcal, 25g prot, 60g carbo, 3g fat, 150mg sódio
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  porcoes_comuns, is_active
)
SELECT
  'Hipercalórico (Mass Gainer)',
  'hipercalorico mass gainer',
  'suplemento', 'manual',
  100, 'g',
  380, 25, 60, 3, 0, 150,
  jsonb_build_array(
    jsonb_build_object('label', '1 dose (70g)', 'grams', 70, 'isDefault', true),
    jsonb_build_object('label', '2 doses (140g)', 'grams', 140)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'hipercalorico mass gainer'
);
