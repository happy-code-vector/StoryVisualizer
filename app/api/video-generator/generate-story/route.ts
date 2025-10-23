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
          content: `You are a professional storyteller and screenwriter. Convert user ideas into compelling, detailed stories suitable for video production. The story should:
- Have a clear beginning, middle, and end
- Include vivid visual descriptions
- Be engaging and cinematic
- Flow naturally from scene to scene
- Be appropriate for the requested duration`
        },
        {
          role: 'user',
          content: `Create a detailed story from this idea: ${idea}`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
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
