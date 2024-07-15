import '@testing-library/jest-dom/extend-expect';
import React, { StrictMode, useContext } from 'react';
import EarthoOneContext, {
  EarthoOneContextInterface,
  initialContext,
} from '../src/eartho-context';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import {
  EarthoOne,
  GetTokenSilentlyVerboseResponse,
} from '@eartho/one-client-js';
import pkg from '../package.json';
import { createWrapper } from './helpers';
import { EarthoOneProvider, useEarthoOne } from '../src';

const clientMock = jest.mocked(new EarthoOne({ clientId: '', domain: '' }));

describe('EarthoOneProvider', () => {
  afterEach(() => {
    window.history.pushState({}, document.title, '/');
  });

  it('should provide the EarthoOneProvider result', async () => {
    const wrapper = createWrapper();
    const { result, waitForNextUpdate } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    expect(result.current).toBeDefined();
    await waitForNextUpdate();
  });

  it('should configure an instance of the EarthoOne', async () => {
    const opts = {
      clientId: 'foo',
      domain: 'bar',
      authorizationParams: {
        redirect_uri: 'baz',
        max_age: 'qux',
        extra_param: '__test_extra_param__',
      },
    };
    const wrapper = createWrapper(opts);
    const { waitForNextUpdate } = renderHook(() => useContext(EarthoOneContext), {
      wrapper,
    });
    expect(EarthoOne).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'foo',
        domain: 'bar',
        authorizationParams: {
          redirect_uri: 'baz',
          max_age: 'qux',
          extra_param: '__test_extra_param__',
        },
      })
    );
    await waitForNextUpdate();
  });

  it('should support redirectUri', async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const opts = {
      clientId: 'foo',
      domain: 'bar',
      redirectUri: 'baz',
    };
    const wrapper = createWrapper(opts);
    const { waitForNextUpdate } = renderHook(() => useContext(EarthoOneContext), {
      wrapper,
    });
    expect(EarthoOne).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'foo',
        domain: 'bar',
        authorizationParams: {
          redirect_uri: 'baz',
        },
      })
    );
    expect(warn).toHaveBeenCalled();
    await waitForNextUpdate();
  });

  it('should support authorizationParams.redirectUri', async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const opts = {
      clientId: 'foo',
      domain: 'bar',
      authorizationParams: {
        redirectUri: 'baz',
      },
    };
    const wrapper = createWrapper(opts);
    const { waitForNextUpdate } = renderHook(() => useContext(EarthoOneContext), {
      wrapper,
    });
    expect(EarthoOne).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'foo',
        domain: 'bar',
        authorizationParams: {
          redirect_uri: 'baz',
        },
      })
    );
    expect(warn).toHaveBeenCalled();
    await waitForNextUpdate();
  });

  it('should pass user agent to EarthoOne', async () => {
    const opts = {
      clientId: 'foo',
      domain: 'bar',
    };
    const wrapper = createWrapper(opts);
    const { waitForNextUpdate } = renderHook(() => useContext(EarthoOneContext), {
      wrapper,
    });
    expect(EarthoOne).toHaveBeenCalledWith(
      expect.objectContaining({
        earthoOne: {
          name: 'one-client-react',
          version: pkg.version,
        },
      })
    );
    await waitForNextUpdate();
  });

  it('should check session when logged out', async () => {
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(clientMock.checkSession).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
  });

  it('should check session when logged in', async () => {
    const user = { name: '__test_user__' };
    clientMock.getUser.mockResolvedValue(user);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(clientMock.checkSession).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.user).toBe(user);
  });

  it('should handle errors when checking session', async () => {
    clientMock.checkSession.mockRejectedValueOnce({
      error: '__test_error__',
      error_description: '__test_error_description__',
    });
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(clientMock.checkSession).toHaveBeenCalled();
    expect(() => {
      throw result.current.error;
    }).toThrowError('__test_error_description__');
    expect(result.current.isConnected).toBe(false);
  });

  it('should handle redirect callback success and clear the url', async () => {
    window.history.pushState(
      {},
      document.title,
      '/?code=__test_code__&state=__test_state__'
    );
    expect(window.location.href).toBe(
      'https://www.example.com/?code=__test_code__&state=__test_state__'
    );
    clientMock.handleRedirectCallback.mockResolvedValueOnce({
      appState: undefined,
    });
    const wrapper = createWrapper();
    const { waitForNextUpdate } = renderHook(() => useContext(EarthoOneContext), {
      wrapper,
    });
    await waitForNextUpdate();
    expect(clientMock.handleRedirectCallback).toHaveBeenCalled();
    expect(window.location.href).toBe('https://www.example.com/');
  });

  it('should handle redirect callback success and return to app state param', async () => {
    window.history.pushState(
      {},
      document.title,
      '/?code=__test_code__&state=__test_state__'
    );
    expect(window.location.href).toBe(
      'https://www.example.com/?code=__test_code__&state=__test_state__'
    );
    clientMock.handleRedirectCallback.mockResolvedValueOnce({
      appState: { returnTo: '/foo' },
    });
    const wrapper = createWrapper();
    const { waitForNextUpdate } = renderHook(() => useContext(EarthoOneContext), {
      wrapper,
    });
    await waitForNextUpdate();
    expect(clientMock.handleRedirectCallback).toHaveBeenCalled();
    expect(window.location.href).toBe('https://www.example.com/foo');
  });

  it('should handle redirect callback errors', async () => {
    window.history.pushState(
      {},
      document.title,
      '/?error=__test_error__&state=__test_state__'
    );
    clientMock.handleRedirectCallback.mockRejectedValue(
      new Error('__test_error__')
    );
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(clientMock.handleRedirectCallback).toHaveBeenCalled();
    expect(() => {
      throw result.current.error;
    }).toThrowError('__test_error__');
  });

  it('should handle redirect and call a custom handler', async () => {
    window.history.pushState(
      {},
      document.title,
      '/?code=__test_code__&state=__test_state__'
    );
    const user = { name: '__test_user__' };
    clientMock.getUser.mockResolvedValue(user);
    clientMock.handleRedirectCallback.mockResolvedValue({
      appState: { foo: 'bar' },
    });
    const onRedirectCallback = jest.fn();
    const wrapper = createWrapper({
      onRedirectCallback,
    });
    const { waitForNextUpdate } = renderHook(() => useContext(EarthoOneContext), {
      wrapper,
    });
    await waitForNextUpdate();
    expect(onRedirectCallback).toHaveBeenCalledWith({ foo: 'bar' }, user);
  });

  it('should skip redirect callback for non eartho redirect callback handlers', async () => {
    clientMock.isConnected.mockResolvedValue(true);
    window.history.pushState(
      {},
      document.title,
      '/?code=__some_non_ear_code__&state=__test_state__'
    );
    clientMock.handleRedirectCallback.mockRejectedValue(
      new Error('__test_error__')
    );
    const wrapper = createWrapper({
      skipRedirectCallback: true,
    });
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(clientMock.handleRedirectCallback).not.toHaveBeenCalled();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).not.toBeDefined();
  });

  it('should login with a popup', async () => {
    clientMock.getUser.mockResolvedValue(undefined);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.user).toBeUndefined();
    const user = { name: '__test_user__' };
    clientMock.getUser.mockResolvedValue(user);
    act(() => {
      result.current.connectWithPopup({accessId: ''});
    });
    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(clientMock.connectWithPopup).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.user).toBe(user);
  });

  it('should handle errors when logging in with a popup', async () => {
    clientMock.getUser.mockResolvedValue(undefined);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.user).toBeUndefined();
    clientMock.getUser.mockResolvedValue(undefined);
    clientMock.connectWithPopup.mockRejectedValue(new Error('__test_error__'));
    act(() => {
      result.current.connectWithPopup({accessId: ''});
    });
    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
    expect(clientMock.connectWithPopup).toHaveBeenCalled();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(() => {
      throw result.current.error;
    }).toThrowError('__test_error__');
  });

  it('should provide a login method', async () => {
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.connectWithRedirect).toBeInstanceOf(Function);
    await result.current.connectWithRedirect({
      accessId: '',
      authorizationParams: {
        redirect_uri: '__redirect_uri__',
      },
    });
    expect(clientMock.connectWithRedirect).toHaveBeenCalledWith({
      authorizationParams: {
        redirect_uri: '__redirect_uri__',
      },
    });
  });

  it('should provide a login method supporting redirectUri', async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.connectWithRedirect).toBeInstanceOf(Function);
    await result.current.connectWithRedirect({
      redirectUri: '__redirect_uri__',
    } as never);
    expect(clientMock.connectWithRedirect).toHaveBeenCalledWith({
      authorizationParams: {
        redirect_uri: '__redirect_uri__',
      },
    });
    expect(warn).toHaveBeenCalled();
  });

  it('should provide a login method supporting authorizationParams.redirectUri', async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.connectWithRedirect).toBeInstanceOf(Function);
    await result.current.connectWithRedirect({
      accessId: '',
      authorizationParams: {
        redirectUri: '__redirect_uri__',
      },
    });
    expect(clientMock.connectWithRedirect).toHaveBeenCalledWith({
      authorizationParams: {
        redirect_uri: '__redirect_uri__',
      },
    });
    expect(warn).toHaveBeenCalled();
  });

  it('should provide a logout method', async () => {
    const user = { name: '__test_user__' };
    clientMock.getUser.mockResolvedValue(user);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.logout).toBeInstanceOf(Function);
    act(() => {
      result.current.logout();
    });
    expect(clientMock.logout).toHaveBeenCalled();
    // Should not update state until returned from idp
    expect(result.current.isConnected).toBe(true);
    expect(result.current.user).toBe(user);
  });

  it('should update state when using openUrl', async () => {
    const user = { name: '__test_user__' };
    clientMock.getUser.mockResolvedValue(user);
    // get logout to return a Promise to simulate async cache.
    clientMock.logout.mockResolvedValue();
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.isConnected).toBe(true);
    await act(async () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await result.current.logout({ openUrl: async () => {} });
    });
    expect(result.current.isConnected).toBe(false);
  });

  it('should wait for logout with async cache', async () => {
    const user = { name: '__test_user__' };
    const logoutSpy = jest.fn();
    clientMock.getUser.mockResolvedValue(user);
    // get logout to return a Promise to simulate async cache.
    clientMock.logout.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      logoutSpy();
    });
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.isConnected).toBe(true);
    await act(async () => {
      await result.current.logout();
    });
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('should update state for openUrl false', async () => {
    const user = { name: '__test_user__' };
    clientMock.getUser.mockResolvedValue(user);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.user).toBe(user);
    act(() => {
      result.current.logout({ openUrl: false });
    });
    expect(clientMock.logout).toHaveBeenCalledWith({
      openUrl: false,
    });
    await waitForNextUpdate();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.user).toBeUndefined();
  });

  it('should provide a getIdToken method', async () => {
    clientMock.getTokenSilently.mockResolvedValue('token');
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.getIdToken).toBeInstanceOf(Function);
    await act(async () => {
      const token = await result.current.getIdToken();
      expect(token).toBe('token');
    });

    expect(clientMock.getTokenSilently).toHaveBeenCalled();
  });

  it('should get the full token response from getIdToken when detailedResponse is true', async () => {
    const tokenResponse: GetTokenSilentlyVerboseResponse = {
      access_token: '123',
      id_token: '456',
      expires_in: 2,
    };
    (clientMock.getTokenSilently as jest.Mock).mockResolvedValue(tokenResponse);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();

    await act(async () => {
      const token = await result.current.getIdToken();
      expect(token).toBe(tokenResponse);
    });
    expect(clientMock.getTokenSilently).toHaveBeenCalled();
  });

  it('should normalize errors from getIdToken method', async () => {
    clientMock.getTokenSilently.mockRejectedValue(new ProgressEvent('error'));
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    await act(async () => {
      await expect(result.current.getIdToken).rejects.toThrowError(
        'Get access token failed'
      );
    });
  });

  it('should call getIdToken in the scope of the Eartho client', async () => {
    clientMock.getTokenSilently.mockReturnThis();
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();

    await act(async () => {
      const returnedThis = await result.current.getIdToken();
      expect(returnedThis).toStrictEqual(clientMock);
    });
  });

  it('should update auth state after getIdToken', async () => {
    clientMock.getTokenSilently.mockReturnThis();
    clientMock.getUser.mockResolvedValue({ name: 'foo' });
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current.user?.name).toEqual('foo');
    clientMock.getUser.mockResolvedValue({ name: 'bar' });
    await act(async () => {
      await result.current.getIdToken();
    });
    expect(result.current.user?.name).toEqual('bar');
  });

  it('should update auth state after getIdToken fails', async () => {
    clientMock.getTokenSilently.mockReturnThis();
    clientMock.getUser.mockResolvedValue({ name: 'foo' });
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current.isConnected).toBeTruthy();
    clientMock.getTokenSilently.mockRejectedValue({ error: 'login_required' });
    clientMock.getUser.mockResolvedValue(undefined);
    await act(async () => {
      await expect(() =>
        result.current.getIdToken()
      ).rejects.toThrowError('login_required');
    });
    expect(result.current.isConnected).toBeFalsy();
  });

  it('should ignore same user after getIdToken', async () => {
    clientMock.getTokenSilently.mockReturnThis();
    const userObject = { name: 'foo' };
    clientMock.getUser.mockResolvedValue(userObject);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();

    const prevUser = result.current.user;
    clientMock.getUser.mockResolvedValue(userObject);
    await act(async () => {
      await result.current.getIdToken();
    });
    expect(result.current.user).toBe(prevUser);
  });

  it('should provide a getIdToken method', async () => {
    clientMock.getIdToken.mockResolvedValue('__test_raw_token__');
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.getIdToken).toBeInstanceOf(Function);
    const claims = await result.current.getIdToken();
    expect(clientMock.getIdToken).toHaveBeenCalled();
    expect(claims).toStrictEqual({
      claim: '__test_claim__',
      __raw: '__test_raw_token__',
    });
  });

  it('should memoize the getIdToken method', async () => {
    const wrapper = createWrapper();
    const { waitForNextUpdate, result, rerender } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    const memoized = result.current.getIdToken;
    rerender();
    expect(result.current.getIdToken).toBe(memoized);
  });

  it('should provide a handleRedirectCallback method', async () => {
    clientMock.handleRedirectCallback.mockResolvedValue({
      appState: { redirectUri: '/' },
    });
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    expect(result.current.handleRedirectCallback).toBeInstanceOf(Function);
    await act(async () => {
      const response = await result.current.handleRedirectCallback();
      expect(response).toStrictEqual({
        appState: {
          redirectUri: '/',
        },
      });
    });
    expect(clientMock.handleRedirectCallback).toHaveBeenCalled();
  });

  it('should call handleRedirectCallback in the scope of the Eartho client', async () => {
    clientMock.handleRedirectCallback.mockReturnThis();
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    await act(async () => {
      const returnedThis = await result.current.handleRedirectCallback();
      expect(returnedThis).toStrictEqual(clientMock);
    });
  });

  it('should update auth state after handleRedirectCallback', async () => {
    clientMock.handleRedirectCallback.mockReturnThis();
    clientMock.getUser.mockResolvedValue({ name: 'foo' });
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();

    const prevUser = result.current.user;
    clientMock.getUser.mockResolvedValue({ name: 'foo' });
    await act(async () => {
      await result.current.handleRedirectCallback();
    });
    expect(result.current.user).not.toBe(prevUser);
  });

  it('should update auth state after handleRedirectCallback fails', async () => {
    clientMock.handleRedirectCallback.mockReturnThis();
    clientMock.getUser.mockResolvedValue({ name: 'foo' });
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();

    expect(result.current.isConnected).toBeTruthy();
    clientMock.handleRedirectCallback.mockRejectedValueOnce({
      error: 'login_required',
    });
    clientMock.getUser.mockResolvedValue(undefined);
    await act(async () => {
      await expect(() =>
        result.current.handleRedirectCallback()
      ).rejects.toThrowError('login_required');
    });
    expect(result.current.isConnected).toBeFalsy();
  });

  it('should ignore same auth state after handleRedirectCallback', async () => {
    clientMock.handleRedirectCallback.mockReturnThis();
    const userObject = { name: 'foo' };
    clientMock.getUser.mockResolvedValue(userObject);
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();

    const prevState = result.current;
    clientMock.getUser.mockResolvedValue(userObject);
    await act(async () => {
      await result.current.handleRedirectCallback();
    });
    expect(result.current).toBe(prevState);
  });

  it('should normalize errors from handleRedirectCallback method', async () => {
    clientMock.handleRedirectCallback.mockRejectedValue(
      new ProgressEvent('error')
    );
    const wrapper = createWrapper();
    const { waitForNextUpdate, result } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    await act(async () => {
      await expect(result.current.handleRedirectCallback).rejects.toThrowError(
        'Get access token failed'
      );
    });
  });

  it('should handle not having a user while calling handleRedirectCallback', async () => {
    clientMock.handleRedirectCallback.mockResolvedValue({
      appState: {
        redirectUri: '/',
      },
    });
    clientMock.getUser.mockResolvedValue(undefined);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useContext(EarthoOneContext), { wrapper });
    let returnedToken;
    await act(async () => {
      returnedToken = await result.current.handleRedirectCallback();
    });
    expect(returnedToken).toStrictEqual({
      appState: {
        redirectUri: '/',
      },
    });
  });

  it('should not update context value after rerender with no state change', async () => {
    clientMock.getTokenSilently.mockReturnThis();
    clientMock.getUser.mockResolvedValue({ name: 'foo' });
    const wrapper = createWrapper();
    const { waitForNextUpdate, result, rerender } = renderHook(
      () => useContext(EarthoOneContext),
      { wrapper }
    );
    await waitForNextUpdate();
    const memoized = result.current;

    rerender();

    expect(result.current).toBe(memoized);
  });

  it('should only handle redirect callback once', async () => {
    window.history.pushState(
      {},
      document.title,
      '/?code=__test_code__&state=__test_state__'
    );
    clientMock.handleRedirectCallback.mockResolvedValue({
      appState: undefined,
    });
    render(
      <StrictMode>
        <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__" />
      </StrictMode>
    );
    await waitFor(() => {
      expect(clientMock.handleRedirectCallback).toHaveBeenCalledTimes(1);
      expect(clientMock.getUser).toHaveBeenCalled();
    });
  });

  it('should allow passing a custom context', async () => {
    const context = React.createContext<EarthoOneContextInterface>(initialContext);
    clientMock.getIdToken.mockResolvedValue({
      claim: '__test_claim__',
      __raw: '__test_raw_token__',
    });
    const wrapper = createWrapper({ context });
    // Test not associated with EarthoOneContext
    const earthoContextRender = renderHook(() => useContext(EarthoOneContext), {
      wrapper,
    });

    await act(async () => {
      await expect(
        earthoContextRender.result.current.getIdToken
      ).toThrowError('You forgot to wrap your component in <EarthoOneProvider>.');
    });

    const customContextRender = renderHook(() => useContext(context), {
      wrapper,
    });

    let claims;
    await act(async () => {
      claims = await customContextRender.result.current.getIdToken();
    });
    expect(clientMock.getIdToken).toHaveBeenCalled();
    expect(claims).toStrictEqual('__test_raw_token__');
  });

  it('should allow nesting providers', async () => {
    // Calls happen up the tree, i.e the nested EarthoOneProvider will get undefined and the top level will get a return value
    clientMock.getUser.mockResolvedValueOnce({ name: '__custom_user__' });
    clientMock.getUser.mockResolvedValueOnce({ name: '__main_user__' });
    const context = React.createContext<EarthoOneContextInterface>(initialContext);

    const MyComponent = () => {
      const { user } = useEarthoOne(context);
      return <div>{user?.name}</div>;
    };

    await act(() => {
      render(
        <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
          <EarthoOneProvider
            clientId="__test_client_id__"
            domain="__test_domain__"
            context={context}
          >
            <MyComponent />
          </EarthoOneProvider>
        </EarthoOneProvider>
      );
    });

    expect(clientMock.getUser).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('__custom_user__')).toBeInTheDocument();
    expect(screen.queryByText('__main_user__')).not.toBeInTheDocument();
  });
});
