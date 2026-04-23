-- Corrige erro 42804 ao chamar get_ranking_leaderboard:
--   "Returned type character varying does not match expected type text in column 2"
--
-- Causa: fitness_profiles.apelido_ranking é VARCHAR(50). Por consequência,
-- o COALESCE na view fitness_ranking_view produz uma coluna `apelido` do
-- tipo varchar, enquanto a RPC declara RETURNS TABLE(..., apelido TEXT, ...).
--
-- Correção: cast explícito para TEXT dentro da RPC (mantém a view como está
-- para não exigir DROP em cascata com dependências).

CREATE OR REPLACE FUNCTION get_ranking_leaderboard(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  posicao BIGINT,
  apelido TEXT,
  xp_total INTEGER,
  nivel INTEGER,
  streak_atual INTEGER,
  total_conquistas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rv.posicao,
    rv.apelido::TEXT,
    rv.xp_total,
    rv.nivel,
    rv.streak_atual,
    rv.total_conquistas
  FROM fitness_ranking_view rv
  ORDER BY rv.posicao ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_ranking_leaderboard(INTEGER, INTEGER) TO authenticated;
