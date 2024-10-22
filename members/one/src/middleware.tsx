import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SUPPORTED_LOCALES } from './i18n';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  const acceptLanguage = req.headers.get('accept-language');
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;

  // If the locale cookie is not set, determine the best language from the Accept-Language header
  if (!cookieLocale && acceptLanguage) {
    let finalLocale = acceptLanguage;
    if (acceptLanguage.includes('-')) {
      finalLocale = acceptLanguage.split('-')[0] || acceptLanguage;
    }
    if(!SUPPORTED_LOCALES.includes(finalLocale)){
      finalLocale = 'en';
    }
    const res = NextResponse.redirect(url);
    res.cookies.set('NEXT_LOCALE', finalLocale, { maxAge: 60 * 60 * 24 * 365 }); // 1 year
    return res;
  }

  return NextResponse.next();
}
