import { NextResponse } from 'next/server'

// Function to generate a scene image using Fal AI directly
async function generateSceneImage(scene: {
  setting: string
  timeOfDay: string
  mood: string
  description: string
}): Promise<string> {
  const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY
  
  if (!FAL_AI_API_KEY) {
    throw new Error('FAL_AI_API_KEY is not set')
  }

  try {
    // Create a prompt for the scene image
    const prompt = `${scene.description}, ${scene.setting}, ${scene.timeOfDay}, ${scene.mood}, cinematic, detailed environment, high quality, ultra realistic style`

    // Call the Fal AI API for text-to-image generation (flux dev model)
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: 'landscape',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Fal AI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Return the generated image URL
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