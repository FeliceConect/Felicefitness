-- =============================================================================
-- Felice Wellness - Fase 1: Foundation Migration
-- Created: 2026-02-28
-- Description: Creates 11 new tables + alters existing tables for multi-patient
--              wellness platform
-- =============================================================================

-- ===========================
-- 1. FITNESS_APPOINTMENTS
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users NOT NULL,
  professional_id UUID NOT NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('presencial', 'online')),
  meeting_link TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show','reschedule_requested')),
  reschedule_reason TEXT,
  reschedule_requested_at TIMESTAMPTZ,
  notes TEXT,
  confirmed_by_patient BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  ics_data TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON fitness_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional ON fitness_appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON fitness_appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON fitness_appointments(status);

ALTER TABLE fitness_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own appointments" ON fitness_appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Professionals can view their appointments" ON fitness_appointments
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM fitness_professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Professionals can insert appointments" ON fitness_appointments
  FOR INSERT WITH CHECK (
    professional_id IN (
      SELECT id FROM fitness_professionals WHERE user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Professionals can update their appointments" ON fitness_appointments
  FOR UPDATE USING (
    professional_id IN (
      SELECT id FROM fitness_professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins full access to appointments" ON fitness_appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ===========================
-- 2. FITNESS_PROFESSIONAL_NOTES
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_professional_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL,
  patient_id UUID REFERENCES auth.users NOT NULL,
  appointment_id UUID REFERENCES fitness_appointments,
  note_type TEXT NOT NULL CHECK (note_type IN ('observation','evolution','action_plan','alert')),
  content TEXT NOT NULL,
  visible_to_roles TEXT[] NOT NULL DEFAULT ARRAY['super_admin'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_professional ON fitness_professional_notes(professional_id);
CREATE INDEX IF NOT EXISTS idx_notes_patient ON fitness_professional_notes(patient_id);

ALTER TABLE fitness_professional_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage own notes" ON fitness_professional_notes
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM fitness_professionals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all notes" ON fitness_professional_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ===========================
-- 3. FITNESS_COMMUNITY_POSTS
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('meal','workout','achievement','free_text','check_in')),
  content TEXT,
  image_url TEXT,
  related_id UUID,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  reactions_count JSONB DEFAULT '{}',
  comments_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON fitness_community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON fitness_community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visible ON fitness_community_posts(is_visible) WHERE is_visible = TRUE;

ALTER TABLE fitness_community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view visible posts" ON fitness_community_posts
  FOR SELECT USING (is_visible = TRUE);

CREATE POLICY "Users can create own posts" ON fitness_community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON fitness_community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all posts" ON fitness_community_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ===========================
-- 4. FITNESS_COMMUNITY_REACTIONS
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES fitness_community_posts NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('fire','heart','strength','clap','star')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post ON fitness_community_reactions(post_id);

ALTER TABLE fitness_community_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view reactions" ON fitness_community_reactions
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage own reactions" ON fitness_community_reactions
  FOR ALL USING (auth.uid() = user_id);

-- ===========================
-- 5. FITNESS_COMMUNITY_COMMENTS
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES fitness_community_posts NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON fitness_community_comments(post_id);

ALTER TABLE fitness_community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view visible comments" ON fitness_community_comments
  FOR SELECT USING (is_visible = TRUE);

CREATE POLICY "Users can create comments" ON fitness_community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON fitness_community_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments" ON fitness_community_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ===========================
-- 6. FITNESS_RANKINGS
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general','semester','monthly','challenge','category')),
  category TEXT CHECK (category IN ('nutrition','workout','consistency')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  point_rules JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fitness_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active rankings" ON fitness_rankings
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Super admins can manage rankings" ON fitness_rankings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ===========================
-- 7. FITNESS_RANKING_PARTICIPANTS
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_ranking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID REFERENCES fitness_rankings NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  total_points INTEGER DEFAULT 0,
  current_position INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ranking_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ranking_parts_ranking ON fitness_ranking_participants(ranking_id);
CREATE INDEX IF NOT EXISTS idx_ranking_parts_user ON fitness_ranking_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_parts_position ON fitness_ranking_participants(ranking_id, current_position);

ALTER TABLE fitness_ranking_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view participants" ON fitness_ranking_participants
  FOR SELECT USING (TRUE);

CREATE POLICY "System can manage participants" ON fitness_ranking_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ===========================
-- 8. FITNESS_POINT_TRANSACTIONS
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'workout','nutrition','hydration','sleep','wellness',
    'attendance','social','bonus','bioimpedance','challenge',
    'consistency','form_completion'
  )),
  source TEXT NOT NULL CHECK (source IN ('automatic','professional','superadmin')),
  awarded_by UUID REFERENCES auth.users,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_user ON fitness_point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_category ON fitness_point_transactions(category);
CREATE INDEX IF NOT EXISTS idx_points_created ON fitness_point_transactions(created_at DESC);

ALTER TABLE fitness_point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON fitness_point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Professionals can insert points for assigned clients" ON fitness_point_transactions
  FOR INSERT WITH CHECK (
    awarded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM fitness_professionals WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Admins can manage all points" ON fitness_point_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ===========================
-- 9. FITNESS_BROADCAST_MESSAGES
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('announcement','reminder','motivational','event')),
  target_filter JSONB,
  recipient_count INTEGER DEFAULT 0,
  channels TEXT[] DEFAULT ARRAY['push','inbox'],
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fitness_broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage broadcasts" ON fitness_broadcast_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ===========================
-- 10. FITNESS_BROADCAST_RECIPIENTS
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES fitness_broadcast_messages NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  push_sent BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_recip_broadcast ON fitness_broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recip_user ON fitness_broadcast_recipients(user_id);

ALTER TABLE fitness_broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own broadcast recipients" ON fitness_broadcast_recipients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage broadcast recipients" ON fitness_broadcast_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ===========================
-- 11. FITNESS_INBOX_MESSAGES
-- ===========================
CREATE TABLE IF NOT EXISTS fitness_inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('broadcast','system','professional')),
  source_id UUID,
  title TEXT NOT NULL,
  preview TEXT,
  content TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_user ON fitness_inbox_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_read ON fitness_inbox_messages(user_id, read_at) WHERE read_at IS NULL;

ALTER TABLE fitness_inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inbox" ON fitness_inbox_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inbox (mark read)" ON fitness_inbox_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert inbox messages" ON fitness_inbox_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM fitness_profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ===========================
-- ALTERATIONS TO EXISTING TABLES
-- ===========================

-- Add video support to exercises library
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fitness_exercises_library' AND column_name = 'video_url') THEN
    ALTER TABLE fitness_exercises_library ADD COLUMN video_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fitness_exercises_library' AND column_name = 'video_thumbnail') THEN
    ALTER TABLE fitness_exercises_library ADD COLUMN video_thumbnail TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fitness_exercises_library' AND column_name = 'instructions') THEN
    ALTER TABLE fitness_exercises_library ADD COLUMN instructions TEXT;
  END IF;
END $$;

-- Add display_name to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fitness_profiles' AND column_name = 'display_name') THEN
    ALTER TABLE fitness_profiles ADD COLUMN display_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fitness_profiles' AND column_name = 'role') THEN
    ALTER TABLE fitness_profiles ADD COLUMN role TEXT DEFAULT 'client';
  END IF;
END $$;

-- Update professionals CHECK constraint to accept 'coach'
-- Drop and recreate the type check constraint
DO $$
BEGIN
  -- Try to drop existing constraint (may have different names)
  BEGIN
    ALTER TABLE fitness_professionals DROP CONSTRAINT IF EXISTS fitness_professionals_type_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  BEGIN
    ALTER TABLE fitness_professionals DROP CONSTRAINT IF EXISTS check_professional_type;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  -- Add new constraint
  ALTER TABLE fitness_professionals ADD CONSTRAINT fitness_professionals_type_check
    CHECK (type IN ('nutritionist', 'trainer', 'coach', 'admin'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ===========================
-- TRIGGERS: auto-update updated_at
-- ===========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'fitness_appointments',
      'fitness_professional_notes',
      'fitness_community_posts',
      'fitness_community_comments',
      'fitness_rankings',
      'fitness_broadcast_messages'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END $$;
