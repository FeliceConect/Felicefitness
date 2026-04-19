-- Porções caseiras comuns (JSONB) para os alimentos TACO.
-- Escopo: apenas source='taco' (alimentos base). TBCA são preparações com receita
-- variável e continuam em 100g. Idempotente: cada UPDATE filtra por
-- porcoes_comuns IS NULL para não sobrescrever customizações.
--
-- Formato:
--   [{"label": "1 unidade (50g)", "grams": 50, "isDefault": true},
--    {"label": "2 unidades (100g)", "grams": 100}]
--
-- Referências: Dicionário de Medidas Caseiras (Pinheiro et al.), TACO UNICAMP,
-- tabela de porções do Guia Alimentar para a População Brasileira.

-- ============================================================================
-- OVOS
-- ============================================================================

-- Ovo de galinha inteiro (cru, cozido, frito, pochê)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade média (50g)', 'grams', 50, 'isDefault', true),
  jsonb_build_object('label', '2 unidades (100g)', 'grams', 100),
  jsonb_build_object('label', '3 unidades (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'ovo, de galinha, inteiro%';

-- Gema de ovo de galinha
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 gema (17g)', 'grams', 17, 'isDefault', true),
  jsonb_build_object('label', '2 gemas (34g)', 'grams', 34),
  jsonb_build_object('label', '3 gemas (51g)', 'grams', 51)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'ovo, de galinha, gema%';

-- Clara de ovo de galinha
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 clara (33g)', 'grams', 33, 'isDefault', true),
  jsonb_build_object('label', '2 claras (66g)', 'grams', 66),
  jsonb_build_object('label', '3 claras (99g)', 'grams', 99)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'ovo, de galinha, clara%';

-- Ovo de codorna
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (10g)', 'grams', 10),
  jsonb_build_object('label', '3 unidades (30g)', 'grams', 30, 'isDefault', true),
  jsonb_build_object('label', '6 unidades (60g)', 'grams', 60)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'ovo, de codorna%';

-- ============================================================================
-- PÃES
-- ============================================================================

-- Pão francês (TACO tem "Pão, trigo, francês" e "Torrada, pão francês")
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '½ unidade (25g)', 'grams', 25),
  jsonb_build_object('label', '1 unidade (50g)', 'grams', 50, 'isDefault', true),
  jsonb_build_object('label', '2 unidades (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE '%pao, trigo, frances%' OR nome_busca LIKE '%torrada, pao frances%');

-- Pão de forma (branco/integral)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia (25g)', 'grams', 25, 'isDefault', true),
  jsonb_build_object('label', '2 fatias (50g)', 'grams', 50),
  jsonb_build_object('label', '3 fatias (75g)', 'grams', 75)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE '%pao, forma%' OR nome_busca LIKE '%pao, de forma%' OR nome_busca LIKE '%pao, integral%');

-- Pão de queijo
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (20g)', 'grams', 20),
  jsonb_build_object('label', '1 unidade média (40g)', 'grams', 40, 'isDefault', true),
  jsonb_build_object('label', '3 unidades (120g)', 'grams', 120)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE '%pao, de queijo%';

-- Pão de mel / pão doce / pão sírio / demais pães
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (50g)', 'grams', 50, 'isDefault', true),
  jsonb_build_object('label', '2 unidades (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'pao,%';

-- ============================================================================
-- BISCOITOS / BOLACHAS
-- ============================================================================

-- Biscoitos cream cracker / água e sal
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '3 unidades (24g)', 'grams', 24),
  jsonb_build_object('label', '6 unidades (48g)', 'grams', 48, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE '%cream cracker%' OR nome_busca LIKE '%agua e sal%');

-- Demais biscoitos/bolachas (recheado, maisena, etc.)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (10g)', 'grams', 10),
  jsonb_build_object('label', '3 unidades (30g)', 'grams', 30, 'isDefault', true),
  jsonb_build_object('label', '1 pacote (120g)', 'grams', 120)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'biscoito%' OR nome_busca LIKE 'bolacha%');

-- ============================================================================
-- FRUTAS FRESCAS
-- ============================================================================

-- Banana (prata / nanica / maçã / da terra — toda banana)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (70g)', 'grams', 70),
  jsonb_build_object('label', '1 unidade média (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 unidade grande (140g)', 'grams', 140)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'banana%';

