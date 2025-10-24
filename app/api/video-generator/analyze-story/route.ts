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

CRITICAL: MAINTAIN CONSISTENCY across all scenes:
- Same time period/era throughout (e.g., if Tang Dynasty, ALL scenes must be Tang Dynasty China, 618-907 CE)
- Same geographical/cultural setting (e.g., if China, NO European architecture or clothing)
- Same characters with consistent appearance (same age, clothing style, hair)
- Same visual style and color palette throughout
- Same architectural style (e.g., Tang Dynasty = curved roofs, red pillars, wooden structures)

IMPORTANT: Determine an appropriate total duration based on the story content and complexity.

Each scene should:
- Be 5-12 seconds long (adjust based on content importance)
- Have a CONCRETE visual description (avoid abstract terms)
- MAINTAIN CONSISTENCY with the story's setting, time period, and characters
- Flow smoothly to the next scene
- Be specific and detailed for AI video generation

VISUAL PROMPT GUIDELINES:
✓ DO describe: specific colors, shapes, textures, lighting direction, facial expressions, body language, clothing details, environmental elements
✓ DO specify: time period, architectural style, cultural context, clothing appropriate to era
✓ DO use: "warm orange sunset light", "weathered wooden table", "person with furrowed brow and downcast eyes"
✗ DON'T use: "hyper-realistic", "modern", "professional", "high-quality", "stunning", "beautiful", "amazing"
✗ DON'T mix: different time periods, cultures, or architectural styles

Example GOOD prompt for Tang Dynasty: "A man in his 30s wearing traditional Tang Dynasty silk robes with wide sleeves in deep blue and gold patterns, standing in a courtyard with red wooden pillars and curved tile roofs, stone paving beneath his feet, paper lanterns hanging from eaves"

Example BAD prompt: "A modern professional man in a beautiful palace with stunning architecture" (wrong era, abstract terms)

You MUST respond with valid JSON only, no other text. Use this exact structure:
{
  "context": {
    "timePeriod": "specific era/time period",
    "location": "specific geographical/cultural setting",
    "visualStyle": "consistent visual characteristics across all scenes"
  },
  "scenes": [
    {
      "id": 0,
      "text": "scene narrative text",
      "duration": 8,
      "visualPrompt": "detailed concrete visual description maintaining consistency"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Break this story into scenes for video generation. 

CRITICAL: Identify the time period, location, and cultural setting, then maintain PERFECT CONSISTENCY across ALL scenes. Every scene must match the same era, culture, and visual style.

Create CONCRETE visual descriptions (colors, shapes, lighting, expressions) without abstract terms. Respond with JSON only:\n\n${story}`
        }
      ],
      temperature: 0.7
    })

    const content = completion.choices[0].message.content || '{}'
    const result = JSON.parse(content)
    const scenes = result.scenes || []
    const context = result.context || {}

    // Calculate actual total duration
    const actualTotal = scenes.reduce((sum: number, scene: any) => sum + (scene.duration || 0), 0)
    console.log(`[Scene Analysis] Total: ${actualTotal}s (${(actualTotal / 60).toFixed(1)} min), Scenes: ${scenes.length}`)
    console.log(`[Scene Analysis] Context: ${JSON.stringify(context)}`)

    return NextResponse.json({ scenes, context, actualDuration: actualTotal })
  } catch (error) {
    console.error('Story analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze story' },
      { status: 500 }
    )
  }
}
