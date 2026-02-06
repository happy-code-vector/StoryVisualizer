import { NextRequest, NextResponse } from 'next/server'
import { createTestResult } from '@/lib/test-results-db'

interface TestVideoRequest {
  prompt: string
  referenceImageUrls?: string[]
}

// Test video generation using Kling model with best quality settings
async function generateTestVideo(prompt: string, referenceImageUrls?: string[]): Promise<string> {
  const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY || process.env.FAL_KEY

  if (!FAL_AI_API_KEY) {
    throw new Error('FAL_AI_API_KEY is not configured')
  }

  try {
    console.log(`[TestVideo] Generating video with Kling O3 Pro${referenceImageUrls?.length ? ` with ${referenceImageUrls.length} reference images` : ''}`)

    // Use Kling O3 Pro reference-to-video model from FAL
    const endpoint = 'https://fal.run/fal-ai/kling-video/o3/pro/reference-to-video'

    const requestBody: any = {
      prompt: prompt,
    }

    // Add reference images if provided
    if (referenceImageUrls && referenceImageUrls.length > 0) {
      // Use first image as primary reference
      requestBody.image_url = referenceImageUrls[0]

      // If multiple images provided, add them as additional references
      if (referenceImageUrls.length > 1) {
        requestBody.image_urls = referenceImageUrls
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || `Fal AI API error: ${response.status}`
      console.error('[TestVideo] Kling API error:', errorData)
      throw new Error(errorMessage)
    }

    const data = await response.json()

    // Check for video result
    if (data.video && data.video.url) {
      return data.video.url
    }

    // Some models return the URL directly
    if (data.url) {
      return data.url
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
    const { prompt, referenceImageUrls } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log(`[TestVideo] Video generation request received${referenceImageUrls?.length ? ` with ${referenceImageUrls.length} reference images` : ''}`)

    const videoUrl = await generateTestVideo(prompt, referenceImageUrls)

    console.log(`[TestVideo] Successfully generated video`)

    // Save result to database
    try {
      createTestResult({
        type: 'video',
        url: videoUrl,
        prompt: prompt,
        model: 'kling-o3-pro'
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
      referenceImageCount: referenceImageUrls?.length || 0
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
