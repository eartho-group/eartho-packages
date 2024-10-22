import {NextIntlClientProvider} from 'next-intl';
import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export const SUPPORTED_LOCALES = ['en', 'es', 'ja', 'zh', 'hi', 'ar', 'bn', 'pt', 'ru', 'he'];

export default getRequestConfig(async () => {
  let locale = cookies().get('NEXT_LOCALE')?.value || 'en'; // Read locale from cookie
  if(!SUPPORTED_LOCALES.includes(locale)){
    locale = 'en';
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
