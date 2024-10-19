import { pageRouterAuth } from '@/lib/eartho';

const redirectUri = `${process.env.EARTHO_BASE_URL}/api/page-router-auth/callback`;

export default pageRouterAuth.handleAccess({
  login: pageRouterAuth.handleConnect({
    authorizationParams: { redirect_uri: redirectUri }
  }),
  callback: pageRouterAuth.handleCallback({ redirectUri }),
  logout: pageRouterAuth.handleLogout({ returnTo: `${process.env.EARTHO_BASE_URL}/page-router` })
});
