-- ================================================================
-- Migration: Group Challenges + Status Tiers (Phase 4 Community)
-- Date: 2026-03-15
-- ================================================================

-- 1. Status Tier columns on profiles
ALTER TABLE fitness_profiles
  ADD COLUMN IF NOT EXISTS status_tier VARCHAR(20) DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Group Challenges table
CREATE TABLE IF NOT EXISTS fitness_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type VARCHAR(30) NOT NULL DEFAULT 'points',
    -- points: most points wins
    -- workouts: most workouts
    -- streak: longest streak during period
    -- custom: manual scoring
  scoring_category VARCHAR(30),
    -- null = all points count
    -- workout, nutrition, consistency, social
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- 3. Challenge participants
CREATE TABLE IF NOT EXISTS fitness_challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES fitness_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  current_position INTEGER,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- 4. RLS
ALTER TABLE fitness_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_challenge_participants ENABLE ROW LEVEL SECURITY;

-- Challenges: everyone can read active, only superadmins create
CREATE POLICY "Anyone can view active challenges"
  ON fitness_challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Superadmins can manage challenges"
  ON fitness_challenges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fitness_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Participants: users can see all, insert themselves, update own
CREATE POLICY "Anyone can view participants"
  ON fitness_challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join challenges"
  ON fitness_challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update scores"
  ON fitness_challenge_participants FOR UPDATE
  USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_active
  ON fitness_challenges(is_active, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge
  ON fitness_challenge_participants(challenge_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_user
  ON fitness_challenge_participants(user_id);

-- 6. Function to calculate tier from total points
CREATE OR REPLACE FUNCTION calculate_tier(total_pts INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
  IF total_pts >= 5000 THEN RETURN 'platina';
  ELSIF total_pts >= 2000 THEN RETURN 'ouro';
  ELSIF total_pts >= 500 THEN RETURN 'prata';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Function to update user's tier (never demotes)
CREATE OR REPLACE FUNCTION update_user_tier(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_total_pts INTEGER;
  v_new_tier VARCHAR(20);
  v_current_tier VARCHAR(20);
  v_tier_order JSONB := '{"bronze":1,"prata":2,"ouro":3,"platina":4}'::JSONB;
BEGIN
  -- Sum all points
  SELECT COALESCE(SUM(points), 0) INTO v_total_pts
  FROM fitness_point_transactions
  WHERE user_id = p_user_id;

  v_new_tier := calculate_tier(v_total_pts);

  -- Get current tier
  SELECT COALESCE(status_tier, 'bronze') INTO v_current_tier
  FROM fitness_profiles WHERE id = p_user_id;

  -- Never demote: only update if new tier is higher
  IF (v_tier_order->>v_new_tier)::INT > (v_tier_order->>v_current_tier)::INT THEN
    UPDATE fitness_profiles
    SET status_tier = v_new_tier, tier_updated_at = now()
    WHERE id = p_user_id;
    RETURN v_new_tier;
  END IF;

  RETURN v_current_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
