-- ================================================================
-- Migration: Auto-publish feed setting (Phase 2 Community)
-- Date: 2026-03-15
-- ================================================================

ALTER TABLE fitness_profiles ADD COLUMN IF NOT EXISTS auto_publish_feed BOOLEAN DEFAULT true;
