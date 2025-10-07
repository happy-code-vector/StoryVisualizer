-- Migration for video generation support
-- Date: 2025-10-02

-- Add video_model_name column to stories table to track which video model was used
ALTER TABLE stories ADD COLUMN IF NOT EXISTS video_model_name text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_video_model on stories(video_model_name);

-- Add comment to document the video_url field
COMMENT ON COLUMN stories.video_model_name IS 'Name of the AI model used for video generation';