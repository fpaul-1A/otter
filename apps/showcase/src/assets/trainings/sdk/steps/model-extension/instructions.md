There are certain cases in which you want to be able to extend your SDK models, and therefore ensure that revivers are generated.

Let's continue with the use case of the previous exercise. In order to keep track of the user's current booking, it would be useful to generate an ID.
To do this, we can create a new model which extends the previously generated `Flight` type.

Before beginning the exercise, we need to make sure that the existing API was generated with model extension in the previous steps.
To verify this, check out the configuration used to generate the API (either the command line or the file `openapitools.json`).
Ensure that the global property `allowModelExtension` has been set to `true`. This will guarantee that the revivers of the
base models are generated, which is essential for the following exercise.

### Exercise

Extensions of base models (located in the `base` folder) are created in the `core` folder.


First, create the type `FlightCoreIfy` which extends `Flight`, imported from the `base` folder.
You can do this using the template file `flight.ts`.

> [!NOTE]
> The naming convention requires the core model to contain the suffix `CoreIfy`. You can find more information on core models in the
> <a href="https://github.com/AmadeusITGroup/otter/blob/main/docs/api-sdk/SDK_MODELS_HIERARCHY.md" target="_blank">SDK models hierarchy documentation</a>.

Then, you can create the reviver for this new core model using the existing template file `flight.reviver.ts`. This reviver will extend the
reviver of the base `Flight` model, which should exist since we have ensured this during the prerequisites of the exercise.


Once the core model and its reviver are created, we can go back to the base model to update the exported models and revivers.
You can do so in the file `base/flight/index.ts` by following this template:

```typescript
// in the models/base/my-model/index.ts
import { MyModelCoreIfy, reviveMyModelFactory } from '../../core/my-model';
import type { MyModel as BaseModel } from './my-model';
import { reviveMyModel as baseReviver } from './my-model.reviver';

export type MyModel = MyModelCoreIfy<BaseModel>;
export const reviveMyModel = reviveMyModelFactory(baseReviver);
export type { MyModel as BaseMyModel };
```

> [!TIP]
> `MyModel` should be replaced by `Flight` throughout these template files.

Don't forget to check out the solution of this exercise!

