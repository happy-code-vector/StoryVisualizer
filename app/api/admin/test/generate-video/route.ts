import { NextRequest, NextResponse } from 'next/server'

interface TestVideoRequest {
  prompt: string
  referenceImageUrl?: string
}

// Test video generation using Kling model without saving to database
async function generateTestVideo(prompt: string, referenceImageUrl?: string): Promise<string> {
  const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY || process.env.FAL_KEY

  if (!FAL_AI_API_KEY) {
    throw new Error('FAL_AI_API_KEY is not configured')
  }

  try {
    console.log(`[TestVideo] Generating video with Kling model`)

    // Use Kling video model from FAL
    // Kling model: fal-ai/kling-video
    const endpoint = 'https://fal.run/fal-ai/kling-video'

    const requestBody: any = {
      prompt: prompt,
    }

    // Add reference image if provided (image-to-video mode)
    if (referenceImageUrl) {
      requestBody.image_url = referenceImageUrl
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
    const { prompt, referenceImageUrl } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log(`[TestVideo] Video generation request received${referenceImageUrl ? ' with reference image' : ''}`)

    const videoUrl = await generateTestVideo(prompt, referenceImageUrl)

    console.log(`[TestVideo] Successfully generated video`)

    return NextResponse.json({
      success: true,
      videoUrl,
      model: 'kling-video',
      hasReferenceImage: !!referenceImageUrl
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
