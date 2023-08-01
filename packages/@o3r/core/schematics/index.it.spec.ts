import {
  addImportToAppModule,
  packageManagerAdd,
  packageManagerExec,
  packageManagerInstall,
  packageManagerRun,
  prepareTestApp,
  setupLocalRegistry
} from '@o3r/test-helpers';
import { execSync, ExecSyncOptions, spawn } from 'node:child_process';
import * as path from 'node:path';
import getPidFromPort from 'pid-from-port';

const devServerPort = 4200;
const appName = 'test-app-core';
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

describe('new otter application', () => {
  setupLocalRegistry();
  beforeAll(() => prepareTestApp(appName, 'angular'));
  test('should build empty app', () => {
    packageManagerAdd(`@o3r/core@${o3rVersion}`, execAppOptions);
    packageManagerExec(`ng add @o3r/core@${o3rVersion} --preset=cms`, execAppOptions);
    expect(() => packageManagerInstall(execAppOptions)).not.toThrow();

    packageManagerExec('ng g @o3r/core:store-entity-async --store-name="test-entity-async" --model-name="Bound" --model-id-prop-name="id"', execAppOptions);
    addImportToAppModule(appFolderPath, 'TestEntityAsyncStoreModule', 'src/store/test-entity-async');

    packageManagerExec('ng g @o3r/core:store-entity-sync --store-name="test-entity-sync" --model-name="Bound" --model-id-prop-name="id"', execAppOptions);
    addImportToAppModule(appFolderPath, 'TestEntitySyncStoreModule', 'src/store/test-entity-sync');

    packageManagerExec('ng g @o3r/core:store-simple-async --store-name="test-simple-async" --model-name="Bound"', execAppOptions);
    addImportToAppModule(appFolderPath, 'TestSimpleAsyncStoreModule', 'src/store/test-simple-async');

    packageManagerExec('ng g @o3r/core:store-simple-sync --store-name="test-simple-sync"', execAppOptions);
    addImportToAppModule(appFolderPath, 'TestSimpleSyncStoreModule', 'src/store/test-simple-sync');

    packageManagerExec('ng g @o3r/core:service test-service --feature-name="base"', execAppOptions);
    addImportToAppModule(appFolderPath, 'TestServiceBaseModule', 'src/services/test-service');

    packageManagerExec('ng g @o3r/core:page test-page --app-routing-module-path="src/app/app-routing.module.ts"', execAppOptions);

    const defaultOptions = [
      '--activate-dummy',
      '--use-otter-config=false',
      '--use-otter-theming=false',
      '--use-otter-analytics=false',
      '--use-localization=false',
      '--use-context=false',
      '--use-rules-engine=false'
    ].join(' ');
    packageManagerExec(`ng g @o3r/core:component test-component ${defaultOptions}`, execAppOptions);
    addImportToAppModule(appFolderPath, 'TestComponentContModule', 'src/components/test-component');

    const advancedOptions = [
      '--activate-dummy',
      '--use-otter-config=true',
      '--use-otter-theming=true',
      '--use-otter-analytics=true',
      '--use-localization=true',
      '--use-context=true',
      '--use-rules-engine=true'
    ].join(' ');
    packageManagerExec(`ng g @o3r/core:component test-component-advanced ${advancedOptions}`, execAppOptions);
    addImportToAppModule(appFolderPath, 'TestComponentAdvancedContModule', 'src/components/test-component-advanced');

    packageManagerExec(`ng g @o3r/core:component test-add-context-component ${defaultOptions}`, execAppOptions);
    packageManagerExec('ng g @o3r/core:add-context --path="src/components/test-add-context-component/container/test-add-context-component-cont.component.ts"',
      execAppOptions);
    addImportToAppModule(appFolderPath, 'TestAddContextComponentContModule', 'src/components/test-add-context-component');

    packageManagerExec('ng g @schematics/angular:component test-ng-component', execAppOptions);
    packageManagerExec('ng g @o3r/core:convert-component --path="src/app/test-ng-component/test-ng-component.component.ts"', execAppOptions);

    expect(() => packageManagerRun('build', execAppOptions)).not.toThrow();

    // should pass the e2e tests
    packageManagerExec('ng g @o3r/testing:playwright-scenario --name=test-scenario', execAppOptions);
    packageManagerExec('ng g @o3r/testing:playwright-sanity --name=test-sanity', execAppOptions);
    spawn(`npx http-server -p ${devServerPort} ./dist`, [], {
      ...execAppOptions,
      shell: true,
      stdio: ['ignore', 'ignore', 'inherit']
    });
    execSync(`npx --yes wait-on http://127.0.0.1:${devServerPort} -t 10000`, execAppOptions);

    execSync('npx playwright install --with-deps', execAppOptions);
    expect(() => packageManagerRun('test:playwright', execAppOptions)).not.toThrow();
    expect(() => packageManagerRun('test:playwright:sanity', execAppOptions)).not.toThrow();
  });

  afterAll(async () => {
    try {
      const pid = await getPidFromPort(devServerPort);
      execSync(process.platform === 'win32' ? `taskkill /f /t /pid ${pid}` : `kill -15 ${pid}`, {stdio: 'inherit'});
    } catch (e) {
      // http-server already off
    }
  });
});
