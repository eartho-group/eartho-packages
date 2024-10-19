import { User } from '@eartho/one-client-js';

/**
 * The auth state which, when combined with the auth methods, make up the return object of the `useEarthoOne` hook.
 */
export interface AuthState<TUser extends User = User> {
  error?: Error;
  isConnected: boolean;
  isLoading: boolean;
  user?: TUser;
}

/**
 * The initial auth state.
 */
export const initialAuthState: AuthState = {
  isConnected: false,
  isLoading: true,
};
