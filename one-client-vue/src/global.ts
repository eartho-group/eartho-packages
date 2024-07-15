export { EarthoPlugin } from './plugin';
export * from './interfaces';
export * from './guard';

export { User, InMemoryCache, LocalStorageCache } from '@eartho/one-client-js';

export type {
  AuthorizationParams,
  PopupConnectOptions,
  PopupConfigOptions,
  GetTokenWithPopupOptions,
  LogoutUrlOptions,
  CacheLocation,
  GetTokenSilentlyOptions,
  IdToken,
  ICache,
  Cacheable
} from '@eartho/one-client-js';
