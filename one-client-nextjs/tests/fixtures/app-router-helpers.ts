import nock from 'nock';
import { default as nodeFetch } from 'node-fetch';
import { NextRequest, NextResponse } from 'next/server';
import {
  EarthoServer,
  CallbackOptions,
  Claims,
  ConfigParameters,
  initEartho as nodeInitEartho,
  LoginOptions,
  LogoutOptions,
  ProfileOptions
} from '../../src';
import { initEartho as edgeInitEartho } from '../../src/edge';
import { withApi } from './default-settings';
import { setupNock } from './setup';
import { StatelessSession } from '../../src/eartho-session';
import { getConfig } from '../../src/config';
import { EarthoNextRequest } from '../../src/http';
import { encodeState } from '../../src/eartho-session/utils/encoding';
import { signCookie } from '../eartho-session/fixtures/helpers';

const isEdgeRuntime =
  // @ts-ignore
  typeof EdgeRuntime !== 'undefined';

export const initEartho = (config: ConfigParameters) => {
  if (isEdgeRuntime) {
    return edgeInitEartho(config);
  }
  return nodeInitEartho(config);
};

export const mockFetch = () => {
  if (isEdgeRuntime) {
    jest.spyOn(globalThis, 'fetch').mockImplementation((...args: any[]) =>
      (nodeFetch as any)(...args).then(async (res: any) => {
        const res2 = new Response(await res.text(), {
          headers: Object.fromEntries(res.headers.entries()),
          status: res.status
        });
        Object.defineProperty(res2, 'url', { value: args[0] });
        return res2;
      })
    );
  }
};

export type GetResponseOpts = {
  url: string;
  config?: ConfigParameters;
  cookies?: { [key: string]: string };
  idTokenClaims?: Claims;
  discoveryOptions?: Record<string, string>;
  userInfoPayload?: Record<string, string>;
  userInfoToken?: string;
  callbackOpts?: CallbackOptions;
  loginOpts?: LoginOptions;
  logoutOpts?: LogoutOptions;
  profileOpts?: ProfileOptions;
  extraHandlers?: any;
  clearNock?: boolean;
  earthoInstance?: EarthoServer;
  reqInit?: RequestInit;
  parStatus?: number;
  parPayload?: Record<string, unknown>;
};

export type LoginOpts = Omit<GetResponseOpts, 'url'>;

export const getResponse = async ({
  url,
  config,
  cookies,
  idTokenClaims,
  discoveryOptions,
  userInfoPayload,
  userInfoToken,
  callbackOpts,
  loginOpts,
  logoutOpts,
  profileOpts,
  extraHandlers,
  clearNock = true,
  earthoInstance,
  reqInit,
  parStatus,
  parPayload
}: GetResponseOpts) => {
  const opts = { ...withApi, ...config };
  clearNock && nock.cleanAll();
  await setupNock(opts, { idTokenClaims, discoveryOptions, userInfoPayload, userInfoToken, parPayload, parStatus });
  const eartho = url.split('?')[0].split('/').slice(3);
  const instance = earthoInstance || initEartho(opts);
  const handleAccess = instance.handleAccess({
    ...(callbackOpts && { callback: instance.handleCallback(callbackOpts) }),
    ...(loginOpts && { login: instance.handleConnect(loginOpts) }),
    ...(logoutOpts && { logout: instance.handleLogout(logoutOpts) }),
    ...(profileOpts && { profile: instance.handleProfile(profileOpts) }),
    onError(_req: any, error: any) {
      return new Response(null, { status: error.status || 500, statusText: error.message });
    },
    ...extraHandlers
  });
  let headers = new Headers();
  if (cookies) {
    headers.set(
      'Cookie',
      Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ')
    );
  }
  return handleAccess(new NextRequest(new URL(url, opts.baseURL), { headers, ...reqInit } as any), { params: { eartho } });
};

export const getSession = async (config: any, res: NextResponse) => {
  const req = new NextRequest('https://example.com');
  res.cookies
    .getAll()
    .forEach(({ name, value }: { name: string; value: string }) => value && req.cookies.set(name, value));

  const store = new StatelessSession(getConfig(config));
  const [session] = await store.read(new EarthoNextRequest(req));
  return session;
};

export const login = async (opts: LoginOpts = {}) => {
  const state = encodeState({ returnTo: '/' });
  return await getResponse({
    ...opts,
    url: `/api/access/callback?state=${state}&code=code`,
    cookies: {
      ...opts.cookies,
      auth_verification: await signCookie(
        'auth_verification',
        JSON.stringify({ state, nonce: '__test_nonce__', code_verifier: '__test_code_verifier__' })
      )
    }
  });
};
