import { withoutApi } from '../fixtures/default-settings';
import { post, Store } from '../eartho-session/fixtures/helpers';

import { setup, teardown } from '../fixtures/setup';
import { makeLogoutToken } from '../eartho-session/fixtures/cert';

describe('backchannel-logout handler (page router)', () => {
  afterEach(teardown);

  test('should 404 when backchannel logout is disabled', async () => {
    const baseUrl = await setup(withoutApi);

    await expect(post(baseUrl, '/api/access/backchannel-logout', { fullResponse: true, body: '' })).rejects.toThrow(
      'Not Found'
    );
  });

  test('should error when misconfigured', async () => {
    const baseUrl = await setup({ ...withoutApi, backchannelLogout: true });

    await expect(post(baseUrl, '/api/access/backchannel-logout', { fullResponse: true, body: '' })).rejects.toThrow(
      'Bad Request'
    );
  });

  test('should error when misconfigured', async () => {
    const baseUrl = await setup({ ...withoutApi, backchannelLogout: true });

    await expect(post(baseUrl, '/api/access/backchannel-logout', { fullResponse: true, body: '' })).rejects.toThrow(
      'Bad Request'
    );
  });

  test('should error when an invalid logout token is provided', async () => {
    const baseUrl = await setup({ ...withoutApi, backchannelLogout: { store: new Store() } });

    await expect(
      post(baseUrl, '/api/access/backchannel-logout', { fullResponse: true, body: 'logout_token=foo' })
    ).rejects.toThrow('Bad Request');
  });

  test('should succeed when a valid logout token is provided', async () => {
    const logoutToken = await makeLogoutToken({ iss: 'https://acme.eartho.local/', sid: 'foo' });
    const baseUrl = await setup({ ...withoutApi, backchannelLogout: { store: new Store() } });

    await expect(
      post(baseUrl, '/api/access/backchannel-logout', { fullResponse: true, body: `logout_token=${logoutToken}` })
    ).resolves.toMatchObject({ res: { statusCode: 204 } });
  });

  test('should save tokens into the store when a valid logout token is provided', async () => {
    const store = new Store();
    const logoutToken = await makeLogoutToken({ iss: 'https://acme.eartho.local/', sid: 'foo', sub: 'bar' });
    const baseUrl = await setup({ ...withoutApi, backchannelLogout: { store } });

    const { res } = await post(baseUrl, '/api/access/backchannel-logout', {
      fullResponse: true,
      body: `logout_token=${logoutToken}`
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['cache-control']).toBe('no-store');
    await expect(store.get('sid|__test_client_id__|foo')).resolves.toMatchObject({ data: {} });
    await expect(store.get('sub|__test_client_id__|bar')).resolves.toMatchObject({ data: {} });
  });
});
