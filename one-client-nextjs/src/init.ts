import {
  TransientStore,
  loginHandler as baseLoginHandler,
  logoutHandler as baseLogoutHandler,
  callbackHandler as baseCallbackHandler,
  backchannelLogoutHandler as baseBackchannelLogoutHandler,
  Telemetry
} from './eartho-session';
import {
  handlerFactory,
  callbackHandler,
  loginHandler,
  logoutHandler,
  profileHandler,
  backchannelLogoutHandler
} from './handlers';
import { sessionFactory, accessTokenFactory, SessionCache, touchSessionFactory, updateSessionFactory } from './session';
import { withClientAccessRequiredFactory, withServerAccessRequiredFactory } from './helpers';
import { configSingletonGetter, ConfigParameters } from './config';
import { EarthoServer, telemetry } from './shared';
import withMiddlewareAccessRequiredFactory from './helpers/with-middleware-access-required';
import { GetClient } from './eartho-session/client/abstract-client';
import handlePopupCallbackFactory from './handlers/callback-popup';

/**
 * Initialise your own instance of the SDK.
 *
 * See {@link ConfigParameters}.
 *
 * @category Server
 */
export type InitEartho = (params?: ConfigParameters) => EarthoServer;

export const _initAuth = ({
  params,
  genId,
  clientGetter
}: {
  params?: ConfigParameters;
  genId: () => string;
  clientGetter: (telemetry: Telemetry) => GetClient;
}): EarthoServer => {
  const getConfig = configSingletonGetter(params, genId);
  const getClient = clientGetter(telemetry);

  // Init base layer (with base config)
  const transientStore = new TransientStore(getConfig);

  const sessionCache = new SessionCache(getConfig);
  const baseHandleConnect = baseLoginHandler(getConfig, getClient, transientStore);
  const baseHandleLogout = baseLogoutHandler(getConfig, getClient, sessionCache);
  const baseHandleCallback = baseCallbackHandler(getConfig, getClient, sessionCache, transientStore);
  const baseHandleBackchannelLogout = baseBackchannelLogoutHandler(getConfig, getClient);

  // Init Next layer (with next config)
  const getSession = sessionFactory(sessionCache);
  const touchSession = touchSessionFactory(sessionCache);
  const updateSession = updateSessionFactory(sessionCache);
  const getAccessToken = accessTokenFactory(getConfig, getClient, sessionCache);

  const handleConnect = loginHandler(baseHandleConnect, getConfig);
  const handleLogout = logoutHandler(baseHandleLogout);
  const handleCallback = callbackHandler(baseHandleCallback, getConfig);
  const handlePopupCallback = handlePopupCallbackFactory();
  const handleBackchannelLogout = backchannelLogoutHandler(baseHandleBackchannelLogout, getConfig);
  const handleProfile = profileHandler(getConfig, getClient, getAccessToken, sessionCache);
  const handleAccess = handlerFactory({
    handleConnect,
    handleLogout,
    handleCallback,
    handlePopupCallback,
    handleProfile,
    handleBackchannelLogout
  });

  const withServerAccessRequired = withServerAccessRequiredFactory(sessionCache);
  const withClientAccessRequired = withClientAccessRequiredFactory(getConfig, sessionCache);
  const withMiddlewareAccessRequired = withMiddlewareAccessRequiredFactory(getConfig, sessionCache);

  return {
    getSession,
    touchSession,
    updateSession,
    getAccessToken,

    withServerAccessRequired,
    withClientAccessRequired,
    withMiddlewareAccessRequired,

    handleConnect,
    handleLogout,
    handleCallback,
    handleBackchannelLogout,
    handleProfile,
    handleAccess
  };
};
