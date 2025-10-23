import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json()

    if (!idea) {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional storyteller and screenwriter. Convert user ideas into compelling, detailed stories suitable for video production. 

IMPORTANT: If the user mentions a specific duration (e.g., "5-minute video", "10 minutes long"), create a story appropriate for that length. If no duration is mentioned, create a story that would work well for a 2-3 minute video.

The story should:
- Have a clear beginning, middle, and end
- Include vivid visual descriptions
- Be engaging and cinematic
- Flow naturally from scene to scene
- Match the requested or implied duration
- Each scene should have clear visual elements that can be captured on video

Adjust the level of detail based on duration:
- Short (1-3 min): Concise, focused on key moments
- Medium (4-10 min): Moderately detailed with multiple scenes
- Long (10+ min): Comprehensive and richly detailed`
        },
        {
          role: 'user',
          content: `Create a detailed story from this idea: ${idea}`
        }
      ],
      temperature: 0.8,
      max_tokens: 2500
    })

    const story = completion.choices[0].message.content

    return NextResponse.json({ story })
  } catch (error) {
    console.error('Story generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate story' },
      { status: 500 }
    )
  }
}
