import { EarthoRequestCookies } from '../eartho-session/http';

export default class EarthoNextRequestCookies extends EarthoRequestCookies {
  public constructor() {
    super();
  }

  public getCookies(): Record<string, string> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cookies } = require('next/headers');
    const cookieStore = cookies();
    return cookieStore.getAll().reduce(
      (memo: Record<string, string>, { name, value }: { name: string; value: string }) => ({
        ...memo,
        [name]: value
      }),
      {}
    );
  }
}
