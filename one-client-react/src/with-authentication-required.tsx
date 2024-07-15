import React, { ComponentType, useEffect, FC } from 'react';
import useEarthoOne from './use-eartho';
import EarthoOneContext, {
  EarthoOneContextInterface,
  RedirectConnectOptions,
} from './eartho-context';

/**
 * @ignore
 */
const defaultOnRedirecting = (): JSX.Element => <></>;

/**
* @ignore
*/
const defaultOnBeforeAuthentication = async (): Promise<void> => {/* noop */};

/**
 * @ignore
 */
const defaultReturnTo = (): string =>
  `${window.location.pathname}${window.location.search}`;

/**
 * Options for the withAuthenticationRequired Higher Order Component
 */
export interface WithAuthenticationRequiredOptions {
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   returnTo: '/profile'
   * })
   * ```
   *
   * or
   *
   * ```js
   * withAuthenticationRequired(Profile, {
   *   returnTo: () => window.location.hash.substr(1)
   * })
   * ```
   *
   * Add a path for the `onRedirectCallback` handler to return the user to after login.
   */
  returnTo?: string | (() => string);
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   onRedirecting: () => <div>Redirecting you to the login...</div>
   * })
   * ```
   *
   * Render a message to show that the user is being redirected to the login.
   */
  onRedirecting?: () => JSX.Element;
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   onBeforeAuthentication: () => { analyticsLibrary.track('login_triggered'); }
   * })
   * ```
   *
   * Allows executing logic before the user is redirected to the login page.
   */
  onBeforeAuthentication?: () => Promise<void>;
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   loginOptions: {
   *     appState: {
   *       customProp: 'foo'
   *     }
   *   }
   * })
   * ```
   *
   * Pass additional login options, like extra `appState` to the login page.
   * This will be merged with the `returnTo` option used by the `onRedirectCallback` handler.
   */
  loginOptions: RedirectConnectOptions;
  /**
   * The context to be used when calling useEarthoOne, this should only be provided if you are using multiple EarthoOneProviders
   * within your application and you wish to tie a specific component to a EarthoOneProvider other than the EarthoOneProvider
   * associated with the default EarthoOneContext.
   */
  context?: React.Context<EarthoOneContextInterface>;
}

/**
 * ```js
 * const MyProtectedComponent = withAuthenticationRequired(MyComponent);
 * ```
 *
 * When you wrap your components in this Higher Order Component and an anonymous user visits your component
 * they will be redirected to the login page; after login they will be returned to the page they were redirected from.
 */
const withAuthenticationRequired = <P extends object>(
  Component: ComponentType<P>,
  options: WithAuthenticationRequiredOptions
): FC<P> => {
  return function WithAuthenticationRequired(props: P): JSX.Element {
    const {
      returnTo = defaultReturnTo,
      onRedirecting = defaultOnRedirecting,
      onBeforeAuthentication = defaultOnBeforeAuthentication,
      loginOptions,
      context = EarthoOneContext,
    } = options;

    const { isConnected, isLoading, connectWithRedirect } =
      useEarthoOne(context);

    useEffect(() => {
      if (isLoading || isConnected) {
        return;
      }
      const opts = {
        ...loginOptions,
        appState: {
          ...(loginOptions && loginOptions.appState),
          returnTo: typeof returnTo === 'function' ? returnTo() : returnTo,
        },
      };
      (async (): Promise<void> => {
        await onBeforeAuthentication();
        await connectWithRedirect(opts);
      })();
    }, [
      isLoading,
      isConnected,
      connectWithRedirect,
      onBeforeAuthentication,
      loginOptions,
      returnTo,
    ]);

    return isConnected ? <Component {...props} /> : onRedirecting();
  };
};

export default withAuthenticationRequired;
