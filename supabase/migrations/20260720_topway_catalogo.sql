-- =============================================================
-- Catálogo TOPWAY (TW Nutrition) + suporte a múltiplos códigos
-- de barras por alimento.
--
-- Fontes: site oficial topwayfit.com.br + rótulos publicados por
-- varejistas (Empório Quatro Estrelas, Ultrafarma) e Open Food
-- Facts / Cosmos Bluesoft para os EANs. Pesquisa em 20/07/2026.
-- Valores por 100g (dose/scoop em porcoes_comuns).
--
-- Só entram produtos com tabela nutricional COMPLETA confirmada.
-- (Whey Isolado, Gold, Protein Life, Vegetal, pré-treinos: rótulo
-- publicado só como imagem — completar depois com foto do rótulo.)
--
-- Idempotente: INSERTs guardados por nome_busca; UPDATEs pontuais.
-- =============================================================

-- 1. Códigos de barras N:1 — um produto tem vários EAN/UPC (sabores,
--    pote vs sachê). A Topway usa UPC-12 '602883...' (leitores EAN-13
--    reportam '0602883...') e alguns EAN-13 '7898404...'.
CREATE TABLE IF NOT EXISTS fitness_food_barcodes (
  codigo_barras VARCHAR(20) PRIMARY KEY,
  food_id UUID NOT NULL REFERENCES fitness_global_foods(id) ON DELETE CASCADE,
  descricao VARCHAR(120),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_barcodes_food ON fitness_food_barcodes(food_id);

ALTER TABLE fitness_food_barcodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_barcodes_read_all" ON fitness_food_barcodes;
CREATE POLICY "food_barcodes_read_all"
  ON fitness_food_barcodes FOR SELECT
  TO authenticated
  USING (true);
-- Escrita apenas via service_role

-- =============================================================
-- 2. 100% WHEY — atualiza a entrada existente para o rótulo atual
--    (scoop 35g: 128 kcal / 21P / 8.9C / 0.9G / 79mg Na → por 100g)
-- =============================================================
UPDATE fitness_global_foods SET
  calorias = 365.71,
  proteinas = 60,
  carboidratos = 25.43,
  gorduras = 2.57,
  fibras = 0,
  sodio = 225.71,
  codigo_barras = '602883742987',
  nome_popular = '100% Whey Topway (concentrado)',
  nome_popular_busca = '100% whey topway (concentrado)',
  porcoes_comuns = jsonb_build_array(
    jsonb_build_object('label', '1 scoop (35g)', 'grams', 35, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (70g)', 'grams', 70),
    jsonb_build_object('label', '1 sachê (35g)', 'grams', 35)
  )
WHERE nome_busca = 'whey protein concentrado topway 100% whey';

-- =============================================================
-- 3. Produtos novos (tabela completa confirmada)
-- =============================================================

-- Whey Gold 3W — scoop 30g: 116 kcal / 21P / 4.1C / 1.7G (Na não publicado)
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  nome_popular, nome_popular_busca,
  porcoes_comuns, is_active
)
SELECT
  'Whey Protein Gold 3W — Topway',
  'whey protein gold 3w topway',
  'suplemento', 'manual',
  100, 'g',
  386.67, 70, 13.67, 5.67, 0, NULL,
  'Whey Gold 3W Topway', 'whey gold 3w topway',
  jsonb_build_array(
    jsonb_build_object('label', '1 scoop (30g)', 'grams', 30, 'isDefault', true),
    jsonb_build_object('label', '2 scoops (60g)', 'grams', 60)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'whey protein gold 3w topway'
);

-- Hipercalórico — dose 160g: 618 kcal / 12P / 138C; gordura derivada por
-- diferença calórica (618 - 600 kcal de P+C = ~2g/dose)
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  nome_popular, nome_popular_busca,
  porcoes_comuns, is_active
)
SELECT
  'Hipercalórico — Topway',
  'hipercalorico topway',
  'suplemento', 'manual',
  100, 'g',
  386.25, 7.5, 86.25, 1.25, 0, NULL,
  'Hipercalórico Topway', 'hipercalorico topway',
  jsonb_build_array(
    jsonb_build_object('label', 'meia dose (80g)', 'grams', 80),
    jsonb_build_object('label', '1 dose (160g)', 'grams', 160, 'isDefault', true)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'hipercalorico topway'
);

