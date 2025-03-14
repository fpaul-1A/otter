import {
  resolve,
} from 'node:path';
import {
  Context,
  promiseSpawn,
} from '@ama-terasu/core';

/** Option to create a Custom Application */
export interface CreateCustomAppOptions {
  /** Airline code */
  airline: string;
  /** Path of the folder to create the application */
  path: string;
  /**
   * Set default options instead of requiring input
   * @default false
   */
  yes?: boolean;
  /** Otter generator version to use */
  // eslint-disable-next-line @typescript-eslint/naming-convention -- CLI options are in kebab-case
  'otter-version': string;
  /** RefX Flavour */
  flavour: string;
  /** RefX Tag version */
  tag: string;
}

/**
 * Create a custom application
 * @param context Context of the command
 * @param options Options
 */
export const createCustomApplication = async (context: Context, options: CreateCustomAppOptions) => {
  const { logger } = context;

  const cwd = resolve(process.cwd(), options.path);

  await context.getSpinner('Generating a new custom application...').fromPromise(

    promiseSpawn(
      // eslint-disable-next-line @stylistic/max-len -- keep the command on the same line
      `npx -p @o3r/customization@${options['otter-version']} -p @angular-devkit/schematics-cli schematics @o3r/customization:generate --airlineCode ${options.airline} --checkoutTag ${options.tag} --refxFlavour ${options.flavour}`,
      { cwd, stderrLogger: (...args: any[]) => logger.debug(...args), logger }
    ),
    `Application generated (in ${cwd})`
  );

  logger.info(`Application created in ${resolve(cwd, `${options.airline}-${options.flavour}`)}`);
};
