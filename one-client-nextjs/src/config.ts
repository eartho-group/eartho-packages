import type { Config as BaseConfig } from './eartho-session/config';
import { DeepPartial, get as getBaseConfig } from './eartho-session/get-config';
import type { EarthoRequest, EarthoRequestCookies } from './eartho-session/http';

/**
 * @category server
 */
export interface NextConfig extends BaseConfig {
  /**
   * Log users in to a specific organization.
   *
   * This will specify an `organization` parameter in your user's login request and will add a step to validate
   * the `org_id` or `org_name` claim in your user's ID token.
   *
   * If your app supports multiple organizations, you should take a look at {@link AuthorizationParams.organization}.
   */
  organization?: string;
  routes: BaseConfig['routes'] & {
    login: string;
  };
}

/**
 * ## Configuration properties.
 *
 * The Server part of the SDK can be configured in 2 ways.
 *
 * ### 1. Environment Variables
 *
 * The simplest way to use the SDK is to use the named exports ({@link HandleAccess}, {@link HandleConnect},
 * {@link HandleLogout}, {@link HandleCallback}, {@link HandleProfile}, {@link GetSession}, {@link GetAccessToken},
 * {@link WithServerAccessRequired}, and {@link WithClientAccessRequired}).
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import { handleAccess } from '@eartho/one-client-nextjs';
 *
 * return handleAccess();
 * ```
 *
 * When you use these named exports, an instance of the SDK is created for you which you can configure using
 * environment variables:
 *
 * ### Required
 *
 * - `EARTHO_SECRET`: See {@link BaseConfig.secret}.
 * - `EARTHO_ISSUER_BASE_URL`: See {@link BaseConfig.issuerBaseURL}.
 * - `EARTHO_BASE_URL`: See {@link BaseConfig.baseURL}.
 * - `EARTHO_CLIENT_ID`: See {@link BaseConfig.clientID}.
 * - `EARTHO_CLIENT_SECRET`: See {@link BaseConfig.clientSecret}.
 *
 * ### Optional
 *
 * - `EARTHO_CLOCK_TOLERANCE`: See {@link BaseConfig.clockTolerance}.
 * - `EARTHO_HTTP_TIMEOUT`: See {@link BaseConfig.httpTimeout}.
 * - `EARTHO_ENABLE_TELEMETRY`: See {@link BaseConfig.enableTelemetry}.
 * - `EARTHO_IDP_LOGOUT`: See {@link BaseConfig.idpLogout}.
 * - `EARTHO_ID_TOKEN_SIGNING_ALG`: See {@link BaseConfig.idTokenSigningAlg}.
 * - `EARTHO_LEGACY_SAME_SITE_COOKIE`: See {@link BaseConfig.legacySameSiteCookie}.
 * - `EARTHO_IDENTITY_CLAIM_FILTER`: See {@link BaseConfig.identityClaimFilter}.
 * - `EARTHO_PUSHED_AUTHORIZATION_REQUESTS` See {@link BaseConfig.pushedAuthorizationRequests}.
 * - `NEXT_PUBLIC_EARTHO_LOGIN`: See {@link NextConfig.routes}.
 * - `EARTHO_CALLBACK`: See {@link BaseConfig.routes}.
 * - `EARTHO_POST_LOGOUT_REDIRECT`: See {@link BaseConfig.routes}.
 * - `EARTHO_AUDIENCE`: See {@link BaseConfig.authorizationParams}.
 * - `EARTHO_SCOPE`: See {@link BaseConfig.authorizationParams}.
 * - `EARTHO_ORGANIZATION`: See {@link NextConfig.organization}.
 * - `EARTHO_SESSION_NAME`: See {@link SessionConfig.name}.
 * - `EARTHO_SESSION_ROLLING`: See {@link SessionConfig.rolling}.
 * - `EARTHO_SESSION_ROLLING_DURATION`: See {@link SessionConfig.rollingDuration}.
 * - `EARTHO_SESSION_ABSOLUTE_DURATION`: See {@link SessionConfig.absoluteDuration}.
 * - `EARTHO_SESSION_AUTO_SAVE`: See {@link SessionConfig.autoSave}.
 * - `EARTHO_COOKIE_DOMAIN`: See {@link CookieConfig.domain}.
 * - `EARTHO_COOKIE_PATH`: See {@link CookieConfig.path}.
 * - `EARTHO_COOKIE_TRANSIENT`: See {@link CookieConfig.transient}.
 * - `EARTHO_COOKIE_HTTP_ONLY`: See {@link CookieConfig.httpOnly}.
 * - `EARTHO_COOKIE_SECURE`: See {@link CookieConfig.secure}.
 * - `EARTHO_COOKIE_SAME_SITE`: See {@link CookieConfig.sameSite}.
 * - `EARTHO_CLIENT_ASSERTION_SIGNING_KEY`: See {@link BaseConfig.clientAssertionSigningKey}
 * - `EARTHO_CLIENT_ASSERTION_SIGNING_ALG`: See {@link BaseConfig.clientAssertionSigningAlg}
 * - `EARTHO_TRANSACTION_COOKIE_NAME` See {@link BaseConfig.transactionCookie}
 * - `EARTHO_TRANSACTION_COOKIE_DOMAIN` See {@link BaseConfig.transactionCookie}
 * - `EARTHO_TRANSACTION_COOKIE_PATH` See {@link BaseConfig.transactionCookie}
 * - `EARTHO_TRANSACTION_COOKIE_SAME_SITE` See {@link BaseConfig.transactionCookie}
 * - `EARTHO_TRANSACTION_COOKIE_SECURE` See {@link BaseConfig.transactionCookie}
 *
 * ### 2. Create your own instance using {@link InitEartho}
 *
 * If you don't want to configure the SDK with environment variables or you want more fine grained control over the
 * instance, you can create an instance yourself and use the handlers and helpers from that.
 *
 * First, export your configured instance from another module:
 *
 * ```js
 * // utils/eartho.js
 * import { initEartho } from '@eartho/one-client-nextjs';
 *
 * export default initEartho({ ...ConfigParameters... });
 * ```
 *
 * Then import it into your route handler:
 *
 * ```js
 * // pages/api/access/[eartho].js
 * import eartho from '../../../../utils/eartho';
 *
 * export default eartho.handleAccess();
 * ```
 *
 * **IMPORTANT** If you use {@link InitEartho}, you should *not* use the other named exports as they will use a different
 * instance of the SDK. Also note - this is for the server side part of the SDK - you will always use named exports for
 * the front end components: {@link EarthoClientProvider}, {@link UseUser} and the
 * front end version of {@link WithClientAccessRequired}
 *
 * @category Server
 */
