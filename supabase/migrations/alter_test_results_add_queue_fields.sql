-- Add queue-related fields to test_results table

-- Add status column for tracking request state
ALTER TABLE test_results
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'
CHECK(status IN ('pending', 'processing', 'completed', 'failed'));

-- Add request_id column for FAL request tracking
ALTER TABLE test_results
ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Add error column for failed requests
ALTER TABLE test_results
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Make url nullable for pending requests
ALTER TABLE test_results
ALTER COLUMN url DROP NOT NULL;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_request_id ON test_results(request_id);

-- Add updated_at timestamp for tracking when status changes
ALTER TABLE test_results
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create an index on updated_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_test_results_updated_at ON test_results(updated_at DESC);
