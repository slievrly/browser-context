module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@chrome/(.*)$': '<rootDir>/chrome/$1',
    '^@edge/(.*)$': '<rootDir>/edge/$1',
    '^@safari/(.*)$': '<rootDir>/safari/$1',
    '^@firefox/(.*)$': '<rootDir>/firefox/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'shared/**/*.ts',
    'chrome/**/*.ts',
    'edge/**/*.ts',
    'firefox/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
