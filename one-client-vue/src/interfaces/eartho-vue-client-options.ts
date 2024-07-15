/* eslint-disable @typescript-eslint/no-empty-interface */
import type {
  EarthoOneOptions,
  LogoutOptions as SPALogoutOptions,
  RedirectConnectOptions as SPARedirectConnectOptions
} from '@eartho/one-client-js';
import type { AppState } from './app-state';

/**
 * Configuration for the Eartho Vue Client
 */
export interface EarthoVueClientOptions extends EarthoOneOptions { }

export interface LogoutOptions extends Omit<SPALogoutOptions, 'onRedirect'> { }
export interface RedirectConnectOptions<TAppState = AppState>
  extends Omit<SPARedirectConnectOptions<TAppState>, 'onRedirect'> { }