export type ConfigParameters = DeepPartial<NextConfig>;

/**
 * @ignore
 */
const FALSEY = ['n', 'no', 'false', '0', 'off'];

/**
 * @ignore
 */
const bool = (param?: any, defaultValue?: boolean): boolean | undefined => {
  if (param === undefined || param === '') return defaultValue;
  if (param && typeof param === 'string') return !FALSEY.includes(param.toLowerCase().trim());
  return !!param;
};

/**
 * @ignore
 */
const num = (param?: string): number | undefined => (param === undefined || param === '' ? undefined : +param);

/**
 * @ignore
 */
const array = (param?: string): string[] | undefined =>
  param === undefined || param === '' ? undefined : param.replace(/\s/g, '').split(',');

/**
 * @ignore
 */
export const getConfig = (params: ConfigParameters = {}): NextConfig => {
  // Don't use destructuring here so that the `DefinePlugin` can replace any env vars specified in `next.config.js`
  const EARTHO_SECRET = process.env.EARTHO_SECRET;
  const EARTHO_ISSUER_BASE_URL = 'https://one.eartho.io';
  const EARTHO_BASE_URL = process.env.EARTHO_BASE_URL;
  const EARTHO_CLIENT_ID = process.env.EARTHO_CLIENT_ID;
  const EARTHO_CLIENT_SECRET = process.env.EARTHO_CLIENT_SECRET;
  const EARTHO_CLOCK_TOLERANCE = process.env.EARTHO_CLOCK_TOLERANCE;
  const EARTHO_HTTP_TIMEOUT = process.env.EARTHO_HTTP_TIMEOUT;
  const EARTHO_ENABLE_TELEMETRY = process.env.EARTHO_ENABLE_TELEMETRY;
  const EARTHO_IDP_LOGOUT = process.env.EARTHO_IDP_LOGOUT;
  const EARTHO_LOGOUT = process.env.EARTHO_LOGOUT;
  const EARTHO_ID_TOKEN_SIGNING_ALG = process.env.EARTHO_ID_TOKEN_SIGNING_ALG;
  const EARTHO_LEGACY_SAME_SITE_COOKIE = process.env.EARTHO_LEGACY_SAME_SITE_COOKIE;
  const EARTHO_IDENTITY_CLAIM_FILTER = process.env.EARTHO_IDENTITY_CLAIM_FILTER;
  const EARTHO_PUSHED_AUTHORIZATION_REQUESTS = process.env.EARTHO_PUSHED_AUTHORIZATION_REQUESTS;
  const EARTHO_CALLBACK = process.env.EARTHO_CALLBACK;
  const EARTHO_POST_LOGOUT_REDIRECT = process.env.EARTHO_POST_LOGOUT_REDIRECT;
  const EARTHO_AUDIENCE = process.env.EARTHO_AUDIENCE;
  const EARTHO_SCOPE = process.env.EARTHO_SCOPE;
  const EARTHO_ORGANIZATION = process.env.EARTHO_ORGANIZATION;
  const EARTHO_SESSION_NAME = process.env.EARTHO_SESSION_NAME;
  const EARTHO_SESSION_ROLLING = process.env.EARTHO_SESSION_ROLLING;
  const EARTHO_SESSION_ROLLING_DURATION = process.env.EARTHO_SESSION_ROLLING_DURATION;
  const EARTHO_SESSION_ABSOLUTE_DURATION = process.env.EARTHO_SESSION_ABSOLUTE_DURATION;
  const EARTHO_SESSION_AUTO_SAVE = process.env.EARTHO_SESSION_AUTO_SAVE;
  const EARTHO_SESSION_STORE_ID_TOKEN = process.env.EARTHO_SESSION_STORE_ID_TOKEN;
  const EARTHO_COOKIE_DOMAIN = process.env.EARTHO_COOKIE_DOMAIN;
  const EARTHO_COOKIE_PATH = process.env.EARTHO_COOKIE_PATH;
  const EARTHO_COOKIE_TRANSIENT = process.env.EARTHO_COOKIE_TRANSIENT;
  const EARTHO_COOKIE_HTTP_ONLY = process.env.EARTHO_COOKIE_HTTP_ONLY;
  const EARTHO_COOKIE_SECURE = process.env.EARTHO_COOKIE_SECURE;
  const EARTHO_COOKIE_SAME_SITE = process.env.EARTHO_COOKIE_SAME_SITE;
  const EARTHO_CLIENT_ASSERTION_SIGNING_KEY = process.env.EARTHO_CLIENT_ASSERTION_SIGNING_KEY;
  const EARTHO_CLIENT_ASSERTION_SIGNING_ALG = process.env.EARTHO_CLIENT_ASSERTION_SIGNING_ALG;
  const EARTHO_TRANSACTION_COOKIE_NAME = process.env.EARTHO_TRANSACTION_COOKIE_NAME;
  const EARTHO_TRANSACTION_COOKIE_DOMAIN = process.env.EARTHO_TRANSACTION_COOKIE_DOMAIN;
  const EARTHO_TRANSACTION_COOKIE_PATH = process.env.EARTHO_TRANSACTION_COOKIE_PATH;
  const EARTHO_TRANSACTION_COOKIE_SAME_SITE = process.env.EARTHO_TRANSACTION_COOKIE_SAME_SITE;
  const EARTHO_TRANSACTION_COOKIE_SECURE = process.env.EARTHO_TRANSACTION_COOKIE_SECURE;

  const baseURL =
    EARTHO_BASE_URL && !/^https?:\/\//.test(EARTHO_BASE_URL as string) ? `https://${EARTHO_BASE_URL}` : EARTHO_BASE_URL;

  const { organization, ...baseParams } = params;

  const baseConfig = getBaseConfig({
    secret: EARTHO_SECRET,
    issuerBaseURL: EARTHO_ISSUER_BASE_URL,
    baseURL: baseURL,
    clientID: EARTHO_CLIENT_ID,
    clientSecret: EARTHO_CLIENT_SECRET,
    clockTolerance: num(EARTHO_CLOCK_TOLERANCE),
    httpTimeout: num(EARTHO_HTTP_TIMEOUT),
    enableTelemetry: bool(EARTHO_ENABLE_TELEMETRY),
    idpLogout: bool(EARTHO_IDP_LOGOUT, true),
    earthoLogout: bool(EARTHO_LOGOUT, true),
    idTokenSigningAlg: EARTHO_ID_TOKEN_SIGNING_ALG,
    legacySameSiteCookie: bool(EARTHO_LEGACY_SAME_SITE_COOKIE),
    identityClaimFilter: array(EARTHO_IDENTITY_CLAIM_FILTER),
    pushedAuthorizationRequests: bool(EARTHO_PUSHED_AUTHORIZATION_REQUESTS, false),
    ...baseParams,
    authorizationParams: {
      response_type: 'code',
      audience: EARTHO_AUDIENCE,
      scope: EARTHO_SCOPE,
      ...baseParams.authorizationParams
    },
    session: {
      name: EARTHO_SESSION_NAME,
      rolling: bool(EARTHO_SESSION_ROLLING),
      rollingDuration:
        EARTHO_SESSION_ROLLING_DURATION && isNaN(Number(EARTHO_SESSION_ROLLING_DURATION))
          ? (bool(EARTHO_SESSION_ROLLING_DURATION) as false)
          : num(EARTHO_SESSION_ROLLING_DURATION),
      absoluteDuration:
        EARTHO_SESSION_ABSOLUTE_DURATION && isNaN(Number(EARTHO_SESSION_ABSOLUTE_DURATION))
          ? bool(EARTHO_SESSION_ABSOLUTE_DURATION)
          : num(EARTHO_SESSION_ABSOLUTE_DURATION),
      autoSave: bool(EARTHO_SESSION_AUTO_SAVE, true),
      storeIDToken: bool(EARTHO_SESSION_STORE_ID_TOKEN),
      ...baseParams.session,
      cookie: {
        domain: EARTHO_COOKIE_DOMAIN,
        path: EARTHO_COOKIE_PATH || '/',
        transient: bool(EARTHO_COOKIE_TRANSIENT),
        httpOnly: bool(EARTHO_COOKIE_HTTP_ONLY),
        secure: bool(EARTHO_COOKIE_SECURE),
        sameSite: EARTHO_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none' | undefined,
        ...baseParams.session?.cookie
      }
    },
    routes: {
      callback: baseParams.routes?.callback || EARTHO_CALLBACK || '/api/access/callback',
      postLogoutRedirect: baseParams.routes?.postLogoutRedirect || EARTHO_POST_LOGOUT_REDIRECT
    },
    clientAssertionSigningKey: EARTHO_CLIENT_ASSERTION_SIGNING_KEY,
    clientAssertionSigningAlg: EARTHO_CLIENT_ASSERTION_SIGNING_ALG,
    transactionCookie: {
      name: EARTHO_TRANSACTION_COOKIE_NAME,
      domain: EARTHO_TRANSACTION_COOKIE_DOMAIN,
      path: EARTHO_TRANSACTION_COOKIE_PATH || '/',
      secure: bool(EARTHO_TRANSACTION_COOKIE_SECURE),
      sameSite: EARTHO_TRANSACTION_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none' | undefined,
      ...baseParams.transactionCookie
    }
  });

  return {
    ...baseConfig,
    organization: organization || EARTHO_ORGANIZATION,
    routes: {
      ...baseConfig.routes,
      login: baseParams.routes?.login || process.env.NEXT_PUBLIC_EARTHO_LOGIN || '/api/auth/login'
    }
  };
};

export type GetConfig = (req: EarthoRequest | EarthoRequestCookies) => Promise<NextConfig> | NextConfig;

export const configSingletonGetter = (params: ConfigParameters = {}, genId: () => string): GetConfig => {
  let config: NextConfig;
  return (req) => {
    if (!config) {
      // Bails out of static rendering for Server Components
      // Need to query cookies because Server Components don't have access to URL
      req.getCookies();
      if ('getUrl' in req) {
        // Bail out of static rendering for API Routes
        // Reading cookies is not always enough https://github.com/vercel/next.js/issues/49006
        req.getUrl();
      }
      config = getConfig({ ...params, session: { genId, ...params.session } });
    }
    return config;
  };
};
