import { NextRequest, NextResponse } from 'next/server';
import { NextFetchEvent } from 'next/dist/server/web/spec-extension/fetch-event';
import { initEartho } from '../../src/edge';
import { withoutApi } from '../fixtures/default-settings';
import { IdTokenClaims } from 'openid-client';
import { encryption } from '../../src/eartho-session/utils/hkdf';
import { defaultConfig } from '../eartho-session/fixtures/helpers';
import { makeIdToken } from '../eartho-session/fixtures/cert';
import * as jose from 'jose';
import { getSession } from '../fixtures/app-router-helpers';

const encrypted = async (claims: Partial<IdTokenClaims> = { sub: '__test_sub__' }): Promise<string> => {
  const key = await encryption(defaultConfig.secret as string);
  const epochNow = (Date.now() / 1000) | 0;
  const weekInSeconds = 7 * 24 * 60 * 60;
  const payload = {
    user: claims,
    access_token: '__test_access_token__',
    token_type: 'Bearer',
    id_token: await makeIdToken(claims),
    refresh_token: '__test_access_token__',
    expires_at: epochNow + weekInSeconds
  };
  return new jose.EncryptJWT({ ...payload })
    .setProtectedHeader({
      alg: 'dir',
      enc: 'A256GCM',
      uat: epochNow,
      iat: epochNow,
      exp: epochNow + weekInSeconds
    })
    .encrypt(key);
};

const setup = async ({ url = 'http://example.com', config = withoutApi, user, middleware, instance }: any = {}) => {
  const mw = (instance || initEartho(config)).withMiddlewareAccessRequired(middleware);
  const request = new NextRequest(new URL(url));
  if (user) {
    request.cookies.set('appSession', await encrypted({ sub: 'foo' }));
  }
  return mw(request, new NextFetchEvent({ request, page: '/' })) as NextResponse;
};

