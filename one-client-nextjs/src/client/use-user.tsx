'use client';
import React, { ReactElement, useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react';

import ConfigProvider, { ConfigContext } from './use-config';

/**
 * The user claims returned from the {@link useUser} hook.
 *
 * @category Client
 */
export interface UserProfile {
  email?: string | null;
  email_verified?: boolean | null;
  name?: string | null;
  nickname?: string | null;
  picture?: string | null;
  sub?: string | null;
  updated_at?: string | null;
  org_id?: string | null;
  [key: string]: unknown; // Any custom claim which could be in the profile
}

/**
 * The user context returned from the {@link useUser} hook.
 *
 * @category Client
 */
export type UserContext = {
  user?: UserProfile;
  error?: Error;
  isLoading: boolean;
  checkSession: () => Promise<void>;
};

/**
 * The error thrown by the default {@link UserFetcher}.
 *
 * The `status` property contains the status code of the response. It is `0` when the request
 * fails, for example due to being offline.
 *
 * This error is not thrown when the status code of the response is `204`, because that means the
 * user is not authenticated.
 *
 * @category Client
 */
export class RequestError extends Error {
  public status: number;

  constructor(status: number) {
    /* c8 ignore next */
    super();
    this.status = status;
    Object.setPrototypeOf(this, RequestError.prototype);
  }
}

/**
 * Fetches the user from the profile API route to fill the {@link useUser} hook with the
 * {@link UserProfile} object.
 *
 * If needed, you can pass a custom fetcher to the {@link EarthoClientProvider} component via the
 * {@link EarthoClientProviderProps.fetcher} prop.
 *
 * @throws {@link RequestError}
 */
type UserFetcher = (url: string) => Promise<UserProfile | undefined>;

/**
 * Configure the {@link EarthoClientProvider} component.
 *
 * If you have any server-side rendered pages (using `getServerSideProps` or Server Components), you should get the
 * user from the server-side session and pass it to the `<EarthoClientProvider>` component via the `user`
 * prop. This will prefill the {@link useUser} hook with the {@link UserProfile} object.
 * For example:
 *
 * ```js
 * // pages/_app.js
 * import React from 'react';
 * import { EarthoClientProvider } from '@eartho/one-client-nextjs/client';
 *
 * export default function App({ Component, pageProps }) {
 *   // If you've used `withPageAuthRequired`, `pageProps.user` can prefill the hook
 *   // if you haven't used `withPageAuthRequired`, `pageProps.user` is undefined so the hook
 *   // fetches the user from the API route
 *   const { user } = pageProps;
 *
 *   return (
 *     <EarthoClientProvider user={user}>
 *       <Component {...pageProps} />
 *     </EarthoClientProvider>
 *   );
 * }
 * ```
 *
 * or
 *
 * ```js
 * // app/layout.js
 * import { EarthoClientProvider } from '@eartho/one-client-nextjs/client';
 *
 * export default async function RootLayout({ children }) {
 *   // this will emit a warning because Server Components cannot write to cookies
 *   // see https://github.com/eartho/one-client-nextjs#using-this-sdk-with-react-server-components
 *   const session = await getSession();
 *
 *   return (
 *     <html lang="en">
 *       <body>
 *         <EarthoClientProvider user={session?.user}>
 *           {children}
 *         </EarthoClientProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * In client-side rendered pages, the {@link useUser} hook uses a {@link UserFetcher} to fetch the
 * user from the profile API route. If needed, you can specify a custom fetcher here in the
 * `fetcher` option.
 *
 * **IMPORTANT** If you have used a custom url for your {@link HandleProfile} API route handler
 * (the default is `/api/access/me`) then you need to specify it here in the `profileUrl` option.
 *
 * @category Client
 */
export type EarthoClientProviderProps = React.PropsWithChildren<
  { user?: UserProfile; profileUrl?: string; fetcher?: UserFetcher } & ConfigContext
>;

/**
 * @ignore
 */
const missingEarthoClientProvider = 'You forgot to wrap your app in <EarthoClientProvider>';

/**
 * @ignore
 */
export const UserContext = createContext<UserContext>({
  get user(): never {
    throw new Error(missingEarthoClientProvider);
  },
  get error(): never {
    throw new Error(missingEarthoClientProvider);
  },
  get isLoading(): never {
    throw new Error(missingEarthoClientProvider);
  },
  checkSession: (): never => {
    throw new Error(missingEarthoClientProvider);
  }
});

/**
 * @ignore
 */
export type UseUser = () => UserContext;

/**
 * The `useUser` hook, which will get you the {@link UserProfile} object from the server-side session by fetching it
 * from the {@link HandleProfile} API route.
 *
 * ```js
 * // pages/profile.js
 * import Link from 'next/link';
 * import { useUser } from '@eartho/one-client-nextjs/client';
 *
 * export default function Profile() {
 *   const { user, error, isLoading } = useUser();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>{error.message}</div>;
 *   if (!user) return <Link href="/api/access/login"><a>Login</a></Link>;
 *   return <div>Hello {user.name}, <Link href="/api/access/logout"><a>Logout</a></Link></div>;
 * }
 * ```
 *
 * @category Client
 */
export const useUser: UseUser = () => useContext<UserContext>(UserContext);

/**
 * To use the {@link useUser} hook, you must wrap your application in a `<EarthoClientProvider>` component.
 *
 * @category Client
 */
export type EarthoClientProvider = (props: EarthoClientProviderProps) => ReactElement<UserContext>;

/**
 * @ignore
 */
type EarthoClientProviderState = {
  user?: UserProfile;
  error?: Error;
  isLoading: boolean;
};

/**
 * @ignore
 */
const userFetcher: UserFetcher = async (url) => {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new RequestError(0); // Network error
  }
  if (response.status == 204) return undefined;
  if (response.ok) return response.json();
  throw new RequestError(response.status);
};

export default ({
  children,
  user: initialUser,
  profileUrl = process.env.NEXT_PUBLIC_EARTHO_PROFILE || '/api/access/me',
  loginUrl,
  fetcher = userFetcher
}: EarthoClientProviderProps): ReactElement<UserContext> => {
  const [state, setState] = useState<EarthoClientProviderState>({ user: initialUser, isLoading: !initialUser });

  const checkSession = useCallback(async (): Promise<void> => {
    try {
      const user = await fetcher(profileUrl);
      setState((previous) => ({ ...previous, user, error: undefined }));
    } catch (error) {
      setState((previous) => ({ ...previous, error: error as Error }));
    }
  }, [profileUrl]);

  useEffect((): void => {
    if (state.user) return;
    (async (): Promise<void> => {
      await checkSession();
      setState((previous) => ({ ...previous, isLoading: false }));
    })();
  }, [state.user]);

  const { user, error, isLoading } = state;
  const value = useMemo(() => ({ user, error, isLoading, checkSession }), [user, error, isLoading, checkSession]);

  return (
    <ConfigProvider loginUrl={loginUrl}>
      <UserContext.Provider value={value}>{children}</UserContext.Provider>
    </ConfigProvider>
  );
};
