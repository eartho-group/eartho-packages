import React from 'react';
import type { AppProps } from 'next/app';
import { EarthoProvider } from '@eartho/one-client-nextjs/client';

export default function App({ Component, pageProps }: AppProps): React.ReactElement<AppProps> {
  const { user } = pageProps;

  return (
    <EarthoProvider user={user} profileUrl="/api/page-router-auth/me" loginUrl="/api/page-router-auth/login">
      <Component {...pageProps} />
    </EarthoProvider>
  );
}
