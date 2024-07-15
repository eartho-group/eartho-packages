import version from './version';

/**
 * @ignore
 */
export const DEFAULT_AUTH_TIMEOUT_IN_SECONDS = 60;


/**
 * @ignore
 */
export const DEFAULT_EARTHO_CLIENT = {
  name: 'eartho-one-server-node',
  version: version
};

export const DEFAULT_NOW_PROVIDER = () => Date.now();
