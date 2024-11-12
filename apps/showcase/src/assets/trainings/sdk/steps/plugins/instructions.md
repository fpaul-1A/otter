### Introduction

Thanks to the `@ama-sdk/core` plugins, you can intercept the API requests and responses to transform their data or
perform actions such as the authentication, logging etc.

These plugins will be applied before sending all the API requests and after the reception of the responses.

#### Pre-requisite

- Install `@ama-sdk/core`

#### Objectives

In this tutorial, you will configure the `PetApi` to send an id that will be shared all over the session and log for all your response
with a timestamp.

### Exercise

Create your own plugin that implements the `ReplyPlugin` interface to log the response from the server and a timestamp

You can inspire yourselves with the following code:
```typescript
class LogTimestampResponsePlugin implements ReplyPlugin {
  public load<K>(context: ReplyPluginContext<K>): PluginRunner<K | undefined, V> {
    return {
      transform: (data?: V) => {
        console.log(data, new Date());
        // You could modify the response here to add new fields etc.
        return ret;
      }
    };
  }
}
```

Add the `SessionIdRequest` to the list of the API `requestPlugins` of your ApiFetchClient and
your custom logging plugin to the `replyPlugins` list.

Note that the Otter framework provides many other plugins to help you manage your authentication, your exceptions, revive your model etc.\
You can have a look into the [project plugins](https://github.com/AmadeusITGroup/otter/tree/main/packages/%40ama-sdk/core/src/plugins)
for more information.
