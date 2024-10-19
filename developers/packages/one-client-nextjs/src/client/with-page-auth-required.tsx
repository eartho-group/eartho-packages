'use client';
import React, { ComponentType, useEffect } from 'react';

import { useConfig } from './use-config';
import { useUser, UserProfile } from './use-user';

/**
 * @ignore
 */
const defaultOnRedirecting = (): JSX.Element => <></>;

/**
 * @ignore
 */
const defaultOnError = (): JSX.Element => <></>;

/**
 * Options to customize the withClientAccessRequired higher order component.
 *
 * @category Client
 */
export interface WithClientAccessRequiredOptions {
  /**
   * ```js
   * withClientAccessRequired(Profile, {
   *   returnTo: '/profile'
   * });
   * ```
   *
   * Add a path to return the user to after login.
   */
  returnTo?: string;
  /**
   * ```js
   * withClientAccessRequired(Profile, {
   *   onRedirecting: () => <div>Redirecting you to the login...</div>
   * });
   * ```
   *
   * Render a message to show that the user is being redirected to the login.
   */
  onRedirecting?: () => JSX.Element;
  /**
   * ```js
   * withClientAccessRequired(Profile, {
   *   onError: error => <div>Error: {error.message}</div>
   * });
   * ```
   *
   * Render a fallback in case of error fetching the user from the profile API route.
   */
  onError?: (error: Error) => JSX.Element;
}

export interface UserProps {
  user: UserProfile;
}

/**
 * ```js
 * const MyProtectedPage = withClientAccessRequired(MyPage);
 * ```
 *
 * When you wrap your pages in this higher order component and an anonymous user visits your page,
 * they will be redirected to the login page and then returned to the page they were redirected from (after login).
 *
 * @category Client
 */
export type WithClientAccessRequired = <P extends {}>(
  Component: ComponentType<P & UserProps>,
  options?: WithClientAccessRequiredOptions
) => React.FC<P>;

/**
 * @ignore
 */
const withClientAccessRequired: WithClientAccessRequired = (Component, options = {}) => {
  return function WithClientAccessRequired(props): JSX.Element {
    const { returnTo, onRedirecting = defaultOnRedirecting, onError = defaultOnError } = options;
    const { loginUrl } = useConfig();
    const { user, error, isLoading } = useUser();

    useEffect(() => {
      if ((user && !error) || isLoading) return;
      let returnToPath: string;

      if (!returnTo) {
        const currentLocation = window.location.toString();
        returnToPath = currentLocation.replace(new URL(currentLocation).origin, '') || '/';
      } else {
        returnToPath = returnTo;
      }

      window.location.assign(`${loginUrl}?returnTo=${encodeURIComponent(returnToPath)}`);
    }, [user, error, isLoading]);

    if (error) return onError(error);
    if (user) return <Component user={user} {...(props as any)} />;

    return onRedirecting();
  };
};

export default withClientAccessRequired;
