// utils/accessControl.ts
import { NextRequest, NextResponse } from 'next/server';
import { Claims, SessionCache } from '../session'; // Assuming SessionData is the structure of the session

export type ProtectionRule = {
  path: RegExp;
  accessIds?: string | string[];
  spaces?: string | string[];
  condition?: (user: Claims, req: NextRequest) => boolean;
  category: 'page' | 'api';
  [key: string]: any; // Allow additional properties
};

export type HasAccessResult = {
  hasAccess: boolean;
  rule?: ProtectionRule;
};

export type HasAccessFunction = (req: NextRequest, rules: ProtectionRule[]) => Promise<HasAccessResult>;

export function accessControlFactory(sessionCache: SessionCache): HasAccessFunction {
  return async function hasAccess(req: NextRequest, rules: ProtectionRule[]): Promise<HasAccessResult> {
    const res = new NextResponse();
    const session = await sessionCache.get(req, res);

    const requestedPath = req.nextUrl.pathname;

    for (const rule of rules) {
      if (rule.path.test(requestedPath || '')) {

        if (!session?.user) {
          return { hasAccess: false };
        }

        // If a path matches, deny access unless specific conditions are met
        if (rule.accessIds || rule.spaces || rule.condition) {
          const { access: userAccessIds = [], spaces: userSpaces = [] } = session.user;

          if (rule.accessIds) {
            const accessIds = Array.isArray(rule.accessIds) ? rule.accessIds : [rule.accessIds];
            if (accessIds.some((id) => userAccessIds.includes(id))) {
              return { hasAccess: true, rule };
            }
          }

          if (rule.spaces) {
            const spaces = Array.isArray(rule.spaces) ? rule.spaces : [rule.spaces];
            if (spaces.some((space) => userSpaces.includes(space))) {
              return { hasAccess: true, rule };
            }
          }

          if (rule.condition && rule.condition(session.user, req)) {
            return { hasAccess: true, rule };
          }

          // If a matching rule is found but no access conditions are met, deny access
          return { hasAccess: false };
        }

        // If there's no specific access control in the rule, deny access
        return { hasAccess: false };
      }
    }

    // If no paths match, grant access
    return { hasAccess: true };
  };
}
