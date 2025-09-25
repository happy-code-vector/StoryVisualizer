// Fal AI service for image generation
const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY

// Function to generate a character image
export async function generateCharacterImage(character: {
  name: string
  description: string
  attributes: string[]
}): Promise<string> {
  if (!FAL_AI_API_KEY) {
    console.warn('FAL_AI_API_KEY is not set, using placeholder image')
    return `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(character.name)}`
  }

  try {
    // Create a prompt for the character image
    const prompt = `A portrait of ${character.name}, ${character.description.toLowerCase()}, ${
      character.attributes.length > 0 
        ? character.attributes.join(', ') 
        : 'detailed character design'
    }, high quality, detailed, ultra realistic style`

    // Call the Fal AI API
    const response = await fetch('https://api.fal.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'fal-ai/fast-sdxl',
        prompt: prompt,
        negative_prompt: 'low quality, blurry, distorted, deformed, ugly, bad anatomy',
        image_size: 'square',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to generate character image')
    }

    const data = await response.json()
    
    // Return the generated image URL
    if (data.images && data.images.length > 0) {
      return data.images[0].url
    } else {
      throw new Error('No image generated')
    }
  } catch (error) {
    console.error('Error generating character image:', error)
    // Fallback to placeholder
    return `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(character.name)}`
  }
}

// Function to generate a scene image
export async function generateSceneImage(scene: {
  setting: string
  timeOfDay: string
  mood: string
  description: string
}): Promise<string> {
  if (!FAL_AI_API_KEY) {
    console.warn('FAL_AI_API_KEY is not set, using placeholder image')
    return `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(scene.setting)}`
  }

  try {
    // Create a prompt for the scene image
    const prompt = `${scene.description}, ${scene.setting}, ${scene.timeOfDay}, ${scene.mood}, cinematic, detailed environment, high quality, ultra realistic style`

    // Call the Fal AI API
    const response = await fetch('https://api.fal.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'fal-ai/fast-sdxl',
        prompt: prompt,
        negative_prompt: 'low quality, blurry, distorted, deformed, ugly, bad anatomy',
        image_size: 'landscape',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to generate scene image')
    }

    const data = await response.json()
    
    // Return the generated image URL
    if (data.images && data.images.length > 0) {
      return data.images[0].url
    } else {
      throw new Error('No image generated')
    }
  } catch (error) {
    console.error('Error generating scene image:', error)
    // Fallback to placeholder
    return `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(scene.setting)}`
  }
}