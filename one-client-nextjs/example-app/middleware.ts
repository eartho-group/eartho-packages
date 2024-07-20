import { withMiddlewareAccessRequired } from '@eartho/one-client-nextjs/edge';

export default withMiddlewareAccessRequired();

export const config = {
  matcher: ['/page-router/profile-middleware', '/profile-middleware']
};
