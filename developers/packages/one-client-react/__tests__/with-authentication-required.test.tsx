import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import withAccessRequired from '../src/with-authentication-required';
import { render, screen, waitFor, act } from '@testing-library/react';
import { EarthoOne, User } from '@eartho/one-client-js';
import EarthoOneProvider from '../src/eartho-provider';
import { EarthoOneContextInterface, initialContext } from '../src/eartho-context';
import { defer } from './helpers';

const mockClient = jest.mocked(new EarthoOne({ clientId: '', domain: '' }));

describe('withAccessRequired', () => {
  it('should block access to a private component when not authenticated', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAccessRequired(MyComponent, { loginOptions: { accessId: '' } });
    render(
      <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </EarthoOneProvider>
    );
    await waitFor(() =>
      expect(mockClient.connectWithRedirect).toHaveBeenCalled()
    );
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
  });

  it('should allow access to a private component when authenticated', async () => {
    mockClient.getUser.mockResolvedValue({ name: '__test_user__' });
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAccessRequired(MyComponent, { loginOptions: { accessId: '' } });
    await act(() => {
      render(
        <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
          <WrappedComponent />
        </EarthoOneProvider>
      );
    });

    await waitFor(() =>
      expect(mockClient.connectWithRedirect).not.toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(screen.getByText('Private')).toBeInTheDocument()
    );
  });

  it('should show a custom redirecting message when not authenticated', async () => {
    const deferred = defer<User | undefined>();
    mockClient.getUser.mockResolvedValue(deferred.promise);

    const MyComponent = (): JSX.Element => <>Private</>;
    const OnRedirecting = (): JSX.Element => <>Redirecting</>;
    const WrappedComponent = withAccessRequired(MyComponent, {
      onRedirecting: OnRedirecting,
      loginOptions: { accessId: '' }
    });
    const { rerender } = await act(() =>
      render(
        <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
          <WrappedComponent />
        </EarthoOneProvider>
      )
    );

    await waitFor(() =>
      expect(screen.getByText('Redirecting')).toBeInTheDocument()
    );

    deferred.resolve({ name: '__test_user__' });

    rerender(
      <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </EarthoOneProvider>
    );
    await waitFor(() =>
      expect(screen.queryByText('Redirecting')).not.toBeInTheDocument()
    );
  });

  it('should call onBeforeAuthentication before connectWithRedirect', async () => {
    const callOrder: string[] = [];
    mockClient.getUser.mockResolvedValue(undefined);
    mockClient.connectWithRedirect.mockImplementationOnce(async () => {
      callOrder.push('connectWithRedirect');
    });
    const MyComponent = (): JSX.Element => <>Private</>;
    const OnBeforeAuthentication = jest
      .fn()
      .mockImplementationOnce(async () => {
        callOrder.push('onBeforeAuthentication');
      });
    const WrappedComponent = withAccessRequired(MyComponent, {
      onBeforeAuthentication: OnBeforeAuthentication,
      loginOptions: { accessId: '' }
    });
    render(
      <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </EarthoOneProvider>
    );

    await waitFor(() =>
      expect(OnBeforeAuthentication).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(mockClient.connectWithRedirect).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(callOrder).toEqual(['onBeforeAuthentication', 'connectWithRedirect'])
    );
  });

  it('should pass additional options on to connectWithRedirect', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAccessRequired(MyComponent, {
      loginOptions: {
        accessId: '',
        fragment: 'foo',
      },
    });
    render(
      <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </EarthoOneProvider>
    );
    await waitFor(() =>
      expect(mockClient.connectWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          fragment: 'foo',
        })
      )
    );
  });

  it('should merge additional appState with the returnTo', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAccessRequired(MyComponent, {
      loginOptions: {
        accessId: '',
        appState: {
          foo: 'bar',
        },
      },
      returnTo: '/baz',
    });
    render(
      <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </EarthoOneProvider>
    );
    await waitFor(() =>
      expect(mockClient.connectWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          appState: {
            foo: 'bar',
            returnTo: '/baz',
          },
        })
      )
    );
  });

  it('should accept a returnTo function', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAccessRequired(MyComponent, {
      loginOptions: { accessId: '' },
      returnTo: () => '/foo',
    });
    render(
      <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </EarthoOneProvider>
    );
    await waitFor(() =>
      expect(mockClient.connectWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          appState: {
            returnTo: '/foo',
          },
        })
      )
    );
  });

  it('should call connectWithRedirect only once even if parent state changes', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAccessRequired(MyComponent, { loginOptions: { accessId: '' } });
    const App = ({ foo }: { foo: number }): JSX.Element => (
      <div>
        {foo}
        <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
          <WrappedComponent />
        </EarthoOneProvider>
      </div>
    );
    const { rerender } = render(<App foo={1} />);
    await waitFor(() =>
      expect(mockClient.connectWithRedirect).toHaveBeenCalled()
    );
    mockClient.connectWithRedirect.mockClear();
    rerender(<App foo={2} />);
    await waitFor(() =>
      expect(mockClient.connectWithRedirect).not.toHaveBeenCalled()
    );
  });

  it('should provide access when the provider associated with the context is authenticated', async () => {
    // Calls happen up the tree, i.e the nested EarthoOneProvider will get a return value and the top level will get undefined
    mockClient.getUser.mockResolvedValueOnce({ name: '__test_user__' });
    mockClient.getUser.mockResolvedValueOnce(undefined);
    const context = React.createContext<EarthoOneContextInterface>(initialContext);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAccessRequired(MyComponent, {
      context,
      loginOptions: { accessId: '' }
    });
    await act(() => {
      render(
        <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
          <EarthoOneProvider
            clientId="__test_client_id__"
            domain="__test_domain__"
            context={context}
          >
            <WrappedComponent />
          </EarthoOneProvider>
        </EarthoOneProvider>
      );
    });

    await waitFor(() =>
      expect(mockClient.connectWithRedirect).not.toHaveBeenCalled()
    );
    // There should be one call per provider
    expect(mockClient.getUser).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Private')).toBeInTheDocument();
  });

  it('should block access when the provider associated with the context is not authenticated', async () => {
    // Calls happen up the tree, i.e the nested EarthoOneProvider will get undefined and the top level will get a return value
    mockClient.getUser.mockResolvedValueOnce(undefined);
    mockClient.getUser.mockResolvedValueOnce({ name: '__test_user__' });
    const context = React.createContext<EarthoOneContextInterface>(initialContext);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAccessRequired(MyComponent, {
      context,
      loginOptions: { accessId: '' }
    });
    await act(() => {
      render(
        <EarthoOneProvider clientId="__test_client_id__" domain="__test_domain__">
          <EarthoOneProvider
            clientId="__test_client_id__"
            domain="__test_domain__"
            context={context}
          >
            <WrappedComponent />
          </EarthoOneProvider>
        </EarthoOneProvider>
      );
    });

    await waitFor(() =>
      expect(mockClient.connectWithRedirect).toHaveBeenCalled()
    );
    // There should be one call per provider
    expect(mockClient.getUser).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
  });
});
