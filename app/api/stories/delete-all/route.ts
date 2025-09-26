import { NextResponse } from 'next/server'
import { deleteAllStories } from '@/lib/supabase-service'

export async function DELETE() {
  try {
    const deleted = await deleteAllStories()
    
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete stories' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting all stories:', error)
    return NextResponse.json({ error: 'Failed to delete stories' }, { status: 500 })
  }
}