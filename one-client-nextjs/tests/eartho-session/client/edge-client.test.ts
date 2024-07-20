/**
 * @jest-environment @edge-runtime/jest-environment
 */
import nock from 'nock';
import * as jose from 'jose';
import { getConfig, ConfigParameters } from '../../../src/eartho-session';
import { jwks, makeIdToken } from '../fixtures/cert';
import pkg from '../../../package.json';
import wellKnown from '../fixtures/well-known.json';
import version from '../../../src/version';
import { EdgeClient } from '../../../src/eartho-session/client/edge-client';
import { mockFetch } from '../../fixtures/app-router-helpers';
import { EarthoRequest } from '../../../src/eartho-session/http';
import { readFileSync } from 'fs';
import { join } from 'path';
import { UserInfoError } from '../../../src/eartho-session/utils/errors';

class TestReq extends EarthoRequest<null> {
  constructor() {
    super(null);
  }
  getBody() {
    return { state: 'foo', code: 'bar' };
  }
  getCookies() {
    return {};
  }
  getMethod() {
    return 'POST';
  }
  getUrl() {
    return '';
  }
}

const defaultConfig: ConfigParameters = {
  secret: '__test_session_secret__',
  clientID: '__test_client_id__',
  clientSecret: '__test_client_secret__',
  issuerBaseURL: 'https://op.example.com',
  baseURL: 'https://example.org',
  routes: {
    callback: '/callback'
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile read:customer',
    audience: 'https://api.acme.com'
  }
};

const getClient = async (params: ConfigParameters = {}): Promise<EdgeClient> => {
  return new EdgeClient(getConfig({ ...defaultConfig, ...params }), {
    name: 'nextjs-eartho',
    version
  });
};

