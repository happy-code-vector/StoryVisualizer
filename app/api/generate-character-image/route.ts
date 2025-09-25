import { NextResponse } from 'next/server'

// Function to generate a character image using Fal AI directly
async function generateCharacterImage(character: {
  name: string
  description: string
  attributes: string[]
}): Promise<string> {
  const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY
  
  if (!FAL_AI_API_KEY) {
    throw new Error('FAL_AI_API_KEY is not set')
  }

  try {
    // Create a prompt for the character image
    const prompt = `A portrait of ${character.name}, ${character.description.toLowerCase()}, ${
      character.attributes.length > 0 
        ? character.attributes.join(', ') 
        : 'detailed character design'
    }, high quality, detailed, ultra realistic style`

    // Call the Fal AI API for text-to-image generation (flux dev model)
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: 'square',
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
    console.error('Error generating character image with Fal AI:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const character = await request.json()
    
    if (!character) {
      return NextResponse.json({ error: 'Character data is required' }, { status: 400 })
    }

    const imageUrl = await generateCharacterImage(character)
    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error('Error in generate-character-image API:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate character image' }, { status: 500 })
  }
}