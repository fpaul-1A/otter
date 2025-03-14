import type {
  Rule,
  Tree,
} from '@angular-devkit/schematics';
import {
  createOtterSchematic,
  findFilesInTree,
} from '@o3r/schematics';

const configObserverRegExp = /\bConfigObserver\b/g;

// eslint-disable-next-line @typescript-eslint/naming-convention -- version in the function name
function updateV10_3Fn(): Rule {
  return (tree: Tree) => {
    const files = findFilesInTree(tree.getDir(''), (filePath) => /.*\.ts/.test(filePath));
    files.forEach(({ content, path }) => {
      const str = content.toString();
      if (configObserverRegExp.test(str)) {
        tree.overwrite(path, str.replaceAll(configObserverRegExp, 'O3rConfig'));
      }
    });
  };
}

/**
 * Update of Otter configuration V10.3
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- version in the function name
export const updateV10_3 = createOtterSchematic(updateV10_3Fn);
