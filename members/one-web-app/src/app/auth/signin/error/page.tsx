'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleAuthError } from '@/lib/auth/util';

const ErrorPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the error from query params
    const error = searchParams.get('error');
    handleAuthError(error);
  }, [router, searchParams]);

  return null; // Or you can show a loading spinner or a message here
};

export default ErrorPage;
