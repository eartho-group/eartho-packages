import { Injectable, Inject, OnDestroy } from '@angular/core';

import {
  EarthoOne,
  RedirectConnectOptions,
  PopupConnectOptions,
  PopupConfigOptions,
  LogoutOptions,
  GetTokenSilentlyOptions,
  GetTokenWithPopupOptions,
  RedirectLoginResult,
  LogoutUrlOptions,
  GetTokenSilentlyVerboseResponse,
  GetUserOptions,
  User,
  IdToken,
} from '@eartho/one-client-js';

import {
  of,
  from,
  Subject,
  Observable,
  iif,
  defer,
  ReplaySubject,
  throwError,
} from 'rxjs';

import {
  concatMap,
  tap,
  map,
  takeUntil,
  catchError,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';

import { EarthoOneService } from './auth.client';
import { AbstractNavigator } from './abstract-navigator';
import { AuthClientConfig, AppState } from './auth.config';
import { AuthState } from './auth.state';

@Injectable({
  providedIn: 'root',
})
export class AuthService<TAppState extends AppState = AppState>
  implements OnDestroy {
  private appStateSubject$ = new ReplaySubject<TAppState>(1);

  // https://stackoverflow.com/a/41177163
  private ngUnsubscribe$ = new Subject<void>();
  /**
   * Emits boolean values indicating the loading state of the SDK.
   */
  readonly isLoading$ = this.authState.isLoading$;

  /**
   * Emits boolean values indicating the authentication state of the user. If `true`, it means a user has authenticated.
   * This depends on the value of `isLoading$`, so there is no need to manually check the loading state of the SDK.
   */
  readonly isConnected$ = this.authState.isConnected$;

  /**
   * Emits details about the authenticated user, or null if not authenticated.
   */
  readonly user$ = this.authState.user$;

  /**
   * Emits ID token claims when authenticated, or null if not authenticated.
   */
  readonly idTokenClaims$ = this.authState.idTokenClaims$;

  /**
   * Emits errors that occur during login, or when checking for an active session on startup.
   */
  readonly error$ = this.authState.error$;

  /**
   * Emits the value (if any) that was passed to the `connectWithRedirect` method call
   * but only **after** `handleRedirectCallback` is first called
   */
  readonly appState$ = this.appStateSubject$.asObservable();

  constructor(
    @Inject(EarthoOneService) private earthoOneClient: EarthoOne,
    private configFactory: AuthClientConfig,
    private navigator: AbstractNavigator,
    private authState: AuthState
  ) {
    const checkSessionOrCallback$ = (isCallback: boolean) =>
      iif(
        () => isCallback,
        this.handleRedirectCallback(),
        defer(() => this.earthoOneClient.checkSession())
      );

    this.shouldHandleCallback()
      .pipe(
        switchMap((isCallback) =>
          checkSessionOrCallback$(isCallback).pipe(
            catchError((error) => {
              const config = this.configFactory.get();
              this.authState.setError(error);
              this.navigator.navigateByUrl(config.errorPath || '/');
              return of(undefined);
            })
          )
        ),
        tap(() => {
          this.authState.setIsLoading(false);
        }),
        takeUntil(this.ngUnsubscribe$)
      )
      .subscribe();
  }

  /**
   * Called when the service is destroyed
   */
  ngOnDestroy(): void {
    // https://stackoverflow.com/a/41177163
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }

  /**
   * ```js
   * connectWithRedirect(options);
   * ```
   *
   * Performs a redirect to `/authorize` using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   *
   * @param options The login options
   */
  connectWithRedirect(
    options?: RedirectConnectOptions<TAppState>
  ): Observable<void> {
    return from(this.earthoOneClient.connectWithRedirect(options));
  }

  /**
   * ```js
   * await connectWithPopup(options);
   * ```
   *
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * IMPORTANT: This method has to be called from an event handler
   * that was started by the user like a button click, for example,
   * otherwise the popup will be blocked in most browsers.
   *
   * @param options The login options
   * @param config Configuration for the popup window
   */
  connectWithPopup(
    options?: PopupConnectOptions,
    config?: PopupConfigOptions
  ): Observable<void> {
    return from(
      this.earthoOneClient.connectWithPopup(options, config).then(() => {
        this.authState.refresh();
      })
    );
  }

  /**
   * ```js
   * logout();
   * ```
   *
   * Clears the application session and performs a redirect to `/v2/logout`, using
   * the parameters provided as arguments, to clear the Eartho session.
   * If the `federated` option is specified it also clears the Identity Provider session.
   * If the `localOnly` option is specified, it only clears the application session.
   * It is invalid to set both the `federated` and `localOnly` options to `true`,
   * and an error will be thrown if you do.
   *
   * @param options The logout options
   */
  logout(options?: LogoutOptions): void {
    const logout = this.earthoOneClient.logout(options) || of(null);

    from(logout).subscribe(() => {
      if (options?.localOnly) {
        this.authState.refresh();
      }
    });
  }

  /**
   * Fetches a new access token and returns the response from the /oauth/token endpoint, omitting the refresh token.
   *
   * @param options The options for configuring the token fetch.
   */
  connectSilently(
    options: GetTokenSilentlyOptions & { detailedResponse: true }
  ): Observable<GetTokenSilentlyVerboseResponse>;

  /**
   * Fetches a new access token and returns it.
   *
   * @param options The options for configuring the token fetch.
   */
  connectSilently(options?: GetTokenSilentlyOptions): Observable<string>;

  /**
   * ```js
   * connectSilently(options).subscribe(token => ...)
   * ```
   *
   * If there's a valid token stored, return it. Otherwise, opens an
   * iframe with the `/authorize` URL using the parameters provided
   * as arguments. Random and secure `state` and `nonce` parameters
   * will be auto-generated. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * If refresh tokens are used, the token endpoint is called directly with the
   * 'refresh_token' grant. If no refresh token is available to make this call,
   * the SDK falls back to using an iframe to the '/authorize' URL.
   *
   * This method may use a web worker to perform the token call if the in-memory
   * cache is used.
   *
   * @param options The options for configuring the token fetch.
   */
  connectSilently(
    options: GetTokenSilentlyOptions = {}
  ): Observable<string | GetTokenSilentlyVerboseResponse> {
    return of(this.earthoOneClient).pipe(
      concatMap((client) =>
        options.detailedResponse === true
          ? client.connectSilently({ ...options, detailedResponse: true })
          : client.connectSilently(options)
      ),
      tap((token) =>
        this.authState.setAccessToken(
          typeof token === 'string' ? token : token.access_token
        )
      ),
      catchError((error) => {
        this.authState.setError(error);
        this.authState.refresh();
        return throwError(error);
      })
    );
  }

  /**
   * ```js
   * getUser(options).subscribe(user => ...);
   * ```
   *
   * Returns the user information if available (decoded
   * from the `id_token`).
   *
   * If you provide an audience or scope, they should match an existing Access Token
   * (the SDK stores a corresponding ID Token with every Access Token, and uses the
   * scope and audience to look up the ID Token)
   *
   * @remarks
   *
   * The returned observable will emit once and then complete.
   *
   * @typeparam TUser The type to return, has to extend {@link User}.
   * @param options The options to get the user
   */
  getUser<TUser extends User>(
    options?: GetUserOptions
  ): Observable<TUser | undefined> {
    return defer(() => this.earthoOneClient.getUser<TUser>(options));
  }

  /**
   * ```js
   * getIdToken(options).subscribe(claims => ...);
   * ```
   *
   * Returns all claims from the id_token if available.
   *
   * If you provide an audience or scope, they should match an existing Access Token
   * (the SDK stores a corresponding ID Token with every Access Token, and uses the
   * scope and audience to look up the ID Token)
   *
   * @remarks
   *
   * The returned observable will emit once and then complete.
   *
   * @param options The options to get the Id token claims
   */
  getIdToken(): Observable<string | undefined> {
    return defer(() => this.earthoOneClient.getIdToken());
  }

  /**
   * ```js
   * handleRedirectCallback(url).subscribe(result => ...)
   * ```
   *
   * After the browser redirects back to the callback page,
   * call `handleRedirectCallback` to handle success and error
   * responses from Eartho. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * Calling this method also refreshes the authentication and user states.
   *
   * @param url The URL to that should be used to retrieve the `state` and `code` values. Defaults to `window.location.href` if not given.
   */
  handleRedirectCallback(
    url?: string
  ): Observable<RedirectLoginResult<TAppState>> {
    return defer(() =>
      this.earthoOneClient.handleRedirectCallback<TAppState>(url)
    ).pipe(
      withLatestFrom(this.authState.isLoading$),
      tap(([result, isLoading]) => {
        if (!isLoading) {
          this.authState.refresh();
        }
        const appState = result?.appState;
        const target = appState?.target ?? '/';

        if (appState) {
          this.appStateSubject$.next(appState);
        }

        this.navigator.navigateByUrl(target);
      }),
      map(([result]) => result)
    );
  }

  private shouldHandleCallback(): Observable<boolean> {
    return of(location.search).pipe(
      map((search) => {
        return (
          (search.includes('code=') || search.includes('error=')) &&
          search.includes('state=') &&
          !this.configFactory.get().skipRedirectCallback
        );
      })
    );
  }
}
