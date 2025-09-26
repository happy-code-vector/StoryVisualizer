import { NextResponse } from 'next/server'
import { getAllStories, getStoryById } from '@/lib/supabase-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (id) {
      // Get a specific story by ID
      const story = await getStoryById(parseInt(id))
      if (!story) {
        return NextResponse.json({ error: 'Story not found' }, { status: 404 })
      }
      return NextResponse.json(story)
    } else {
      // Get all stories
      const stories = await getAllStories()
      return NextResponse.json(stories || [])
    }
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
  }
}