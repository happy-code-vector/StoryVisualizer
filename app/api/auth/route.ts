import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-service'

export async function GET(request: Request) {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1] // Bearer TOKEN
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    
    // Get current user
    const user = await getCurrentUser(token)
    
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    
    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        verified: user.verified
      }
    })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

// We don't need the DELETE function for this route since we're using a custom auth system
// The logout functionality is handled by the logout API route