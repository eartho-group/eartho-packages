module.exports = {
  name: '@eartho/one-client-nextjs',
  out: './docs/',
  exclude: [
    './src/eartho-session/**',
    './src/session/cache.ts',
    './src/client/use-config.tsx',
    './src/utils/!(errors.ts)'
  ],
  entryPointStrategy: 'expand',
  excludeExternals: true,
  excludePrivate: true,
  hideGenerator: true,
  readme: 'none'
};
