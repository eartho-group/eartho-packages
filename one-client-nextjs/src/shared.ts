import { SessionStore as GenericSessionStore, SessionPayload } from './eartho-session';
import {
  HandleAccess,
  HandleConnect,
  HandleProfile,
  HandleLogout,
  HandleCallback,
  HandleBackchannelLogout
} from './handlers';
import { SessionCache, GetSession, GetAccessToken, Session, TouchSession, UpdateSession } from './session';
import { WithServerAccessRequired, WithClientAccessRequired } from './helpers';
import { ConfigParameters } from './config';
import { WithMiddlewareAccessRequired } from './helpers/with-middleware-access-required';
import version from './version';
import { HasAccessFunction } from './helpers/access-required';

export const telemetry = { name: 'nextjs-eartho', version };

/**
 * The SDK server instance.
 *
 * This is created for you when you use the named exports, or you can create your own using {@link InitEartho}.
 *
 * See {@link ConfigParameters} for more info.
 *
 * @category Server
 */
export interface EarthoServer {
  /**
   * Session getter.
   */
  getSession: GetSession;

  /**
   * Update the expiry of a rolling session when autoSave is disabled.
   */
  touchSession: TouchSession;

  /**
   * Append properties to the user.
   */
  updateSession: UpdateSession;

  /**
   * Access token getter.
   */
  getAccessToken: GetAccessToken;

  /**
   * Login handler which will redirect the user to Eartho.
   */
  handleConnect: HandleConnect;

  /**
   * Callback handler which will complete the transaction and create a local session.
   */
  handleCallback: HandleCallback;

  /**
   * Logout handler which will clear the local session and the Eartho session.
   */
  handleLogout: HandleLogout;

  /**
   * Logout handler which will clear the local session and the Eartho session.
   */
  handleBackchannelLogout: HandleBackchannelLogout;

  /**
   * Profile handler which return profile information about the user.
   */
  handleProfile: HandleProfile;

  /**
   * Helper that adds auth to an API route.
   */
  withServerAccessRequired: WithServerAccessRequired;

  /**
   * Helper that adds auth to a Page route.
   */
  withClientAccessRequired: WithClientAccessRequired;

  /**
   * Create the main handlers for your api routes.
   */
  handleAccess: HandleAccess;

  /**
   * Add auth to your middleware functions.
   */
  withMiddlewareAccessRequired: WithMiddlewareAccessRequired;

  hasAccess: HasAccessFunction;
}

export {
  AuthError,
  AccessTokenErrorCode,
  AccessTokenError,
  HandlerError,
  CallbackHandlerError,
  LoginHandlerError,
  LogoutHandlerError,
  ProfileHandlerError
} from './utils/errors';

export {
  Handlers,
  LoginOptions,
  LogoutOptions,
  GetLoginState,
  GetLoginStatePageRoute,
  GetLoginStateAppRoute,
  ProfileOptions,
  CallbackOptions,
  AfterCallback,
  AfterCallbackPageRoute,
  AfterCallbackAppRoute,
  AfterRefetch,
  AfterRefetchPageRoute,
  AfterRefetchAppRoute,
  AppRouterOnError,
  PageRouterOnError,
  AppRouteHandlerFnContext,
  NextAppRouterHandler,
  NextPageRouterHandler,
  AppRouterHandler,
  PageRouterHandler
} from './handlers';

export {
  AppRouterPageRouteOpts,
  AppRouterPageRoute,
  WithClientAccessRequiredPageRouter,
  WithClientAccessRequiredAppRouter,
  GetServerSidePropsResultWithSession,
  WithClientAccessRequiredPageRouterOptions,
  WithClientAccessRequiredAppRouterOptions,
  PageRoute,
  AppRouteHandlerFn,
  WithServerAccessRequiredAppRoute,
  WithServerAccessRequiredPageRoute
} from './helpers';

export {
  AccessTokenRequest,
  GetAccessTokenResult,
  Claims,
  AfterRefresh,
  AfterRefreshPageRoute,
  AfterRefreshAppRoute
} from './session';

export {
  MissingStateCookieError,
  MalformedStateCookieError,
  MissingStateParamError,
  IdentityProviderError,
  ApplicationError
} from './eartho-session';

export {
  ConfigParameters,
  HandleAccess,
  HandleConnect,
  HandleProfile,
  HandleLogout,
  HandleCallback,
  HandleBackchannelLogout,
  WithServerAccessRequired,
  WithClientAccessRequired,
  SessionCache,
  GetSession,
  TouchSession,
  UpdateSession,
  GetAccessToken,
  Session
};

export type SessionStore = GenericSessionStore<Session>;
export type SessionStorePayload = SessionPayload<Session>;

