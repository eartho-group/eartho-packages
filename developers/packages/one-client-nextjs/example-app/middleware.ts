import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '../edge';

export async function middleware(req: NextRequest) {
  // Check if the request has access according to defined rules
  const res = NextResponse.next();
  const user = await getSession(req, res);

  const isUserConnected = user?.accessToken != null;
  const userSpaces = user?.spaces; // Which spaces the user has access to in your project after he connect
  const userAccessPoints = user?.access; // Which access points the user has access to in your project after he connect


  return NextResponse.next();
}

// Configuration for the middleware
export const config = {
  /**
   * `matcher` ensures the middleware runs for the specified routes.
   */
  matcher: [
    // Always include all API routes
    '/(api|trpc)(.*)',
    // Skip Next.js internals and common static file types
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
  ]
};
