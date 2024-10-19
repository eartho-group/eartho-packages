import { IncomingMessage, ServerResponse } from 'http';
import { NextApiHandler } from 'next';
import { withoutApi } from '../fixtures/default-settings';
import { login, setup, teardown } from '../fixtures/setup';
import { get } from '../eartho-session/fixtures/helpers';
import { initEartho } from '../../src';
import { LoginOptions, LogoutOptions, CallbackOptions, ProfileOptions } from '../../src/handlers';
import * as baseLoginHandler from '../../src/eartho-session/handlers/login';
import * as baseLogoutHandler from '../../src/eartho-session/handlers/logout';
import * as baseCallbackHandler from '../../src/eartho-session/handlers/callback';
import { Handler } from '../../src/handlers/router-helpers';

const handlerError = () =>
  expect.objectContaining({
    status: 400,
    code: 'ERR_CALLBACK_HANDLER_FAILURE'
  });

describe('auth handler (page router)', () => {
  afterEach(teardown);

  test('return 500 for unexpected error', async () => {
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess;
    delete global.onError;
    jest.spyOn(console, 'error').mockImplementation((error) => {
      delete error.status;
    });
    await expect(get(baseUrl, '/api/access/callback?error=foo&error_description=bar&state=foo')).rejects.toThrow(
      'Internal Server Error'
    );
  });

  test('return 404 for unknown routes', async () => {
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess;
    await expect(get(baseUrl, '/api/access/foo')).rejects.toThrow('Not Found');
  });

  test('return 404 for unknown routes including builtin props', async () => {
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess;
    await expect(get(baseUrl, '/api/access/__proto__')).rejects.toThrow('Not Found');
  });

  test('return 404 when routes have extra parts', async () => {
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess;
    await expect(get(baseUrl, '/api/access/me.css')).rejects.toThrow('Not Found');
    await expect(get(baseUrl, '/api/access/me/foo.css')).rejects.toThrow('Not Found');
    await expect(get(baseUrl, '/api/access/me/foo/bar.css')).rejects.toThrow('Not Found');
  });

  test('accept custom error handler', async () => {
    const onError = jest.fn((_req, res) => res.end());
    const baseUrl = await setup(withoutApi, { onError });
    await get(baseUrl, '/api/access/callback?error=foo&error_description=bar&state=foo');
    expect(onError).toHaveBeenCalledWith(expect.any(IncomingMessage), expect.any(ServerResponse), handlerError());
  });

  test('use default error handler', async () => {
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess;
    delete global.onError;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(get(baseUrl, '/api/access/callback?error=foo&error_description=bar&state=foo')).rejects.toThrow(
      'Bad Request'
    );
    expect(console.error).toHaveBeenCalledWith(handlerError());
  });

  test('finish response if custom error does not', async () => {
    const onError = jest.fn();
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess.bind(null, { onError });
    await expect(
      get(baseUrl, '/api/access/callback?error=foo&error_description=bar&state=foo', { fullResponse: true })
    ).rejects.toThrow('Internal Server Error');
    expect(onError).toHaveBeenCalledWith(expect.any(IncomingMessage), expect.any(ServerResponse), handlerError());
  });

  test('finish response with custom error status', async () => {
    const onError = jest.fn((_req, res) => res.status(418));
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess.bind(null, { onError });
    await expect(
      get(baseUrl, '/api/access/callback?error=foo&error_description=bar&state=foo', { fullResponse: true })
    ).rejects.toThrow("I'm a Teapot");
    expect(onError).toHaveBeenCalledWith(expect.any(IncomingMessage), expect.any(ServerResponse), handlerError());
  });

  test('accept custom login handler', async () => {
    const login = jest.fn(async (_req, res) => {
      res.end();
    }) as NextApiHandler as Handler;
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess.bind(null, { login });
    await get(baseUrl, '/api/access/login');
    expect(login).toHaveBeenCalledWith(expect.any(IncomingMessage), expect.any(ServerResponse));
  });

  test('accept custom logout handler', async () => {
    const logout = jest.fn(async (_req, res) => {
      res.end();
    }) as NextApiHandler as Handler;
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess.bind(null, { logout });
    await get(baseUrl, '/api/access/logout');
    expect(logout).toHaveBeenCalledWith(expect.any(IncomingMessage), expect.any(ServerResponse));
  });

  test('accept custom callback handler', async () => {
    const callback = jest.fn(async (_req, res) => {
      res.end();
    }) as NextApiHandler as Handler;
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess.bind(null, { callback });
    await get(baseUrl, '/api/access/callback');
    expect(callback).toHaveBeenCalledWith(expect.any(IncomingMessage), expect.any(ServerResponse));
  });

  test('accept custom profile handler', async () => {
    const profile = jest.fn(async (_req, res) => {
      res.end();
    }) as NextApiHandler as Handler;
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess.bind(null, { profile });
    await get(baseUrl, '/api/access/me');
    expect(profile).toHaveBeenCalledWith(expect.any(IncomingMessage), expect.any(ServerResponse));
  });

  test('accept custom arbitrary handler', async () => {
    const signup = jest.fn(async (_req, res) => {
      res.end();
    }) as NextApiHandler as Handler;
    const baseUrl = await setup(withoutApi);
    global.handleAccess = initEartho(withoutApi).handleAccess.bind(null, { signup });
    await get(baseUrl, '/api/access/signup');
    expect(signup).toHaveBeenCalledWith(expect.any(IncomingMessage), expect.any(ServerResponse));
  });

  test('accept custom login options', async () => {
    const loginHandler = jest.fn(async (_req: any, res: any) => {
      res.res.end();
    });
    jest.spyOn(baseLoginHandler, 'default').mockImplementation(() => loginHandler);
    const options: LoginOptions = { authorizationParams: { scope: 'openid' } };
    const baseUrl = await setup(withoutApi);
    const { handleConnect, handleAccess } = initEartho(withoutApi);
    global.handleAccess = handleAccess.bind(null, {
      login: handleConnect(options)
    });
    await get(baseUrl, '/api/access/login');
    expect(loginHandler).toHaveBeenCalledWith(
      expect.objectContaining({ req: expect.any(IncomingMessage) }),
      expect.objectContaining({ res: expect.any(ServerResponse) }),
      options
    );
  });

  test('accept custom logout options', async () => {
    const logoutHandler = jest.fn(async (_req: any, res: any) => {
      res.res.end();
    });
    jest.spyOn(baseLogoutHandler, 'default').mockImplementation(() => logoutHandler);
    const options: LogoutOptions = { returnTo: '/foo' };
    const baseUrl = await setup(withoutApi);
    const { handleLogout, handleAccess } = initEartho(withoutApi);
    global.handleAccess = handleAccess.bind(null, {
      logout: handleLogout(options)
    });
    await get(baseUrl, '/api/access/logout');
    expect(logoutHandler).toHaveBeenCalledWith(
      expect.objectContaining({ req: expect.any(IncomingMessage) }),
      expect.objectContaining({ res: expect.any(ServerResponse) }),
      options
    );
  });

  test('accept custom callback options', async () => {
    const callbackHandler = jest.fn(async (_req: any, res: any) => {
      res.res.end();
    });
    jest.spyOn(baseCallbackHandler, 'default').mockImplementation(() => callbackHandler);
    const options: CallbackOptions = { redirectUri: '/foo' };
    const baseUrl = await setup(withoutApi);
    const { handleCallback, handleAccess } = initEartho(withoutApi);
    global.handleAccess = handleAccess.bind(null, {
      callback: handleCallback(options)
    });
    await get(baseUrl, '/api/access/callback');
    expect(callbackHandler).toHaveBeenCalledWith(
      expect.objectContaining({ req: expect.any(IncomingMessage) }),
      expect.objectContaining({ res: expect.any(ServerResponse) }),
      expect.objectContaining(options)
    );
  });

  test('accept custom profile options', async () => {
    const afterRefetch = jest.fn(async (_req, _res, session) => session);
    const options: ProfileOptions = { refetch: true, afterRefetch };
    const baseUrl = await setup(withoutApi);
    const { handleProfile, handleAccess } = initEartho(withoutApi);
    global.handleAccess = handleAccess.bind(null, {
      profile: handleProfile(options)
    });
    const cookieJar = await login(baseUrl);
    await get(baseUrl, '/api/access/me', { cookieJar });
    expect(afterRefetch).toHaveBeenCalled();
  });

  test('accept custom login options provider', async () => {
    const loginHandler = jest.fn(async (_req: any, res: any) => {
      res.res.end();
    });
    jest.spyOn(baseLoginHandler, 'default').mockImplementation(() => loginHandler);
    const options = { authorizationParams: { scope: 'openid' } };
    const optionsProvider = jest.fn(() => options);
    const baseUrl = await setup(withoutApi);
    const { handleConnect, handleAccess } = initEartho(withoutApi);

    global.handleAccess = handleAccess.bind(null, {
      login: handleConnect(optionsProvider)
    });
    await get(baseUrl, '/api/access/login');
    expect(optionsProvider).toHaveBeenCalled();
    expect(loginHandler).toHaveBeenCalledWith(
      expect.objectContaining({ req: expect.any(IncomingMessage) }),
      expect.objectContaining({ res: expect.any(ServerResponse) }),
      options
    );
  });

  test('accept custom logout options provider', async () => {
    const logoutHandler = jest.fn(async (_req: any, res: any) => {
      res.res.end();
    });
    jest.spyOn(baseLogoutHandler, 'default').mockImplementation(() => logoutHandler);
    const options: LogoutOptions = { returnTo: '/foo' };
    const optionsProvider = jest.fn(() => options);
    const baseUrl = await setup(withoutApi);
    const { handleLogout, handleAccess } = initEartho(withoutApi);
    global.handleAccess = handleAccess.bind(null, {
      logout: handleLogout(optionsProvider)
    });
    await get(baseUrl, '/api/access/logout');
    expect(optionsProvider).toHaveBeenCalled();
    expect(logoutHandler).toHaveBeenCalledWith(
      expect.objectContaining({ req: expect.any(IncomingMessage) }),
      expect.objectContaining({ res: expect.any(ServerResponse) }),
      options
    );
  });

  test('accept custom callback options provider', async () => {
    const callbackHandler = jest.fn(async (_req: any, res: any) => {
      res.res.end();
    });
    jest.spyOn(baseCallbackHandler, 'default').mockImplementation(() => callbackHandler);
    const options: CallbackOptions = { redirectUri: '/foo' };
    const optionsProvider = jest.fn(() => options);
    const baseUrl = await setup(withoutApi);
    const { handleCallback, handleAccess } = initEartho(withoutApi);
    global.handleAccess = handleAccess.bind(null, {
      callback: handleCallback(optionsProvider)
    });
    await get(baseUrl, '/api/access/callback');
    expect(optionsProvider).toHaveBeenCalled();
    expect(callbackHandler).toHaveBeenCalledWith(
      expect.objectContaining({ req: expect.any(IncomingMessage) }),
      expect.objectContaining({ res: expect.any(ServerResponse) }),
      expect.objectContaining(options)
    );
  });

  test('accept custom profile options provider', async () => {
    const afterRefetch = jest.fn(async (_req, _res, session) => session);
    const options: ProfileOptions = { refetch: true, afterRefetch };
    const optionsProvider = jest.fn(() => options);
    const baseUrl = await setup(withoutApi);
    const { handleProfile, handleAccess } = initEartho(withoutApi);
    global.handleAccess = handleAccess.bind(null, {
      profile: handleProfile(optionsProvider)
    });
    const cookieJar = await login(baseUrl);
    await get(baseUrl, '/api/access/me', { cookieJar });
    expect(optionsProvider).toHaveBeenCalled();
    expect(afterRefetch).toHaveBeenCalled();
  });
});
