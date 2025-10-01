-- Add model tracking columns to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS character_model_name text;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS scene_model_name text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_character_model on stories(character_model_name);
CREATE INDEX IF NOT EXISTS idx_stories_scene_model on stories(scene_model_name);