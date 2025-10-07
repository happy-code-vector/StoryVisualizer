-- Migration for image-optimized story analysis schema
-- Date: 2025-10-07
-- Purpose: Optimize database schema for image generation instead of video generation

-- Remove analysis column from stories table since all info is now in character and scene tables
ALTER TABLE stories DROP COLUMN IF EXISTS analysis;

-- Update characters table
-- Remove relationships and audio_cues columns
ALTER TABLE characters DROP COLUMN IF EXISTS relationships;
ALTER TABLE characters DROP COLUMN IF EXISTS audio_cues;

-- Add brief_intro column to characters table
ALTER TABLE characters ADD COLUMN IF NOT EXISTS brief_intro text;

-- Update scenes table
-- Remove video-specific columns that are no longer needed
ALTER TABLE scenes DROP COLUMN IF EXISTS duration;
ALTER TABLE scenes DROP COLUMN IF EXISTS audio_elements;

-- Remove old scene columns that were already deprecated
ALTER TABLE scenes DROP COLUMN IF EXISTS setting;
ALTER TABLE scenes DROP COLUMN IF EXISTS time_of_day;
ALTER TABLE scenes DROP COLUMN IF EXISTS mood;
ALTER TABLE scenes DROP COLUMN IF EXISTS key_actions;
ALTER TABLE scenes DROP COLUMN IF EXISTS objects;
ALTER TABLE scenes DROP COLUMN IF EXISTS emotions;

-- Update indexes - remove indexes for dropped columns
DROP INDEX IF EXISTS idx_scenes_duration;

-- Add new indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_brief_intro ON characters(brief_intro);

-- Update any existing data to ensure compatibility
-- Set brief_intro to a default value for existing characters if needed
UPDATE characters SET brief_intro = 'Character from the story' WHERE brief_intro IS NULL;

-- Comments for documentation
COMMENT ON COLUMN characters.brief_intro IS 'Brief 1-2 sentence introduction of the character and their role';
COMMENT ON COLUMN characters.description IS 'Perfect image generation prompt for character appearance and visual characteristics';
COMMENT ON COLUMN scenes.description IS 'Perfect image generation prompt for scene composition, lighting, and visual elements';