import { NextRequest, NextResponse } from 'next/server';
import { hasAccess, ProtectionRule } from '../edge';


export const accessRules: ProtectionRule[] = [
  // Admin Dashboard - Only accessible to users in the 'adminSpace'
  {
    path: /^\/admin\/dashboard/,
    spaces: ['adminSpace'],
    category: 'page',
    description: 'Access to the admin dashboard for managing site content and settings.'
  },
  // Public Profile Pages - Accessible to all authenticated users
  {
    path: /^\/profile\/\w+/,
    accessIds: ['authenticatedUserAccessId'],
    category: 'page',
    description: 'Access to view and edit user profile information.'
  }
  // Public Pages - Accessible to everyone, including unauthenticated users
  // {
  //   path: /^\/(home|about|contact)/,
  //   category: 'page',
  //   description: 'Public pages, no access restrictions.',
  //   condition: (user: any, req: NextRequest) => {
  //     user.uid;
  //     req.body;
  //     return true;
  //   } // Example of a condition that always returns true
  // },
  // {
  //   path: /^\/api\/user\/\d+/,
  //   category: 'api',
  //   description: 'API endpoint to access or modify user data.',
  //   condition: (user: any, req: NextRequest) => {
  //     const userId = req.nextUrl.pathname.split('/').pop();
  //     return user.spaces.includes('adminSpace') || user.id === parseInt(userId || '', 10);
  //   }
  // },
];

export async function middleware(req: NextRequest) {
  // Check if the request has access according to defined rules
  const { hasAccess: authorized, rule: failedRule } = await hasAccess(req, accessRules);

  // if (!authorized) {
  //   if (failedRule?.category === 'api') {
  //     return new NextResponse(JSON.stringify({ error: 'Unauthorized access' }), {
  //       status: 401,
  //       headers: { 'Content-Type': 'application/json' }
  //     });
  //   } else {
  //     const redirectUrl = new URL('/unauthorized', req.url);
  //     return NextResponse.redirect(redirectUrl);
  //   }
  // }

  return NextResponse.next();
}

// Extract all unique paths from access rules and convert them to string patterns
const uniquePaths = Array.from(new Set(accessRules.map((rule) => rule.path.source)));

// Configuration for the middleware
export const config = {
  /**
   * `matcher` ensures the middleware runs for the specified routes.
   *
   * It dynamically includes all unique paths defined in `accessRules`.
   * Also includes a general pattern to match all API routes.
   */
  matcher: [
    // Include dynamically generated paths from access rules
    ...uniquePaths.map((path) => `/${path}`),
    // Always include all API routes
    '/(api|trpc)(.*)',
    // Skip Next.js internals and common static file types
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
  ]
};
