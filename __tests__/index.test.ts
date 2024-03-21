import { EarthoOneOptions } from '../src/global';
import * as scope from '../src/scope';
import { expect } from '@jest/globals';

// @ts-ignore

jest.mock('../src/jwt');
jest.mock('../src/transaction-manager');
jest.mock('../src/utils');
jest.mock('../src/api');

import { createEarthoOne, EarthoOne } from '../src/index';

import {
  TEST_ACCESS_TOKEN,
  TEST_ARRAY_BUFFER,
  TEST_BASE64_ENCODED_STRING,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_DOMAIN,
  TEST_ENCODED_STATE,
  TEST_ID_TOKEN,
  TEST_QUERY_PARAMS,
  TEST_RANDOM_STRING,
  TEST_USER_ID
} from './constants';
import { CookieStorage } from '../src/storage';

jest.mock('../src/worker/token.worker');

jest.mock('../src/storage', () => ({
  CookieStorageWithLegacySameSite: {
    get: jest.fn(),
    save: jest.fn(),
    remove: jest.fn()
  }
}));

const setup = async (
  clientOptions: Partial<EarthoOneOptions> = {},
  callConstructor = true
) => {
  const tokenVerifier = require('../src/jwt').verify;
  const utils = require('../src/utils');
  const api = require('../src/api');

  utils.createQueryParams.mockReturnValue(TEST_QUERY_PARAMS);
  utils.encode.mockReturnValue(TEST_ENCODED_STATE);
  utils.createRandomString.mockReturnValue(TEST_RANDOM_STRING);
  utils.sha256.mockReturnValue(Promise.resolve(TEST_ARRAY_BUFFER));
  utils.bufferToBase64UrlEncoded.mockReturnValue(TEST_BASE64_ENCODED_STRING);

  utils.parseAuthenticationResult.mockReturnValue({
    state: TEST_ENCODED_STATE,
    code: TEST_CODE
  });

  utils.runPopup.mockReturnValue(
    Promise.resolve({ state: TEST_ENCODED_STATE, code: TEST_CODE })
  );

  utils.runIframe.mockReturnValue(
    Promise.resolve({ state: TEST_ENCODED_STATE, code: TEST_CODE })
  );

  api.oauthToken.mockReturnValue(
    Promise.resolve({
      id_token: TEST_ID_TOKEN,
      access_token: TEST_ACCESS_TOKEN
    })
  );

  tokenVerifier.mockReturnValue({
    user: {
      sub: TEST_USER_ID
    },
    claims: {
      sub: TEST_USER_ID,
      aud: TEST_CLIENT_ID
    }
  });

  const popup = {
    location: { href: '' },
    close: jest.fn()
  };

  const eartho = callConstructor
    ? await createEarthoOne({
        domain: TEST_DOMAIN,
        clientId: TEST_CLIENT_ID,
        ...clientOptions
      })
    : undefined;

  const transactionManager =
    require('../src/transaction-manager').TransactionManager;

  return {
    eartho,
    cookieStorage: require('../src/storage').CookieStorageWithLegacySameSite,
    tokenVerifier,
    transactionManager,
    utils,
    popup,
    api
  };
};

