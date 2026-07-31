-- ============================================================
-- PRIVACIDADE E AUTORIZAÇÃO DO RANKING/PONTOS
-- Data: 2026-07-30
-- ------------------------------------------------------------
-- 1) O opt-out do ranking (fitness_profiles.ranking_visivel = FALSE) era
--    cosmético: a policy de fitness_ranking_participants era USING (TRUE),
--    então qualquer autenticado lia a pontuação de TODOS direto na tabela,
--    inclusive de quem pediu para não aparecer. Passa a respeitar o opt-out.
--    (As rotas do app leem via service_role e não são afetadas; isto fecha só
--     o acesso direto do cliente autenticado.)
--
-- 2) A policy de INSERT de pontos por profissional exigia apenas
--    awarded_by = auth.uid() + ser profissional ativo — sem vínculo com o
--    paciente. Qualquer profissional podia lançar pontos para QUALQUER
--    paciente. Passa a exigir vínculo ativo em fitness_client_assignments.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1) Ranking: respeitar opt-out
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone authenticated can view participants" ON fitness_ranking_participants;

CREATE POLICY "Participants visible per opt-in" ON fitness_ranking_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM fitness_profiles p
      WHERE p.id = fitness_ranking_participants.user_id
        AND COALESCE(p.ranking_visivel, TRUE) = TRUE
    )
    OR EXISTS (
      -- Só super_admin (Leonardo/Marinella) fura o opt-out. A secretária (admin)
      -- não vê dado derivado de saúde, coerente com o modelo de papéis.
      SELECT 1 FROM fitness_profiles a
      WHERE a.id = auth.uid() AND a.role = 'super_admin'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2) Pontos por profissional: exigir vínculo com o paciente
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Professionals can insert points for assigned clients" ON fitness_point_transactions;

CREATE POLICY "Professionals can insert points for assigned clients" ON fitness_point_transactions
  FOR INSERT WITH CHECK (
    awarded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM fitness_client_assignments ca
      JOIN fitness_professionals pr ON pr.id = ca.professional_id
      WHERE pr.user_id = auth.uid()
        AND ca.client_id = fitness_point_transactions.user_id
        AND ca.is_active = TRUE
    )
  );
