import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import {
  createOtterSchematic,
  PipeReplacementInfo,
  updatePipes,
} from '@o3r/schematics';

const pipeReplacementInfo: PipeReplacementInfo = {
  translate: {
    new: {
      name: 'o3rTranslate'
    },
    import: 'LocalizationModule'
  }
};

/**
 * Update of Otter library V10.0
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- contains the version number
function updateV10_0Fn(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const updateRules: Rule[] = [
      updatePipes(pipeReplacementInfo)
    ];

    return chain(updateRules)(tree, context);
  };
}

/**
 * Update of Otter library V10.0
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- contains the version number
export const updateV10_0 = createOtterSchematic(updateV10_0Fn);
