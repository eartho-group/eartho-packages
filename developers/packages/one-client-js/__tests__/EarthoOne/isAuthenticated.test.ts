import { verify } from '../../src/jwt';
import { MessageChannel } from 'worker_threads';
import * as utils from '../../src/utils';
import * as scope from '../../src/scope';
import { expect } from '@jest/globals';

// @ts-ignore

import { connectWithPopupFn, connectWithRedirectFn, setupFn } from './helpers';

import { TEST_CODE_CHALLENGE } from '../constants';

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

const setup = setupFn(mockVerify);
const connectWithRedirect = connectWithRedirectFn(mockWindow, mockFetch);
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

  describe('isConnected', () => {
    describe('connectWithRedirect', () => {
      it('returns true if there is a user', async () => {
        const eartho = setup();
        await connectWithRedirect(eartho);

        const result = await eartho.isConnected();
        expect(result).toBe(true);
      });

      it('returns false if error was returned', async () => {
        const eartho = setup();

        try {
          await connectWithRedirect(eartho, undefined, {
            authorize: {
              error: 'some-error'
            }
          });
        } catch {}

        const result = await eartho.isConnected();

        expect(result).toBe(false);
      });

      it('returns false if token call fails', async () => {
        const eartho = setup();
        try {
          await connectWithRedirect(eartho, undefined, {
            token: { success: false }
          });
        } catch {}
        const result = await eartho.isConnected();
        expect(result).toBe(false);
      });
    });

    describe('connectWithPopup', () => {
      it('returns true if there is a user', async () => {
        const eartho = setup();
        await connectWithPopup(eartho);

        const result = await eartho.isConnected();
        expect(result).toBe(true);
      });
    });

    it('returns false if code not part of URL', async () => {
      const eartho = setup();

      try {
        await connectWithPopup(eartho, undefined, undefined, {
          authorize: {
            response: {
              error: 'some error'
            }
          }
        });
      } catch {}

      const result = await eartho.isConnected();

      expect(result).toBe(false);
    });

    it('returns false if there is no user', async () => {
      const eartho = setup();
      const result = await eartho.isConnected();

      expect(result).toBe(false);
    });
  });
});
