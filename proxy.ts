import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/constants';

/**
 * Edge proxy (formerly "middleware") can't verify a session cookie (the Admin SDK
 * needs Node), so it only checks the cookie is *present* and redirects to sign-in
 * when it isn't. Real verification happens in pages/route handlers via
 * getSessionUser (ADR 0004).
 */
export function proxy(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (hasSession) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/sign-in';
  url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
