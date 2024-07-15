import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import * as http from '../../src/http';
import { expect } from '@jest/globals';

// @ts-ignore

import {
  assertPostFn,
  fetchResponse,
  connectWithRedirectFn,
  setupFn
} from './helpers';

import {
  TEST_ACCESS_TOKEN,
  TEST_AUDIENCE,
  TEST_CLIENT_ID,
  TEST_CODE,
  TEST_CODE_CHALLENGE,
  TEST_CODE_VERIFIER,
  TEST_ENCODED_STATE,
  TEST_ID_TOKEN,
  TEST_NONCE,
  TEST_REDIRECT_URI,
  TEST_REFRESH_TOKEN,
  TEST_SCOPES
} from '../constants';

import { DEFAULT_EARTHO_CLIENT } from '../../src/constants';
import { GenericError } from '../../src';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');
jest.spyOn(http, 'switchFetch');

const setup = setupFn(mockVerify);
const connectWithRedirect = connectWithRedirectFn(mockWindow, mockFetch);

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

  describe('handleRedirectCallback', () => {
    it('should not attempt to log the user in with Object prototype properties as state', async () => {
      window.history.pushState({}, '', `/?code=foo&state=constructor`);

      const eartho = await setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      await expect(eartho.handleRedirectCallback()).rejects.toThrow(
        'Invalid state'
      );
    });

    it('should throw an error if the /authorize call redirects with an error param', async () => {
      const eartho = setup();
      let error;
      const appState = {
        key: 'property'
      };
      try {
        await connectWithRedirect(
          eartho,
          { appState },
          {
            authorize: {
              state: 'error-state',
              error: 'some-error',
              errorDescription: 'some-error-description'
            }
          }
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.error).toBe('some-error');
      expect(error.error_description).toBe('some-error-description');
      expect(error.state).toBe('error-state');
      expect(error.appState).toEqual(appState);
    });

    it('should clear the transaction data when the /authorize call redirects with a code param', async () => {
      const eartho = setup();

      jest.spyOn(eartho['transactionManager'], 'remove');
      await connectWithRedirect(eartho);
      expect(eartho['transactionManager'].remove).toHaveBeenCalled();
    });

    it('should clear the transaction data when the /authorize call redirects with an error param', async () => {
      const eartho = setup();
      let error;
      jest.spyOn(eartho['transactionManager'], 'remove');

      try {
        await connectWithRedirect(
          eartho,
          {},
          {
            authorize: {
              error: 'some-error'
            }
          }
        );
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(eartho['transactionManager'].remove).toHaveBeenCalled();
    });

    it('should throw an error if the /authorize call redirects with no params', async () => {
      const eartho = setup();
      let error;
      try {
        await connectWithRedirect(
          eartho,
          {},
          {
            authorize: {
              error: null,
              state: null,
              code: null
            }
          }
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(
        'There are no query params available for parsing.'
      );
    });

    it('should throw an error if there is no transaction', async () => {
      const eartho = setup();
      let error;

      try {
        await eartho.handleRedirectCallback('test?foo=bar');
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid state');
      expect(error.error).toBe('missing_transaction');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GenericError);
    });

    it('returns the transactions appState', async () => {
      const eartho = setup();

      const appState = {
        key: 'property'
      };

      const result = await connectWithRedirect(eartho, { appState });

      expect(result).toBeDefined();
      expect(result.appState).toEqual(appState);
    });

    it('uses the custom http timeout value if specified', async () => {
      const eartho = setup({ httpTimeoutInSeconds: 40 });

      const appState = {
        key: 'property'
      };

      const result = await connectWithRedirect(eartho, { appState });

      expect((http.switchFetch as jest.Mock).mock.calls[0][6]).toEqual(40000);
      expect(result).toBeDefined();
      expect(result.appState).toEqual(appState);
    });

    it('does not store the scope from token endpoint if none was returned', async () => {
      const eartho = setup();
      const cacheSetSpy = jest.spyOn(eartho['cacheManager'], 'set');

      const appState = {
        key: 'property'
      };

      await connectWithRedirect(eartho, { appState });

      expect(
        Object.keys(cacheSetSpy.mock.calls[0][0]).includes('oauthTokenScope')
      ).toBeFalsy();
    });

    it('stores the scope returned from the token endpoint in the cache', async () => {
      const eartho = setup();
      const cacheSetSpy = jest.spyOn(eartho['cacheManager'], 'set');

      const appState = {
        key: 'property'
      };

      await connectWithRedirect(
        eartho,
        { appState },
        { token: { response: { scope: 'openid profile email' } } }
      );

      expect(cacheSetSpy).toHaveBeenCalledWith(
        expect.objectContaining({ oauthTokenScope: 'openid profile email' })
      );
    });

    it('should fail with an error if the state in the transaction does not match the request', async () => {
      const eartho = setup();
      let error;

      try {
        await connectWithRedirect(
          eartho,
          {},
          {
            authorize: {
              state: 'random-state',
              code: 'TEST_CODE'
            }
          }
        );
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid state');
      expect(error.error).toBe('state_mismatch');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GenericError);
    });

    it('should not validate the state if there is no state in the transaction', async () => {
      const eartho = setup();

      mockFetch.mockResolvedValueOnce(
        fetchResponse(true, {
          id_token: TEST_ID_TOKEN,
          refresh_token: TEST_REFRESH_TOKEN,
          access_token: TEST_ACCESS_TOKEN,
          expires_in: 86400
        })
      );

      eartho['transactionManager'].create({
        audience: TEST_AUDIENCE,
        nonce: TEST_NONCE,
        scope: TEST_SCOPES,
        redirect_uri: TEST_REDIRECT_URI,
        code_verifier: TEST_CODE_VERIFIER
        // no state
      });

      // should not throw
      await eartho.handleRedirectCallback();
    });
  });

  it('calls oauth/token without redirect uri if not set in transaction when not using useFormData', async () => {
    window.history.pushState(
      {},
      'Test',
      `#/callback/?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
    );

    mockFetch.mockResolvedValueOnce(
      fetchResponse(true, {
        id_token: TEST_ID_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        expires_in: 86400
      })
    );

    const eartho = setup({
      useFormData: false
    });
    delete eartho['options']['authorizationParams']?.['redirect_uri'];

    await connectWithRedirect(eartho);

    expect(mockFetch.mock.calls[0][0]).toBe('https://eartho_domain/access/oauth/token');

    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchBody.redirect_uri).toBeUndefined();
  });

  it('calls oauth/token without redirect uri if not set in transaction', async () => {
    window.history.pushState(
      {},
      'Test',
      `#/callback/?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
    );

    mockFetch.mockResolvedValueOnce(
      fetchResponse(true, {
        id_token: TEST_ID_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        expires_in: 86400
      })
    );

    const eartho = setup();
    delete eartho['options']['authorizationParams']?.['redirect_uri'];

    await connectWithRedirect(eartho);

    assertPostFn(mockFetch)(
      'https://eartho_domain/access/oauth/token',
      {
        redirect_uri: undefined,
        client_id: TEST_CLIENT_ID,
        code_verifier: TEST_CODE_VERIFIER,
        grant_type: 'authorization_code',
        code: TEST_CODE
      },
      {
        'Eartho-Client': btoa(JSON.stringify(DEFAULT_EARTHO_CLIENT)),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      0,
      false
    );
  });

  it('calls oauth/token and uses form data if specified in the options', async () => {
    window.history.pushState(
      {},
      'Test',
      `#/callback/?code=${TEST_CODE}&state=${TEST_ENCODED_STATE}`
    );

    mockFetch.mockResolvedValueOnce(
      fetchResponse(true, {
        id_token: TEST_ID_TOKEN,
        refresh_token: TEST_REFRESH_TOKEN,
        access_token: TEST_ACCESS_TOKEN,
        expires_in: 86400
      })
    );

    const eartho = setup();

    await connectWithRedirect(eartho);

    assertPostFn(mockFetch)(
      'https://eartho_domain/access/oauth/token',
      {
        redirect_uri: TEST_REDIRECT_URI,
        client_id: TEST_CLIENT_ID,
        code_verifier: TEST_CODE_VERIFIER,
        grant_type: 'authorization_code',
        code: TEST_CODE
      },
      {
        'Eartho-Client': btoa(JSON.stringify(DEFAULT_EARTHO_CLIENT)),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      0,
      false
    );
  });

  describe('when there is a valid query string in a hash', () => {
    it('should throw an error if the /authorize call redirects with an error param', async () => {
      const eartho = setup();
      let error;
      const appState = {
        key: 'property'
      };
      try {
        await connectWithRedirect(
          eartho,
          { appState },
          {
            authorize: {
              state: 'error-state',
              error: 'some-error',
              errorDescription: 'some-error-description'
            },
            useHash: true
          }
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.error).toBe('some-error');
      expect(error.error_description).toBe('some-error-description');
      expect(error.state).toBe('error-state');
      expect(error.appState).toEqual(appState);
    });

    it('should clear the transaction data when the /authorize call redirects with a code param', async () => {
      const eartho = setup();

      jest.spyOn(eartho['transactionManager'], 'remove');
      await connectWithRedirect(
        eartho,
        {},
        {
          useHash: true
        }
      );

      expect(eartho['transactionManager'].remove).toHaveBeenCalled();
    });

    it('should clear the transaction data when the /authorize call redirects with an error param', async () => {
      const eartho = setup();
      let error;
      jest.spyOn(eartho['transactionManager'], 'remove');

      try {
        await connectWithRedirect(
          eartho,
          {},
          {
            authorize: {
              error: 'some-error'
            },
            useHash: true
          }
        );
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(eartho['transactionManager'].remove).toHaveBeenCalled();
    });

    it('should throw an error if the /authorize call redirects with no params', async () => {
      const eartho = setup();
      let error;
      try {
        await connectWithRedirect(
          eartho,
          {},
          {
            authorize: {
              state: null,
              code: null
            },
            useHash: true
          }
        );
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe(
        'There are no query params available for parsing.'
      );
    });
  });
});
