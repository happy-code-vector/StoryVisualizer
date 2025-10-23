import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { story, settings, scenes } = await request.json()

    // If scenes are provided, create segments based on scenes
    if (scenes && scenes.length > 0) {
      const segmentsWithScenes = scenes.map((scene: any, sceneIndex: number) => {
        const segmentsPerScene = Math.ceil(scene.duration / settings.segmentLength)
        const sceneSegments = []

        for (let i = 0; i < segmentsPerScene; i++) {
          sceneSegments.push({
            prompt: `${scene.visualPrompt}. Part ${i + 1} of ${segmentsPerScene}. ${settings.style} style, cinematic, high quality`,
            sceneId: scene.id,
            sceneIndex: sceneIndex,
            sceneTitle: `Scene ${sceneIndex + 1}`,
            segmentInScene: i + 1,
            totalInScene: segmentsPerScene
          })
        }

        return sceneSegments
      }).flat()

      return NextResponse.json({ segments: segmentsWithScenes })
    }

    // Fallback: Create segments from full story if no scenes provided
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
