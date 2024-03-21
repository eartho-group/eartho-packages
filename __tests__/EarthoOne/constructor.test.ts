import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expect } from '@jest/globals';

// @ts-ignore

import { assertUrlEquals, connectWithRedirectFn, setupFn } from './helpers';

import { TEST_CLIENT_ID, TEST_CODE_CHALLENGE, TEST_DOMAIN } from '../constants';
import { ICache } from '../../src/cache';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;
const mockFetch = <jest.Mock>mockWindow.fetch;
const mockVerify = <jest.Mock>verify;

const mockCache: ICache = {
  set: jest.fn().mockResolvedValue(null),
  get: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockResolvedValue(null)
};

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

  describe('constructor', () => {
    it('automatically adds the offline_access scope during construction', () => {
      const eartho = setup({
        useRefreshTokens: true,
        authorizationParams: {
          scope: 'profile email test-scope'
        }
      });

      expect((<any>eartho).scope).toBe(
        'openid profile email test-scope offline_access'
      );
    });

    it('ensures the openid scope is defined when customizing default scopes', () => {
      const eartho = setup({
        authorizationParams: {
          scope: 'test-scope'
        }
      });

      expect((<any>eartho).scope).toBe('openid test-scope');
    });

    it('allows an empty custom default scope', () => {
      const eartho = setup({
        authorizationParams: {
          scope: null
        }
      });

      expect((<any>eartho).scope).toBe('openid');
    });

    it('should create issuer from domain', () => {
      const eartho = setup({
        domain: 'test.dev'
      });

      expect((<any>eartho).tokenIssuer).toEqual('https://test.dev/');
    });

    it('should allow issuer as a domain', () => {
      const eartho = setup({
        issuer: 'foo.bar.com'
      });

      expect((<any>eartho).tokenIssuer).toEqual('https://foo.bar.com/');
    });

    it('should allow issuer as a fully qualified url', () => {
      const eartho = setup({
        issuer: 'https://some.issuer.com/'
      });

      expect((<any>eartho).tokenIssuer).toEqual('https://some.issuer.com/');
    });

    it('should allow specifying domain with http scheme', () => {
      const eartho = setup({
        domain: 'http://localhost'
      });

      expect((<any>eartho).domainUrl).toEqual('http://localhost');
    });

    it('should allow specifying domain with https scheme', () => {
      const eartho = setup({
        domain: 'https://localhost'
      });

      expect((<any>eartho).domainUrl).toEqual('https://localhost');
    });

    it('uses a custom cache if one was given in the configuration', async () => {
      const eartho = setup({
        cache: mockCache
      });

      await connectWithRedirectFn(mockWindow, mockFetch)(eartho);

      expect(mockCache.set).toHaveBeenCalled();
    });

    it('uses a custom cache if both `cache` and `cacheLocation` were specified', async () => {
      const eartho = setup({
        cache: mockCache,
        cacheLocation: 'localstorage'
      });

      await connectWithRedirectFn(mockWindow, mockFetch)(eartho);

      expect(mockCache.set).toHaveBeenCalled();
    });
  });
});
