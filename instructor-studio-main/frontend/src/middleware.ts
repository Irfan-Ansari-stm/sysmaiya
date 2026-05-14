import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/admin'];

// Routes accessible only to specific roles (checked server-side via cookie presence; full check in client)
const ADMIN_PREFIXES = ['/admin'];

// Public-only routes (redirect to dashboard if logged in)
const AUTH_ONLY = ['/auth/login', '/auth/register'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get('access_token')?.value
    ?? req.headers.get('authorization')?.replace('Bearer ', '');

  // Redirect authenticated users away from auth pages
  if (AUTH_ONLY.some((p) => pathname.startsWith(p)) && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protect dashboard + admin routes
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !accessToken) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
