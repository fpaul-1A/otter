### Why an SDK?

If an application contains an API, there are several developer tasks that are required including a lot of redundant code.\
These tasks include:
- Choosing the needed techniques to perform API calls
- Determining which HTTP method to use for each request
- Managing the Authorization (maybe adding request headers) and do it for each request
- Preparing the URL with any path or query parameters expected by the API endpoint

Let's see how we use the OpenAPI tools to handle our APIs and generate a typescript SDK codebase.

Check out the diagram on the right to visualize the description below.

The specifications of the SDK are written in an OpenAPI document, which defines or describes an API and its elements.\
The API SDK is then generated using the OpenAPI Generator and the Otter SDK templates.\
These template files include the API interfaces and operations, models with their corresponding revivers, and mocked APIs that can be used for testing in
spec files.\
All these files together form the Typescript SDK.

This generated code is agnostic of any frontend framework.\
Therefore, it can be used both in the backend in a NodeJS server
application or in a frontend application displayed by browsers, mobiles, smartwatches etc.

### More information

You can find more information on the resources used through these links:

- [Specification](https://spec.openapis.org/oas/latest.html">OpenAPI)
- [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator)
- [Otter SDK models hierarchy](https://github.com/AmadeusITGroup/otter/blob/main/docs/api-sdk/SDK_MODELS_HIERARCHY.md)
  - [Model composition and inheritance](https://github.com/AmadeusITGroup/otter/blob/main/docs/api-sdk/COMPOSITION_INHERITANCE.md)
- [Otter SDK generator](https://github.com/AmadeusITGroup/otter/blob/main/packages/%40ama-sdk/schematics/README.md)
