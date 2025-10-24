import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { currentPrompt, userRequest, context, conversationHistory } = await request.json()

    if (!currentPrompt || !userRequest) {
      return NextResponse.json({ error: 'Prompt and request are required' }, { status: 400 })
    }

    const systemMessage = `You are an expert cinematographer and prompt engineer. Help users enhance their video generation prompts.

CRITICAL CONSISTENCY REQUIREMENTS:
${context?.timePeriod ? `- Time Period: ${context.timePeriod} - ALL enhancements MUST match this era` : ''}
${context?.location ? `- Location: ${context.location} - ALL enhancements MUST match this setting` : ''}
${context?.visualStyle ? `- Visual Style: ${context.visualStyle}` : ''}

ENHANCEMENT GUIDELINES:
✓ Use CONCRETE descriptions (colors, shapes, textures, lighting, positions)
✓ Add specific camera details (distance, angle, movement)
✓ Include precise lighting descriptions (direction, quality, color)
✓ Describe facial expressions and body language specifically
✓ Maintain consistency with time period and location
✗ DON'T use abstract terms (beautiful, stunning, cinematic, professional)
✗ DON'T change the time period or cultural setting
✗ DON'T add elements from different eras or cultures

Your response should include:
1. The enhanced prompt (concrete and detailed)
2. A brief explanation of what you changed and why

Respond in JSON format:
{
  "enhancedPrompt": "the improved prompt",
  "explanation": "what you changed and why"
}`

    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: `Current prompt: "${currentPrompt}"\n\nUser request: ${userRequest}\n\nEnhance the prompt based on this request. Maintain consistency with ${context?.timePeriod || 'the story context'}. Respond with JSON only.`
      }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7
    })

    const content = completion.choices[0].message.content || '{}'
    const result = JSON.parse(content)

    return NextResponse.json({
      enhancedPrompt: result.enhancedPrompt || currentPrompt,
      explanation: result.explanation || 'Prompt enhanced successfully.'
    })
  } catch (error) {
    console.error('Prompt enhancement error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    )
  }
}
