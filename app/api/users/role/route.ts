import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-service'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_API_KEY || ''
)

// Check if user has root access (only root can change roles)
async function checkRootAccess(request: Request): Promise<{ authorized: boolean; role?: string }> {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1] // Bearer TOKEN
    
    if (!token) {
      return { authorized: false }
    }
    
    // Verify the token
    const decoded = verifyToken(token)
    if (!decoded) {
      return { authorized: false }
    }
    
    // Check if user has root access (only root can change roles)
    if (decoded.role !== 'root') {
      return { authorized: false, role: decoded.role }
    }
    
    return { authorized: true, role: decoded.role }
  } catch (error) {
    console.error('Error checking root access:', error)
    return { authorized: false }
  }
}

export async function PUT(request: Request) {
  try {
    // Check if user has root access
    const { authorized, role } = await checkRootAccess(request)
    if (!authorized) {
      if (role) {
        return NextResponse.json({ error: 'Access denied. Root privileges required to change user roles.' }, { status: 403 })
      } else {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
      }
    }

    const { userId, role: newRole } = await request.json()
    
    if (!userId || !newRole) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'paid', 'unpaid']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin, paid, or unpaid' }, { status: 400 })
    }

    // Check if trying to change a root user's role
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('role, username')
      .eq('id', userId)
      .single()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (userData.role === 'root') {
      return NextResponse.json({ error: 'Cannot change root user roles' }, { status: 403 })
    }

    // Update user role
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return NextResponse.json({ 
      message: `User ${userData.username} role changed to ${newRole} successfully` 
    })
  } catch (error: any) {
    console.error('Error changing user role:', error)
    return NextResponse.json({ error: error.message || 'Failed to change user role' }, { status: 500 })
  }
}