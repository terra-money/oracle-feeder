module.exports = {
  roots: [
    '<rootDir>feeder/src',
    '<rootDir>price-server/src',
  ],
  testMatch: [
    '**/*.spec.ts',
    '**/test/**/*.test.ts?(x)'
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      // required due to custom name of tsconfig.json configuration file
      // https://kulshekhar.github.io/ts-jest/docs/getting-started/options/tsconfig
      { tsconfig: 'tsconfig.jest.json' },
    ],
  },
  preset: 'ts-jest',
  modulePaths: ['feeder', "price-server"]
}
