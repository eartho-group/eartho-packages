import { EarthoOne } from '@eartho/one-client-js';
import { App, inject } from 'vue';
import { Router } from 'vue-router';
import { EARTHO_INJECTION_KEY, createEarthoOne, useEarthoOne } from '../src/index';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { client } from '../src/plugin';

const connectWithRedirectMock = jest.fn<any>().mockResolvedValue(null);
const connectWithPopupMock = jest.fn<any>().mockResolvedValue(null);
const logoutMock = jest.fn<any>();
const checkSessionMock = jest.fn<any>().mockResolvedValue(null);
const handleRedirectCallbackMock = jest.fn<any>().mockResolvedValue(null);
const isConnectedMock = jest.fn<any>().mockResolvedValue(false);
const getUserMock = jest.fn<any>().mockResolvedValue(null);
const getidTokenMock = jest.fn<any>().mockResolvedValue(null);
const buildAuthorizeUrlMock = jest.fn<any>().mockResolvedValue(null);
const buildLogoutUrlMock = jest.fn<any>().mockResolvedValue(null);
const getTokenSilentlyMock = jest.fn<any>().mockResolvedValue(null);
const getTokenWithPopupMock = jest.fn<any>().mockResolvedValue(null);

jest.mock('vue', () => {
  const originalModule = jest.requireActual('vue');
  return {
    __esModule: true,
    ...(originalModule as any),
    inject: jest.fn()
  };
});

jest.mock('@eartho/one-client-js', () => {
  return {
    EarthoOne: jest.fn().mockImplementation(() => {
      return {
        checkSession: checkSessionMock,
        handleRedirectCallback: handleRedirectCallbackMock,
        connectWithRedirect: connectWithRedirectMock,
        connectWithPopup: connectWithPopupMock,
        logout: logoutMock,
        isConnected: isConnectedMock,
        getUser: getUserMock,
        getidToken: getidTokenMock,
        buildAuthorizeUrl: buildAuthorizeUrlMock,
        buildLogoutUrl: buildLogoutUrlMock,
        getTokenSilently: getTokenSilentlyMock,
        getTokenWithPopup: getTokenWithPopupMock
      };
    })
  };
});

describe('Client', () => {
  it('logs console error when used before installing the plugin', async () => {
    const spy = jest.spyOn(console, 'error');

    await client.value.connectWithRedirect();

    expect(spy).toHaveBeenCalledWith(
      `Please ensure Eartho's Vue plugin is correctly installed.`
    );
  });
});

describe('createEarthoOne', () => {
  it('should create a plugin', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });
    expect(plugin.install).toBeTruthy();
  });
});

describe('useEarthoOne', () => {
  it('should call inject', async () => {
    const instance = {};
    (inject as jest.Mock).mockReturnValue(instance);
    const result = useEarthoOne();
    expect(result).toBe(instance);
  });
});

