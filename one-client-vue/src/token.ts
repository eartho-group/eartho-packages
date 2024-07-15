import type { InjectionKey } from 'vue';
import type { EarthoVueClient } from './interfaces';

/**
 * @ignore
 */
export const EARTHO_TOKEN = '$eartho';

/**
 * Injection token used to `provide` the `EarthoVueClient` instance. Can be used to pass to `inject()`
 *
 * ```js
 * inject(EARTHO_INJECTION_KEY)
 * ```
 */
export const EARTHO_INJECTION_KEY: InjectionKey<EarthoVueClient> =
  Symbol(EARTHO_TOKEN);
