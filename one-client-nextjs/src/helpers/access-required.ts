// utils/accessControl.ts
import { NextRequest } from 'next/server';
import { getSession } from '../index';

export type AccessRule = {
  path: RegExp;
  accessIds?: string | string[];
  spaces?: string | string[];
  condition?: (user: any, ctx: { req: NextRequest }) => boolean;
  category: 'page' | 'api';
  [key: string]: any; // Allow additional properties
};

export async function hasAccess(
  req: NextRequest,
  rules: AccessRule[]
): Promise<{ hasAccess: boolean; rule?: AccessRule }> {
  const session = await getSession();

  if (!session?.user) {
    return { hasAccess: false };
  }

  const { accessIds: userAccessIds = [], spaces: userSpaces = [] } = session.user;
  const requestedPath = req.nextUrl.pathname;

  for (const rule of rules) {
    if (rule.path.test(requestedPath)) {
      // Check access IDs if defined
      if (rule.accessIds) {
        const accessIds = Array.isArray(rule.accessIds) ? rule.accessIds : [rule.accessIds];
        if (accessIds.some((id) => userAccessIds.includes(id))) {
          return { hasAccess: true, rule };
        }
      }

      // Check spaces if defined
      if (rule.spaces) {
        const spaces = Array.isArray(rule.spaces) ? rule.spaces : [rule.spaces];
        if (spaces.some((space) => userSpaces.includes(space))) {
          return { hasAccess: true, rule };
        }
      }

      // Check additional conditions if provided
      if (rule.condition && rule.condition(session.user, { req })) {
        return { hasAccess: true, rule };
      }
    }
  }

  return { hasAccess: false };
}
