import { NextResponse } from 'next/server'
import { verifyUser } from '@/lib/auth-service'

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json()
    
    // Validate input
    if (!token || !userId) {
      return NextResponse.json({ error: 'Token and user ID are required' }, { status: 400 })
    }
    
    // Verify the user
    const result = await verifyUser(token, userId)
    
    if (!result) {
      return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'User verified successfully'
    })
  } catch (error: any) {
    console.error('Error verifying user:', error)
    return NextResponse.json({ error: error.message || 'Failed to verify user' }, { status: 500 })
  }
}