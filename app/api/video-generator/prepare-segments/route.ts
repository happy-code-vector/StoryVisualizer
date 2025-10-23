import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { story, settings, scenes } = await request.json()

    // If scenes are provided, create segments based on scenes with AI-generated progressive prompts
    if (scenes && scenes.length > 0) {
      const allSegments = []

      for (const scene of scenes) {
        const sceneIndex = scenes.indexOf(scene)
        const segmentsPerScene = Math.ceil(scene.duration / settings.segmentLength)

        if (segmentsPerScene === 1) {
          // Single segment - use the scene's visual prompt directly
          allSegments.push({
            prompt: `${scene.visualPrompt}. ${settings.style} style, cinematic, high quality, professional`,
            sceneId: scene.id,
            sceneIndex: sceneIndex,
            sceneTitle: `Scene ${sceneIndex + 1}`,
            segmentInScene: 1,
            totalInScene: 1
          })
        } else {
          // Multiple segments - use AI to create progressive prompts
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are a cinematography expert. Break down a scene into ${segmentsPerScene} progressive video segments (${settings.segmentLength} seconds each).

Create varied, cinematic prompts that:
- Show different angles, movements, or aspects of the scene
- Progress naturally (e.g., wide shot → medium shot → close-up)
- Maintain visual continuity
- Each segment should be distinct but cohesive
- Include camera movements, lighting, and composition details
- Match ${settings.style} style

You MUST respond with valid JSON only. Use this exact structure:
{
  "segments": [
    "detailed prompt for segment 1",
    "detailed prompt for segment 2",
    ...
  ]
}`
              },
              {
                role: 'user',
                content: `Scene: ${scene.text}
Visual Description: ${scene.visualPrompt}
Duration: ${scene.duration} seconds
Style: ${settings.style}

Create ${segmentsPerScene} progressive video prompts that show this scene from different angles/perspectives. Respond with JSON only.`
              }
            ],
            temperature: 0.7
          })

          const content = completion.choices[0].message.content || '{}'
          const result = JSON.parse(content)
          const segmentPrompts = result.segments || []

          // Create segment objects with the AI-generated prompts
          for (let i = 0; i < segmentsPerScene; i++) {
            allSegments.push({
              prompt: segmentPrompts[i] || `${scene.visualPrompt}. Part ${i + 1}. ${settings.style} style`,
              sceneId: scene.id,
              sceneIndex: sceneIndex,
              sceneTitle: `Scene ${sceneIndex + 1}`,
              segmentInScene: i + 1,
              totalInScene: segmentsPerScene
            })
          }
        }
      }

      return NextResponse.json({ segments: allSegments })
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
