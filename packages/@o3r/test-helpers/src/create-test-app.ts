import { execSync, ExecSyncOptions } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import * as path from 'node:path';
import { satisfies } from 'semver';
import type { PackageJson } from 'type-fest';
import { Locker } from './locker';
import { getPackageManager, packageManagerAdd, packageManagerCreate, packageManagerExec, packageManagerInstall, packageManagerRun } from './package-manager';

export interface CreateTestAppOptions {
  /**
   * Name of the app to generate
   */
  appName: string;

  /**
   * Directory used to generate app
   */
  appDirectory: string;

  /**
   * Working directory
   */
  cwd: string;

  /**
   * Global folder location (used to share cache between multiple apps)
   */
  globalFolderPath: string;

  /**
   * Custom registry used to fetch local packages
   */
  registry: string;

  /**
   * Generate a blank app with only npm/yarn config
   */
  blank: boolean;

  /**
   * Version of Angular to install
   */
  angularVersion?: string;

  /**
   * Version of Angular Material to install
   */
  materialVersion?: string;

  /**
   * Version of Yarn to install
   */
  yarnVersion?: string;
}

/**
 * Generate a base app with minimal necessary dependencies
 * Uses a locker mechanism so this function can be called in parallel
 * The lock will automatically expire after 10 minutes if the creation of the app failed for whatever reason
 *
 * @param inputOptions
 */
export async function createTestApp(inputOptions: Partial<CreateTestAppOptions>) {
  const options: CreateTestAppOptions = {
    appName: 'test-app',
    appDirectory: 'test-app',
    cwd: process.cwd(),
    globalFolderPath: process.cwd(),
    registry: 'http://localhost:4873',
    blank: false,
    ...inputOptions
  };
  const packageManager = getPackageManager();
  const appFolderPath = path.join(options.cwd, options.appDirectory);
  const locker = new Locker({
    lockFilePath: path.join(options.cwd, `${options.appDirectory}-ongoing.lock`),
    lockTimeout: 10 * 60 * 1000
  });
  if (locker.isLocked()) {
    return locker.waitUntilUnlocked();
  }
  if (existsSync(appFolderPath)) {
    if (options.blank) {
      return;
    }
    const packageJson: PackageJson = JSON.parse(readFileSync(path.join(appFolderPath, 'package.json'), {encoding: 'utf8'}));
    const deps = [
      {name: '@angular-devkit/schematics', expected: options.angularVersion, actual: packageJson.dependencies?.['@angular-devkit/schematics'] || 'latest'},
      {name: '@angular/material', expected: options.materialVersion, actual: packageJson.dependencies?.['@angular/material'] || 'latest'}
    ];
    if (deps.every(({expected, actual}) => !expected || satisfies(expected, actual))) {
      // No need to regenerate
      return;
    }
  }
  locker.lock();

  const execAppOptions: ExecSyncOptions = {
    cwd: appFolderPath,
    stdio: 'inherit',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    env: {...process.env, NODE_OPTIONS: '', CI: 'true'}
  };

  // Prepare folder
  if (existsSync(appFolderPath)) {
    rmSync(appFolderPath, {recursive: true});
  }

  if (options.blank) {
    mkdirSync(appFolderPath, {recursive: true});
    if (packageManager === 'yarn') {
      execSync('yarn init', execAppOptions);
    }
  } else {
    // Create app with ng new
    const createOptions = `--directory=${options.appDirectory} --style=scss --routing --defaults=true --skip-git --package-manager=${packageManager}`;
    packageManagerCreate(`@angular@${options.angularVersion || ''} ${options.appName}`, createOptions,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      {cwd: options.cwd, stdio: 'inherit', env: {...process.env, NODE_OPTIONS: ''}});
  }

  if (packageManager === 'yarn') {
    // Set yarn version
    execSync('yarn config set enableStrictSsl false', execAppOptions);
    if (options.yarnVersion) {
      execSync(`yarn set version ${options.yarnVersion}`, execAppOptions);
    }

    // Set config to target local registry
    execSync('yarn config set checksumBehavior update', execAppOptions);
    execSync('yarn config set enableGlobalCache true', execAppOptions);
    execSync('yarn config set enableImmutableInstalls false', execAppOptions);
    execSync(`yarn config set globalFolder ${options.globalFolderPath}`, execAppOptions);
    execSync('yarn config set nodeLinker pnp', execAppOptions);
    execSync(`yarn config set npmScopes.ama-sdk.npmRegistryServer ${options.registry}`, execAppOptions);
    execSync(`yarn config set npmScopes.o3r.npmRegistryServer ${options.registry}`, execAppOptions);
    execSync('yarn config set unsafeHttpWhitelist localhost', execAppOptions);
  } else {
    // FIXME to be removed?
    execSync('npm config set legacy-peer-deps=true -L project', execAppOptions);

    execSync(`npm config set @ama-sdk:registry=${options.registry} -L project`, execAppOptions);
    execSync(`npm config set @o3r:registry=${options.registry} -L project`, execAppOptions);
    execSync(`npm config set cache=${options.globalFolderPath} -L project`, execAppOptions);
  }

  if (!options.blank) {
    // Add dependencies
    const deps = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@angular-devkit/schematics': options.angularVersion,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@angular/pwa': options.angularVersion,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@angular/material': options.materialVersion,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@angular-devkit/core': options.angularVersion,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@schematics/angular': options.angularVersion
    };
    packageManagerAdd(`${Object.entries(deps).map(([depName, version]) => `${depName}@${version || ''}`).join(' ')}`, execAppOptions);

    // Run ng-adds
    packageManagerExec(`ng add @angular/pwa@${options.angularVersion || ''}`, execAppOptions);
    packageManagerExec(`ng add @angular/material@${options.materialVersion || ''}`, execAppOptions);

    packageManagerInstall(execAppOptions);
    packageManagerRun('build', execAppOptions);
  }
  locker.unlock();
}
