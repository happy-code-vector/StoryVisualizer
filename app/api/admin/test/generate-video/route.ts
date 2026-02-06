import { NextRequest, NextResponse } from 'next/server'
import { createTestResult } from '@/lib/test-results-db'
import { fal } from '@fal-ai/client'

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

// Test video generation using Kling model with best quality settings
async function generateTestVideo(
  prompt: string,
  referenceImageUrls?: string[],
  duration?: number,
  aspectRatio?: string,
  generateAudio?: boolean
): Promise<string> {
  if (!FAL_AI_API_KEY) {
    throw new Error('FAL_AI_API_KEY is not configured')
  }

  try {
    console.log(`[TestVideo] Generating video with Kling O3 Pro${referenceImageUrls?.length ? ` with ${referenceImageUrls.length} reference images` : ''}`)

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

    // Use fal.subscribe() to handle long-running tasks with automatic polling
    const result = await fal.subscribe("fal-ai/kling-video/o3/pro/reference-to-video", {
      input: input,
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`[TestVideo] Status: ${update.status}`)
        // Only IN_PROGRESS has logs
        if (update.status === "IN_PROGRESS") {
          update.logs.forEach((log) => {
            console.log(`[TestVideo] Log: ${log.message}`)
          })
        }
      },
    })

    console.log('[TestVideo] FAL response received:', result)

    // Extract video URL from result
    if (result.data && result.data.video && result.data.video.url) {
      return result.data.video.url
    }

    // Some models return the URL directly
    if (result.data && result.data.url) {
      return result.data.url
    }

    throw new Error('No video URL in response')

  } catch (error: any) {
    console.error('[TestVideo] Error generating test video:', error)
    throw error
  }
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

    console.log(`[TestVideo] Video generation request received${referenceImageUrls?.length ? ` with ${referenceImageUrls.length} reference images` : ''}${duration ? ` with ${duration}s duration` : ''}${aspectRatio ? ` with ${aspectRatio} aspect ratio` : ''}${generateAudio ? ` with audio generation` : ''}`)

    const videoUrl = await generateTestVideo(prompt, referenceImageUrls, duration, aspectRatio, generateAudio)

    console.log(`[TestVideo] Successfully generated video`)

    // Save result to database
    try {
      await createTestResult({
        type: 'video',
        url: videoUrl,
        prompt: prompt,
        model: `kling-o3-pro${duration ? ` (${duration}s)` : ''}${aspectRatio ? ` (${aspectRatio})` : ''}${generateAudio ? ` (audio)` : ''}`
      })
      console.log(`[TestVideo] Saved result to database`)
    } catch (dbError) {
      console.error('[TestVideo] Failed to save to database:', dbError)
      // Don't fail the request if DB save fails
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      model: 'kling-o3-pro',
      referenceImageCount: referenceImageUrls?.length || 0,
      duration,
      aspectRatio,
      generateAudio
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

    if (error.message?.includes('queue')) {
      return NextResponse.json(
        { error: 'Request queued. Please try again in a few moments.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    )
  }
}
