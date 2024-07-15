import { NodeResponse } from '../eartho-session/http';
import { NextApiResponse } from 'next';

export default class EarthoNextApiResponse extends NodeResponse<NextApiResponse> {
  public redirect(location: string, status = 302): void {
    if (this.res.writableEnded) {
      return;
    }
    this.res.redirect(status, (this.res.getHeader('Location') as string) || location);
  }
}
