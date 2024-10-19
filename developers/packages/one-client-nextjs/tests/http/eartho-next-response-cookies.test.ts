import { EarthoNextResponseCookies } from '../../src/http';
import { NextResponse } from 'next/server';

describe('eartho-next-response', () => {
  it('should set a cookie', async () => {
    const cookies = new EarthoNextResponseCookies();
    const res = new NextResponse();
    jest.doMock('next/headers', () => ({ cookies: () => res.cookies }));
    cookies.setCookie('foo', 'bar');
    expect(res.cookies.get('foo')?.value).toEqual('bar');
  });

  it('should not throw when setting a cookie fails', async () => {
    const cookies = new EarthoNextResponseCookies();
    jest.doMock('next/headers', () => ({
      cookies() {
        return {
          set: () => {
            throw new Error();
          }
        } as any;
      }
    }));
    expect(() => cookies.setCookie('foo', 'bar')).not.toThrow();
  });

  it('should delete cookies', async () => {
    const cookies = new EarthoNextResponseCookies();
    const res = new NextResponse();
    jest.doMock('next/headers', () => ({ cookies: () => res.cookies }));
    cookies.clearCookie('foo');
    expect(res.headers.get('set-cookie')).toEqual('foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });

  it('should delete cookies with a domain', async () => {
    const cookies = new EarthoNextResponseCookies();
    const res = new NextResponse();
    jest.doMock('next/headers', () => ({ cookies: () => res.cookies }));
    cookies.clearCookie('foo', { domain: 'example.com' });
    expect(res.headers.get('set-cookie')).toEqual(
      'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=example.com'
    );
  });

  it('should delete cookies with a path', async () => {
    const cookies = new EarthoNextResponseCookies();
    const res = new NextResponse();
    jest.doMock('next/headers', () => ({ cookies: () => res.cookies }));
    cookies.clearCookie('foo', { path: '/foo' });
    expect(res.headers.get('set-cookie')).toEqual('foo=; Path=/foo; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  });

  it('should not throw when deleting a cookie fails', async () => {
    const cookies = new EarthoNextResponseCookies();
    jest.doMock('next/headers', () => ({
      cookies() {
        return {
          delete: () => {
            throw new Error();
          }
        } as any;
      }
    }));
    expect(() => cookies.clearCookie('foo')).not.toThrow();
  });
});
