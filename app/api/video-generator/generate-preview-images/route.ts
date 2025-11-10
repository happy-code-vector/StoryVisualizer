import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { segments } = await request.json()

    if (!segments || segments.length === 0) {
      return NextResponse.json({ error: 'No segments provided' }, { status: 400 })
    }

    // Generate images for all segments in parallel
    const imagePromises = segments.map(async (segment: any, index: number) => {
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: segment.imagePrompt || segment.prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        })

        return {
          segmentId: segment.id,
          imageUrl: response.data[0].url,
          status: 'completed'
        }
      } catch (error: any) {
        console.error(`Failed to generate image for segment ${index}:`, error)
        return {
          segmentId: segment.id,
          imageUrl: null,
          status: 'failed',
          error: error.message || 'Image generation failed'
        }
      }
    })

    const results = await Promise.allSettled(imagePromises)
    
    const images = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          segmentId: segments[index].id,
          imageUrl: null,
          status: 'failed',
          error: result.reason?.message || 'Unknown error'
        }
      }
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Preview image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview images' },
      { status: 500 }
    )
  }
}
