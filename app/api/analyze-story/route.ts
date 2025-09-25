import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { fal } from "@fal-ai/client";
import { saveStoryAnalysis } from '@/lib/db-service'
import { Settings } from 'lucide-react';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
fal.config({
  credentials: process.env.FAL_AI_API_KEY,
})

// Define the response structure
interface Character {
  name: string
  mentions: number
  description: string
  attributes: string[]
  relationships: string[]
}

interface Scene {
  id: number
  title: string
  description: string
  setting: string
  timeOfDay: string
  mood: string
  keyActions: string[]
  characters: string[]
  objects: string[]
  emotions: string[]
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

// Function to generate a character image using Fal AI directly
async function generateCharacterImage(character: {
  name: string
  description: string
  attributes: string[]
}): Promise<string> {
  
  try {
    const prompt = `A portrait of ${character.name}, ${character.description.toLowerCase()}, ${
      character.attributes.length > 0 
        ? character.attributes.join(', ') 
        : 'detailed character design'
    }, high quality, detailed, ultra realistic style`

    const response = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt: prompt,
        image_size: 'square',
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true
      },
    })

    const data = response.data
    
    if (data.images && data.images.length > 0) {
      return data.images[0].url
    } else {
      throw new Error('No image generated')
    }
  } catch (error: any) {
    console.error('Error generating character image with Fal AI:', error)
    if (error.cause && error.cause.code === 'ENOTFOUND') {
      console.error('DNS lookup failed for Fal AI API. Check your internet connection or try again later.')
    }
    return `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(character.name)}`
  }
}

async function generateSceneImage(scene: {
  setting: string
  timeOfDay: string
  mood: string
  description: string
}): Promise<string> {

  try {
    const prompt = `${scene.description}, ${scene.setting}, ${scene.timeOfDay}, ${scene.mood}, cinematic, detailed environment, high quality, ultra realistic style`

    const response = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
        input: {
            image_url: "/placeholder.svg?height=600&width=800&text=Scenery",
            prompt: prompt,
            num_inference_steps: 25,
            guidance_scale: 7.5,
            num_images: 1,
            enable_safety_checker: true
        },
    })
    const result = response.data
    if (result.images && result.images.length > 0) {
      return result.images[0].url
    } else {
      throw new Error('No image generated')
    }
  } catch (error: any) {
    console.error('Error generating scene image with Fal AI:', error)
    
    if (error.cause && error.cause.code === 'ENOTFOUND') {
      console.error('DNS lookup failed for Fal AI API. Check your internet connection or try again later.')
    }
    return `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(scene.setting)}`
  }
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
    const prompt = `You are an expert literary analyst AI. Your task is to analyze a story and extract detailed information about characters, scenes, and settings. Process the story and provide a structured JSON response with the following information:

1. Characters:
   - Name
   - Number of mentions (count how many times each character is mentioned)
   - Detailed description based on context
   - Physical and personality attributes
   - Key relationships with other characters

2. Scenes:
   - Sequential numbering starting from 1
   - Title or brief summary
   - Detailed description/atmosphere
   - Setting/location
   - Time of day
   - Mood/atmosphere
   - Key actions that occur
   - Characters present in each scene
   - Important objects mentioned
   - Dominant emotions

Analyze the story thoroughly and provide comprehensive information for each category. Be specific and detailed in your analysis.

Return ONLY a valid JSON object with this exact structure:
{
  "characters": [
    {
      "name": "string",
      "mentions": number,
      "description": "string",
      "attributes": ["string"],
      "relationships": ["string"]
    }
  ],
  "scenes": [
    {
      "id": number,
      "title": "string",
      "description": "string",
      "setting": "string",
      "timeOfDay": "string",
      "mood": "string",
      "keyActions": ["string"],
      "characters": ["string"],
      "objects": ["string"],
      "emotions": ["string"]
    }
  ]
}

Story to analyze:
${preprocessedStory}`

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    })

    const content = response.choices[0].message.content || "{}"
    
    let analysis: StoryAnalysis;
    try {
      analysis = JSON.parse(content)
    } catch (parseError) {
      console.error("Error parsing JSON response:", content)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Failed to extract JSON from OpenAI response")
      }
    }

    console.log("[Fal AI] Generating images for", analysis.characters.length, "characters")
    const charactersWithImages = await Promise.all(
      analysis.characters.map(async (character) => {
        try {
          const imageUrl = await generateCharacterImage(character)
          console.log(`[Fal AI] Generated image for character: ${character.name}`)
          return {
            ...character,
            imageUrl,
          }
        } catch (error) {
          console.error(`[Fal AI] Failed to generate image for character: ${character.name}`, error)
          return {
            ...character,
            imageUrl: `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(character.name)}`
          }
        }
      })
    )

    // Generate images for scenes
    console.log("[Fal AI] Generating images for", analysis.scenes.length, "scenes")
    const scenesWithImages = await Promise.all(
      analysis.scenes.map(async (scene) => {
        try {
          const imageUrl = await generateSceneImage(scene)
          console.log(`[Fal AI] Generated image for scene: ${scene.title}`)
          return {
            ...scene,
            imageUrl,
          }
        } catch (error) {
          console.error(`[Fal AI] Failed to generate image for scene: ${scene.title}`, error)
          return {
            ...scene,
            imageUrl: `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(scene.setting)}`
          }
        }
      })
    )

    const analysisWithImages: StoryAnalysis = {
      characters: charactersWithImages,
      scenes: scenesWithImages,
    }

    // Save the analysis to the database
    const storyId = saveStoryAnalysis(title || "Untitled Story", story, analysisWithImages)

    return NextResponse.json({
      ...analysisWithImages,
      id: storyId
    })
  } catch (error) {
    console.error("Error analyzing story with OpenAI:", error)
    return NextResponse.json({ error: "Failed to analyze story with OpenAI" }, { status: 500 })
  }
}