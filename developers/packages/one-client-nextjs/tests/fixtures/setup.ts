import { IncomingMessage, ServerResponse } from 'http';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import nock from 'nock';
import { CookieJar } from 'tough-cookie';
import {
  CallbackOptions,
  ConfigParameters,
  LoginOptions,
  LogoutOptions,
  ProfileOptions,
  WithClientAccessRequiredPageRouterOptions,
  initEartho,
  AccessTokenRequest,
  Claims,
  PageRouterOnError,
  HandleConnect,
  HandleLogout,
  HandleCallback,
  HandleProfile,
  HandleBackchannelLogout
} from '../../src';
import { codeExchange, discovery, jwksEndpoint, par, userInfo } from './oidc-nocks';
import { jwks, makeIdToken } from '../eartho-session/fixtures/cert';
import { start, stop } from './server';
import { encodeState } from '../../src/eartho-session/utils/encoding';
import { post, toSignedCookieJar } from '../eartho-session/fixtures/helpers';

export type SetupOptions = {
  idTokenClaims?: Claims;
  callbackHandler?: HandleCallback;
  callbackOptions?: CallbackOptions;
  loginHandler?: HandleConnect;
  loginOptions?: LoginOptions;
  logoutHandler?: HandleLogout;
  logoutOptions?: LogoutOptions;
  profileHandler?: HandleProfile;
  backchannelLogoutHandler?: HandleBackchannelLogout;
  profileOptions?: ProfileOptions;
  withClientAccessRequiredOptions?: WithClientAccessRequiredPageRouterOptions;
  getAccessTokenOptions?: AccessTokenRequest;
  onError?: PageRouterOnError;
  discoveryOptions?: Record<string, any>;
  userInfoPayload?: Record<string, string>;
  userInfoToken?: string;
  asyncProps?: boolean;
  parStatus?: number;
  parPayload?: Record<string, unknown>;
};

export const defaultOnError: PageRouterOnError = (_req, res, error) => {
  res.statusMessage = error.message;
  res.status(error.status || 500).end(error.message);
};

export const setupNock = async (
  config: ConfigParameters,
  {
    idTokenClaims,
    discoveryOptions,
    userInfoPayload = {},
    userInfoToken = 'eyJz93a...k4laUWw',
    parStatus = 201,
    parPayload = { request_uri: 'foo', expires_in: 100 }
  }: Pick<
    SetupOptions,
    'idTokenClaims' | 'discoveryOptions' | 'userInfoPayload' | 'userInfoToken' | 'parStatus' | 'parPayload'
  > = {}
) => {
  discovery(config, discoveryOptions);
  jwksEndpoint(config, jwks);
  codeExchange(config, await makeIdToken({ iss: 'https://acme.eartho.local/', ...idTokenClaims }));
  userInfo(config, userInfoToken, userInfoPayload);
  par(config, parStatus, parPayload);
};

export const setup = async (
  config: ConfigParameters,
  {
    idTokenClaims,
    callbackHandler,
    callbackOptions,
    logoutHandler,
    logoutOptions,
    loginHandler,
    loginOptions,
    profileHandler,
    backchannelLogoutHandler,
    profileOptions,
    withClientAccessRequiredOptions,
    onError = defaultOnError,
    getAccessTokenOptions,
    discoveryOptions,
    userInfoPayload = {},
    userInfoToken = 'eyJz93a...k4laUWw',
    asyncProps
  }: SetupOptions = {}
): Promise<string> => {
  await setupNock(config, { idTokenClaims, discoveryOptions, userInfoPayload, userInfoToken });
  const {
    handleAccess,
    handleCallback,
    handleConnect,
    handleLogout,
    handleBackchannelLogout,
    handleProfile,
    getSession,
    touchSession,
    updateSession,
    getAccessToken,
    withServerAccessRequired,
    withClientAccessRequired
  } = initEartho(config);
  const callback: NextApiHandler = (...args) => (callbackHandler || handleCallback)(...args, callbackOptions);
  const login: NextApiHandler = (...args) => (loginHandler || handleConnect)(...args, loginOptions);
  const logout: NextApiHandler = (...args) => (logoutHandler || handleLogout)(...args, logoutOptions);
  const profile: NextApiHandler = (...args) => (profileHandler || handleProfile)(...args, profileOptions);
  const backchannelLogout: NextApiHandler = (...args) => (backchannelLogoutHandler || handleBackchannelLogout)(...args);
  const handlers: { [key: string]: NextApiHandler } = {
    onError: onError as any,
    callback,
    login,
    logout,
    profile,
    'backchannel-logout:': backchannelLogout
  };
  global.handleAccess = handleAccess.bind(null, handlers);
  global.getSession = getSession;
  global.touchSession = touchSession;
  global.updateSession = updateSession;
  global.withServerAccessRequired = withServerAccessRequired;
  global.withClientAccessRequired = (): any => withClientAccessRequired(withClientAccessRequiredOptions);
  global.withClientAccessRequiredCSR = withClientAccessRequired;
  global.getAccessToken = (req: IncomingMessage | NextApiRequest, res: ServerResponse | NextApiResponse) =>
    getAccessToken(req, res, getAccessTokenOptions);
  global.onError = onError;
  global.asyncProps = asyncProps;
  return start();
};

export const teardown = async (): Promise<void> => {
  nock.cleanAll();
  await stop();
  delete global.getSession;
  delete global.touchSession;
  delete global.updateSession;
  delete global.handleAccess;
  delete global.withServerAccessRequired;
  delete global.withClientAccessRequired;
  delete global.withClientAccessRequiredCSR;
  delete global.getAccessToken;
  delete global.onError;
  delete global.asyncProps;
};

export const login = async (baseUrl: string): Promise<CookieJar> => {
  const nonce = '__test_nonce__';
  const state = encodeState({ returnTo: '/' });
  const cookieJar = await toSignedCookieJar({ auth_verification: JSON.stringify({ state, nonce }) }, baseUrl);
  await post(baseUrl, '/api/access/callback', {
    fullResponse: true,
    body: {
      state,
      code: 'code'
    },
    cookieJar
  });
  return cookieJar;
};
