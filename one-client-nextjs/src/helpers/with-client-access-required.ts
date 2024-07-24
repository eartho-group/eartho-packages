import type React from 'react';
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { Claims, get, SessionCache } from '../session';
import { assertCtx } from '../utils/assert';
import { ParsedUrlQuery } from 'querystring';
import { GetConfig } from '../config';
import { EarthoNextRequestCookies } from '../http';
import { NodeRequest } from '../eartho-session/http';

/**
 * If you wrap your `getServerSideProps` with {@link WithClientAccessRequired} your props object will be augmented with
 * the user property, which will be the user's {@link Claims}.
 *
 * ```js
 * // pages/profile.js
 * import { withClientAccessRequired } from '@eartho/one-client-nextjs';
 *
 * export default function Profile({ user }) {
 *   return <div>Hello {user.name}</div>;
 * }
 *
 * export const getServerSideProps = withClientAccessRequired();
 * ```
 *
 * @category Server
 */
export type GetServerSidePropsResultWithSession<P = any> = GetServerSidePropsResult<P & { user: Claims }>;

/**
 * A page route that has been augmented with {@link WithClientAccessRequired}.
 *
 * @category Server
 */
export type PageRoute<P, Q extends ParsedUrlQuery = ParsedUrlQuery> = (
  ctx: GetServerSidePropsContext<Q>
) => Promise<GetServerSidePropsResultWithSession<P>>;

/**
 * Objects containing the route parameters and search parameters of th page.
 *
 * @category Server
 */
export type AppRouterPageRouteOpts = {
  params?: Record<string, string | string[]>;
  searchParams?: { [key: string]: string | string[] | undefined };
};

/**
 * An app route that has been augmented with {@link WithClientAccessRequired}.
 *
 * @category Server
 */
export type AppRouterPageRoute = (obj: AppRouterPageRouteOpts) => Promise<React.JSX.Element>;

/**
 * If you have a custom returnTo url you should specify it in `returnTo`.
 *
 * You can pass in your own `getServerSideProps` method, the props returned from this will be
 * merged with the user props. You can also access the user session data by calling `getSession`
 * inside of this method. For example:
 *
 * ```js
 * // pages/protected-page.js
 * import { getSession, withClientAccessRequired } from '@eartho/one-client-nextjs';
 *
 * export default function ProtectedPage({ user, customProp }) {
 *   return <div>Protected content</div>;
 * }
 *
 * export const getServerSideProps = withClientAccessRequired({
 *   // returnTo: '/unauthorized',
 *   async getServerSideProps(ctx) {
 *     // access the user session if needed
 *     // const session = await getSession(ctx.req, ctx.res);
 *     return {
 *       props: {
 *         // customProp: 'bar',
 *       }
 *     };
 *   }
 * });
 * ```
 *
 * @category Server
 */
