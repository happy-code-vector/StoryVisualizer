import { createClient } from '@supabase/supabase-js'

// Define the database schema interfaces
interface StoryRecord {
  id: number
  title: string
  story: string
  analysis: string // JSON string
  created_at: string
}

interface CharacterRecord {
  id: number
  story_id: number
  name: string
  mentions: number
  description: string
  attributes: string // JSON string
  relationships: string // JSON string
  image_url: string | null
}

interface SceneRecord {
  id: number
  story_id: number
  scene_id: number
  title: string
  description: string
  setting: string
  time_of_day: string
  mood: string
  key_actions: string // JSON string
  characters: string // JSON string
  objects: string // JSON string
  emotions: string // JSON string
  image_url: string | null
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_API_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseKey)

// Save story analysis with characters and scenes
export async function saveStoryAnalysis(
  title: string,
  story: string,
  analysis: any
): Promise<number | null> {
  try {
    // Insert the story
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .insert([
        {
          title: title,
          story: story,
          analysis: JSON.stringify(analysis)
        }
      ])
      .select()
    
    if (storyError) {
      console.error('Error inserting story:', storyError)
      return null
    }
    
    const storyId = storyData[0].id
    
    // Insert characters with image URLs
    if (analysis.characters && Array.isArray(analysis.characters)) {
      const characters = analysis.characters.map((character: any) => ({
        story_id: storyId,
        name: character.name,
        mentions: character.mentions,
        description: character.description,
        attributes: JSON.stringify(character.attributes || []),
        relationships: JSON.stringify(character.relationships || []),
        image_url: character.imageUrl || null
      }))
      
      const { error: charError } = await supabase
        .from('characters')
        .insert(characters)
      
      if (charError) {
        console.error('Error inserting characters:', charError)
        return null
      }
    }
    
    // Insert scenes with image URLs
    if (analysis.scenes && Array.isArray(analysis.scenes)) {
      const scenes = analysis.scenes.map((scene: any) => ({
        story_id: storyId,
        scene_id: scene.id,
        title: scene.title,
        description: scene.description,
        setting: scene.setting,
        time_of_day: scene.timeOfDay,
        mood: scene.mood,
        key_actions: JSON.stringify(scene.keyActions || []),
        characters: JSON.stringify(scene.characters || []),
        objects: JSON.stringify(scene.objects || []),
        emotions: JSON.stringify(scene.emotions || []),
        image_url: scene.imageUrl || null
      }))
      
      const { error: sceneError } = await supabase
        .from('scenes')
        .insert(scenes)
      
      if (sceneError) {
        console.error('Error inserting scenes:', sceneError)
        return null
      }
    }
    
    return storyId
  } catch (error) {
    console.error('Error saving story analysis:', error)
    return null
  }
}

