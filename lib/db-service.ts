import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Define the database schema
interface StoryRecord {
  id: number
  title: string
  story: string
  analysis: string // JSON string
  createdAt: string
}

interface CharacterRecord {
  id: number
  storyId: number
  name: string
  mentions: number
  description: string
  attributes: string // JSON string
  relationships: string // JSON string
  imageUrl: string | null // Add image URL field
}

interface SceneRecord {
  id: number
  storyId: number
  sceneId: number
  title: string
  description: string
  setting: string
  timeOfDay: string
  mood: string
  keyActions: string // JSON string
  characters: string // JSON string
  objects: string // JSON string
  emotions: string // JSON string
  imageUrl: string | null // Add image URL field
}

// Initialize the database
const dbPath = path.join(process.cwd(), 'story-visualizer.db')
const db = new Database(dbPath)

// Create tables if they don't exist and add missing columns
function initializeDatabase() {
  // Create stories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      story TEXT NOT NULL,
      analysis TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create characters table
  db.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      mentions INTEGER NOT NULL,
      description TEXT,
      attributes TEXT,
      relationships TEXT,
      FOREIGN KEY (story_id) REFERENCES stories (id)
    )
  `)

  // Add image_url column to characters table if it doesn't exist
  try {
    db.exec(`ALTER TABLE characters ADD COLUMN image_url TEXT`)
  } catch (error) {
    // Column already exists, ignore the error
  }

  // Create scenes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL,
      scene_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      setting TEXT,
      time_of_day TEXT,
      mood TEXT,
      key_actions TEXT,
      characters TEXT,
      objects TEXT,
      emotions TEXT,
      FOREIGN KEY (story_id) REFERENCES stories (id)
    )
  `)

  // Add image_url column to scenes table if it doesn't exist
  try {
    db.exec(`ALTER TABLE scenes ADD COLUMN image_url TEXT`)
  } catch (error) {
    // Column already exists, ignore the error
  }

  console.log('Database initialized')
}

