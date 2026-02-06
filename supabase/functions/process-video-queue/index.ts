// Supabase Edge Function to process pending video generation requests
// This runs every 10 seconds via cron to check and update pending requests

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fal } from 'https://esm.sh/@fal-ai/client@1.6.2'

const FAL_AI_API_KEY = Deno.env.get('FAL_AI_API_KEY') || Deno.env.get('FAL_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

if (!FAL_AI_API_KEY) {
  console.error('FAL_AI_API_KEY is not configured')
}

// Initialize FAL client
fal.config({
  credentials: FAL_AI_API_KEY
})

// Initialize Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    // Only allow POST requests from cron
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Verify this is a cron request (optional but recommended)
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    console.log('[VideoQueueProcessor] Starting queue processing...')

    // Fetch pending requests from database
    const { data: pendingRequests, error: fetchError } = await supabase
      .from('test_results')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true })
      .limit(50)

    if (fetchError) {
      console.error('[VideoQueueProcessor] Error fetching pending requests:', fetchError)
      return new Response(JSON.stringify({ error: 'Failed to fetch pending requests' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('[VideoQueueProcessor] No pending requests to process')
      return new Response(JSON.stringify({ message: 'No pending requests', processed: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`[VideoQueueProcessor] Found ${pendingRequests.length} pending requests`)

    let processed = 0
    let completed = 0
    let failed = 0

    // Process each pending request
    for (const request of pendingRequests) {
      try {
        // Only process video requests
        if (request.type !== 'video' || !request.request_id) {
          continue
        }

        console.log(`[VideoQueueProcessor] Processing request ${request.id} (FAL: ${request.request_id})`)

        // Check FAL status
        const status = await fal.queue.status("fal-ai/kling-video/o3/pro/reference-to-video", {
          requestId: request.request_id,
          logs: true
        })

        console.log(`[VideoQueueProcessor] Request ${request.id} status: ${status.status}`)

        if (status.status === 'COMPLETED') {
          // Get the result
          const result = await fal.queue.result("fal-ai/kling-video/o3/pro/reference-to-video", {
            requestId: request.request_id
          })

          // Extract video URL
          let videoUrl: string | undefined
          if (result.data && result.data.video && result.data.video.url) {
            videoUrl = result.data.video.url
          } else if (result.data && result.data.url) {
            videoUrl = result.data.url
          }

          if (videoUrl) {
            // Update database with completed result
            const { error: updateError } = await supabase
              .from('test_results')
              .update({
                status: 'completed',
                url: videoUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', request.id)

            if (updateError) {
              console.error(`[VideoQueueProcessor] Error updating request ${request.id}:`, updateError)
            } else {
              console.log(`[VideoQueueProcessor] Request ${request.id} completed successfully`)
              completed++
            }
          } else {
            throw new Error('No video URL in completed result')
          }
        } else if (status.status === 'IN_PROGRESS') {
          // Update status to processing if still pending
          if (request.status === 'pending') {
            const { error: updateError } = await supabase
              .from('test_results')
              .update({
                status: 'processing',
                updated_at: new Date().toISOString()
              })
              .eq('id', request.id)

            if (!updateError) {
              console.log(`[VideoQueueProcessor] Request ${request.id} marked as processing`)
            }
          }
        }
        // Note: IN_QUEUE status means we should check again later

        processed++

      } catch (error: any) {
        console.error(`[VideoQueueProcessor] Error processing request ${request.id}:`, error.message)

        // Mark as failed if there's a fatal error
        const { error: updateError } = await supabase
          .from('test_results')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id)

        if (!updateError) {
          failed++
        }

        processed++
      }
    }

    const response = {
      message: 'Queue processing completed',
      processed,
      completed,
      failed,
      remaining: pendingRequests.length - processed
    }

    console.log('[VideoQueueProcessor] Completed:', response)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('[VideoQueueProcessor] Fatal error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
