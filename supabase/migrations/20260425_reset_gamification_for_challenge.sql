-- ============================================================
-- RESET DE GAMIFICAÇÃO PARA INÍCIO DO DESAFIO (v2 — definitivo)
-- Data: 2026-04-25
-- ------------------------------------------------------------
-- Zera pontos, XP, níveis, streaks, PRs, conquistas desbloqueadas,
-- snapshots de ranking, scores de desafios e tier — para que toda
-- a equipe comece o novo desafio em pé de igualdade.
--
-- PRESERVA:
--   • fitness_profiles (apenas reseta colunas de gamificação)
--   • fitness_workouts, fitness_workout_exercises, fitness_exercise_sets
--   • fitness_meals, fitness_water_logs, fitness_sleep_logs
--   • fitness_community_posts / _reactions / _comments (feed)
--   • fitness_progress_photos, fitness_body_compositions
--   • fitness_medical_records, fitness_meal_plans, fitness_training_programs
--   • fitness_rankings (configuração) e fitness_achievements (catálogo)
--
-- ÁRVORE DE PROBLEMAS QUE ESTA V2 RESOLVE:
--   1) Triggers legados em fitness_workouts/meals/water/achievements_users
--      recomputavam xp_total/nivel a partir do histórico inteiro toda vez
--      que algo era inserido. → Resolvido dropando os triggers (a pontuação
--      real do desafio é atribuída via /api/points/award + System B).
--   2) Há um trigger de detecção de PR (fn_check_personal_record) que marca
--      is_pr=TRUE quando NEW.carga > MAX(historico). Como o histórico foi
--      apagado, qualquer treino feito DEPOIS do reset gerava PRs novos.
--      → Resolvido limpando is_pr em todos os sets (incluindo os recém
--      criados) e apagando fitness_personal_records sem filtro.
--   3) Idempotente: pode rodar múltiplas vezes sem efeito colateral.
--
-- EXECUÇÃO:
--   SQL Editor do Supabase, role postgres ou service_role (bypassa RLS).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) Drop dos triggers legados de auto-recompute de XP
--    (a pontuação real agora vem do /api/points/award, que usa
--    fitness_point_transactions + fitness_award_points_to_user).
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_update_xp_on_workout      ON fitness_workouts;
DROP TRIGGER IF EXISTS trg_update_xp_on_meal         ON fitness_meals;
DROP TRIGGER IF EXISTS trg_update_xp_on_water        ON fitness_water_logs;
DROP TRIGGER IF EXISTS trg_update_xp_on_achievement  ON fitness_achievements_users;

-- Defesa em profundidade: se algum lugar ainda chamar update_user_xp,
-- transforma em no-op que respeita o estado atual do perfil.
CREATE OR REPLACE FUNCTION update_user_xp(p_user_id UUID)
RETURNS TABLE(xp_total INTEGER, nivel INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(p.xp_total, 0)::INTEGER,
         COALESCE(p.nivel, 1)::INTEGER
  FROM fitness_profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 2) Limpa ledgers, históricos e itens desbloqueados
-- ------------------------------------------------------------
DELETE FROM fitness_point_transactions;
DELETE FROM fitness_xp_history;
DELETE FROM fitness_ranking_snapshots;
DELETE FROM fitness_achievements_users;
DELETE FROM fitness_personal_records;
DELETE FROM fitness_streak_freeze_log;
DELETE FROM fitness_challenge_participants;

-- ------------------------------------------------------------
-- 3) Remove flag de PR de TODOS os sets (inclusive os criados
--    após o primeiro reset, pelo trigger fn_check_personal_record)
-- ------------------------------------------------------------
UPDATE fitness_exercise_sets SET is_pr = FALSE WHERE is_pr = TRUE;

-- ------------------------------------------------------------
-- 4) Zera totais por ranking (mantém vínculo de participação)
-- ------------------------------------------------------------
UPDATE fitness_ranking_participants
   SET total_points = 0,
       current_position = NULL;

-- ------------------------------------------------------------
-- 5) Reseta colunas de gamificação no perfil
-- ------------------------------------------------------------
UPDATE fitness_profiles
   SET xp_total                  = 0,
       nivel                     = 1,
       streak_atual              = 0,
       maior_streak              = 0,
       streak_freeze_used        = 0,
       streak_freeze_month       = NULL,
       streak_last_activity_date = NULL,
       ultimo_calculo_xp         = NULL,
       status_tier               = 'bronze',
       tier_updated_at           = NOW();

COMMIT;

-- ============================================================
-- VERIFICAÇÃO — rode após o COMMIT. Tudo deve voltar 0.
-- ============================================================
-- SELECT
--   (SELECT COUNT(*) FROM fitness_point_transactions)                       AS pontos,
--   (SELECT COUNT(*) FROM fitness_xp_history)                               AS xp_hist,
--   (SELECT COUNT(*) FROM fitness_ranking_snapshots)                        AS snapshots,
--   (SELECT COUNT(*) FROM fitness_achievements_users)                       AS conquistas,
--   (SELECT COUNT(*) FROM fitness_personal_records)                         AS prs,
--   (SELECT COUNT(*) FROM fitness_streak_freeze_log)                        AS streak_freeze,
--   (SELECT COUNT(*) FROM fitness_challenge_participants)                   AS desafio_parts,
--   (SELECT COUNT(*) FROM fitness_exercise_sets WHERE is_pr)                AS sets_pr,
--   (SELECT COUNT(*) FROM fitness_ranking_participants WHERE total_points <> 0) AS ranking_pts,
--   (SELECT COUNT(*) FROM fitness_profiles
--      WHERE xp_total <> 0 OR nivel <> 1 OR streak_atual <> 0
--         OR maior_streak <> 0 OR status_tier <> 'bronze')                  AS perfis_dirty;
--
-- Confirmação dos triggers dropados:
-- SELECT tgname FROM pg_trigger
--  WHERE tgname IN ('trg_update_xp_on_workout','trg_update_xp_on_meal',
--                   'trg_update_xp_on_water','trg_update_xp_on_achievement');
-- (deve retornar zero linhas)
