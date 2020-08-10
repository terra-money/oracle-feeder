module.exports = {
  roots: [
    '<rootDir>/src',
  ],
  testMatch: [
    '**/*.spec.ts',
    '**/test/**/*.test.ts?(x)'
  ],
  preset: 'ts-jest',
  modulePaths: ['src']
}
