#!/usr/bin/env node

import {
  readFileSync,
} from 'node:fs';
import {
  dirname,
  join,
  resolve,
} from 'node:path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- _builtinLibs is not part of repl types (due to the fact it is flagged to internal usage purpose)
// @ts-ignore
// eslint-disable-next-line import-newlines/enforce -- needed to have the `@ts-ignore` working
import { _builtinLibs as nodeWellKnownModules } from 'node:repl';
import {
  bold,
} from 'chalk';
import {
  program,
} from 'commander';
import * as glob from 'globby';
import * as winston from 'winston';

/** Console logger */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: new winston.transports.Console()
});

const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies'];
program
  .description('[DEPRECATED] Checks that the dependencies imported in the code are declared in the package.json file')
  .option<string>('--root <directory>', 'Project root directory', (p) => resolve(process.cwd(), p), process.cwd())
  .option<string[]>(
    '--ignore <...patterns>', 'Path patters to ignore',
    (p, previous) => ([...previous, ...p.split(',')]),
    ['**/node_modules/**', '**/dist/**', '**/dist-*/**', '**/mocks/**', '**/templates/**', '**/*.template']
  )
  .option('--ignore-workspace', 'Ignore the workspace and only check from the root directory')
  .option('--fail-on-error', 'Return a non-null status in case of dependency issue found')
  .parse(process.argv);

const { root, ignore, ignoreWorkspace, failOnError } = program.opts();

const packagePatterns: string[] = ignoreWorkspace
  ? join(root, 'package.json').replace(/\\/g, '/')
  : (JSON.parse(readFileSync(join(root, 'package.json'), { encoding: 'utf8' })).workspaces?.map((p: string) => join(p, 'package.json').replace(/\\/g, '/')) || []);

void (async () => {
  logger.warn('This script is deprecated, will be removed in Otter v12');
  const packageFiles = await glob(packagePatterns, { absolute: true });
  let fixFound = false;

  await Promise.all(packageFiles
    .sort()
    .map(async (packageFile) => {
      const packageJson = JSON.parse(readFileSync(packageFile, { encoding: 'utf8' }));
      const packageName = packageJson.name;
      const packageFolder = dirname(packageFile);

      const sourceFiles = glob(
        [join(packageFolder, '**', '*.{cts,mts,ts,tsx,cjs,mjs,js,jsx}')].map((pattern) => pattern.replace(/\\/g, '/')),
        {
          absolute: true,
          ignore
        }
      );

      const styleFiles = glob(
        [join(packageFolder, '**', '*.{css,scss}')].map((pattern) => pattern.replace(/\\/g, '/')),
        {
          absolute: true,
          ignore
        }
      );

      const deps = (await Promise.all([
        sourceFiles.then((files) => {
          return files
            .map((file) => readFileSync(file, { encoding: 'utf8' }))
            .reduce<string[]>((acc, content) => {
              return [
                ...acc,
                ...[
                  ...content.matchAll(/^import .* from ["']([^.].*)["'];?/gm),
                  ...content.matchAll(/ ?= ?require\(["']([^.].*)["']\);?$/gm)
                ].map(([, dep]) => dep)
              ];
            }, []);
        }),
        styleFiles.then((files) => {
          return files
            .map((file) => readFileSync(file, { encoding: 'utf8' }))
            .reduce<string[]>((acc, content) => {
              return [
                ...acc,
                ...[...content.matchAll(/^@import ["']~?([^.].*)["'];?$/gm)]
                  .map(([, dep]) => dep)
                  .filter((dep) => !dep.startsWith('http'))
              ];
            }, []);
        })
      ]))
        .flat()
        // get module name only
        .map((dep) => dep.startsWith('@') ? dep.split('/').slice(0, 2).join('/') : dep.split('/')[0])
        // filter node modules
        .filter((dep) => !dep.startsWith('node:') && !nodeWellKnownModules.includes(dep))
        // filter auto-reference
        .filter((dep) => dep !== packageName)
        // remove duplicates
        .filter((dep, i, arr) => arr.lastIndexOf(dep) === i);

      deps
        .filter((dep) => !dependencyTypes.some((type) => !!(packageJson[type]?.[dep] || packageJson[type]?.[`@types/${dep}`])))
        .forEach((dep) => {
          fixFound = true;
          logger.warn(`${bold(packageName)} is missing a dependency to ${bold(dep)}`);
        });
    }));

  if (!fixFound) {
    logger.info('No missing package.json dependencies found');
  } else if (failOnError) {
    process.exit(1);
  }
})();
