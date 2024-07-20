import { NextApiResponse, NextApiRequest } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import {
  AuthorizationParameters,
  HandleCallback as BaseHandleCallback,
  AfterCallback as BaseAfterCallback,
  HandleConnect as BaseHandleConnect
} from '../eartho-session';
import { Session } from '../session';
import { assertReqRes } from '../utils/assert';
import { GetConfig, NextConfig } from '../config';
import { CallbackHandlerError, HandlerErrorCause } from '../utils/errors';
import { EarthoNextApiRequest, EarthoNextApiResponse, EarthoNextRequest, EarthoNextResponse } from '../http';
import { AppRouteHandlerFnContext, AuthHandler, getHandler, Handler, OptionsProvider } from './router-helpers';

/**
 * afterCallback hook for page router {@link AfterCallbackPageRoute} and app router {@link AfterCallbackAppRoute}
 */
export type AfterCallback = AfterCallbackPageRoute | AfterCallbackAppRoute;

/**
 * Use this function for validating additional claims on the user's ID token or adding removing items from
 * the session after login.
 *
 * @example Validate additional claims
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 *
 * const afterCallback = (req, res, session, state) => {
 *   if (session.user.isAdmin) {
 *     return session;
 *   } else {
 *     res.status(401).end('User is not admin');
 *   }
 * };
 *
 * export default handleAccess({
 *   async callback(req, res) {
 *     try {
 *       await handleCallback(req, res, { afterCallback });
 *     } catch (error) {
 *       res.status(error.status || 500).end();
 *     }
 *   }
 * });
 * ```
 *
 * @example Modify the session after login
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 *
 * const afterCallback = (req, res, session, state) => {
 *   session.user.customProperty = 'foo';
 *   delete session.refreshToken;
 *   return session;
 * };
 *
 * export default handleAccess({
 *   async callback(req, res) {
 *     try {
 *       await handleCallback(req, res, { afterCallback });
 *     } catch (error) {
 *       res.status(error.status || 500).end();
 *     }
 *   }
 * });
 * ```
 *
 * @example Redirect successful login based on claim
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 *
 * const afterCallback = (req, res, session, state) => {
 *   if (!session.user.isAdmin) {
 *     res.setHeader('Location', '/admin');
 *   }
 *   return session;
 * };
 *
 * export default handleAccess({
 *   async callback(req, res) {
 *     try {
 *       await handleCallback(req, res, { afterCallback });
 *     } catch (error) {
 *       res.status(error.status || 500).end(error.message);
 *     }
 *   }
 * });
 * ```
 *
 * @throws {@link HandlerError}
 *
 * @category Server
 */
export type AfterCallbackPageRoute = (
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session,
  state?: { [key: string]: any }
) => Promise<Session | undefined> | Session | undefined;

/**
 * Use this function for validating additional claims on the user's ID token or adding removing items from
 * the session after login.
 *
 * @example Validate additional claims
 *
 * ```js
 * // app/api/access/[eartho]/route.js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 * import { NextResponse } from 'next/server';
 *
 * const afterCallback = (req, session) => {
 *   if (session.user.isAdmin) {
 *     return session;
 *   }
 * };

 * export const GET = handleAccess({
 *   async callback(req, ctx) {
 *     const res = await handleCallback(req, ctx, { afterCallback });
 *     const session = await getSession(req, res);
 *     if (!session) {
 *       return NextResponse.redirect(`${process.env.EARTHO_BASE_URL}/fail`, res);
 *     }
 *     return res;
 *   },
 * });
 * ```
 *
 * @example Modify the session after login
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 * import { NextResponse } from 'next/server';
 *
 * const afterCallback = (req, session, state) => {
 *   session.user.customProperty = 'foo';
 *   delete session.refreshToken;
 *   return session;
 * };
 *
 * export const GET = handleAccess({
 *   callback: handleCallback({ afterCallback })
 * });
 * ```
 *
 * @example Redirect successful login based on claim (afterCallback is not required).
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 * import { NextResponse } from 'next/server';
 *
 * export const GET = handleAccess({
 *   async callback(req, ctx) {
 *     const res = await handleCallback(req, ctx);
 *     const session = await getSession(req, res);
 *     if (session?.user.isAdmin) {
 *       return NextResponse.redirect(`${process.env.EARTHO_BASE_URL}/admin`, res);
 *     }
 *     return res;
 *   },
 * });
 * ```
 *
 * @throws {@link HandlerError}
 *
 * @category Server
 */
export type AfterCallbackAppRoute = (
  req: NextRequest,
  session: Session,
  state?: { [key: string]: any }
) => Promise<Session | Response | undefined> | Session | Response | undefined;

/**
 * Options to customize the callback handler.
 *
 * @see {@link HandleCallback}
 *
 * @category Server
 */
export interface CallbackOptions {
  client_id?: string;

  afterCallback?: AfterCallback;

  /**
   * This is useful to specify in addition to {@link BaseConfig.baseURL} when your app runs on multiple domains,
   * it should match {@link LoginOptions.authorizationParams.redirect_uri}.
   */
  redirectUri?: string;

  /**
   * This is useful to specify instead of {@link NextConfig.organization} when your app has multiple
   * organizations, it should match {@link LoginOptions.authorizationParams}.
   */
  organization?: string;

