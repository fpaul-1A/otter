When dealing with an Angular project, you need to ensure that your `ApiClient` will be shared accross
your application. The Otter framework provides the `ApiManager` service to manage your API collection.

### Objective
- Leverage the `ApiManager` service to access two different clients to retrieve the list of available pets and submit an order for the first pet returned.
- Add a plugin to the `OrderApi` to log each time a call is sent.

### Prerequisite
- The package `@o3r/apis-manager` needs to be installed in the project with `npm install @o3r/apis-manager` (which has already been done for you).

### Exercise
As you can see in the `app.config.ts` file, a plugin `RequestLogPlugin` has been created which displays an alert box when the API receives a request.

Integrate the `ApiManagerModule` in your `ApplicationConfig` and configure it to use the `RequestLogPlugin` in the `StoreApi`.
You can inspire yourself with the following lines:

```typescript
// Default configuration for all the APIs defined in the ApiManager
const apiConfig: ApiClient = new ApiFetchClient(
  {
    // Properties of ApiFetchClient
  }
);
const apiManager = new ApiManager(apiConfig, {
  // Configuration override for a specific API
  StoreApi: new ApiFetchClient({
    // Properties of ApiFetchClient
  })
});

export const appConfig: ApplicationConfig = {
  providers: [importProvidersFrom(ApiManagerModule.forRoot(apiManager))]
};
```

Now, checkout the `app.component.ts` file and inject the `ApiFactoryService` to use your unique instance of the `StoreApi` and `PetApi`.
In the existing functions, update the `pets` signal with the result of a call to `findPetsByStatus` and the `petsInventory` signal with the the result of `getInventory`.

Now, when clicking the **Get Available Pets** button, your table should be updated with the list of available pets (without the alert box).
When clicking the **Get Inventory** button, you should see the request to the `StoreApi` logged in the alert box.
