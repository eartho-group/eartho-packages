import React from 'react';
import App from 'next/app';
import Head from 'next/head';
import Router from 'next/router';
import { EarthoOneProvider } from '@eartho/one-client-react';
import { Nav } from '../components/Nav';
import '../components/App.css';

const onRedirectCallback = (appState) => {
  Router.replace(appState?.returnTo || '/');
};

const protectedPaths = [
  { path: '^/dashboard', accessIds: ['user', 'admin'], redirectPath: '/no-access' },
  { path: '^/users', accessIds: ['user'], redirectPath: '/no-access' }
];

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <EarthoOneProvider
        clientId={process.env.NEXT_PUBLIC_CLIENT_ID}
        onRedirectCallback={onRedirectCallback}
        authorizationParams={{
          redirect_uri: typeof window !== 'undefined' && window.location.origin,
        }}
        protectedPaths={protectedPaths}
        defaultLoginPath="/"
        loadingComponent={<div>Loading...</div>}
      >
        <Nav />
        <Component {...pageProps} />
      </EarthoOneProvider>
    );
  }
}

export default MyApp;
