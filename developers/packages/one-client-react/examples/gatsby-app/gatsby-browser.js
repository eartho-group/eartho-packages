// gatsby-browser.js
import React from 'react';
import { EarthoOneProvider } from '@eartho/one-client-react';
import { navigate } from 'gatsby';
import 'bootstrap/dist/css/bootstrap.css';
import './src/components/App.css';

const onRedirectCallback = (appState) => navigate(appState?.returnTo || '/');

export const wrapRootElement = ({ element }) => {
  return (
    <EarthoOneProvider
      domain={process.env.GATSBY_DOMAIN}
      clientId={process.env.GATSBY_CLIENT_ID}
      onRedirectCallback={onRedirectCallback}
      authorizationParams={{
        audience: process.env.GATSBY_AUDIENCE,
        scope: 'profile email read:users',
        redirect_uri: window.location.origin,
      }}
    >
      {element}
    </EarthoOneProvider>
  );
};
