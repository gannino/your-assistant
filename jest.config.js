module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'vue', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/main.js',
    '!src/router/index.js',
    '!src/**/*.spec.js',
    '!src/**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '<rootDir>/tests/**/*.(spec|test).js',
    '<rootDir>/src/**/__tests__/**/*.js',
    '<rootDir>/src/**/*.spec.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
};
