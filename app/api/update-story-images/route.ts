import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-service'

export async function POST(request: Request) {
  try {
    const { storyId, characters, scenes } = await request.json()

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 })
    }

    // Update character images in Supabase
    if (characters && Array.isArray(characters)) {
      for (const character of characters) {
        const { error } = await supabase
          .from('characters')
          .update({ image_url: character.imageUrl || null })
          .eq('story_id', storyId)
          .eq('name', character.name)

        if (error) {
          console.error('Error updating character image:', error)
        }
      }
    }

    // Update scene images in Supabase
    if (scenes && Array.isArray(scenes)) {
      for (const scene of scenes) {
        const { error } = await supabase
          .from('scenes')
          .update({ image_url: scene.imageUrl || null })
          .eq('story_id', storyId)
          .eq('scene_id', scene.id)

        if (error) {
          console.error('Error updating scene image:', error)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating story images:', error)
    return NextResponse.json({ error: 'Failed to update story images' }, { status: 500 })
  }
}
