import { NextRequest, NextResponse } from 'next/server'
import { getAllStories } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  try {
    // Get limit from query parameters (default to 3)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '3')

    // Fetch all stories
    const allStories = await getAllStories()
    
    if (!allStories) {
      return NextResponse.json({ stories: [] })
    }

    // Sort by creation date (most recent first) and limit results
    const recentStories = allStories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(story => ({
        id: story.id,
        title: story.title,
        story: story.story.substring(0, 300) + '...', // Truncate story content for preview
        analysis: {
          characters: story.analysis.characters.slice(0, 3), // Limit characters for preview
          scenes: story.analysis.scenes.slice(0, 3).map(scene => ({ // Limit scenes for preview
            id: scene.id,
            title: scene.title,
            imageUrl: scene.imageUrl,
            videoUrl: scene.videoUrl
          }))
        },
        models: story.models,
        createdAt: story.createdAt
      }))

    return NextResponse.json({ stories: recentStories })

  } catch (error) {
    console.error('[API] Error fetching recent stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent stories' },
      { status: 500 }
    )
  }
}