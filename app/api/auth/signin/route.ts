import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth-service'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    // Validate input
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }
    
    // Authenticate the user
    const result = await authenticateUser(username, password)
    
    if (!result) {
      // Check if this is because the user is not verified
      try {
        // We'll implement a simple check here to provide a better error message
        return NextResponse.json({ error: 'Invalid credentials or account not verified' }, { status: 401 })
      } catch (e) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
        verified: result.user.verified
      },
      token: result.token
    })
  } catch (error: any) {
    console.error('Error signing in:', error)
    // Check if the error is about verification
    if (error.message && error.message.includes('verified')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Failed to sign in' }, { status: 500 })
  }
}