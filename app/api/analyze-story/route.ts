import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { narrativeEngine } from '@/lib/narrative-engine'
import { estimateStoryCost } from '@/lib/cost-tracking'

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
  briefIntro: string
}

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
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
    const prompt = `You are an expert literary analyst AI tasked with analyzing a story to extract detailed information about characters and scenes, optimized for generating high-quality static images. Your goal is to process the story and produce a JSON response with perfect image generation prompts that can be directly fed into AI image models.

Analyze the story thoroughly: Break down the narrative into detailed scenes that capture key moments, locations, character interactions, and plot points. Focus on creating descriptions that work perfectly as image generation prompts.

For characters, craft the 'description' field as a perfect image generation prompt focusing on physical appearance, clothing, pose, and visual characteristics. For scenes, craft the 'description' field as a detailed image prompt describing a single moment or frame - include setting, lighting, composition, character positions, objects, mood, and visual style.

IMPORTANT: Return ONLY a valid JSON object without any markdown formatting, code blocks, or additional text. Do not wrap the JSON in \`\`\`json\`\`\` blocks. Return the raw JSON object directly with this exact structure:
{
  "characters": [
    {
      "name": "string",
      "mentions": number,
      "description": "string",
      "attributes": ["string"],
      "briefIntro": "string"
    }
  ],
  "scenes": [
    {
      "id": number,
      "title": "string",
      "description": "string",
      "characters": ["string"]
    }
  ]
}

For each field:
- **characters.description**: A perfect image generation prompt describing the character's physical appearance, clothing, pose, and visual characteristics (50-80 words).
- **characters.attributes**: Visual elements, personality traits, and key characteristics.
- **characters.briefIntro**: A brief 1-2 sentence introduction of who the character is and their role.
- **scenes.description**: A perfect image generation prompt describing a single moment/frame including setting, lighting, character positions, objects, composition, and visual mood (60-100 words).

Ensure all descriptions use clear, visual language optimized for AI image generation models. Focus on static visual elements rather than actions or movements.

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

    // ============================================================================
    // AURORA STUDIO: Add Narrative Intelligence
    // ============================================================================
    
    // Analyze story structure with narrative engine
    const storyArc = await narrativeEngine.analyzeStoryArc(analysis.scenes)
    const tensionCurve = await narrativeEngine.calculateTensionCurve(analysis.scenes)
    const narrativeSuggestions = await narrativeEngine.generateCoachingSuggestions(analysis.scenes, storyArc)
    const emotionalPeaks = await narrativeEngine.detectEmotionalPeaks(analysis.scenes)
    
    // Apply suggested durations and beat types to scenes
    const scenesWithMetadata = analysis.scenes.map((scene, index) => {
      const sceneArc = storyArc.pacing.sceneDistribution.find(s => s.sceneId === scene.id)
      const sceneTension = tensionCurve.find(t => t.sceneId === scene.id)
      
      return {
        ...scene,
        suggestedDuration: sceneArc?.suggestedDuration || 5,
        beatType: sceneArc?.beatType || 'scene',
        tensionLevel: sceneTension?.tensionLevel || 5,
        emotionalPeak: sceneTension?.emotionalPeak || false
      }
    })
    
    // Estimate costs for this story
    const costEstimate = await estimateStoryCost(
      analysis.characters.length,
      analysis.scenes.length,
      {
        includeVideos: false, // User will choose later
        includeVoice: false,  // User will choose later
        avgSceneDuration: storyArc.pacing.totalDuration / analysis.scenes.length
      }
    )

    return NextResponse.json({
      ...analysis,
      scenes: scenesWithMetadata,
      title: title || "Untitled Story",
      // Aurora Studio enhancements
      storyArc,
      tensionCurve,
      narrativeSuggestions,
      emotionalPeaks,
      costEstimate,
      metadata: {
        totalDuration: storyArc.pacing.totalDuration,
        acts: {
          act1: storyArc.acts.act1.scenes.length,
          act2: storyArc.acts.act2.scenes.length,
          act3: storyArc.acts.act3.scenes.length
        }
      }
    })
  } catch (error) {
    console.error("Error analyzing story with OpenAI:", error)
    return NextResponse.json({ error: "Failed to analyze story with OpenAI" }, { status: 500 })
  }
}