import { initEartho, EarthoServer } from '@eartho/one-client-nextjs';

export const pageRouterAuth: EarthoServer = initEartho({
  earthoLogout: !(process.env.EARTHO_ISSUER_BASE_URL as string).startsWith('http://localhost'),
  routes: {
    login: '/api/page-router-auth/login',
    callback: '/api/page-router-auth/callback',
    postLogoutRedirect: '/page-router'
  }
});
