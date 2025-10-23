import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { story } = await request.json()

    if (!story) {
      return NextResponse.json({ error: 'Story is required' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a video production expert. Analyze stories and break them into scenes for video generation. Each scene should:
- Be 6-10 seconds long
- Have a clear visual description
- Flow smoothly to the next scene
- Be specific and detailed for AI video generation

You MUST respond with valid JSON only, no other text. Use this exact structure:
{
  "scenes": [
    {
      "id": 0,
      "text": "scene narrative text",
      "duration": 8,
      "visualPrompt": "detailed visual description for AI generation"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Break this story into scenes for video generation. Respond with JSON only:\n\n${story}`
        }
      ],
      temperature: 0.7
    })

    const content = completion.choices[0].message.content || '{}'
    const result = JSON.parse(content)
    const scenes = result.scenes || []

    return NextResponse.json({ scenes })
  } catch (error) {
    console.error('Story analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze story' },
      { status: 500 }
    )
  }
}
