import { handleAuth, handleLogin, handleCallback } from '@eartho/one-client-nextjs/edge';

const redirectUri = `${process.env.EARTHO_BASE_URL}/api/edge-auth/callback`;

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: { redirect_uri: redirectUri }
  }),
  callback: handleCallback({ redirectUri }),
  onError(req: Request, error: Error) {
    console.error(error);
  }
});

export const runtime = 'edge';
//https://github.com/vercel/next.js/issues/51642
export const fetchCache = 'force-no-store';
