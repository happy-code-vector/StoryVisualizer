import { NextRequest, NextResponse } from 'next/server'
import { getModelByName } from '@/lib/supabase-service'

interface TestImageRequest {
  prompt: string
  modelName: string
  type: 'character' | 'scene'
}

// Test image generation without saving to database
async function generateTestImage(prompt: string, modelName: string, type: 'character' | 'scene'): Promise<string> {
  const FAL_AI_API_KEY = process.env.FAL_AI_API_KEY || process.env.FAL_KEY

  if (!FAL_AI_API_KEY) {
    throw new Error('FAL_AI_API_KEY is not configured')
  }

  // Get the model link from the database
  const model = await getModelByName(modelName)
  if (!model) {
    throw new Error(`Model "${modelName}" not found`)
  }

  const modelLink = model.link

  try {
    // Build the prompt based on type
    const enhancedPrompt = type === 'character'
      ? `A portrait of ${prompt}, high quality, detailed, ultra realistic style, professional photography`
      : `${prompt}, detailed environment, cinematic, high quality, ultra realistic style`

    const response = await fetch(modelLink, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_size: type === 'character' ? 'square' : 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || `Fal AI API error: ${response.status}`
      console.error('[TestImage] Fal AI API error:', errorData)
      throw new Error(errorMessage)
    }

    const data = await response.json()

    if (data.images && data.images.length > 0) {
      return data.images[0].url
    } else {
      throw new Error('No image generated')
    }
  } catch (error: any) {
    console.error('[TestImage] Error generating test image:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TestImageRequest = await request.json()
    const { prompt, modelName, type } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!modelName) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      )
    }

    if (!type || !['character', 'scene'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "character" or "scene"' },
        { status: 400 }
      )
    }

    console.log(`[TestImage] Generating ${type} image with model "${modelName}"`)

    const imageUrl = await generateTestImage(prompt, modelName, type)

    console.log(`[TestImage] Successfully generated image`)

    return NextResponse.json({
      success: true,
      imageUrl,
      model: modelName,
      type
    })

  } catch (error: any) {
    console.error('[TestImage] Error:', error)

    // Handle specific errors
    if (error.message?.includes('insufficient credits')) {
      return NextResponse.json(
        { error: 'Insufficient credits for image generation' },
        { status: 402 }
      )
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
