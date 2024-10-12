# @apvee/azure-functions-openapi

## Overview

`@apvee/azure-functions-openapi` is an extension for Azure Functions V4 that simplifies the process of integrating OpenAPI documentation. It automatically generates and serves OpenAPI 2.0, 3.0.3, and 3.1.0 definitions and provides a Swagger UI for your Azure Functions. Built on top of `@asteasolutions/zod-to-openapi`, it uses **Zod Schemas** for type-safe request validation and response handling, ensuring that your API is well-documented and easy to explore.

## Benefits of Documenting APIs with OpenAPI

Documenting your APIs with OpenAPI offers several significant advantages:
- **Always Up-to-Date Documentation**: By integrating OpenAPI documentation directly into your codebase, you ensure that your API documentation is always in sync with the implementation. This reduces the risk of discrepancies between the documentation and the actual API behavior, leading to a more reliable and trustworthy API.
- **Auto-Generated Client Libraries**: OpenAPI specifications can be used to automatically generate client libraries for various programming languages. Tools like [Kiota](https://github.com/microsoft/kiota) and [OpenAPI Generator](https://openapi-generator.tech/) can create client SDKs that developers can use to interact with your API. This saves time and effort, as developers do not need to manually write and maintain client code.
- **Improved Developer Experience**: Comprehensive and accurate API documentation makes it easier for developers to understand and use your API. With tools like Swagger UI, developers can interact with your API directly from the documentation, making it easier to test and explore the available endpoints.
- **Enhanced API Testing**: OpenAPI documentation can be used to generate test cases and validate API responses. This helps ensure that your API behaves as expected and meets the defined specifications.
- **Standardization and Consistency**: Using OpenAPI promotes standardization and consistency across your API endpoints. This makes it easier for developers to work with your API and reduces the learning curve for new users.
- **Interoperability**: OpenAPI is a widely adopted standard, and many tools and platforms support it. By documenting your API with OpenAPI, you ensure that it can be easily integrated with other systems and tools that support the OpenAPI standard.

By leveraging the benefits of OpenAPI documentation, you can create a more robust, user-friendly, and maintainable API that meets the needs of both developers and end-users.

## Key Features

- **Automatic OpenAPI Specification Generation**: Generate OpenAPI 2.0, 3.0.3, and 3.1.0 definitions for your Azure Functions based on registered schemas and handlers.
- **Integrated Swagger UI**: Serve a Swagger UI interface that dynamically loads and visualizes the OpenAPI definitions.
- **Type-Safe Request and Response Validation**: Leverage Zod schemas to validate request bodies, query parameters, headers, and more.
- **Flexible API Configuration**: Customize security schemas, routes, authentication levels, and request/response handling through simple utility functions.
- **Native Azure Functions Support**: Seamlessly integrates with Azure Functions V4 to enhance your serverless applications with robust API documentation.

## Installation

To install the package and its dependencies, run:

```bash
npm install @apvee/azure-functions-openapi
```

You'll also need the following peer dependencies:
```bash
npm install @azure/functions zod
```

## Exposing OpenAPI and Swagger UI
You can expose OpenAPI documentation and serve a Swagger UI interface using two key functions: registerOpenAPIHandler and registerSwaggerUIHandler. These functions can be invoked from the index.ts file in the src directory of your Azure Functions project, making it easy to configure global behaviors for your functions.

### Expose OpenAPI Documentation
The registerOpenAPIHandler function registers an HTTP GET handler that serves the OpenAPI definition.

Example (index.ts):

```typescript
import { OpenAPIObjectConfig, registerOpenAPIHandler, registerSwaggerUIHandler } from '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';

app.setup({
    enableHttpStream: true
});

const openAPIConfig: OpenAPIObjectConfig = {
    info: {
        title: 'Simple Todo REST API',
        version: "1",
        contact: {
            name: "Apvee Solutions",
            email: "hello@apvee.com",
            url: "https://www.apvee.com"
        }
    },
    security: [],
    externalDocs: {
        description: "External Documentation",
        url: "https://www.apvee.com"
    },
    tags: [{
        name: "Todos",
        description: "My Tag Description",
        externalDocs: {
            description: "External Documentation",
            url: "https://www.apvee.com"
        }
    }]
}

const documents = [
    registerOpenAPIHandler("anonymous", openAPIConfig, "3.1.0", "json"),
    registerOpenAPIHandler("anonymous", openAPIConfig, "3.1.0", "yaml"),
    registerOpenAPIHandler("anonymous", openAPIConfig, "3.0.3", "json"),
    registerOpenAPIHandler("anonymous", openAPIConfig, "3.0.3", "yaml"),
    registerOpenAPIHandler("anonymous", openAPIConfig, "2.0", "json"),
    registerOpenAPIHandler("anonymous", openAPIConfig, "2.0", "yaml")
];

registerSwaggerUIHandler("anonymous", 'api', documents);
```

#### ```registerOpenAPIHandler```
This function registers an OpenAPI handler for an Azure Function.

**Parameters**:
- **authLevel**: The authorization level required to access the function ('anonymous', 'function', 'admin').
- **configuration**: The OpenAPI configuration object containing information about the API.
- **version**: The OpenAPI version to use ('2.0', '3.0.3', '3.1.0').
- **format**: The format of the OpenAPI document ('json', 'yaml').
- **route**: Optional. The route at which the OpenAPI document will be served. If not provided, a default route will be used based on the format and version.

**Returns**:
- An object containing the title and URL of the registered OpenAPI document.

**Example**:

```typescript
const documentInfo = registerOpenAPIHandler('anonymous', openAPIConfig, '3.1.0', 'json');
```

#### ```registerSwaggerUIHandler```
This function registers a Swagger UI handler for an Azure Function.

**Parameters**:
- **authLevel**: The authorization level required to access the function ('anonymous', 'function', 'admin').
- **route**: The route at which the Swagger UI will be served.
- **documents**: An array of OpenAPI document information objects.

**Example**:

```typescript
registerSwaggerUIHandler('anonymous', 'api', documents);
```

#### ```registerApiKeySecuritySchema```
This function registers an API key security schema in the OpenAPI registry.

**Parameters**:
- **name**: The name of the API key (e.g., **X-API-KEY**).
- **input**: The location of the API key in the request (**'header'**, **'query'**, or **'cookie'**).

**Example**:

```typescript
const securityRequirement = registerApiKeySecuritySchema('X-API-KEY', 'header');
```

#### ```registerTypeSchema```
This function registers Zod schemas as named types in the OpenAPI registry.

**Parameters**:
- **typeName**: The name to register the schema under.
- **schema**: The Zod schema defining the structure.

**Example**:

```typescript
const UserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
});
registerTypeSchema('User', UserSchema);
```

#### ```registerFunction```
This function registers an Azure Function with OpenAPI documentation, including HTTP methods, request validation, and response handling.

**Parameters**:
- **name**: The name of the Azure Function.
- **description**: A description for the OpenAPI documentation.
- **options**: Configuration for the handler, HTTP methods, request validation, and responses.

**Example**:

```typescript
registerFunction("myFunction", "Processes user data", {
    handler: async (req, ctx) => {
        const { name, age } = req.body;
        return {
            status: 200,
            jsonBody: { message: `User ${name} processed successfully` },
        };
    },
    methods: ['POST'],
    authLevel: 'anonymous',
    azureFunctionRoutePrefix: 'api',
    route: 'process-user',
    request: {
        body: { content: { "application/json": { schema: z.object({ name: z.string(), age: z.number() }) } } }
    },
    responses: {
        200: { description: "Success", content: { "application/json": { schema: z.object({ message: z.string() }) } } }
    }
});
```

##### Using ```registerFunction``` Instead of ```app.http```
In the context of integrating OpenAPI documentation with Azure Functions, it is recommended to use the ```registerFunction``` utility provided by ```@apvee/azure-functions-openapi``` instead of the standard ```app.http``` method. The ```registerFunction``` utility not only registers the function with the Azure Functions runtime but also handles the registration of the function for OpenAPI documentation.

**Why Use registerFunction?**
- **Automatic OpenAPI Registration**: ```registerFunction``` ensures that your function is automatically included in the OpenAPI documentation, making it easier to maintain and update your API specifications.
- **Seamless Integration**: It integrates seamlessly with the Azure Functions runtime, ensuring that your function behaves as expected while also being documented.
- **Enhanced Configuration**: Provides additional configuration options for request validation, response handling, and security schemas.

## Utility Functions for Handling Parameters with Zod

This library provides two utility functions to convert parameters from HttpRequestParams and URLSearchParams into plain JavaScript objects. These functions are useful for validating and processing parameters using Zod schemas.

```convertHttpRequestParamsToObject```:
This function converts an ```HttpRequestParams``` object (which is a ```Record<string, string>```) into a plain JavaScript object. Since all values in ```HttpRequestParams``` are strings, the resulting object will have key-value pairs where both keys and values are strings.

**Function Signature**:
```typescript
export function convertHttpRequestParamsToObject(params: HttpRequestParams): { [key: string]: string }
```

**Parameters**:
- **params**: The ```HttpRequestParams``` object to be converted.

**Returns**:
- A plain object where keys and values are strings.

**Example**:

```typescript
import { z } from 'zod';
import { convertHttpRequestParamsToObject } from './utils';

const params = { key1: 'value1', key2: 'value2' };
const paramsObject = convertHttpRequestParamsToObject(params);

const schema = z.object({
    key1: z.string(),
    key2: z.string()
});

const result = schema.parse(paramsObject);
```

```convertURLSearchParamsToObject```:
This function converts a ```URLSearchParams``` object into a plain JavaScript object. If a key appears multiple times, the corresponding value will be an array of values.

**Function Signature**:
```typescript
export function convertURLSearchParamsToObject(params: URLSearchParams): { [key: string]: string | string[] }
```

**Parameters**:
- **params**: The ```URLSearchParams``` object to be converted.

**Returns**:
- A plain object where keys are strings and values are either strings or arrays of strings.

**Example**:

```typescript
import { z } from 'zod';
import { convertURLSearchParamsToObject } from './utils';

const urlParams = new URLSearchParams('key1=value1&key2=value2&key2=value3');
const paramsObject = convertURLSearchParamsToObject(urlParams);

const schema = z.object({
    key1: z.string(),
    key2: z.union([z.string(), z.array(z.string())])
});

const result = schema.parse(paramsObject);
```
These utility functions facilitate the conversion of parameter objects into a format that can be easily validated using Zod schemas, ensuring type safety and consistency in your application.

## Conclusion
The ```@apvee/azure-functions-openapi``` library provides a robust and seamless way to integrate OpenAPI documentation with Azure Functions V4 and ensure that your API is well-documented, type-safe, and easy to maintain.

For a real-world example of how to use this library, you can refer to the test-functions project available in this monorepo. This project demonstrates the practical application of the library and can be found at the following link:

https://github.com/apvee/azure-functions-nodejs-monorepo/tree/main/packages/test-functions

By exploring the ```test-functions``` project, you can gain a better understanding of how to leverage the features provided by ```@apvee/azure-functions-openapi``` to enhance your Azure Functions with comprehensive OpenAPI documentation.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.