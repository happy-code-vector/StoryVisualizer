import { createClient } from '@supabase/supabase-js'

// Define the database schema interfaces
interface StoryRecord {
  id: number
  title: string
  story: string
  character_model_name: string | null
  scene_model_name: string | null
  created_at: string
}

interface CharacterRecord {
  id: number
  story_id: number
  name: string
  mentions: number
  description: string
  attributes: string // JSON string
  brief_intro: string
  image_url: string | null
}

interface SceneRecord {
  id: number
  story_id: number
  scene_id: number
  title: string
  description: string
  characters: string // JSON string
  image_url: string | null
}

interface ModelRecord {
  id: number
  name: string
  type: 'character' | 'scene'
  link: string
  is_default: boolean
  created_at: string
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_API_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseKey)

// Save story analysis with characters and scenes
export async function saveStoryAnalysis(
  title: string,
  story: string,
  analysis: any,
  models?: {
    characterModel?: string;
    sceneModel?: string;
  }
): Promise<number | null> {
  try {
    // Insert the story with model information (no analysis column)
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .insert([
        {
          title: title,
          story: story,
          character_model_name: models?.characterModel || null,
          scene_model_name: models?.sceneModel || null
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
        brief_intro: character.briefIntro || '',
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
        characters: JSON.stringify(scene.characters || []),
        image_url: scene.imageUrl || null,
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
  models: {
    characterModel: string | null
    sceneModel: string | null
    videoModel: string | null
  }
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
          audioCues: char.audio_cues ? JSON.parse(char.audio_cues) : [],
          imageUrl: char.image_url
        })),
        scenes: scenes.map(scene => ({
          id: scene.scene_id,
          title: scene.title,
          description: scene.description,
          characters: JSON.parse(scene.characters),
          duration: scene.duration,
          audioElements: scene.audio_elements ? JSON.parse(scene.audio_elements) : [],
          imageUrl: scene.image_url,
          videoUrl: scene.video_url
        }))
      }
      
      return {
        id: story.id,
        title: story.title,
        story: story.story,
        analysis: updatedAnalysis,
        models: {
          characterModel: story.character_model_name,
          sceneModel: story.scene_model_name,
          videoModel: story.video_model_name
        },
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
  models: {
    characterModel: string | null
    sceneModel: string | null
    videoModel: string | null
  }
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
    
    // Reconstruct analysis from character and scene data
    const updatedAnalysis = {
      characters: characters.map(char => ({
        name: char.name,
        mentions: char.mentions,
        description: char.description,
        attributes: JSON.parse(char.attributes),
        briefIntro: char.brief_intro,
        imageUrl: char.image_url
      })),
      scenes: scenes.map(scene => ({
        id: scene.scene_id,
        title: scene.title,
        description: scene.description,
        characters: JSON.parse(scene.characters),
        imageUrl: scene.image_url,
      }))
    }
    
    return {
      id: story.id,
      title: story.title,
      story: story.story,
      analysis: updatedAnalysis,
      models: {
        characterModel: story.character_model_name,
        sceneModel: story.scene_model_name,
        videoModel: story.video_model_name
      },
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

// Update scene video URL
export async function updateSceneVideoUrl(
  storyId: number, 
  sceneId: number, 
  videoUrl: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('scenes')
      .update({ video_url: videoUrl })
      .eq('story_id', storyId)
      .eq('scene_id', sceneId)
    
    if (error) {
      console.error('Error updating scene video URL:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error updating scene video URL:', error)
    return false
  }
}

// Get all available models
export async function getAvailableModels(): Promise<{
  characterModels: ModelRecord[]
  sceneModels: ModelRecord[]
  videoModels: ModelRecord[]
} | null> {
  try {
    const { data: models, error } = await supabase
      .from('models')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching models:', error)
      return null
    }
    
    const characterModels = models.filter(m => m.type === 'character')
    const sceneModels = models.filter(m => m.type === 'scene')
    const videoModels = models.filter(m => m.type === 'video')
    
    return {
      characterModels,
      sceneModels,
      videoModels
    }
  } catch (error) {
    console.error('Error getting available models:', error)
    return null
  }
}

// Get all models by type
export async function getModelsByType(type: 'character' | 'scene'): Promise<ModelRecord[] | null> {
  try {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('type', type)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching models:', error)
      return null
    }
    
    // Map is_default to isDefault
    return data.map((item) => ({
      ...item,
      isDefault: item.is_default,
    })) as ModelRecord[];
  } catch (error) {
    console.error('Error getting models by type:', error)
    return null
  }
}

// Get model by name
export async function getModelByName(name: string): Promise<ModelRecord | null> {
  try {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('name', name)
      .single()
    
    if (error) {
      console.error('Error fetching model:', error)
      return null
    }
    
    return {
      ...data,
      isDefault: data.is_default,
    } as ModelRecord;
  } catch (error) {
    console.error('Error getting model by name:', error)
    return null
  }
}

// Add a new model
export async function addModel(name: string, type: 'character' | 'scene', link: string, isDefault: boolean = false): Promise<ModelRecord | null> {
  try {
    // Ensure the link starts with https://fal.run/ or add it as prefix
    let formattedLink = link;
    if (!link.startsWith('https://fal.run/')) {
      // If the link doesn't start with https://fal.run/, add it as prefix
      if (link.startsWith('/')) {
        formattedLink = `https://fal.run${link}`;
      } else {
        formattedLink = `https://fal.run/${link}`;
      }
    }
    
    // If setting as default, unset the current default for this type
    if (isDefault) {
      const { error: updateError } = await supabase
        .from('models')
        .update({ is_default: false })
        .eq('type', type)
      
      if (updateError) {
        console.error('Error unsetting default models:', updateError)
        return null
      }
    }
    
    // Insert the new model
    const { data, error } = await supabase
      .from('models')
      .insert([
        {
          name,
          type,
          link: formattedLink,
          is_default: isDefault
        }
      ])
      .select()
    
    if (error) {
      console.error('Error adding model:', error)
      return null
    }
    
    return data[0] as ModelRecord
  } catch (error) {
    console.error('Error adding model:', error)
    return null
  }
}

// Delete a model by ID
export async function deleteModelById(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting model:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting model:', error)
    return false
  }
}

// Get all models
export async function getAllModels(): Promise<{ characterModels: ModelRecord[], sceneModels: ModelRecord[] } | null> {
  try {
    const { data: characterModels, error: charError } = await supabase
      .from('models')
      .select('*')
      .eq('type', 'character')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })
    
    if (charError) {
      console.error('Error fetching character models:', charError)
      return null
    }
    
    const { data: sceneModels, error: sceneError } = await supabase
      .from('models')
      .select('*')
      .eq('type', 'scene')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })
    
    if (sceneError) {
      console.error('Error fetching scene models:', sceneError)
      return null
    }
    
    return {
      characterModels: characterModels.map((item) => ({
        ...item,
        isDefault: item.is_default,
      })) as ModelRecord[],
      sceneModels: sceneModels.map((item) => ({
        ...item,
        isDefault: item.is_default,
      })) as ModelRecord[]
    }
  } catch (error) {
    console.error('Error getting all models:', error)
    return null
  }
}