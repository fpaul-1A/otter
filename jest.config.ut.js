const { getJestModuleNameMapper } = require('@o3r/dev-tools');

globalThis.ngJest = {
  skipNgcc: true
};

/**
 * @param rootDir {string}
 * @param isAngularSetup {boolean}
 * @returns {import('ts-jest/dist/types').JestConfigWithTsJest}
 */
module.exports.getJestConfig = (rootDir, isAngularSetup) => ({
  setupFilesAfterEnv: ['<rootDir>/testing/setup-jest.ts'],
  rootDir: '.',
  moduleNameMapper: getJestModuleNameMapper(rootDir),
  modulePathIgnorePatterns: [
    '<rootDir>/dist'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.*/templates/.*'
  ],
  reporters: [
    'default',
    ['jest-junit', {outputDirectory: '<rootDir>/dist-test', outputName: 'ut-report.xml'}],
    'github-actions'
  ],
  fakeTimers: {
    enableGlobally: true
  },
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      module: {
        type: 'es6'
      }
    }]
  },
  testEnvironmentOptions: {
    // workaround for the SDK Core
    customExportConditions: ['require', 'node']
  },
  workerIdleMemoryLimit: '700MB',
  ...isAngularSetup ? {
    preset: 'jest-preset-angular',
    transform: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '^.+\\.tsx?$': [
        'jest-preset-angular',
        {
          tsconfig: '<rootDir>/tsconfig.spec.json',
          stringifyContentPathRegex: '\\.html$'
        }
      ]
    },
    globalSetup: 'jest-preset-angular/global-setup',
  } : {}
});