describe('EarthoPlugin', () => {
  const savedLocation = window.location;
  const savedHistory = window.history;
  let replaceStateMock = jest.fn();
  let appMock: App<any>;

  beforeEach(() => {
    delete (window as any).location;
    window.location = Object.assign(new URL('https://example.org'), {
      ancestorOrigins: '',
      assign: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn()
    }) as any;

    delete (window as any).history;
    window.history = {
      replaceState: replaceStateMock
    } as any;

    isConnectedMock.mockResolvedValue(false);
    getUserMock.mockResolvedValue(null);
    getidTokenMock.mockResolvedValue(null);
    connectWithRedirectMock.mockResolvedValue(null);
    connectWithPopupMock.mockResolvedValue(null);
    checkSessionMock.mockResolvedValue(null);

    appMock = {
      config: {
        globalProperties: {}
      },
      provide: jest.fn()
    } as any as App<any>;

    jest.restoreAllMocks();
  });
  afterEach(() => {
    window.location = savedLocation;
    window.history = savedHistory;
  });

  it('should create a proxy on installation', async () => {
    const plugin = createEarthoOne({
      domain: 'domain 123',
      clientId: 'client id 123',
      authorizationParams: {
        foo: 'bar'
      }
    });

    plugin.install(appMock);

    expect(appMock.config.globalProperties.$eartho).toBeTruthy();
    expect(appMock.provide).toHaveBeenCalledWith(
      EARTHO_INJECTION_KEY,
      expect.anything()
    );
    expect(EarthoOne).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'domain 123',
        clientId: 'client id 123',
        authorizationParams: {
          foo: 'bar'
        }
      })
    );
  });

  it('should swallow exceptions upon installation', async () => {
    const plugin = createEarthoOne({
      domain: 'domain 123',
      clientId: 'client id 123',
      authorizationParams: {
        foo: 'bar'
      }
    });

    handleRedirectCallbackMock.mockRejectedValue('Some Error');

    expect(() => plugin.install(appMock)).not.toThrow();
  });

  it('should redirect to / when handleRedirect failed upon installation', async () => {
    const routerPushMock = jest.fn();
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    appMock.config.globalProperties['$router'] = {
      push: routerPushMock
    } as unknown as Router;

    handleRedirectCallbackMock.mockRejectedValue('Some Error');

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('error', 'some_error');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(routerPushMock).toHaveBeenCalledWith('/');
    });
  });

  it('should redirect to errorPath when handleRedirect failed upon installation', async () => {
    const routerPushMock = jest.fn();
    const plugin = createEarthoOne(
      {
        domain: '',
        clientId: ''
      },
      { errorPath: '/error' }
    );

    appMock.config.globalProperties['$router'] = {
      push: routerPushMock
    } as unknown as Router;

    handleRedirectCallbackMock.mockRejectedValue('Some Error');

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('error', 'some_error');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(routerPushMock).toHaveBeenCalledWith('/error');
    });
  });

  it('should support redirect_uri', async () => {
    const plugin = createEarthoOne({
      domain: 'domain 123',
      clientId: 'client id 123',
      // @ts-expect-error
      redirect_uri: 'bar'
    });

    plugin.install(appMock);

    expect(appMock.config.globalProperties.$eartho).toBeTruthy();
    expect(appMock.provide).toHaveBeenCalledWith(
      EARTHO_INJECTION_KEY,
      expect.anything()
    );
    expect(EarthoOne).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'domain 123',
        clientId: 'client id 123',
        authorizationParams: {
          redirect_uri: 'bar'
        }
      })
    );
  });

  it('should call checkSession on installation', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const appMock: App<any> = {
      config: {
        globalProperties: {}
      },
      provide: jest.fn()
    } as any as App<any>;

    plugin.install(appMock);

    expect(checkSessionMock).toHaveBeenCalled();
    expect(handleRedirectCallbackMock).not.toHaveBeenCalled();
  });

  function flushPromises() {
    return new Promise(resolve => setTimeout(resolve));
  }

  it('should call handleRedirect callback on installation with code', async () => {
    const plugin = createEarthoOne(
      {
        domain: '',
        clientId: ''
      },
      {
        skipRedirectCallback: false
      }
    );

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('code', '123');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    expect.assertions(3);

    expect(checkSessionMock).not.toHaveBeenCalled();
    expect(handleRedirectCallbackMock).toHaveBeenCalled();

    return flushPromises().then(() => {
      expect(replaceStateMock).toHaveBeenCalled();
    });
  });

  it('should not call handleRedirect callback when skipRedirectCallback is true', async () => {
    const plugin = createEarthoOne(
      {
        domain: '',
        clientId: ''
      },
      {
        skipRedirectCallback: true
      }
    );

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('code', '123');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    expect.assertions(3);

    expect(checkSessionMock).toHaveBeenCalled();
    expect(handleRedirectCallbackMock).not.toHaveBeenCalled();

    return flushPromises().then(() => {
      expect(replaceStateMock).not.toHaveBeenCalled();
    });
  });

  it('should not call handleRedirect callback on installation when no state', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('code', '123');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    expect.assertions(3);

    expect(checkSessionMock).toHaveBeenCalled();
    expect(handleRedirectCallbackMock).not.toHaveBeenCalled();

    return flushPromises().then(() => {
      expect(replaceStateMock).not.toHaveBeenCalled();
    });
  });

  it('should call handleRedirect callback on installation when error', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('error', '123');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    expect.assertions(3);

    expect(checkSessionMock).not.toHaveBeenCalled();
    expect(handleRedirectCallbackMock).toHaveBeenCalled();

    return flushPromises().then(() => {
      expect(replaceStateMock).toHaveBeenCalled();
    });
  });

  it('should call the router, if provided, with the target path', async () => {
    const routerPushMock = jest.fn();
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    appMock.config.globalProperties['$router'] = {
      push: routerPushMock
    } as unknown as Router;

    handleRedirectCallbackMock.mockResolvedValue({
      appState: {
        target: 'abc'
      }
    });

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('code', '123');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(routerPushMock).toHaveBeenCalledWith('abc');
    });
  });

  it('should call the router, if provided, with the default path when no target provided', async () => {
    const routerPushMock = jest.fn();
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    appMock.config.globalProperties['$router'] = {
      push: routerPushMock
    } as unknown as Router;

    handleRedirectCallbackMock.mockResolvedValue({
      appState: {}
    });

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('code', '123');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    return flushPromises().then(() => {
      expect(routerPushMock).toHaveBeenCalledWith('/');
    });
  });

  it('should call the router, if provided, with the default path when no appState', async () => {
    const routerPushMock = jest.fn();
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    appMock.config.globalProperties['$router'] = {
      push: routerPushMock
    } as unknown as Router;

    handleRedirectCallbackMock.mockResolvedValue({});

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('code', '123');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    return flushPromises().then(() => {
      expect(routerPushMock).toHaveBeenCalledWith('/');
    });
  });

  it('should call the router, if provided, with the default path when handleRedirectCallback returns undefined', async () => {
    const routerPushMock = jest.fn();
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    appMock.config.globalProperties['$router'] = {
      push: routerPushMock
    } as unknown as Router;

    handleRedirectCallbackMock.mockResolvedValue(undefined);

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('code', '123');
    urlParams.set('state', 'xyz');

    window.location.search = urlParams as any;

    plugin.install(appMock);

    return flushPromises().then(() => {
      expect(routerPushMock).toHaveBeenCalledWith('/');
    });
  });

  it('should proxy connectWithRedirect', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const connectOptions = {
      authorizationParams: {
        audience: 'audience 123'
      }
    };

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.connectWithRedirect(
      connectOptions
    );
    expect(connectWithRedirectMock).toHaveBeenCalledWith(connectOptions);
  });

  it('should proxy connectWithRedirect and handle redirect_uri', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.connectWithRedirect({
      // @ts-expect-error
      redirect_uri: 'bar'
    });
    expect(connectWithRedirectMock).toHaveBeenCalledWith({
      authorizationParams: {
        redirect_uri: 'bar'
      }
    });
  });

  it('should proxy connectWithPopup', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const connectOptions = {
      authorizationParams: {
        audience: 'audience 123'
      }
    };
    const popupOptions = {
      timeoutInSeconds: 60
    };

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.connectWithPopup(
      connectOptions,
      popupOptions
    );
    expect(connectWithPopupMock).toHaveBeenCalledWith(connectOptions, popupOptions);
  });

  it('should proxy connectWithPopup and handle redirect_uri', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.connectWithPopup({
      accessId: "YOUR_EARTHO_ACCESS_ID",
      // @ts-expect-error
      redirect_uri: 'bar'
    });
    expect(connectWithPopupMock).toHaveBeenCalledWith(
      {
        authorizationParams: {
          redirect_uri: 'bar'
        }
      },
      undefined
    );
  });

  it('should proxy logout', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const logoutOptions = {
      logoutParams: {
        localOnly: true,
        federated: true
      }
    };

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.logout(logoutOptions);
    expect(logoutMock).toHaveBeenCalledWith(logoutOptions);
  });

  it('should proxy logout without options', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.logout();
    expect(logoutMock).toHaveBeenCalledWith(undefined);
  });

  it('should update state after localOnly logout', async () => {
    // TODO
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const logoutOptions = {
      openUrl: false as const
    };

    plugin.install(appMock);

    expect.assertions(4);
    await flushPromises();
    jest.clearAllMocks();

    await appMock.config.globalProperties.$eartho.logout(logoutOptions);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(getUserMock).toHaveBeenCalledTimes(1);
    expect(getidTokenMock).toHaveBeenCalledTimes(1);
    expect(isConnectedMock).toHaveBeenCalledTimes(1);
  });

  it('should not update state after logout', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    expect.assertions(4);
    await flushPromises();
    jest.clearAllMocks();

    await appMock.config.globalProperties.$eartho.logout();

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(getUserMock).not.toHaveBeenCalled();
    expect(getidTokenMock).not.toHaveBeenCalled();
    expect(isConnectedMock).not.toHaveBeenCalled();
  });

  it('should proxy getAccessTokenSilently', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const appMock: App<any> = {
      config: {
        globalProperties: {}
      },
      provide: jest.fn()
    } as any as App<any>;

    const getTokenOptions = {
      authorizationParams: {
        scope: 'a b c'
      }
    };

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.getAccessTokenSilently(
      getTokenOptions
    );
    expect(getTokenSilentlyMock).toHaveBeenCalledWith(getTokenOptions);
  });

  it('should proxy getAccessTokenSilently and handle redirect_uri', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.getAccessTokenSilently({
      // @ts-expect-error
      redirect_uri: 'bar'
    });
    expect(getTokenSilentlyMock).toHaveBeenCalledWith({
      authorizationParams: {
        redirect_uri: 'bar'
      }
    });
  });

  it('should proxy getAccessTokenWithPopup', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const appMock: App<any> = {
      config: {
        globalProperties: {}
      },
      provide: jest.fn()
    } as any as App<any>;

    const getTokenOptions = {
      authorizationParams: {
        scope: 'a b c'
      }
    };
    const popupOptions = { timeoutInSeconds: 20 };

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.getAccessTokenWithPopup(
      getTokenOptions,
      popupOptions
    );
    expect(getTokenWithPopupMock).toHaveBeenCalledWith(
      getTokenOptions,
      popupOptions
    );
  });

  it('should proxy getAccessTokenWithPopup and handle redirect_uri', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const appMock: App<any> = {
      config: {
        globalProperties: {}
      },
      provide: jest.fn()
    } as any as App<any>;

    plugin.install(appMock);

    await appMock.config.globalProperties.$eartho.getAccessTokenWithPopup({
      // @ts-expect-error
      redirect_uri: 'bar'
    });
    expect(getTokenWithPopupMock).toHaveBeenCalledWith(
      {
        authorizationParams: {
          redirect_uri: 'bar'
        }
      },
      undefined
    );
  });

  it('should be loading by default', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    expect(appMock.config.globalProperties.$eartho.isLoading.value).toBe(true);
  });

  it('should not be loading once the SDK is finished', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(appMock.config.globalProperties.$eartho.isLoading.value).toBe(
        false
      );
    });
  });

  it('should set isConnected to false when not authenticated', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(appMock.config.globalProperties.$eartho.isConnected.value).toBe(
        false
      );
    });
  });

  it('should set isConnected to true when authenticated', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    isConnectedMock.mockResolvedValue(true);

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(appMock.config.globalProperties.$eartho.isConnected.value).toBe(
        true
      );
    });
  });

  it('should set user to null when not authenticated', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    isConnectedMock.mockResolvedValue(true);

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(appMock.config.globalProperties.$eartho.user.value).toBe(null);
    });
  });

  it('should set user when authenticated', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const userMock = { name: 'john' };

    isConnectedMock.mockResolvedValue(true);
    getUserMock.mockResolvedValue(userMock);

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(appMock.config.globalProperties.$eartho.user.value).toStrictEqual(
        userMock
      );
    });
  });

  it('should set idToken to null when not authenticated', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    isConnectedMock.mockResolvedValue(true);

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(appMock.config.globalProperties.$eartho.idToken.value).toBe(
        null
      );
    });
  });

  it('should set idToken when authenticated', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    const idToken = { name: 'john' };

    isConnectedMock.mockResolvedValue(true);
    getidTokenMock.mockResolvedValue(idToken);

    plugin.install(appMock);

    expect.assertions(1);

    return flushPromises().then(() => {
      expect(
        appMock.config.globalProperties.$eartho.idToken.value
      ).toStrictEqual(idToken);
    });
  });

  it('should track errors when connectWithPopup throws', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    connectWithPopupMock.mockRejectedValue('Some Error');

    try {
      await appMock.config.globalProperties.$eartho.connectWithPopup();
    } catch (e) { }

    expect(appMock.config.globalProperties.$eartho.error.value).toEqual(
      'Some Error'
    );
  });

  it('should track errors when logout throws', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    logoutMock.mockRejectedValue('Some Error');

    try {
      await appMock.config.globalProperties.$eartho.logout({
        async openUrl() { }
      });
    } catch (e) { }

    expect(appMock.config.globalProperties.$eartho.error.value).toEqual(
      'Some Error'
    );
  });

  it('should track errors when getAccessTokenWithPopup throws', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    getTokenWithPopupMock.mockRejectedValue('Some Error');

    try {
      await appMock.config.globalProperties.$eartho.getAccessTokenWithPopup();
    } catch (e) { }

    expect(appMock.config.globalProperties.$eartho.error.value).toEqual(
      'Some Error'
    );
  });

  it('should track errors when getAccessTokenSilently throws', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    getTokenSilentlyMock.mockRejectedValue('Some Error');

    try {
      await appMock.config.globalProperties.$eartho.getAccessTokenSilently();
    } catch (e) { }

    expect(appMock.config.globalProperties.$eartho.error.value).toEqual(
      'Some Error'
    );
  });

  it('should track errors when checkSession throws', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    try {
      plugin.install(appMock);

      checkSessionMock.mockRejectedValue('Some Error');

      await appMock.config.globalProperties.$eartho.checkSession();
    } catch (e) { }

    expect(appMock.config.globalProperties.$eartho.error.value).toEqual(
      'Some Error'
    );
  });

  it('should track errors when handleRedirectCallback throws', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    handleRedirectCallbackMock.mockRejectedValue('Some Error');

    try {
      await appMock.config.globalProperties.$eartho.handleRedirectCallback();
    } catch (e) { }

    expect(appMock.config.globalProperties.$eartho.error.value).toEqual(
      'Some Error'
    );
  });

  it('should clear errors when successful', async () => {
    const plugin = createEarthoOne({
      domain: '',
      clientId: ''
    });

    plugin.install(appMock);

    handleRedirectCallbackMock.mockRejectedValue('Some Error');

    try {
      await appMock.config.globalProperties.$eartho.handleRedirectCallback();
    } catch (e) { }

    expect(appMock.config.globalProperties.$eartho.error.value).toEqual(
      'Some Error'
    );

    handleRedirectCallbackMock.mockResolvedValue({});

    await appMock.config.globalProperties.$eartho.handleRedirectCallback();

    expect(appMock.config.globalProperties.$eartho.error.value).toBeFalsy();
  });
});
