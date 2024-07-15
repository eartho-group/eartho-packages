import React, { PropsWithChildren } from 'react';
import EarthoOneProvider, { EarthoOneProviderOptions } from '../src/eartho-provider';

export const createWrapper = ({
  clientId = '__test_client_id__',
  domain = '__test_domain__',
  ...opts
}: Partial<EarthoOneProviderOptions> = {}) => {
  return function Wrapper({
    children,
  }: PropsWithChildren<Record<string, unknown>>): JSX.Element {
    return (
      <EarthoOneProvider domain={domain} clientId={clientId} {...opts}>
        {children}
      </EarthoOneProvider>
    );
  };
};

export interface Defer<TData> {
  resolve: (value: TData | PromiseLike<TData>) => void;
  reject: (reason?: unknown) => void;
  promise: Promise<TData>;
}

export function defer<TData>() {
  const deferred: Defer<TData> = {} as unknown as Defer<TData>;

  const promise = new Promise<TData>(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  deferred.promise = promise;
  return deferred;
}
