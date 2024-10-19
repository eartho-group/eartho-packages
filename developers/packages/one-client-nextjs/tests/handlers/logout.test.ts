/**
 * **REMOVE-TO-TEST-ON-EDGE**@jest-environment @edge-runtime/jest-environment
 */
import { parse as parseUrl } from 'url';
import { withApi } from '../fixtures/default-settings';
import { getResponse, login as appRouterLogin, mockFetch } from '../fixtures/app-router-helpers';
import nock from 'nock';
import { discovery } from '../fixtures/oidc-nocks';

describe('logout handler (app router)', () => {
  beforeEach(mockFetch);

  test('should redirect to eartho', async () => {
    const loginRes = await appRouterLogin();
    const cookies = { appSession: loginRes.cookies.get('appSession').value };
    const res = await getResponse({ url: '/api/access/logout', cookies });
    expect(res.status).toBe(302);
    expect(parseUrl(res.headers.get('location'), true)).toMatchObject({
      protocol: 'https:',
      host: 'acme.eartho.local',
      query: {
        returnTo: 'http://www.acme.com',
        client_id: '__test_client_id__'
      },
      pathname: '/logout'
    });
  });

  test('should pass logout params to eartho', async () => {
    const loginRes = await appRouterLogin();
    const cookies = { appSession: loginRes.cookies.get('appSession').value };
    const res = await getResponse({
      url: '/api/access/logout',
      cookies,
      logoutOpts: { logoutParams: { foo: 'bar' } }
    });
    expect(res.status).toBe(302);
    expect(parseUrl(res.headers.get('location'), true).query).toMatchObject({
      returnTo: 'http://www.acme.com',
      client_id: '__test_client_id__',
      foo: 'bar'
    });
  });

  test('should return to the custom path', async () => {
    const loginRes = await appRouterLogin();
    const cookies = { appSession: loginRes.cookies.get('appSession').value };
    const res = await getResponse({
      url: '/api/access/logout',
      cookies,
      logoutOpts: { returnTo: 'https://www.google.com' }
    });
    expect(res.status).toBe(302);
    expect(parseUrl(res.headers.get('location'), true).query).toMatchObject({
      returnTo: 'https://www.google.com'
    });
  });

  test('should use end_session_endpoint when configured', async () => {
    const loginRes = await appRouterLogin();
    const cookies = { appSession: loginRes.cookies.get('appSession').value };
    const res = await getResponse({
      url: '/api/access/logout',
      cookies,
      config: { earthoLogout: false },
      discoveryOptions: { end_session_endpoint: 'https://my-end-session-endpoint/logout' }
    });
    expect(res.status).toBe(302);
    expect(parseUrl(res.headers.get('location'))).toMatchObject({
      host: 'my-end-session-endpoint',
      pathname: '/logout'
    });
  });

  test('should use eartho logout by default even when end_session_endpoint is discovered', async () => {
    const loginRes = await appRouterLogin();
    const cookies = { appSession: loginRes.cookies.get('appSession').value };
    const res = await getResponse({
      url: '/api/access/logout',
      cookies,
      discoveryOptions: { end_session_endpoint: 'https://my-end-session-endpoint/logout' }
    });
    expect(res.status).toBe(302);
    expect(parseUrl(res.headers.get('location'))).toMatchObject({
      host: 'acme.eartho.local',
      pathname: '/logout'
    });
  });

  test('should delete the session', async () => {
    const loginRes = await appRouterLogin();
    const cookies = { appSession: loginRes.cookies.get('appSession').value };
    const res = await getResponse({ url: '/api/access/logout', cookies });
    expect(res.status).toBe(302);
    expect(new Date(res.cookies.get('appSession').expires).getTime()).toBe(0);
  });

  test('should handle logout errors', async () => {
    const loginRes = await appRouterLogin();
    const cookies = { appSession: loginRes.cookies.get('appSession').value };
    nock.cleanAll();
    discovery(withApi, { error: true });

    const res = await getResponse({ url: '/api/access/logout', cookies, clearNock: false });
    expect(res.status).toBe(500);
    expect(res.statusText).toMatch(/Logout handler failed. CAUSE: Discovery requests failing/);
  });
});
