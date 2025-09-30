import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Remove the import of verifyToken since we can't use it in middleware

// Define which routes are protected
const protectedRoutes = ['/admin', '/api/models']
const authRoutes = ['/login', '/signup']

// Function to extract token from cookie
function getTokenFromCookie(cookieHeader: string): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const authTokenCookie = cookies.find(cookie => cookie.startsWith('authToken='));
  if (authTokenCookie) {
    return authTokenCookie.split('=')[1];
  }
  return null;
}

// Simple JWT token verification without using the crypto module
// This is a basic check that the token exists, but we'll rely on the API route for full verification
function isTokenValid(token: string | null): boolean {
  // In a real implementation, we would verify the token signature
  // But since we can't use crypto in middleware, we'll just check if it exists
  // The API route will do the full verification
  return !!token && token.length > 0;
}

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
  const cookieHeader = request.headers.get('cookie') || ''
  let token = getTokenFromCookie(cookieHeader)
  
  // If no token in cookie header, check if it's in the request cookies (for server-side)
  if (!token) {
    token = request.cookies.get('authToken')?.value || null
  }
  
  // Simple token validation (without crypto)
  const isAuthenticated = isTokenValid(token)
  
  // Redirect unauthenticated users to login page
  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Add returnTo parameter for admin route
    if (pathname.startsWith('/admin')) {
      url.searchParams.set('returnTo', '/admin')
    }
    return NextResponse.redirect(url)
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.includes(pathname)) {
    // Check if there's a returnTo parameter
    const returnTo = request.nextUrl.searchParams.get('returnTo')
    if (returnTo) {
      // Redirect to the intended destination
      return NextResponse.redirect(new URL(returnTo, request.url))
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/story'
    return NextResponse.redirect(url)
  }
  
  // For admin routes, we'll allow the request to proceed
  // The admin page itself will do the full token verification
  if (pathname.startsWith('/admin') && token) {
    // We're allowing access here, but the admin page will do the full verification
    // This is a compromise to work around the Edge Runtime limitation
  }
  
  return NextResponse.next()
}

// Configure middleware to run in Node.js runtime instead of Edge Runtime
// This is necessary because we're using crypto functions for JWT verification
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