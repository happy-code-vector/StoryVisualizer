# Video Queue Processor - Setup Guide

This Edge Function processes pending video generation requests from the FAL AI queue.

## How It Works

1. Every 10 seconds, the cron job triggers the Edge Function
2. The function fetches all pending/processing video requests from the database
3. For each request, it checks the FAL queue status
4. When a request is complete, it updates the database with the video URL
5. The frontend displays the queue with real-time status updates

## Setup Instructions

### 1. Run Database Migration

Apply the migration to add queue-related fields to the `test_results` table:

```bash
# Using Supabase CLI
supabase db push

# Or run this SQL in your Supabase SQL Editor:
# See: supabase/migrations/alter_test_results_add_queue_fields.sql
```

### 2. Deploy Edge Function

Deploy the cron function to Supabase:

```bash
# Using Supabase CLI
supabase functions deploy process-video-queue
```

### 3. Set Environment Variables

Configure these environment variables in Supabase:

- `FAL_AI_API_KEY` or `FAL_KEY` - Your FAL AI API key
- `CRON_SECRET` - A secret key to authorize cron requests

### 4. Configure Cron Schedule

The cron is configured to run every 10 seconds in `cron.toml`:

```toml
[triggers.cron]
schedule = "*/10 * * * * *"
```

## Database Schema

The `test_results` table now includes:

- `status` - Request status: `pending` | `processing` | `completed` | `failed`
- `request_id` - FAL queue request ID
- `error_message` - Error message if request failed
- `updated_at` - Last status update timestamp

## Frontend Integration

The frontend automatically displays all video requests in the "Queue" tab:

- **Pending** requests show "Queued for generation..."
- **Processing** requests show "Processing..."
- **Completed** requests show the video player with download option
- **Failed** requests show error message

Users can click "Refresh" to see the latest status updates.

## Monitoring

Check the Edge Function logs in Supabase Dashboard:

```
Supabase Dashboard > Edge Functions > process-video-queue > Logs
```

Look for messages like:
- `[VideoQueueProcessor] Found X pending requests`
- `[VideoQueueProcessor] Request 123 status: COMPLETED`
- `[VideoQueueProcessor] Completed: {processed: 5, completed: 2, failed: 0}`
