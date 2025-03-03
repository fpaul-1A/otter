import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as core from '@actions/core';
import {
  exec,
  getExecOutput,
} from '@actions/exec';

type YarnInstallOutputLine = { displayName: string; indent: string; data: string };

function parseYarnInstallOutput(output: string, errorCodesToReport: string[]) {
  return output.split(os.EOL)
    .map((line) => line ? JSON.parse(line) as YarnInstallOutputLine : undefined)
    .filter((line): line is YarnInstallOutputLine => !!line && errorCodesToReport.includes(line.displayName))
    .map((line) => `➤${line.displayName}: ${line.indent}${line.data}`);
}

async function run(): Promise<void> {
  try {
    const cwd = process.env.GITHUB_WORKSPACE!;
    const reportOnFile = core.getInput('reportOnFile');
    const errorCodesToReport = core.getInput('errorCodesToReport').split(',');
    const onlyReportsIfAffected = core.getBooleanInput('onlyReportsIfAffected');
    const yarnLockPath = path.resolve(cwd, 'yarn.lock');
    const execOptions = {
      cwd,
      ignoreReturnCode: true
    };

    const packageManager = fs.existsSync(yarnLockPath) ? 'yarn' : 'npm';
    if (packageManager !== 'yarn') {
      core.warning('This action only manages yarn, it doesn\'t do anything with other package managers');
      return;
    }

    let previousErrors: string[] = [];
    const { stdout: fetchDepth } = await getExecOutput('git', ['rev-list', 'HEAD', '--count'], execOptions);
    if (Number.parseInt(fetchDepth, 10) > 1) {
      if (onlyReportsIfAffected) {
        const gitDiffOutput = await getExecOutput('git', ['diff', 'HEAD~1', '--quiet', '--', yarnLockPath], execOptions);
        const isYarnLockAffected = gitDiffOutput.exitCode !== 0;
        if (!isYarnLockAffected) {
          core.info('Skipping error check, `yarn.lock` was not affected by this pull-request');
          return;
        }
      }

      await exec('git', ['revert', '--no-commit', '-m', '1', 'HEAD']);
      const { stdout: previousInstallOutput } = await getExecOutput('yarn', ['install', '--mode=skip-build', '--json'], execOptions);
      previousErrors = parseYarnInstallOutput(previousInstallOutput, errorCodesToReport);
      await exec('git', ['reset', '--hard']);
    }

    const { stdout } = await getExecOutput('yarn', ['install', '--mode=skip-build', '--json'], execOptions);
    const errors = parseYarnInstallOutput(stdout, errorCodesToReport)
      .filter((error) => !previousErrors.includes(error));

    if (errors.length > 0) {
      core.warning(errors.join('\n'), { file: reportOnFile, title: 'Errors during yarn install' });
    } else {
      core.info('No errors found!');
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

void run();
