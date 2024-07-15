/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  User,
  IdToken,
  PopupConnectOptions,
  PopupConfigOptions,
  RedirectConnectResult,
  GetTokenSilentlyOptions,
  GetTokenSilentlyVerboseResponse,
  GetTokenWithPopupOptions
} from '@eartho/one-client-js';
import type { Ref } from 'vue';
import type { AppState } from './app-state';
import type {
  LogoutOptions,
  RedirectConnectOptions
} from './eartho-vue-client-options';

export interface EarthoVueClient {
  /**
   * The loading state of the SDK, `true` if the SDK is still processing the PKCE flow, `false` if the SDK has finished processing the PKCE flow.
   */
  isLoading: Ref<boolean>;

  /**
   * The authentication state, `true` if the user is authenticated, `false` if not.
   */
  isConnected: Ref<boolean>;

  /**
   * Contains the information of the user if available.
   */
  user: Ref<User | undefined>;

  /**
   * Contains all claims from the id_token if available.
   */
  idToken: Ref<string | undefined>;

  /**
   * Contains an error that occured in the SDK
   */
  error: Ref<any>;

  /**
   * ```js
   * try {
   *  await connectWithPopup(options);
   * } catch(e) {
   *  if (e instanceof PopupCancelledError) {
   *    // Popup was closed before login completed
   *  }
   * }
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
   *
   * @param options
   * @param config
   */
  connectWithPopup(
    options?: PopupConnectOptions,
    config?: PopupConfigOptions
  ): Promise<void>;

  /**
   * ```js
   * await connectWithRedirect(options);
   * ```
   *
   * Performs a redirect to `/authorize` using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   *
   * @param options
   */
  connectWithRedirect(options?: RedirectConnectOptions<AppState>): Promise<void>;

  /**
   * After the browser redirects back to the callback page,
   * call `handleRedirectCallback` to handle success and error
   * responses from Eartho. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * **Note:** The one-client-vue SDK handles this for you, unless you set `skipRedirectCallback` to true.
   * In that case, be sure to explicitly call `handleRedirectCallback` yourself.
   */
  handleRedirectCallback(url?: string): Promise<RedirectConnectResult<AppState>>;

  /**
   * ```js
   * await checkSession();
   * ```
   *
   * Check if the user is logged in using `getTokenSilently`. The difference
   * with `getTokenSilently` is that this doesn't return a token, but it will
   * pre-fill the token cache.
   *
   * This method also heeds the `eartho.{clientId}.is.authenticated` cookie, as an optimization
   *  to prevent calling Eartho unnecessarily. If the cookie is not present because
   * there was no previous login (or it has expired) then tokens will not be refreshed.
   *
   * @param options
   */
  checkSession(options?: GetTokenSilentlyOptions): Promise<void>;

  /**
   * Fetches a new access token and returns the response from the /oauth/token endpoint, omitting the refresh token.
   *
   * @param options
   */
  getAccessTokenSilently(
    options: GetTokenSilentlyOptions & { detailedResponse: true }
  ): Promise<GetTokenSilentlyVerboseResponse>;

  /**
   * Fetches a new access token and returns it.
   *
   * @param options
   */
  getAccessTokenSilently(options?: GetTokenSilentlyOptions): Promise<string>;

  /**
   * ```js
   * const token = await getTokenWithPopup(options);
   * ```
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * @param options
   * @param config
   */
  getAccessTokenWithPopup(
    options?: GetTokenWithPopupOptions,
    config?: PopupConfigOptions
  ): Promise<string | undefined>;

  /**
   * ```js
   * logout();
   * ```
   *
   * Clears the application session and performs a redirect to ``, using
   * the parameters provided as arguments, to clear the Eartho session.
   *
   * **Note:** If you are using a custom cache, and specifying `localOnly: true`, and you want to perform actions or read state from the SDK immediately after logout, you should `await` the result of calling `logout`.
   *
   * If the `federated` option is specified it also clears the Identity Provider session.
   * If the `localOnly` option is specified, it only clears the application session.
   * It is invalid to set both the `federated` and `localOnly` options to `true`,
   * and an error will be thrown if you do.
   *
   * @param options
   */
  logout(options?: LogoutOptions): Promise<void>;
}
