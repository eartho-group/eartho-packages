import { NextApiRequest, NextApiResponse } from 'next';

type RedirectFunction = (req: NextApiRequest, res: NextApiResponse) => void;

export const connectWithRedirect = (accessId: string): void | RedirectFunction => {
  if (typeof window !== 'undefined') {
    // Client-side redirect
    window.location.href = `/api/connect/${accessId}`;
  }
};

export const connectWithPopup = async (accessName: string): Promise<void> => {
  if (typeof window !== 'undefined') {
    // Client-side popup
    const width = 400;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const popup = window.open(
      `/api/access/${accessName}?returnTo=/api/access/callback-popup`,
      'EarthoConnect',
      `width=${width},height=${height},top=${top},left=${left},resizable,scrollbars=yes,status=1`
    );
    if (!popup) {
      throw new Error('Popup window could not be opened.');
    }
    window.addEventListener('message', (event) => {
      if (event.data === 'connected') {
        popup.close();
      }
    });

    // Wait until the popup is closed
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });

    // Refresh the window after the popup is closed
    window.location.reload();
  }
};
