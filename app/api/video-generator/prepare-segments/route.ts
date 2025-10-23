import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { story, settings } = await request.json()

    const totalSeconds = settings.duration * 60
    const segmentCount = Math.ceil(totalSeconds / settings.segmentLength)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a video production expert. Create ${segmentCount} detailed visual prompts for AI video generation. Each prompt should:
- Be highly descriptive and visual
- Match the ${settings.style} style
- Be suitable for ${settings.segmentLength} second clips
- Flow smoothly from one to the next
- Include camera angles, lighting, and mood

You MUST respond with valid JSON only, no other text. Use this exact structure:
{
  "segments": ["prompt 1", "prompt 2", ...]
}`
        },
        {
          role: 'user',
          content: `Create ${segmentCount} video prompts for this story in ${settings.style} style. Respond with JSON only:\n\n${story}`
        }
      ],
      temperature: 0.7
    })

    const content = completion.choices[0].message.content || '{}'
    const result = JSON.parse(content)
    const segments = result.segments || []

    return NextResponse.json({ segments })
  } catch (error) {
    console.error('Segment preparation error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare segments' },
      { status: 500 }
    )
  }
}
