import {
  LogoutOptions as SPALogoutOptions,
  PopupConnectOptions,
  PopupConfigOptions,
  RedirectConnectResult,
  User,
  RedirectConnectOptions as SPARedirectConnectOptions,
} from '@eartho/one-client-js';
import { createContext } from 'react';
import { AuthState, initialAuthState } from './auth-state';
import { AppState } from './eartho-provider';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LogoutOptions extends Omit<SPALogoutOptions, 'onRedirect'> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RedirectConnectOptions<TAppState = AppState>
  extends Omit<SPARedirectConnectOptions<TAppState>, 'onRedirect'> {}

/**
 * Contains the authenticated state and authentication methods provided by the `useEarthoOne` hook.
 */
export interface EarthoOneContextInterface<TUser extends User = User>
  extends AuthState<TUser> {
  
     /**
   * ```js
   * const claims = await getUser();
   * ```
   *
   * Returns all claims from the id_token if available.
   */
  getUser: (
  ) => Promise<User | undefined>;


  /**
   * ```js
   * const claims = await getIdToken();
   * ```
   *
   * Returns all claims from the id_token if available.
   */
  getIdToken: () => Promise<string | undefined>;

  /**
   * ```js
   * await connectWithRedirect(options);
   * ```
   *
   * Performs a redirect to `/authorize` using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   */
  connectWithRedirect: (options: RedirectConnectOptions<AppState>) => Promise<void>;

  /**
   * ```js
   * await connectWithPopup(options, config);
   * ```
   *
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * IMPORTANT: This method has to be called from an event handler
   * that was started by the user like a button click, for example,
   * otherwise the popup will be blocked in most browsers.
   */
  connectWithPopup: (
    options: PopupConnectOptions,
    config?: PopupConfigOptions
  ) => Promise<void>;

  /**
   * ```js
   * eartho.logout({ logoutParams: { returnTo: window.location.origin } });
   * ```
   *
   * Clears the application session and performs a redirect to `/v2/logout`, using
   * the parameters provided as arguments, to clear the Eartho session.
   * If the `logoutParams.federated` option is specified, it also clears the Identity Provider session.
   * [Read more about how Logout works at Eartho]
   */
  logout: (options?: LogoutOptions) => Promise<void>;

  /**
   * After the browser redirects back to the callback page,
   * call `handleRedirectCallback` to handle success and error
   * responses from Eartho. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * @param url The URL to that should be used to retrieve the `state` and `code` values. Defaults to `window.location.href` if not given.
   */
  handleRedirectCallback: (url?: string) => Promise<RedirectConnectResult>;
}

/**
 * @ignore
 */
const stub = (): never => {
  throw new Error('You forgot to wrap your component in <EarthoOneProvider>.');
};

/**
 * @ignore
 */
export const initialContext = {
  ...initialAuthState,
  buildAuthorizeUrl: stub,
  buildLogoutUrl: stub,
  getUser: stub,
  getIdToken: stub,
  connectWithRedirect: stub,
  connectWithPopup: stub,
  logout: stub,
  handleRedirectCallback: stub,
};

/**
 * The Eartho Context
 */
const EarthoOneContext = createContext<EarthoOneContextInterface>(initialContext);

export default EarthoOneContext;
