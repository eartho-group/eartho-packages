module.exports = {
  rootDir: './',
  clearMocks: true,
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    './cypress',
    './jest.config.js',
    './__tests__',
    './src/global.ts'
  ],
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results/jest' }]
  ],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  preset: 'ts-jest/presets/default-legacy',
  setupFiles: [],
  transform: {
    '.*\\.test\\.ts': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json'
      }
    ]
  }
};
