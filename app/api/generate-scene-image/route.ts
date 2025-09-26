import { NextResponse } from 'next/server'

async function generateSceneImage(scene: {
  setting: string
  timeOfDay: string
  mood: string
  description: string
  characterImages?: string[]
}): Promise<string> {

  const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY
  
  if (!FAL_AI_API_KEY) {
    throw new Error('FAL_AI_API_KEY is not set')
  }

  try {
    const prompt = `${scene.description}, ${scene.setting}, ${scene.timeOfDay}, ${scene.mood}, detailed environment, high quality, ultra realistic style`
    
    console.log(scene)
    // If we have character images, we'll use image-to-image generation
    if (scene.characterImages && scene.characterImages.length > 0) {
      console.log(`[SceneImage] Generating scene image with ${scene.characterImages.length} character references`)
      
      const response = await fetch('https://fal.run/fal-ai/nano-banana/edit', {
        method: 'POST',
        headers: {
            'Authorization': `Key ${FAL_AI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image_urls: scene.characterImages,
            prompt: prompt,
            strength: 0,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            num_images: 1,
            enable_safety_checker: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Fal AI API error: ${response.status} - ${response.statusText}`;
        console.error('[SceneImage] Fal AI API error response:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json()
      
      if (data.images && data.images.length > 0) {
        return data.images[0].url
      } else {
        throw new Error('No image generated')
      }
    } else {
      console.log("[SceneImage] Generating scene image without character references")
      
      const response = await fetch('https://fal.run/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
            'Authorization': `Key ${FAL_AI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            image_size: 'landscape_16_9',
            num_inference_steps: 25,
            guidance_scale: 7.5,
            num_images: 1,
            enable_safety_checker: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Fal AI API error: ${response.status} - ${response.statusText}`;
        console.error('[SceneImage] Fal AI API error response:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json()
      
      if (data.images && data.images.length > 0) {
        return data.images[0].url
      } else {
        throw new Error('No image generated')
      }
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