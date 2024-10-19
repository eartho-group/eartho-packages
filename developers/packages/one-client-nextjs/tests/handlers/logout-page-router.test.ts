import { parse } from 'cookie';
import { parse as parseUrl } from 'url';
import { withoutApi } from '../fixtures/default-settings';
import { get } from '../eartho-session/fixtures/helpers';
import { setup, teardown, login } from '../fixtures/setup';
import { ServerResponse } from 'http';

describe('logout handler (page router)', () => {
  afterEach(teardown);

  test('should redirect to eartho', async () => {
    const baseUrl = await setup(withoutApi);
    const cookieJar = await login(baseUrl);

    const {
      res: { statusCode, headers }
    } = await get(baseUrl, '/api/access/logout', {
      cookieJar,
      fullResponse: true
    });

    expect(statusCode).toBe(302);
    expect(parseUrl(headers['location'], true)).toMatchObject({
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
    const baseUrl = await setup(withoutApi, { logoutOptions: { logoutParams: { foo: 'bar' } } });
    const cookieJar = await login(baseUrl);

    const {
      res: { statusCode, headers }
    } = await get(baseUrl, '/api/access/logout', {
      cookieJar,
      fullResponse: true
    });

    expect(statusCode).toBe(302);
    expect(parseUrl(headers['location'], true)).toMatchObject({
      protocol: 'https:',
      host: 'acme.eartho.local',
      query: {
        returnTo: 'http://www.acme.com',
        client_id: '__test_client_id__',
        foo: 'bar'
      },
      pathname: '/logout'
    });
  });

  test('should return to the custom path', async () => {
    const customReturnTo = 'https://www.foo.bar';
    const baseUrl = await setup(withoutApi, {
      logoutOptions: { returnTo: customReturnTo }
    });
    const cookieJar = await login(baseUrl);

    const {
      res: { statusCode, headers }
    } = await get(baseUrl, '/api/access/logout', {
      cookieJar,
      fullResponse: true
    });

    expect(statusCode).toBe(302);
    expect(parseUrl(headers['location'], true).query).toMatchObject({
      returnTo: 'https://www.foo.bar'
    });
  });

  test('should use end_session_endpoint when configured', async () => {
    const baseUrl = await setup(
      { ...withoutApi, earthoLogout: false },
      {
        discoveryOptions: { end_session_endpoint: 'https://my-end-session-endpoint/logout' }
      }
    );
    const cookieJar = await login(baseUrl);

    const {
      res: { statusCode, headers }
    } = await get(baseUrl, '/api/access/logout', {
      cookieJar,
      fullResponse: true
    });

    expect(statusCode).toBe(302);
    expect(parseUrl(headers['location'])).toMatchObject({
      host: 'my-end-session-endpoint',
      pathname: '/logout'
    });
  });

  test('should use eartho logout by default even when end_session_endpoint is discovered', async () => {
    const baseUrl = await setup(withoutApi, {
      discoveryOptions: { end_session_endpoint: 'https://my-end-session-endpoint/logout' }
    });
    const cookieJar = await login(baseUrl);

    const {
      res: { statusCode, headers }
    } = await get(baseUrl, '/api/access/logout', {
      cookieJar,
      fullResponse: true
    });

    expect(statusCode).toBe(302);
    expect(parseUrl(headers['location'])).toMatchObject({
      host: 'acme.eartho.local',
      pathname: '/logout'
    });
  });

  test('should delete the session', async () => {
    const baseUrl = await setup(withoutApi, {
      discoveryOptions: { end_session_endpoint: 'https://my-end-session-endpoint/logout' }
    });
    const cookieJar = await login(baseUrl);

    const {
      res: { headers }
    } = await get(baseUrl, '/api/access/logout', {
      cookieJar,
      fullResponse: true
    });

    expect(parse(headers['set-cookie'][0])).toMatchObject({
      appSession: '',
      'Max-Age': '0',
      Path: '/'
    });
  });

  test('should delete tshe session', async () => {
    const baseUrl = await setup(withoutApi);
    const cookieJar = await login(baseUrl);

    jest.spyOn(ServerResponse.prototype, 'writeHead').mockImplementationOnce(() => {
      throw new Error('write err');
    });
    await expect(get(baseUrl, '/api/access/logout', { cookieJar })).rejects.toThrowError(
      /Logout handler failed. CAUSE: write err/
    );
  });
});
