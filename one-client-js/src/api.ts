import { TokenEndpointOptions, TokenEndpointResponse } from './global';
import { DEFAULT_EARTHO_CLIENT } from './constants';
import { getJSON } from './http';
import { createQueryParams } from './utils';

export async function oauthToken(
  {
    baseUrl,
    timeout,
    audience,
    scope,
    earthoOneClient,
    useFormData,
    ...options
  }: TokenEndpointOptions,
  worker?: Worker
) {
  const body = useFormData
    ? createQueryParams(options)
    : JSON.stringify(options);

  return await getJSON<TokenEndpointResponse>(
    `${baseUrl}/access/oauth/token`,
    timeout,
    audience || 'default',
    scope,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': useFormData
          ? 'application/x-www-form-urlencoded'
          : 'application/json',
        'Eartho-Client': btoa(
          JSON.stringify(earthoOneClient || DEFAULT_EARTHO_CLIENT)
        )
      }
    },
    worker,
    useFormData
  );
}
