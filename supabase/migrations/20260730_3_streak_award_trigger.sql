-- ============================================================
-- BÔNUS DE STREAK — NÃO usar trigger na coluna do perfil
-- Data: 2026-07-30 (revisado após revisão adversarial)
-- ------------------------------------------------------------
-- TENTATIVA DESCARTADA: creditar o bônus de streak (7=15, 30=50) por um trigger
-- AFTER UPDATE em fitness_profiles.streak_atual. É INSEGURO: a coluna
-- streak_atual é gravável pelo cliente (a policy de UPDATE do perfil não trava
-- coluna, e o app em hooks/use-profile.ts chega a escrevê-la). Um paciente faria
-- `update({ streak_atual: 30 })` no console e o trigger creditaria +65 pts, todo
-- dia — recriando a "impressora de pontos" que a auditoria fechou.
--
-- SOLUÇÃO ADOTADA: o bônus é creditado no SERVIDOR, em
-- /api/points/award-workout-complete, a partir do streak REAL recalculado por
-- get_user_streak() (função SECURITY DEFINER que conta dias consecutivos a partir
-- dos treinos reais — o cliente não consegue forjar). Exact-match (==7 / ==30)
-- credita uma vez por cruzamento; o índice único diário é a rede de segurança.
--
-- Esta migration apenas GARANTE que o trigger inseguro NÃO exista (idempotente),
-- caso uma versão anterior deste arquivo tenha sido aplicada.
-- ============================================================

DROP TRIGGER IF EXISTS trigger_auto_award_streak ON fitness_profiles;
DROP FUNCTION IF EXISTS fn_auto_award_streak();
