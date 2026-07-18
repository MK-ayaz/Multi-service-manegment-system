/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '\\.(css|less|scss)$': '<rootDir>/src/test-utils/styleMock.js',
    '\\.(svg|png|jpg|jpeg|gif|ico)$': '<rootDir>/src/test-utils/fileMock.js',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(@mui|@babel|react-router)/)'],
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/**/*.css'],
};
