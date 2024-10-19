import type { CookieSerializeOptions } from 'cookie';
import { EarthoResponseCookies } from '../eartho-session/http';

let warned = false;

const warn = () => {
  /* c8 ignore next 8 */
  if (process.env.NODE_ENV === 'development' && !warned) {
    console.warn(
      'nextjs-eartho is attempting to set cookies from a server component,' +
        'see https://github.com/eartho/one-client-nextjs#using-this-sdk-with-react-server-components'
    );
    warned = true;
  }
};

export default class EarthoNextResponseCookies extends EarthoResponseCookies {
  public constructor() {
    super();
  }

  public setCookie(name: string, value: string, options?: CookieSerializeOptions) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cookies } = require('next/headers');
    const cookieSetter = cookies();
    try {
      cookieSetter.set({ ...options, name, value });
    } catch (_) {
      warn();
    }
  }

  public clearCookie(name: string, options?: CookieSerializeOptions) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cookies } = require('next/headers');
    const cookieSetter = cookies();
    try {
      cookieSetter.set({ ...options, name, value: '', expires: new Date(0) });
    } catch (_) {
      warn();
    }
  }
}
