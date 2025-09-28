import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // For JWT-based auth, we just return success
    // The client will remove the token from storage
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging out:', error)
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 })
  }
}
