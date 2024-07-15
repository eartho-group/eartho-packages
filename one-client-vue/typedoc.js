const excludeFiles = [];

module.exports = {
  out: './docs/',
  readme: './README.MD',
  includes: './src',
  exclude: [
    '**/__tests__/**/*',
    '**/cypress/**/*',
    '**/__mocks__/**/*',
    ...excludeFiles.map(f => `./src/${f}.ts`)
  ],
  excludeExternals: false,
  excludePrivate: true,
  hideGenerator: true,
  visibilityFilters: {
    protected: false,
    inherited: true,
    external: true,
  }
};
