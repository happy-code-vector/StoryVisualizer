import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { saveStoryAnalysis } from '@/lib/db-service'

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
      model: "gpt-4", // You can change this to "gpt-3.5-turbo" if preferred
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      max_tokens: 4000, // Adjust based on your needs
      // Removed response_format parameter as it's not supported with this model
    })

    // Extract and parse the response
    const content = response.choices[0].message.content || "{}"
    
    // Try to parse the JSON response
    let analysis: StoryAnalysis;
    try {
      analysis = JSON.parse(content)
    } catch (parseError) {
      console.error("Error parsing JSON response:")
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Failed to extract JSON from OpenAI response")
      }
    }

    // Save the analysis to the database (without images)
    const storyId = saveStoryAnalysis(title || "Untitled Story", story, analysis)

    // Return the analysis without images
    return NextResponse.json({
      ...analysis,
      id: storyId
    })
  } catch (error) {
    console.error("Error analyzing story with OpenAI:", error)
    return NextResponse.json({ error: "Failed to analyze story with OpenAI" }, { status: 500 })
  }
}