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
          content: `You are a video production expert. Analyze stories and break them into scenes for video generation. 

IMPORTANT: Determine an appropriate total duration based on the story content and complexity. The story length and detail should guide your decision.

Each scene should:
- Be 5-12 seconds long (adjust based on content importance)
- Have a CONCRETE visual description (avoid abstract terms)
- Flow smoothly to the next scene
- Be specific and detailed for AI video generation

VISUAL PROMPT GUIDELINES:
✓ DO describe: specific colors, shapes, textures, lighting direction, facial expressions, body language, clothing details, environmental elements
✓ DO use: "warm orange sunset light", "weathered wooden table", "person with furrowed brow and downcast eyes"
✗ DON'T use: "hyper-realistic", "modern", "professional", "high-quality", "stunning", "beautiful", "amazing"
✗ DON'T use abstract style terms - describe what you SEE, not how it should feel

Example GOOD prompt: "A woman in her 40s with shoulder-length brown hair, wearing a blue cotton shirt, sitting at a wooden kitchen table with morning sunlight streaming through a window behind her, casting long shadows across the table surface"

Example BAD prompt: "A modern professional woman in a beautiful kitchen with stunning lighting and hyper-realistic details"

You MUST respond with valid JSON only, no other text. Use this exact structure:
{
  "scenes": [
    {
      "id": 0,
      "text": "scene narrative text",
      "duration": 8,
      "visualPrompt": "detailed concrete visual description"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Break this story into scenes for video generation. Create CONCRETE visual descriptions (colors, shapes, lighting, expressions) without abstract terms. Respond with JSON only:\n\n${story}`
        }
      ],
      temperature: 0.7
    })

    const content = completion.choices[0].message.content || '{}'
    const result = JSON.parse(content)
    const scenes = result.scenes || []

    // Calculate actual total duration
    const actualTotal = scenes.reduce((sum: number, scene: any) => sum + (scene.duration || 0), 0)
    console.log(`[Scene Analysis] Total: ${actualTotal}s (${(actualTotal/60).toFixed(1)} min), Scenes: ${scenes.length}`)

    return NextResponse.json({ scenes, actualDuration: actualTotal })
  } catch (error) {
    console.error('Story analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze story' },
      { status: 500 }
    )
  }
}
