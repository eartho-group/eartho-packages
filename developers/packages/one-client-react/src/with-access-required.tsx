import React, { ComponentType, useEffect, FC } from 'react';
import useEarthoOne from './use-eartho';
import EarthoOneContext, {
  EarthoOneContextInterface,
} from './eartho-context';

/**
 * @ignore
 */
const defaultOnRedirecting = (): JSX.Element => <></>;

/**
 * @ignore
 */
const defaultOnBeforeRedirect = async (): Promise<void> => {/* noop */};

/**
 * @ignore
 */
const defaultReturnTo = (): string =>
  `${window.location.pathname}${window.location.search}`;

/**
 * Options for the withAccessRequired Higher Order Component
 */
export interface withAccessRequiredOptions {
  returnTo?: string | (() => string);
  onRedirecting?: () => JSX.Element;
  onBeforeRedirect?: () => Promise<void>;
  context?: React.Context<EarthoOneContextInterface>;
  requiredAccess: string[]; // Required access levels
  redirectPaths: { [key: string]: string }; // Mapping of access levels to redirect paths
  defaultRedirectPath: string; // Default path to redirect if no specific access level matches
}

/**
 * ```js
 * const MyProtectedComponent = withAccessRequired(MyComponent, {
 *   requiredAccess: ['admin', 'editor'],
 *   redirectPaths: {
 *     admin: '/admin-dashboard',
 *     editor: '/editor-dashboard'
 *   },
 *   defaultRedirectPath: '/no-access'
 * });
 * ```
 *
 * When you wrap your components in this Higher Order Component and an anonymous user visits your component
 * they will be redirected to a specified path; after login they will be returned to the page they were redirected from.
 * If the user does not have the required access, they will be redirected to a specified path based on their access level.
 */
const withAccessRequired = <P extends object>(
  Component: ComponentType<P>,
  options: withAccessRequiredOptions
): FC<P> => {
  return function WithAccessRequired(props: P): JSX.Element {
    const {
      returnTo = defaultReturnTo,
      onRedirecting = defaultOnRedirecting,
      onBeforeRedirect = defaultOnBeforeRedirect,
      context = EarthoOneContext,
      requiredAccess,
      redirectPaths,
      defaultRedirectPath
    } = options;

    const { isConnected, isLoading, user } = useEarthoOne(context);

    useEffect(() => {
      if (isLoading) {
        return;
      }
      (async (): Promise<void> => {
        await onBeforeRedirect();
        if (!isConnected || !user || !requiredAccess.some(access => user.access.includes(access))) {
          const userAccess = user?.access.find((access:string) => requiredAccess.includes(access));
          const redirectPath = userAccess ? redirectPaths[userAccess] : defaultRedirectPath;
          window.location.replace(redirectPath);
        }
      })();
    }, [
      isLoading,
      isConnected,
      onBeforeRedirect,
      returnTo,
      user,
      requiredAccess,
      redirectPaths,
      defaultRedirectPath
    ]);

    return isConnected && user && requiredAccess.some(access => user.access.includes(access)) 
      ? <Component {...props} /> 
      : onRedirecting();
  };
};

export default withAccessRequired;
