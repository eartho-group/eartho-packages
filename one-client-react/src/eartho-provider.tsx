import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  EarthoOne,
  EarthoOneOptions,
  PopupConnectOptions,
  PopupConfigOptions,
  RedirectConnectResult,
  User,
} from '@eartho/one-client-js';
import EarthoOneContext, {
  EarthoOneContextInterface,
  LogoutOptions,
  RedirectConnectOptions,
} from './eartho-context';
import {
  hasAuthParams,
  loginError,
  tokenError,
  deprecateRedirectUri,
} from './utils';
import { reducer } from './reducer';
import { initialAuthState } from './auth-state';

/**
 * The state of the application before the user was redirected to the login page.
 */
export type AppState = {
  returnTo?: string;
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/**
 * The main configuration to instantiate the `EarthoOneProvider`.
 */
export interface EarthoOneProviderOptions extends EarthoOneOptions {
  /**
   * The child nodes your Provider has wrapped
   */
  children?: React.ReactNode;
  /**
   * By default this removes the code and state parameters from the url when you are redirected from the authorize page.
   * It uses `window.history` but you might want to overwrite this if you are using a custom router, like `react-router-dom`
   * See the EXAMPLES.md for more info.
   */
  onRedirectCallback?: (appState?: AppState, user?: User) => void;
  /**
   * By default, if the page url has code/state params, the SDK will treat them as Eartho's and attempt to exchange the
   * code for a token. In some cases the code might be for something else (another OAuth SDK perhaps). In these
   * instances you can instruct the client to ignore them eg
   *
   * ```jsx
   * <EarthoOneProvider
   *   clientId={clientId}
   *   domain={domain}
   *   skipRedirectCallback={window.location.pathname === '/stripe-oauth-callback'}
   * >
   * ```
   */
  skipRedirectCallback?: boolean;
  /**
   * Context to be used when creating the EarthoOneProvider, defaults to the internally created context.
   *
   * This allows multiple EarthoOneProviders to be nested within the same application, the context value can then be
   * passed to useEarthoOne, withEarthoOne, or withAuthenticationRequired to use that specific EarthoOneProvider to access
   * auth state and methods specifically tied to the provider that the context belongs to.
   *
   * When using multiple EarthoOneProviders in a single application you should do the following to ensure sessions are not
   * overwritten:
   *
   * * Configure a different redirect_uri for each EarthoOneProvider, and set skipRedirectCallback for each provider to ignore
   * the others redirect_uri
   * * If using localstorage for both EarthoOneProviders, ensure that the audience and scope are different for so that the key
   * used to store data is different
   *
   */
  context?: React.Context<EarthoOneContextInterface>;
}

/**
 * Replaced by the package version at build time.
 * @ignore
 */
declare const __VERSION__: string;

/**
 * @ignore
 */
const toEarthoOneOptions = (
  opts: EarthoOneProviderOptions
): EarthoOneOptions => {
  deprecateRedirectUri(opts);

  return {
    ...opts,
    earthoOneClient: {
      name: 'one-client-react',
      version: __VERSION__,
    },
  };
};

/**
 * @ignore
 */
const defaultOnRedirectCallback = (appState?: AppState): void => {
  window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname
  );
};

/**
 * ```jsx
 * <EarthoOneProvider
 *   domain={domain}
 *   clientId={clientId}
 *   authorizationParams={{ redirect_uri: window.location.origin }}>
 *   <MyApp />
 * </EarthoOneProvider>
 * ```
 *
 * Provides the EarthoOneContext to its child components.
 */
const EarthoOneProvider = (opts: EarthoOneProviderOptions): JSX.Element => {
  const {
    children,
    skipRedirectCallback,
    onRedirectCallback = defaultOnRedirectCallback,
    context = EarthoOneContext,
    ...clientOpts
  } = opts;
  const [client] = useState(
    () => new EarthoOne(toEarthoOneOptions(clientOpts))
  );
  const [state, dispatch] = useReducer(reducer, initialAuthState);
  const didInitialise = useRef(false);

  useEffect(() => {
    if (didInitialise.current) {
      return;
    }
    didInitialise.current = true;
    (async (): Promise<void> => {
      try {
        let user: User | undefined;
        if (hasAuthParams() && !skipRedirectCallback) {
          const { appState } = await client.handleRedirectCallback();
          user = await client.getUser();
          onRedirectCallback(appState, user);
        } else {
          await client.checkSession();
          user = await client.getUser();
        }
        dispatch({ type: 'INITIALISED', user });
      } catch (error) {
        dispatch({ type: 'ERROR', error: loginError(error) });
      }
    })();
  }, [client, onRedirectCallback, skipRedirectCallback]);

  const connectWithRedirect = useCallback(
    (opts: RedirectConnectOptions): Promise<void> => {
      deprecateRedirectUri(opts);

      return client.connectWithRedirect(opts);
    },
    [client]
  );

  const connectWithPopup = useCallback(
    async (
      options: PopupConnectOptions,
      config?: PopupConfigOptions
    ): Promise<void> => {
      dispatch({ type: 'LOGIN_POPUP_STARTED' });
      try {
        await client.connectWithPopup(options, config);
      } catch (error) {
        dispatch({ type: 'ERROR', error: loginError(error) });
        return;
      }
      const user = await client.getUser();
      dispatch({ type: 'LOGIN_POPUP_COMPLETE', user });
    },
    [client]
  );

  const logout = useCallback(
    async (opts: LogoutOptions = {}): Promise<void> => {
      await client.logout(opts);
      dispatch({ type: 'LOGOUT' });
  
    },
    [client]
  );

  const getUser = useCallback(
    () => client.getUser(),
    [client]
  );
  
  const getIdToken = useCallback(
    () => client.getIdToken(),
    [client]
  );

  const handleRedirectCallback = useCallback(
    async (url?: string): Promise<RedirectConnectResult> => {
      try {
        return await client.handleRedirectCallback(url);
      } catch (error) {
        throw tokenError(error);
      } finally {
        dispatch({
          type: 'HANDLE_REDIRECT_COMPLETE',
          user: await client.getUser(),
        });
      }
    },
    [client]
  );
  
  const contextValue = useMemo<EarthoOneContextInterface<User>>(() => {
    return {
      ...state,
      getUser,
      getIdToken,
      connectWithRedirect,
      connectWithPopup,
      logout,
      handleRedirectCallback,
    };
  }, [
    state,
    getUser,
    getIdToken,
    connectWithRedirect,
    connectWithPopup,
    logout,
    handleRedirectCallback,
  ]);

  return <context.Provider value={contextValue}>{children}</context.Provider>;
};

export default EarthoOneProvider;
