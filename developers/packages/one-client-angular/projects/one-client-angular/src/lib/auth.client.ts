import { InjectionToken, VERSION } from '@angular/core';
import { EarthoOne } from '@eartho/one-client-js';
import { AuthClientConfig } from './auth.config';
import useragent from '../useragent';

export class EarthoOneFactory {
  static createClient(configFactory: AuthClientConfig): EarthoOne {
    const config = configFactory.get();

    if (!config) {
      throw new Error(
        'Configuration must be specified either through AuthModule.forRoot or through AuthClientConfig.set'
      );
    }

    const { redirectUri, clientId, maxAge, httpInterceptor, ...rest } = config;

    return new EarthoOne({
      redirect_uri: redirectUri || window.location.origin,
      client_id: clientId,
      max_age: maxAge,
      ...rest,
      earthoOne: {
        name: useragent.name,
        version: useragent.version,
      },
    });
  }
}

export const EarthoOneService = new InjectionToken<EarthoOne>(
  'eartho.client'
);
