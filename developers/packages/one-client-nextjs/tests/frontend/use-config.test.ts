import { renderHook } from '@testing-library/react-hooks';

import { withConfigProvider } from '../fixtures/frontend';
import { useConfig } from '../../src/client/use-config';

describe('context wrapper', () => {
  test('should provide the default login url', async () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: withConfigProvider({ loginUrl: '/api/access/login' })
    });

    expect(result.current.loginUrl).toEqual('/api/access/login');
  });

  test('should provide a custom login url', async () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: withConfigProvider({ loginUrl: '/api/custom-url' })
    });

    expect(result.current.loginUrl).toEqual('/api/custom-url');
  });

  test('should provide a custom login url from an environment variable', async () => {
    process.env.NEXT_PUBLIC_EARTHO_LOGIN = '/api/custom-url';
    const { result } = renderHook(() => useConfig(), {
      wrapper: withConfigProvider()
    });

    expect(result.current.loginUrl).toEqual('/api/custom-url');
    delete process.env.NEXT_PUBLIC_EARTHO_LOGIN;
  });
});