// Save a story and its analysis with image URLs
export function saveStoryAnalysis(
  title: string,
  story: string,
  analysis: any
): number {
  const transaction = db.transaction(() => {
    // Insert the story
    const storyStmt = db.prepare(`
      INSERT INTO stories (title, story, analysis)
      VALUES (?, ?, ?)
    `)
    
    const storyResult = storyStmt.run(title, story, JSON.stringify(analysis))
    const storyId = storyResult.lastInsertRowid as number
    
    // Insert characters with image URLs
    if (analysis.characters && Array.isArray(analysis.characters)) {
      const charStmt = db.prepare(`
        INSERT INTO characters (story_id, name, mentions, description, attributes, relationships, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      
      for (const character of analysis.characters) {
        charStmt.run(
          storyId,
          character.name,
          character.mentions,
          character.description,
          JSON.stringify(character.attributes || []),
          JSON.stringify(character.relationships || []),
          character.imageUrl || null
        )
      }
    }
    
    // Insert scenes with image URLs
    if (analysis.scenes && Array.isArray(analysis.scenes)) {
      const sceneStmt = db.prepare(`
        INSERT INTO scenes (
          story_id, scene_id, title, description, setting, time_of_day, mood, 
          key_actions, characters, objects, emotions, image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      for (const scene of analysis.scenes) {
        sceneStmt.run(
          storyId,
          scene.id,
          scene.title,
          scene.description,
          scene.setting,
          scene.timeOfDay,
          scene.mood,
          JSON.stringify(scene.keyActions || []),
          JSON.stringify(scene.characters || []),
          JSON.stringify(scene.objects || []),
          JSON.stringify(scene.emotions || []),
          scene.imageUrl || null
        )
      }
    }
    
    return storyId
  })
  
  return transaction()
}

// Get all stories with their analysis
export function getAllStories(): Array<{
  id: number
  title: string
  story: string
  analysis: any
  createdAt: string
}> {
  const stmt = db.prepare(`
    SELECT id, title, story, analysis, created_at
    FROM stories
    ORDER BY created_at DESC
  `)
  
  const stories = stmt.all() as Array<{
    id: number
    title: string
    story: string
    analysis: string
    created_at: string
  }>
  
  // Get characters and scenes with image URLs for each story
  const storiesWithImages = stories.map(story => {
    const analysis = JSON.parse(story.analysis)
    
    // Get characters with image URLs
    const charStmt = db.prepare(`
      SELECT name, mentions, description, attributes, relationships, image_url
      FROM characters
      WHERE story_id = ?
      ORDER BY id
    `)
    const characters = charStmt.all(story.id) as Array<{
      name: string
      mentions: number
      description: string
      attributes: string
      relationships: string
      image_url: string | null
    }>
    
    // Get scenes with image URLs
    const sceneStmt = db.prepare(`
      SELECT scene_id, title, description, setting, time_of_day, mood, key_actions, characters, objects, emotions, image_url
      FROM scenes
      WHERE story_id = ?
      ORDER BY scene_id
    `)
    const scenes = sceneStmt.all(story.id) as Array<{
      scene_id: number
      title: string
      description: string
      setting: string
      time_of_day: string
      mood: string
      key_actions: string
      characters: string
      objects: string
      emotions: string
      image_url: string | null
    }>
    
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
  })
  
  return storiesWithImages
}

// Get a specific story by ID with image URLs
export function getStoryById(id: number): {
  id: number
  title: string
  story: string
  analysis: any
  createdAt: string
} | null {
  const stmt = db.prepare(`
    SELECT id, title, story, analysis, created_at
    FROM stories
    WHERE id = ?
  `)
  
  const story = stmt.get(id) as {
    id: number
    title: string
    story: string
    analysis: string
    created_at: string
  } | undefined
  
  if (!story) return null
  
  const analysis = JSON.parse(story.analysis)
  
  // Get characters with image URLs
  const charStmt = db.prepare(`
    SELECT name, mentions, description, attributes, relationships, image_url
    FROM characters
    WHERE story_id = ?
    ORDER BY id
  `)
  const characters = charStmt.all(id) as Array<{
    name: string
    mentions: number
    description: string
    attributes: string
    relationships: string
    image_url: string | null
  }>
  
  // Get scenes with image URLs
  const sceneStmt = db.prepare(`
    SELECT scene_id, title, description, setting, time_of_day, mood, key_actions, characters, objects, emotions, image_url
    FROM scenes
    WHERE story_id = ?
    ORDER BY scene_id
  `)
  const scenes = sceneStmt.all(id) as Array<{
    scene_id: number
    title: string
    description: string
    setting: string
    time_of_day: string
    mood: string
    key_actions: string
    characters: string
    objects: string
    emotions: string
    image_url: string | null
  }>
  
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
}

// Delete a story by ID
export function deleteStoryById(id: number): boolean {
  try {
    const transaction = db.transaction(() => {
      // Delete related characters
      const charStmt = db.prepare(`
        DELETE FROM characters
        WHERE story_id = ?
      `)
      charStmt.run(id)
      
      // Delete related scenes
      const sceneStmt = db.prepare(`
        DELETE FROM scenes
        WHERE story_id = ?
      `)
      sceneStmt.run(id)
      
      // Delete the story
      const storyStmt = db.prepare(`
        DELETE FROM stories
        WHERE id = ?
      `)
      const result = storyStmt.run(id)
      
      return result.changes > 0
    })
    
    return transaction()
  } catch (error) {
    console.error('Error deleting story:', error)
    return false
  }
}

// Delete all stories
export function deleteAllStories(): boolean {
  try {
    const transaction = db.transaction(() => {
      // Delete all characters
      db.exec(`DELETE FROM characters`)
      
      // Delete all scenes
      db.exec(`DELETE FROM scenes`)
      
      // Delete all stories
      db.exec(`DELETE FROM stories`)
      
      return true
    })
    
    return transaction()
  } catch (error) {
    console.error('Error deleting all stories:', error)
    return false
  }
}

// Initialize the database when this module is imported
initializeDatabase()

// Export the database instance for direct access if needed
export { db }