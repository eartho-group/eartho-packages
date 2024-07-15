import type { App, Ref } from 'vue';
import { ref } from 'vue';
import type { Router } from 'vue-router';
import type {
  AppState,
  EarthoPluginOptions,
  EarthoVueClient,
  EarthoVueClientOptions,
  LogoutOptions,
  RedirectConnectOptions
} from './interfaces';
import { EARTHO_INJECTION_KEY, EARTHO_TOKEN } from './token';
import version from './version';
import type {
  GetTokenSilentlyOptions,
  GetTokenSilentlyVerboseResponse,
  GetTokenWithPopupOptions,
  IdToken,
  PopupConfigOptions,
  PopupConnectOptions,
  RedirectConnectResult
} from '@eartho/one-client-js';
import { EarthoOne, User } from '@eartho/one-client-js';
import { bindPluginMethods, deprecateRedirectUri } from './utils';

/**
 * Helper callback that's used by default before the plugin is installed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PLUGIN_NOT_INSTALLED_HANDLER: any = () => {
  console.error(`Please ensure Eartho's Vue plugin is correctly installed.`);
};

/**
 * Helper client that's used by default before the plugin is installed.
 */
const PLUGIN_NOT_INSTALLED_CLIENT: EarthoVueClient = {
  isLoading: ref(false),
  isConnected: ref(false),
  user: ref(undefined),
  idToken: ref(undefined),
  error: ref(null),
  connectWithPopup: PLUGIN_NOT_INSTALLED_HANDLER,
  connectWithRedirect: PLUGIN_NOT_INSTALLED_HANDLER,
  getAccessTokenSilently: PLUGIN_NOT_INSTALLED_HANDLER,
  getAccessTokenWithPopup: PLUGIN_NOT_INSTALLED_HANDLER,
  logout: PLUGIN_NOT_INSTALLED_HANDLER,
  checkSession: PLUGIN_NOT_INSTALLED_HANDLER,
  handleRedirectCallback: PLUGIN_NOT_INSTALLED_HANDLER
};

/**
 * @ignore
 */
export const client: Ref<EarthoVueClient> = ref(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PLUGIN_NOT_INSTALLED_CLIENT as any
);

/**
 * @ignore
 */
export class EarthoPlugin implements EarthoVueClient {
  private _client!: EarthoOne;
  public isLoading: Ref<boolean> = ref(true);
  public isConnected: Ref<boolean> = ref(false);
  public user: Ref<User | undefined> = ref({});
  public idToken = ref<string | undefined>();
  public error = ref<Error | null>(null);

  constructor(
    private clientOptions: EarthoVueClientOptions,
    private pluginOptions?: EarthoPluginOptions
  ) {
    // Vue Plugins can have issues when passing around the instance to `provide`
    // Therefor we need to bind all methods correctly to `this`.
    bindPluginMethods(this, ['constructor']);
  }

  install(app: App) {
    this._client = new EarthoOne({
      ...this.clientOptions,
      earthoOneClient: {
        name: 'one-client-vue',
        version: version
      }
    });

    this.__checkSession(app.config.globalProperties.$router);

    // eslint-disable-next-line security/detect-object-injection
    app.config.globalProperties[EARTHO_TOKEN] = this;
    app.provide(EARTHO_INJECTION_KEY, this as EarthoVueClient);

    client.value = this as EarthoVueClient;
  }

  async connectWithRedirect(options: RedirectConnectOptions<AppState>) {
    deprecateRedirectUri(options);
    return this._client.connectWithRedirect(options);
  }

  async connectWithPopup(
    options: PopupConnectOptions,
    config?: PopupConfigOptions
  ) {
    deprecateRedirectUri(options);
    return this.__proxy(() => this._client.connectWithPopup(options, config));
  }

  async logout(options?: LogoutOptions) {
    if (options?.openUrl || options?.openUrl === false) {
      return this.__proxy(() => this._client.logout(options));
    }

    return this._client.logout(options);
  }

  /* istanbul ignore next */
  async getAccessTokenSilently(
    options: GetTokenSilentlyOptions & { detailedResponse: true }
  ): Promise<GetTokenSilentlyVerboseResponse>;
  /* istanbul ignore next */
  async getAccessTokenSilently(
    options?: GetTokenSilentlyOptions
  ): Promise<string>;
  /* istanbul ignore next */
  async getAccessTokenSilently(
    options: GetTokenSilentlyOptions = {}
  ): Promise<string | GetTokenSilentlyVerboseResponse> {
    deprecateRedirectUri(options);
    return this.__proxy(() => this._client.getTokenSilently(options));
  }

  async getAccessTokenWithPopup(
    options: GetTokenWithPopupOptions,
    config?: PopupConfigOptions
  ) {
    deprecateRedirectUri(options);
    return this.__proxy(() => this._client.getTokenWithPopup(options, config));
  }

  async checkSession(options?: GetTokenSilentlyOptions) {
    return this.__proxy(() => this._client.checkSession(options));
  }

  async handleRedirectCallback(
    url?: string
  ): Promise<RedirectConnectResult<AppState>> {
    return this.__proxy(() =>
      this._client.handleRedirectCallback<AppState>(url)
    );
  }

  private async __checkSession(router?: Router) {
    const search = window.location.search;

    try {
      if (
        (search.includes('code=') || search.includes('error=')) &&
        search.includes('state=') &&
        !this.pluginOptions?.skipRedirectCallback
      ) {
        const result = await this.handleRedirectCallback();
        const appState = result?.appState;
        const target = appState?.target ?? '/';

        window.history.replaceState({}, '', '/');

        if (router) {
          router.push(target);
        }

        return result;
      } else {
        await this.checkSession();
      }
    } catch (e) {
      // __checkSession should never throw an exception as it will fail installing the plugin.
      // Instead, errors during __checkSession are propagated using the errors property on `useEarthoOne`.

      window.history.replaceState({}, '', '/');

      if (router) {
        router.push(this.pluginOptions?.errorPath || '/');
      }
    }
  }

  private async __refreshState() {
    this.isConnected.value = await this._client.isConnected();
    this.user.value = await this._client.getUser();
    this.idToken.value = await this._client.getIdToken();
    this.isLoading.value = false;
  }

  private async __proxy<T>(cb: () => T, refreshState = true) {
    let result;
    try {
      result = await cb();
      this.error.value = null;
    } catch (e) {
      this.error.value = e as Error;
      throw e;
    } finally {
      if (refreshState) {
        await this.__refreshState();
      }
    }

    return result;
  }
}
