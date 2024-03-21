import { EarthoOne } from './EarthoOne';
import { EarthoOneOptions } from './global';

import './global';

export * from './global';

/**
 * Asynchronously creates the EarthoOne instance and calls `checkSession`.
 *
 * **Note:** There are caveats to using this in a private browser tab, which may not silently authenticae
 * a user on page refresh. Please see [the checkSession docs](https://eartho.github.io/one-client-js/classes/EarthoOne.html#checksession) for more info.
 *
 * @param options The client options
 * @returns An instance of EarthoOne
 */
export async function createEarthoOne(options: EarthoOneOptions) {
  const eartho = new EarthoOne(options);
  await eartho.checkSession();
  return eartho;
}

export { EarthoOne };

export {
  GenericError,
  AuthenticationError,
  TimeoutError,
  PopupTimeoutError,
  PopupCancelledError,
  MfaRequiredError,
  MissingRefreshTokenError
} from './errors';

export {
  ICache,
  LocalStorageCache,
  InMemoryCache,
  Cacheable,
  DecodedToken,
  CacheEntry,
  WrappedCacheEntry,
  KeyManifestEntry,
  MaybePromise,
  CacheKey,
  CacheKeyData
} from './cache';
