/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { watchEffect } from 'vue';

/**
 * @ignore
 * Run watchEffect untill the watcher returns true, then stop the watch.
 * Once it returns true, the promise will resolve.
 */
export function watchEffectOnceAsync<T>(watcher: () => T) {
  return new Promise<void>(resolve => {
    watchEffectOnce(watcher, resolve);
  });
}

/**
 * @ignore
 * Run watchEffect untill the watcher returns true, then stop the watch.
 * Once it returns true, it will call the provided function.
 */
export function watchEffectOnce<T>(watcher: () => T, fn: Function) {
  const stopWatch = watchEffect(() => {
    if (watcher()) {
      fn();
      stopWatch();
    }
  });
}

/**
 * @ignore
 * Helper function to bind methods to itself, useful when using Vue's `provide` / `inject` API's.
 */
export function bindPluginMethods(plugin: any, exclude: string[]) {
  Object.getOwnPropertyNames(Object.getPrototypeOf(plugin))
    .filter(method => !exclude.includes(method))
    // eslint-disable-next-line security/detect-object-injection
    .forEach(method => (plugin[method] = plugin[method].bind(plugin)));
}

/**
 * @ignore
 * Helper function to map the v1 `redirect_uri` option to the v2 `authorizationParams.redirect_uri`
 * and log a warning.
 */
export function deprecateRedirectUri(options?: any) {
  if (options?.redirect_uri) {
    console.warn(
      'Using `redirect_uri` has been deprecated, please use `authorizationParams.redirect_uri` instead as `redirectUri` will be no longer supported in a future version'
    );
    options.authorizationParams = options.authorizationParams || {};
    options.authorizationParams.redirect_uri = options.redirect_uri;
    delete options.redirect_uri;
  }
}