describe('Eartho', () => {
  const oldWindowLocation = window.location;
  let getUniqueScopesSpy;

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

    window.Worker = jest.fn();

    (<any>global).crypto = {
      subtle: {
        digest: () => ''
      }
    };

    getUniqueScopesSpy = jest.spyOn(scope, 'getUniqueScopes');
  });

  afterEach(() => {
    jest.clearAllMocks();
    getUniqueScopesSpy.mockRestore();
    window.location = oldWindowLocation;

    const storage = require('../src/storage').CookieStorageWithLegacySameSite;
    storage.get.mockClear();
    storage.save.mockClear();
    storage.remove.mockClear();
  });

  describe('createEarthoOne()', () => {
    it('should create an Eartho client', async () => {
      const eartho = await createEarthoOne({
        domain: TEST_DOMAIN,
        clientId: TEST_CLIENT_ID
      });

      expect(eartho).toBeInstanceOf(EarthoOne);
    });

    it('should load token worker from provided URL when provided', async () => {
      const workerUrl = '/hosted/eartho.worker.js';

      await createEarthoOne({
        domain: TEST_DOMAIN,
        clientId: TEST_CLIENT_ID,
        useRefreshTokens: true,
        workerUrl,
      });

      expect(window.Worker).toHaveBeenCalledWith(workerUrl);
    });

    it('should call `utils.validateCrypto`', async () => {
      const { utils } = await setup();

      expect(utils.validateCrypto).toHaveBeenCalled();
    });

    it('should fail if an invalid cache location was given', async () => {
      await expect(
        createEarthoOne({
          domain: TEST_DOMAIN,
          clientId: TEST_CLIENT_ID,
          cacheLocation: 'dummy'
        } as any)
      ).rejects.toThrow(new Error('Invalid cache location "dummy"'));
    });

    it('should absorb "login_required" errors', async () => {
      const { utils, cookieStorage } = await setup();

      utils.runIframe.mockImplementation(() => {
        throw {
          error: 'login_required',
          error_message: 'Login required'
        };
      });

      cookieStorage.get.mockReturnValue(true);

      const eartho = await createEarthoOne({
        domain: TEST_DOMAIN,
        clientId: TEST_CLIENT_ID
      });

      expect(eartho).toBeInstanceOf(EarthoOne);
      expect(utils.runIframe).toHaveBeenCalled();
    });

    it('should absorb errors', async () => {
      const { utils, cookieStorage } = await setup();
      cookieStorage.get.mockReturnValue(true);
      const recoverableErrors = [
        'consent_required',
        'interaction_required',
        'account_selection_required',
        'access_denied',
        'some_other_error'
      ];
      for (let error of recoverableErrors) {
        utils.runIframe.mockClear();
        utils.runIframe.mockRejectedValue({ error });
        const eartho = await createEarthoOne({
          domain: TEST_DOMAIN,
          clientId: TEST_CLIENT_ID
        });
        expect(eartho).toBeInstanceOf(EarthoOne);
        expect(utils.runIframe).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('default creation function', () => {
    it('does nothing if there is nothing in storage', async () => {
      const { cookieStorage } = await setup(null, false);

      jest.spyOn(EarthoOne.prototype, 'getTokenSilently');
      cookieStorage.get.mockReturnValue(undefined);

      const eartho = await createEarthoOne({
        domain: TEST_DOMAIN,
        clientId: TEST_CLIENT_ID
      });

      expect(cookieStorage.get).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.is.authenticated`
      );

      expect(eartho.getTokenSilently).not.toHaveBeenCalled();
    });

    it('calls getTokenSilently if the authentication hint cookie is available`', async () => {
      EarthoOne.prototype.getTokenSilently = jest.fn();

      const { cookieStorage } = await setup(null, false);

      cookieStorage.get.mockReturnValue(true);

      const eartho = await createEarthoOne({
        domain: TEST_DOMAIN,
        clientId: TEST_CLIENT_ID
      });

      expect(eartho.getTokenSilently).toHaveBeenCalledWith(undefined);
    });

    describe('when refresh tokens are not used', () => {
      it('calls getTokenSilently', async () => {
        const { utils, cookieStorage } = await setup(null, false);

        const options = {
          audience: 'the-audience',
          scope: 'the-scope'
        };

        EarthoOne.prototype.getTokenSilently = jest.fn();

        cookieStorage.get.mockReturnValue(true);

        const eartho = await createEarthoOne({
          domain: TEST_DOMAIN,
          clientId: TEST_CLIENT_ID,
          ...options
        });

        expect(eartho.getTokenSilently).toHaveBeenCalledWith(undefined);
      });
    });

    describe('when refresh tokens are used', () => {
      it('creates the client with the correct scopes', async () => {
        const { cookieStorage } = await setup(null, false);

        const options = {
          authorizationParams: {
            audience: 'the-audience',
            scope: 'profile email the-scope'
          },
          useRefreshTokens: true
        };

        cookieStorage.get.mockReturnValue(true);

        EarthoOne.prototype.getTokenSilently = jest.fn();

        const eartho = await createEarthoOne({
          domain: TEST_DOMAIN,
          clientId: TEST_CLIENT_ID,
          ...options
        });

        expect((<any>eartho).scope).toBe(
          'openid profile email the-scope offline_access'
        );

        expect(eartho.getTokenSilently).toHaveBeenCalledWith(undefined);
      });
    });
  });
});
