import type { Rule } from '@angular-devkit/schematics';
import type { NgGenerateSdkSchema } from '../schema';
import * as path from 'node:path';

/**
 * generate the rules to adapt the SDK generated by nx cli
 *
 * @param _options Schematic options
 * @param targetPath Path where the SDK has been generated
 * @param projectName Name of the project
 */
export function nxRegisterProjectTasks(_options: NgGenerateSdkSchema, targetPath: string, projectName: string): Rule {
  const project = {
    $schema: 'https://raw.githubusercontent.com/nrwl/nx/master/packages/nx/schemas/project-schema.json',
    name: projectName,
    projectType: 'library',
    root: targetPath,
    sourceRoot: path.posix.join(targetPath, 'src'),
    prefix: 'sdk',
    targets: {
      build: {
        executor: 'nx:run-script',
        outputs: [
          '{projectRoot}/dist/'
        ],
        options: {
          script: 'build'
        }
      },
      lint: {
        executor: '@nx/eslint:lint',
        configurations: {
          ci: {
            quiet: true,
            cacheLocation: '.cache/eslint'
          }
        },
        options: {
          eslintConfig: path.posix.join(targetPath, '.eslintrc.js'),
          lintFilePatterns: [
            path.posix.join(targetPath, 'src', '**', '*.ts')
          ]
        }
      },
      test: {
        executor: '@nx/jest:jest',
        options: {
          jestConfig: path.posix.join(targetPath, 'jest.config.js'),
          silent: true
        }
      }
    }
  };

  return (tree) => {
    tree.create(path.posix.join(targetPath, 'project.json'), JSON.stringify(project, null, 2));
    return tree;
  };
}
