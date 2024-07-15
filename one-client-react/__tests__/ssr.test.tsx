/**
 * @jest-environment node
 */
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { EarthoOneProvider, EarthoOneContext } from '../src';

jest.unmock('@eartho/one-client-js');

describe('In a Node SSR environment', () => {
  it('auth state is initialised', async () => {
    let isLoading, isConnected, user, connectWithRedirect;
    ReactDOMServer.renderToString(
      <EarthoOneProvider clientId="__client_id__" domain="__domain__">
        <EarthoOneContext.Consumer>
          {(value): JSX.Element => {
            ({ isLoading, isConnected, user, connectWithRedirect } = value);
            return <div>App</div>;
          }}
        </EarthoOneContext.Consumer>
      </EarthoOneProvider>
    );
    expect(isLoading).toBeTruthy();
    expect(isConnected).toBeFalsy();
    expect(user).toBeUndefined();
    await expect(connectWithRedirect).rejects.toThrowError(
      'window is not defined'
    );
  });
});
