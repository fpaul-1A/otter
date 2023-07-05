/*
 * The purpose of this script is to create a test-app that can be used in it-tests
 */
import { execSync, ExecSyncOptions } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import * as path from 'node:path';
import type { PackageJson } from 'type-fest';
import { minVersion, satisfies } from 'semver';
import { createTestApp } from './create-test-app';
import { Locker } from './locker';
import { packageManagerAdd, packageManagerExec, packageManagerInstall, packageManagerRun } from './package-manager';

export type PrepareTestAppType = 'blank' | 'angular' | 'angular-with-o3r-core';

/**
 * Prepare a test-app to be used to run tests targeting a local registry
 *
 * @param appName name of the app to be generated
 * @param type 'blank' only create yarn/npm config, 'angular' also create a new angular app, 'angular-with-o3r-core' also preinstall o3r-core with basic preset
 */
export async function prepareTestApp(appName: string, type: PrepareTestAppType) {
  const rootFolderPath = process.cwd();
  const itTestsFolderPath = path.join(rootFolderPath, '..', 'it-tests');
  const baseAngularAppFolderPath = path.join(itTestsFolderPath, 'base-app-angular');
  const baseAngularAppWithCoreFolderPath = path.join(itTestsFolderPath, 'base-app-angular-with-o3r-core');
  const appFolderPath = path.join(itTestsFolderPath, appName);
  const globalFolderPath = path.join(rootFolderPath, '.cache', 'test-app');
  const cacheFolderPath = path.join(globalFolderPath, 'cache');

  const o3rCorePackageJson: PackageJson & { generatorDependencies?: Record<string, string> } =
    JSON.parse(readFileSync(path.join(rootFolderPath, 'packages', '@o3r', 'core', 'package.json')).toString());
  const o3rPackageJson: PackageJson & { generatorDependencies?: Record<string, string> } =
    JSON.parse(readFileSync(path.join(rootFolderPath, 'package.json')).toString());
  const yarnVersion: string = o3rPackageJson?.packageManager?.split('@')?.[1] || '3.5.0';
  const angularVersion = minVersion(o3rCorePackageJson.devDependencies?.['@angular-devkit/schematics'] || 'latest')?.version;
  const materialVersion = minVersion(o3rCorePackageJson.generatorDependencies?.['@angular/material'] || angularVersion || 'latest')?.version;

  // Remove all cache entries relative to local workspaces (@o3r, @ama-sdk, @ama-terasu)
  if (!process.env.CI && existsSync(cacheFolderPath)) {
    const workspacesList = execSync('yarn workspaces:list', {stdio: 'pipe'}).toString().split('\n')
      .map((workspace) => workspace.replace('packages/', '').replace(/\//, '-'))
      .filter((workspace) => !!workspace);
    readdirSync(cacheFolderPath).forEach((fileName) => {
      if (workspacesList.some((workspace) => fileName.startsWith(workspace))) {
        const cacheFile = path.join(cacheFolderPath, fileName);
        // Not ideal solution but the tests are running in parallel, so we cannot always clean the cache
        if (Date.now() - statSync(cacheFile).birthtime.getTime() > (60 * 60 * 1000)) {
          rmSync(cacheFile);
        }
      }
    });
  }

  // Create it-tests folder
  if (!existsSync(itTestsFolderPath)) {
    mkdirSync(itTestsFolderPath);
  }

  // Remove existing app
  if (existsSync(appFolderPath)) {
    rmSync(appFolderPath, {recursive: true});
  }

  if (type === 'blank') {
    await createTestApp({
      appName: 'test-app',
      appDirectory: appName,
      cwd: itTestsFolderPath,
      globalFolderPath,
      yarnVersion,
      blank: true
    });
  } else {
    // Create new base app if needed
    await createTestApp({
      appName: 'test-app',
      appDirectory: 'base-app-angular',
      cwd: itTestsFolderPath,
      globalFolderPath,
      yarnVersion,
      angularVersion,
      materialVersion
    });

    if (type === 'angular-with-o3r-core' && !existsSync(baseAngularAppWithCoreFolderPath)) {
      const createTestAppWithCore = async () => {
        const locker = new Locker({
          lockFilePath: path.join(itTestsFolderPath, 'base-app-angular-with-o3r-core.lock'),
          lockTimeout: 10 * 60 * 1000
        });
        if (locker.isLocked()) {
          await locker.waitUntilUnlocked();
        }
        if (existsSync(appFolderPath)) {
          const packageJson: PackageJson = JSON.parse(readFileSync(path.join(baseAngularAppWithCoreFolderPath, 'package.json'), {encoding: 'utf8'}));
          const deps = [
            {name: '@angular-devkit/schematics', expected: angularVersion, actual: packageJson.dependencies?.['@angular-devkit/schematics'] || 'latest'},
            {name: '@angular/material', expected: materialVersion, actual: packageJson.dependencies?.['@angular/material'] || 'latest'}
          ];
          if (deps.every(({expected, actual}) => !expected || satisfies(expected, actual))) {
            // No need to regenerate
            return;
          }
        }
        locker.lock();
        cpSync(baseAngularAppFolderPath, baseAngularAppWithCoreFolderPath, {recursive: true});
        const execAppOptions: ExecSyncOptions = {
          cwd: baseAngularAppWithCoreFolderPath,
          stdio: 'inherit',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          env: {...process.env, NODE_OPTIONS: '', CI: 'true'}
        };
        const o3rVersion = '999.0.0';
        const o3rCoreOptions = [
          '--no-enableApisManager',
          '--no-enableStyling',
          '--no-enableAnalytics',
          '--no-enableCustomization',
          '--no-enablePlaywright',
          '--no-enablePrefetchBuilder',
          '--no-enableRulesEngine',
          '--no-enableCms',
          '--no-enableConfiguration',
          '--no-enableLocalization',
          '--no-enableApisManager'
        ].join(' ');
        packageManagerAdd(`@o3r/core@${o3rVersion}`, execAppOptions);
        packageManagerExec(`ng add @o3r/core@${o3rVersion} ${o3rCoreOptions}`, execAppOptions);

        packageManagerInstall(execAppOptions);
        packageManagerRun('build', execAppOptions);
        locker.unlock();
      };
      await createTestAppWithCore();
    }
  }

  // Copy base app into test app
  if (type !== 'blank') {
    cpSync(type === 'angular-with-o3r-core' ? baseAngularAppWithCoreFolderPath : baseAngularAppFolderPath, appFolderPath, {recursive: true});
  }
}
