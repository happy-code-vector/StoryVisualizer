import { NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

// Initialize the database
const dbPath = path.join(process.cwd(), 'story-visualizer.db')
const db = new Database(dbPath)

export async function POST(request: Request) {
  try {
    const { storyId, characters, scenes } = await request.json()
    
    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 })
    }

    // Update character images
    if (characters && Array.isArray(characters)) {
      const charStmt = db.prepare(`
        UPDATE characters 
        SET image_url = ? 
        WHERE story_id = ? AND name = ?
      `)
      
      for (const character of characters) {
        charStmt.run(character.imageUrl || null, storyId, character.name)
      }
    }
    
    // Update scene images
    if (scenes && Array.isArray(scenes)) {
      const sceneStmt = db.prepare(`
        UPDATE scenes 
        SET image_url = ? 
        WHERE story_id = ? AND scene_id = ?
      `)
      
      for (const scene of scenes) {
        sceneStmt.run(scene.imageUrl || null, storyId, scene.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating story images:', error)
    return NextResponse.json({ error: 'Failed to update story images' }, { status: 500 })
  }
}