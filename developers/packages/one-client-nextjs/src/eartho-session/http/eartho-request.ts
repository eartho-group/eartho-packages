import EarthoRequestCookies from './eartho-request-cookies';

export default abstract class EarthoRequest<Req = any> extends EarthoRequestCookies {
  protected constructor(public req: Req) {
    super();
  }

  public abstract getUrl(): string;
  public abstract getMethod(): string;
  public abstract getBody(): Promise<Record<string, string> | string> | Record<string, string> | string;
}
