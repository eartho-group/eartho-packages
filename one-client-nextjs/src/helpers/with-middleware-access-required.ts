import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import { SessionCache } from '../session';
import { GetConfig } from '../config';
import { EarthoNextRequest } from '../http';
import { NextMiddlewareResult } from 'next/dist/server/web/types';

export type WithMiddlewareAccessRequiredOptions = {
  middleware?: (req: NextRequest, event: NextFetchEvent) => NextMiddlewareResult | Promise<NextMiddlewareResult>;
  returnTo?: string | ((req: NextRequest) => Promise<string> | string);
};

export type WithMiddlewareAccessRequired = (
  middlewareOrOpts?: (
    req: NextRequest,
    event: NextFetchEvent
  ) => NextMiddlewareResult | Promise<NextMiddlewareResult> | WithMiddlewareAccessRequiredOptions
) => (req: NextRequest, event: NextFetchEvent) => Promise<NextMiddlewareResult>;


export default function withMiddlewareAccessRequiredFactory(
  getConfig: GetConfig,
  sessionCache: SessionCache
): WithMiddlewareAccessRequired {
  return function withMiddlewareAccessRequired(
    opts?
  ): (req: NextRequest, event: NextFetchEvent) => Promise<NextMiddlewareResult> {
    return async function wrappedMiddleware(req: NextRequest, event: NextFetchEvent): Promise<NextMiddlewareResult> {
      const {
        routes: { login }
      } = await getConfig(new EarthoNextRequest(req));

      let middleware:
        | ((req: NextRequest, event: NextFetchEvent) => NextMiddlewareResult | Promise<NextMiddlewareResult>)
        | undefined;
      const { pathname, origin, search } = req.nextUrl;
      const returnTo = `${pathname}${search}`;

      opts;

      const authRes = NextResponse.next();
      const session = await sessionCache.get(req, authRes);

      if (!session?.user) {
        return NextResponse.redirect(new URL(`${login}?returnTo=${encodeURIComponent(returnTo)}`, origin));
      }

      const res = middleware && (await middleware(req, event));

      if (res) {
        const nextRes = new NextResponse(res.body, res);
        const cookies = authRes.cookies.getAll();
        if ('cookies' in res) {
          for (const cookie of res.cookies.getAll()) {
            nextRes.cookies.set(cookie);
          }
        }
        for (const cookie of cookies) {
          if (!nextRes.cookies.get(cookie.name)) {
            nextRes.cookies.set(cookie);
          }
        }
        return nextRes;
      } else {
        return authRes;
      }
    };
  };
}
