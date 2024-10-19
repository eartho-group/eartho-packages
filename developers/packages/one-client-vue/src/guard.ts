import type { RouteLocation } from 'vue-router';
import { watchEffectOnceAsync } from './utils';
import { client as earthoOneClient } from './plugin';
import { EARTHO_TOKEN } from './token';
import type { EarthoVueClient } from './interfaces';
import type { App } from 'vue';
import { unref } from 'vue';
import type { RedirectConnectOptions } from '@eartho/one-client-js';

async function createGuardHandler(
  client: EarthoVueClient,
  to: RouteLocation,
  RedirectConnectOptions: RedirectConnectOptions
) {
  const fn = async () => {
    if (unref(client.isConnected)) {
      return true;
    }

    await client.connectWithRedirect({
      appState: { target: to.fullPath },
      ...RedirectConnectOptions
    });

    return false;
  };

  if (!unref(client.isLoading)) {
    return fn();
  }

  await watchEffectOnceAsync(() => !unref(client.isLoading));

  return fn();
}

/**
 * The options used when creating an AuthGuard.
 */
export interface AuthGuardOptions {
  /**
   * The vue application
   */
  app?: App;

  /**
   * Route specific options to use when being redirected to Eartho
   */
  RedirectConnectOptions: RedirectConnectOptions;
}

/**
 *
 * @param [app] The vue application
 */
// export function createAuthGuard(
//   app?: App
// ): (to: RouteLocation) => Promise<boolean>;

/**
 *
 * @param [options] The options used when creating an AuthGuard.
 */
export function createAuthGuard(
  options: AuthGuardOptions
): (to: RouteLocation) => Promise<boolean>;

export function createAuthGuard(
  options: AuthGuardOptions
): (to: RouteLocation) => Promise<boolean> {

  const app = options.app
  return async (to: RouteLocation) => {
    const eartho = app
      ? (app.config.globalProperties[EARTHO_TOKEN] as EarthoVueClient)
      : (unref(earthoOneClient) as EarthoVueClient);

    return createGuardHandler(eartho, to, options.RedirectConnectOptions); // Adding ! for non-null assertion
  };
}

export async function authGuard(to: RouteLocation, options: AuthGuardOptions) {
  const eartho = unref(earthoOneClient) as EarthoVueClient;
  return createGuardHandler(eartho, to, {accessId:""});
}
