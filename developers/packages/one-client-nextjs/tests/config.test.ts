import { NextRequest } from 'next/server';
import { NextConfig, getConfig, configSingletonGetter } from '../src/config';
import { EarthoNextRequest, EarthoNextRequestCookies } from '../src/http';

const getConfigWithEnv = (
  env: any = {},
  opts?: any,
  defaultEnv = {
    EARTHO_SECRET: '__long_super_secret_secret__',
    EARTHO_ISSUER_BASE_URL: 'https://example.eartho.io',
    EARTHO_BASE_URL: 'https://example.com',
    EARTHO_CLIENT_ID: '__test_client_id__',
    EARTHO_CLIENT_SECRET: '__test_client_secret__'
  }
): NextConfig => {
  const bkp = process.env;
  process.env = {
    ...process.env,
    ...defaultEnv,
    ...env
  };
  try {
    return getConfig(opts);
  } catch (e) {
    throw e;
  } finally {
    process.env = bkp;
  }
};

describe('config params', () => {
  test('should return an object from empty defaults', () => {
    const nextConfig = getConfigWithEnv();
    expect(nextConfig).toStrictEqual({
      secret: '__long_super_secret_secret__',
      issuerBaseURL: 'https://example.eartho.io',
      baseURL: 'https://example.com',
      clientAssertionSigningAlg: undefined,
      clientAssertionSigningKey: undefined,
      clientID: '__test_client_id__',
      clientSecret: '__test_client_secret__',
      clockTolerance: 60,
      httpTimeout: 5000,
      enableTelemetry: true,
      idpLogout: true,
      earthoLogout: true,
      idTokenSigningAlg: 'RS256',
      legacySameSiteCookie: true,
      authorizationParams: {
        response_type: 'code',
        audience: undefined,
        scope: 'openid profile email'
      },
      session: {
        name: 'appSession',
        rolling: true,
        rollingDuration: 86400,
        absoluteDuration: 604800,
        autoSave: true,
        storeIDToken: true,
        cookie: {
          domain: undefined,
          path: '/',
          transient: false,
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        }
      },
      routes: { callback: '/api/access/callback', postLogoutRedirect: '', login: '/api/access/login' },
      getLoginState: expect.any(Function),
      identityClaimFilter: [
        'aud',
        'iss',
        'iat',
        'exp',
        'nbf',
        'nonce',
        'azp',
        'auth_time',
        's_hash',
        'at_hash',
        'c_hash'
      ],
      clientAuthMethod: 'client_secret_basic',
      transactionCookie: {
        name: 'auth_verification',
        domain: undefined,
        path: '/',
        sameSite: 'lax',
        secure: true
      },
      organization: undefined,
      backchannelLogout: false,
      pushedAuthorizationRequests: false
    });
  });

  test('should populate booleans', () => {
    expect(
      getConfigWithEnv({
        EARTHO_ENABLE_TELEMETRY: 'off',
        EARTHO_LEGACY_SAME_SITE_COOKIE: '0',
        EARTHO_IDP_LOGOUT: 'no',
        EARTHO_LOGOUT: 'false',
        EARTHO_COOKIE_TRANSIENT: true,
        EARTHO_COOKIE_HTTP_ONLY: 'on',
        EARTHO_COOKIE_SAME_SITE: 'lax',
        EARTHO_COOKIE_SECURE: 'ok',
        EARTHO_SESSION_ABSOLUTE_DURATION: 'no',
        EARTHO_SESSION_STORE_ID_TOKEN: '0'
      })
    ).toMatchObject({
      earthoLogout: false,
      enableTelemetry: false,
      idpLogout: false,
      legacySameSiteCookie: false,
      session: {
        absoluteDuration: false,
        storeIDToken: false,
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          secure: true,
          transient: true
        }
      }
    });
    expect(
      getConfigWithEnv({
        EARTHO_SESSION_ROLLING_DURATION: 'no',
        EARTHO_SESSION_ROLLING: 'no'
      })
    ).toMatchObject({
      session: {
        rolling: false,
        rollingDuration: false
      }
    });
  });

  test('should populate numbers', () => {
    expect(
      getConfigWithEnv({
        EARTHO_CLOCK_TOLERANCE: '100',
        EARTHO_HTTP_TIMEOUT: '9999',
        EARTHO_SESSION_ROLLING_DURATION: '0',
        EARTHO_SESSION_ABSOLUTE_DURATION: '1'
      })
    ).toMatchObject({
      clockTolerance: 100,
      httpTimeout: 9999,
      session: {
        rolling: true,
        rollingDuration: 0,
        absoluteDuration: 1
      }
    });
  });

  test('should populate arrays', () => {
    expect(
      getConfigWithEnv({
        EARTHO_IDENTITY_CLAIM_FILTER: 'claim1,claim2,claim3'
      })
    ).toMatchObject({
      identityClaimFilter: ['claim1', 'claim2', 'claim3']
    });
  });

  test('passed in arguments should take precedence', () => {
    const nextConfig = getConfigWithEnv(
      {
        EARTHO_ORGANIZATION: 'foo'
      },
      {
        authorizationParams: {
          audience: 'foo',
          scope: 'openid bar'
        },
        baseURL: 'https://baz.com',
        routes: {
          callback: 'qux'
        },
        session: {
          absoluteDuration: 100,
          storeIDToken: false,
          cookie: {
            transient: false
          },
          name: 'quuuux'
        },
        organization: 'bar'
      }
    );
    expect(nextConfig).toMatchObject({
      authorizationParams: {
        audience: 'foo',
        scope: 'openid bar'
      },
      baseURL: 'https://baz.com',
      routes: {
        callback: 'qux'
      },
      session: {
        absoluteDuration: 100,
        storeIDToken: false,
        cookie: {
          transient: false
        },
        name: 'quuuux'
      },
      organization: 'bar'
    });
  });

  test('should allow hostnames as baseURL', () => {
    expect(
      getConfigWithEnv({
        EARTHO_BASE_URL: 'foo.eartho.io'
      })
    ).toMatchObject({
      baseURL: 'https://foo.eartho.io'
    });
  });

  test('should fallback to NEXT_PUBLIC_ prefixed base URL', () => {
    expect(
      getConfigWithEnv(
        {
          NEXT_PUBLIC_EARTHO_BASE_URL: 'public-foo.eartho.io'
        },
        undefined,
        {
          EARTHO_SECRET: '__long_super_secret_secret__',
          EARTHO_ISSUER_BASE_URL: 'https://example.eartho.io',
          EARTHO_BASE_URL: '',
          EARTHO_CLIENT_ID: '__test_client_id__',
          EARTHO_CLIENT_SECRET: '__test_client_secret__'
        }
      )
    ).toMatchObject({
      baseURL: 'https://public-foo.eartho.io'
    });
  });

  test('should prefer EARTHO_BASE_URL without the prefix', () => {
    expect(
      getConfigWithEnv({
        EARTHO_BASE_URL: 'foo.eartho.io',
        NEXT_PUBLIC_EARTHO_BASE_URL: 'bar.eartho.io'
      })
    ).toMatchObject({
      baseURL: 'https://foo.eartho.io'
    });
  });

  test('should accept optional callback path', () => {
    const nextConfig = getConfigWithEnv({
      EARTHO_CALLBACK: '/api/custom-callback'
    });
    expect(nextConfig).toMatchObject({
      routes: expect.objectContaining({ callback: '/api/custom-callback' })
    });
  });

  test('getConfig should query RSC cookies to bail out of static rendering', async () => {
    const req = jest.mocked(new EarthoNextRequestCookies());
    jest.spyOn(req, 'getCookies').mockImplementation(() => {
      throw new Error('BAIL');
    });
    const getConfig = configSingletonGetter({}, () => '');
    await expect(() => getConfig(req)).toThrow('BAIL');
    await expect(() => getConfig(req)).not.toThrow('"secret" is required');
    expect(req.getCookies).toHaveBeenCalled();
  });

  test('getConfig should query API route URL to bail out of static rendering', async () => {
    const req = jest.mocked(new EarthoNextRequest(new NextRequest(new URL('http://example.com'))));
    jest.spyOn(req, 'getUrl').mockImplementation(() => {
      throw new Error('BAIL');
    });
    const getConfig = configSingletonGetter({}, () => '');
    await expect(() => getConfig(req)).toThrow('BAIL');
    await expect(() => getConfig(req)).not.toThrow('"secret" is required');
    expect(req.getUrl).toHaveBeenCalled();
  });
});
