import {
  chain,
  type Rule,
} from '@angular-devkit/schematics';
import {
  createOtterSchematic,
} from '@o3r/schematics';
import {
  addPresetsRenovate,
} from './v10.1/add-presets-renovate';

/**
 * Update of Otter Workspace V10.1
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- function name contains the version number
function updateV10_1Fn(): Rule {
  const updateRules: Rule[] = [
    addPresetsRenovate()
  ];
  return chain(updateRules);
}

/**
 * Update of Otter Workspace V10.1
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- function name contains the version number
export const updateV10_1 = createOtterSchematic(updateV10_1Fn);
