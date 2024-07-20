import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState, ReactNode } from 'react';
import {
  EarthoOne,
  EarthoOneOptions,
  PopupConfigOptions,
  PopupConnectOptions,
  RedirectConnectResult,
  User
} from '@eartho/one-client-js';
import EarthoOneContext, { EarthoOneContextInterface, LogoutOptions, RedirectConnectOptions } from './eartho-context';
import { hasAuthParams, loginError, tokenError, deprecateRedirectUri } from './utils';
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
 * Structure for each protected path
 */
export interface ProtectedPath {
  path: string;
  accessIds: string[];
  redirectPath: string;
}

/**
 * The main configuration to instantiate the `EarthoOneProvider`.
 */
export interface EarthoOneProviderOptions extends EarthoOneOptions {
  children?: React.ReactNode;
  onRedirectCallback?: (appState?: AppState, user?: User) => void;
  skipRedirectCallback?: boolean;
  context?: React.Context<EarthoOneContextInterface>;
  protectedPaths?: ProtectedPath[];
  defaultLoginPath?: string;
  loadingComponent?: ReactNode | null;
}

/**
 * Replaced by the package version at build time.
 * @ignore
 */
declare const __VERSION__: string;

/**
 * @ignore
 */
const toEarthoOneOptions = (opts: EarthoOneProviderOptions): EarthoOneOptions => {
  deprecateRedirectUri(opts);

  return {
    ...opts,
    earthoOneClient: {
      name: 'one-client-react',
      version: __VERSION__
    }
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
 * Provides the EarthoOneContext to its child components.
 */
const EarthoOneProvider = (opts: EarthoOneProviderOptions): JSX.Element => {
  const {
    children,
    skipRedirectCallback,
    onRedirectCallback = defaultOnRedirectCallback,
    context = EarthoOneContext,
    protectedPaths = [],
    defaultLoginPath = '/login',
    loadingComponent = null, // Default loading component is null
    ...clientOpts
  } = opts;
  const [client] = useState(() => new EarthoOne(toEarthoOneOptions(clientOpts)));
  const [state, dispatch] = useReducer(reducer, initialAuthState);
  const didInitialise = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    })();
  }, [client, onRedirectCallback, skipRedirectCallback]);

  // Check if user is connected, if not redirect to default login path
  useEffect(() => {
    if (!isLoading && !state.isConnected) {
      const blockedPath = protectedPaths.find(({ path }) => new RegExp(path).test(window.location.pathname));
      if (blockedPath) {
        window.location.replace(defaultLoginPath);
      }
    }
  }, [isLoading, state.isConnected, protectedPaths, defaultLoginPath]);

  // Check if user has required access, if not redirect to specific redirect path
  useEffect(() => {
    if (!isLoading && state.isConnected) {
      const currentPath = window.location.pathname;
      const protectedPath = protectedPaths.find(({ path }) => new RegExp(path).test(currentPath));
      if (protectedPath && !protectedPath.accessIds.some(accessId => state.user?.access.includes(accessId))) {
        window.location.replace(protectedPath.redirectPath);
      }
    }
  }, [isLoading, state.isConnected, state.user?.access, protectedPaths]);

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

  const getUser = useCallback(() => client.getUser(), [client]);

  const getIdToken = useCallback(() => client.getIdToken(), [client]);

  const handleRedirectCallback = useCallback(
    async (url?: string): Promise<RedirectConnectResult> => {
      try {
        return await client.handleRedirectCallback(url);
      } catch (error) {
        throw tokenError(error);
      } finally {
        dispatch({
          type: 'HANDLE_REDIRECT_COMPLETE',
          user: await client.getUser()
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
      handleRedirectCallback
    };
  }, [
    state,
    getUser,
    getIdToken,
    connectWithRedirect,
    connectWithPopup,
    logout,
    handleRedirectCallback
  ]);

  if (isLoading) {
    return <>{loadingComponent}</>; // Use the custom loading component or null
  }

  return <context.Provider value={contextValue}>{children}</context.Provider>;
};

export default EarthoOneProvider;
