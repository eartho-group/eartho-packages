import { handleAccess, handleConnect } from '@eartho/one-client-nextjs';

export const GET = handleAccess({
  login: handleConnect({
    authorizationParams: {
      access_id: 'QJkg3evAtIqJgF80iB1o'
    }
  }),
  payment1: handleConnect({
    authorizationParams: {
      access_id: 'access-id-payment1'
    }
  }),
  payment2: handleConnect({
    authorizationParams: {
      access_id: 'access-id-payment2'
    }
  }),
  onError(req: Request, error: Error) {
    console.error(error);
  }
});
