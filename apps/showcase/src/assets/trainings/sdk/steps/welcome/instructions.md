This interactive tutorial will teach you how to generate and use an SDK using the Otter framework.

### How to use this tutorial
This tutorial is composed of two parts:

1. How to use an SDK
2. How to generate an SDK

We will cover explanations on these topics along with examples and exercises for better understanding.

\[Instructions for exercises]

### Prerequisites
#### Environment
To get started, your environment requires:

- [Node](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs)
  - Version 18.0.0 or above - minimum required version according to the [@ama-sdk/schematics package](https://github.com/AmadeusITGroup/otter/blob/main/packages/%40ama-sdk/schematics/package.json)
- [Java](https://adoptium.net/)
  - Version 11 or above - minimum required version according to [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator)

### Resources

> [!NOTE]
> We would like to specify that this is not an OpenAPI training.
> We invite you to familiarize yourself with OpenAPI and how to configure the generation SDK prior to starting this tutorial.
> We will refer to some OpenAPI concepts throughout this training when explaining our configuration options built on top of OpenAPI.

- [What is OpenAPI?](https://swagger.io/docs/specification/about/)
- [OpenAPI Specification](https://swagger.io/specification/)

### How to create your own SDK repository

There are two possibilities to generate an SDK:

#### Create a new single SDK repository

You can use the following command line:
```bash
yarn create @ama-sdk typescript <project-name> -- [--spec-path=./path/to/spec.yaml]
```

Note, you can replace `yarn` by `npm` if wanted.

#### Create a new Otter workspace package in an existing monorepo

This requires the schematics packages:
```bash
yarn ng add @ama-sdk/schematics
yarn ng add @ama-sdk/core
```
You can then generate the "shell" of the SDK package with the following command:
```bash
# Monorepo with Otter
yarn ng g sdk sdkName
# Monorepo without Otter
yarn schematics @o3r/workspace:sdk sdkName
```
