import crypto from 'crypto';
import {
  EarthoServer as EarthoServerShared,
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
  WithApiAuthRequired,
  WithPageAuthRequired
} from './shared';
import { _initAuth } from './init';
import { setIsUsingNamedExports, setIsUsingOwnInstance } from './utils/instance-check';
import { clientGetter } from './eartho-session/client/node-client';

const genId = () => crypto.randomBytes(16).toString('hex');

export type EarthoServer = Omit<EarthoServerShared, 'withMiddlewareAccessRequired'>;

let instance: EarthoServerShared;

/**
 * Initialise your own instance of the SDK.
 *
 * See {@link ConfigParameters}.
 *
 * @category Server
 */
export type InitEartho = (params?: ConfigParameters) => Omit<EarthoServer, 'withMiddlewareAccessRequired'>;

// For using managed instance with named exports.
function getInstance(): EarthoServerShared {
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
  const { withMiddlewareAccessRequired, ...publicApi } = _initAuth({
    genId,
    params,
    clientGetter
  });
  return publicApi;
};

export const getSession: GetSession = (...args) => getInstance().getSession(...args);
export const updateSession: UpdateSession = (...args) => getInstance().updateSession(...args);
export const getAccessToken: GetAccessToken = (...args) => getInstance().getAccessToken(...args);
export const touchSession: TouchSession = (...args) => getInstance().touchSession(...args);

export const withApiAuthRequired: WithApiAuthRequired = (...args) =>
  (getInstance().withApiAuthRequired as any)(...args);
export const withPageAuthRequired: WithPageAuthRequired = ((...args: Parameters<WithPageAuthRequired>) =>
  getInstance().withPageAuthRequired(...args)) as WithPageAuthRequired;

export const handleConnect: HandleConnect = ((...args: Parameters<HandleConnect>) =>
  getInstance().handleConnect(...args)) as HandleConnect;
export const handleLogout: HandleLogout = ((...args: Parameters<HandleLogout>) =>
  getInstance().handleLogout(...args)) as HandleLogout;
export const handleCallback: HandleCallback = ((...args: Parameters<HandleCallback>) =>
  getInstance().handleCallback(...args)) as HandleCallback;
export const handleProfile: HandleProfile = ((...args: Parameters<HandleProfile>) =>
  getInstance().handleProfile(...args)) as HandleProfile;
export const handleAccess: HandleAccess = (...args) => getInstance().handleAccess(...args);

export * from './shared';
export * from './extensions';
