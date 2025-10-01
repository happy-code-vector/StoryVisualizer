import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define the response structure
interface Character {
  name: string
  mentions: number
  description: string
  attributes: string[]
  relationships: string[]
  audioCues: string[]
}

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  duration: number | string // Accept both number and string, convert as needed
  audioElements: string[]
}

interface StoryAnalysis {
  characters: Character[]
  scenes: Scene[]
}

// Preprocessing function
function preprocessText(text: string): string {
  return text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Reduce excessive newlines
    .replace(/\s+/g, " ") // Normalize spaces
    .trim() // Trim whitespace
}

export async function POST(request: Request) {
  try {
    const { story, title } = await request.json()

    if (!story) {
      return NextResponse.json({ error: 'Story content is required' }, { status: 400 })
    }

    // Preprocess the story text
    const preprocessedStory = preprocessText(story)

    // Create the prompt for OpenAI
    const prompt = `You are an expert literary analyst AI tasked with analyzing a story to extract detailed information about characters and scenes, optimized for generating stunning, cohesive video clips that merge into a single video. Your goal is to process the story and produce a JSON response with rich, vivid descriptions that support dynamic video production, ensuring narrative flow, visual continuity, and emotional depth.

Analyze the story thoroughly: Break down the narrative into a sufficient number of detailed scenes to fully capture the content (aim for enough number of scenes as needed, splitting based on key events, location changes, time shifts, character developments, or plot progressions to ensure comprehensive coverage without rushing through important moments). Provide comprehensive, cinematic details for each category. For characters, craft the 'description' field as a rich, vivid narrative focusing on physical appearance (face shape, expressions, age, build, skin tone, hair, eyes), clothing, mannerisms, emotional states, and how they move/interact to evoke stunning visuals. For scenes, craft the 'description' field as a detailed, step-by-step script-like narrative that flows sequentially: describe opening visuals, character entrances/actions/dialogues, situation changes, emotional shifts, interactions, evolving dynamics, integrated camera angles/movements/visual style, audio elements, and the transition to the next scene, using immersive, sensory language to inspire video generation models.

Ensure scenes connect seamlessly with recurring motifs and smooth transitions for continuous video merging. Use cinematic, vivid prose throughout to make outputs directly usable for creating engaging, fluid video clips.

IMPORTANT: Return ONLY a valid JSON object without any markdown formatting, code blocks, or additional text. Do not wrap the JSON in \`\`\`json\`\`\` blocks. Return the raw JSON object directly with this exact structure:
{
  "characters": [
    {
      "name": "string",
      "mentions": number,
      "description": "string",
      "attributes": ["string"],
      "relationships": ["string"],
      "audioCues": ["string"]
    }
  ],
  "scenes": [
    {
      "id": number,
      "title": "string",
      "description": "string",
      "characters": ["string"],
      "duration": "string",
      "audioElements": ["string"]
    }
  ]
}

For each field:
- **characters.description**: A vivid, immersive paragraph emphasizing physical visuals.
- **characters.attributes**: Visual elements and personality traits.
- **characters.relationships**: Describe key connections.
- **characters.audioCues**: Specify voice or sound motifs.
- **scenes.description**: Expand into a rich, sequential script: Open with establishing shot and atmosphere; detail character appearances/actions/dialogues; describe changes in situations/emotions/dynamics; weave in camera angles/movements, visual style, audio, and how elements evolve for tension/drama/wonder; conclude with the transition to the next scene (80~100 words).
- **scenes.duration**: Estimate the scene’s duration in the video (e.g., "30") Should not exceed 20 seconds and represented in number, calculated in seconds.
- **scenes.audioElements**: List sound effects, music, or dialogue cues.

Ensure all enriched descriptions use sensory, dynamic language to directly feed video generation models for stunning, fluid clips with character evolutions and situational changes.

Story to analyze:
${preprocessedStory}`

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 12000,
    })

    const content = response.choices[0].message.content || "{}"

    let analysis: StoryAnalysis;
    try {
      analysis = JSON.parse(content)
    } catch (parseError) {
      console.error("Error parsing JSON response:", content)

      // Try to extract JSON from markdown code blocks
      const markdownJsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (markdownJsonMatch) {
        try {
          analysis = JSON.parse(markdownJsonMatch[1])
        } catch (markdownParseError) {
          console.error("Error parsing markdown JSON:", markdownJsonMatch[1])
          throw new Error("Failed to parse JSON from markdown code block")
        }
      } else {
        // Fallback: try to find any JSON object in the content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            analysis = JSON.parse(jsonMatch[0])
          } catch (fallbackParseError) {
            console.error("Error parsing fallback JSON:", jsonMatch[0])
            throw new Error("Failed to extract valid JSON from OpenAI response")
          }
        } else {
          throw new Error("No JSON found in OpenAI response")
        }
      }
    }

    return NextResponse.json({
      ...analysis,
      title: title || "Untitled Story"
    })
  } catch (error) {
    console.error("Error analyzing story with OpenAI:", error)
    return NextResponse.json({ error: "Failed to analyze story with OpenAI" }, { status: 500 })
  }
}