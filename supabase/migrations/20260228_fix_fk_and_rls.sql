-- =============================================================================
-- Complexo Wellness - Fix Missing Foreign Keys & Professional RLS Policies
-- Created: 2026-02-28
-- Description: Adds missing FK constraints and RLS policies so professionals
--              can read their assigned clients' tracking data.
--
-- SAFE TO RUN MULTIPLE TIMES (idempotent):
--   - ALTER TABLE ... ADD CONSTRAINT wrapped in DO/EXCEPTION blocks
--   - DROP POLICY IF EXISTS before every CREATE POLICY
-- =============================================================================


-- =============================================================================
-- SECTION 1: MISSING FOREIGN KEYS
-- =============================================================================
-- Each FK is wrapped in its own DO block so a duplicate_object error
-- (constraint already exists) is silently caught and execution continues.

-- ---------------------------------------------------------------------------
-- 1a. fitness_appointments.professional_id -> fitness_professionals.id
--     The foundation migration created the column as UUID NOT NULL but
--     without a REFERENCES clause.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_appointments
    ADD CONSTRAINT fk_appointments_professional
    FOREIGN KEY (professional_id) REFERENCES fitness_professionals(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1b. fitness_professional_notes.professional_id -> fitness_professionals.id
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_professional_notes
    ADD CONSTRAINT fk_professional_notes_professional
    FOREIGN KEY (professional_id) REFERENCES fitness_professionals(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1c. fitness_professional_notes.patient_id -> fitness_profiles.id
--     Currently references auth.users; add a secondary FK to fitness_profiles
--     to enforce that the patient has a profile row.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_professional_notes
    ADD CONSTRAINT fk_professional_notes_patient_profile
    FOREIGN KEY (patient_id) REFERENCES fitness_profiles(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1d. fitness_form_assignments.template_id -> fitness_form_templates.id
--     Already has an inline FK in 20260221. Adding named constraint if the
--     inline one was somehow skipped.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_form_assignments
    ADD CONSTRAINT fk_form_assignments_template
    FOREIGN KEY (template_id) REFERENCES fitness_form_templates(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1e. fitness_form_responses.assignment_id -> fitness_form_assignments.id
--     Already has inline FK (fitness_form_responses references
--     fitness_form_assignments). Named constraint as backup.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_form_responses
    ADD CONSTRAINT fk_form_responses_assignment
    FOREIGN KEY (assignment_id) REFERENCES fitness_form_assignments(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1f. fitness_messages.conversation_id -> fitness_conversations.id
--     The chat migration used inline REFERENCES. Named constraint as backup.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_messages
    ADD CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES fitness_conversations(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1g. fitness_community_reactions.post_id -> fitness_community_posts.id
--     Inline FK exists. Named constraint as backup.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_community_reactions
    ADD CONSTRAINT fk_reactions_post
    FOREIGN KEY (post_id) REFERENCES fitness_community_posts(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1h. fitness_community_comments.post_id -> fitness_community_posts.id
--     Inline FK exists. Named constraint as backup.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_community_comments
    ADD CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES fitness_community_posts(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1i. fitness_ranking_participants.ranking_id -> fitness_rankings.id
--     Inline FK exists. Named constraint as backup.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_ranking_participants
    ADD CONSTRAINT fk_ranking_participants_ranking
    FOREIGN KEY (ranking_id) REFERENCES fitness_rankings(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1j. fitness_point_transactions.user_id -> fitness_profiles.id (ON DELETE CASCADE)
--     Currently references auth.users. Add secondary FK to fitness_profiles.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE fitness_point_transactions
    ADD CONSTRAINT fk_point_transactions_profile
    FOREIGN KEY (user_id) REFERENCES fitness_profiles(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- SECTION 2: ADMIN / SUPER_ADMIN READ-ALL POLICIES ON CLIENT TRACKING TABLES
-- =============================================================================
-- Admins and super_admins need full visibility into all client data.
-- The original migration only has "user can see own data" policies.

-- --- fitness_profiles: admins can see all profiles ---
DROP POLICY IF EXISTS "Admins podem ver todos perfis" ON fitness_profiles;
CREATE POLICY "Admins podem ver todos perfis"
  ON fitness_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

-- --- fitness_profiles: professionals can see assigned client profiles ---
DROP POLICY IF EXISTS "professionals_read_assigned_clients_profiles" ON fitness_profiles;
CREATE POLICY "professionals_read_assigned_clients_profiles"
  ON fitness_profiles FOR SELECT
  USING (
    id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );


-- =============================================================================
-- SECTION 3: PROFESSIONAL RLS POLICIES FOR CLIENT TRACKING DATA
-- =============================================================================
-- Professionals (nutritionist, trainer, coach) must be able to READ data for
-- clients assigned to them via fitness_client_assignments.
--
-- Pattern for each table:
--   user_id IN (
--     SELECT ca.client_id FROM fitness_client_assignments ca
--     JOIN fitness_professionals p ON p.id = ca.professional_id
--     WHERE p.user_id = auth.uid() AND ca.is_active = true
--   )
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3a. fitness_workouts
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_workouts" ON fitness_workouts;
CREATE POLICY "professionals_read_assigned_clients_workouts"
  ON fitness_workouts FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- Admins full access to workouts
DROP POLICY IF EXISTS "Admins podem ver todos treinos" ON fitness_workouts;
CREATE POLICY "Admins podem ver todos treinos"
  ON fitness_workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 3b. fitness_workout_exercises (linked through workouts)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_workout_exercises" ON fitness_workout_exercises;
CREATE POLICY "professionals_read_assigned_clients_workout_exercises"
  ON fitness_workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workouts w
      WHERE w.id = workout_id
      AND w.user_id IN (
        SELECT ca.client_id FROM fitness_client_assignments ca
        JOIN fitness_professionals p ON p.id = ca.professional_id
        WHERE p.user_id = auth.uid() AND ca.is_active = true
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3c. fitness_exercise_sets (linked through workout_exercises -> workouts)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_exercise_sets" ON fitness_exercise_sets;
CREATE POLICY "professionals_read_assigned_clients_exercise_sets"
  ON fitness_exercise_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_workout_exercises we
      JOIN fitness_workouts w ON we.workout_id = w.id
      WHERE we.id = workout_exercise_id
      AND w.user_id IN (
        SELECT ca.client_id FROM fitness_client_assignments ca
        JOIN fitness_professionals p ON p.id = ca.professional_id
        WHERE p.user_id = auth.uid() AND ca.is_active = true
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3d. fitness_personal_records
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_prs" ON fitness_personal_records;
CREATE POLICY "professionals_read_assigned_clients_prs"
  ON fitness_personal_records FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 3e. fitness_meals
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_meals" ON fitness_meals;
CREATE POLICY "professionals_read_assigned_clients_meals"
  ON fitness_meals FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- Admins full access to meals
DROP POLICY IF EXISTS "Admins podem ver todas refeicoes" ON fitness_meals;
CREATE POLICY "Admins podem ver todas refeicoes"
  ON fitness_meals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 3f. fitness_meal_items (linked through meals)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_meal_items" ON fitness_meal_items;
CREATE POLICY "professionals_read_assigned_clients_meal_items"
  ON fitness_meal_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_meals m
      WHERE m.id = meal_id
      AND m.user_id IN (
        SELECT ca.client_id FROM fitness_client_assignments ca
        JOIN fitness_professionals p ON p.id = ca.professional_id
        WHERE p.user_id = auth.uid() AND ca.is_active = true
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3g. fitness_water_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_water_logs" ON fitness_water_logs;
CREATE POLICY "professionals_read_assigned_clients_water_logs"
  ON fitness_water_logs FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- Admins full access to water logs
DROP POLICY IF EXISTS "Admins podem ver todos registros de agua" ON fitness_water_logs;
CREATE POLICY "Admins podem ver todos registros de agua"
  ON fitness_water_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 3h. fitness_sleep_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_sleep_logs" ON fitness_sleep_logs;
CREATE POLICY "professionals_read_assigned_clients_sleep_logs"
  ON fitness_sleep_logs FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- Admins full access to sleep logs
DROP POLICY IF EXISTS "Admins podem ver todos registros de sono" ON fitness_sleep_logs;
CREATE POLICY "Admins podem ver todos registros de sono"
  ON fitness_sleep_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 3i. fitness_body_compositions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_body_compositions" ON fitness_body_compositions;
CREATE POLICY "professionals_read_assigned_clients_body_compositions"
  ON fitness_body_compositions FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- Admins full access to body compositions
DROP POLICY IF EXISTS "Admins podem ver todas bioimpedancias" ON fitness_body_compositions;
CREATE POLICY "Admins podem ver todas bioimpedancias"
  ON fitness_body_compositions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 3j. fitness_progress_photos
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_progress_photos" ON fitness_progress_photos;
CREATE POLICY "professionals_read_assigned_clients_progress_photos"
  ON fitness_progress_photos FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- Admins full access to progress photos
DROP POLICY IF EXISTS "Admins podem ver todas fotos" ON fitness_progress_photos;
CREATE POLICY "Admins podem ver todas fotos"
  ON fitness_progress_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 3k. fitness_daily_notes
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_daily_notes" ON fitness_daily_notes;
CREATE POLICY "professionals_read_assigned_clients_daily_notes"
  ON fitness_daily_notes FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- Admins full access to daily notes
DROP POLICY IF EXISTS "Admins podem ver todas notas diarias" ON fitness_daily_notes;
CREATE POLICY "Admins podem ver todas notas diarias"
  ON fitness_daily_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- 3l. fitness_workout_templates (professionals can see assigned client templates)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_workout_templates" ON fitness_workout_templates;
CREATE POLICY "professionals_read_assigned_clients_workout_templates"
  ON fitness_workout_templates FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 3m. fitness_xp_history (professionals can see assigned client XP history)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_xp_history" ON fitness_xp_history;
CREATE POLICY "professionals_read_assigned_clients_xp_history"
  ON fitness_xp_history FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 3n. fitness_point_transactions (professionals can see assigned client points)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_point_transactions" ON fitness_point_transactions;
CREATE POLICY "professionals_read_assigned_clients_point_transactions"
  ON fitness_point_transactions FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 3o. fitness_goals (professionals can see assigned client goals)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_goals" ON fitness_goals;
CREATE POLICY "professionals_read_assigned_clients_goals"
  ON fitness_goals FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 3p. fitness_supplements (professionals can see assigned client supplements)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_supplements" ON fitness_supplements;
CREATE POLICY "professionals_read_assigned_clients_supplements"
  ON fitness_supplements FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 3q. fitness_supplements_logs (professionals can see assigned client supplement logs)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "professionals_read_assigned_clients_supplements_logs" ON fitness_supplements_logs;
CREATE POLICY "professionals_read_assigned_clients_supplements_logs"
  ON fitness_supplements_logs FOR SELECT
  USING (
    user_id IN (
      SELECT ca.client_id FROM fitness_client_assignments ca
      JOIN fitness_professionals p ON p.id = ca.professional_id
      WHERE p.user_id = auth.uid() AND ca.is_active = true
    )
  );


-- =============================================================================
-- SECTION 4: ENSURE BASIC USER SELF-ACCESS RLS EXISTS
-- =============================================================================
-- Most tables already have user self-access from 001_create_tables.sql.
-- The following covers tables from later migrations that may be missing them.

-- fitness_point_transactions: users can already view own (exists in foundation)
-- fitness_ranking_participants: users view own
DROP POLICY IF EXISTS "Users can view own ranking participation" ON fitness_ranking_participants;
CREATE POLICY "Users can view own ranking participation"
  ON fitness_ranking_participants FOR SELECT
  USING (auth.uid() = user_id);

-- fitness_xp_history: users can already view own (exists in ranking migration)
-- fitness_ranking_snapshots: users can already view own (exists in ranking migration)


-- =============================================================================
-- SECTION 5: USEFUL INDEXES FOR THE NEW RLS QUERIES
-- =============================================================================
-- The subquery in professional policies joins fitness_client_assignments and
-- fitness_professionals. Make sure we have good covering indexes.

CREATE INDEX IF NOT EXISTS idx_client_assignments_active_professional
  ON fitness_client_assignments(professional_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_professionals_user_id_active
  ON fitness_professionals(user_id, is_active)
  WHERE is_active = true;


-- =============================================================================
-- SECTION 6: DOCUMENTATION
-- =============================================================================

COMMENT ON CONSTRAINT fk_appointments_professional ON fitness_appointments
  IS 'Links appointment to the professional record (was missing FK)';

COMMENT ON CONSTRAINT fk_professional_notes_professional ON fitness_professional_notes
  IS 'Links note to the professional record (was missing FK)';

COMMENT ON CONSTRAINT fk_professional_notes_patient_profile ON fitness_professional_notes
  IS 'Ensures patient has a fitness_profiles row';

COMMENT ON CONSTRAINT fk_point_transactions_profile ON fitness_point_transactions
  IS 'Ensures point recipient has a fitness_profiles row (CASCADE delete)';
