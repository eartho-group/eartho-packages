import { getSession, withServerAccessRequired } from '@eartho/one-client-nextjs/edge';
import { NextResponse } from 'next/server';

const GET = withServerAccessRequired(async () => {
  const session = await getSession();

  return NextResponse.json(session?.user);
});

export { GET };

export const runtime = 'edge';
