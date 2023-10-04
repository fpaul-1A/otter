/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable quote-props */

module.exports = {
  'root': true,
  'parser': require.resolve('@typescript-eslint/parser'),
  'parserOptions': {
    'tsconfigRootDir': __dirname,
    'project': [
      'testing/tsconfig.spec.json',
      'tsconfigs/tsconfig.jasmine.json',
      'tsconfigs/tsconfig.jest.json',
      'tsconfigs/tsconfig.source.json'
    ],
    'ecmaVersion': 12,
    'extraFileExtensions': ['.json']
  },
  'env': {
    'browser': true,
    'node': true,
    'es6': true,
    'jest': true,
    'jest/globals': true
  },
  'settings': {
    'import/resolver': 'node'
  },
  'overrides': [
    {
      'files': ['*.ts'],
      'rules': {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        'max-len': 'off',
        'no-redeclare': 'off',
        'no-use-before-define': 'off',
        'no-useless-escape': 'off'
      }
    },
    {
      'files': ['*.jasmine.fixture.ts', '*api.fixture.ts'],
      'rules': {
        'jest/no-jasmine-globals': 'off'
      }
    },
    {
      'files': ['*.helper.ts'],
      'rules': {
        '@typescript-eslint/explicit-function-return-type': 'error'
      }
    },
    {
      'files': ['*.js'],
      'rules': {
        '@typescript-eslint/restrict-template-expressions': 'off'
      }
    },
    {
      'parser': require.resolve('jsonc-eslint-parser'),
      'files': [
        '**/*.json'
      ]
    },
    {
      'files': [
        '**/package.json'
      ],
      'plugins': [
        '@nx'
      ],
      'rules': {
        '@nx/dependency-checks': ['error', {
          'buildTargets': ['build', 'build-builders', 'compile', 'test'],
          'checkObsoleteDependencies': false
        }]
      }
    }
  ],
  'plugins': [
    'jest'
  ],
  'extends': [
    '../../../.eslintrc.js'
  ]
};