-- Maçã
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 unidade média (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 unidade grande (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'maca,%' OR nome_busca = 'maca');

-- Mamão formosa
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 fatia média (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 fatia grande (250g)', 'grams', 250)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'mamao, formosa%';

-- Mamão papaia
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '½ unidade (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 unidade (300g)', 'grams', 300)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'mamao, papaia%';

-- Laranja
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 unidade média (130g)', 'grams', 130, 'isDefault', true),
  jsonb_build_object('label', '1 unidade grande (180g)', 'grams', 180)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'laranja%';

-- Pera
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 unidade média (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 unidade grande (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'pera%';

-- Pêssego / nectarina
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (80g)', 'grams', 80),
  jsonb_build_object('label', '1 unidade média (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '2 unidades (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'pessego%' OR nome_busca LIKE 'nectarina%');

-- Uva
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '10 unidades (50g)', 'grams', 50),
  jsonb_build_object('label', '1 cacho pequeno (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 cacho médio (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'uva%';

-- Morango
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '5 unidades (50g)', 'grams', 50),
  jsonb_build_object('label', '1 xícara (150g)', 'grams', 150, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'morango%';

-- Abacaxi
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia fina (50g)', 'grams', 50),
  jsonb_build_object('label', '1 fatia média (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 fatia grande (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'abacaxi%';

-- Manga
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '½ unidade média (100g)', 'grams', 100),
  jsonb_build_object('label', '1 unidade média (200g)', 'grams', 200, 'isDefault', true),
  jsonb_build_object('label', '1 unidade grande (300g)', 'grams', 300)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'manga%';

-- Melancia
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 fatia média (200g)', 'grams', 200, 'isDefault', true),
  jsonb_build_object('label', '1 fatia grande (300g)', 'grams', 300)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'melancia%';

-- Melão
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 fatia média (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 fatia grande (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'melao%';

-- Kiwi
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '2 unidades (160g)', 'grams', 160)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'kiwi%';

-- Abacate
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '½ unidade (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 unidade (200g)', 'grams', 200),
  jsonb_build_object('label', '1 colher de sopa (30g)', 'grams', 30)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'abacate%';

-- Goiaba
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 unidade média (170g)', 'grams', 170, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'goiaba%';

-- Ameixa (fresca)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (30g)', 'grams', 30),
  jsonb_build_object('label', '1 unidade média (65g)', 'grams', 65, 'isDefault', true),
  jsonb_build_object('label', '3 unidades (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'ameixa%';

-- Caqui
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 unidade média (140g)', 'grams', 140, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'caqui%';

-- Figo
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (40g)', 'grams', 40),
  jsonb_build_object('label', '3 unidades (120g)', 'grams', 120, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'figo%';

-- Limão / lima
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (60g)', 'grams', 60),
  jsonb_build_object('label', '1 unidade média (100g)', 'grams', 100, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'limao%' OR nome_busca LIKE 'lima,%');

-- Tangerina / mexerica / bergamota
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (80g)', 'grams', 80),
  jsonb_build_object('label', '1 unidade média (130g)', 'grams', 130, 'isDefault', true),
  jsonb_build_object('label', '1 unidade grande (180g)', 'grams', 180)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'tangerina%' OR nome_busca LIKE 'mexerica%' OR nome_busca LIKE 'bergamota%');

-- Maracujá
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (90g)', 'grams', 90, 'isDefault', true),
  jsonb_build_object('label', '1 colher de sopa polpa (30g)', 'grams', 30)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'maracuja%';

-- Acerola
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (5g)', 'grams', 5),
  jsonb_build_object('label', '10 unidades (50g)', 'grams', 50, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'acerola%';

-- Coco fresco
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15),
  jsonb_build_object('label', '1 pedaço médio (30g)', 'grams', 30, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'coco%';

-- ============================================================================
-- FRUTAS SECAS
-- ============================================================================

-- Uva passa
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (10g)', 'grams', 10, 'isDefault', true),
  jsonb_build_object('label', '2 colheres de sopa (20g)', 'grams', 20)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'uva-passa%';

-- Damasco seco / ameixa seca / outros secos
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (10g)', 'grams', 10),
  jsonb_build_object('label', '3 unidades (30g)', 'grams', 30, 'isDefault', true),
  jsonb_build_object('label', '5 unidades (50g)', 'grams', 50)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'damasco, seco%' OR nome_busca LIKE 'ameixa, seca%');

-- ============================================================================
-- CASTANHAS / NOZES / SEMENTES
-- ============================================================================

-- Castanha do Pará / Brasil
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (5g)', 'grams', 5),
  jsonb_build_object('label', '3 unidades (15g)', 'grams', 15, 'isDefault', true),
  jsonb_build_object('label', '6 unidades (30g)', 'grams', 30)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'castanha-do-para%' OR nome_busca LIKE 'castanha do para%' OR nome_busca LIKE 'castanha, do para%' OR nome_busca LIKE 'castanha, do brasil%');

-- Castanha de caju
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (2g)', 'grams', 2),
  jsonb_build_object('label', '10 unidades (20g)', 'grams', 20, 'isDefault', true),
  jsonb_build_object('label', '1 punhado (30g)', 'grams', 30)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'castanha-de-caju%' OR nome_busca LIKE 'castanha de caju%' OR nome_busca LIKE 'castanha, de caju%');

-- Amêndoa
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '10 unidades (12g)', 'grams', 12),
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15, 'isDefault', true),
  jsonb_build_object('label', '1 punhado (30g)', 'grams', 30)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'amendoa%';

-- Nozes
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (4g)', 'grams', 4),
  jsonb_build_object('label', '3 unidades (12g)', 'grams', 12, 'isDefault', true),
  jsonb_build_object('label', '1 punhado (30g)', 'grams', 30)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'nozes%';

-- Amendoim
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (10g)', 'grams', 10),
  jsonb_build_object('label', '1 porção (30g)', 'grams', 30, 'isDefault', true),
  jsonb_build_object('label', '1 pacote (50g)', 'grams', 50)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'amendoim%';

-- Avelã
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '10 unidades (15g)', 'grams', 15),
  jsonb_build_object('label', '1 punhado (30g)', 'grams', 30, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'avela%';

-- Pistache
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '10 unidades (10g)', 'grams', 10),
  jsonb_build_object('label', '1 punhado (30g)', 'grams', 30, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'pistache%';

-- Sementes (chia, linhaça, gergelim, girassol, abóbora)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de chá (5g)', 'grams', 5),
  jsonb_build_object('label', '1 colher de sopa (12g)', 'grams', 12, 'isDefault', true),
  jsonb_build_object('label', '2 colheres de sopa (24g)', 'grams', 24)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'chia%' OR nome_busca LIKE 'linhaca%' OR nome_busca LIKE 'gergelim%'
       OR nome_busca LIKE 'semente, girassol%' OR nome_busca LIKE 'semente, abobora%'
       OR nome_busca LIKE 'sementes%');

