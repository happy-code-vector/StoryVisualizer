import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-service'

// Define which routes are protected
const protectedRoutes = ['/admin', '/api/models']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API auth routes
  if (
    pathname.includes('.') || 
    pathname.includes('_next') ||
    pathname.includes('favicon') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next()
  }
  
  // Get token from cookies
  const token = request.cookies.get('authToken')?.value
  
  // Check if user is authenticated
  const decoded = token ? verifyToken(token) : null
  const isAuthenticated = !!decoded
  
  // Redirect unauthenticated users to login page
  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/story'
    return NextResponse.redirect(url)
  }
  
  // Check role-based access and verification for admin routes
  if (pathname.startsWith('/admin') && token && decoded) {
    // Check if user is verified
    if (!decoded.verified) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'unverified')
      return NextResponse.redirect(url)
    }
    
    // Only allow root and admin users to access admin routes
    if (decoded.role !== 'root' && decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}