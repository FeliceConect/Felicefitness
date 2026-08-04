-- ============================================================
-- admin_type 'manager' (Gestor) — relaxa o CHECK de fitness_profiles
-- ------------------------------------------------------------
-- O CHECK original (20260413_admin_type.sql) só aceita 'secretary' e
-- 'support'. O gestor (Kauê) precisa do valor 'manager': acessa o painel
-- admin com Rankings (pontos do Instagram #vivendofelice), Agenda e
-- Usuários, e é travado no servidor de todo dado clínico de paciente.
--
-- ⚠️ RODAR ANTES de marcar qualquer usuário como 'manager' no app.
-- ============================================================

-- Remove qualquer CHECK existente sobre admin_type (o nome pode variar
-- conforme foi criado inline no ADD COLUMN).
DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'fitness_profiles'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%admin_type%'
  LOOP
    EXECUTE format('ALTER TABLE fitness_profiles DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE fitness_profiles
  ADD CONSTRAINT fitness_profiles_admin_type_check
  CHECK (admin_type IS NULL OR admin_type IN ('secretary', 'support', 'manager'));
