import { NextResponse } from 'next/server'
import { deleteAllStories } from '@/lib/supabase-service'
import { verifyToken } from '@/lib/auth-service'

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
        return NextResponse.json({ error: 'Access denied. Admin privileges required to delete stories.' }, { status: 403 })
      } else {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
      }
    }

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