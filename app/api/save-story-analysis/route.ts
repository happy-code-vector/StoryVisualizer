import { NextResponse } from 'next/server'
import { saveStoryAnalysis } from '@/lib/db-service'

export async function POST(request: Request) {
  try {
    const { title, story, analysis } = await request.json()
    
    if (!story || !analysis) {
      return NextResponse.json({ error: 'Story content and analysis are required' }, { status: 400 })
    }

    // Save the complete analysis with images to the database
    const storyId = saveStoryAnalysis(title, story, analysis)

    return NextResponse.json({ id: storyId, success: true })
  } catch (error) {
    console.error('Error saving story analysis:', error)
    return NextResponse.json({ error: 'Failed to save story analysis' }, { status: 500 })
  }
}