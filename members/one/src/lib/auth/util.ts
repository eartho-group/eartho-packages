export function handleAuthError(error?: string | null) {
    const redirectUrl = sessionStorage.getItem('authReferrer') || '/';
    sessionStorage.removeItem('authReferrer')
    if (error) {
      sessionStorage.setItem('authError', error);
    }
    location.replace(redirectUrl);
  }
  