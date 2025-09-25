import { NextResponse } from 'next/server'
import {fal} from '@fal-ai/client'

fal.config({
    credentials: process.env.FAL_AI_API_KEY,
})

async function generateSceneImage(scene: {
  setting: string
  timeOfDay: string
  mood: string
  description: string
}): Promise<string> {

  try {
    const prompt = `${scene.description}, ${scene.setting}, ${scene.timeOfDay}, ${scene.mood}, cinematic, detailed environment, high quality, ultra realistic style`

    const response = await fal.subscribe('/fal-ai/gemini-flash-edit/multi', {
      input: {
        prompt: prompt,
        input_image_urls: ["https://example.com/path/to/your/image.jpg"],
        image_size: 'landscape_16_9',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true
      },
    })

    const data = await response.data
    
    if (data.images && data.images.length > 0) {
      return data.images[0].url
    } else {
      throw new Error('No image generated')
    }
  } catch (error: any) {
    console.error('Error generating scene image with Fal AI:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const scene = await request.json()
    
    if (!scene) {
      return NextResponse.json({ error: 'Scene data is required' }, { status: 400 })
    }

    const imageUrl = await generateSceneImage(scene)
    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error('Error in generate-scene-image API:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate scene image' }, { status: 500 })
  }
}