/*
 * The purpose of this script is to make sass-loader work with yarn pnp
 * The imported packages still need to be unplugged (using `yarn unplug <pkg>`)
 * @example
 * yarn add-yarn-unplugged-to-sass-path
 */

import fs from 'node:fs';
import path from 'node:path';

let pathParts = process.cwd().split(/[\\/]/);
let unpluggedFolder;
while(pathParts.length && !unpluggedFolder) {
  if (fs.existsSync(path.join(...pathParts, '.yarn', 'unplugged'))){
    unpluggedFolder = path.join(...pathParts, '.yarn', 'unplugged');
  } else {
    pathParts.pop();
  }
}

if (unpluggedFolder) {
  const unpluggedPackages = fs.readdirSync(unpluggedFolder).map((pkg) => path.join('.yarn', 'unplugged', pkg, 'node_modules'));

  const isWindows = process.platform === 'win32' ||
    process.env.OSTYPE === 'cygwin' ||
    process.env.OSTYPE === 'msys';
  const separator = isWindows ? ';' : ':';

  const SASS_PATH = Array.from(new Set([...(process.env.SASS_PATH ? process.env.SASS_PATH.split(separator) : []), ...unpluggedPackages])).join(separator);
  const envFile = '.local.env'
  const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, {encoding: 'utf8'}).replace(/^SASS_PATH=.*(\n|$)/g, '\n') : '';
  fs.writeFileSync(envFile, `SASS_PATH=${SASS_PATH}\n${envContent}`);
  console.log(`SASS_PATH set to ${SASS_PATH}`);
}
