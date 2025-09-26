import { NextResponse } from 'next/server'
import { deleteStoryById } from '@/lib/supabase-service'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 })
    }
    
    const deleted = await deleteStoryById(id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting story:', error)
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 })
  }
}