-- ============================================================================
-- LEITES LÍQUIDOS
-- ============================================================================

UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '½ copo (100ml)', 'grams', 100),
  jsonb_build_object('label', '1 copo americano (200ml)', 'grams', 200, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (240ml)', 'grams', 240),
  jsonb_build_object('label', '1 caixa (1L)', 'grams', 1000)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'leite, de vaca%' OR nome_busca LIKE 'leite, integral%'
       OR nome_busca LIKE 'leite, desnatado%' OR nome_busca LIKE 'leite, semidesnatado%'
       OR nome_busca LIKE 'leite, de soja%' OR nome_busca LIKE 'leite, de cabra%'
       OR nome_busca LIKE 'leite, de coco%');

-- ============================================================================
-- IOGURTES
-- ============================================================================

UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (30g)', 'grams', 30),
  jsonb_build_object('label', '1 pote pequeno (100g)', 'grams', 100),
  jsonb_build_object('label', '1 pote (170g)', 'grams', 170, 'isDefault', true),
  jsonb_build_object('label', '1 copo (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'iogurte%';

-- Coalhada
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 pote (170g)', 'grams', 170, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'coalhada%';

-- ============================================================================
-- QUEIJOS
-- ============================================================================

-- Queijo prato / mussarela / mineiro
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia (20g)', 'grams', 20, 'isDefault', true),
  jsonb_build_object('label', '2 fatias (40g)', 'grams', 40),
  jsonb_build_object('label', '3 fatias (60g)', 'grams', 60)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'queijo, prato%' OR nome_busca LIKE 'queijo, mussarela%'
       OR nome_busca LIKE 'queijo, mucarela%' OR nome_busca LIKE 'queijo, mineiro%'
       OR nome_busca LIKE 'queijo, provolone%');

