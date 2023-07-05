import { execSync, ExecSyncOptions } from 'node:child_process';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ENFORCED_PACKAGE_MANAGER?: string;
    }
  }
}

const PACKAGE_MANAGERS_CMD = {
  npm: {
    add: 'npm install',
    create: 'npm create',
    exec: 'npx',
    install: 'npm install',
    run: 'npm run'
  },
  yarn: {
    add: 'yarn add',
    create: 'yarn create',
    exec: 'yarn exec',
    install: 'yarn install',
    run: 'yarn run'
  }
};

/**
 * Get the package manager to be used for the tests by reading environment variable ENFORCED_PACKAGE_MANAGER
 */
export function getPackageManager() {
  return (process.env.ENFORCED_PACKAGE_MANAGER && process.env.ENFORCED_PACKAGE_MANAGER in PACKAGE_MANAGERS_CMD) ?
    process.env.ENFORCED_PACKAGE_MANAGER as keyof typeof PACKAGE_MANAGERS_CMD :
    'yarn';
}

function execCmd(cmd: string, options: ExecSyncOptions) {
  try {
    const output = execSync(cmd, {...options, stdio: 'pipe', encoding: 'utf8'});
    // eslint-disable-next-line no-console
    console.log(`${cmd}\n${output}`);
    return output;
  } catch (err: any) {
    // Yarn doesn't log errors on stderr, so we need to get them from stdout to have them in the reports
    throw new Error(`Command failed: ${cmd}\n${(err.stderr?.toString() || err.output?.toString() || '') as string}`);
  }
}

/**
 * Add a new package to the project (npm install / yarn add)
 *
 * @param packages
 * @param options
 */
export function packageManagerAdd(packages: string, options: ExecSyncOptions) {
  return execCmd(`${PACKAGE_MANAGERS_CMD[getPackageManager()].add} ${packages}`, options);
}

/**
 * Create a new project (npm create / yarn create)
 *
 * @param packageName
 * @param parameters
 * @param options
 */
export function packageManagerCreate(packageName: string, parameters: string, options: ExecSyncOptions) {
  return execCmd(`${PACKAGE_MANAGERS_CMD[getPackageManager()].create} ${packageName} ${getPackageManager() === 'npm' ? '-- ' : ''}${parameters}`, options);
}

/**
 * Execute a binary command (npx / yarn exec)
 *
 * @param script
 * @param options
 */
export function packageManagerExec(script: string, options: ExecSyncOptions) {
  return execCmd(`${PACKAGE_MANAGERS_CMD[getPackageManager()].exec} ${script}`, options);
}

/**
 * Install the dependencies (npm install / yarn install)
 *
 * @param options
 */
export function packageManagerInstall(options: ExecSyncOptions) {
  return execCmd(`${PACKAGE_MANAGERS_CMD[getPackageManager()].install}`, options);
}

/**
 * Execute a script from the package.json (npm run / yarn run)
 *
 * @param script
 * @param options
 */
export function packageManagerRun(script: string, options: ExecSyncOptions) {
  return execCmd(`${PACKAGE_MANAGERS_CMD[getPackageManager()].run} ${script}`, options);
}
