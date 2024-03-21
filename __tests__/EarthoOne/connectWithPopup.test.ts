import * as esCookie from 'es-cookie';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import * as http from '../../src/http';
import { expect } from '@jest/globals';

import {
  assertPostFn,
  assertUrlEquals,
  connectWithPopupFn,
  setupFn
} from './helpers';

// @ts-ignore

import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE_CHALLENGE,
  TEST_CODE_VERIFIER,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_NONCE,
  TEST_ORG_ID,
  TEST_REDIRECT_URI,
  TEST_REFRESH_TOKEN,
  TEST_SCOPES,
  TEST_STATE
} from '../constants';

import {
  DEFAULT_EARTHO_CLIENT,
  DEFAULT_POPUP_CONFIG_OPTIONS
} from '../../src/constants';
import { GenericError } from '../../src/errors';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;
const tokenVerifier = require('../../src/jwt').verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');
jest.spyOn(http, 'switchFetch');

const assertPost = assertPostFn(mockFetch);

const setup = setupFn(mockVerify);
const connectWithPopup = connectWithPopupFn(mockWindow, mockFetch);

describe('EarthoOne', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    // https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
    delete window.location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: {
          configurable: true,
          value: jest.fn()
        }
      }
    ) as Location;
    // --

    mockWindow.open = jest.fn();
    mockWindow.addEventListener = jest.fn();

    mockWindow.crypto = {
      subtle: {
        digest: () => 'foo'
      },
      getRandomValues() {
        return '123';
      }
    };
    mockWindow.MessageChannel = MessageChannel;
    mockWindow.Worker = {};
    jest.spyOn(scope, 'getUniqueScopes');
    sessionStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
    window.location = oldWindowLocation;
  });

  describe('connectWithPopup', () => {
    it('should log the user in and get the user and claims', async () => {
      const eartho = setup({ authorizationParams: { scope: 'foo' } });

      mockWindow.open.mockReturnValue({ hello: 'world' });

      await connectWithPopup(eartho);

      const expectedUser = { sub: 'me' };

      expect(await eartho.getUser()).toEqual(expectedUser);
      expect(await eartho.getIdToken()).toBeTruthy();
    });

    it('should log the user in with custom scope', async () => {
      const eartho = setup({
        authorizationParams: {
          scope: 'scope2 scope1'
        }
      });
      await connectWithPopup(eartho, { authorizationParams: { scope: 'scope3' } });

      const expectedUser = { sub: 'me' };

      expect(await eartho.getUser()).toEqual(expectedUser);
    });

    it('encodes state with random string', async () => {
      const eartho = setup();

      await connectWithPopup(eartho);

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(
        url,
        'eartho_domain',
        '/authorize',
        {
          state: TEST_STATE,
          nonce: TEST_NONCE
        },
        false
      );
    });

    it('uses a custom timeout when making HTTP calls', async () => {
      const eartho = setup({ leeway: 10, httpTimeoutInSeconds: 60 });

      await connectWithPopup(eartho, {
        authorizationParams: {
          connection: 'test-connection',
          audience: 'test'
        }
      });

      expect(mockWindow.open).toHaveBeenCalled();

      expect((http.switchFetch as jest.Mock).mock.calls[0][6]).toEqual(60000);

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'web_message',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256',
        connection: 'test-connection',
        audience: 'test'
      });
    });

    it('creates `code_challenge` by using `utils.sha256` with the result of `utils.createRandomString`', async () => {
      const eartho = setup();

      await connectWithPopup(eartho);

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(
        url,
        'eartho_domain',
        '/authorize',
        {
          code_challenge: TEST_CODE_CHALLENGE,
          code_challenge_method: 'S256'
        },
        false
      );
    });

    it('should log the user in with a popup and redirect using a default redirect URI', async () => {
      const eartho = setup({
        leeway: 10,
        authorizationParams: { redirect_uri: undefined }
      });

      await connectWithPopup(eartho, {
        authorizationParams: {
          connection: 'test-connection',
          audience: 'test'
        }
      });

      expect(mockWindow.open).toHaveBeenCalled();

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(url, 'eartho_domain', '/authorize', {
        redirect_uri: 'http://localhost',
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'web_message',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256',
        connection: 'test-connection',
        audience: 'test'
      });
    });

    it('should log the user in with a popup and redirect', async () => {
      const eartho = setup({ leeway: 10 });

      await connectWithPopup(eartho, {
        authorizationParams: {
          connection: 'test-connection',
          audience: 'test'
        }
      });

      expect(mockWindow.open).toHaveBeenCalled();

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'web_message',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256',
        connection: 'test-connection',
        audience: 'test'
      });
    });

    it('should log the user in with a popup and redirect when using refresh tokens', async () => {
      const eartho = setup({
        useRefreshTokens: true
      });

      await connectWithPopup(eartho);

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          scope: `${TEST_SCOPES} offline_access`
        },
        false
      );
    });

    it('should log the user and redirect when using different default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';
      const eartho = setup({
        authorizationParams: {
          redirect_uri
        }
      });
      await connectWithPopup(eartho);

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          redirect_uri
        },
        false
      );
    });

    it('should log the user in with a popup and get the token', async () => {
      const eartho = setup({
        useFormData: false
      });

      await connectWithPopup(eartho);
      expect(mockWindow.open).toHaveBeenCalled();

      assertPost(
        'https://eartho_domain/access/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: 'my_code'
        },
        {
          'Eartho-Client': btoa(JSON.stringify(DEFAULT_EARTHO_CLIENT)),
          'Content-Type': 'application/json'
        }
      );
    });

    it('should log the user in with a popup and get the token with form data', async () => {
      const eartho = setup();

      await connectWithPopup(eartho);
      expect(mockWindow.open).toHaveBeenCalled();

      assertPost(
        'https://eartho_domain/access/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: 'my_code'
        },
        {
          'Eartho-Client': btoa(JSON.stringify(DEFAULT_EARTHO_CLIENT)),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        0,
        false
      );
    });

    it('uses default config', async () => {
      const eartho = setup({ leeway: 10 });

      await connectWithPopup(eartho);

      expect(utils.runPopup).toHaveBeenCalledWith({
        ...DEFAULT_POPUP_CONFIG_OPTIONS,
        popup: expect.anything()
      });
    });

    it('should be able to provide custom config', async () => {
      const eartho = setup({ leeway: 10 });

      await connectWithPopup(eartho, {}, { timeoutInSeconds: 3 });

      expect(utils.runPopup).toHaveBeenCalledWith({
        timeoutInSeconds: 3,
        popup: expect.anything()
      });
    });

    it('throws an error if not resolved before timeout', async () => {
      const eartho = setup({ leeway: 10 });

      await expect(
        connectWithPopup(eartho, {}, { timeoutInSeconds: 0.005 }, { delay: 10 })
      ).rejects.toThrowError('Timeout');
    });

    it('throws an error if no popup could be opened', async () => {
      const eartho = setup();

      // Use eartho.connectWithPopup directly here, which doesn't set up
      // windowMock and returns null by default (as opposed to using the `connectWithPopup` helper)
      await expect(eartho.connectWithPopup()).rejects.toThrowError(
        /unable to open a popup/i
      );
    });

    it('uses a custom popup specified in the configuration and redirect', async () => {
      const eartho = setup();
      const popup = {
        location: { href: '' },
        close: jest.fn()
      };

      await connectWithPopup(
        eartho,
        {
          authorizationParams: {
            connection: 'test-connection',
            audience: 'test'
          }
        },
        { popup }
      );

      expect(mockWindow.open).not.toHaveBeenCalled();
      assertUrlEquals(popup.location.href, TEST_DOMAIN, '/authorize', {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'web_message',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256',
        connection: 'test-connection',
        audience: 'test'
      });
    });

    it('uses a custom popup specified in the configuration and get a token', async () => {
      const eartho = setup({
        useFormData: false
      });
      const popup = {
        location: { href: '' },
        close: jest.fn()
      };

      await connectWithPopup(eartho, {}, { popup });

      expect(mockWindow.open).not.toHaveBeenCalled();
      assertPost(
        'https://eartho_domain/access/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: 'my_code'
        },
        {
          'Eartho-Client': btoa(JSON.stringify(DEFAULT_EARTHO_CLIENT))
        }
      );
    });

    it('opens popup with custom earthoOneClient', async () => {
      const earthoOneClient = { name: '__test_client_name__', version: '9.9.9' };
      const eartho = await setup({ earthoOneClient });

      await connectWithPopup(eartho);

      expect(mockWindow.open).toHaveBeenCalled();

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          earthoOneClient: btoa(JSON.stringify(earthoOneClient))
        },
        false
      );
    });

    it('throws error if state from popup response is different from the provided state', async () => {
      const eartho = setup();
      let error;

      try {
        await connectWithPopup(eartho, undefined, undefined, {
          authorize: {
            response: {
              state: 'other-state'
            }
          }
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid state');
      expect(error.error).toBe('state_mismatch');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GenericError);
    });

    it('calls `tokenVerifier.verify` with the `issuer` from in the oauth/token response', async () => {
      const eartho = setup({
        issuer: 'test-123.eartho.com'
      });

      await connectWithPopup(eartho);
      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'https://test-123.eartho.com/'
        })
      );
    });

    it('calls `tokenVerifier.verify` with the `leeway` from constructor', async () => {
      const eartho = setup({ leeway: 10 });

      await connectWithPopup(eartho);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          leeway: 10
        })
      );
    });

    it('calls `tokenVerifier.verify` with undefined `max_age` when value set in constructor is an empty string', async () => {
      const eartho = setup({ authorizationParams: { max_age: '' } });

      await connectWithPopup(eartho);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: undefined
        })
      );
    });

    it('calls `tokenVerifier.verify` with the parsed `max_age` string from constructor', async () => {
      const eartho = setup({ authorizationParams: { max_age: '10' } });

      await connectWithPopup(eartho);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: 10
        })
      );
    });

    it('calls `tokenVerifier.verify` with the parsed `max_age` number from constructor', async () => {
      const eartho = setup({ authorizationParams: { max_age: 10 } });

      await connectWithPopup(eartho);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          max_age: 10
        })
      );
    });

    it('calls `tokenVerifier.verify` with the organization', async () => {
      const eartho = setup({
        authorizationParams: { organization: 'org_123' }
      });

      await connectWithPopup(eartho);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'org_123'
        })
      );
    });

    it('calls `tokenVerifier.verify` with the organization given in the login method', async () => {
      const eartho = setup();
      await connectWithPopup(eartho, {
        authorizationParams: { organization: 'org_123' }
      });

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'org_123'
        })
      );
    });

    it('saves into cache', async () => {
      const eartho = setup();

      jest.spyOn(eartho['cacheManager'], 'set');

      await connectWithPopup(eartho);

      expect(eartho['cacheManager']['set']).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: TEST_CLIENT_ID,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400,
          audience: 'default',
          scope: TEST_SCOPES
        })
      );
    });

    it('saves user information into the cache', async () => {
      const eartho = setup();

      const mockDecodedToken = {
        claims: { sub: 'sub', aud: 'aus' },
        user: { sub: 'sub' }
      };
      tokenVerifier.mockReturnValue(mockDecodedToken);

      jest.spyOn(eartho['cacheManager'], 'setIdToken');

      await connectWithPopup(eartho);

      expect(eartho['cacheManager']['setIdToken']).toHaveBeenCalledWith(
        TEST_CLIENT_ID,
        TEST_ID_TOKEN,
        mockDecodedToken
      );
    });

    it('should not save refresh_token in memory cache', async () => {
      const eartho = setup({
        useRefreshTokens: true
      });

      jest.spyOn(eartho['cacheManager'], 'set');
      await connectWithPopup(eartho);

      expect(eartho['cacheManager']['set']).toHaveBeenCalled();

      expect(eartho['cacheManager']['set']).not.toHaveBeenCalledWith(
        expect.objectContaining({
          refresh_token: TEST_REFRESH_TOKEN
        })
      );
    });

    it('should save refresh_token in local storage cache', async () => {
      const eartho = setup({
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      jest.spyOn(eartho['cacheManager'], 'set');

      await connectWithPopup(eartho);

      expect(eartho['cacheManager']['set']).toHaveBeenCalledWith(
        expect.objectContaining({
          refresh_token: TEST_REFRESH_TOKEN
        })
      );
    });

    it('saves `eartho.is.authenticated` key in storage', async () => {
      const eartho = setup();

      await connectWithPopup(eartho);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `_legacy_eartho.${TEST_CLIENT_ID}.is.authenticated`,
        'true',
        {
          expires: 1
        }
      );

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.is.authenticated`,
        'true',
        {
          expires: 1
        }
      );
    });

    it('saves organization hint cookie in storage', async () => {
      const eartho = setup(
        {
          cookieDomain: TEST_DOMAIN,
          authorizationParams: { organization: TEST_ORG_ID }
        },
        { org_id: TEST_ORG_ID }
      );

      await connectWithPopup(eartho);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `_legacy_eartho.${TEST_CLIENT_ID}.organization_hint`,
        JSON.stringify(TEST_ORG_ID),
        {
          expires: 1,
          domain: TEST_DOMAIN
        }
      );

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.organization_hint`,
        JSON.stringify(TEST_ORG_ID),
        {
          expires: 1,
          domain: TEST_DOMAIN
        }
      );
    });

    it('removes the organization hint cookie if no org_id claim was returned in the ID token', async () => {
      const eartho = setup();

      await connectWithPopup(eartho);

      expect(<jest.Mock>esCookie.remove).toHaveBeenCalledWith(
        `_legacy_eartho.${TEST_CLIENT_ID}.organization_hint`,
        {}
      );

      expect(<jest.Mock>esCookie.remove).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.organization_hint`,
        {}
      );
    });

    it('saves `eartho.is.authenticated` key in storage for an extended period', async () => {
      const eartho = setup({
        sessionCheckExpiryDays: 2
      });

      await connectWithPopup(eartho);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `_legacy_eartho.${TEST_CLIENT_ID}.is.authenticated`,
        'true',
        {
          expires: 2
        }
      );
      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.is.authenticated`,
        'true',
        {
          expires: 2
        }
      );
    });

    it('should throw an error on token failure', async () => {
      const eartho = setup();

      await expect(
        connectWithPopup(eartho, {}, {}, { token: { success: false } })
      ).rejects.toThrowError(
        'HTTP error. Unable to fetch https://eartho_domain/access/oauth/token'
      );
    });

    it('should log the user and redirect when using different redirect_uri on connectWithPopup', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';
      const eartho = setup({
        authorizationParams: {
          redirect_uri: 'https://redirect-uri-on-ctor/callback'
        }
      });
      await connectWithPopup(eartho, {
        authorizationParams: {
          redirect_uri
        }
      });

      // prettier-ignore
      const url = (utils.runPopup as jest.Mock).mock.calls[0][0].popup.location.href;

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          redirect_uri
        },
        false
      );
    });
  });
});