describe('with-middleware-auth-required', () => {
  test('require auth on anonymous request', async () => {
    const res = await setup();
    expect(res.status).toEqual(307);
    const redirect = new URL(res.headers.get('location') as string);
    expect(redirect).toMatchObject({
      hostname: 'example.com',
      pathname: '/api/access/login'
    });
    expect(redirect.searchParams.get('returnTo')).toEqual('/');
  });

  test('require auth on anonymous requests to api routes', async () => {
    const res = await setup({ url: 'http://example.com/api/foo' });
    expect(res.ok).toBe(false);
    expect(res.status).toEqual(401);
    await expect(res.json()).resolves.toMatchObject({
      error: 'not_authenticated',
      description: 'The user does not have an active session or is not authenticated'
    });
  });

  test('return to previous url', async () => {
    const res = await setup({ url: 'http://example.com/foo/bar?baz=hello' });
    const redirect = new URL(res.headers.get('location') as string);
    expect(redirect).toMatchObject({
      hostname: 'example.com',
      pathname: '/api/access/login'
    });
    expect(redirect.searchParams.get('returnTo')).toEqual('/foo/bar?baz=hello');
  });

  test('return to provided url string', async () => {
    const res = await setup({ url: 'http://example.com/foo/bar?baz=hello', middleware: { returnTo: '/qux' } });
    const redirect = new URL(res.headers.get('location') as string);
    expect(redirect).toMatchObject({
      hostname: 'example.com',
      pathname: '/api/access/login'
    });
    expect(redirect.searchParams.get('returnTo')).toEqual('/qux');
  });

  test('return to provided url fn', async () => {
    const res = await setup({
      url: 'http://example.com/foo/bar?baz=hello',
      middleware: { returnTo: (req: NextRequest) => Promise.resolve(`/qux${new URL(req.url).search}`) }
    });
    const redirect = new URL(res.headers.get('location') as string);
    expect(redirect).toMatchObject({
      hostname: 'example.com',
      pathname: '/api/access/login'
    });
    expect(redirect.searchParams.get('returnTo')).toEqual('/qux?baz=hello');
  });

  test('should ignore static urls', async () => {
    const res = await setup({ url: 'http://example.com/_next/style.css' });
    expect(res).toBeUndefined();
  });

  test('should ignore default sdk urls', async () => {
    const res = await setup({ url: 'http://example.com/api/access/login' });
    expect(res).toBeUndefined();
  });

  test('should ignore custom sdk urls', async () => {
    const res = await setup({
      url: 'http://example.com/api/custom-login',
      config: {
        ...withoutApi,
        routes: { ...withoutApi.routes, login: '/api/custom-login' }
      }
    });
    expect(res).toBeUndefined();
  });

  test('should redirect to custom sdk urls', async () => {
    const res = await setup({
      url: 'http://example.com/my-page',
      config: {
        ...withoutApi,
        routes: { ...withoutApi.routes, login: '/api/custom-login' }
      }
    });
    const redirect = new URL(res.headers.get('location') as string);
    expect(redirect).toMatchObject({
      hostname: 'example.com',
      pathname: '/api/custom-login'
    });
  });

  test('should not redirect to 3rd party domain', async () => {
    const res = await setup({ url: 'http://example.com//evil.com' });
    const redirect = new URL(res.headers.get('location') as string);
    expect(redirect).toMatchObject({
      hostname: 'example.com'
    });
  });

  test('should not run custom middleware for unauthenticated users', async () => {
    const middleware = jest.fn();
    await setup({ middleware });
    expect(middleware).not.toHaveBeenCalled();
  });

  test('should allow authenticated sessions to pass', async () => {
    const res = await setup({ user: { name: 'dave' } });
    expect(res.status).toEqual(200);
  });

  test('should run custom middleware for authenticated users', async () => {
    const middleware = jest.fn();
    await setup({ middleware, user: { name: 'dave' } });
    expect(middleware).toHaveBeenCalled();
  });

  test('should accept custom middleware in options obj', async () => {
    const middleware = jest.fn();
    await setup({ middleware: { middleware }, user: { name: 'dave' } });
    expect(middleware).toHaveBeenCalled();
  });

  test('should honor redirects in custom middleware for authenticated users', async () => {
    const middleware = jest.fn().mockImplementation(() => {
      return NextResponse.redirect('https://example.com/redirect');
    });
    const res = await setup({ middleware, user: { name: 'dave' } });
    expect(middleware).toHaveBeenCalled();
    expect(res.status).toEqual(307);
    expect(res.headers.get('location')).toEqual('https://example.com/redirect');
    expect(res.headers.get('set-cookie')).toMatch(/^appSession=/);
  });

  test('should honor rewrites in custom middleware for authenticated users', async () => {
    const middleware = jest.fn().mockImplementation(() => {
      return NextResponse.rewrite('https://example.com/rewrite');
    });
    const res = await setup({ middleware, user: { name: 'dave' } });
    expect(middleware).toHaveBeenCalled();
    expect(res.status).toEqual(200);
    expect(res.headers.get('x-middleware-rewrite')).toEqual('https://example.com/rewrite');
    expect(res.headers.get('set-cookie')).toMatch(/^appSession=/);
  });

  test('should set a session cookie if session is rolling', async () => {
    const res = await setup({ user: { name: 'dave' } });
    expect(res.status).toEqual(200);
    expect(res.headers.get('set-cookie')).toMatch(/^appSession=/);
  });

  test('should not set a session cookie if session is not rolling', async () => {
    const res = await setup({ user: { name: 'dave' }, config: { ...withoutApi, session: { rolling: false } } });
    expect(res.status).toEqual(200);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  test('should set a session cookie and a custom cookie', async () => {
    const middleware = () => {
      const res = NextResponse.next();
      res.cookies.set('foo', 'bar');
      return res;
    };
    const res = await setup({ user: { name: 'dave' }, middleware });
    expect(res.status).toEqual(200);
    expect(res.headers.get('set-cookie')).toMatch(/appSession=/);
    expect(res.headers.get('set-cookie')).toMatch(/foo=bar;/);
  });

  test('should allow responses from custom middleware', async () => {
    const middleware = () => {
      return NextResponse.json({ foo: 'bar' });
    };
    const res = await setup({ user: { name: 'dave' }, middleware });
    expect(res.status).toEqual(200);
    await expect(res.json()).resolves.toEqual({ foo: 'bar' });
  });

  test('should allow ReadableStream responses from custom middleware', async () => {
    const middleware = () => {
      // @ts-expect-errors ts dom doesn't have json
      return new Response(Response.json({ foo: 'bar' }).body);
    };
    const res = await setup({ user: { name: 'dave' }, middleware });
    expect(res.status).toEqual(200);
    await expect(res.json()).resolves.toEqual({ foo: 'bar' });
  });

  test('should allow responses and cookies from custom middleware', async () => {
    const middleware = () => {
      const res = NextResponse.json({ foo: 'bar' });
      res.cookies.set('foo', 'bar');
      return res;
    };
    const res = await setup({ user: { name: 'dave' }, middleware });
    expect(res.status).toEqual(200);
    await expect(res.json()).resolves.toEqual({ foo: 'bar' });
    expect(res.headers.get('set-cookie')).toMatch(/appSession=/);
    expect(res.headers.get('set-cookie')).toMatch(/foo=bar;/);
  });

  test('should set just a custom cookie when session is not rolling', async () => {
    const middleware = () => {
      const res = NextResponse.next();
      res.cookies.set('foo', 'bar');
      return res;
    };
    const res = await setup({
      user: { name: 'dave' },
      config: { ...withoutApi, session: { rolling: false } },
      middleware
    });
    expect(res.status).toEqual(200);
    expect(res.headers.get('set-cookie')).toEqual('foo=bar; Path=/');
  });

  test('should not set a custom cookie or session cookie when session is not rolling', async () => {
    const middleware = () => {
      return NextResponse.next();
    };
    const res = await setup({
      user: { name: 'dave' },
      config: { ...withoutApi, session: { rolling: false } },
      middleware
    });
    expect(res.status).toEqual(200);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  test('should set a custom header', async () => {
    const middleware = () => {
      const res = NextResponse.next();
      res.headers.set('foo', 'bar');
      return res;
    };
    const res = await setup({
      user: { name: 'dave' },
      middleware
    });
    expect(res.status).toEqual(200);
    expect(res.headers.get('foo')).toBe('bar');
  });

  test('should update session from custom middleware', async () => {
    const instance = initEartho(withoutApi);
    const middleware = async (req: NextRequest) => {
      const res = NextResponse.next();
      const session = await instance.getSession(req, res);
      await instance.updateSession(req, res, { ...session, user: { ...session?.user, baz: 'bar' } });
      return res;
    };
    const res = await setup({
      instance,
      user: { name: 'dave' },
      middleware
    });
    await expect(getSession(withoutApi, res)).resolves.toMatchObject({ user: { sub: 'foo', baz: 'bar' } });
  });

  test('should update session with a large claim from middleware', async () => {
    const instance = initEartho(withoutApi);
    const middleware = async (req: NextRequest) => {
      const res = NextResponse.next();
      const session = await instance.getSession(req, res);
      await instance.updateSession(req, res, { ...session, user: { ...session?.user, baz: 'bar'.repeat(2000) } });
      return res;
    };
    const res = await setup({
      instance,
      user: { name: 'dave' },
      middleware
    });
    await expect(getSession(withoutApi, res)).resolves.toMatchObject({ user: { baz: expect.any(String) } });
    expect(res.headers.get('set-cookie')).toMatch(/appSession=;/);
    expect(res.headers.get('set-cookie')).toMatch(/appSession.0=/);
  });
});
