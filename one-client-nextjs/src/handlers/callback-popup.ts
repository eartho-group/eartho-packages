import { NextApiResponse, NextApiRequest } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { assertReqRes } from '../utils/assert';
import { CallbackHandlerError, HandlerErrorCause } from '../utils/errors';
import { EarthoNextResponse } from '../http';
import { AppRouteHandlerFnContext, getHandler, Handler } from './router-helpers';

export type HandlePopupCallback = Handler<Record<string, never>>;

/**
 * The handler for the `/api/access/callback-popup` API route.
 *
 * @throws {@link HandlerError}
 *
 * @category Server
 */
export type PopupCallbackHandler = Handler<Record<string, never>>;

/**
 * @ignore
 */
export default function handlePopupCallbackFactory(): HandlePopupCallback {
  const appRouteHandler = appRouteHandlerFactory();
  const pageRouteHandler = pageRouteHandlerFactory();

  return getHandler<Record<string, never>>(appRouteHandler, pageRouteHandler) as HandlePopupCallback;
}

/**
 * @ignore
 */
const appRouteHandlerFactory: () => (req: NextRequest, ctx: AppRouteHandlerFnContext) => Promise<Response> | Response =
  () => async (_req) => {
    try {
      const res = new EarthoNextResponse(new NextResponse());

      // Post message and close the window
      const script = `
        <script>
          window.opener.postMessage('connected', window.location.origin);
          window.close();
        </script>
      `;

      res.res.headers.set('Content-Type', 'text/html');
      res.res = new NextResponse(script, { headers: res.res.headers });

      return res.res;
    } catch (e) {
      throw new CallbackHandlerError(e as HandlerErrorCause);
    }
  };

/**
 * @ignore
 */
const pageRouteHandlerFactory: () => (req: NextApiRequest, res: NextApiResponse) => Promise<void> =
  () =>
  async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
      assertReqRes(req, res);

      // Post message and close the window
      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <script>
          window.opener.postMessage('connected', window.location.origin);
          window.close();
        </script>
      `);
    } catch (e) {
      throw new CallbackHandlerError(e as HandlerErrorCause);
    }
  };
