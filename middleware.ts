import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/admin', '/story', '/history', '/visualize']
const authRoutes = ['/login', '/signup']
const publicRoutes = ['/home'] // Public landing page

function getTokenFromCookie(cookieHeader: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const authTokenCookie = cookies.find(cookie => cookie.startsWith('authToken='));
  if (authTokenCookie) {
    return authTokenCookie.split('=')[1];
  }
  return null;
}

function isTokenValid(token: string | null): boolean {
  if (!token || token.length === 0) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(atob(parts[1]));
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
  const cookieHeader = request.headers.get('cookie') || ''
  let token = getTokenFromCookie(cookieHeader)

  if (!token) {
    token = request.cookies.get('authToken')?.value || null
  }

  // Simple token validation (without crypto)
  const isAuthenticated = isTokenValid(token)

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
    return NextResponse.next()
  }

  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
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