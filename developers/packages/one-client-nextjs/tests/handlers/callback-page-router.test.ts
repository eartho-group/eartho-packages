import { NextApiRequest, NextApiResponse } from 'next';
import { CookieJar } from 'tough-cookie';
import timekeeper from 'timekeeper';
import { withApi, withoutApi } from '../fixtures/default-settings';
import { makeIdToken } from '../eartho-session/fixtures/cert';
import { get, post, toSignedCookieJar } from '../eartho-session/fixtures/helpers';
import { encodeState } from '../../src/eartho-session/utils/encoding';
import { defaultOnError, setup, teardown } from '../fixtures/setup';
import { Session, AfterCallbackPageRoute, MissingStateCookieError } from '../../src';
import nock from 'nock';

const callback = (baseUrl: string, body: any, cookieJar?: CookieJar): Promise<any> =>
  post(baseUrl, `/api/access/callback`, {
    body,
    cookieJar,
    fullResponse: true
  });

const authVerificationCookie = (cookies: Record<string, string>) => ({ auth_verification: JSON.stringify(cookies) });

describe('callback handler (page router)', () => {
  afterEach(teardown);

  test('should require a state', async () => {
    expect.assertions(2);
    const baseUrl = await setup(withoutApi, {
      onError(req, res, err) {
        expect(err.cause).toBeInstanceOf(MissingStateCookieError);
        defaultOnError(req, res, err);
      }
    });
    await expect(
      callback(baseUrl, {
        state: '__test_state__'
      })
    ).rejects.toThrow(
      'Callback handler failed. CAUSE: Missing state cookie from login request (check login URL, callback URL and cookie config).'
    );
  });

  test('should validate the state', async () => {
    const baseUrl = await setup(withoutApi);
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state: '__other_state__'
      }),
      baseUrl
    );
    await expect(
      callback(
        baseUrl,
        {
          state: '__test_state__'
        },
        cookieJar
      )
    ).rejects.toThrow('state mismatch, expected __other_state__, got: __test_state__');
  });

  test('should validate the audience', async () => {
    const baseUrl = await setup(withoutApi, { idTokenClaims: { aud: 'bar' } });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    await expect(
      callback(
        baseUrl,
        {
          state,
          code: 'code'
        },
        cookieJar
      )
    ).rejects.toThrow('aud mismatch, expected __test_client_id__, got: bar');
  });

  test('should validate the issuer', async () => {
    const baseUrl = await setup(withoutApi, { idTokenClaims: { aud: 'bar', iss: 'other-issuer' } });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    await expect(
      callback(
        baseUrl,
        {
          state,
          code: 'code'
        },
        cookieJar
      )
    ).rejects.toThrow('unexpected iss value, expected https://acme.eartho.local/, got: other-issuer');
  });

  test('should escape html in error qp', async () => {
    const baseUrl = await setup(withoutApi);
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state: 'foo'
      }),
      baseUrl
    );
    await expect(
      get(baseUrl, `/api/access/callback?error=%3Cscript%3Ealert(%27xss%27)%3C%2Fscript%3E&state=foo`, { cookieJar })
    ).rejects.toThrow('&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;');
  });

  test('should create the session without OIDC claims', async () => {
    const baseUrl = await setup(withoutApi);
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    const { res } = await callback(
      baseUrl,
      {
        state,
        code: 'code'
      },
      cookieJar
    );
    expect(res.statusCode).toBe(302);
    const body = await get(baseUrl, `/api/session`, { cookieJar });
    expect(body.user).toStrictEqual({
      displayName: '__test_displayName__',
      sub: '__test_sub__'
    });
  });

  test('should set the correct expiration', async () => {
    timekeeper.freeze(0);
    const baseUrl = await setup(withoutApi);
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    const { res } = await post(baseUrl, `/api/access/callback`, {
      fullResponse: true,
      cookieJar,
      body: {
        state,
        code: 'code'
      }
    });
    expect(res.statusCode).toBe(302);

    const [sessionCookie] = cookieJar.getCookiesSync(baseUrl);
    const expiryInHrs = new Date(sessionCookie.expires).getTime() / 1000 / 60 / 60;
    expect(expiryInHrs).toBe(24);
    timekeeper.reset();
  });

  test('should create the session without OIDC claims with api config', async () => {
    timekeeper.freeze(0);
    const baseUrl = await setup(withApi);
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    const { res } = await callback(
      baseUrl,
      {
        state,
        code: 'code'
      },
      cookieJar
    );
    expect(res.statusCode).toBe(302);
    const session = await get(baseUrl, `/api/session`, { cookieJar });

    expect(session).toStrictEqual({
      accessToken: 'eyJz93a...k4laUWw',
      accessTokenExpiresAt: 750,
      accessTokenScope: 'read:foo delete:foo',
      token_type: 'Bearer',
      refreshToken: 'GEbRxBN...edjnXbL',
      idToken: await makeIdToken({ iss: 'https://acme.eartho.local/' }),
      user: {
        displayName: '__test_displayName__',
        sub: '__test_sub__'
      }
    });
    timekeeper.reset();
  });

  test('remove properties from session with afterCallback hook', async () => {
    timekeeper.freeze(0);
    const afterCallback: AfterCallbackPageRoute = (
      _req: NextApiRequest,
      _res: NextApiResponse,
      session: Session
    ): Session => {
      delete session.accessToken;
      delete session.refreshToken;
      return session;
    };
    const baseUrl = await setup(withApi, { callbackOptions: { afterCallback } });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    const { res } = await callback(
      baseUrl,
      {
        state,
        code: 'code'
      },
      cookieJar
    );
    expect(res.statusCode).toBe(302);
    const session = await get(baseUrl, `/api/session`, { cookieJar });

    expect(session).toStrictEqual({
      accessTokenExpiresAt: 750,
      accessTokenScope: 'read:foo delete:foo',
      idToken: await makeIdToken({ iss: 'https://acme.eartho.local/' }),
      token_type: 'Bearer',
      user: {
        displayName: '__test_displayName__',
        sub: '__test_sub__'
      }
    });
    timekeeper.reset();
  });

  test('add properties to session with afterCallback hook', async () => {
    timekeeper.freeze(0);
    const afterCallback: AfterCallbackPageRoute = (_req, _res, session: Session): Session => {
      session.foo = 'bar';
      return session;
    };
    const baseUrl = await setup(withApi, { callbackOptions: { afterCallback } });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    const { res } = await callback(
      baseUrl,
      {
        state,
        code: 'code'
      },
      cookieJar
    );
    expect(res.statusCode).toBe(302);
    const session = await get(baseUrl, '/api/session', { cookieJar });

    expect(session).toMatchObject({
      foo: 'bar',
      user: {
        displayName: '__test_displayName__',
        sub: '__test_sub__'
      }
    });
    timekeeper.reset();
  });

  test('throws from afterCallback hook', async () => {
    const afterCallback = (): Session => {
      throw new Error('some validation error.');
    };
    const baseUrl = await setup(withApi, { callbackOptions: { afterCallback } });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    await expect(
      callback(
        baseUrl,
        {
          state,
          code: 'code'
        },
        cookieJar
      )
    ).rejects.toThrow('some validation error.');
  });

  test('throws for missing org_id claim', async () => {
    const baseUrl = await setup({ ...withApi, organization: 'org_foo' });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    await expect(
      callback(
        baseUrl,
        {
          state,
          code: 'code'
        },
        cookieJar
      )
    ).rejects.toThrow(/Organization Id \(org_id\) claim must be a string present in the ID token/);
  });

  test('throws for org_id claim mismatch', async () => {
    const baseUrl = await setup({ ...withApi, organization: 'org_foo' }, { idTokenClaims: { org_id: 'org_bar' } });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    await expect(
      callback(
        baseUrl,
        {
          state,
          code: 'code'
        },
        cookieJar
      )
    ).rejects.toThrow(
      /Organization Id \(org_id\) claim value mismatch in the ID token; expected "org_foo", found "org_bar"/
    );
  });

  test('accepts a valid organization', async () => {
    const baseUrl = await setup(withApi, {
      idTokenClaims: { org_id: 'org_foo' },
      callbackOptions: { organization: 'org_foo' }
    });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    await expect(
      callback(
        baseUrl,
        {
          state,
          code: 'code'
        },
        cookieJar
      )
    ).resolves.not.toThrow();
    const session = await get(baseUrl, '/api/session', { cookieJar });

    expect(session.user.org_id).toEqual('org_foo');
  });

  test('should pass custom params to the token exchange', async () => {
    const baseUrl = await setup(withoutApi, {
      callbackOptions: {
        authorizationParams: { foo: 'bar' }
      }
    });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    const spy = jest.fn();

    nock(`${withoutApi.issuerBaseURL}`)
      .post('/oauth/token', /grant_type=authorization_code/)
      .reply(200, async (_, body) => {
        spy(body);
        return {
          access_token: 'eyJz93a...k4laUWw',
          expires_in: 750,
          scope: 'read:foo delete:foo',
          refresh_token: 'GEbRxBN...edjnXbL',
          id_token: await makeIdToken({ iss: `${withoutApi.issuerBaseURL}/` }),
          token_type: 'Bearer'
        };
      });

    const { res } = await callback(
      baseUrl,
      {
        state,
        code: 'foobar'
      },
      cookieJar
    );
    expect(res.statusCode).toBe(302);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('foo=bar'));
  });

  test('redirects from afterCallback hook', async () => {
    const afterCallback = (_req: NextApiRequest, res: NextApiResponse): undefined => {
      res.writeHead(302, '', { location: '/foo' });
      res.end();
      return;
    };
    const baseUrl = await setup(withApi, { callbackOptions: { afterCallback } });
    const state = encodeState({ returnTo: baseUrl });
    const cookieJar = await toSignedCookieJar(
      authVerificationCookie({
        state,
        nonce: '__test_nonce__'
      }),
      baseUrl
    );
    const { res } = await callback(
      baseUrl,
      {
        state,
        code: 'code'
      },
      cookieJar
    );
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/foo');
  });
});
