import EarthoResponseCookies from './eartho-response-cookies';

export default abstract class EarthoResponse<Res = any> extends EarthoResponseCookies {
  protected constructor(public res: Res) {
    super();
  }

  public abstract redirect(location: string, status?: number): void;

  public abstract send204(): void;

  public abstract setHeader(name: string, value: string): void;
}
