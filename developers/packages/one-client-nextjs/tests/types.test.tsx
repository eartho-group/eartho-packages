import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { expectTypeOf } from 'expect-type';
import { handleAccess, HandlerError, AppRouteHandlerFnContext, withClientAccessRequired } from '../src';

describe('types', () => {
  test('should allow customisation of page router auth handlers', () => {
    expectTypeOf(handleAccess).toBeCallableWith({
      login(_req: NextApiRequest, _res: NextApiResponse) {}
    });
  });

  test('should allow customisation of page router error handler', () => {
    expectTypeOf(handleAccess).toBeCallableWith({
      onError(_req: NextApiRequest, _res: NextApiResponse, _err: HandlerError) {}
    });
  });

  test('should allow customisation of app router auth handlers', () => {
    expectTypeOf(handleAccess).toBeCallableWith({
      login(_req: NextRequest) {
        return new NextResponse();
      }
    });
  });

  test('should allow customisation of app router auth handlers with context', () => {
    expectTypeOf(handleAccess).toBeCallableWith({
      login(_req: NextRequest, _ctx: AppRouteHandlerFnContext) {
        return new NextResponse();
      }
    });
  });

  test('should allow customisation of app router auth handlers with context literal', () => {
    expectTypeOf(handleAccess).toBeCallableWith({
      login(_req: NextRequest, _ctx: { params: Record<string, string | string[]> }) {
        return new NextResponse();
      }
    });
  });

  test('should allow withClientAccessRequired in app router', () => {
    async function Page() {
      return <span>Foo</span>;
    }
    expectTypeOf(withClientAccessRequired).toBeCallableWith(Page);
  });

  test('should allow withClientAccessRequired in app router with opts', () => {
    async function Page() {
      return <span>Foo</span>;
    }
    expectTypeOf(withClientAccessRequired).toBeCallableWith(Page, { returnTo: 'foo' });
  });

  test('should allow custom params in withClientAccessRequired', () => {
    async function Page({ params }: { params?: Record<string, string | string[]> }) {
      return <span>{typeof params}</span>;
    }
    expectTypeOf(withClientAccessRequired).toBeCallableWith(Page);
  });
});
