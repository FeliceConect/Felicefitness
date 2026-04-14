-- ============================================================================
-- Admin Type — Diferencia Secretária de Suporte dentro do role 'admin'
-- ============================================================================
-- Valores: 'secretary' (secretária), 'support' (tec. enfermagem/esteticista), NULL (admin genérico/legado)
-- ============================================================================

ALTER TABLE fitness_profiles
  ADD COLUMN IF NOT EXISTS admin_type TEXT DEFAULT NULL
  CHECK (admin_type IS NULL OR admin_type IN ('secretary', 'support'));