-- Queijo minas / minas frescal
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia fina (30g)', 'grams', 30, 'isDefault', true),
  jsonb_build_object('label', '1 fatia grossa (60g)', 'grams', 60)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'queijo, minas%' OR nome_busca LIKE 'queijo minas%');

-- Ricota
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (30g)', 'grams', 30),
  jsonb_build_object('label', '1 fatia (50g)', 'grams', 50, 'isDefault', true),
  jsonb_build_object('label', '2 fatias (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'ricota%';

-- Queijo cottage / cream cheese / requeijão
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de chá (5g)', 'grams', 5),
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15, 'isDefault', true),
  jsonb_build_object('label', '2 colheres de sopa (30g)', 'grams', 30)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'queijo, cottage%' OR nome_busca LIKE 'cream cheese%'
       OR nome_busca LIKE 'requeijao%');

-- Parmesão ralado
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (5g)', 'grams', 5, 'isDefault', true),
  jsonb_build_object('label', '2 colheres de sopa (10g)', 'grams', 10),
  jsonb_build_object('label', '1 fatia (20g)', 'grams', 20)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'queijo, parmesao%';

-- ============================================================================
-- CARNES BOVINAS
-- ============================================================================

-- Carne moída (bovina, suína, frango) — restringido a nome_busca com "carne"
-- para evitar falsos positivos como "pimenta do reino, preta, moida",
-- "paprica, moida", "canela, moida", que devem ficar fora deste bloco.
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15),
  jsonb_build_object('label', '1 colher de servir (45g)', 'grams', 45),
  jsonb_build_object('label', '1 porção (100g)', 'grams', 100, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE '%moida%'
  AND (nome_busca LIKE 'carne,%' OR nome_busca LIKE 'carne %');

-- Fígado bovino
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 bife pequeno (80g)', 'grams', 80),
  jsonb_build_object('label', '1 bife médio (120g)', 'grams', 120, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE '%figado%';

-- Bifes / filés bovinos (alcatra, patinho, contrafilé, coxão, maminha, fraldinha, músculo, acém)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 bife pequeno (80g)', 'grams', 80),
  jsonb_build_object('label', '1 bife médio (120g)', 'grams', 120, 'isDefault', true),
  jsonb_build_object('label', '1 bife grande (180g)', 'grams', 180)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'carne, bovina%' OR nome_busca LIKE 'alcatra%'
       OR nome_busca LIKE 'patinho%' OR nome_busca LIKE 'contrafile%'
       OR nome_busca LIKE 'coxao%' OR nome_busca LIKE 'maminha%'
       OR nome_busca LIKE 'fraldinha%' OR nome_busca LIKE 'musculo%'
       OR nome_busca LIKE 'acem%' OR nome_busca LIKE 'lagarto%'
       OR nome_busca LIKE 'file mignon%' OR nome_busca LIKE 'file-mignon%'
       OR nome_busca LIKE 'picanha%' OR nome_busca LIKE 'paleta%'
       OR nome_busca LIKE 'cupim%');

-- Costela bovina
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 pedaço pequeno (100g)', 'grams', 100),
  jsonb_build_object('label', '1 pedaço médio (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 pedaço grande (250g)', 'grams', 250)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'costela%';

-- ============================================================================
-- FRANGO / AVES
-- ============================================================================

-- Peito de frango
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 filé pequeno (100g)', 'grams', 100),
  jsonb_build_object('label', '1 filé médio (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 filé grande (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE '%peito%' AND (nome_busca LIKE '%frango%' OR nome_busca LIKE '%galinha%');

-- Coxa / sobrecoxa de frango
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (80g)', 'grams', 80),
  jsonb_build_object('label', '1 unidade média (120g)', 'grams', 120, 'isDefault', true),
  jsonb_build_object('label', 'Coxa + sobrecoxa (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE '%coxa%' OR nome_busca LIKE '%sobrecoxa%')
  AND (nome_busca LIKE '%frango%' OR nome_busca LIKE '%galinha%');

-- Asa de frango
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (40g)', 'grams', 40),
  jsonb_build_object('label', '3 unidades (120g)', 'grams', 120, 'isDefault', true),
  jsonb_build_object('label', '5 unidades (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE '%asa%' AND (nome_busca LIKE '%frango%' OR nome_busca LIKE '%galinha%');

-- Demais partes de frango/galinha (fallback)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 porção pequena (100g)', 'grams', 100),
  jsonb_build_object('label', '1 porção média (150g)', 'grams', 150, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'frango%' OR nome_busca LIKE 'galinha%');

-- Peru
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 filé médio (120g)', 'grams', 120, 'isDefault', true),
  jsonb_build_object('label', '1 porção grande (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'peru%';

-- ============================================================================
-- CARNES SUÍNAS
-- ============================================================================

-- Bisteca / lombo / pernil suíno
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 bisteca pequena (80g)', 'grams', 80),
  jsonb_build_object('label', '1 bisteca média (120g)', 'grams', 120, 'isDefault', true),
  jsonb_build_object('label', '1 fatia grande (180g)', 'grams', 180)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'carne, suina%' OR nome_busca LIKE 'bisteca%'
       OR nome_busca LIKE 'lombo%' OR nome_busca LIKE 'pernil%');

-- Bacon
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia (10g)', 'grams', 10),
  jsonb_build_object('label', '2 fatias (20g)', 'grams', 20, 'isDefault', true),
  jsonb_build_object('label', '4 fatias (40g)', 'grams', 40)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'bacon%';

-- Linguiça (toscana, calabresa, defumada)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 gomo (40g)', 'grams', 40),
  jsonb_build_object('label', '2 gomos (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '1 porção (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'linguica%';

-- ============================================================================
-- PEIXES
-- ============================================================================

-- Salmão / atum / tilápia / pescada / merluza / linguado / cação / namorado / robalo
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 filé pequeno (100g)', 'grams', 100),
  jsonb_build_object('label', '1 filé médio (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 filé grande (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'salmao%' OR nome_busca LIKE 'atum%' OR nome_busca LIKE 'tilapia%'
       OR nome_busca LIKE 'pescada%' OR nome_busca LIKE 'merluza%' OR nome_busca LIKE 'linguado%'
       OR nome_busca LIKE 'cacao%' OR nome_busca LIKE 'namorado%' OR nome_busca LIKE 'robalo%'
       OR nome_busca LIKE 'badejo%' OR nome_busca LIKE 'anchova%' OR nome_busca LIKE 'corvina%'
       OR nome_busca LIKE 'pintado%' OR nome_busca LIKE 'pacu%' OR nome_busca LIKE 'tambaqui%'
       OR nome_busca LIKE 'traira%' OR nome_busca LIKE 'garoupa%' OR nome_busca LIKE 'peixe,%');

-- Sardinha
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (25g)', 'grams', 25),
  jsonb_build_object('label', '1 lata (125g)', 'grams', 125, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'sardinha%';

-- Bacalhau
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 porção (100g)', 'grams', 100),
  jsonb_build_object('label', '1 filé médio (150g)', 'grams', 150, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'bacalhau%';

-- Camarão
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '5 unidades (50g)', 'grams', 50),
  jsonb_build_object('label', '10 unidades (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 porção (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'camarao%';

-- Lula / polvo
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 porção (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 porção grande (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'lula%' OR nome_busca LIKE 'polvo%');

-- ============================================================================
-- CEREAIS COZIDOS
-- ============================================================================

-- Arroz cozido (branco / integral / parboilizado)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15),
  jsonb_build_object('label', '1 colher de servir (45g)', 'grams', 45),
  jsonb_build_object('label', '2 colheres de servir (90g)', 'grams', 90, 'isDefault', true),
  jsonb_build_object('label', '1 escumadeira (90g)', 'grams', 90),
  jsonb_build_object('label', '1 prato raso (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'arroz,%' AND nome_busca LIKE '%cozid%';

-- Arroz cru (grão) — para receitas
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (10g)', 'grams', 10),
  jsonb_build_object('label', '½ xícara (90g)', 'grams', 90, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (180g)', 'grams', 180)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'arroz,%' AND (nome_busca LIKE '%cru%' OR nome_busca LIKE '%polido%' OR nome_busca LIKE '%tipo 1%');

-- Quinoa cozida
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15),
  jsonb_build_object('label', '1 colher de servir (45g)', 'grams', 45, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (160g)', 'grams', 160)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'quinoa%';

-- Cuscuz
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 pedaço pequeno (60g)', 'grams', 60),
  jsonb_build_object('label', '1 pedaço médio (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 pedaço grande (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'cuscuz%';

-- ============================================================================
-- LEGUMINOSAS COZIDAS
-- ============================================================================

-- Feijão cozido (todos os tipos)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 concha pequena (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '1 concha média (140g)', 'grams', 140),
  jsonb_build_object('label', '2 conchas (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'feijao,%' AND nome_busca LIKE '%cozid%';

-- Lentilha cozida
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir (60g)', 'grams', 60, 'isDefault', true),
  jsonb_build_object('label', '1 concha (120g)', 'grams', 120)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'lentilha%';

-- Grão-de-bico
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir (60g)', 'grams', 60, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (160g)', 'grams', 160)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'grao-de-bico%' OR nome_busca LIKE 'grao de bico%');

-- Ervilha
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir (60g)', 'grams', 60, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'ervilha%';

-- Soja
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15),
  jsonb_build_object('label', '1 colher de servir (45g)', 'grams', 45, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'soja%';

-- ============================================================================
-- MASSAS
-- ============================================================================

UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 pegador pequeno (80g)', 'grams', 80),
  jsonb_build_object('label', '1 prato raso (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 prato fundo (250g)', 'grams', 250)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'macarrao%' OR nome_busca LIKE 'espaguete%' OR nome_busca LIKE 'talharim%'
       OR nome_busca LIKE 'lasanha%' OR nome_busca LIKE 'nhoque%');

-- ============================================================================
-- FARINHAS E PÓS
-- ============================================================================

UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de chá (5g)', 'grams', 5),
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15, 'isDefault', true),
  jsonb_build_object('label', '½ xícara (60g)', 'grams', 60),
  jsonb_build_object('label', '1 xícara (120g)', 'grams', 120)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'farinha%';

-- ============================================================================
-- AVEIA / GRANOLA / CEREAIS
-- ============================================================================

UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15),
  jsonb_build_object('label', '2 colheres de sopa (30g)', 'grams', 30, 'isDefault', true),
  jsonb_build_object('label', '3 colheres de sopa (45g)', 'grams', 45),
  jsonb_build_object('label', '½ xícara (45g)', 'grams', 45)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'aveia%' OR nome_busca LIKE 'granola%' OR nome_busca LIKE 'musli%'
       OR nome_busca LIKE 'cereal%');

-- ============================================================================
-- TUBÉRCULOS COZIDOS
-- ============================================================================

-- Batata inglesa (cozida / assada / purê)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (80g)', 'grams', 80),
  jsonb_build_object('label', '1 unidade média (150g)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 unidade grande (200g)', 'grams', 200),
  jsonb_build_object('label', '1 colher de servir (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'batata, inglesa%';

-- Batata frita
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', 'Porção pequena (80g)', 'grams', 80),
  jsonb_build_object('label', 'Porção média (120g)', 'grams', 120, 'isDefault', true),
  jsonb_build_object('label', 'Porção grande (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE '%batata%frita%';

-- Batata doce
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade pequena (80g)', 'grams', 80),
  jsonb_build_object('label', '1 unidade média (130g)', 'grams', 130, 'isDefault', true),
  jsonb_build_object('label', '1 unidade grande (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'batata, doce%';

-- Mandioca / aipim / macaxeira
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 pedaço pequeno (80g)', 'grams', 80),
  jsonb_build_object('label', '1 pedaço médio (120g)', 'grams', 120, 'isDefault', true),
  jsonb_build_object('label', '1 pedaço grande (180g)', 'grams', 180)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'mandioca%' OR nome_busca LIKE 'aipim%' OR nome_busca LIKE 'macaxeira%');

-- Inhame / cará
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 pedaço pequeno (80g)', 'grams', 80),
  jsonb_build_object('label', '1 pedaço médio (120g)', 'grams', 120, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'inhame%' OR nome_busca LIKE 'cara,%');

-- Cenoura
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa ralada (15g)', 'grams', 15),
  jsonb_build_object('label', '1 unidade pequena (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '1 unidade média (120g)', 'grams', 120),
  jsonb_build_object('label', '½ xícara ralada (60g)', 'grams', 60)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'cenoura%';

-- Beterraba
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 unidade pequena (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '½ xícara ralada (60g)', 'grams', 60)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'beterraba%';

-- Abóbora
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'abobora%' OR nome_busca LIKE 'moranga%' OR nome_busca LIKE 'jerimum%');

-- ============================================================================
-- VERDURAS FOLHOSAS
-- ============================================================================

-- Alface / rúcula / agrião (folhas cruas)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '3 folhas (15g)', 'grams', 15),
  jsonb_build_object('label', '1 prato pequeno (30g)', 'grams', 30, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (50g)', 'grams', 50),
  jsonb_build_object('label', '1 prato de sobremesa (80g)', 'grams', 80)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'alface%' OR nome_busca LIKE 'rucula%' OR nome_busca LIKE 'agriao%'
       OR nome_busca LIKE 'escarola%' OR nome_busca LIKE 'chicoria%');

-- Espinafre / couve / almeirão (folhas — cruas ou refogadas)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15),
  jsonb_build_object('label', '1 colher de servir (40g)', 'grams', 40, 'isDefault', true),
  jsonb_build_object('label', '1 prato pequeno (60g)', 'grams', 60)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'espinafre%' OR nome_busca LIKE 'couve,%' OR nome_busca LIKE 'almeirao%'
       OR nome_busca LIKE 'repolho%' OR nome_busca LIKE 'mostarda,%' OR nome_busca LIKE 'taioba%');

-- ============================================================================
-- LEGUMES
-- ============================================================================

-- Tomate
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia (20g)', 'grams', 20),
  jsonb_build_object('label', '1 unidade pequena (70g)', 'grams', 70),
  jsonb_build_object('label', '1 unidade média (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 xícara picado (180g)', 'grams', 180)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'tomate%';

-- Pepino
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '4 fatias (40g)', 'grams', 40),
  jsonb_build_object('label', '1 unidade pequena (100g)', 'grams', 100, 'isDefault', true),
  jsonb_build_object('label', '1 unidade média (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'pepino%';

-- Abobrinha
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir refogada (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '1 unidade média (180g)', 'grams', 180)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'abobrinha%';

-- Berinjela
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '1 unidade média (200g)', 'grams', 200)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'berinjela%';

-- Brócolis / couve-flor
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 ramo (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de sopa (30g)', 'grams', 30),
  jsonb_build_object('label', '1 colher de servir (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'brocolis%' OR nome_busca LIKE 'couve-flor%' OR nome_busca LIKE 'couve flor%');

-- Pimentão
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia (10g)', 'grams', 10),
  jsonb_build_object('label', '½ unidade (75g)', 'grams', 75, 'isDefault', true),
  jsonb_build_object('label', '1 unidade média (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'pimentao%';

-- Cebola
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa picada (15g)', 'grams', 15),
  jsonb_build_object('label', '1 unidade pequena (50g)', 'grams', 50, 'isDefault', true),
  jsonb_build_object('label', '1 unidade média (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'cebola%';

-- Alho
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 dente (3g)', 'grams', 3, 'isDefault', true),
  jsonb_build_object('label', '1 colher de chá (5g)', 'grams', 5),
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'alho%';

-- Milho verde
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 espiga (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '1 xícara (150g)', 'grams', 150)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'milho%verde%';

-- Palmito
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 tolete (40g)', 'grams', 40, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'palmito%';

-- Vagem
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir (60g)', 'grams', 60, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'vagem%';

-- Quiabo
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir (80g)', 'grams', 80, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'quiabo%';

-- Chuchu
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 colher de servir (80g)', 'grams', 80, 'isDefault', true),
  jsonb_build_object('label', '½ unidade média (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'chuchu%';

-- ============================================================================
-- ÓLEOS / GORDURAS
-- ============================================================================

-- Azeite / óleos vegetais
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de chá (5ml)', 'grams', 5),
  jsonb_build_object('label', '1 colher de sopa (15ml)', 'grams', 15, 'isDefault', true),
  jsonb_build_object('label', '2 colheres de sopa (30ml)', 'grams', 30)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'azeite%' OR nome_busca LIKE 'oleo,%');

-- Manteiga / margarina
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 ponta de faca (3g)', 'grams', 3),
  jsonb_build_object('label', '1 colher de chá (5g)', 'grams', 5, 'isDefault', true),
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'manteiga%' OR nome_busca LIKE 'margarina%' OR nome_busca LIKE 'banha%'
       OR nome_busca LIKE 'gordura%');

-- ============================================================================
-- AÇÚCARES / ADOÇANTES / MEL
-- ============================================================================

-- Açúcar
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 sachê (5g)', 'grams', 5),
  jsonb_build_object('label', '1 colher de chá (4g)', 'grams', 4, 'isDefault', true),
  jsonb_build_object('label', '1 colher de sobremesa (8g)', 'grams', 8),
  jsonb_build_object('label', '1 colher de sopa (12g)', 'grams', 12)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'acucar%';

-- Mel / melado / rapadura
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de chá (7g)', 'grams', 7, 'isDefault', true),
  jsonb_build_object('label', '1 colher de sopa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 sachê (10g)', 'grams', 10)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'mel%' OR nome_busca LIKE 'melado%' OR nome_busca LIKE 'rapadura%');

-- ============================================================================
-- SUCOS / BEBIDAS
-- ============================================================================

-- Sucos, refrigerantes, bebidas em geral (unidade ml já)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '½ copo (100ml)', 'grams', 100),
  jsonb_build_object('label', '1 copo americano (200ml)', 'grams', 200, 'isDefault', true),
  jsonb_build_object('label', '1 copo longo (250ml)', 'grams', 250),
  jsonb_build_object('label', '1 garrafa (500ml)', 'grams', 500)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'suco%' OR nome_busca LIKE 'refrigerante%' OR nome_busca LIKE 'refresco%'
       OR nome_busca LIKE 'agua de coco%' OR nome_busca LIKE 'agua-de-coco%'
       OR nome_busca LIKE 'cafe, infusao%' OR nome_busca LIKE 'cafe, pronto%'
       OR nome_busca LIKE 'cha,%');

-- Bebidas alcoólicas (geralmente em dose menor)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 dose (30ml)', 'grams', 30),
  jsonb_build_object('label', '1 taça (150ml)', 'grams', 150, 'isDefault', true),
  jsonb_build_object('label', '1 copo (250ml)', 'grams', 250),
  jsonb_build_object('label', '1 lata (350ml)', 'grams', 350)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'cerveja%' OR nome_busca LIKE 'vinho%' OR nome_busca LIKE 'cachaca%'
       OR nome_busca LIKE 'whisky%' OR nome_busca LIKE 'vodka%' OR nome_busca LIKE 'aguardente%');

-- ============================================================================
-- CHOCOLATES / DOCES
-- ============================================================================

UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 quadradinho (10g)', 'grams', 10),
  jsonb_build_object('label', '1 unidade pequena (25g)', 'grams', 25, 'isDefault', true),
  jsonb_build_object('label', '1 barra média (40g)', 'grams', 40),
  jsonb_build_object('label', '1 barra grande (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'chocolate%';

UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15),
  jsonb_build_object('label', '1 colher de sobremesa (20g)', 'grams', 20),
  jsonb_build_object('label', '1 porção (30g)', 'grams', 30, 'isDefault', true)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'doce%' OR nome_busca LIKE 'geleia%' OR nome_busca LIKE 'compota%');

-- ============================================================================
-- EMBUTIDOS / CARNES PROCESSADAS
-- ============================================================================

-- Presunto / peito de peru / mortadela / salame (fatias)
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 fatia (15g)', 'grams', 15),
  jsonb_build_object('label', '2 fatias (30g)', 'grams', 30, 'isDefault', true),
  jsonb_build_object('label', '3 fatias (45g)', 'grams', 45)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'presunto%' OR nome_busca LIKE 'peito de peru%'
       OR nome_busca LIKE 'mortadela%' OR nome_busca LIKE 'salame%'
       OR nome_busca LIKE 'blanquet%' OR nome_busca LIKE 'apresuntado%');

-- Salsicha
UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 unidade (50g)', 'grams', 50, 'isDefault', true),
  jsonb_build_object('label', '2 unidades (100g)', 'grams', 100)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND nome_busca LIKE 'salsicha%';

-- ============================================================================
-- CONDIMENTOS (sal, vinagre, molhos)
-- ============================================================================

UPDATE fitness_global_foods
SET porcoes_comuns = jsonb_build_array(
  jsonb_build_object('label', '1 pitada (1g)', 'grams', 1),
  jsonb_build_object('label', '1 colher de chá (5g)', 'grams', 5, 'isDefault', true),
  jsonb_build_object('label', '1 colher de sopa (15g)', 'grams', 15)
)
WHERE source = 'taco'
  AND porcoes_comuns IS NULL
  AND (nome_busca LIKE 'sal,%' OR nome_busca LIKE 'vinagre%'
       OR nome_busca LIKE 'molho,%' OR nome_busca LIKE 'ketchup%'
       OR nome_busca LIKE 'mostarda, preparada%' OR nome_busca LIKE 'maionese%'
       OR nome_busca LIKE 'pimenta%');

-- Fim da migration
