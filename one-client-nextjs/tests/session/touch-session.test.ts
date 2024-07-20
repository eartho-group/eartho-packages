import { login, setup, teardown } from '../fixtures/setup';
import { withoutApi } from '../fixtures/default-settings';
import { get } from '../eartho-session/fixtures/helpers';
import { getResponse, login as appRouterLogin } from '../fixtures/app-router-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { initEartho } from '../../src';

describe('touch-session', () => {
  describe('app router', () => {
    test('should not update the session when getting the session', async () => {
      const config = { ...withoutApi, session: { autoSave: false } };
      const earthoInstance = initEartho(config);
      const loginRes = await appRouterLogin({ config });
      const res = await getResponse({
        url: '/api/access/session',
        config,
        earthoInstance,
        cookies: { appSession: loginRes.cookies.get('appSession').value },
        extraHandlers: {
          async session(req: NextRequest) {
            const res = new NextResponse();
            await earthoInstance.getSession(req, res);
            return res;
          }
        }
      });
      expect(res.headers.get('set-cookie')).toBeNull();
    });

    test('should update the session when calling touchSession', async () => {
      const config = { ...withoutApi, session: { autoSave: false } };
      const earthoInstance = initEartho(config);
      const loginRes = await appRouterLogin({ config });
      const res = await getResponse({
        url: '/api/access/session',
        config,
        earthoInstance,
        cookies: { appSession: loginRes.cookies.get('appSession').value },
        extraHandlers: {
          async session(req: NextRequest) {
            const res = new NextResponse();
            await earthoInstance.getSession(req, res);
            await earthoInstance.touchSession(req, res);
            return res;
          }
        }
      });
      expect(res.headers.get('set-cookie')).not.toBeNull();
    });
  });
  describe('page router', () => {
    afterEach(teardown);

    test('should not update the session when getting the session', async () => {
      const baseUrl = await setup({
        ...withoutApi,
        session: {
          autoSave: false
        }
      });
      const cookieJar = await login(baseUrl);
      const [authCookie] = await cookieJar.getCookies(baseUrl);
      await get(baseUrl, '/api/access/me', { cookieJar });
      const [updatedAuthCookie] = await cookieJar.getCookies(baseUrl);
      expect(updatedAuthCookie).toEqual(authCookie);
    });

    test('should update the session when calling touchSession', async () => {
      const baseUrl = await setup({
        ...withoutApi,
        session: {
          autoSave: false
        }
      });
      const cookieJar = await login(baseUrl);
      const [authCookie] = await cookieJar.getCookies(baseUrl);
      await get(baseUrl, '/api/touch-session', { cookieJar });
      const [updatedAuthCookie] = await cookieJar.getCookies(baseUrl);
      expect(updatedAuthCookie).not.toEqual(authCookie);
    });

    test('should not throw when there is no session', async () => {
      const baseUrl = await setup({
        ...withoutApi,
        session: {
          autoSave: false
        }
      });
      await expect(get(baseUrl, '/api/touch-session')).resolves.not.toThrow();
    });
  });
});
