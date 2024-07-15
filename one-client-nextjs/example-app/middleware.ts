import { withMiddlewareAuthRequired } from '@eartho/one-client-nextjs/edge';

export default withMiddlewareAuthRequired();

export const config = {
  matcher: ['/page-router/profile-middleware', '/profile-middleware']
};
