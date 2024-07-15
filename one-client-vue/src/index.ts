import { inject } from 'vue';
import './global';
import { EarthoPlugin } from './global';
import type {
  EarthoVueClient,
  EarthoPluginOptions,
  EarthoVueClientOptions
} from './global';
import { EARTHO_INJECTION_KEY, EARTHO_TOKEN } from './token';
import { deprecateRedirectUri } from './utils';

export * from './global';
export { EARTHO_INJECTION_KEY } from './token';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    [EARTHO_TOKEN]: EarthoVueClient;
  }
}

/**
 * Creates the Eartho plugin.
 *
 * @param clientOptions The Auth Vue Client Options
 * @param pluginOptions Additional Plugin Configuration Options
 * @returns An instance of EarthoPlugin
 */
export function createEarthoOne(
  clientOptions: EarthoVueClientOptions,
  pluginOptions?: EarthoPluginOptions
) {
  deprecateRedirectUri(clientOptions);
  return new EarthoPlugin(clientOptions, pluginOptions);
}

/**
 * Returns the registered Eartho instance using Vue's `inject`.
 * @returns An instance of EarthoVueClient
 */
export function useEarthoOne(): EarthoVueClient {
  return inject(EARTHO_INJECTION_KEY) as EarthoVueClient;
}
