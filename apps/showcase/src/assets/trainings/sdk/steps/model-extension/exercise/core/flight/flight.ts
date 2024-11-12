/* Replace MyModel with the name of your model */
import type { MyModel } from '../../base/my-model/my-model';
import type { IgnoreEnum } from '@ama-sdk/core';

export type MyModelCoreIfy<T extends IgnoreEnum<MyModel>> = T & {
  /* Add your additional fields here */
};
