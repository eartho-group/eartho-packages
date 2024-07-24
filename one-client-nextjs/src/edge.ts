import {
  EarthoServer,
  ConfigParameters,
  GetAccessToken,
  GetSession,
  HandleAccess,
  HandleCallback,
  HandleConnect,
  HandleLogout,
  HandleProfile,
  TouchSession,
  UpdateSession,
  WithServerAccessRequired,
  WithClientAccessRequired
} from './shared';
import { _initAuth } from './init';
import { setIsUsingNamedExports, setIsUsingOwnInstance } from './utils/instance-check';
import { clientGetter } from './eartho-session/client/edge-client';
import { WithMiddlewareAccessRequired } from './helpers/with-middleware-access-required';
import { NextRequest } from 'next/server';

const genId = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

let instance: EarthoServer;

/**
 * Initialise your own instance of the SDK.
 *
 * See {@link ConfigParameters}.
 *
 * @category Server
 */
export type InitEartho = (params?: ConfigParameters) => EarthoServer;

// For using managed instance with named exports.
function getInstance(): EarthoServer {
  setIsUsingNamedExports();
  if (instance) {
    return instance;
  }
  instance = _initAuth({ genId, clientGetter });
  return instance;
}

// For creating own instance.
export const initEartho: InitEartho = (params) => {
  setIsUsingOwnInstance();
  return _initAuth({ genId, clientGetter, params });
};

export const getSession: GetSession = (...args) => getInstance().getSession(...args);
export const updateSession: UpdateSession = (...args) => getInstance().updateSession(...args);
export const getAccessToken: GetAccessToken = (...args) => getInstance().getAccessToken(...args);
export const touchSession: TouchSession = (...args) => getInstance().touchSession(...args);
export const withServerAccessRequired: WithServerAccessRequired = (...args) =>
  (getInstance().withServerAccessRequired as any)(...args);
export const withClientAccessRequired: WithClientAccessRequired = ((...args: Parameters<WithClientAccessRequired>) =>
  getInstance().withClientAccessRequired(...args)) as WithClientAccessRequired;
export const handleConnect: HandleConnect = ((...args: Parameters<HandleConnect>) =>
  getInstance().handleConnect(...args)) as HandleConnect;
export const handleLogout: HandleLogout = ((...args: Parameters<HandleLogout>) =>
  getInstance().handleLogout(...args)) as HandleLogout;
export const handleCallback: HandleCallback = ((...args: Parameters<HandleCallback>) =>
  getInstance().handleCallback(...args)) as HandleCallback;
export const handleProfile: HandleProfile = ((...args: Parameters<HandleProfile>) =>
  getInstance().handleProfile(...args)) as HandleProfile;
export const handleAccess: HandleAccess = (...args) => getInstance().handleAccess(...args);
export const withMiddlewareAccessRequired: WithMiddlewareAccessRequired = (...args) =>
  getInstance().withMiddlewareAccessRequired(...args);

export * from './shared';
