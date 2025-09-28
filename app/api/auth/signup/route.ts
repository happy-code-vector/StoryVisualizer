import { NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth-service'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    // Validate input
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }
    
    // Create the user
    const user = await createUser(username, password)
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
    
    // Generate token
    const token = generateToken(user)
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token
    })
  } catch (error: any) {
    console.error('Error signing up:', error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
  }
}