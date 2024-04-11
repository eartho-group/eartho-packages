import { ICache, InMemoryCache, LocalStorageCache } from './cache';
import {
  EarthoOneOptions,
  AuthorizationParams,
  AuthorizeOptions,
  LogoutOptions
} from './global';
import { getUniqueScopes } from './scope';

/**
 * @ignore
 */
export const GET_TOKEN_SILENTLY_LOCK_KEY = 'eartho.lock.getTokenSilently';

/**
 * @ignore
 */
export const buildOrganizationHintCookieName = (clientId: string) =>
  `eartho.${clientId}.organization_hint`;

/**
 * @ignore
 */
export const OLD_IS_AUTHENTICATED_COOKIE_NAME = 'eartho.is.authenticated';

/**
 * @ignore
 */
export const buildisConnectedCookieName = (clientId: string) =>
  `eartho.${clientId}.is.authenticated`;

/**
 * @ignore
 */
const cacheLocationBuilders: Record<string, () => ICache> = {
  memory: () => new InMemoryCache().enclosedCache,
  localstorage: () => new LocalStorageCache()
};

/**
 * @ignore
 */
export const cacheFactory = (location: string) => {
  return cacheLocationBuilders[location];
};

/**
 * @ignore
 */
export const getAuthorizeParams = (
  clientOptions: EarthoOneOptions & {
    authorizationParams: AuthorizationParams;
  },
  scope: string,
  authorizationParams: AuthorizationParams,
  state: string,
  nonce: string,
  code_challenge: string,
  redirect_uri: string | undefined,
  response_mode: string | undefined,
  access_id: string
): AuthorizeOptions => {
  return {
    client_id: clientOptions.clientId,
    ...clientOptions.authorizationParams,
    ...authorizationParams,
    scope: getUniqueScopes(scope, authorizationParams.scope),
    response_type: 'code',
    response_mode: response_mode || 'query',
    state,
    nonce,
    redirect_uri:
      redirect_uri || clientOptions.authorizationParams.redirect_uri,
    code_challenge,
    code_challenge_method: 'S256',
    access_id: authorizationParams.access_id
  };
};

/**
 * @ignore
 *
 * Function used to provide support for the deprecated onRedirect through openUrl.
 */
export const patchOpenUrlWithOnRedirect = <
  T extends Pick<LogoutOptions, 'openUrl' | 'onRedirect'>
>(
  options: T
) => {
  const { openUrl, onRedirect, ...originalOptions } = options;

  const result = {
    ...originalOptions,
    openUrl: openUrl === false || openUrl ? openUrl : onRedirect
  };

  return result as T;
};