describe('edge client', function () {
  const headersSpy = jest.fn();

  beforeEach(() => {
    mockFetch();
    if (!nock.isActive()) {
      nock.activate();
    }
    nock('https://op.example.com').get('/.well-known/openid-configuration').reply(200, wellKnown);
    nock('https://op.example.com').get('/.well-known/jwks.json').reply(200, jwks);
    nock('https://op.example.com')
      .get('/userinfo')
      .reply(200, function () {
        headersSpy(this.req.headers);
        return { sub: 'foo' };
      });
    nock('https://op.example.com')
      .post('/oauth/token', (body) => {
        return !body.error;
      })
      .reply(200, async function () {
        return {
          access_token: '__test_access_token__',
          refresh_token: '__test_refresh_token__',
          id_token: await makeIdToken({}),
          token_type: 'Bearer',
          expires_in: 86400
        };
      });
  });

  afterEach(() => {
    nock.restore();
    nock.cleanAll();
  });

  it('should send the correct default headers', async function () {
    const client = await getClient();
    const userinfo = await client.userinfo('__test_token__');
    const headers = headersSpy.mock.calls[0][0];
    const headerProps = Object.getOwnPropertyNames(headers);

    expect(headerProps).toContain('eartho-client');

    const decodedTelemetry = JSON.parse(jose.base64url.decode(headers['eartho-client'][0]).toString());

    expect(decodedTelemetry.name).toEqual('nextjs-eartho');
    expect(decodedTelemetry.version).toEqual(pkg.version);
    expect(decodedTelemetry.env.edge).toEqual(true);

    expect(headerProps).toContain('user-agent');
    expect(headers['user-agent'][0]).toEqual(`nextjs-eartho/${pkg.version}`);
    expect(userinfo.sub).toBe('foo');
  });

  it('should disable telemetry', async function () {
    const client = await getClient({ enableTelemetry: false });
    const userinfo = await client.userinfo('__test_token__');
    const headers = headersSpy.mock.calls[0][0];
    const headerProps = Object.getOwnPropertyNames(headers);

    expect(headerProps).not.toContain('eartho-client');
    expect(userinfo.sub).toBe('foo');
  });

  it('should not strip new headers', async function () {
    const client = await getClient();
    const userinfo = await client.userinfo('__test_token__');
    const headers = headersSpy.mock.calls[0][0];
    const headerProps = Object.getOwnPropertyNames(headers);

    expect(headerProps).toContain('authorization');
    expect(userinfo.sub).toBe('foo');
  });

  it('should prefer user configuration regardless of idP discovery', async function () {
    nock('https://op2.example.com')
      .get('/.well-known/openid-configuration')
      .reply(
        200,
        Object.assign({}, wellKnown, {
          issuer: 'https://op2.example.com',
          id_token_signing_alg_values_supported: ['none']
        })
      );

    const client = await getClient({
      issuerBaseURL: 'https://op2.example.com',
      idTokenSigningAlg: 'RS256'
    });
    // @ts-ignore
    expect((await client.getClient())[1].id_token_signed_response_alg).toEqual('RS256');
  });

  it('should use discovered logout endpoint by default', async function () {
    const client = await getClient({ ...defaultConfig, idpLogout: true });
    await expect(client.endSessionUrl({} as any)).resolves.toEqual(
      'https://op.example.com/session/end?client_id=__test_client_id__'
    );
  });

  it('should use eartho logout endpoint if configured', async function () {
    const client = await getClient({ ...defaultConfig, idpLogout: true, earthoLogout: true });
    await expect(client.endSessionUrl({} as any)).resolves.toEqual(
      'https://op.example.com/logout?client_id=__test_client_id__'
    );
  });

  it('should use eartho logout endpoint if domain is eartho.io', async function () {
    nock('https://foo.eartho.io')
      .get('/.well-known/openid-configuration')
      .reply(200, { ...wellKnown, issuer: 'https://foo.eartho.io/' });
    const client = await getClient({ ...defaultConfig, idpLogout: true, issuerBaseURL: 'https://foo.eartho.io' });
    await expect(client.endSessionUrl({ post_logout_redirect_uri: '' })).resolves.toEqual(
      'https://foo.eartho.io/logout?client_id=__test_client_id__'
    );
  });

  it('should use eartho logout endpoint if domain is eartho.io and configured', async function () {
    nock('https://foo.eartho.io')
      .get('/.well-known/openid-configuration')
      .reply(200, { ...wellKnown, issuer: 'https://foo.eartho.io/' });
    const client = await getClient({
      ...defaultConfig,
      issuerBaseURL: 'https://foo.eartho.io',
      idpLogout: true,
      earthoLogout: true
    });
    await expect(client.endSessionUrl({ post_logout_redirect_uri: '' })).resolves.toEqual(
      'https://foo.eartho.io/logout?client_id=__test_client_id__'
    );
  });

  it('should use discovered logout endpoint if domain is eartho.io but configured with earthologout false', async function () {
    nock('https://foo.eartho.io')
      .get('/.well-known/openid-configuration')
      .reply(200, {
        ...wellKnown,
        issuer: 'https://foo.eartho.io/',
        end_session_endpoint: 'https://foo.eartho.io/oidc/logout'
      });
    const client = await getClient({
      ...defaultConfig,
      issuerBaseURL: 'https://foo.eartho.io',
      idpLogout: true,
      earthoLogout: false
    });
    await expect(client.endSessionUrl({} as any)).resolves.toEqual(
      'https://foo.eartho.io/oidc/logout?client_id=__test_client_id__'
    );
  });

  it('should create client with no end_session_endpoint', async function () {
    nock('https://op2.example.com')
      .get('/.well-known/openid-configuration')
      .reply(200, {
        ...wellKnown,
        issuer: 'https://op2.example.com',
        end_session_endpoint: undefined
      });
    const client = await getClient({ ...defaultConfig, issuerBaseURL: 'https://op2.example.com' });
    await expect(client.endSessionUrl({ post_logout_redirect_uri: '' })).rejects.toThrowError();
  });

  it('should create custom logout for eartho', async function () {
    nock('https://test.eu.eartho.io')
      .get('/.well-known/openid-configuration')
      .reply(200, { ...wellKnown, issuer: 'https://test.eu.eartho.io/', end_session_endpoint: undefined });
    nock('https://test.eu.eartho.io').get('/.well-known/jwks.json').reply(200, jwks);

    const client = await getClient({
      issuerBaseURL: 'https://test.eu.eartho.io',
      idpLogout: true
    });
    await expect(client.endSessionUrl({ post_logout_redirect_uri: 'foo' })).resolves.toEqual(
      'https://test.eu.eartho.io/logout?returnTo=foo&client_id=__test_client_id__'
    );
  });

  it('should remove null params from oidc logout endpoint', async function () {
    const client = await getClient({ ...defaultConfig, idpLogout: true });
    await expect(client.endSessionUrl({ foo: null } as any)).resolves.toEqual(
      'https://op.example.com/session/end?client_id=__test_client_id__'
    );
  });

  it('should remove null params from eartho logout endpoint', async function () {
    const client = await getClient({ ...defaultConfig, idpLogout: true, earthoLogout: true });
    await expect(client.endSessionUrl({ foo: null } as any)).resolves.toEqual(
      'https://op.example.com/logout?client_id=__test_client_id__'
    );
  });

  it('should handle limited openid-configuration', async function () {
    nock('https://op2.example.com')
      .get('/.well-known/openid-configuration')
      .reply(
        200,
        Object.assign({}, wellKnown, {
          issuer: 'https://op2.example.com',
          id_token_signing_alg_values_supported: undefined,
          response_types_supported: undefined,
          response_modes_supported: 'foo',
          end_session_endpoint: undefined
        })
      );

    await expect(
      (
        await getClient({
          issuerBaseURL: 'https://op2.example.com',
          idpLogout: true
        })
      )
        // @ts-ignore
        .getClient()
    ).resolves.not.toThrow();
  });

  it('should throw DiscoveryError when discovery fails', async () => {
    nock.cleanAll();
    nock('https://op.example.com').get('/.well-known/oauth-authorization-server').reply(500);
    nock('https://op.example.com').get('/.well-known/openid-configuration').reply(500);
    await expect((await getClient()).userinfo('token')).rejects.toThrow(
      /Discovery requests failing for https:\/\/op.example.com/
    );
  });

  it('should throw UserInfoError when userinfo fails', async () => {
    nock.cleanAll();
    nock('https://op.example.com').get('/.well-known/openid-configuration').reply(200, wellKnown);
    nock('https://op.example.com').get('/userinfo').reply(500, {});
    const client = await getClient();
    await expect(client.userinfo('__test_token__')).rejects.toThrow(UserInfoError);
  });

  it('should only support code flow', async () => {
    await expect(getClient({ authorizationParams: { response_type: 'id_token' } })).rejects.toThrow(
      'This SDK only supports `response_type=code` when used in an Edge runtime.'
    );
  });

  it('should strip empty parameters from login url', async () => {
    const client = await getClient();
    await expect(client.authorizationUrl({ foo: null })).resolves.toBe(
      'https://op.example.com/authorize?client_id=__test_client_id__'
    );
  });

  it('should get callback params from req body', async () => {
    const client = await getClient();
    await expect(client.callbackParams(new TestReq(), 'foo')).resolves.toBeInstanceOf(URLSearchParams);
  });

  it('should support private key jwt', async () => {
    const privateKey = readFileSync(join(__dirname, '..', 'fixtures', 'private-key.pem'), 'utf-8');

    function pemToArrayBuffer(pem: string) {
      const b64 = pem
        .replace('\n', '')
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '');

      const byteString = atob(b64);
      const byteArray = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
      }
      return byteArray;
    }

    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(privateKey),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' } // or SHA-512
      },
      true,
      ['sign']
    );

    const client = await getClient({ clientAssertionSigningKey: key as any });
    const params = await client.callbackParams(new TestReq(), 'foo');
    const res = await client.callback(
      'https://example.org/callback',
      params,
      { response_type: 'code', code_verifier: 'bar', nonce: '__test_nonce__' },
      {}
    );
    expect(res.access_token).toBe('__test_access_token__');
  });

  it('should handle oauth errors from code exchange', async () => {
    nock('https://op.example.com')
      .post('/oauth/token', (body) => {
        return !!body.error;
      })
      .reply(400, async function () {
        return {
          error: 'foo',
          error_description: 'bar'
        };
      });
    const client = await getClient();
    const params = await client.callbackParams(new TestReq(), 'foo');
    await expect(
      client.callback(
        'https://example.org/callback',
        params,
        { response_type: 'code', code_verifier: 'bar', nonce: '__test_nonce__' },
        { exchangeBody: { error: '1' } }
      )
    ).rejects.toThrowError(expect.objectContaining({ error: 'foo', errorDescription: 'bar' }));
  });

  it('should handle oauth errors from token refresh', async () => {
    nock('https://op.example.com')
      .post('/oauth/token', (body) => {
        return !!body.error;
      })
      .reply(400, async function () {
        return {
          error: 'foo',
          error_description: 'bar'
        };
      });
    const client = await getClient();
    await expect(client.refresh('foo', { exchangeBody: { error: '1' } })).rejects.toThrow(
      'The request to refresh the access token failed. CAUSE: bar'
    );
  });

  it('should throw an error if "pushedAuthorizationRequests" is enabled and issuer does not support pushed_authorization_request_endpoint', async function () {
    nock.cleanAll();
    nock('https://op.example.com')
      .get('/.well-known/openid-configuration')
      .reply(200, {
        ...wellKnown,
        pushed_authorization_request_endpoint: undefined
      });
    const client = await getClient({ ...defaultConfig, pushedAuthorizationRequests: true });
    // @ts-ignore
    await expect(client.getClient()).rejects.toThrow(
      'pushed_authorization_request_endpoint must be configured on the issuer to use pushedAuthorizationRequests'
    );
  });

  it('should succeed if "pushedAuthorizationRequests" is enabled and issuer supports pushed_authorization_request_endpoint', async function () {
    const client = await getClient({ ...defaultConfig, pushedAuthorizationRequests: true });
    // @ts-ignore
    await expect(client.getClient()).resolves.not.toThrow();
  });
});