export type WithClientAccessRequiredPageRouterOptions<
  P extends { [key: string]: any } = { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery
> = {
  getServerSideProps?: GetServerSideProps<P, Q>;
  returnTo?: string;
};

/**
 * Wrap your `getServerSideProps` with this method to make sure the user is authenticated before
 * visiting the page.
 *
 * ```js
 * // pages/protected-page.js
 * import { withClientAccessRequired } from '@eartho/one-client-nextjs';
 *
 * export default function ProtectedPage() {
 *   return <div>Protected content</div>;
 * }
 *
 * export const getServerSideProps = withClientAccessRequired();
 * ```
 *
 * If the user visits `/protected-page` without a valid session, it will redirect the user to the
 * login page. Then they will be returned to `/protected-page` after login.
 *
 * @category Server
 */
export type WithClientAccessRequiredPageRouter = <
  P extends { [key: string]: any } = { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery
>(
  opts?: WithClientAccessRequiredPageRouterOptions<P, Q>
) => PageRoute<P, Q>;

/**
 * Specify the URL to `returnTo` - this is important in app router pages because the server component
 * won't know the URL of the page.
 *
 * @category Server
 */
export type WithClientAccessRequiredAppRouterOptions = {
  returnTo?: string | ((obj: AppRouterPageRouteOpts) => Promise<string> | string);
};

/**
 * Wrap your Server Component with this method to make sure the user is authenticated before
 * visiting the page.
 *
 * ```js
 * // app/protected-page/page.js
 * import { withClientAccessRequired } from '@eartho/one-client-nextjs';
 *
 * export default function withClientAccessRequired(ProtectedPage() {
 *   return <div>Protected content</div>;
 * }, { returnTo: '/protected-page' });
 * ```
 *
 * If the user visits `/protected-page` without a valid session, it will redirect the user to the
 * login page.
 *
 * Note: Server Components are not aware of the req or the url of the page. So if you want the user to return to the
 * page after login, you must specify the `returnTo` option.
 *
 * You can specify a function to `returnTo` that accepts the `params` (An object containing the dynamic
 * route parameters) and `searchParams` (An object containing the search parameters of the current URL)
 * argument from the page, to preserve dynamic routes and search params.
 *
 * ```js
 * // app/protected-page/[slug]/page.js
 * import { withClientAccessRequired } from '@eartho/one-client-nextjs';
 *
 * export default function withClientAccessRequired(ProtectedPage() {
 *   return <div>Protected content</div>;
 * }, {
 *   returnTo({ params }) {
 *     return `/protected-page/${params.slug}`
 *   }
 * });
 * ```
 *
 * @category Server
 */
export type WithClientAccessRequiredAppRouter = (
  fn: AppRouterPageRoute,
  opts?: WithClientAccessRequiredAppRouterOptions
) => AppRouterPageRoute;

/**
 * Protects Page router pages {@link WithClientAccessRequiredPageRouter} or
 * App router pages {@link WithClientAccessRequiredAppRouter}
 *
 * @category Server
 */
export type WithClientAccessRequired = WithClientAccessRequiredPageRouter & WithClientAccessRequiredAppRouter;

/**
 * @ignore
 */
export default function withClientAccessRequiredFactory(
  getConfig: GetConfig,
  sessionCache: SessionCache
): WithClientAccessRequired {
  const appRouteHandler = appRouteHandlerFactory(getConfig, sessionCache);
  const pageRouteHandler = pageRouteHandlerFactory(getConfig, sessionCache);

  return ((
    fnOrOpts?: WithClientAccessRequiredPageRouterOptions | AppRouterPageRoute,
    opts?: WithClientAccessRequiredAppRouterOptions
  ) => {
    if (typeof fnOrOpts === 'function') {
      return appRouteHandler(fnOrOpts, opts);
    }
    return pageRouteHandler(fnOrOpts);
  }) as WithClientAccessRequired;
}

/**
 * @ignore
 */
const appRouteHandlerFactory =
  (getConfig: GetConfig, sessionCache: SessionCache): WithClientAccessRequiredAppRouter =>
  (handler, opts = {}) =>
  async (params) => {
    const {
      routes: { login: loginUrl }
    } = await getConfig(new EarthoNextRequestCookies());
    const [session] = await get({ sessionCache });
    if (!session?.user) {
      const returnTo = typeof opts.returnTo === 'function' ? await opts.returnTo(params) : opts.returnTo;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { redirect } = require('next/navigation');
      redirect(`${loginUrl}${opts.returnTo ? `?returnTo=${returnTo}` : ''}`);
    }
    return handler(params);
  };

/**
 * @ignore
 */
const pageRouteHandlerFactory =
  (getConfig: GetConfig, sessionCache: SessionCache): WithClientAccessRequiredPageRouter =>
  ({ getServerSideProps, returnTo } = {}) =>
  async (ctx) => {
    assertCtx(ctx);
    const {
      routes: { login: loginUrl }
    } = await getConfig(new NodeRequest(ctx.req));
    const session = await sessionCache.get(ctx.req, ctx.res);
    if (!session?.user) {
      return {
        redirect: {
          destination: `${loginUrl}?returnTo=${encodeURIComponent(returnTo || ctx.resolvedUrl)}`,
          permanent: false
        }
      };
    }
    let ret: any = { props: {} };
    if (getServerSideProps) {
      ret = await getServerSideProps(ctx);
    }
    if (ret.props instanceof Promise) {
      return { ...ret, props: ret.props.then((props: any) => ({ user: session.user, ...props })) };
    }
    return { ...ret, props: { user: session.user, ...ret.props } };
  };
