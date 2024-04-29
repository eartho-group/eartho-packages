import * as esCookie from 'es-cookie';
import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expectToHaveBeenCalledWithEarthoOneParam } from '../helpers';
import { TEST_EARTHO_CLIENT_QUERY_STRING } from '../constants';
import { expect } from '@jest/globals';

// @ts-ignore
import { connectWithRedirectFn, setupFn } from './helpers';
import { TEST_CLIENT_ID, TEST_CODE_CHALLENGE, TEST_DOMAIN } from '../constants';
import { InMemoryAsyncCacheNoKeys } from '../cache/shared';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;
const connectWithRedirect = connectWithRedirectFn(mockWindow, mockFetch);

jest
  .spyOn(utils, 'bufferToBase64UrlEncoded')
  .mockReturnValue(TEST_CODE_CHALLENGE);

jest.spyOn(utils, 'runPopup');

const setup = setupFn(mockVerify);

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

  describe('logout()', () => {
    it('removes authenticated cookie from storage', async () => {
      const eartho = setup();
      await eartho.logout();

      expect(esCookie.remove).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.is.authenticated`,
        {}
      );
    });

    it('removes authenticated cookie from storage when cookieDomain is set', async () => {
      const eartho = setup({ cookieDomain: TEST_DOMAIN });
      await eartho.logout();

      expect(esCookie.remove).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.is.authenticated`,
        { domain: TEST_DOMAIN }
      );
    });

    it('removes the organization hint cookie from storage', async () => {
      const eartho = setup();
      await eartho.logout();

      expect(esCookie.remove).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.organization_hint`,
        {}
      );
    });

    it('calls `window.location.assign` with the correct url', async () => {
      const eartho = setup();

      await eartho.logout();

      expect(window.location.assign).toHaveBeenCalledWith(
        `https://${TEST_DOMAIN}/logout?client_id=${TEST_CLIENT_ID}${TEST_EARTHO_CLIENT_QUERY_STRING}`
      );
    });

    it('calls `window.location.assign` with the correct url when `options.federated` is true', async () => {
      const eartho = setup();

      await eartho.logout({ logoutParams: { federated: true } });

      expect(window.location.assign).toHaveBeenCalledWith(
        `https://${TEST_DOMAIN}/logout?client_id=${TEST_CLIENT_ID}${TEST_EARTHO_CLIENT_QUERY_STRING}&federated`
      );
    });

    it('calls `window.location.assign` with the correct url with custom `options.earthoOneClient`', async () => {
      const earthoOneClient = { name: '__test_client_name__', version: '9.9.9' };
      const eartho = setup({ earthoOneClient });

      await eartho.logout();

      expectToHaveBeenCalledWithEarthoOneParam(
        window.location.assign,
        earthoOneClient
      );
    });

    it('clears the cache for the global clientId', async () => {
      const eartho = setup();

      jest
        .spyOn(eartho['cacheManager'], 'clear')
        .mockReturnValueOnce(Promise.resolve());

      await eartho.logout();

      expect(eartho['cacheManager']['clear']).toHaveBeenCalledWith(
        TEST_CLIENT_ID
      );
    });

    it('clears the cache for the provided clientId', async () => {
      const eartho = setup();

      jest
        .spyOn(eartho['cacheManager'], 'clear')
        .mockReturnValueOnce(Promise.resolve());

      await eartho.logout({ clientId: 'client_123' });

      expect(eartho['cacheManager']['clear']).toHaveBeenCalledWith('client_123');
      expect(eartho['cacheManager']['clear']).not.toHaveBeenCalledWith(
        TEST_CLIENT_ID
      );
    });

    it('clears the cache for all client ids', async () => {
      const eartho = setup();

      jest
        .spyOn(eartho['cacheManager'], 'clear')
        .mockReturnValueOnce(Promise.resolve());

      await eartho.logout({ clientId: null });

      expect(eartho['cacheManager']['clear']).toHaveBeenCalled();
      expect(eartho['cacheManager']['clear']).not.toHaveBeenCalledWith(
        TEST_CLIENT_ID
      );
    });

    it('removes authenticated cookie from storage when `options.onRedirect` is set', async () => {
      const eartho = setup();

      await eartho.logout({ onRedirect: async () => {} });

      expect(esCookie.remove).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.is.authenticated`,
        {}
      );
    });

    it('removes authenticated cookie from storage when `options.openUrl` is set', async () => {
      const eartho = setup();

      await eartho.logout({ openUrl: async () => {} });

      expect(esCookie.remove).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.is.authenticated`,
        {}
      );
    });

    it('removes the organization hint cookie from storage when `options.openUrl` is set', async () => {
      const eartho = setup();

      await eartho.logout({ openUrl: async () => {} });

      expect(esCookie.remove).toHaveBeenCalledWith(
        `eartho.${TEST_CLIENT_ID}.organization_hint`,
        {}
      );
    });

    it('skips `window.location.assign` when `options.onRedirect` is provided', async () => {
      const eartho = setup();
      const onRedirect = jest.fn();
      await eartho.logout({ onRedirect });

      expect(window.location.assign).not.toHaveBeenCalled();
      expect(onRedirect).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://eartho_domain/logout?client_id=eartho_client_id'
        )
      );
    });

    it('skips `window.location.assign` when `options.openUrl` is provided', async () => {
      const eartho = setup();
      const openUrl = jest.fn();
      await eartho.logout({ openUrl });

      expect(window.location.assign).not.toHaveBeenCalled();
      expect(openUrl).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://eartho_domain/logout?client_id=eartho_client_id'
        )
      );
    });

    it('calls `window.location.assign` when `options.onRedirect` is not provided', async () => {
      const eartho = setup();

      await eartho.logout();
      expect(window.location.assign).toHaveBeenCalled();
    });

    it('calls `window.location.assign` when `options.openUrl` is not provided', async () => {
      const eartho = setup();

      await eartho.logout();
      expect(window.location.assign).toHaveBeenCalled();
    });

    it('can access isConnected immediately after local logout', async () => {
      const eartho = setup();

      await connectWithRedirect(eartho);
      expect(await eartho.isConnected()).toBe(true);
      await eartho.logout({ onRedirect: async () => {} });

      expect(await eartho.isConnected()).toBe(false);
    });

    it('can access isConnected immediately after local logout', async () => {
      const eartho = setup();

      await connectWithRedirect(eartho);
      expect(await eartho.isConnected()).toBe(true);
      await eartho.logout({ openUrl: async () => {} });

      expect(await eartho.isConnected()).toBe(false);
    });

    it('can access isConnected immediately after local logout when using a custom async cache', async () => {
      const eartho = setup({
        cache: new InMemoryAsyncCacheNoKeys()
      });

      await connectWithRedirect(eartho);
      expect(await eartho.isConnected()).toBe(true);
      await eartho.logout({ onRedirect: async () => {} });

      expect(await eartho.isConnected()).toBe(false);
    });

    it('can access isConnected immediately after local logout when using a custom async cache - using openUrl', async () => {
      const eartho = setup({
        cache: new InMemoryAsyncCacheNoKeys()
      });

      await connectWithRedirect(eartho);
      expect(await eartho.isConnected()).toBe(true);
      await eartho.logout({ openUrl: async () => {} });

      expect(await eartho.isConnected()).toBe(false);
    });

    it('can access isConnected immediately after local logout when using a custom async cache', async () => {
      const eartho = setup({
        cache: new InMemoryAsyncCacheNoKeys()
      });

      await connectWithRedirect(eartho);
      expect(await eartho.isConnected()).toBe(true);
      await eartho.logout({ onRedirect: async () => {} });

      expect(await eartho.isConnected()).toBe(false);
    });

    it('can access isConnected immediately after local logout when using a custom async cache - using openUrl', async () => {
      const eartho = setup({
        cache: new InMemoryAsyncCacheNoKeys()
      });

      await connectWithRedirect(eartho);
      expect(await eartho.isConnected()).toBe(true);
      await eartho.logout({ openUrl: async () => {} });

      expect(await eartho.isConnected()).toBe(false);
    });

    it('correctly handles a null clientId value', async () => {
      const eartho = setup();
      await eartho.logout({ clientId: null });

      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('https://eartho_domain/logout')
      );

      expect(window.location.assign).toHaveBeenCalledWith(
        expect.not.stringContaining('client_id')
      );
    });

    it('correctly handles a different clientId value', async () => {
      const eartho = setup();
      await eartho.logout({ clientId: 'my-client-id' });

      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://eartho_domain/logout?client_id=my-client-id'
        )
      );
    });
  });
});
