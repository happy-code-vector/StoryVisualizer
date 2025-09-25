import { NextResponse } from 'next/server'
import {fal} from '@fal-ai/client'

fal.config({
    credentials: process.env.FAL_AI_API_KEY,
})

async function generateCharacterImage(character: {
  name: string
  description: string
  attributes: string[]
}): Promise<string> {

  try {
    const prompt = `A portrait of ${character.name}, ${character.description.toLowerCase()}, ${
      character.attributes.length > 0 
        ? character.attributes.join(', ') 
        : 'detailed character design'
    }, high quality, detailed, ultra realistic style`

    const response = await fal.subscribe('/fal-ai/flux/dev', {
      input:{
        prompt: prompt,
        image_size: 'square',
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