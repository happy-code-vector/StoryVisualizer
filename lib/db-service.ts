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
}

// Initialize the database
const dbPath = path.join(process.cwd(), 'story-visualizer.db')
const db = new Database(dbPath)

// Create tables if they don't exist
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

  console.log('Database initialized')
}

// Save a story and its analysis
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
    
    // Insert characters
    if (analysis.characters && Array.isArray(analysis.characters)) {
      const charStmt = db.prepare(`
        INSERT INTO characters (story_id, name, mentions, description, attributes, relationships)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      
      for (const character of analysis.characters) {
        charStmt.run(
          storyId,
          character.name,
          character.mentions,
          character.description,
          JSON.stringify(character.attributes || []),
          JSON.stringify(character.relationships || [])
        )
      }
    }
    
    // Insert scenes
    if (analysis.scenes && Array.isArray(analysis.scenes)) {
      const sceneStmt = db.prepare(`
        INSERT INTO scenes (
          story_id, scene_id, title, description, setting, time_of_day, mood, 
          key_actions, characters, objects, emotions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          JSON.stringify(scene.emotions || [])
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
  
  return stories.map(story => ({
    id: story.id,
    title: story.title,
    story: story.story,
    analysis: JSON.parse(story.analysis),
    createdAt: story.created_at
  }))
}

// Get a specific story by ID
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
  
  return {
    id: story.id,
    title: story.title,
    story: story.story,
    analysis: JSON.parse(story.analysis),
    createdAt: story.created_at
  }
}

// Initialize the database when this module is imported
initializeDatabase()

// Export the database instance for direct access if needed
export { db }