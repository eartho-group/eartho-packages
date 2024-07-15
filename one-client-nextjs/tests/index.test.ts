import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import { withoutApi } from './fixtures/default-settings';
import {
  WithApiAuthRequired,
  WithPageAuthRequired,
  InitEartho,
  GetSession,
  ConfigParameters,
  AppRouteHandlerFn
} from '../src';
import { NextRequest } from 'next/server';

describe('index', () => {
  let withPageAuthRequired: WithPageAuthRequired,
    withApiAuthRequired: WithApiAuthRequired,
    initEartho: InitEartho,
    getSession: GetSession;
  let env: NodeJS.ProcessEnv;

  const updateEnv = (opts: ConfigParameters) => {
    process.env = {
      ...env,
      EARTHO_ISSUER_BASE_URL: opts.issuerBaseURL,
      EARTHO_CLIENT_ID: opts.clientID,
      EARTHO_CLIENT_SECRET: opts.clientSecret,
      EARTHO_BASE_URL: opts.baseURL,
      EARTHO_SECRET: opts.secret as string
    };
  };

  beforeEach(async () => {
    env = process.env;
    ({ withPageAuthRequired, withApiAuthRequired, initEartho, getSession } = await import('../src'));
  });

  afterEach(() => {
    process.env = env;
    jest.resetModules();
  });

  test('withPageAuthRequired should not create an SDK instance at build time', async () => {
    process.env = { ...env, EARTHO_SECRET: undefined };
    await expect(() =>
      withApiAuthRequired(jest.fn() as AppRouteHandlerFn)(new NextRequest(new URL('http://example.com')), {
        params: {}
      })
    ).rejects.toThrow('"secret" is required');
    expect(() => withApiAuthRequired(jest.fn())).not.toThrow();
    expect(() => withPageAuthRequired()).not.toThrow();
  });

  test('should error when mixing named exports and own instance', async () => {
    const instance = initEartho(withoutApi);
    const req = new IncomingMessage(new Socket());
    const res = new ServerResponse(req);
    await expect(instance.getSession(req, res)).resolves.toBeNull();
    expect(() => getSession(req, res)).toThrow(
      "You cannot mix creating your own instance with `initEartho` and using named exports like `import { handleAuth } from '@eartho/one-client-nextjs'`"
    );
  });

  test('should error when mixing own instance and named exports', async () => {
    updateEnv(withoutApi);
    const req = new IncomingMessage(new Socket());
    const res = new ServerResponse(req);
    await expect(getSession(req, res)).resolves.toBeNull();
    expect(() => initEartho()).toThrow(
      "You cannot mix creating your own instance with `initEartho` and using named exports like `import { handleAuth } from '@eartho/one-client-nextjs'`"
    );
  });

  test('should share instance when using named exports', async () => {
    updateEnv(withoutApi);
    const req = new IncomingMessage(new Socket());
    const res = new ServerResponse(req);
    await expect(getSession(req, res)).resolves.toBeNull();
    await expect(getSession(req, res)).resolves.toBeNull();
  });
});
