import { auth } from '@/auth';
import { NextResponse, type NextMiddleware } from 'next/server';

const middleware: NextMiddleware = auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  const isProtected =
    nextUrl.pathname.startsWith('/dashboard') ||
    nextUrl.pathname.startsWith('/projects') ||
    nextUrl.pathname.startsWith('/quality') ||
    nextUrl.pathname.startsWith('/environment') ||
    nextUrl.pathname.startsWith('/safety') ||
    nextUrl.pathname.startsWith('/assets') ||
    nextUrl.pathname.startsWith('/documents') ||
    nextUrl.pathname.startsWith('/audits') ||
    nextUrl.pathname.startsWith('/bim') ||
    nextUrl.pathname.startsWith('/isms') ||
    nextUrl.pathname.startsWith('/bcp') ||
    nextUrl.pathname.startsWith('/analytics');

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl.origin));
  }

  // Redirect authenticated users away from login page
  if (nextUrl.pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
  }

  return NextResponse.next();
}) as unknown as NextMiddleware;

export default middleware;

export const config = {
  matcher: [
    // Skip static files and API routes (except auth)
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
