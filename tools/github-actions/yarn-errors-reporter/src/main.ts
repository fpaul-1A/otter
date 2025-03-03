import * as fs from 'node:fs';
import * as path from 'node:path';
import * as core from '@actions/core';
import {
  getExecOutput,
} from '@actions/exec';

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
    if (onlyReportsIfAffected) {
      const gitDiffOutput = await getExecOutput('git', ['diff', 'HEAD~1', '--quiet', '--', yarnLockPath], execOptions);
      const isYarnLockAffected = gitDiffOutput.exitCode !== 0;
      if (!isYarnLockAffected) {
        core.info('Skipping error check, `yarn.lock` was not affected by this pull-request');
        return;
      }
    }

    const { stdout, stderr } = await getExecOutput('yarn', ['install', '--mode=skip-build'], execOptions);

    const filterErrors = (line: string) => errorCodesToReport.some((errCode) => line.includes(errCode));
    const errors = [
      ...stdout.split('\n').filter((line) => filterErrors(line)),
      ...stderr.split('\n').filter((line) => filterErrors(line))
    ];

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
