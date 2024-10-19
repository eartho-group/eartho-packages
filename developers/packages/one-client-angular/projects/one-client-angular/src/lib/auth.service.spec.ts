import { fakeAsync, TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { EarthoOneService } from './auth.client';
import {
  EarthoOne,
  IdToken,
  LogoutUrlOptions,
  RedirectConnectOptions,
} from '@eartho/one-client-js';
import { AbstractNavigator } from './abstract-navigator';
import {
  bufferCount,
  bufferTime,
  filter,
  mergeMap,
  take,
  tap,
} from 'rxjs/operators';
import { Location } from '@angular/common';
import { AuthConfig, AuthConfigService } from './auth.config';
import { AuthState } from './auth.state';

/**
 * Wraps service.isLoading$ so that assertions can be made
 * only when the SDK has finished loading.
 * @param service The service instance under test
 */
const loaded = (service: AuthService) =>
  service.isLoading$.pipe(filter((loading) => !loading));

describe('AuthService', () => {
  let earthoOneClient: EarthoOne;
  let moduleSetup: any;
  let service: AuthService;
  let authConfig: Partial<AuthConfig>;
  let authState: AuthState;

  const createService = () => {
    return TestBed.inject(AuthService);
  };

  beforeEach(() => {
    authConfig = {};
    earthoOneClient = new EarthoOne({
      domain: '',
      client_id: '',
    });

    spyOn(earthoOneClient, 'handleRedirectCallback').and.resolveTo({});
    spyOn(earthoOneClient, 'connectWithRedirect').and.resolveTo();
    spyOn(earthoOneClient, 'connectWithPopup').and.resolveTo();
    spyOn(earthoOneClient, 'checkSession').and.resolveTo();
    spyOn(earthoOneClient, 'isConnected').and.resolveTo(false);
    spyOn(earthoOneClient, 'getUser').and.resolveTo(undefined);
    spyOn(earthoOneClient, 'getIdToken').and.resolveTo(undefined);
    spyOn(earthoOneClient, 'logout');
    spyOn(earthoOneClient, 'getIdToken').and.resolveTo('__access_token__');
    spyOn(earthoOneClient, 'buildAuthorizeUrl').and.resolveTo('/authorize');
    spyOn(earthoOneClient, 'buildLogoutUrl').and.returnValue('/v2/logout');

    window.history.replaceState(null, '', '');

    moduleSetup = {
      providers: [
        AbstractNavigator,
        {
          provide: EarthoOneService,
          useValue: earthoOneClient,
        },
      ],
    };

    TestBed.configureTestingModule(moduleSetup);
    service = createService();
    authState = TestBed.inject(AuthState);
  });

  describe('constructor', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should not call handleRedirectCallback on init, when code and state are not present on the URL', () => {
      expect(earthoOneClient.handleRedirectCallback).not.toHaveBeenCalled();
    });

    it('should call checkSession', () => {
      expect(earthoOneClient.checkSession).toHaveBeenCalled();
    });

    it('should set isLoading$ in the correct sequence', (done) => {
      const values: boolean[] = [];

      service.isLoading$.subscribe((loading) => {
        values.push(loading);

        if (!loading) {
          expect(values).toEqual([true, false]);
          done();
        }
      });
    });

    it('should not set isLoading when service destroyed before checkSession finished', (done) => {
      const localService = createService();

      localService.isLoading$.pipe(bufferTime(500)).subscribe((loading) => {
        expect(loading.length).toEqual(1);
        expect(loading).toEqual([true]);
        done();
      });

      localService.ngOnDestroy();
    });
  });

  describe('The `isConnected` observable', () => {
    it('should return `false` when the client is not authenticated', (done) => {
      service.isConnected$.subscribe((value) => {
        expect(value).toBeFalse();
        done();
      });
    });

    it('should return `true` when the client is authenticated', (done) => {
      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);

      loaded(service).subscribe(() => {
        service.isConnected$.subscribe((value) => {
          expect(value).toBeTrue();
          done();
        });
      });
    });

    it('should return true after successfully getting a new token', (done) => {
      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(false);

      service.isConnected$.pipe(bufferCount(2)).subscribe((values) => {
        expect(values[0]).toBe(false);
        expect(values[1]).toBe(true);
        done();
      });

      // Add a small delay before triggering a new emit to the isConnected$.
      // This ensures we can capture both emits using the above bufferCount(2)
      setTimeout(() => {
        (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo({});
        (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);

        service.connectSilently().subscribe();
      }, 0);
    });

    it('should still return true when the token is expired', fakeAsync((
      done: any
    ) => {
      authState.setIsLoading(false);
      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);

      service.isConnected$.pipe(take(1)).subscribe((value) => {
        expect(value).toBe(true);
      });

      // When the token is expired, earthoOneClient.isConnected is resolving to false.
      // This is unexpected but known behavior in Eartho-SPA-JS, so we shouldnt rely on it apart from initially.
      // Once this is resolved, we should be able to rely on `earthoOneClient.isConnected`, even when the Access Token is expired.
      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(false);

      service.isConnected$.pipe(take(1)).subscribe((value) => {
        expect(value).toBe(true);
      });
    }));
  });

  describe('The `user` observable', () => {
    it('should get the user if authenticated', (done) => {
      const user = {
        name: 'Test User',
      };

      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);
      (earthoOneClient.getUser as jasmine.Spy).and.resolveTo(user);

      service.user$.subscribe((value) => {
        expect(value).toBe(user);
        done();
      });
    });

    it('should update the user after successfully getting a new token', (done) => {
      const user = {
        name: 'Test User',
      };

      const user2 = {
        name: 'Another User',
      };

      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);
      (earthoOneClient.getUser as jasmine.Spy).and.resolveTo(user);

      service.user$.pipe(bufferCount(2)).subscribe((values) => {
        expect(values[0]).toBe(user);
        expect(values[1]).toBe(user2);
        done();
      });

      // Add a small delay before triggering a new emit to the user$.
      // This ensures we can capture both emits using the above bufferCount(2)
      setTimeout(() => {
        (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo({});
        (earthoOneClient.getUser as jasmine.Spy).and.resolveTo(user2);

        service.connectSilently().subscribe();
      }, 0);
    });

    it('should return null when logged out', (done) => {
      const user = {
        name: 'Test User',
      };

      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);
      (earthoOneClient.getUser as jasmine.Spy).and.resolveTo(user);

      service.user$.pipe(bufferCount(2)).subscribe((values) => {
        expect(values[0]).toBe(user);
        expect(values[1]).toBe(null);
        done();
      });

      service.isConnected$.pipe(filter(Boolean)).subscribe(() => {
        (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(false);
        service.logout({
          localOnly: true,
        });
      });
    });
  });

  describe('The `idTokenClaims` observable', () => {
    it('should get the ID token claims if authenticated', (done) => {
      const claims: IdToken = {
        __raw: 'idToken',
        exp: 1602887231,
        iat: 1602883631,
        iss: 'https://one.eartho.io/',
      };

      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);
      (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo(claims);

      service.idTokenClaims$.subscribe((value) => {
        expect(value).toBe(claims);
        done();
      });
    });

    it('should update the ID token claims if a new token is requested', (done) => {
      const claims: IdToken = {
        __raw: 'idToken',
        exp: 1602887231,
        iat: 1602883631,
        iss: 'https://one.eartho.io/',
      };

      const claims2: IdToken = {
        __raw: 'another_idToken',
        exp: 1613108744,
        iat: 1613105547,
        iss: 'https://one.eartho.io/',
      };

      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);
      (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo(claims);

      service.idTokenClaims$.pipe(bufferCount(2)).subscribe((values) => {
        expect(values[0]).toBe(claims);
        expect(values[1]).toBe(claims2);
        done();
      });

      // Add a small delay before triggering a new emit to the idTokenClaims$.
      // This ensures we can capture both emits using the above bufferCount(2)
      setTimeout(() => {
        (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo({});
        (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo(claims2);

        service.connectSilently().subscribe();
      }, 0);
    });

    it('should return null when logged out', (done) => {
      const claims: IdToken = {
        __raw: 'idToken',
        exp: 1602887231,
        iat: 1602883631,
        iss: 'https://one.eartho.io/',
      };

      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);
      (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo(claims);

      service.idTokenClaims$.pipe(bufferCount(2)).subscribe((values) => {
        expect(values[0]).toBe(claims);
        expect(values[1]).toBe(null);
        done();
      });

      service.isConnected$.pipe(filter(Boolean)).subscribe(() => {
        (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(false);
        service.logout({
          localOnly: true,
        });
      });
    });
  });

  describe('when handling the redirect callback', () => {
    let navigator: AbstractNavigator;

    beforeEach(() => {
      TestBed.resetTestingModule();

      navigator = jasmine.createSpyObj('RouteNavigator', {
        navigateByUrl: Promise.resolve(true),
      }) as any;

      TestBed.configureTestingModule({
        ...moduleSetup,
        providers: [
          {
            provide: AbstractNavigator,
            useValue: navigator,
          },
          {
            provide: EarthoOneService,
            useValue: earthoOneClient,
          },
          {
            provide: AuthConfigService,
            useValue: authConfig,
          },
        ],
      });

      window.history.replaceState(null, '', '?code=123&state=456');
    });

    it('should handle the callback when code and state are available', (done) => {
      const localService = createService();

      loaded(localService).subscribe(() => {
        expect(earthoOneClient.handleRedirectCallback).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should not handle the callback when skipRedirectCallback is true', (done) => {
      authConfig.skipRedirectCallback = true;

      const localService = createService();

      loaded(localService).subscribe(() => {
        expect(earthoOneClient.handleRedirectCallback).not.toHaveBeenCalled();
        done();
      });
    });

    it('should redirect to the correct route', (done) => {
      const localService = createService();

      loaded(localService).subscribe(() => {
        expect(navigator.navigateByUrl).toHaveBeenCalledWith('/');
        done();
      });
    });

    it('should redirect to the route specified in appState', (done) => {
      (earthoOneClient.handleRedirectCallback as jasmine.Spy).and.resolveTo({
        appState: {
          target: '/test-route',
        },
      });

      const localService = createService();

      loaded(localService).subscribe(() => {
        expect(navigator.navigateByUrl).toHaveBeenCalledWith('/test-route');
        done();
      });
    });

    it('should fallback to `/` when missing appState', (done) => {
      (earthoOneClient.handleRedirectCallback as jasmine.Spy).and.resolveTo({});

      const localService = createService();

      loaded(localService).subscribe(() => {
        expect(navigator.navigateByUrl).toHaveBeenCalledWith('/');
        done();
      });
    });

    it('should fallback to `/` when handleRedirectCallback returns undefined', (done) => {
      (earthoOneClient.handleRedirectCallback as jasmine.Spy).and.resolveTo(
        undefined
      );

      const localService = createService();

      loaded(localService).subscribe(() => {
        expect(navigator.navigateByUrl).toHaveBeenCalledWith('/');
        done();
      });
    });

    it('should record the appState in the appState$ observable if it is present', (done) => {
      const appState = {
        myValue: 'State to Preserve',
      };

      (earthoOneClient.handleRedirectCallback as jasmine.Spy).and.resolveTo({
        appState,
      });

      const localService = createService();

      localService.appState$.subscribe((recievedState) => {
        expect(recievedState).toEqual(appState);
        done();
      });
    });

    it('should record errors in the error$ observable', (done) => {
      const errorObj = new Error('An error has occured');

      (earthoOneClient.handleRedirectCallback as jasmine.Spy).and.throwError(
        errorObj
      );

      const localService = createService();

      loaded(localService).subscribe(() => {
        localService.error$.subscribe((err: Error) => {
          expect(err).toBe(errorObj);
          expect(navigator.navigateByUrl).toHaveBeenCalledWith('/');
          done();
        });
      });
    });

    it('should redirect to errorPath when an error occured in handleRedirectCallback', (done) => {
      const errorObj = new Error('An error has occured');

      authConfig.errorPath = '/error';
      (earthoOneClient.handleRedirectCallback as jasmine.Spy).and.throwError(
        errorObj
      );

      const localService = createService();

      loaded(localService).subscribe(() => {
        expect(navigator.navigateByUrl).toHaveBeenCalledWith('/error');
        done();
      });
    });

    it('should process the callback when an error appears in the query string', (done) => {
      window.history.replaceState(
        null,
        '',
        `?error=${encodeURIComponent('This is an error')}&state=456`
      );

      const localService = createService();

      loaded(localService).subscribe(() => {
        expect(earthoOneClient.handleRedirectCallback).toHaveBeenCalled();
        done();
      });
    });
  });

  it('should call `connectWithRedirect`', async () => {
    await service.connectWithRedirect().toPromise();
    expect(earthoOneClient.connectWithRedirect).toHaveBeenCalled();
  });

  it('should call `connectWithRedirect` and pass options', async () => {
    const options = { redirect_uri: 'http://localhost:3001' };

    await service.connectWithRedirect(options).toPromise();
    expect(earthoOneClient.connectWithRedirect).toHaveBeenCalledWith(options);
  });

  it('should call `connectWithPopup`', (done) => {
    loaded(service).subscribe(() => {
      (earthoOneClient.isConnected as jasmine.Spy).calls.reset();
      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);

      service.connectWithPopup();

      service.isConnected$.subscribe((authenticated) => {
        if (authenticated) {
          expect(earthoOneClient.connectWithPopup).toHaveBeenCalled();
          expect(earthoOneClient.isConnected).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  it('should call `connectWithPopup` with options', (done) => {
    // These objects are empty, as we just want to check that the
    // same object reference was passed through than any specific options.
    const options = {};
    const config = {};

    loaded(service).subscribe(() => {
      (earthoOneClient.isConnected as jasmine.Spy).calls.reset();
      (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true);

      service.connectWithPopup(options, config);

      service.isConnected$.subscribe((authenticated) => {
        if (authenticated) {
          expect(earthoOneClient.connectWithPopup).toHaveBeenCalledWith(
            options,
            config
          );
          done();
        }
      });
    });
  });

  it('should call `logout`', () => {
    service.logout();
    expect(earthoOneClient.logout).toHaveBeenCalled();
  });

  it('should call `logout` with options', () => {
    const options = { returnTo: 'http://localhost' };
    service.logout(options);
    expect(earthoOneClient.logout).toHaveBeenCalledWith(options);
  });

  it('should reset the authentication state when passing `localOnly` to logout', (done) => {
    const options = { localOnly: true };

    service.isConnected$.subscribe((authenticated) => {
      expect(authenticated).toBeFalse();
      done();
    });

    service.logout(options);
  });

  describe('connectSilently', () => {
    it('should call the underlying SDK', (done) => {
      service.connectSilently().subscribe((token) => {
        expect(earthoOneClient.getIdToken).toHaveBeenCalled();
        done();
      });
    });

    it('should call the underlying SDK and pass along the options', (done) => {
      // Empty object here just to test the object reference
      const options = {};

      service.connectSilently(options).subscribe((token) => {
        expect(earthoOneClient.getIdToken).toHaveBeenCalledWith(options);
        done();
      });
    });

    it('should get the full token response when detailedResponse is true', (done) => {
      const tokenResponse = {
        access_token: '123',
        id_token: '456',
        expires_in: 2,
      };
      (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo(tokenResponse);

      service.connectSilently({ detailedResponse: true }).subscribe((token) => {
        expect(token).toEqual(tokenResponse);
        done();
      });
    });

    it('should record errors in the error$ observable', (done) => {
      const errorObj = new Error('An error has occured');

      (earthoOneClient.getIdToken as jasmine.Spy).and.rejectWith(errorObj);

      service.connectSilently().subscribe({
        error: () => {},
      });

      service.error$.subscribe((err: Error) => {
        expect(err).toBe(errorObj);
        done();
      });
    });

    it('should bubble errors', (done) => {
      const errorObj = new Error('An error has occured');

      (earthoOneClient.getIdToken as jasmine.Spy).and.rejectWith(errorObj);

      service.connectSilently().subscribe({
        error: (err: Error) => {
          expect(err).toBe(errorObj);
          done();
        },
      });
    });
  });

  describe('getAccessTokenWithPopup', () => {
    it('should call the underlying SDK', (done) => {
      service.getAccessTokenWithPopup().subscribe((token) => {
        expect(earthoOneClient.getTokenWithPopup).toHaveBeenCalled();
        done();
      });
    });

    it('should call the underlying SDK and pass along the options', (done) => {
      // Empty object just to test reference
      const options = {};

      service.getAccessTokenWithPopup(options).subscribe((token) => {
        expect(earthoOneClient.getTokenWithPopup).toHaveBeenCalledWith(options);
        done();
      });
    });

    it('should record errors in the error$ observable', (done) => {
      const errorObj = new Error('An error has occured');

      (earthoOneClient.getTokenWithPopup as jasmine.Spy).and.rejectWith(
        errorObj
      );

      service.getAccessTokenWithPopup().subscribe({
        error: () => {},
      });

      service.error$.subscribe((err: Error) => {
        expect(err).toBe(errorObj);
        done();
      });
    });

    it('should bubble errors', (done) => {
      const errorObj = new Error('An error has occured');

      (earthoOneClient.getTokenWithPopup as jasmine.Spy).and.rejectWith(
        errorObj
      );

      service.getAccessTokenWithPopup().subscribe({
        error: (err: Error) => {
          expect(err).toBe(errorObj);
          done();
        },
      });
    });
  });

  describe('getUser', () => {
    it('should call `getUser`', async () => {
      await service.getUser().toPromise();
      expect(earthoOneClient.getUser).toHaveBeenCalled();
    });

    it('should call `getUser` and pass options', async () => {
      const options = { audience: 'http://localhost:3001' };

      await service.getUser(options).toPromise();
      expect(earthoOneClient.getUser).toHaveBeenCalledWith(options);
    });

    it('should return the user from `getUser`', async () => {
      const options = { audience: 'http://localhost:3001' };
      const expected = { name: 'John Doe' };
      (earthoOneClient.getUser as jasmine.Spy).and.resolveTo(expected);

      const user = await service.getUser(options).toPromise();
      expect(user).toBe(expected);
    });
  });

  describe('getIdToken', () => {
    it('should call `getIdToken`', async () => {
      await service.getIdToken().toPromise();
      expect(earthoOneClient.getIdToken).toHaveBeenCalled();
    });

    it('should call `getIdToken` and pass options', async () => {
      const options = { audience: 'http://localhost:3001' };

      await service.getIdToken(options).toPromise();
      expect(earthoOneClient.getIdToken).toHaveBeenCalledWith(options);
    });

    it('should return the claims from `getIdToken`', async () => {
      const options = { audience: 'http://localhost:3001' };
      const expected = { __raw: '', name: 'John Doe' };
      (earthoOneClient.getIdToken as jasmine.Spy).and.resolveTo(expected);

      const claims = await service.getIdToken(options).toPromise();
      expect(claims).toBe(expected);
    });
  });

  describe('handleRedirectCallback', () => {
    let navigator: AbstractNavigator;

    beforeEach(() => {
      TestBed.resetTestingModule();

      navigator = jasmine.createSpyObj('RouteNavigator', {
        navigateByUrl: Promise.resolve(true),
      }) as any;

      TestBed.configureTestingModule({
        ...moduleSetup,
        providers: [
          {
            provide: AbstractNavigator,
            useValue: navigator,
          },
          {
            provide: EarthoOneService,
            useValue: earthoOneClient,
          },
          {
            provide: AuthConfigService,
            useValue: {
              ...authConfig,
              skipRedirectCallback: true,
            },
          },
        ],
      });

      window.history.replaceState(null, '', '');
    });

    it('should call the underlying SDK', (done) => {
      const localService = createService();

      localService.handleRedirectCallback().subscribe(() => {
        expect(earthoOneClient.handleRedirectCallback).toHaveBeenCalled();
        done();
      });
    });

    it('should call the underlying SDK and pass options', (done) => {
      const url = 'http://localhost';
      const localService = createService();

      localService.handleRedirectCallback(url).subscribe(() => {
        expect(earthoOneClient.handleRedirectCallback).toHaveBeenCalledWith(
          url
        );
        done();
      });
    });

    it('should refresh the internal state', (done) => {
      const localService = createService();

      localService.isConnected$
        .pipe(bufferCount(2))
        .subscribe((authenticatedStates) => {
          expect(authenticatedStates).toEqual([false, true]);
          expect(earthoOneClient.isConnected).toHaveBeenCalled();
          done();
        });

      localService.isLoading$
        .pipe(
          filter((isLoading) => !isLoading),
          tap(() =>
            (earthoOneClient.isConnected as jasmine.Spy).and.resolveTo(true)
          ),
          mergeMap(() => localService.handleRedirectCallback())
        )
        .subscribe();
    });

    it('should record the appState in the appState$ observable if it is present', (done) => {
      const appState = {
        myValue: 'State to Preserve',
      };

      (earthoOneClient.handleRedirectCallback as jasmine.Spy).and.resolveTo({
        appState,
      });

      const localService = createService();
      localService.handleRedirectCallback().subscribe(() => {
        localService.appState$.subscribe((recievedState) => {
          expect(recievedState).toEqual(appState);
          done();
        });
      });
    });
  });

  describe('buildAuthorizeUrl', () => {
    it('should call the underlying SDK', (done) => {
      const options: RedirectConnectOptions = {};

      service.buildAuthorizeUrl(options).subscribe((url) => {
        expect(url).toBeTruthy();
        expect(earthoOneClient.buildAuthorizeUrl).toHaveBeenCalledWith(options);
        done();
      });
    });
  });

  describe('buildLogoutUrl', () => {
    it('should call the underlying SDK', (done) => {
      const options: LogoutUrlOptions = {};

      service.buildLogoutUrl(options).subscribe((url) => {
        expect(url).toBeTruthy();
        expect(earthoOneClient.buildLogoutUrl).toHaveBeenCalledWith(options);
        done();
      });
    });
  });
});
