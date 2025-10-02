import { NextRequest, NextResponse } from 'next/server'
import * as fal from '@fal-ai/client'

// Configure FAL client
fal.config({
  credentials: process.env.FAL_KEY,
})

interface VideoGenerationRequest {
  imageUrl: string
  scene: {
    id: number
    title: string
    description: string
    duration: number
  }
  modelName: string
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json()
    const { imageUrl, scene, modelName } = body

    if (!imageUrl || !scene || !modelName) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, scene, and modelName are required' },
        { status: 400 }
      )
    }

    console.log(`[VideoGeneration] Generating video for scene "${scene.title}" using model "${modelName}"`)

    // Prepare the video generation prompt based on scene details
    const videoPrompt = `${scene.description}. Duration: ${scene.duration || 5} seconds. Cinematic style with smooth camera movement.`

    let result
    let videoUrl

    try {
      // Handle different video models
      switch (modelName.toLowerCase()) {
        case 'stable-video-diffusion':
        case 'svd':
          result = await fal.subscribe('fal-ai/stable-video-diffusion', {
            input: {
              image_url: imageUrl,
              motion_bucket_id: 180, // Control motion intensity (1-255, higher = more motion)
              cond_aug: 0.02, // Conditioning augmentation (0.0-1.0)
              seed: Math.floor(Math.random() * 1000000),
              fps: 8, // Frames per second
              num_frames: Math.min(scene.duration * 8, 25), // Max 25 frames for SVD
            },
          })
          videoUrl = result.video?.url
          break

        case 'runway-gen2':
          result = await fal.subscribe('fal-ai/runway-gen2', {
            input: {
              image_url: imageUrl,
              text: videoPrompt,
              duration: Math.min(scene.duration, 16), // Max 16 seconds for Runway
              watermark: false,
            },
          })
          videoUrl = result.video?.url
          break

        case 'pika-labs':
          result = await fal.subscribe('fal-ai/pika-labs', {
            input: {
              image_url: imageUrl,
              prompt: videoPrompt,
              duration: scene.duration || 5,
              fps: 24,
            },
          })
          videoUrl = result.video?.url
          break

        default:
          // Default to stable-video-diffusion if model not recognized
          result = await fal.subscribe('fal-ai/stable-video-diffusion', {
            input: {
              image_url: imageUrl,
              motion_bucket_id: 180,
              cond_aug: 0.02,
              seed: Math.floor(Math.random() * 1000000),
              fps: 8,
              num_frames: Math.min(scene.duration * 8, 25),
            },
          })
          videoUrl = result.video?.url
          break
      }

      if (!videoUrl) {
        throw new Error('Video generation failed - no video URL returned')
      }

      console.log(`[VideoGeneration] Successfully generated video for scene "${scene.title}"`)

      return NextResponse.json({
        success: true,
        videoUrl: videoUrl,
        model: modelName,
        sceneId: scene.id,
        duration: scene.duration
      })

    } catch (falError: any) {
      console.error(`[VideoGeneration] FAL API error for scene "${scene.title}":`, falError)
      
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
    console.error('[VideoGeneration] Unexpected error:', error)
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}