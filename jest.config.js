module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: [],
  testPathIgnorePatterns: ['/node_modules/'],
  forceExit: true,
  detectOpenHandles: false
};
