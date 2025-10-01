import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Remove the import of verifyToken since we can't use it in middleware

// Define which routes are protected
const protectedRoutes = ['/admin', '/story', '/history', '/visualize']
const authRoutes = ['/login', '/signup']
const publicRoutes = ['/home'] // Public landing page

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
// This is a basic check that the token exists and has the right structure
function isTokenValid(token: string | null): boolean {
  if (!token || token.length === 0) return false;

  // Basic JWT structure check (should have 3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    // Try to decode the payload (without verification)
    const payload = JSON.parse(atob(parts[1]));

    // Check if token has expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all API routes except auth routes
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth')) {
      // Allow auth routes to handle their own logic
      return NextResponse.next()
    }
    // All other API routes require authentication (any logged in user)
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

  // Handle root route - let it pass through to the page component
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Allow access to public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow access to auth routes (login, signup) for unauthenticated users
  if (authRoutes.includes(pathname)) {
    // If user is authenticated, redirect them away from auth pages
    if (isAuthenticated) {
      const returnTo = request.nextUrl.searchParams.get('returnTo')
      if (returnTo) {
        return NextResponse.redirect(new URL(returnTo, request.url))
      }
      const url = request.nextUrl.clone()
      url.pathname = '/story'
      return NextResponse.redirect(url)
    }
    // Allow unauthenticated users to access login/signup
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login page for protected routes
  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Add returnTo parameter to preserve the intended destination
    if (pathname !== '/login') {
      url.searchParams.set('returnTo', pathname)
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Configure middleware to run in Node.js runtime instead of Edge Runtime
// This is necessary because we're using crypto functions for JWT verification
export const config = {
  matcher: [
    /*
     * Match specific paths that need authentication checks:
     * - Root path
     * - Public routes (home)
     * - Auth routes (login, signup)
     * - Protected routes (admin, story, history, visualize)
     * - All API routes
     */
    '/',
    '/home',
    '/login',
    '/signup',
    '/admin/:path*',
    '/story/:path*',
    '/history/:path*',
    '/visualize/:path*',
    '/api/:path*'
  ],
}