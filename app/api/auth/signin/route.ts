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
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role
      },
      token: result.token
    })
  } catch (error: any) {
    console.error('Error signing in:', error)
    return NextResponse.json({ error: error.message || 'Failed to sign in' }, { status: 500 })
  }
}
