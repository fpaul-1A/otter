### Objectives

For this example, you will use the public PetStore project API.\
You will perform a simple call and retrieve a list of pets from an SDK programmatically generated from their public specification.\
As this step requires a JAVA setup, it has already been done for you.\
You will just need to integrate the Otter SDK client and perform your call.

### Exercise

Let's create a fetch client in your application and use it to access your API.\
You can get inspiration from the following code:
```typescript
const apiConfig: ApiClient = new ApiFetchClient(
  {
    basePath: 'https://petstore3.swagger.io/api/v3',
    requestPlugins: [],
    fetchPlugins: [],
    logger
  }
);
const api = new PetApi(apiConfig);
```

Now, you can call the api object to perform the HTTP request you look for.\
Have a look at the `sdk/api/pet.api.ts` folder and look for the `findPetsByStatus`.

For this exercise, you will look for the available items and you will only show the name of the ten first pet in the allocated
space (look for the div with the `result` id).

See how you can benefit from the typecheck thanks to the SDK generated interfaces.

