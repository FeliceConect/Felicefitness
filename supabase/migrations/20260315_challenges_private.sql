-- ================================================================
-- Migration: Private Challenges support
-- Date: 2026-03-15
-- ================================================================

-- Add is_private flag to challenges
ALTER TABLE fitness_challenges
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
