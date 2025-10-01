import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth-service'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_API_KEY || ''
)

// Check if user has admin access
async function checkAdminAccess(request: Request): Promise<{ authorized: boolean; role?: string }> {
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
    
    // Check if user has admin access (root or admin roles)
    if (decoded.role !== 'root' && decoded.role !== 'admin') {
      return { authorized: false, role: decoded.role }
    }
    
    return { authorized: true, role: decoded.role }
  } catch (error) {
    console.error('Error checking admin access:', error)
    return { authorized: false }
  }
}

export async function DELETE(request: Request) {
  try {
    // Check if user has admin access
    const { authorized, role } = await checkAdminAccess(request)
    if (!authorized) {
      if (role) {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 })
      } else {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
      }
    }

    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if trying to delete a root user
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('role, username')
      .eq('id', userId)
      .single()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (userData.role === 'root') {
      return NextResponse.json({ error: 'Cannot delete root users' }, { status: 403 })
    }

    // Delete the user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return NextResponse.json({ 
      message: `User ${userData.username} deleted successfully` 
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
  }
}