import * as esCookie from 'es-cookie';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expect } from '@jest/globals';

import {
  expectToHaveBeenCalledWithEarthoOneParam,
  expectToHaveBeenCalledWithHash
} from '../helpers';

// @ts-ignore

import {
  assertPostFn,
  assertUrlEquals,
  connectWithRedirectFn,
  setupFn
} from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_CODE_CHALLENGE,
  TEST_CODE_VERIFIER,
  TEST_DOMAIN,
  TEST_ID_TOKEN,
  TEST_NONCE,
  TEST_ORG_ID,
  TEST_REDIRECT_URI,
  TEST_SCOPES,
  TEST_STATE
} from '../constants';
import version from '../../src/version';

jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;
const mockCookies = require('es-cookie');
const tokenVerifier = require('../../src/jwt').verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const assertPost = assertPostFn(mockFetch);
const setup = setupFn(mockVerify);
const connectWithRedirect = connectWithRedirectFn(mockWindow, mockFetch);

describe('EarthoOne', () => {
  const oldWindowLocation = window.location;

  beforeEach(() => {
    jest.spyOn(mockCookies, 'get');
    jest.spyOn(mockCookies, 'set');
    jest.spyOn(mockCookies, 'remove');
    // https://www.benmvp.com/blog/mocking-window-location-methods-jest-jsdom/
    delete window.location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(oldWindowLocation),
        assign: {
          configurable: true,
          value: jest.fn()
        },
        replace: {
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

  describe('connectWithRedirect', () => {
    it('should log the user in and get the token when not using useFormData', async () => {
      const eartho = setup({
        useFormData: false
      });

      await connectWithRedirect(eartho);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        client_id: TEST_CLIENT_ID,
        redirect_uri: TEST_REDIRECT_URI,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256'
      });

      assertPost(
        'https://eartho_domain/access/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: TEST_CODE
        },
        {
          'Eartho-Client': btoa(
            JSON.stringify({
              name: 'one-client-js',
              version: version
            })
          )
        }
      );
    });

    it('should log the user in and get the token', async () => {
      const eartho = setup();

      await connectWithRedirect(eartho);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        client_id: TEST_CLIENT_ID,
        redirect_uri: TEST_REDIRECT_URI,
        scope: TEST_SCOPES,
        response_type: 'code',
        response_mode: 'query',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256'
      });

      assertPost(
        'https://eartho_domain/access/oauth/token',
        {
          redirect_uri: TEST_REDIRECT_URI,
          client_id: TEST_CLIENT_ID,
          code_verifier: TEST_CODE_VERIFIER,
          grant_type: 'authorization_code',
          code: TEST_CODE
        },
        {
          'Eartho-Client': btoa(
            JSON.stringify({
              name: 'one-client-js',
              version: version
            })
          )
        },
        undefined,
        false
      );
    });

    it('should log the user in using different default scope', async () => {
      const eartho = setup({
        authorizationParams: {
          scope: 'email'
        }
      });

      await connectWithRedirect(eartho);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          scope: 'openid email'
        },
        false
      );
    });

    it('should log the user in using different default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';

      const eartho = setup({
        authorizationParams: {
          redirect_uri
        }
      });

      await connectWithRedirect(eartho);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

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

    it('should log the user in when overriding default redirect_uri', async () => {
      const redirect_uri = 'https://custom-redirect-uri/callback';

      const eartho = setup({
        authorizationParams: {
          redirect_uri
        }
      });

      await connectWithRedirect(eartho, {
        authorizationParams: {
          redirect_uri: 'https://my-redirect-uri/callback'
        }
      });

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          redirect_uri: 'https://my-redirect-uri/callback'
        },
        false
      );
    });

    it('should log the user in by calling window.location.replace when specifying it as onRedirect', async () => {
      const eartho = setup();

      await connectWithRedirect(eartho, {
        authorizationParams: {
          audience: 'test_audience'
        },
        onRedirect: async url => window.location.replace(url)
      });

      const url = new URL(mockWindow.location.replace.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          audience: 'test_audience'
        },
        false
      );
    });

    it('should log the user in by calling window.location.replace when specifying it as openUrl', async () => {
      const eartho = setup();

      await connectWithRedirect(eartho, {
        authorizationParams: {
          audience: 'test_audience'
        },
        openUrl: async url => window.location.replace(url)
      });

      const url = new URL(mockWindow.location.replace.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          audience: 'test_audience'
        },
        false
      );
    });

    it('skips `window.location.assign` when `options.openUrl` is provided', async () => {
      const eartho = setup();

      await connectWithRedirect(eartho, {
        authorizationParams: {
          audience: 'test_audience'
        },
        openUrl: async () => {}
      });

      expect(window.location.assign).not.toHaveBeenCalled();
    });

    it('should log the user in with custom params', async () => {
      const eartho = setup();

      await connectWithRedirect(eartho, {
        authorizationParams: {
          audience: 'test_audience'
        }
      });

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(
        url,
        TEST_DOMAIN,
        '/authorize',
        {
          audience: 'test_audience'
        },
        false
      );
    });

    it('should log the user in using offline_access when using refresh tokens', async () => {
      const eartho = setup({
        useRefreshTokens: true
      });

      await connectWithRedirect(eartho);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

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

    it('should log the user in and get the user', async () => {
      const eartho = setup({ authorizationParams: { scope: 'foo' } });
      await connectWithRedirect(eartho);

      const expectedUser = { sub: 'me' };

      expect(await eartho.getUser()).toEqual(expectedUser);
    });

    it('should log the user in and get the user with custom scope', async () => {
      const eartho = setup({
        authorizationParams: {
          scope: 'scope2 scope1'
        }
      });

      await connectWithRedirect(eartho, {
        authorizationParams: { scope: 'scope3' }
      });

      const expectedUser = { sub: 'me' };

      expect(await eartho.getUser()).toEqual(expectedUser);
    });

    it('should log the user in with custom earthoOneClient', async () => {
      const earthoOneClient = { name: '__test_client__', version: '0.0.0' };
      const eartho = setup({ earthoOneClient });

      await connectWithRedirect(eartho);

      expectToHaveBeenCalledWithEarthoOneParam(
        mockWindow.location.assign,
        earthoOneClient
      );
    });

    it('should log the user in with custom fragment', async () => {
      const earthoOneClient = { name: '__test_client__', version: '0.0.0' };
      const eartho = setup({ earthoOneClient });
      await connectWithRedirect(eartho, { fragment: '/reset' });
      expectToHaveBeenCalledWithHash(mockWindow.location.assign, '#/reset');
    });

    it('uses session storage for transactions by default', async () => {
      const eartho = setup();
      await eartho.connectWithRedirect();

      expect((sessionStorage.setItem as jest.Mock).mock.calls[0][0]).toBe(
        `a0.spajs.txs.${TEST_CLIENT_ID}`
      );
    });

    it('uses cookie storage for transactions', async () => {
      const eartho = setup({ useCookiesForTransactions: true });

      await connectWithRedirect(eartho);

      // Don't necessarily need to check the contents of the cookie (the storage tests are doing that),
      // just that cookies were used when I set the correct option.
      expect((mockCookies.set as jest.Mock).mock.calls[1][0]).toEqual(
        `a0.spajs.txs.${TEST_CLIENT_ID}`
      );
    });

    it('should throw an error on token failure', async () => {
      const eartho = setup();

      await expect(
        connectWithRedirect(eartho, undefined, {
          token: {
            success: false
          }
        })
      ).rejects.toThrowError(
        'HTTP error. Unable to fetch https://eartho_domain/access/oauth/token'
      );
    });

    it('calls `tokenVerifier.verify` with the `id_token` from in the oauth/token response', async () => {
      const eartho = setup({
        issuer: 'test-123.eartho.com'
      });

      await connectWithRedirect(eartho);
      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'https://test-123.eartho.com/',
          id_token: TEST_ID_TOKEN
        })
      );
    });

    it('calls `tokenVerifier.verify` with the global organization', async () => {
      const eartho = setup({
        authorizationParams: { organization: 'org_123' }
      });

      await connectWithRedirect(eartho);

      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'org_123'
        })
      );
    });

    it('stores the organization in a hint cookie', async () => {
      const eartho = setup(
        { authorizationParams: { organization: TEST_ORG_ID } },
        { org_id: TEST_ORG_ID }
      );

      await connectWithRedirect(eartho);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.organization_hint`,
        JSON.stringify(TEST_ORG_ID),
        {
          expires: 1
        }
      );

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `_legacy_eartho.${TEST_CLIENT_ID}.organization_hint`,
        JSON.stringify(TEST_ORG_ID),
        {
          expires: 1
        }
      );
    });

    it('stores the organization in a hint cookie when no organization was set but a claim was found', async () => {
      const eartho = setup({}, { org_id: TEST_ORG_ID });

      await connectWithRedirect(eartho);

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.organization_hint`,
        JSON.stringify(TEST_ORG_ID),
        {
          expires: 1
        }
      );

      expect(<jest.Mock>esCookie.set).toHaveBeenCalledWith(
        `_legacy_eartho.${TEST_CLIENT_ID}.organization_hint`,
        JSON.stringify(TEST_ORG_ID),
        {
          expires: 1
        }
      );
    });

    it('removes the organization hint cookie if no organization specified', async () => {
      // TODO: WHAT IS ORG_NAME ?
      const eartho = setup({});

      await connectWithRedirect(eartho);

      expect(<jest.Mock>esCookie.remove).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.organization_hint`,
        {}
      );

      expect(<jest.Mock>esCookie.remove).toHaveBeenCalledWith(
        `_legacy_eartho.${TEST_CLIENT_ID}.organization_hint`,
        {}
      );
    });

    it('calls `tokenVerifier.verify` with the specific organization', async () => {
      const eartho = setup({
        authorizationParams: { organization: 'org_123' }
      });

      await connectWithRedirect(eartho, {
        authorizationParams: { organization: 'test_org_456' }
      });
      expect(tokenVerifier).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'test_org_456'
        })
      );
    });

    it('saves into cache', async () => {
      const eartho = setup();

      jest.spyOn(eartho['cacheManager'], 'set');

      await connectWithRedirect(eartho);

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

      await connectWithRedirect(eartho);

      expect(eartho['cacheManager']['setIdToken']).toHaveBeenCalledWith(
        TEST_CLIENT_ID,
        TEST_ID_TOKEN,
        mockDecodedToken
      );
    });

    it('saves `eartho.is.authenticated` key in storage', async () => {
      const eartho = setup();

      await connectWithRedirect(eartho);

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

    it('saves authenticated cookie key in storage for an extended period', async () => {
      const eartho = setup({
        sessionCheckExpiryDays: 2
      });

      await connectWithRedirect(eartho);

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

    it('should not include client options on the URL', async () => {
      // ** IMPORTANT **: if adding a new client option, ensure it is added to the destructure
      // list in EarthoOne._getParams so that it is not sent to the IdP
      const eartho = setup({
        useRefreshTokens: true,
        authorizationParams: {
          scope: 'openid profile email offline_access'
        },
        useCookiesForTransactions: true,
        authorizeTimeoutInSeconds: 10,
        cacheLocation: 'localstorage',
        legacySameSiteCookie: true,
        nowProvider: () => Date.now(),
        sessionCheckExpiryDays: 1
      });

      await connectWithRedirect(eartho);

      const url = new URL(mockWindow.location.assign.mock.calls[0][0]);

      assertUrlEquals(url, TEST_DOMAIN, '/authorize', {
        client_id: TEST_CLIENT_ID,
        redirect_uri: TEST_REDIRECT_URI,
        scope: 'openid profile email offline_access',
        response_type: 'code',
        response_mode: 'query',
        state: TEST_STATE,
        nonce: TEST_NONCE,
        code_challenge: TEST_CODE_CHALLENGE,
        code_challenge_method: 'S256'
      });
    });
  });
});
