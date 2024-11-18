There are certain cases in which you want to be able to extend your SDK models, and therefore ensure that revivers are generated.

Let's continue with the use case of the previous exercise.\
In order to keep track of the user's current booking, it would be useful to generate an ID.
To do this, we can create a new model which extends the previously generated `Flight` type.

Before beginning the exercise, we need to make sure that the existing API was generated with model extension in the previous steps.
To verify this, check out the configuration used to generate the API (either the command line or the file `openapitools.json`).\
Ensure that the global property `allowModelExtension` has been set to `true`. This will guarantee that the revivers of the
base models are generated, which is essential for the following exercise.

### Exercise

Extensions of base models (located in the `base` folder) are created in the `core` folder.

#### Creating the extended model
First, let's create the type `FlightCoreIfy` in `libs/sdk/src/models/core/flight.ts`.
This type should extend the type `Flight`, imported from the `base` folder and add a new field `id: string`.

> [!NOTE]
> The naming convention requires the core model to contain the suffix `CoreIfy`.\
> You can find more information on core models in the
> <a href="https://github.com/AmadeusITGroup/otter/blob/main/docs/api-sdk/SDK_MODELS_HIERARCHY.md" target="_blank">SDK models hierarchy documentation</a>.

#### Creating the extended reviver
Then, you can create the reviver for this new core model in `libs/sdk/src/models/core/flight.reviver.ts`.\
This extended reviver will call the reviver of the base `Flight` model and add the `id` to the returned object.\
The base reviver should exist since we have ensured this during the prerequisites of the exercise.

#### Updating the exports
Once the core model and its reviver are created, we can go back to the base model to update the exported models and revivers.\
Update the file `libs/sdk/src/models/base/flight/index.ts` to export your extended model and reviver instead of the original.

You should now have your extension working!\
Check out the preview to see if the `id` has been added to the model.

> [!TIP]
> Don't forget to check out the solution of this exercise!

