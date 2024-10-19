'use client';

import { useUser } from '@eartho/one-client-nextjs/client';

export default function ClientComponent() {
  const { user } = useUser();
  if (user) {
    return <pre data-testid="client-component">{JSON.stringify(user, null, 2)}</pre>;
  }
  return <></>;
}
