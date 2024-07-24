import { NextRequest, NextResponse } from 'next/server';

// config/accessControl.ts
import { AccessRule, hasAccess } from '../dist';

export const accessRules: AccessRule[] = [
  // Admin Dashboard - Only accessible to users in the 'adminSpace'
  {
    path: /^\/admin\/dashboard/,
    spaces: ['adminSpace'],
    category: 'page',
    description: 'Access to the admin dashboard for managing site content and settings.'
  },
  // User Management - Accessible to users with specific access IDs (e.g., admin, manager)
  {
    path: /^\/admin\/users/,
    accessIds: ['adminAccessId', 'managerAccessId'],
    category: 'page',
    description: 'Access to user management interface, including creating, editing, and deleting users.'
  },
  // Public Profile Pages - Accessible to all authenticated users
  {
    path: /^\/profile\/\w+/,
    accessIds: ['authenticatedUserAccessId'],
    category: 'page',
    description: 'Access to view and edit user profile information.'
  },
  // Public Pages - Accessible to everyone, including unauthenticated users
  {
    path: /^\/(home|about|contact)/,
    category: 'page',
    description: 'Public pages, no access restrictions.',
    condition: (user: any, ctx: { req: NextRequest }) => true // Example of a condition that always returns true
  },
  // API Endpoint for Admin Operations - Restricted to admin space
  {
    path: /^\/api\/admin\/\w+/,
    spaces: ['adminSpace'],
    category: 'api',
    description: 'API endpoints for administrative operations, restricted to admins only.'
  },
  // API Endpoint for User Data - Accessible only to the user or admins
  {
    path: /^\/api\/user\/\d+/,
    category: 'api',
    description: 'API endpoint to access or modify user data.',
    condition: (user: any, ctx: { req: NextRequest }) => {
      const userId = ctx.req.nextUrl.pathname.split('/').pop();
      return user.spaces.includes('adminSpace') || user.id === parseInt(userId || '', 10);
    }
  },
  // Settings Page - Accessible to users with specific roles or access IDs
  {
    path: /^\/settings/,
    spaces: ['adminSpace', 'userSpace'],
    accessIds: ['adminAccessId', 'settingsAccessId'],
    category: 'page',
    description: 'Access to settings page for configuring user-specific preferences and system settings.'
  },
  // Orders Management - Accessible to users in the 'ordersTeamSpace'
  {
    path: /^\/orders\/\w+/,
    spaces: ['ordersTeamSpace'],
    category: 'page',
    description: 'Access to order management system for processing and tracking orders.'
  }
];

export async function middleware(req: NextRequest) {
  // Check if the request has access according to defined rules
  const { hasAccess: authorized, rule: failedRule } = await hasAccess(req, accessRules);

  if (!authorized) {
    if (failedRule?.category === 'api') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized access' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const redirectUrl = new URL('/unauthorized', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

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
