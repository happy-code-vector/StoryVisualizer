-- Migration for video generation support
-- Date: 2025-10-02

-- Add video_url column to scenes table
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS video_url text;

-- Add video_model_name column to stories table to track which video model was used
ALTER TABLE stories ADD COLUMN IF NOT EXISTS video_model_name text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scenes_video_url on scenes(video_url);
CREATE INDEX IF NOT EXISTS idx_stories_video_model on stories(video_model_name);

-- Add comment to document the video_url field
COMMENT ON COLUMN scenes.video_url IS 'URL of the generated video clip for this scene';
COMMENT ON COLUMN stories.video_model_name IS 'Name of the AI model used for video generation';