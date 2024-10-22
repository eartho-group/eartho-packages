/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  i18n: {
    // These are all the locales you want to support in
    // your application
    locales: ["en", "es", "ja", "zh", "hi", "ar", "bn", "pt", "ru", "he"],
    defaultLocale : 'en',
    localeDetection: false,
    // This is the default locale you want to be used when visiting
    // a non-locale prefixed path e.g. `/hello`
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'pbs.twimg.com',
      'avatars.githubusercontent.com',
      'storage.googleapis.com',
      'firebasestorage.googleapis.com',
      'abs.twimg.com'
    ],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)', // Match all paths
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // {
          //   key: 'Content-Security-Policy',
          //   value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
          // },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          // Add more headers if needed
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

