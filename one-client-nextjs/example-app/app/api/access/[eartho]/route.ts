import { handleAccess, handleLogin } from '@eartho/one-client-nextjs';

export const GET = handleAccess({
  login: handleLogin({
    authorizationParams: {
      access_id: 'QJkg3evAtIqJgF80iB1o'
    }
  }),
  payment1: handleLogin({
    authorizationParams: {
      access_id: 'bbb'
    }
  }),
  payment2: handleLogin({
    authorizationParams: {
      access_id: 'bbb'
    }
  }),
  onError(req: Request, error: Error) {
    console.error(error);
  }
});
