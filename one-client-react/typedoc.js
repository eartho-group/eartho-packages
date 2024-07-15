module.exports = {
  name: '@eartho/one-client-react',
  out: './docs/',
  exclude: ['./src/utils.tsx', './src/reducer.tsx'],
  excludeExternals: false,
  excludePrivate: true,
  hideGenerator: true,
  readme: './README.md',
  visibilityFilters: {
    protected: false,
    inherited: true,
    external: true,
  },
};
