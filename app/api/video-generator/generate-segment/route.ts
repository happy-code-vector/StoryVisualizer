import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY || process.env.FAL_KEY

    if (!FAL_AI_API_KEY) {
      return NextResponse.json(
        { error: 'FAL_AI_API_KEY or FAL_KEY environment variable is not configured' },
        { status: 500 }
      )
    }

    const { prompt, settings, segmentIndex } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log(`[VideoGenerator] Generating segment ${segmentIndex + 1} with prompt: ${prompt.substring(0, 100)}...`)

    const enhancedPrompt = `${prompt}. ${settings.style} style, cinematic, high quality, professional`

    try {
      // Step 1: Generate an image from the prompt using FLUX
      console.log(`[VideoGenerator] Step 1: Generating image for segment ${segmentIndex + 1}`)

      const imageSize = settings.aspectRatio === '9:16' ? 'portrait_4_3' :
        settings.aspectRatio === '1:1' ? 'square' : 'landscape_16_9'

      const imageResponse = await fetch('https://fal.run/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_size: imageSize,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true
        })
      })

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || `Fal AI API error: ${imageResponse.status} - ${imageResponse.statusText}`
        console.error('[VideoGenerator] Image generation error:', errorData)
        throw new Error(errorMessage)
      }

      const imageData = await imageResponse.json()
      const imageUrl = imageData.images?.[0]?.url

      if (!imageUrl) {
        throw new Error('Image generation failed - no image URL returned')
      }

      console.log(`[VideoGenerator] Step 2: Generating video from image for segment ${segmentIndex + 1}`)

      // Step 2: Convert image to video using wan-25-preview/image-to-video
      const videoResponse = await fetch('https://fal.run/fal-ai/wan-25-preview/image-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: enhancedPrompt,
          duration: settings.segmentLength || 10,
        })
      })

      if (!videoResponse.ok) {
        const errorData = await videoResponse.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || `Fal AI API error: ${videoResponse.status} - ${videoResponse.statusText}`
        console.error('[VideoGenerator] Video generation error:', errorData)
        throw new Error(errorMessage)
      }

      const videoData = await videoResponse.json()
      const videoUrl = videoData.video?.url

      if (!videoUrl) {
        throw new Error('Video generation failed - no video URL returned')
      }

      console.log(`[VideoGenerator] Successfully generated segment ${segmentIndex + 1}`)

      return NextResponse.json({
        videoUrl,
        segmentIndex
      })

    } catch (falError: any) {
      console.error(`[VideoGenerator] FAL API error for segment ${segmentIndex + 1}:`, falError)

      // Handle specific FAL errors
      if (falError.message?.includes('insufficient credits')) {
        return NextResponse.json(
          { error: 'Insufficient credits for video generation' },
          { status: 402 }
        )
      }

      if (falError.message?.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `Video generation failed: ${falError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[VideoGenerator] Unexpected error:', error)
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
