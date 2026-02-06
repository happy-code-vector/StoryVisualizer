import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { createTestResult } from '@/lib/test-results-db'

// Initialize FAL client
const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY || process.env.FAL_KEY

if (FAL_AI_API_KEY) {
  fal.config({
    credentials: FAL_AI_API_KEY
  })
}

interface TestVideoRequest {
  prompt: string
  referenceImageUrls?: string[]
  duration?: number
  aspectRatio?: string
  generateAudio?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: TestVideoRequest = await request.json()
    const { prompt, referenceImageUrls, duration, aspectRatio, generateAudio } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!FAL_AI_API_KEY) {
      throw new Error('FAL_AI_API_KEY is not configured')
    }

    console.log(`[TestVideo] Video generation request received${referenceImageUrls?.length ? ` with ${referenceImageUrls.length} reference images` : ''}${duration ? ` with ${duration}s duration` : ''}${aspectRatio ? ` with ${aspectRatio} aspect ratio` : ''}${generateAudio ? ` with audio generation` : ''}`)

    // Build input object for FAL
    const input: any = {
      prompt: prompt,
    }

    // Add reference images if provided
    if (referenceImageUrls && referenceImageUrls.length > 0) {
      input.image_urls = referenceImageUrls
    }

    // Add duration if provided
    if (duration) {
      input.duration = duration.toString()
    }

    // Add aspect ratio if provided
    if (aspectRatio) {
      input.aspect_ratio = aspectRatio
    }

    // Add generate_audio option if provided
    if (generateAudio !== undefined) {
      input.generate_audio = generateAudio
    }

    console.log('[TestVideo] Request payload:', input)

    // Submit to FAL queue and get request ID immediately
    const queueStatus = await fal.queue.submit("fal-ai/kling-video/o3/pro/reference-to-video", {
      input: input,
    })

    console.log('[TestVideo] Job submitted to FAL queue:', queueStatus.request_id)

    const model = `kling-o3-pro${duration ? ` (${duration}s)` : ''}${aspectRatio ? ` (${aspectRatio})` : ''}${generateAudio ? ` (audio)` : ''}`

    // Save pending request to database
    const resultId = await createTestResult({
      type: 'video',
      prompt,
      model,
      status: 'pending',
      request_id: queueStatus.request_id
    })

    if (!resultId) {
      throw new Error('Failed to save request to database')
    }

    console.log('[TestVideo] Saved pending request to database with ID:', resultId)

    // Return immediately with database ID
    return NextResponse.json({
      success: true,
      id: resultId,
      requestId: queueStatus.request_id,
      status: 'pending',
      message: 'Video generation job submitted and added to queue.'
    })

  } catch (error: any) {
    console.error('[TestVideo] Error:', error)

    // Handle specific errors
    if (error.message?.includes('insufficient credits')) {
      return NextResponse.json(
        { error: 'Insufficient credits for video generation' },
        { status: 402 }
      )
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit video generation job' },
      { status: 500 }
    )
  }
}
