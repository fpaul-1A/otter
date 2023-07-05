import { getPackageManager, packageManagerCreate, packageManagerExec, packageManagerRun, prepareTestApp, setupLocalRegistry } from '@o3r/test-helpers';
import { ExecSyncOptions } from 'node:child_process';
import * as fs from 'node:fs';
import { cpSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';

const appName = 'test-sdk';
const sdkPackageName = '@my-test/sdk';
const currentFolder = path.join(__dirname, '..', '..', '..', '..');
const parentFolderPath = path.join(currentFolder, '..');
const itTestsFolderPath = path.join(parentFolderPath, 'it-tests');
const sdkFolderPath = path.join(itTestsFolderPath, 'test-sdk');
const sdkPackagePath = path.join(sdkFolderPath, sdkPackageName.replace(/^@/, ''));
const execEnv: ExecSyncOptions['env'] = {
/* eslint-disable @typescript-eslint/naming-convention, camelcase */
  ...process.env,
  CI: 'true',
  JEST_WORKER_ID: undefined,
  NODE_OPTIONS: '',
  npm_execpath: undefined,
  npm_config_user_agent: undefined
/* eslint-enable @typescript-eslint/naming-convention, camelcase */
};
const execAppOptions: ExecSyncOptions = {
  cwd: sdkFolderPath,
  stdio: 'pipe',
  timeout: 15 * 60 * 1000,
  env: execEnv
};
const packageManager = getPackageManager();

describe('Create new sdk command', () => {
  setupLocalRegistry();
  beforeEach(async () => {
    await prepareTestApp(appName, 'blank');

    if (packageManager.startsWith('yarn')) {
      fs.writeFileSync(path.join(sdkFolderPath, 'package.json'), '{"name": "@test/sdk"}');

      // copy yarnrc config to generated SDK
      mkdirSync(sdkPackagePath, {recursive: true});
      cpSync(path.join(execAppOptions.cwd.toString(), '.yarnrc.yml'), path.join(sdkPackagePath, '.yarnrc.yml'));
      cpSync(path.join(execAppOptions.cwd.toString(), '.yarn'), path.join(sdkPackagePath, '.yarn'), {recursive: true});
      fs.writeFileSync(path.join(sdkPackagePath, 'yarn.lock'), '');
    } else {
      // copy npmrc config to generated SDK
      mkdirSync(sdkPackagePath, { recursive: true });
      cpSync(path.join(execAppOptions.cwd.toString(), '.npmrc'), path.join(sdkPackagePath, '.npmrc'));
    }
  });

  beforeEach(() => {
    cpSync(path.join(__dirname, '..', 'testing', 'mocks', 'MOCK_swagger_updated.yaml'), path.join(sdkFolderPath, 'swagger-spec.yml'));
  });

  test('should generate a full SDK when the specification is provided', () => {
    expect(() =>
      packageManagerCreate(`@ama-sdk typescript ${sdkPackageName}`, `--package-manager ${packageManager} --spec-path ./swagger-spec.yml`, execAppOptions)).not.toThrow();
    expect(() => packageManagerRun('build', { ...execAppOptions, cwd: sdkPackagePath })).not.toThrow();
  });

  test('should generate an empty SDK ready to be used', () => {
    expect(() => packageManagerCreate(`@ama-sdk typescript ${sdkPackageName}`, '', execAppOptions)).not.toThrow();
    expect(() => packageManagerRun('build', { ...execAppOptions, cwd: sdkPackagePath })).not.toThrow();
    expect(() =>
      packageManagerExec(
        `schematics @ama-sdk/schematics:typescript-core --spec-path ${path.join(path.relative(sdkPackagePath, execAppOptions.cwd.toString()), 'swagger-spec.yml')}`,
        { ...execAppOptions, cwd: sdkPackagePath }
      )).not.toThrow();
    expect(() => packageManagerRun('build', { ...execAppOptions, cwd: sdkPackagePath })).not.toThrow();
  });
});