  /**
   * This is useful for sending custom query parameters in the body of the code exchange request
   * for use in Actions/Rules.
   */
  authorizationParams?: Partial<AuthorizationParameters>;
}

/**
 * Options provider for the default callback handler.
 * Use this to generate options that depend on values from the request.
 *
 * @category Server
 */
export type CallbackOptionsProvider = OptionsProvider<CallbackOptions>;

/**
 * Use this to customize the default callback handler without overriding it.
 * You can still override the handler if needed.
 *
 * @example Pass an options object
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 *
 * export default handleAccess({
 *   callback: handleCallback({ redirectUri: 'https://example.com' })
 * });
 * ```
 *
 * @example Pass a function that receives the request and returns an options object
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 *
 * export default handleAccess({
 *   callback: handleCallback((req) => {
 *     return { redirectUri: 'https://example.com' };
 *   })
 * });
 * ```
 *
 * This is useful for generating options that depend on values from the request.
 *
 * @example Override the callback handler
 *
 * ```js
 * import { handleAccess, handleCallback } from '@eartho/one-client-nextjs';
 *
 * export default handleAccess({
 *   callback: async (req, res) => {
 *     try {
 *       await handleCallback(req, res, {
 *         redirectUri: 'https://example.com'
 *       });
 *     } catch (error) {
 *       console.error(error);
 *     }
 *   }
 * });
 * ```
 *
 * @category Server
 */
export type HandleCallback = AuthHandler<CallbackOptions>;

/**
 * The handler for the `/api/access/callback` API route.
 *
 * @throws {@link HandlerError}
 *
 * @category Server
 */
export type CallbackHandler = Handler<CallbackOptions>;

/**
 * @ignore
 */
export default function handleCallbackFactory(handler: BaseHandleCallback, getConfig: GetConfig): HandleCallback {
  const appRouteHandler = appRouteHandlerFactory(handler, getConfig);
  const pageRouteHandler = pageRouteHandlerFactory(handler, getConfig);

  return getHandler<CallbackOptions>(appRouteHandler, pageRouteHandler) as HandleCallback;
}

const applyOptions = (
  req: NextApiRequest | NextRequest,
  res: NextApiResponse | undefined,
  options: CallbackOptions,
  config: NextConfig
) => {
  const opts = { ...options };
  const idTokenValidator =
    (afterCallback?: AfterCallback, organization?: string): BaseAfterCallback =>
    (session, state) => {
      if (organization) {
        if (organization.startsWith('org_')) {
          if (!session.user.org_id) {
            throw new Error('Organization Id (org_id) claim must be a string present in the ID token');
          }
          if (session.user.org_id !== organization) {
            throw new Error(
              `Organization Id (org_id) claim value mismatch in the ID token; ` +
                `expected "${organization}", found "${session.user.org_id}"`
            );
          }
        } else {
          if (!session.user.org_name) {
            throw new Error('Organization Name (org_name) claim must be a string present in the ID token');
          }
          if (session.user.org_name !== organization.toLowerCase()) {
            throw new Error(
              `Organization Name (org_name) claim value mismatch in the ID token; ` +
                `expected "${organization}", found "${session.user.org_name}"`
            );
          }
        }
      }
      if (afterCallback) {
        if (res) {
          return (afterCallback as AfterCallbackPageRoute)(req as NextApiRequest, res, session, state);
        } else {
          return (afterCallback as AfterCallbackAppRoute)(req as NextRequest, session, state);
        }
      }
      return session;
    };
  return {
    ...opts,
    afterCallback: idTokenValidator(opts.afterCallback, opts.organization || config.organization)
  };
};

/**
 * @ignore
 */
const appRouteHandlerFactory: (
  handler: BaseHandleConnect,
  getConfig: GetConfig
) => (req: NextRequest, ctx: AppRouteHandlerFnContext, options?: CallbackOptions) => Promise<Response> | Response =
  (handler, getConfig) =>
  async (req, _ctx, options = {}) => {
    try {
      const earthoReq = new EarthoNextRequest(req);
      const nextConfig = await getConfig(earthoReq);
      const earthoRes = new EarthoNextResponse(new NextResponse());
      await handler(earthoReq, earthoRes, applyOptions(req, undefined, options, nextConfig));
      return earthoRes.res;
    } catch (e) {
      throw new CallbackHandlerError(e as HandlerErrorCause);
    }
  };

/**
 * @ignore
 */
const pageRouteHandlerFactory: (
  handler: BaseHandleCallback,
  getConfig: GetConfig
) => (req: NextApiRequest, res: NextApiResponse, options?: CallbackOptions) => Promise<void> =
  (handler, getConfig) =>
  async (req: NextApiRequest, res: NextApiResponse, options = {}): Promise<void> => {
    try {
      const earthoReq = new EarthoNextApiRequest(req);
      const nextConfig = await getConfig(earthoReq);
      assertReqRes(req, res);
      return await handler(earthoReq, new EarthoNextApiResponse(res), applyOptions(req, res, options, nextConfig));
    } catch (e) {
      throw new CallbackHandlerError(e as HandlerErrorCause);
    }
  };
