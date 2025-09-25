// OpenAI service for story analysis
// This service now calls our Next.js API route instead of calling OpenAI directly from the client

// Define the response structure
export interface Character {
  name: string
  mentions: number
  description: string
  attributes: string[]
  relationships: string[]
}

export interface Scene {
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

export interface StoryAnalysis {
  characters: Character[]
  scenes: Scene[]
}

// Preprocessing function
export function preprocessText(text: string): string {
  return text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Reduce excessive newlines
    .replace(/\s+/g, " ") // Normalize spaces
    .trim() // Trim whitespace
}

// Main function to analyze story by calling our API route
export async function analyzeStoryWithOpenAI(story: string): Promise<StoryAnalysis> {
  try {
    const response = await fetch('/api/analyze-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ story }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to analyze story')
    }

    const analysis: StoryAnalysis = await response.json()
    return analysis
  } catch (error) {
    console.error("Error analyzing story:", error)
    throw new Error("Failed to analyze story with OpenAI")
  }
}
