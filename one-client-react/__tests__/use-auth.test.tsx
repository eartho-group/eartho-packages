import React from 'react';
import useEarthoOne from '../src/use-eartho';
import { act, renderHook } from '@testing-library/react-hooks';
import { createWrapper } from './helpers';
import { EarthoOneContextInterface, initialContext } from '../src/eartho-context';

describe('useEarthoOne', () => {
  it('should provide the auth context', async () => {
    const wrapper = createWrapper();
    const {
      result: { current },
      waitForNextUpdate,
    } = renderHook(() => useEarthoOne(), { wrapper });
    await waitForNextUpdate();
    expect(current).toBeDefined();
  });

  it('should throw with no provider', () => {
    const {
      result: { current },
    } = renderHook(() => useEarthoOne());
    expect(current.connectWithRedirect).toThrowError(
      'You forgot to wrap your component in <EarthoOneProvider>.'
    );
  });

  it('should throw when context is not associated with provider', async () => {
    const context = React.createContext<EarthoOneContextInterface>(initialContext);
    const wrapper = createWrapper({ context });
    const {
      result: { current },
    } = renderHook(() => useEarthoOne(), { wrapper });
    await act(async () => {
      expect(current.connectWithRedirect).toThrowError(
        'You forgot to wrap your component in <EarthoOneProvider>.'
      );
    });
  });

  it('should accept custom auth context', async () => {
    const context = React.createContext<EarthoOneContextInterface>(initialContext);
    const wrapper = createWrapper({ context });
    const {
      result: { current },
      waitForNextUpdate,
    } = renderHook(() => useEarthoOne(context), { wrapper });
    await waitForNextUpdate();
    expect(current).toBeDefined();
    expect(current.connectWithRedirect).not.toThrowError();
  });
});
