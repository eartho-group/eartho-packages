// utils/accessControl.ts
import { NextApiRequest } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { Claims, SessionCache } from '../session'; // Assuming SessionData is the structure of the session

export type ProtectionRule = {
  path: RegExp;
  accessIds?: string | string[];
  spaces?: string | string[];
  condition?: (user: Claims, req: NextRequest | NextApiRequest) => boolean;
  category: 'page' | 'api';
  [key: string]: any; // Allow additional properties
};

export type HasAccessResult = {
  hasAccess: boolean;
  rule?: ProtectionRule;
};

export type HasAccessFunction = (
  req: NextRequest | NextApiRequest,
  rules: ProtectionRule[]
) => Promise<HasAccessResult>;

export function accessControlFactory(sessionCache: SessionCache): HasAccessFunction {
  return async function hasAccess(
    req: NextRequest | NextApiRequest,
    rules: ProtectionRule[]
  ): Promise<HasAccessResult> {
    const res = new NextResponse();
    const session = await sessionCache.get(req, res);

    if (!session?.user) {
      return { hasAccess: false };
    }

    const { access: userAccessIds = [], spaces: userSpaces = [] } = session.user;
    const requestedPath = req instanceof NextRequest ? req.nextUrl.pathname : req.url;

    for (const rule of rules) {
      if (rule.path.test(requestedPath || '')) {
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
        if (rule.condition && rule.condition(session.user, req)) {
          return { hasAccess: true, rule };
        }
      }
    }

    return { hasAccess: false };
  };
}
