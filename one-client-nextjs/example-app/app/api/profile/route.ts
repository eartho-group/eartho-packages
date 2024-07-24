import { getSession, withServerAccessRequired } from '@eartho/one-client-nextjs';
import { NextResponse } from 'next/server';

const GET = withServerAccessRequired(async () => {
  const session = await getSession();

  return NextResponse.json(session?.user);
});

export { GET };
