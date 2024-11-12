### Introduction

When dealing with an Angular project, you will need to ensure that your `ApiClient` will be shared accross
your application.\
The Otter framework provides the `ApiManager` service to manage your API collection.

#### Prerequisite

- Install the `@o3r/apis-manager` in the project with `npm install @o3r/apis-manager`.

#### Objectives

Leverage the `ApiManager` service to access two different clients to retrieve the list of available
pets and submit an order for the first pet returned.


Add a plugin to the `OrderApi` to log each time a call is sent.

# Exercise

Integrate the `ApiManager` in your application module and configure it to use the `RequestLogPlugin` in the `OrderApi`.\
You can inspire yourself with the following lines:

```typescript
// Default configuration for all the APIs defined in the ApiManager
const apiConfig: ApiClient = new ApiFetchClient(
  {
    basePath: 'https://petstore3.swagger.io/api/v3',
    requestPlugins: [],
    fetchPlugins: [],
    logger
  }
);
const apiManager = new ApiManager(apiConfig, {
  // Configuration override for a specific API
  OrderApi: new ApiFetchClient({
    basePath: 'https://petstore3.swagger.io/api/v3',
    requestPlugins: [new RequestLogPlugin()],
    fetchPlugins: [],
    logger
  })
});

export const appConfig: ApplicationConfig = {
  providers: [],
  imports: [ApiManagerModule.forRoot(apiManager)]
};
```

Now, check out the [app.component.ts](training://exercise/apps/tutorial-app/src/app/app.component.ts) file and inject the ApiManager to use your unique instance of the `OrderApi` and
`PetApi`.\
In your constructor, update the `availablePets` list with the result of a call to `findPetsByStatus`.

Your application should be updated with the list of available pets.\
You only need to update the submit method to order the first available item.

Don't forget to refresh the list of available pets once this is done.

Check out your terminal, the request to the `OrderApi` have been logged just as configured in the `ApiManager`.
