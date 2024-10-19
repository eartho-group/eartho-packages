import React, { PropsWithChildren } from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { EarthoOneProvider, AppState } from '@eartho/one-client-react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { EarthoOneProviderOptions } from '../../../src';

const EarthoOneProviderWithRedirectCallback = ({
  children,
  ...props
}: PropsWithChildren<EarthoOneProviderOptions>) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: AppState) => {
    navigate((appState && appState.returnTo) || window.location.pathname);
  };

  return (
    <EarthoOneProvider onRedirectCallback={onRedirectCallback} {...props}>
      {children}
    </EarthoOneProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <EarthoOneProviderWithRedirectCallback
        domain={process.env.REACT_APP_DOMAIN}
        clientId={process.env.REACT_APP_CLIENT_ID}
        authorizationParams={{
          audience: process.env.REACT_APP_AUDIENCE,
          scope: 'profile email read:users',
          redirect_uri: window.location.origin,
        }}
      >
        <App />
      </EarthoOneProviderWithRedirectCallback>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
