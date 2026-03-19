module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'src/renderer/src/fsrs.js',
    'src/renderer/src/fsrs-cjs.js',
    'src/executor/runner-js-cjs.js',
    'src/main/index.js',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 60,
    }
  }
}
