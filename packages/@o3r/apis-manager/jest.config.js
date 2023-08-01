const { getJestModuleNameMapper } = require('@o3r/dev-tools');

globalThis.ngJest = {
  skipNgcc: true
};

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  displayName: require('./package.json').name,
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/testing/setup-jest.ts'],
  rootDir: '.',
  moduleNameMapper: getJestModuleNameMapper(__dirname),
  modulePathIgnorePatterns: [
    '<rootDir>/dist'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.*/templates/.*',
    '<rootDir>/schematics/.*\\.it\\.spec\\.ts$'
  ],
  reporters: [
    'default',
    'github-actions'
  ],
  globalSetup: 'jest-preset-angular/global-setup',
  transform: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^.+\\.tsx?$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$'
      }
    ]
  }
};
