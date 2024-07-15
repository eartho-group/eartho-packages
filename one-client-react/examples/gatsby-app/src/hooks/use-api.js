import { useEffect, useState } from 'react';
import { useEarthoOne } from '@eartho/one-client-react';

export const useApi = (url, options) => {
  const { getAccessTokenSilently } = useEarthoOne();
  const [state, setState] = useState({
    error: null,
    loading: true,
    data: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const { audience, scope, ...fetchOptions } = options;
        const accessToken = await getAccessTokenSilently({
          authorizationParams: { audience, scope },
        });
        const res = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            // Add the Authorization header to the existing headers
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setState({
          ...state,
          data: await res.json(),
          error: null,
          loading: false,
        });
      } catch (error) {
        setState({
          ...state,
          error,
          loading: false,
        });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
};
