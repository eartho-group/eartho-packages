import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { login, setup, teardown } from '../fixtures/setup';
import { withApi, withoutApi } from '../fixtures/default-settings';
import { get } from '../eartho-session/fixtures/helpers';
import { getResponse, login as appRouterLogin, getSession } from '../fixtures/app-router-helpers';
import { initEartho } from '../../src';

describe('with-api-auth-required', () => {
  describe('app router', () => {
    const getApiResponse = (opts?: any) => {
      const earthoInstance = initEartho(withApi);
      return getResponse({
        url: '/api/access/protected',
        earthoInstance,
        extraHandlers: {
          protected(req: NextRequest, ctx: { params: Record<string, any> }) {
            return earthoInstance.withServerAccessRequired(() => {
              return NextResponse.json({ foo: 'bar' });
            })(req, ctx);
          },
          'protected-returns-response'(req: NextRequest, ctx: { params: Record<string, any> }) {
            return earthoInstance.withServerAccessRequired((_req: NextRequest) => {
              // @ts-expect-error This is not in lib/dom right now.
              return Response.json({ foo: 'bar' });
            })(req, ctx);
          },
          'protected-updates-headers'(req: NextRequest, ctx: { params: Record<string, any> }) {
            return earthoInstance.withServerAccessRequired((_req: NextRequest) => {
              const res = NextResponse.json({ foo: 'bar' });
              res.cookies.set('foo', 'bar');
              res.headers.set('baz', 'bar');
              return res;
            })(req, ctx);
          },
          'protected-updates-session'(req: NextRequest, ctx: { params: Record<string, any> }) {
            return earthoInstance.withServerAccessRequired(async (req: NextRequest) => {
              const res = NextResponse.json({ foo: 'bar' });
              const session = await earthoInstance.getSession(req, res);
              await earthoInstance.updateSession(req, res, {
                ...session,
                user: { ...session?.user, update: opts.update }
              });
              return res;
            })(req, ctx);
          }
        },
        ...opts
      });
    };

    test('protect an api route', async () => {
      await expect(getApiResponse()).resolves.toMatchObject({ status: 401 });
    });

    test('allow access to an api route with a valid session', async () => {
      const loginRes = await appRouterLogin();
      const res = await getApiResponse({ cookies: { appSession: loginRes.cookies.get('appSession').value } });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ foo: 'bar' });
      await expect(getSession(withApi, res)).resolves.toMatchObject({
        user: expect.objectContaining({ sub: '__test_sub__' })
      });
    });

    test('allow access to an api route that returns a basic response with a valid session', async () => {
      const loginRes = await appRouterLogin();
      const res = await getApiResponse({
        url: '/api/access/protected-returns-response',
        cookies: { appSession: loginRes.cookies.get('appSession').value }
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ foo: 'bar' });
      await expect(getSession(withApi, res)).resolves.toMatchObject({
        user: expect.objectContaining({ sub: '__test_sub__' })
      });
    });

    test('allow access to an api route that updates the cookies', async () => {
      const loginRes = await appRouterLogin();
      const res = await getApiResponse({
        url: '/api/access/protected-updates-headers',
        cookies: { appSession: loginRes.cookies.get('appSession').value }
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ foo: 'bar' });
      await expect(getSession(withApi, res)).resolves.toMatchObject({
        user: expect.objectContaining({ sub: '__test_sub__' })
      });
      expect(res.cookies.get('foo').value).toBe('bar');
      expect(res.headers.get('baz')).toBe('bar');
    });

    test('allow access to an api route that updates the session cookie', async () => {
      const loginRes = await appRouterLogin();
      const res = await getApiResponse({
        url: '/api/access/protected-updates-session',
        cookies: { appSession: loginRes.cookies.get('appSession').value },
        update: 'foo'
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ foo: 'bar' });
      await expect(getSession(withApi, res)).resolves.toMatchObject({
        user: expect.objectContaining({ sub: '__test_sub__', update: 'foo' })
      });
    });

    test('allow access to an api route that updates the session cookie to a chunked cookie', async () => {
      const loginRes = await appRouterLogin();
      const update = randomBytes(2000).toString('base64');
      const res = await getApiResponse({
        url: '/api/access/protected-updates-session',
        cookies: { appSession: loginRes.cookies.get('appSession').value },
        update
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ foo: 'bar' });
      await expect(getSession(withApi, res)).resolves.toMatchObject({
        user: expect.objectContaining({ sub: '__test_sub__', update })
      });
    });
  });

  describe('page router', () => {
    afterEach(teardown);

    test('protect an api route', async () => {
      const baseUrl = await setup(withoutApi);
      await expect(get(baseUrl, '/api/protected')).rejects.toThrow('Unauthorized');
    });

    test('allow access to an api route with a valid session', async () => {
      const baseUrl = await setup(withoutApi);
      const cookieJar = await login(baseUrl);
      const {
        res: { statusCode },
        data
      } = await get(baseUrl, '/api/protected', { cookieJar, fullResponse: true });
      expect(statusCode).toBe(200);
      expect(data).toEqual({ foo: 'bar' });
    });
  });
});
