/* Replace MyModel with the name of your model */
import type { MyModel } from '../../base/my-model/my-model';
import type { reviveMyModel } from '../../base/my-model/my-model.reviver';
import type { MyModelCoreIfy } from './my-model';

/**
 * Generate reviver for MyModel core model
 *
 * @param baseRevive
 */
export function reviveMyModelFactory<R extends typeof reviveMyModel>(baseRevive: R) {
  const reviver = <T extends MyModel = MyModel>(data: any, dictionaries?: any) => {
    const revivedData = baseRevive<MyModelCoreIfy<T>>(data, dictionaries);
    /* Set the value of your new fields here */
    // EXAMPLE: revivedData.myNewField = 'fake value';
    return revivedData;
  };

  return reviver;
}
