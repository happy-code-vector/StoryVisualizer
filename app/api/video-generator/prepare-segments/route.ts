import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { story, settings, scenes, context } = await request.json()

    // Extract consistency context
    const storyContext = context || {
      timePeriod: "unspecified",
      location: "unspecified",
      visualStyle: "consistent throughout"
    }

    console.log(`[Segment Preparation] Context: ${JSON.stringify(storyContext)}`)

    // If scenes are provided, create segments based on scenes with AI-generated progressive prompts
    if (scenes && scenes.length > 0) {
      const allSegments = []

      for (const scene of scenes) {
        const sceneIndex = scenes.indexOf(scene)
        const segmentsPerScene = Math.ceil(scene.duration / settings.segmentLength)

        if (segmentsPerScene === 1) {
          // Single segment - use the scene's visual prompt directly with context reinforcement
          allSegments.push({
            prompt: `${scene.visualPrompt}. Time period: ${storyContext.timePeriod}. Location: ${storyContext.location}.`,
            sceneId: scene.id,
            sceneIndex: sceneIndex,
            sceneTitle: `Scene ${sceneIndex + 1}`,
            segmentInScene: 1,
            totalInScene: 1
          })
        } else {
          // Multiple segments - use AI to create progressive prompts with strict consistency
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are a cinematography expert. Break down a scene into ${segmentsPerScene} progressive video segments (${settings.segmentLength} seconds each).

CRITICAL CONSISTENCY REQUIREMENTS:
- Time Period: ${storyContext.timePeriod} - ALL segments MUST match this exact era
- Location: ${storyContext.location} - ALL segments MUST match this cultural/geographical setting
- Visual Style: ${storyContext.visualStyle}
- Architecture, clothing, objects, and people MUST be appropriate for ${storyContext.timePeriod} in ${storyContext.location}
- NO mixing of different eras, cultures, or styles
- If Tang Dynasty China: use curved roofs, red pillars, silk robes, traditional Chinese architecture
- If Medieval Europe: use stone castles, tunics, Gothic architecture
- If Modern: use contemporary clothing, modern buildings

Create varied, cinematic prompts that:
- Show different angles, movements, or aspects of the scene
- Progress naturally (e.g., wide shot → medium shot → close-up)
- Maintain PERFECT visual continuity with the time period and location
- Each segment should be distinct but cohesive
- Use CONCRETE descriptions only

CRITICAL RULES FOR PROMPTS:
✓ DO describe: specific colors (navy blue, burnt orange), textures (rough bark, smooth glass), lighting (soft morning light from left, harsh overhead fluorescent), facial expressions (slight smile, furrowed brow), body positions, clothing details appropriate to era, object shapes and sizes
✓ DO specify: camera distance (3 feet away, 20 feet high), camera angle (eye level, low angle looking up), movement direction (camera slowly moves left to right)
✓ DO maintain: consistent time period, architecture style, clothing style, cultural elements
✗ DON'T use: "hyper-realistic", "modern" (unless story is modern), "professional", "high-quality", "stunning", "beautiful", "cinematic", "dramatic", "amazing", "perfect"
✗ DON'T mix: different time periods, cultures, or architectural styles
✗ DON'T use abstract style descriptors - describe WHAT you see, not HOW it should feel

Example GOOD for Tang Dynasty: "Camera positioned 15 feet away, eye level, showing a man in his 30s wearing deep blue silk Tang Dynasty robes with wide sleeves and gold embroidered patterns, standing in a courtyard with red wooden pillars, curved tile roof visible above, stone paving beneath"

Example BAD: "Cinematic shot of a man in a beautiful palace" (no era specified, abstract terms, could be any culture)

You MUST respond with valid JSON only. Use this exact structure:
{
  "segments": [
    "detailed concrete prompt for segment 1 matching ${storyContext.timePeriod} in ${storyContext.location}",
    "detailed concrete prompt for segment 2 matching ${storyContext.timePeriod} in ${storyContext.location}",
    ...
  ]
}`
              },
              {
                role: 'user',
                content: `CONSISTENCY CONTEXT:
Time Period: ${storyContext.timePeriod}
Location: ${storyContext.location}
Visual Style: ${storyContext.visualStyle}

Scene: ${scene.text}
Visual Description: ${scene.visualPrompt}
Duration: ${scene.duration} seconds
Style: ${settings.style}

Create ${segmentsPerScene} progressive video prompts that STRICTLY MAINTAIN consistency with ${storyContext.timePeriod} in ${storyContext.location}. Use CONCRETE visual descriptions (colors, shapes, lighting, positions, expressions). NO abstract terms. ALL segments must match the same era and culture. Respond with JSON only.`
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
- Use CONCRETE visual descriptions only
- Be suitable for ${settings.segmentLength} second clips
- Flow smoothly from one to the next
- Include specific camera positions, angles, and lighting details

CRITICAL RULES:
✓ DO describe: specific colors, textures, lighting direction and quality, facial expressions, body language, clothing details, object shapes, environmental elements, camera distance and angle
✓ DO use concrete terms: "warm orange light from setting sun", "rough grey concrete wall", "woman with tired eyes and slight frown"
✗ DON'T use: "hyper-realistic", "modern", "professional", "high-quality", "stunning", "beautiful", "cinematic", "dramatic", "amazing"
✗ DON'T use abstract style terms

You MUST respond with valid JSON only, no other text. Use this exact structure:
{
  "segments": ["concrete prompt 1", "concrete prompt 2", ...]
}`
        },
        {
          role: 'user',
          content: `Create ${segmentCount} video prompts for this story. Use CONCRETE visual descriptions (colors, shapes, lighting, expressions) without abstract terms. Respond with JSON only:\n\n${story}`
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
