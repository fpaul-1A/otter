import {
  addImportToAppModule,
  packageManagerAdd,
  packageManagerExec,
  packageManagerInstall,
  packageManagerRun,
  prepareTestApp,
  setupLocalRegistry
} from '@o3r/test-helpers';
import { ExecSyncOptions } from 'node:child_process';
import * as path from 'node:path';

const appName = 'test-app-localization';
const currentFolder = path.join(__dirname, '..', '..', '..', '..');
const parentFolderPath = path.join(currentFolder, '..');
const itTestsFolderPath = path.join(parentFolderPath, 'it-tests');
const appFolderPath = path.join(itTestsFolderPath, appName);
// eslint-disable-next-line @typescript-eslint/naming-convention
const execEnv: ExecSyncOptions['env'] = {...process.env, JEST_WORKER_ID: undefined, NODE_OPTIONS: '', CI: 'true'};
const execAppOptions: ExecSyncOptions = {
  cwd: appFolderPath,
  stdio: 'pipe',
  timeout: 15 * 60 * 1000,
  env: execEnv
};
const o3rVersion = '999.0.0';

describe('new otter application with localization', () => {
  setupLocalRegistry();
  beforeAll(() => prepareTestApp(appName, 'angular-with-o3r-core'));
  test('should add localization to existing application', () => {
    packageManagerAdd(`@o3r/localization@${o3rVersion}`, execAppOptions);
    packageManagerExec(`ng add @o3r/localization@${o3rVersion}`, execAppOptions);

    packageManagerExec('ng g @o3r/core:component test-component --use-localization=false', execAppOptions);
    packageManagerExec(
      'ng g @o3r/localization:add-localization --activate-dummy --path="src/components/test-component/presenter/test-component-pres.component.ts"',
      execAppOptions);
    addImportToAppModule(appFolderPath, 'TestComponentContModule', 'src/components/test-component');

    expect(() => packageManagerInstall(execAppOptions)).not.toThrow();
    expect(() => packageManagerRun('build', execAppOptions)).not.toThrow();
  });
});