-- Creatina 100% Pura — dose 3g, sem valor calórico
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  nome_popular, nome_popular_busca,
  porcoes_comuns, is_active
)
SELECT
  'Creatina 100% Pura — Topway',
  'creatina 100% pura topway',
  'suplemento', 'manual',
  100, 'g',
  0, 0, 0, 0, 0, 0,
  'Creatina Topway', 'creatina topway',
  jsonb_build_array(
    jsonb_build_object('label', '1 dose (3g)', 'grams', 3, 'isDefault', true),
    jsonb_build_object('label', '2 doses (6g)', 'grams', 6)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'creatina 100% pura topway'
);

-- Glutamina — dose 5g, sem valor calórico
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  nome_popular, nome_popular_busca,
  porcoes_comuns, is_active
)
SELECT
  'Glutamina — Topway',
  'glutamina topway',
  'suplemento', 'manual',
  100, 'g',
  0, 0, 0, 0, 0, 0,
  'Glutamina Topway', 'glutamina topway',
  jsonb_build_array(
    jsonb_build_object('label', '1 dose (5g)', 'grams', 5, 'isDefault', true)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'glutamina topway'
);

-- Barra de Proteína 45g (linha atual) — 164 kcal / 14P / 20C / 5.4G / 15mg Na
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  nome_popular, nome_popular_busca,
  porcoes_comuns, is_active
)
SELECT
  'Barra de Proteína — Topway (45g)',
  'barra de proteina topway 45g',
  'suplemento', 'manual',
  100, 'g',
  364.44, 31.11, 44.44, 12, 0, 33.33,
  'Barra de proteína Topway', 'barra de proteina topway',
  jsonb_build_array(
    jsonb_build_object('label', '1 barra (45g)', 'grams', 45, 'isDefault', true)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'barra de proteina topway 45g'
);

-- Super Bar 45g (linha anterior de barras) — 189 kcal / 12P / 18C / 8G
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  nome_popular, nome_popular_busca,
  porcoes_comuns, is_active
)
SELECT
  'Super Bar — Topway (barra 45g)',
  'super bar topway barra 45g',
  'suplemento', 'manual',
  100, 'g',
  420, 26.67, 40, 17.78, 0, NULL,
  'Super Bar Topway', 'super bar topway',
  jsonb_build_array(
    jsonb_build_object('label', '1 barra (45g)', 'grams', 45, 'isDefault', true)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'super bar topway barra 45g'
);

-- Alfajor Proteico 40g — 148 kcal / 10P / 15C / 8G / 1.9 fibra / 41mg Na
INSERT INTO fitness_global_foods (
  nome, nome_busca, categoria, source,
  porcao_padrao, unidade,
  calorias, proteinas, carboidratos, gorduras, fibras, sodio,
  nome_popular, nome_popular_busca,
  porcoes_comuns, is_active
)
SELECT
  'Alfajor Proteico — Topway (40g)',
  'alfajor proteico topway 40g',
  'suplemento', 'manual',
  100, 'g',
  370, 25, 37.5, 20, 4.75, 102.5,
  'Alfajor proteico Topway', 'alfajor proteico topway',
  jsonb_build_array(
    jsonb_build_object('label', '1 unidade (40g)', 'grams', 40, 'isDefault', true)
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM fitness_global_foods WHERE nome_busca = 'alfajor proteico topway 40g'
);

-- =============================================================
-- 4. Vínculo dos códigos de barras conhecidos
-- =============================================================
INSERT INTO fitness_food_barcodes (codigo_barras, food_id, descricao)
SELECT v.codigo, f.id, v.descricao
FROM (VALUES
  ('602883742987',  'whey protein concentrado topway 100% whey', '100% Whey 900g Banoffee'),
  ('0602883742994', 'whey protein concentrado topway 100% whey', '100% Whey 900g (Torta de Limão)'),
  ('0602883743014', 'whey protein concentrado topway 100% whey', '100% Whey (Cookies)'),
  ('602883743069',  'whey protein concentrado topway 100% whey', '100% Whey sachê 35g Cookies'),
  ('602883743045',  'whey protein concentrado topway 100% whey', '100% Whey sachê 35g Torta de Maracujá'),
  ('602883743076',  'whey protein concentrado topway 100% whey', '100% Whey sachê 35g Coco c/ Baunilha'),
  ('0602883744356', 'super bar topway barra 45g',                'Super Bar 45g Leitinho'),
  ('7898404490410', 'alfajor proteico topway 40g',               'Alfajor Proteico 40g Avelã')
) AS v(codigo, nome_busca, descricao)
JOIN fitness_global_foods f ON f.nome_busca = v.nome_busca
ON CONFLICT (codigo_barras) DO NOTHING;
