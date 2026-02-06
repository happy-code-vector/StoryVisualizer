import { createTestResult } from '@/lib/test-results-db'

export interface VideoRequestStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestId: string
  videoUrl?: string
  error?: string
  createdAt: number
  prompt: string
  model: string
}

// In-memory storage for request status
// In production, use Redis or database for persistence across server restarts
const requestStore = new Map<string, VideoRequestStatus>()

export function setRequestStatus(
  localRequestId: string,
  falRequestId: string,
  prompt: string,
  model: string
) {
  requestStore.set(localRequestId, {
    status: 'pending',
    requestId: falRequestId,
    createdAt: Date.now(),
    prompt,
    model
  })
}

export function getRequestStatus(requestId: string): VideoRequestStatus | undefined {
  return requestStore.get(requestId)
}

export function updateRequestStatus(
  requestId: string,
  updates: Partial<Omit<VideoRequestStatus, 'requestId' | 'createdAt' | 'prompt' | 'model'>>
) {
  const current = requestStore.get(requestId)
  if (current) {
    requestStore.set(requestId, { ...current, ...updates })
  }
}

export function deleteRequest(requestId: string) {
  requestStore.delete(requestId)
}

export function cleanupOldRequests(maxAgeMs: number = 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs
  for (const [key, value] of requestStore.entries()) {
    if (value.createdAt < cutoff) {
      requestStore.delete(key)
    }
  }
}

// Process video asynchronously and update status
export async function processVideoAsync(
  localRequestId: string,
  falRequestId: string,
  input: any,
  prompt: string,
  model: string
) {
  try {
    console.log(`[VideoStore] Processing video for request ${localRequestId}`)

    // Import fal dynamically to avoid module loading issues
    const { fal } = await import('@fal-ai/client')

    // Update status to processing
    updateRequestStatus(localRequestId, { status: 'processing' })

    // Subscribe to updates
    const result = await fal.subscribe("fal-ai/kling-video/o3/pro/reference-to-video", {
      input: input,
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`[VideoStore] Status for ${localRequestId}: ${update.status}`)
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) => {
            console.log(`[VideoStore] Log: ${log.message}`)
          })
        }
      },
    })

    console.log('[VideoStore] FAL response received:', result)

    // Extract video URL from result
    let videoUrl: string | undefined
    if (result.data && result.data.video && result.data.video.url) {
      videoUrl = result.data.video.url
    } else if (result.data && result.data.url) {
      videoUrl = result.data.url
    }

    if (!videoUrl) {
      throw new Error('No video URL in response')
    }

    // Update store with result
    updateRequestStatus(localRequestId, {
      status: 'completed',
      videoUrl
    })

    console.log(`[VideoStore] Successfully generated video for ${localRequestId}`)

    // Save to test results database
    try {
      await createTestResult({
        type: 'video',
        url: videoUrl,
        prompt,
        model
      })
      console.log(`[VideoStore] Saved result to database`)
    } catch (dbError) {
      console.error('[VideoStore] Failed to save to database:', dbError)
    }

    // Clean up old requests (older than 1 hour)
    cleanupOldRequests()

  } catch (error: any) {
    console.error(`[VideoStore] Error processing video for ${localRequestId}:`, error)

    updateRequestStatus(localRequestId, {
      status: 'failed',
      error: error.message || 'Unknown error'
    })
  }
}
