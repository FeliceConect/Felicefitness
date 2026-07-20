-- =============================================================
-- FASE 2 — Infraestrutura de busca de alimentos
-- Rodar ANTES do deploy e ANTES dos arquivos *_data.sql da fase 2.
-- Ordem completa da fase 2:
--   1. 20260720_fase2_search_infra.sql   (este arquivo)
--   2. 20260720_fase2_nome_popular_data.sql
--   3. 20260720_fase2_categorias_data.sql
--   4. 20260720_fase2_porcoes_data.sql
-- =============================================================

-- No Supabase, extensões podem viver no schema "extensions" — garante que
-- gin_trgm_ops/unaccent/word_similarity resolvam nesta sessão de migration.
-- (schemas inexistentes no search_path são ignorados sem erro)
SET search_path = public, extensions;

-- Extensões: fuzzy matching (pg_trgm) e normalização de acentos (unaccent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Colunas novas em fitness_global_foods
ALTER TABLE fitness_global_foods ADD COLUMN IF NOT EXISTS nome_popular VARCHAR(255);
ALTER TABLE fitness_global_foods ADD COLUMN IF NOT EXISTS nome_popular_busca VARCHAR(255);
ALTER TABLE fitness_global_foods ADD COLUMN IF NOT EXISTS times_used INTEGER NOT NULL DEFAULT 0;

-- Índices trigram (GIN) — aceleram ILIKE '%...%' e similarity
CREATE INDEX IF NOT EXISTS idx_global_foods_nome_busca_trgm
  ON fitness_global_foods USING gin (nome_busca gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_global_foods_nome_popular_trgm
  ON fitness_global_foods USING gin (nome_popular_busca gin_trgm_ops);

-- =============================================================
-- Aliases de busca (antes hardcoded no código da API)
-- alias: termo popular normalizado (lowercase, sem acento)
-- target_terms: termos técnicos adicionais a buscar
-- =============================================================
CREATE TABLE IF NOT EXISTS fitness_food_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias VARCHAR(120) NOT NULL UNIQUE,
  target_terms TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE fitness_food_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_aliases_read_all" ON fitness_food_aliases;
CREATE POLICY "food_aliases_read_all"
  ON fitness_food_aliases FOR SELECT
  TO authenticated
  USING (true);
-- Escrita apenas via service_role (painel/admin)

INSERT INTO fitness_food_aliases (alias, target_terms) VALUES
  ('arroz branco', ARRAY['arroz, tipo 1', 'arroz, polido']),
  ('arroz integral', ARRAY['arroz, integral']),
  ('frango', ARRAY['frango', 'peito de frango', 'coxa de frango', 'sobrecoxa']),
  ('peito de frango', ARRAY['frango, peito']),
  ('ovo', ARRAY['ovo, de galinha']),
  ('ovo cozido', ARRAY['ovo, de galinha, inteiro, cozido']),
  ('ovo frito', ARRAY['ovo, de galinha, inteiro, frito']),
  ('feijao', ARRAY['feijao']),
  ('feijao preto', ARRAY['feijao, preto']),
  ('feijao carioca', ARRAY['feijao, carioca']),
  ('batata doce', ARRAY['batata, doce', 'batata-doce']),
  ('batata frita', ARRAY['batata, frita', 'batata, inglesa, frita']),
  ('batata cozida', ARRAY['batata, inglesa, cozida']),
  ('carne moida', ARRAY['carne, moida', 'carne bovina, moida']),
  ('carne bovina', ARRAY['carne, bovina', 'boi']),
  ('pao frances', ARRAY['pao, frances', 'pao, trigo, frances']),
  ('pao de forma', ARRAY['pao, forma']),
  ('leite', ARRAY['leite, de vaca', 'leite, integral']),
  ('leite integral', ARRAY['leite, de vaca, integral', 'leite, integral']),
  ('leite desnatado', ARRAY['leite, de vaca, desnatado', 'leite, desnatado']),
  ('queijo mussarela', ARRAY['queijo, mussarela', 'queijo, mucarela', 'mussarela']),
  ('banana', ARRAY['banana', 'banana, prata', 'banana, nanica']),
  ('maca', ARRAY['maca']),
  ('cafe', ARRAY['cafe', 'cafe, infusao']),
  ('acucar', ARRAY['acucar']),
  ('azeite', ARRAY['azeite', 'azeite, de oliva']),
  ('macarrao', ARRAY['macarrao']),
  ('carne de porco', ARRAY['carne, suina', 'porco']),
  ('salmao', ARRAY['salmao']),
  ('brocolis', ARRAY['brocolis']),
  ('whey', ARRAY['whey', 'proteina', 'suplemento'])
ON CONFLICT (alias) DO NOTHING;

-- =============================================================
-- Log de buscas sem resultado — termômetro do "não tem no app".
-- Alimenta o backlog de aliases e de alimentos a cadastrar.
-- =============================================================
CREATE TABLE IF NOT EXISTS fitness_food_search_misses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_search_misses_query ON fitness_food_search_misses(query);
CREATE INDEX IF NOT EXISTS idx_food_search_misses_created ON fitness_food_search_misses(created_at);

ALTER TABLE fitness_food_search_misses ENABLE ROW LEVEL SECURITY;
-- Escrita/leitura apenas via service_role (a API grava com admin client)

-- =============================================================
-- RPC de busca: tokens AND + fuzzy (word_similarity) + ranking no SQL
-- p_terms: query normalizada + aliases (lowercase, sem acento)
-- =============================================================
CREATE OR REPLACE FUNCTION fitness_search_foods(
  p_terms TEXT[],
  p_category TEXT DEFAULT NULL,
  p_sources TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF fitness_global_foods
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH terms AS (
    SELECT
      lower(unaccent(t)) AS term,
      array_remove(ARRAY(
        SELECT tok FROM unnest(regexp_split_to_array(lower(unaccent(t)), '[\s,]+')) tok
        WHERE length(tok) >= 2
      ), NULL) AS toks
    FROM unnest(p_terms) t
    WHERE length(trim(t)) >= 2
  ),
  ranked AS (
    SELECT
      f.id,
      MIN(
        CASE
          -- match exato do nome popular ou técnico
          WHEN coalesce(f.nome_popular_busca, '') = t.term OR f.nome_busca = t.term THEN 0
          -- prefixo do nome popular
          WHEN coalesce(f.nome_popular_busca, '') LIKE t.term || '%' THEN 1
          -- prefixo do nome técnico
          WHEN f.nome_busca LIKE t.term || '%' THEN 1.5
          -- todos os tokens presentes (em qualquer ordem)
          WHEN coalesce((
            SELECT bool_and(
              f.nome_busca LIKE '%' || tok || '%'
              OR coalesce(f.nome_popular_busca, '') LIKE '%' || tok || '%'
            )
            FROM unnest(t.toks) tok
          ), false) THEN 2 + length(f.nome) / 1000.0
          -- fuzzy: tolera erro de digitação ("frnago", "iorgute")
          ELSE 4 - GREATEST(
            word_similarity(t.term, f.nome_busca),
            word_similarity(t.term, coalesce(f.nome_popular_busca, ''))
          )
        END
        -- fonte: TACO/manual à frente de TBCA/OFF em empates
        + CASE f.source WHEN 'taco' THEN 0 WHEN 'manual' THEN 0 WHEN 'tbca' THEN 0.3 ELSE 0.35 END
        -- popularidade: alimentos mais usados sobem
        - LEAST(coalesce(f.times_used, 0), 50) * 0.005
      ) AS rank
    FROM fitness_global_foods f
    JOIN terms t ON (
      coalesce((
        SELECT bool_and(
          f.nome_busca LIKE '%' || tok || '%'
          OR coalesce(f.nome_popular_busca, '') LIKE '%' || tok || '%'
        )
        FROM unnest(t.toks) tok
      ), false)
      OR word_similarity(t.term, f.nome_busca) > 0.42
      OR word_similarity(t.term, coalesce(f.nome_popular_busca, '')) > 0.42
    )
    WHERE f.is_active = true
      AND (p_category IS NULL OR f.categoria = p_category)
      AND (p_sources IS NULL OR f.source = ANY(p_sources))
    GROUP BY f.id
  )
  SELECT f.*
  FROM fitness_global_foods f
  JOIN ranked r ON r.id = f.id
  ORDER BY r.rank ASC, f.nome ASC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION fitness_search_foods(TEXT[], TEXT, TEXT[], INTEGER, INTEGER) TO authenticated;

-- =============================================================
-- Contador de uso (popularidade no ranking da busca).
-- SECURITY DEFINER: o client autenticado pode incrementar mesmo
-- sem permissão de escrita na tabela global.
-- =============================================================
CREATE OR REPLACE FUNCTION fitness_increment_food_usage(p_food_ids UUID[])
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  UPDATE fitness_global_foods
  SET times_used = coalesce(times_used, 0) + 1
  WHERE id = ANY(p_food_ids);
$$;

GRANT EXECUTE ON FUNCTION fitness_increment_food_usage(UUID[]) TO authenticated;