// Get all stories with their analysis
export async function getAllStories(): Promise<Array<{
  id: number
  title: string
  story: string
  analysis: any
  createdAt: string
}> | null> {
  try {
    // Get all stories
    const { data: stories, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching stories:', error)
      return null
    }
    
    // For each story, get its characters and scenes
    const storiesWithDetails = await Promise.all(stories.map(async (story) => {
      // Get characters for this story
      const { data: characters, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('story_id', story.id)
        .order('id', { ascending: true })
      
      if (charError) {
        console.error('Error fetching characters:', charError)
        return null
      }
      
      // Get scenes for this story
      const { data: scenes, error: sceneError } = await supabase
        .from('scenes')
        .select('*')
        .eq('story_id', story.id)
        .order('scene_id', { ascending: true })
      
      if (sceneError) {
        console.error('Error fetching scenes:', sceneError)
        return null
      }
      
      // Parse the analysis JSON
      const analysis = JSON.parse(story.analysis)
      
      // Merge image URLs into the analysis
      const updatedAnalysis = {
        ...analysis,
        characters: characters.map(char => ({
          name: char.name,
          mentions: char.mentions,
          description: char.description,
          attributes: JSON.parse(char.attributes),
          relationships: JSON.parse(char.relationships),
          imageUrl: char.image_url
        })),
        scenes: scenes.map(scene => ({
          id: scene.scene_id,
          title: scene.title,
          description: scene.description,
          setting: scene.setting,
          timeOfDay: scene.time_of_day,
          mood: scene.mood,
          keyActions: JSON.parse(scene.key_actions),
          characters: JSON.parse(scene.characters),
          objects: JSON.parse(scene.objects),
          emotions: JSON.parse(scene.emotions),
          imageUrl: scene.image_url
        }))
      }
      
      return {
        id: story.id,
        title: story.title,
        story: story.story,
        analysis: updatedAnalysis,
        createdAt: story.created_at
      }
    }))
    
    // Filter out any null values (in case of errors)
    return storiesWithDetails.filter(Boolean) as any
  } catch (error) {
    console.error('Error getting all stories:', error)
    return null
  }
}

// Get a specific story by ID with image URLs
export async function getStoryById(id: number): Promise<{
  id: number
  title: string
  story: string
  analysis: any
  createdAt: string
} | null> {
  try {
    // Get the story
    const { data: story, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !story) {
      console.error('Error fetching story:', error)
      return null
    }
    
    // Get characters for this story
    const { data: characters, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('story_id', id)
      .order('id', { ascending: true })
    
    if (charError) {
      console.error('Error fetching characters:', charError)
      return null
    }
    
    // Get scenes for this story
    const { data: scenes, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('story_id', id)
      .order('scene_id', { ascending: true })
    
    if (sceneError) {
      console.error('Error fetching scenes:', sceneError)
      return null
    }
    
    // Parse the analysis JSON
    const analysis = JSON.parse(story.analysis)
    
    // Merge image URLs into the analysis
    const updatedAnalysis = {
      ...analysis,
      characters: characters.map(char => ({
        name: char.name,
        mentions: char.mentions,
        description: char.description,
        attributes: JSON.parse(char.attributes),
        relationships: JSON.parse(char.relationships),
        imageUrl: char.image_url
      })),
      scenes: scenes.map(scene => ({
        id: scene.scene_id,
        title: scene.title,
        description: scene.description,
        setting: scene.setting,
        timeOfDay: scene.time_of_day,
        mood: scene.mood,
        keyActions: JSON.parse(scene.key_actions),
        characters: JSON.parse(scene.characters),
        objects: JSON.parse(scene.objects),
        emotions: JSON.parse(scene.emotions),
        imageUrl: scene.image_url
      }))
    }
    
    return {
      id: story.id,
      title: story.title,
      story: story.story,
      analysis: updatedAnalysis,
      createdAt: story.created_at
    }
  } catch (error) {
    console.error('Error getting story by ID:', error)
    return null
  }
}

// Delete a story by ID
export async function deleteStoryById(id: number): Promise<boolean> {
  try {
    // Delete related characters
    const { error: charError } = await supabase
      .from('characters')
      .delete()
      .eq('story_id', id)
    
    if (charError) {
      console.error('Error deleting characters:', charError)
      return false
    }
    
    // Delete related scenes
    const { error: sceneError } = await supabase
      .from('scenes')
      .delete()
      .eq('story_id', id)
    
    if (sceneError) {
      console.error('Error deleting scenes:', sceneError)
      return false
    }
    
    // Delete the story
    const { error: storyError } = await supabase
      .from('stories')
      .delete()
      .eq('id', id)
    
    if (storyError) {
      console.error('Error deleting story:', storyError)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting story:', error)
    return false
  }
}

// Delete all stories
export async function deleteAllStories(): Promise<boolean> {
  try {
    // Delete all characters
    const { error: charError } = await supabase
      .from('characters')
      .delete()
    
    if (charError) {
      console.error('Error deleting characters:', charError)
      return false
    }
    
    // Delete all scenes
    const { error: sceneError } = await supabase
      .from('scenes')
      .delete()
    
    if (sceneError) {
      console.error('Error deleting scenes:', sceneError)
      return false
    }
    
    // Delete all stories
    const { error: storyError } = await supabase
      .from('stories')
      .delete()
    
    if (storyError) {
      console.error('Error deleting stories:', storyError)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting all stories:', error)
    return false
  }
}