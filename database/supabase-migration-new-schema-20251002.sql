-- Migration for new video-focused story schema
-- Date: 2025-10-02

-- Add model tracking columns to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS character_model_name text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS scene_model_name text;

-- Update characters table for new schema
ALTER TABLE characters ADD COLUMN IF NOT EXISTS audio_cues text; -- JSON array

-- Update scenes table for new schema  
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS duration integer; -- Duration in seconds
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS audio_elements text; -- JSON array

-- Remove old scene columns that are no longer used in new schema
-- Note: Be careful with these drops in production - backup data first
-- ALTER TABLE scenes DROP COLUMN IF EXISTS setting;
-- ALTER TABLE scenes DROP COLUMN IF EXISTS time_of_day;
-- ALTER TABLE scenes DROP COLUMN IF EXISTS mood;
-- ALTER TABLE scenes DROP COLUMN IF EXISTS key_actions;
-- ALTER TABLE scenes DROP COLUMN IF EXISTS objects;
-- ALTER TABLE scenes DROP COLUMN IF EXISTS emotions;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_character_model on stories(character_model_name);
CREATE INDEX IF NOT EXISTS idx_stories_scene_model on stories(scene_model_name);
CREATE INDEX IF NOT EXISTS idx_scenes_duration on scenes(duration);