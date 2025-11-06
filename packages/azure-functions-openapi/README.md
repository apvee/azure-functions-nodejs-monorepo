# @apvee/azure-functions-openapi

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Version 2.0** - A complete rewrite with improved TypeScript support, automatic type inference, and enhanced Azure integration.

![Apvee Azure Functions OpenAPI v2](https://raw.githubusercontent.com/apvee/azure-functions-nodejs-monorepo/main/packages/azure-functions-openapi/assets/apvee-azure-functions-openapi-v2.png)

## 📖 Overview

`@apvee/azure-functions-openapi` is a powerful extension for **Azure Functions V4** that automatically generates and serves OpenAPI documentation for your serverless APIs. Built on top of `@asteasolutions/zod-to-openapi` and leveraging **Zod schemas** for validation, it ensures your API is always type-safe, well-documented, and easy to explore.

### What Makes v2.0 Special?

This major release introduces a **modern, ergonomic API** through TypeScript module augmentation, directly extending the `@azure/functions` app object with intuitive methods. Write less boilerplate, get full type inference, and enjoy seamless integration with Azure Functions runtime.

```typescript
import "@apvee/azure-functions-openapi";
import { app } from "@azure/functions";
import { z } from "zod";

// Setup OpenAPI documentation
app.openapiSetup({
  info: { title: "My API", version: "1.0.0" },
});

// Register a fully typed endpoint
app.openapiPath("GetUser", "Get user by ID", {
  typedHandler: async ({ params, context }) => {
    // params.id is automatically typed as string!
    const user = await getUser(params.id);
    return { jsonBody: user };
  },
  methods: ["GET"],
  route: "users/{id}",
  params: z.object({ id: z.string().uuid() }),
  response: UserSchema,
});
```

### Key Capabilities

- 🎯 **Automatic Type Inference** - TypeScript infers all parameter types from your Zod schemas
- 📝 **Multi-Version OpenAPI** - Generate specs in OpenAPI 2.0, 3.0.3, and 3.1.0 formats
- 🎨 **Integrated Swagger UI** - Beautiful, interactive API documentation out of the box
- 🔒 **Azure Security Built-in** - Native support for Function Keys, EasyAuth, and Azure AD
- ✅ **Runtime Validation** - Automatic request/response validation with detailed error messages
- 🌐 **Webhook Support** - Document callback endpoints with OpenAPI 3.1.0 webhooks
- 🚀 **Zero Config** - Sensible defaults with full customization when needed

---

## ✨ What's New in v2.0

Version 2.0 is a complete rewrite that brings significant improvements in developer experience, performance, and Azure integration. Here's what changed:

### 🎨 Modern API with Module Augmentation

**Before (v1.x):**
```typescript
import { registerFunction, registerOpenAPIHandler } from '@apvee/azure-functions-openapi';

registerOpenAPIHandler('anonymous', config, '3.1.0', 'json');
registerFunction('GetUser', 'Get user', { /* ... */ });
```

**Now (v2.x):**
```typescript
import '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';

app.openapiSetup({ info: { title: 'My API', version: '1.0.0' } });
app.openapiPath('GetUser', 'Get user', { /* ... */ });
```

The new API extends Azure Functions natively, providing better IDE support and a more intuitive developer experience.

### 🎯 Automatic Type Inference with Typed Handlers

The biggest feature in v2.0 is **automatic type inference**. No more manual type assertions!

```typescript
app.openapiPath('UpdateUser', 'Update user information', {
  typedHandler: async ({ params, body, query, context }) => {
    // All parameters are automatically typed from your schemas!
    // params.id: string (from UUID schema)
    // body.name: string
    // body.email: string
    // query.notify: boolean | undefined
    
    await updateUser(params.id, body);
    return { jsonBody: { success: true } };
  },
  methods: ['PUT'],
  route: 'users/{id}',
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ 
    name: z.string().min(1),
    email: z.string().email() 
  }),
  query: z.object({ 
    notify: z.boolean().optional() 
  })
});
```

### 🔒 Enhanced Azure Security Support

v2.0 introduces native support for multiple Azure authentication methods:

- **Azure Function Keys** - Built-in support for function, admin, and anonymous auth levels
- **Azure EasyAuth** - Integration with App Service Authentication (AAD, Google, Facebook, GitHub, etc.)
- **Azure AD Bearer Token** - Manual JWT validation for Microsoft Entra ID
- **Azure AD Client Credentials** - Service-to-service authentication with app roles
- **Custom API Keys** - Flexible header/query/cookie-based authentication

```typescript
// Azure EasyAuth example
const easyAuth = app.openapiEasyAuth('aad');

app.openapiPath('GetProfile', 'Get user profile', {
  handler: getProfileHandler,
  methods: ['GET'],
  route: 'profile',
  authLevel: 'anonymous', // Required for EasyAuth
  security: [easyAuth],
  response: ProfileSchema
});
```

### 📦 Local Swagger UI Assets

v2.0 serves Swagger UI assets **locally from node_modules** instead of loading from CDN:

- ✅ **Better Performance** - No external dependencies, faster load times
- ✅ **Offline Support** - Works without internet connection
- ✅ **Security** - No third-party CDN risks
- ✅ **Monorepo Support** - Automatically detects local or root node_modules
- ✅ **Caching** - Built-in ETag support for optimal caching

### 🔄 Zod 4 Compatibility

Fully aligned with **Zod 4.x**, ensuring compatibility with the latest validation features and improvements:

```json
{
  "peerDependencies": {
    "@azure/functions": "^4.0.0",
    "zod": "^4.0.0"
  }
}
```

### 🌐 OpenAPI 3.1.0 Webhook Support

Document callback endpoints that your API calls using the new **webhooks** feature:

```typescript
app.openapiWebhook('OrderCreated', 'Notify when order is created', {
  typedHandler: async ({ body, context }) => {
    context.log(`Webhook received: Order ${body.orderId}`);
    return { jsonBody: { received: true } };
  },
  methods: ['POST'],
  body: OrderEventSchema,
  responses: [
    { httpCode: 200, description: 'Success' }
  ]
});
```

### ⚡ Simplified Configuration

Setup is now **much simpler** with a single `openapiSetup()` call:

```typescript
// Generates all versions and formats automatically
app.openapiSetup({
  info: { title: 'My API', version: '1.0.0' },
  routePrefix: 'api',
  versions: ['3.1.0', '3.0.3', '2.0'], // Optional, defaults to ['3.1.0']
  formats: ['json', 'yaml'],           // Optional, defaults to ['json', 'yaml']
  swaggerUI: { 
    enabled: true,                     // Optional, defaults to true
    route: 'docs'                      // Optional, defaults to 'swagger-ui'
  }
});
```

### 🛠️ New Utility Functions

Export powerful utilities for manual validation and parsing:

- `parseRouteParams()` - Validate route parameters
- `parseQueryParams()` - Validate query strings
- `parseBody()` - Validate request body
- `parseHeaders()` - Validate headers
- `parseEasyAuthPrincipal()` - Decode Azure EasyAuth user info
- `extractFunctionKey()` - Extract function keys from requests
- `createTypedHandler()` - Create typed handlers programmatically

### 📋 Breaking Changes Summary

While v2.0 brings many improvements, some APIs have changed. See the [Migration Guide](#-migration-guide-v1-v2) below for detailed migration steps.

**Removed APIs:**
- `registerOpenAPIHandler()` → Use `app.openapiSetup()`
- `registerSwaggerUIHandler()` → Use `app.openapiSetup()`
- `registerFunction()` → Use `app.openapiPath()` or `app.openapiWebhook()`
- `registerApiKeySecuritySchema()` → Use `app.openapiKeySecurity()`
- `registerTypeSchema()` → Use `app.openapiSchema()`

**Private APIs:**
- `convertHttpRequestParamsToObject()` - Now internal, use `parseRouteParams()` instead
- `convertURLSearchParamsToObject()` - Now internal, use `parseQueryParams()` instead

---

## 🎯 Why Document APIs with OpenAPI?

OpenAPI documentation is more than just nice-to-have—it's a fundamental part of modern API development that delivers tangible benefits to both API producers and consumers.

### Always Up-to-Date Documentation

By integrating OpenAPI documentation directly into your codebase, you ensure that your API documentation is **always in sync** with the implementation. No more outdated docs, no more discrepancies between what's documented and what's actually deployed.

```typescript
// Documentation is generated from the same schemas used for validation
app.openapiPath('CreateUser', 'Create a new user', {
  typedHandler: async ({ body, context }) => {
    // This schema validates the request AND generates the documentation
    return { status: 201, jsonBody: await createUser(body) };
  },
  methods: ['POST'],
  route: 'users',
  body: z.object({
    name: z.string().min(1).describe('User full name'),
    email: z.string().email().describe('Valid email address'),
    age: z.number().int().positive().optional().describe('User age')
  }),
  response: UserSchema
});
```

### Auto-Generated Client Libraries

OpenAPI specifications can be used to automatically generate **type-safe client libraries** for various programming languages:

- **[Kiota](https://github.com/microsoft/kiota)** - Microsoft's OpenAPI-based API client generator
- **[OpenAPI Generator](https://openapi-generator.tech/)** - Supports 50+ languages
- **[oazapfts](https://github.com/oazapfts/oazapfts)** - TypeScript-first OpenAPI client generator

This saves development time and ensures API consumers have reliable, type-safe SDKs without manual coding.

### Enhanced Developer Experience

Comprehensive and accurate API documentation makes it easier for developers to understand and use your API:

- **Interactive Testing** - Swagger UI allows developers to test endpoints directly from documentation
- **Type Definitions** - Clear request/response schemas with examples
- **Authentication Details** - Security requirements clearly documented
- **Validation Rules** - Understand constraints before making requests

### Improved API Testing

OpenAPI documentation enables:

- **Contract Testing** - Validate that implementation matches the spec
- **Mock Servers** - Generate mock APIs for frontend development
- **Test Case Generation** - Automatically create test scenarios from schemas
- **Response Validation** - Ensure API responses match documented structure

### Standardization and Interoperability

OpenAPI is a **widely adopted industry standard** supported by thousands of tools and platforms:

- API Gateways (Azure API Management, Kong, AWS API Gateway)
- Monitoring Tools (Postman, Insomnia, Paw)
- Testing Frameworks (Dredd, Schemathesis, REST Assured)
- Documentation Platforms (Redoc, Stoplight, Readme.io)

By documenting with OpenAPI, your API becomes easily integrable with the entire ecosystem.

---

## 🚀 Key Features

### Module Augmentation API

Extends `@azure/functions` natively with intuitive OpenAPI methods. No separate imports needed—just extend the app object you already use.

```typescript
import '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';

// All app.openapiXxx() methods are now available
app.openapiSetup({ /* config */ });
app.openapiPath('MyEndpoint', 'Description', { /* config */ });
```

### Automatic Type Inference

TypeScript automatically infers parameter types from Zod schemas. No manual type assertions, no type mismatches.

```typescript
app.openapiPath('UpdateTodo', 'Update a todo item', {
  typedHandler: async ({ params, body }) => {
    // params.id is automatically string (from UUID schema)
    // body.title is automatically string
    // body.completed is automatically boolean
    const updated = { id: params.id, ...body };
    return { jsonBody: updated };
  },
  methods: ['PUT'],
  route: 'todos/{id}',
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string(),
    completed: z.boolean()
  })
});
```

### Multi-Version OpenAPI Support

Generate OpenAPI specifications in multiple versions and formats simultaneously:

- **OpenAPI 3.1.0** - Latest spec with full JSON Schema support and webhooks
- **OpenAPI 3.0.3** - Widely supported by most tools
- **OpenAPI 2.0 (Swagger)** - Legacy support for older tools

Export in **JSON** or **YAML** format to suit your needs.

### Integrated Swagger UI

Beautiful, interactive API documentation served automatically:

```typescript
app.openapiSetup({
  info: { title: 'My API', version: '1.0.0' },
  swaggerUI: {
    enabled: true,
    route: 'docs' // Access at: http://localhost:7071/docs
  }
});
```

Swagger UI assets are served **locally** for better performance, security, and offline support.

### Type-Safe Request Validation

Leverage Zod schemas to validate all aspects of HTTP requests:

- **Route Parameters** - `/users/{id}` with UUID validation
- **Query Strings** - Pagination, filtering, sorting with type coercion
- **Request Body** - JSON payloads with nested object validation
- **Headers** - Custom headers like API keys or tokens

Validation errors automatically return **400 Bad Request** with detailed error messages.

### Comprehensive Azure Security Support

Native integration with Azure authentication mechanisms:

| Security Method | Use Case | Example |
|----------------|----------|---------|
| **Function Keys** | Azure native key-based auth | API keys managed by Azure |
| **EasyAuth** | App Service Authentication | AAD, Google, Facebook, GitHub |
| **Azure AD Bearer** | Manual JWT validation | Entra ID token validation |
| **Client Credentials** | Service-to-service auth | Daemon apps, background jobs |
| **Custom API Keys** | User-implemented auth | Header/query/cookie keys |

```typescript
// Example: Azure AD Bearer Token
const adAuth = app.openapiAzureADBearer({
  name: 'AzureAD',
  scopes: ['User.Read', 'Mail.Send']
});

app.openapiPath('SendEmail', 'Send email on behalf of user', {
  handler: sendEmailHandler,
  methods: ['POST'],
  route: 'send-email',
  security: [adAuth],
  body: EmailSchema
});
```

### OpenAPI 3.1.0 Webhooks

Document callback endpoints that your API calls using the webhooks feature:

```typescript
app.openapiWebhook('PaymentCompleted', 'Notify when payment is completed', {
  typedHandler: async ({ body, context }) => {
    context.log(`Payment ${body.paymentId} completed`);
    return { jsonBody: { acknowledged: true } };
  },
  methods: ['POST'],
  body: PaymentEventSchema
});
```

### Advanced Response Configuration

Support for complex response scenarios:

- **Multiple Status Codes** - Document 200, 201, 400, 404, 500, etc.
- **Multiple Content Types** - JSON, XML, PDF, CSV in the same endpoint
- **Response Headers** - Rate limits, pagination info, custom headers
- **Detailed Descriptions** - Clear documentation for each response

```typescript
app.openapiPath('GetReport', 'Get report in multiple formats', {
  handler: getReportHandler,
  methods: ['GET'],
  route: 'reports/{id}',
  params: z.object({ id: z.string() }),
  responses: [
    {
      httpCode: 200,
      description: 'Report retrieved successfully',
      content: [
        { mediaType: 'application/json', schema: JsonReportSchema },
        { mediaType: 'application/pdf', schema: z.instanceof(Buffer) },
        { mediaType: 'text/csv', schema: z.string() }
      ]
    },
    {
      httpCode: 404,
      description: 'Report not found',
      schema: ErrorSchema
    }
  ]
});
```

### Rich Utility Functions

Export powerful utilities for advanced use cases:

```typescript
import {
  parseRouteParams,
  parseQueryParams,
  parseBody,
  parseHeaders,
  parseEasyAuthPrincipal,
  extractFunctionKey,
  createTypedHandler,
  ValidationError
} from '@apvee/azure-functions-openapi';
```

### Zero Configuration Defaults

Get started quickly with sensible defaults, customize when needed:

```typescript
// Minimal setup - generates OpenAPI 3.1.0 in JSON/YAML + Swagger UI
app.openapiSetup({
  info: { title: 'My API', version: '1.0.0' }
});

// Or fully customize everything
app.openapiSetup({
  info: { /* ... */ },
  routePrefix: 'api',
  versions: ['3.1.0', '3.0.3', '2.0'],
  formats: ['json', 'yaml'],
  authLevel: 'anonymous',
  security: [globalSecurityScheme],
  servers: [{ url: 'https://api.example.com' }],
  tags: [{ name: 'Users', description: 'User management' }],
  swaggerUI: {
    enabled: true,
    route: 'docs',
    authLevel: 'anonymous'
  }
});
```

---

## 📦 Installation

Install the package using npm, yarn, or pnpm:

```bash
npm install @apvee/azure-functions-openapi
```

### Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install @azure/functions zod
```

### Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| `@apvee/azure-functions-openapi` | `^2.0.0` | This library |
| `@azure/functions` | `^4.0.0` | Azure Functions runtime |
| `zod` | `^4.0.0` | Schema validation |
| Node.js | `>=18.0.0` | Recommended: Node 20 LTS |

### Complete Installation

For a new Azure Functions project with TypeScript:

```bash
# Create a new Azure Functions project
func init my-api --typescript

# Navigate to project
cd my-api

# Install dependencies
npm install @azure/functions zod
npm install @apvee/azure-functions-openapi

# Install dev dependencies
npm install -D typescript @types/node
```

### Verification

Verify the installation by importing the package:

```typescript
import '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';
import { z } from 'zod';

console.log('✅ Installation successful!');
```

---

## 🚀 Quick Start

Get your first OpenAPI-documented Azure Function running in minutes.

### Step 1: Setup OpenAPI

Create or edit your `src/index.ts` file:

```typescript
import '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';

// Configure OpenAPI documentation
app.openapiSetup({
  info: {
    title: 'My First API',
    version: '1.0.0',
    description: 'A simple API with OpenAPI documentation'
  }
});
```

### Step 2: Create Your First Endpoint

Add a simple GET endpoint:

```typescript
import { z } from 'zod';

// Define response schema
const GreetingSchema = z.object({
  message: z.string(),
  timestamp: z.string()
});

// Register endpoint with OpenAPI documentation
app.openapiPath('GetGreeting', 'Get a greeting message', {
  typedHandler: async ({ query, context }) => {
    const name = query.name || 'World';
    
    context.log(`Greeting requested for: ${name}`);
    
    return {
      jsonBody: {
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString()
      }
    };
  },
  methods: ['GET'],
  route: 'greet',
  query: z.object({
    name: z.string().optional().describe('Name to greet')
  }),
  response: GreetingSchema
});
```

### Step 3: Run Your Function

Start the Azure Functions runtime:

```bash
npm start
# or
func start
```

### Step 4: Access Your API Documentation

Open your browser and navigate to:

- **Swagger UI**: http://localhost:7071/swagger-ui
- **OpenAPI JSON**: http://localhost:7071/api/openapi/3.1.0.json
- **OpenAPI YAML**: http://localhost:7071/api/openapi/3.1.0.yaml

### Step 5: Test Your Endpoint

Try your new endpoint:

```bash
# Without name parameter
curl http://localhost:7071/api/greet

# With name parameter
curl "http://localhost:7071/api/greet?name=Azure"
```

**Response:**
```json
{
  "message": "Hello, Azure!",
  "timestamp": "2025-11-06T12:34:56.789Z"
}
```

### Complete Quick Start Example

Here's the full `src/index.ts` file:

```typescript
import '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';
import { z } from 'zod';

// Setup OpenAPI
app.openapiSetup({
  info: {
    title: 'My First API',
    version: '1.0.0',
    description: 'A simple API with OpenAPI documentation',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  tags: [
    { name: 'Greetings', description: 'Greeting endpoints' }
  ]
});

// Define schemas
const GreetingSchema = z.object({
  message: z.string(),
  timestamp: z.string()
});

// Register endpoint
app.openapiPath('GetGreeting', 'Get a personalized greeting', {
  typedHandler: async ({ query, context }) => {
    const name = query.name || 'World';
    context.log(`Greeting requested for: ${name}`);
    
    return {
      jsonBody: {
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString()
      }
    };
  },
  methods: ['GET'],
  route: 'greet',
  tags: ['Greetings'],
  query: z.object({
    name: z.string().optional().describe('Name to greet (default: World)')
  }),
  response: GreetingSchema
});
```

🎉 **Congratulations!** You now have a fully documented API with automatic type inference, request validation, and interactive Swagger UI.

---

## 📘 Core Concepts

### Setup OpenAPI Documentation

The `app.openapiSetup()` method is the entry point for configuring OpenAPI documentation. Call it once in your `src/index.ts` file before registering any endpoints.

#### Basic Setup

Minimal configuration with defaults:

```typescript
import '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';

app.openapiSetup({
  info: {
    title: 'My API',
    version: '1.0.0'
  }
});
```

This generates:
- OpenAPI 3.1.0 in JSON and YAML formats
- Swagger UI at `/swagger-ui`
- Documents accessible at `/api/openapi/3.1.0.json` and `/api/openapi/3.1.0.yaml`

#### Complete Configuration

Full example with all available options:

```typescript
app.openapiSetup({
  // Required: API metadata
  info: {
    title: 'Todo API',
    version: '2.0.0',
    description: 'A comprehensive todo management API',
    termsOfService: 'https://example.com/terms',
    contact: {
      name: 'API Support Team',
      email: 'api-support@example.com',
      url: 'https://example.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },

  // Optional: Server configurations
  servers: [
    {
      url: 'https://api.example.com',
      description: 'Production server'
    },
    {
      url: 'https://staging-api.example.com',
      description: 'Staging server'
    },
    {
      url: 'http://localhost:7071',
      description: 'Local development'
    }
  ],

  // Optional: Global security requirements
  security: [
    { BearerAuth: [] }  // Apply to all endpoints by default
  ],

  // Optional: External documentation
  externalDocs: {
    description: 'Full API Documentation',
    url: 'https://docs.example.com/api'
  },

  // Optional: Tags for organizing endpoints
  tags: [
    {
      name: 'Todos',
      description: 'Todo item operations',
      externalDocs: {
        description: 'Todo guide',
        url: 'https://docs.example.com/todos'
      }
    },
    {
      name: 'Users',
      description: 'User management operations'
    }
  ],

  // Optional: Azure Functions route prefix (default: 'api')
  routePrefix: 'api',

  // Optional: Authorization level for OpenAPI endpoints (default: 'anonymous')
  authLevel: 'anonymous',

  // Optional: OpenAPI versions to generate (default: ['3.1.0'])
  versions: ['3.1.0', '3.0.3', '2.0'],

  // Optional: Output formats (default: ['json', 'yaml'])
  formats: ['json', 'yaml'],

  // Optional: Swagger UI configuration
  swaggerUI: {
    enabled: true,              // default: true
    route: 'docs',              // default: 'swagger-ui'
    authLevel: 'anonymous'      // default: same as main authLevel
  }
});
```

#### Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `info` | `InfoObject` | **Required** | API metadata (title, version, description, etc.) |
| `servers` | `ServerObject[]` | `undefined` | Server URLs for different environments |
| `security` | `SecurityRequirementObject[]` | `undefined` | Global security requirements |
| `externalDocs` | `ExternalDocumentationObject` | `undefined` | Link to external documentation |
| `tags` | `TagObject[]` | `undefined` | Tags for organizing endpoints |
| `routePrefix` | `string` | `'api'` | Azure Functions route prefix |
| `authLevel` | `'anonymous' \| 'function' \| 'admin'` | `'anonymous'` | Auth level for OpenAPI/Swagger endpoints |
| `versions` | `Array<'2.0' \| '3.0.3' \| '3.1.0'>` | `['3.1.0']` | OpenAPI versions to generate |
| `formats` | `Array<'json' \| 'yaml'>` | `['json', 'yaml']` | Output formats |
| `swaggerUI.enabled` | `boolean` | `true` | Enable/disable Swagger UI |
| `swaggerUI.route` | `string` | `'swagger-ui'` | Swagger UI route |
| `swaggerUI.authLevel` | `'anonymous' \| 'function' \| 'admin'` | Same as main `authLevel` | Auth level for Swagger UI |

#### Generated Endpoints

Based on your configuration, the following endpoints are automatically created:

**OpenAPI Documents:**
```
GET /{routePrefix}/openapi/3.1.0.json
GET /{routePrefix}/openapi/3.1.0.yaml
GET /{routePrefix}/openapi/3.0.3.json
GET /{routePrefix}/openapi/3.0.3.yaml
GET /{routePrefix}/openapi/2.0.json
GET /{routePrefix}/openapi/2.0.yaml
```

**Swagger UI:**
```
GET /{swaggerUI.route}
GET /{swaggerUI.route}/assets/{file}
```

#### Example: Multiple Environments

Configure different servers for different deployment stages:

```typescript
app.openapiSetup({
  info: {
    title: 'Multi-Environment API',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'https://{environment}.api.example.com',
      description: 'Environment-based server',
      variables: {
        environment: {
          default: 'prod',
          enum: ['prod', 'staging', 'dev'],
          description: 'Environment name'
        }
      }
    }
  ]
});
```

#### Example: Secured Documentation

Require authentication to view OpenAPI docs and Swagger UI:

```typescript
app.openapiSetup({
  info: {
    title: 'Secured API',
    version: '1.0.0'
  },
  authLevel: 'function',  // Require function key
  swaggerUI: {
    enabled: true,
    route: 'docs',
    authLevel: 'admin'    // Require admin key for Swagger UI
  }
});
```

Access requires a key:
```bash
# Access OpenAPI with function key
curl "http://localhost:7071/api/openapi/3.1.0.json?code=YOUR_FUNCTION_KEY"

# Access Swagger UI with admin key
curl "http://localhost:7071/docs?code=YOUR_ADMIN_KEY"
```

---

### Registering HTTP Endpoints

The `app.openapiPath()` method registers HTTP endpoints with OpenAPI documentation. It replaces the traditional `app.http()` method and automatically handles both Azure Functions registration and OpenAPI documentation generation.

#### Basic Endpoint

Simple GET endpoint without parameters:

```typescript
import { z } from 'zod';

const StatusSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string()
});

app.openapiPath('GetStatus', 'Get API status', {
  handler: async (request, context) => {
    return {
      jsonBody: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  },
  methods: ['GET'],
  route: 'status',
  response: StatusSchema
});
```

#### Endpoint with Path Parameters

Extract values from the URL path:

```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string()
});

app.openapiPath('GetUser', 'Get user by ID', {
  typedHandler: async ({ params, context }) => {
    // params.id is automatically typed as string and validated as UUID
    context.log(`Fetching user: ${params.id}`);
    
    const user = await getUserById(params.id);
    return { jsonBody: user };
  },
  methods: ['GET'],
  route: 'users/{id}',
  params: z.object({
    id: z.string().uuid().describe('User unique identifier')
  }),
  response: UserSchema
});
```

#### Endpoint with Query Parameters

Handle query strings with validation:

```typescript
const TodoListSchema = z.object({
  todos: z.array(TodoSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number()
});

app.openapiPath('ListTodos', 'List todos with pagination', {
  typedHandler: async ({ query, context }) => {
    // query parameters are automatically typed and coerced
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const status = query.status;
    
    const todos = await getTodos({ page, pageSize, status });
    
    return {
      jsonBody: {
        todos,
        total: todos.length,
        page,
        pageSize
      }
    };
  },
  methods: ['GET'],
  route: 'todos',
  query: z.object({
    page: z.coerce.number().int().positive().default(1).describe('Page number'),
    pageSize: z.coerce.number().int().positive().max(100).default(10).describe('Items per page'),
    status: z.enum(['pending', 'completed', 'all']).optional().describe('Filter by status')
  }),
  response: TodoListSchema
});
```

#### Endpoint with Request Body

POST/PUT/PATCH endpoints with JSON body:

```typescript
const CreateTodoSchema = z.object({
  title: z.string().min(1).max(200).describe('Todo title'),
  description: z.string().optional().describe('Todo description'),
  dueDate: z.string().datetime().optional().describe('Due date in ISO format')
});

const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  completed: z.boolean(),
  createdAt: z.string()
});

app.openapiPath('CreateTodo', 'Create a new todo', {
  typedHandler: async ({ body, context }) => {
    // body is automatically typed and validated
    context.log(`Creating todo: ${body.title}`);
    
    const newTodo = await createTodo(body);
    
    return {
      status: 201,
      jsonBody: newTodo
    };
  },
  methods: ['POST'],
  route: 'todos',
  body: CreateTodoSchema,
  response: TodoSchema
});
```

#### Endpoint with Multiple HTTP Methods

Support multiple methods on the same route:

```typescript
app.openapiPath('ManageTodo', 'Manage todo item', {
  typedHandler: async ({ request, params, body, context }) => {
    const method = request.method;
    const todoId = params.id;
    
    switch (method) {
      case 'GET':
        return { jsonBody: await getTodo(todoId) };
      case 'PUT':
        return { jsonBody: await updateTodo(todoId, body) };
      case 'DELETE':
        await deleteTodo(todoId);
        return { status: 204 };
      default:
        return { status: 405, body: 'Method not allowed' };
    }
  },
  methods: ['GET', 'PUT', 'DELETE'],
  route: 'todos/{id}',
  params: z.object({ id: z.string().uuid() }),
  body: UpdateTodoSchema,
  responses: [
    { httpCode: 200, schema: TodoSchema, description: 'Todo retrieved' },
    { httpCode: 204, description: 'Todo deleted' }
  ]
});
```

#### Endpoint with Custom Headers

Validate custom request headers:

```typescript
app.openapiPath('SecureEndpoint', 'Endpoint with custom API key', {
  typedHandler: async ({ headers, context }) => {
    // headers are automatically typed and validated
    const apiKey = headers['x-api-key'];
    
    context.log(`Request with API key: ${apiKey.substring(0, 8)}...`);
    
    return { jsonBody: { authenticated: true } };
  },
  methods: ['GET'],
  route: 'secure/data',
  headers: z.object({
    'x-api-key': z.string().min(32).describe('API key for authentication'),
    'x-request-id': z.string().uuid().optional().describe('Optional request tracking ID')
  }),
  response: z.object({ authenticated: z.boolean() })
});
```

#### Endpoint with Multiple Responses

Document different response codes:

```typescript
const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.any().optional()
});

app.openapiPath('UpdateTodo', 'Update an existing todo', {
  typedHandler: async ({ params, body, context }) => {
    try {
      const todo = await getTodo(params.id);
      
      if (!todo) {
        return {
          status: 404,
          jsonBody: {
            error: 'Todo not found',
            code: 'TODO_NOT_FOUND'
          }
        };
      }
      
      const updated = await updateTodo(params.id, body);
      
      return {
        status: 200,
        jsonBody: updated
      };
    } catch (error) {
      return {
        status: 500,
        jsonBody: {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: error.message
        }
      };
    }
  },
  methods: ['PUT'],
  route: 'todos/{id}',
  params: z.object({ id: z.string().uuid() }),
  body: UpdateTodoSchema,
  responses: [
    {
      httpCode: 200,
      description: 'Todo updated successfully',
      schema: TodoSchema
    },
    {
      httpCode: 404,
      description: 'Todo not found',
      schema: ErrorSchema
    },
    {
      httpCode: 500,
      description: 'Internal server error',
      schema: ErrorSchema
    }
  ]
});
```

#### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `handler` | `HttpHandler` | One of `handler` or `typedHandler` | Traditional Azure Functions handler |
| `typedHandler` | `TypedHandler` | One of `handler` or `typedHandler` | Typed handler with auto validation |
| `methods` | `HttpMethod[]` | ✅ Yes | HTTP methods (GET, POST, PUT, etc.) |
| `route` | `string` | ✅ Yes | Route path (without prefix) |
| `params` | `ZodSchema` | No | Route parameters schema |
| `query` | `ZodSchema` | No | Query string parameters schema |
| `body` | `ZodSchema` | No | Request body schema (JSON) |
| `headers` | `ZodObject` | No | Request headers schema |
| `response` | `ZodSchema` | No | Single response shortcut (assumes 200 OK) |
| `responses` | `ResponseConfig[]` | No | Multiple response configurations |
| `authLevel` | `'anonymous' \| 'function' \| 'admin'` | No | Azure Functions auth level |
| `security` | `SecurityRequirementObject[]` | No | Security requirements for this endpoint |
| `tags` | `string[]` | No | OpenAPI tags for organization |
| `description` | `string` | No | Detailed description |
| `deprecated` | `boolean` | No | Mark endpoint as deprecated |
| `operationId` | `string` | No | Unique operation ID (defaults to name) |

#### Traditional Handler vs Typed Handler

**Traditional Handler** - Manual parsing and validation:

```typescript
app.openapiPath('CreateUser', 'Create user', {
  handler: async (request, context) => {
    // Manual parsing required
    const body = await request.json();
    const { name, email } = body;
    
    // Manual validation
    if (!name || !email) {
      return { status: 400, body: 'Missing required fields' };
    }
    
    const user = await createUser({ name, email });
    return { jsonBody: user };
  },
  methods: ['POST'],
  route: 'users',
  body: CreateUserSchema
});
```

**Typed Handler** - Automatic parsing and validation:

```typescript
app.openapiPath('CreateUser', 'Create user', {
  typedHandler: async ({ body, context }) => {
    // body is already parsed, validated, and typed!
    // No manual checks needed
    const user = await createUser(body);
    return { jsonBody: user };
  },
  methods: ['POST'],
  route: 'users',
  body: CreateUserSchema
});
```

---

### Typed Handlers

The **Typed Handler** feature is the most powerful addition in v2.0. It provides automatic type inference from Zod schemas, eliminating manual type assertions and reducing boilerplate code.

#### How It Works

When you define schemas for `params`, `query`, `body`, or `headers`, TypeScript automatically infers the types for your handler parameters:

```typescript
// Define schemas
const ParamsSchema = z.object({ id: z.string().uuid() });
const QuerySchema = z.object({ include: z.string().optional() });
const BodySchema = z.object({ title: z.string(), completed: z.boolean() });

app.openapiPath('UpdateTodo', 'Update todo', {
  typedHandler: async ({ params, query, body, context }) => {
    // TypeScript knows:
    // - params.id is string (from UUID schema)
    // - query.include is string | undefined
    // - body.title is string
    // - body.completed is boolean
    
    // No type assertions needed! ✨
    const todo = await updateTodo(params.id, body);
    return { jsonBody: todo };
  },
  methods: ['PUT'],
  route: 'todos/{id}',
  params: ParamsSchema,
  query: QuerySchema,
  body: BodySchema
});
```

#### Automatic Validation

Typed handlers automatically validate all request data. If validation fails, a **400 Bad Request** response is returned with detailed error information:

```typescript
app.openapiPath('CreateUser', 'Create new user', {
  typedHandler: async ({ body, context }) => {
    // If we reach here, body is guaranteed to be valid
    const user = await createUser(body);
    return { status: 201, jsonBody: user };
  },
  methods: ['POST'],
  route: 'users',
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().int().positive().min(18)
  })
});
```

**Invalid request:**
```bash
curl -X POST http://localhost:7071/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"invalid","age":15}'
```

**Automatic error response:**
```json
{
  "error": "Request body validation failed",
  "issues": [
    {
      "path": ["name"],
      "message": "String must contain at least 1 character(s)"
    },
    {
      "path": ["email"],
      "message": "Invalid email"
    },
    {
      "path": ["age"],
      "message": "Number must be greater than or equal to 18"
    }
  ]
}
```

#### Handler Arguments

The typed handler receives a single object with the following properties:

```typescript
type TypedHandlerArgs = {
  params: /* inferred from params schema */;
  query: /* inferred from query schema or URLSearchParams */;
  body: /* inferred from body schema or undefined */;
  headers: /* inferred from headers schema or raw headers */;
  request: SafeHttpRequest; // Original request (body methods removed if parsed)
  context: InvocationContext; // Azure Functions context
};
```

**Example with all parameters:**

```typescript
app.openapiPath('ComplexEndpoint', 'Example with all parameters', {
  typedHandler: async ({ params, query, body, headers, request, context }) => {
    context.log(`Method: ${request.method}`);
    context.log(`URL: ${request.url}`);
    context.log(`Params:`, params);
    context.log(`Query:`, query);
    context.log(`Body:`, body);
    context.log(`Headers:`, headers);
    
    return { jsonBody: { success: true } };
  },
  methods: ['POST'],
  route: 'complex/{id}',
  params: z.object({ id: z.string() }),
  query: z.object({ filter: z.string().optional() }),
  body: z.object({ data: z.any() }),
  headers: z.object({
    'x-api-key': z.string()
  })
});
```

#### Type Inference Examples

**Simple types:**

```typescript
// String parameter
params: z.object({ id: z.string() })
// → params.id is string

// Number with coercion
query: z.object({ page: z.coerce.number() })
// → query.page is number

// Boolean
body: z.object({ enabled: z.boolean() })
// → body.enabled is boolean
```

**Optional types:**

```typescript
query: z.object({
  search: z.string().optional(),
  limit: z.coerce.number().default(10)
})
// → query.search is string | undefined
// → query.limit is number
```

**Complex types:**

```typescript
body: z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email()
  }),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.any())
})
// → body.user is { name: string; email: string }
// → body.tags is string[]
// → body.metadata is Record<string, any>
```

**Enums:**

```typescript
query: z.object({
  status: z.enum(['active', 'inactive', 'pending'])
})
// → query.status is "active" | "inactive" | "pending"
```

**Union types:**

```typescript
body: z.object({
  value: z.union([z.string(), z.number()])
})
// → body.value is string | number
```

#### Using createTypedHandler

For reusable handlers, use the `createTypedHandler` utility:

```typescript
import { createTypedHandler } from '@apvee/azure-functions-openapi';

// Define schemas
const TodoParamsSchema = z.object({ id: z.string().uuid() });
const UpdateTodoBodySchema = z.object({
  title: z.string().optional(),
  completed: z.boolean().optional()
});

// Create reusable typed handler
const updateTodoHandler = createTypedHandler(
  {
    params: TodoParamsSchema,
    body: UpdateTodoBodySchema
  },
  async ({ params, body, context }) => {
    // Fully typed parameters
    context.log(`Updating todo ${params.id}`);
    const updated = await updateTodo(params.id, body);
    return { jsonBody: updated };
  }
);

// Use in endpoint registration
app.openapiPath('UpdateTodo', 'Update todo', {
  handler: updateTodoHandler, // Use as regular handler
  methods: ['PATCH'],
  route: 'todos/{id}',
  params: TodoParamsSchema,
  body: UpdateTodoBodySchema,
  response: TodoSchema
});
```

#### Inline vs External Handlers

**Inline Handler** (best for simple logic):

```typescript
app.openapiPath('DeleteTodo', 'Delete todo', {
  typedHandler: async ({ params, context }) => {
    await deleteTodo(params.id);
    return { status: 204 };
  },
  methods: ['DELETE'],
  route: 'todos/{id}',
  params: z.object({ id: z.string().uuid() })
});
```

**External Handler** (best for complex logic):

```typescript
// In handlers/deleteTodo.ts
export const deleteTodoHandler = createTypedHandler(
  { params: TodoParamsSchema },
  async ({ params, context }) => {
    context.log(`Deleting todo: ${params.id}`);
    
    const todo = await getTodo(params.id);
    if (!todo) {
      return { status: 404, jsonBody: { error: 'Todo not found' } };
    }
    
    await deleteTodo(params.id);
    return { status: 204 };
  }
);

// In index.ts
import { deleteTodoHandler } from './handlers/deleteTodo';

app.openapiPath('DeleteTodo', 'Delete todo', {
  handler: deleteTodoHandler,
  methods: ['DELETE'],
  route: 'todos/{id}',
  params: TodoParamsSchema
});
```

#### Error Handling in Typed Handlers

Validation errors are handled automatically, but you can add custom error handling:

```typescript
app.openapiPath('RiskyOperation', 'Operation that might fail', {
  typedHandler: async ({ body, context }) => {
    try {
      const result = await performRiskyOperation(body);
      return { jsonBody: result };
    } catch (error) {
      context.error('Operation failed:', error);
      
      if (error instanceof DatabaseError) {
        return {
          status: 503,
          jsonBody: { error: 'Service temporarily unavailable' }
        };
      }
      
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' }
      };
    }
  },
  methods: ['POST'],
  route: 'risky',
  body: OperationSchema,
  responses: [
    { httpCode: 200, schema: ResultSchema },
    { httpCode: 500, schema: ErrorSchema },
    { httpCode: 503, schema: ErrorSchema }
  ]
});
```

#### Benefits of Typed Handlers

✅ **Type Safety** - Compiler catches type errors before runtime  
✅ **Less Boilerplate** - No manual parsing or validation code  
✅ **Better IDE Support** - IntelliSense shows exact types  
✅ **Automatic Validation** - Invalid requests rejected automatically  
✅ **Consistent Error Responses** - Standardized validation errors  
✅ **Self-Documenting** - Schemas serve as both validation and documentation  

---

### Registering Reusable Schemas

The `app.openapiSchema()` method registers Zod schemas as named types in the OpenAPI registry. This promotes reusability and keeps your OpenAPI specification clean by using references instead of inlining schemas everywhere.

#### Basic Schema Registration

Register a simple schema:

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  id: z.string().uuid().describe('Unique user identifier'),
  name: z.string().min(1).max(100).describe('User full name'),
  email: z.string().email().describe('User email address'),
  createdAt: z.string().datetime().describe('Account creation timestamp')
});

// Register schema with a name
app.openapiSchema('User', UserSchema);

// Now use it in endpoints
app.openapiPath('GetUser', 'Get user by ID', {
  typedHandler: async ({ params }) => {
    const user = await getUserById(params.id);
    return { jsonBody: user };
  },
  methods: ['GET'],
  route: 'users/{id}',
  params: z.object({ id: z.string().uuid() }),
  response: UserSchema // References 'User' in OpenAPI spec
});
```

#### Nested Schema Registration

Register complex schemas with nested objects:

```typescript
// Address schema
const AddressSchema = z.object({
  street: z.string().describe('Street address'),
  city: z.string().describe('City name'),
  state: z.string().length(2).describe('State code (2 letters)'),
  zipCode: z.string().regex(/^\d{5}$/).describe('5-digit ZIP code')
});

app.openapiSchema('Address', AddressSchema);

// User profile with nested address
const UserProfileSchema = z.object({
  user: UserSchema,
  address: AddressSchema,
  phoneNumber: z.string().optional(),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean()
  })
});

app.openapiSchema('UserProfile', UserProfileSchema);
```

#### Array Schemas

Register schemas for collections:

```typescript
// Single todo item
const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string().datetime()
});

app.openapiSchema('Todo', TodoSchema);

// Paginated list
const PaginatedTodosSchema = z.object({
  items: z.array(TodoSchema).describe('List of todos'),
  total: z.number().int().describe('Total number of items'),
  page: z.number().int().describe('Current page number'),
  pageSize: z.number().int().describe('Items per page'),
  hasMore: z.boolean().describe('Whether more pages exist')
});

app.openapiSchema('PaginatedTodos', PaginatedTodosSchema);

// Use in endpoint
app.openapiPath('ListTodos', 'List all todos with pagination', {
  typedHandler: async ({ query }) => {
    const todos = await getTodos(query);
    return { jsonBody: todos };
  },
  methods: ['GET'],
  route: 'todos',
  query: z.object({
    page: z.coerce.number().default(1),
    pageSize: z.coerce.number().default(10)
  }),
  response: PaginatedTodosSchema
});
```

#### Error Schemas

Create standardized error responses:

```typescript
// Base error schema
const ErrorSchema = z.object({
  error: z.string().describe('Error message'),
  code: z.string().describe('Error code'),
  timestamp: z.string().datetime().describe('When the error occurred'),
  path: z.string().optional().describe('Request path that caused the error'),
  details: z.any().optional().describe('Additional error details')
});

app.openapiSchema('Error', ErrorSchema);

// Validation error schema
const ValidationErrorSchema = z.object({
  error: z.string(),
  code: z.literal('VALIDATION_ERROR'),
  issues: z.array(z.object({
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string()
  }))
});

app.openapiSchema('ValidationError', ValidationErrorSchema);

// Use in endpoints
app.openapiPath('CreateUser', 'Create new user', {
  typedHandler: async ({ body }) => {
    const user = await createUser(body);
    return { status: 201, jsonBody: user };
  },
  methods: ['POST'],
  route: 'users',
  body: CreateUserSchema,
  responses: [
    { httpCode: 201, schema: UserSchema, description: 'User created successfully' },
    { httpCode: 400, schema: ValidationErrorSchema, description: 'Invalid request data' },
    { httpCode: 500, schema: ErrorSchema, description: 'Internal server error' }
  ]
});
```

#### Discriminated Union Schemas

Register schemas with discriminated unions for polymorphic data:

```typescript
// Base notification
const BaseNotificationSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime()
});

// Email notification
const EmailNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('email'),
  to: z.string().email(),
  subject: z.string(),
  body: z.string()
});

app.openapiSchema('EmailNotification', EmailNotificationSchema);

// SMS notification
const SmsNotificationSchema = BaseNotificationSchema.extend({
  type: z.literal('sms'),
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  message: z.string().max(160)
});

app.openapiSchema('SmsNotification', SmsNotificationSchema);

// Union of all notification types
const NotificationSchema = z.discriminatedUnion('type', [
  EmailNotificationSchema,
  SmsNotificationSchema
]);

app.openapiSchema('Notification', NotificationSchema);
```

#### Schema Organization Best Practices

**Organize by domain:**

```typescript
// schemas/user.ts
export const UserSchema = z.object({ /* ... */ });
export const CreateUserSchema = z.object({ /* ... */ });
export const UpdateUserSchema = z.object({ /* ... */ });

// schemas/todo.ts
export const TodoSchema = z.object({ /* ... */ });
export const CreateTodoSchema = z.object({ /* ... */ });
export const UpdateTodoSchema = z.object({ /* ... */ });

// schemas/index.ts
import { UserSchema, CreateUserSchema, UpdateUserSchema } from './user';
import { TodoSchema, CreateTodoSchema, UpdateTodoSchema } from './todo';

export function registerSchemas(app: typeof import('@azure/functions').app) {
  // User schemas
  app.openapiSchema('User', UserSchema);
  app.openapiSchema('CreateUser', CreateUserSchema);
  app.openapiSchema('UpdateUser', UpdateUserSchema);
  
  // Todo schemas
  app.openapiSchema('Todo', TodoSchema);
  app.openapiSchema('CreateTodo', CreateTodoSchema);
  app.openapiSchema('UpdateTodo', UpdateTodoSchema);
}

// In index.ts
import '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';
import { registerSchemas } from './schemas';

app.openapiSetup({ /* config */ });
registerSchemas(app);
```

#### Benefits of Schema Registration

✅ **DRY Principle** - Define schemas once, use everywhere  
✅ **Cleaner OpenAPI Spec** - Uses `$ref` instead of inline schemas  
✅ **Better Documentation** - Named types are easier to understand  
✅ **Consistency** - Same schema used for validation and documentation  
✅ **Type Reusability** - Share types across multiple endpoints  
✅ **Easier Maintenance** - Update schema in one place  

#### When to Register Schemas

**Register schemas when:**
- Used in multiple endpoints
- Complex nested structures
- Part of your domain model
- Error response formats
- Common request/response patterns

**Inline schemas when:**
- Used only once
- Very simple structures
- Endpoint-specific parameters
- Quick prototyping

**Example - Mixed approach:**

```typescript
// Register common schemas
app.openapiSchema('Todo', TodoSchema);
app.openapiSchema('Error', ErrorSchema);

app.openapiPath('UpdateTodo', 'Update todo', {
  typedHandler: async ({ params, body }) => {
    const todo = await updateTodo(params.id, body);
    return { jsonBody: todo };
  },
  methods: ['PATCH'],
  route: 'todos/{id}',
  // Inline simple param schema
  params: z.object({ id: z.string().uuid() }),
  // Inline endpoint-specific body schema
  body: z.object({
    title: z.string().optional(),
    completed: z.boolean().optional()
  }),
  // Reference registered schema
  response: TodoSchema
});
```

---

### Webhooks (OpenAPI 3.1.0)

Webhooks are a new feature in OpenAPI 3.1.0 that allows you to document **callback endpoints** - HTTP requests that your API makes to external URLs. Unlike regular endpoints that clients call, webhooks represent notifications that your API sends to client-provided URLs.

#### Understanding Webhooks

**Regular API Endpoint (Path):**
```
Client → Your API
Example: GET /api/orders/123
```

**Webhook (Callback):**
```
Your API → Client's URL
Example: POST https://client.com/webhooks/order-completed
```

#### Basic Webhook Registration

Document a simple webhook notification:

```typescript
import { z } from 'zod';

// Define the payload your API will send
const OrderCompletedSchema = z.object({
  orderId: z.string().uuid().describe('Order identifier'),
  status: z.literal('completed').describe('Order status'),
  completedAt: z.string().datetime().describe('Completion timestamp'),
  totalAmount: z.number().describe('Total order amount')
});

// Register webhook
app.openapiWebhook('OrderCompleted', 'Notifies when an order is completed', {
  typedHandler: async ({ body, context }) => {
    // This is the handler that receives the webhook at YOUR endpoint
    // (for testing or development purposes)
    context.log(`Webhook received: Order ${body.orderId} completed`);
    return { jsonBody: { received: true } };
  },
  methods: ['POST'],
  body: OrderCompletedSchema,
  responses: [
    {
      httpCode: 200,
      description: 'Webhook received successfully',
      schema: z.object({ received: z.boolean() })
    }
  ]
});
```

#### Webhook with Authentication

Document webhooks that require authentication:

```typescript
// Register security scheme for webhook signatures
const webhookSignature = app.openapiKeySecurity(
  'X-Webhook-Signature',
  'header',
  'HMAC signature for webhook verification'
);

app.openapiWebhook('PaymentProcessed', 'Notifies when payment is processed', {
  typedHandler: async ({ body, headers, context }) => {
    // Verify webhook signature
    const signature = headers['x-webhook-signature'];
    const isValid = verifyWebhookSignature(body, signature);
    
    if (!isValid) {
      return { status: 401, jsonBody: { error: 'Invalid signature' } };
    }
    
    context.log(`Payment processed: ${body.paymentId}`);
    return { jsonBody: { acknowledged: true } };
  },
  methods: ['POST'],
  body: z.object({
    paymentId: z.string().uuid(),
    amount: z.number(),
    currency: z.string().length(3),
    status: z.enum(['success', 'failed', 'pending'])
  }),
  headers: z.object({
    'x-webhook-signature': z.string()
  }),
  security: [webhookSignature]
});
```

#### Multiple Webhook Events

Document different webhook events for various scenarios:

```typescript
// User registration webhook
app.openapiWebhook('UserRegistered', 'Notifies when a new user registers', {
  typedHandler: async ({ body, context }) => {
    context.log(`New user: ${body.userId}`);
    return { status: 200 };
  },
  methods: ['POST'],
  body: z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    registeredAt: z.string().datetime()
  }),
  tags: ['User Events']
});

// User deletion webhook
app.openapiWebhook('UserDeleted', 'Notifies when a user is deleted', {
  typedHandler: async ({ body, context }) => {
    context.log(`User deleted: ${body.userId}`);
    return { status: 200 };
  },
  methods: ['POST'],
  body: z.object({
    userId: z.string().uuid(),
    deletedAt: z.string().datetime(),
    reason: z.string().optional()
  }),
  tags: ['User Events']
});

// Subscription events
app.openapiWebhook('SubscriptionChanged', 'Notifies when subscription status changes', {
  typedHandler: async ({ body, context }) => {
    context.log(`Subscription ${body.subscriptionId} changed to ${body.status}`);
    return { status: 200 };
  },
  methods: ['POST'],
  body: z.object({
    subscriptionId: z.string().uuid(),
    userId: z.string().uuid(),
    status: z.enum(['active', 'cancelled', 'expired', 'paused']),
    changedAt: z.string().datetime()
  }),
  tags: ['Subscription Events']
});
```

#### Webhook Retry Logic Documentation

Document how your API handles webhook failures:

```typescript
app.openapiWebhook('OrderShipped', 'Notifies when order is shipped', {
  typedHandler: async ({ body, headers, context }) => {
    // Document retry attempt in description
    const attemptNumber = headers['x-webhook-attempt'];
    context.log(`Webhook attempt ${attemptNumber} for order ${body.orderId}`);
    
    return { status: 200 };
  },
  methods: ['POST'],
  description: `
Webhook sent when an order is shipped.

**Retry Policy:**
- Initial attempt immediately after shipping
- Retries after 1 min, 5 min, 15 min, 1 hour, 6 hours
- Maximum 5 retry attempts
- Exponential backoff applied

**Request Headers:**
- \`X-Webhook-Attempt\`: Retry attempt number (1-5)
- \`X-Webhook-Id\`: Unique webhook delivery ID
- \`X-Webhook-Timestamp\`: ISO 8601 timestamp
  `,
  body: z.object({
    orderId: z.string().uuid(),
    trackingNumber: z.string(),
    carrier: z.string(),
    shippedAt: z.string().datetime(),
    estimatedDelivery: z.string().datetime()
  }),
  headers: z.object({
    'x-webhook-attempt': z.coerce.number().int().min(1).max(5),
    'x-webhook-id': z.string().uuid(),
    'x-webhook-timestamp': z.string().datetime()
  }),
  responses: [
    {
      httpCode: 200,
      description: 'Webhook acknowledged successfully'
    },
    {
      httpCode: 500,
      description: 'Server error - webhook will be retried'
    }
  ]
});
```

#### Real-World Webhook Example: Stripe-style

Comprehensive webhook similar to Stripe's approach:

```typescript
// Register webhook schemas
const WebhookEventSchema = z.object({
  id: z.string().uuid().describe('Unique event identifier'),
  type: z.string().describe('Event type'),
  created: z.number().int().describe('Unix timestamp'),
  data: z.object({
    object: z.any()
  }),
  livemode: z.boolean().describe('Whether in production mode')
});

app.openapiSchema('WebhookEvent', WebhookEventSchema);

// Webhook signature security
const stripeSignature = app.openapiKeySecurity(
  'Stripe-Signature',
  'header',
  'Webhook signature for verification (see Stripe documentation)'
);

app.openapiWebhook('StripeWebhook', 'Generic Stripe-style webhook endpoint', {
  typedHandler: async ({ body, headers, context }) => {
    const signature = headers['stripe-signature'];
    
    // Verify signature (pseudo-code)
    if (!verifyStripeSignature(body, signature, process.env.WEBHOOK_SECRET)) {
      return { status: 400, jsonBody: { error: 'Invalid signature' } };
    }
    
    // Handle different event types
    context.log(`Event received: ${body.type}`);
    
    switch (body.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(body.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(body.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(body.data.object);
        break;
      default:
        context.warn(`Unhandled event type: ${body.type}`);
    }
    
    return { jsonBody: { received: true } };
  },
  methods: ['POST'],
  description: `
Webhook endpoint for receiving events from Stripe.

**Verification:**
All webhook requests include a \`Stripe-Signature\` header. Verify this signature
using your webhook secret to ensure the request came from Stripe.

**Event Types:**
- \`payment_intent.succeeded\` - Payment completed successfully
- \`payment_intent.payment_failed\` - Payment failed
- \`customer.subscription.created\` - New subscription created
- \`customer.subscription.deleted\` - Subscription cancelled
- And many more...

**Best Practices:**
1. Always verify the signature
2. Return 2xx status code quickly
3. Process events asynchronously
4. Handle duplicate events (idempotency)
  `,
  body: WebhookEventSchema,
  headers: z.object({
    'stripe-signature': z.string().describe('HMAC signature of the payload')
  }),
  security: [stripeSignature],
  responses: [
    {
      httpCode: 200,
      description: 'Event received and queued for processing',
      schema: z.object({ received: z.boolean() })
    },
    {
      httpCode: 400,
      description: 'Invalid signature or malformed payload',
      schema: z.object({ error: z.string() })
    }
  ],
  tags: ['Webhooks']
});
```

#### Webhook Configuration Options

The `app.openapiWebhook()` method accepts the same options as `app.openapiPath()`:

| Option | Description |
|--------|-------------|
| `handler` or `typedHandler` | Function to handle webhook (for testing) |
| `methods` | HTTP methods (usually `['POST']`) |
| `body` | Expected webhook payload schema |
| `headers` | Expected headers (signatures, IDs, etc.) |
| `security` | Security requirements (signatures, API keys) |
| `responses` | Possible response codes |
| `description` | Detailed webhook documentation |
| `tags` | Tags for organization |

#### Webhook vs Path Differences

**Webhooks:**
- Documented in `webhooks` section of OpenAPI spec
- Represent outbound requests from your API
- Typically POST requests
- Often include signature verification
- Usually retry on failure

**Paths:**
- Documented in `paths` section of OpenAPI spec
- Represent inbound requests to your API
- Support all HTTP methods
- May require authentication
- Client handles retries

#### Testing Webhooks Locally

Use tools like ngrok or webhook.site for local testing:

```bash
# Start ngrok tunnel
ngrok http 7071

# Your webhook URL becomes:
# https://abc123.ngrok.io/api/webhooks/order-completed

# Test with curl
curl -X POST https://abc123.ngrok.io/api/webhooks/order-completed \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "completed",
    "completedAt": "2025-11-06T12:00:00Z",
    "totalAmount": 99.99
  }'
```

---

## 🔒 Security Schemas

Security is a critical aspect of API development. This library provides native support for multiple Azure authentication methods and custom security schemes, all properly documented in your OpenAPI specification.

### Security Overview

Security in OpenAPI works through **security schemes** (how to authenticate) and **security requirements** (which endpoints require which schemes). This library makes it easy to define both.

#### Security Workflow

1. **Define Security Scheme** - Register authentication method
2. **Apply to Endpoints** - Specify which endpoints require authentication
3. **Document in OpenAPI** - Automatically included in generated specs
4. **Implement Validation** - Handle authentication in your handlers

```typescript
// 1. Define security scheme
const apiKeySecurity = app.openapiKeySecurity('X-API-Key', 'header');

// 2. Apply to endpoint
app.openapiPath('SecureEndpoint', 'Protected endpoint', {
  handler: secureHandler,
  methods: ['GET'],
  route: 'secure/data',
  security: [apiKeySecurity], // Require API key
  response: DataSchema
});

// 3. OpenAPI docs automatically show this endpoint requires X-API-Key header
// 4. Implement validation in your handler
```

#### Available Security Methods

| Method | Use Case | Azure Native |
|--------|----------|--------------|
| **Custom API Keys** | User-implemented authentication | ❌ No |
| **Azure Function Keys** | Azure native key-based auth | ✅ Yes |
| **Azure EasyAuth** | App Service Authentication | ✅ Yes |
| **Azure AD Bearer** | Manual JWT validation | ✅ Yes |
| **Azure AD Client Credentials** | Service-to-service auth | ✅ Yes |

#### Global vs Endpoint Security

**Global Security** (applies to all endpoints):

```typescript
const globalAuth = app.openapiAzureFunctionKey('function');

app.openapiSetup({
  info: { title: 'Secure API', version: '1.0.0' },
  security: [globalAuth] // All endpoints require function key
});

// Override for specific endpoint
app.openapiPath('PublicEndpoint', 'No auth required', {
  handler: publicHandler,
  methods: ['GET'],
  route: 'public',
  security: [] // Override: no auth required
});
```

**Endpoint-Specific Security:**

```typescript
const adminAuth = app.openapiAzureFunctionKey('admin');
const userAuth = app.openapiAzureFunctionKey('function');

// Admin-only endpoint
app.openapiPath('DeleteUser', 'Delete user (admin only)', {
  handler: deleteUserHandler,
  methods: ['DELETE'],
  route: 'users/{id}',
  security: [adminAuth]
});

// User endpoint
app.openapiPath('GetProfile', 'Get own profile', {
  handler: getProfileHandler,
  methods: ['GET'],
  route: 'profile',
  security: [userAuth]
});
```

#### Multiple Security Options (OR)

Allow multiple authentication methods (user can use any):

```typescript
const apiKeyAuth = app.openapiKeySecurity('X-API-Key', 'header');
const bearerAuth = app.openapiAzureADBearer('AzureAD');

app.openapiPath('FlexibleAuth', 'Accepts API key OR bearer token', {
  handler: flexAuthHandler,
  methods: ['GET'],
  route: 'flexible',
  security: [
    apiKeyAuth,  // Option 1: API key
    bearerAuth   // Option 2: Bearer token
  ]
});
```

#### Combined Security Requirements (AND)

Require multiple authentication methods simultaneously:

```typescript
const apiKeyAuth = app.openapiKeySecurity('X-API-Key', 'header');
const clientCertAuth = app.openapiKeySecurity('X-Client-Cert', 'header');

app.openapiPath('HighSecurity', 'Requires both API key AND client cert', {
  handler: highSecurityHandler,
  methods: ['POST'],
  route: 'high-security',
  security: [
    { ...apiKeyAuth, ...clientCertAuth } // Both required
  ]
});
```

---

### Custom API Keys

Use `app.openapiKeySecurity()` or its alias `app.openapiCustomApiKey()` to document custom API key authentication that YOU implement and validate. This is different from Azure Function Keys - you're responsible for validating these keys.

#### Header-Based API Key

Most common approach - API key in request header:

```typescript
// Register security scheme
const apiKeySecurity = app.openapiKeySecurity(
  'X-API-Key',
  'header',
  'Custom API key for authentication'
);

// Apply to endpoint
app.openapiPath('GetSecureData', 'Get secure data', {
  handler: async (request, context) => {
    // Extract and validate API key
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey) {
      return { status: 401, jsonBody: { error: 'API key required' } };
    }
    
    // Validate against your database or cache
    const isValid = await validateApiKey(apiKey);
    
    if (!isValid) {
      return { status: 403, jsonBody: { error: 'Invalid API key' } };
    }
    
    // Key is valid, proceed with request
    const data = await getSecureData();
    return { jsonBody: data };
  },
  methods: ['GET'],
  route: 'secure/data',
  security: [apiKeySecurity],
  responses: [
    { httpCode: 200, schema: DataSchema },
    { httpCode: 401, schema: ErrorSchema, description: 'API key missing' },
    { httpCode: 403, schema: ErrorSchema, description: 'Invalid API key' }
  ]
});
```

**Request example:**
```bash
curl http://localhost:7071/api/secure/data \
  -H "X-API-Key: your-api-key-here"
```

#### Query Parameter API Key

Less secure but simpler for quick testing:

```typescript
const apiKeySecurity = app.openapiKeySecurity(
  'apiKey',
  'query',
  'API key passed as query parameter'
);

app.openapiPath('GetData', 'Get data with query param auth', {
  handler: async (request, context) => {
    const apiKey = request.query.get('apiKey');
    
    if (!apiKey || !(await validateApiKey(apiKey))) {
      return { status: 401, jsonBody: { error: 'Invalid or missing API key' } };
    }
    
    return { jsonBody: await getData() };
  },
  methods: ['GET'],
  route: 'data',
  security: [apiKeySecurity]
});
```

**Request example:**
```bash
curl "http://localhost:7071/api/data?apiKey=your-api-key-here"
```

#### Cookie-Based API Key

For browser-based applications:

```typescript
const apiKeySecurity = app.openapiKeySecurity(
  'session',
  'cookie',
  'Session cookie for authentication'
);

app.openapiPath('GetUserData', 'Get user data with session', {
  handler: async (request, context) => {
    // Extract cookie (pseudo-code)
    const sessionId = request.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('session='))
      ?.split('=')[1];
    
    if (!sessionId || !(await validateSession(sessionId))) {
      return { status: 401, jsonBody: { error: 'Invalid session' } };
    }
    
    return { jsonBody: await getUserData(sessionId) };
  },
  methods: ['GET'],
  route: 'user/data',
  security: [apiKeySecurity]
});
```

#### Using Typed Handlers with Custom Validation

Combine typed handlers with header validation:

```typescript
const apiKeySecurity = app.openapiKeySecurity('X-API-Key', 'header');

app.openapiPath('CreateResource', 'Create new resource', {
  typedHandler: async ({ body, headers, context }) => {
    // Validate API key from headers
    const apiKey = headers['x-api-key'];
    
    const keyInfo = await validateApiKey(apiKey);
    if (!keyInfo.valid) {
      return { status: 403, jsonBody: { error: 'Invalid API key' } };
    }
    
    // Check rate limits for this key
    if (await isRateLimited(apiKey)) {
      return { 
        status: 429, 
        jsonBody: { error: 'Rate limit exceeded' },
        headers: { 'Retry-After': '60' }
      };
    }
    
    // Proceed with validated body
    const resource = await createResource(body, keyInfo.userId);
    return { status: 201, jsonBody: resource };
  },
  methods: ['POST'],
  route: 'resources',
  headers: z.object({
    'x-api-key': z.string().min(32).describe('API key (min 32 characters)')
  }),
  body: CreateResourceSchema,
  security: [apiKeySecurity],
  responses: [
    { httpCode: 201, schema: ResourceSchema, description: 'Resource created' },
    { httpCode: 403, schema: ErrorSchema, description: 'Invalid API key' },
    { httpCode: 429, schema: ErrorSchema, description: 'Rate limit exceeded' }
  ]
});
```

#### API Key Best Practices

**Validation example with database:**

```typescript
import { createHash } from 'crypto';

async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  userId?: string;
  permissions?: string[];
}> {
  // Hash the API key
  const keyHash = createHash('sha256').update(apiKey).digest('hex');
  
  // Look up in database
  const keyRecord = await db.apiKeys.findOne({
    keyHash,
    active: true,
    expiresAt: { $gt: new Date() }
  });
  
  if (!keyRecord) {
    return { valid: false };
  }
  
  // Update last used timestamp
  await db.apiKeys.updateOne(
    { _id: keyRecord._id },
    { $set: { lastUsedAt: new Date() } }
  );
  
  return {
    valid: true,
    userId: keyRecord.userId,
    permissions: keyRecord.permissions
  };
}
```

**Rate limiting example:**

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function isRateLimited(apiKey: string): Promise<boolean> {
  const key = `ratelimit:${apiKey}`;
  const limit = 100; // requests per minute
  
  const current = await redis.incr(key);
  
  if (current === 1) {
    // First request in this minute
    await redis.expire(key, 60);
  }
  
  return current > limit;
}
```

#### Multiple API Keys (Different Purposes)

Different keys for different operations:

```typescript
// Read-only API key
const readKeySecurity = app.openapiKeySecurity(
  'X-Read-API-Key',
  'header',
  'Read-only API key'
);

// Write API key (more privileged)
const writeKeySecurity = app.openapiKeySecurity(
  'X-Write-API-Key',
  'header',
  'Write API key (required for modifications)'
);

// Read endpoint
app.openapiPath('GetData', 'Get data (read key)', {
  handler: getDataHandler,
  methods: ['GET'],
  route: 'data',
  security: [readKeySecurity]
});

// Write endpoint
app.openapiPath('UpdateData', 'Update data (write key required)', {
  handler: updateDataHandler,
  methods: ['PUT'],
  route: 'data/{id}',
  security: [writeKeySecurity]
});
```

#### Custom API Key vs Azure Function Key

| Feature | Custom API Key | Azure Function Key |
|---------|---------------|-------------------|
| **Implementation** | You implement validation | Azure handles validation |
| **Storage** | Your database/cache | Azure manages |
| **Rotation** | You manage | Azure portal/CLI |
| **Rate Limiting** | You implement | Azure handles |
| **Scoping** | Fully customizable | Function/Admin levels |
| **Use Case** | Customer-facing APIs | Azure-internal auth |

**When to use Custom API Keys:**
- ✅ Customer-facing APIs
- ✅ Need custom permissions/scopes
- ✅ Need usage tracking/billing
- ✅ Need custom rate limiting
- ✅ Multi-tenant applications

**When to use Azure Function Keys:**
- ✅ Internal APIs
- ✅ Simple authentication
- ✅ Azure-native deployment
- ✅ No custom logic needed

---

### Azure Function Keys

Azure Function Keys are the native authentication mechanism built into Azure Functions. Use `app.openapiAzureFunctionKey()` to document endpoints that use Azure's built-in key-based authentication.

#### Understanding Auth Levels

Azure Functions supports three authorization levels:

| Auth Level | Description | Who Can Access |
|------------|-------------|----------------|
| `anonymous` | No authentication required | Anyone |
| `function` | Function-specific key or host key | Anyone with a valid function/host key |
| `admin` | Admin/master key only | Only admin users |

#### Simple Function Key Security

Basic setup with function-level authentication:

```typescript
// Register function key security
const functionKeySecurity = app.openapiAzureFunctionKey('function');

app.openapiPath('GetData', 'Get data (function key required)', {
  handler: async (request, context) => {
    // Azure has already validated the key!
    // If we reach here, the key was valid
    const data = await getData();
    return { jsonBody: data };
  },
  methods: ['GET'],
  route: 'data',
  authLevel: 'function', // Important: must match security scheme
  security: [functionKeySecurity]
});
```

**Request examples:**

```bash
# Query parameter (most common)
curl "http://localhost:7071/api/data?code=YOUR_FUNCTION_KEY"

# Header
curl http://localhost:7071/api/data \
  -H "x-functions-key: YOUR_FUNCTION_KEY"
```

#### Admin-Only Endpoints

Restrict to master/admin keys only:

```typescript
const adminKeySecurity = app.openapiAzureFunctionKey('admin');

app.openapiPath('DeleteAllData', 'Delete all data (admin only)', {
  handler: async (request, context) => {
    context.warn('Admin operation: Deleting all data');
    await deleteAllData();
    return { status: 204 };
  },
  methods: ['DELETE'],
  route: 'data/all',
  authLevel: 'admin', // Requires master key
  security: [adminKeySecurity],
  responses: [
    { httpCode: 204, description: 'All data deleted' },
    { httpCode: 401, description: 'Unauthorized - admin key required' }
  ]
});
```

#### Advanced Configuration

Full configuration with all options:

```typescript
const customFunctionKey = app.openapiAzureFunctionKey({
  name: 'FunctionAuth',
  authLevel: 'function',
  description: 'Azure Function key authentication. Provide key via ?code=xxx or x-functions-key header',
  allowQueryParameter: true,  // Default: true
  allowHeader: true            // Default: true
});

app.openapiPath('SecureEndpoint', 'Secured endpoint', {
  handler: secureHandler,
  methods: ['POST'],
  route: 'secure/action',
  authLevel: 'function',
  security: [customFunctionKey]
});
```

#### Extracting Function Keys

Use the `extractFunctionKey()` utility to get the key from requests:

```typescript
import { extractFunctionKey } from '@apvee/azure-functions-openapi';

const functionKeySecurity = app.openapiAzureFunctionKey('function');

app.openapiPath('TrackUsage', 'Track API usage', {
  handler: async (request, context) => {
    // Extract the key that was used
    const functionKey = extractFunctionKey(request);
    
    // Log usage for this key
    if (functionKey) {
      await trackKeyUsage(functionKey);
      context.log(`Request made with key: ${functionKey.substring(0, 8)}...`);
    }
    
    const data = await getData();
    return { jsonBody: data };
  },
  methods: ['GET'],
  route: 'usage/data',
  authLevel: 'function',
  security: [functionKeySecurity]
});
```

#### Mixed Auth Levels

Different levels for different operations:

```typescript
const functionKey = app.openapiAzureFunctionKey('function');
const adminKey = app.openapiAzureFunctionKey('admin');

// Public read (no auth)
app.openapiPath('ListPublicTodos', 'List public todos', {
  handler: listPublicTodosHandler,
  methods: ['GET'],
  route: 'public/todos',
  authLevel: 'anonymous',
  security: [] // No security
});

// Authenticated read (function key)
app.openapiPath('ListMyTodos', 'List my todos', {
  handler: listMyTodosHandler,
  methods: ['GET'],
  route: 'my/todos',
  authLevel: 'function',
  security: [functionKey]
});

// Admin write (admin key)
app.openapiPath('DeleteAllTodos', 'Delete all todos', {
  handler: deleteAllTodosHandler,
  methods: ['DELETE'],
  route: 'todos/all',
  authLevel: 'admin',
  security: [adminKey]
});
```

#### Getting Function Keys

**Local Development:**
Keys are stored in `local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node"
  },
  "Host": {
    "LocalHttpPort": 7071,
    "CORS": "*"
  }
}
```

Local development typically uses a default key or no key validation.

**Azure Portal:**
1. Navigate to your Function App
2. Go to "Functions" → Select your function
3. Click "Function Keys"
4. Copy the default key or create a new one

**Azure CLI:**

```bash
# List function keys
az functionapp keys list \
  --name MyFunctionApp \
  --resource-group MyResourceGroup

# Get specific function key
az functionapp function keys list \
  --name MyFunctionApp \
  --resource-group MyResourceGroup \
  --function-name MyFunction
```

#### Key Management Best Practices

**Rotate keys regularly:**

```bash
# Delete old key
az functionapp function keys delete \
  --name MyFunctionApp \
  --resource-group MyResourceGroup \
  --function-name MyFunction \
  --key-name old-key

# Create new key
az functionapp function keys set \
  --name MyFunctionApp \
  --resource-group MyResourceGroup \
  --function-name MyFunction \
  --key-name new-key \
  --key-value "$(openssl rand -base64 32)"
```

**Use different keys for different clients:**

```typescript
// Track usage per client
async function trackKeyUsage(functionKey: string): Promise<void> {
  const keyInfo = await getKeyInfo(functionKey);
  
  await db.usage.create({
    keyId: keyInfo.keyId,
    clientName: keyInfo.clientName,
    timestamp: new Date(),
    endpoint: request.url
  });
}
```

**Store keys securely:**

```typescript
// ❌ Bad: Hardcoded keys
const API_KEY = 'my-secret-key-123';

// ✅ Good: Environment variables
const API_KEY = process.env.FUNCTION_KEY;

// ✅ Better: Azure Key Vault
import { SecretClient } from '@azure/keyvault-secrets';

const keyVaultClient = new SecretClient(
  process.env.KEY_VAULT_URL,
  new DefaultAzureCredential()
);

const functionKey = await keyVaultClient.getSecret('function-key');
```

#### Function Keys vs EasyAuth

| Feature | Function Keys | EasyAuth |
|---------|--------------|----------|
| **Setup Complexity** | Simple (built-in) | Requires App Service Auth |
| **User Identity** | No (just key validation) | Yes (full user info) |
| **Auth Providers** | N/A | AAD, Google, Facebook, etc. |
| **Key Management** | Azure manages | Azure manages |
| **Use Case** | Service-to-service | User authentication |
| **authLevel** | `function` or `admin` | `anonymous` (auth is external) |

**When to use Function Keys:**
- ✅ Internal APIs
- ✅ Service-to-service communication
- ✅ Simple authentication needs
- ✅ No user identity required
- ✅ Quick setup

**When to use EasyAuth:**
- ✅ User-facing APIs
- ✅ Need user identity/profile
- ✅ Multiple auth providers
- ✅ SSO integration
- ✅ Azure AD integration

---

### Azure EasyAuth (App Service Authentication)

Azure EasyAuth (App Service Authentication) is a built-in authentication feature that runs in Azure and validates users before requests reach your code. Use `app.openapiEasyAuth()` to document endpoints protected by EasyAuth.

#### What is EasyAuth?

EasyAuth is an Azure feature that:
- Runs **outside** your function code (in the Azure platform)
- Validates authentication tokens automatically
- Injects user identity into request headers
- Supports multiple identity providers (AAD, Google, Facebook, GitHub, Twitter)
- Requires no code changes to your functions

#### Simple EasyAuth Setup

Basic configuration with Azure AD:

```typescript
import { parseEasyAuthPrincipal } from '@apvee/azure-functions-openapi';

// Register EasyAuth security
const easyAuth = app.openapiEasyAuth();

app.openapiPath('GetUserProfile', 'Get current user profile', {
  handler: async (request, context) => {
    // Parse user identity from EasyAuth headers
    const user = parseEasyAuthPrincipal(request);
    
    if (!user) {
      return {
        status: 401,
        jsonBody: { error: 'Not authenticated' }
      };
    }
    
    return {
      jsonBody: {
        userId: user.userId,
        username: user.username,
        email: user.claims.find(c => c.typ === 'emails')?.val,
        provider: user.identityProvider
      }
    };
  },
  methods: ['GET'],
  route: 'me',
  authLevel: 'anonymous', // EasyAuth handles authentication
  security: [easyAuth]
});
```

#### Configuring EasyAuth in Azure

**Via Azure Portal:**

1. Navigate to your Function App
2. Go to **Authentication** (under Settings)
3. Click **Add identity provider**
4. Select provider (Microsoft, Google, Facebook, etc.)
5. Configure provider settings
6. Set **Action** to:
   - `Return HTTP 401` for APIs
   - `Redirect to login` for web apps

**Via Azure CLI:**

```bash
# Enable App Service Authentication
az functionapp auth update \
  --name MyFunctionApp \
  --resource-group MyResourceGroup \
  --enabled true \
  --action Return401

# Add Microsoft identity provider
az functionapp auth microsoft update \
  --name MyFunctionApp \
  --resource-group MyResourceGroup \
  --client-id YOUR_AAD_CLIENT_ID \
  --client-secret-name AAD_CLIENT_SECRET \
  --issuer https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0
```

#### Accessing User Information

The `parseEasyAuthPrincipal()` utility extracts user identity:

```typescript
import { parseEasyAuthPrincipal } from '@apvee/azure-functions-openapi';

const easyAuth = app.openapiEasyAuth();

app.openapiPath('CreateTodo', 'Create a todo', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    
    if (!user) {
      return { status: 401, jsonBody: { error: 'Unauthorized' } };
    }
    
    const body = await request.json();
    
    const todo = await db.todos.create({
      title: body.title,
      ownerId: user.userId,        // From EasyAuth
      ownerEmail: user.username,   // From EasyAuth
      createdAt: new Date()
    });
    
    context.log(`Todo created by ${user.username}`);
    
    return {
      status: 201,
      jsonBody: todo
    };
  },
  methods: ['POST'],
  route: 'todos',
  authLevel: 'anonymous',
  security: [easyAuth],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string(),
            description: z.string().optional()
          })
        }
      }
    }
  }
});
```

#### EasyAuth Principal Structure

The parsed principal contains:

```typescript
interface EasyAuthPrincipal {
  userId: string;              // Unique user ID
  username: string;            // User email or name
  identityProvider: string;    // e.g., "aad", "google", "facebook"
  claims: Array<{              // All identity claims
    typ: string;               // Claim type
    val: string;               // Claim value
  }>;
}
```

**Example claims:**

```typescript
const user = parseEasyAuthPrincipal(request);

// Get specific claims
const email = user.claims.find(c => c.typ === 'emails')?.val;
const name = user.claims.find(c => c.typ === 'name')?.val;
const roles = user.claims.filter(c => c.typ === 'roles').map(c => c.val);
const tenantId = user.claims.find(c => c.typ === 'http://schemas.microsoft.com/identity/claims/tenantid')?.val;

context.log('User details:', {
  userId: user.userId,
  email,
  name,
  roles,
  tenantId,
  provider: user.identityProvider
});
```

#### Advanced Configuration

Full EasyAuth configuration with all options:

```typescript
const customEasyAuth = app.openapiEasyAuth({
  name: 'AzureEasyAuth',
  description: 'Azure App Service Authentication. Users must be authenticated via Azure AD, Google, Facebook, or other configured providers.',
  headerName: 'X-MS-CLIENT-PRINCIPAL' // Default header
});

app.openapiPath('ProtectedResource', 'Access protected resource', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    
    // EasyAuth guarantees this is present (if configured correctly)
    if (!user) {
      context.error('EasyAuth principal missing - check Azure configuration');
      return { status: 401, jsonBody: { error: 'Authentication required' } };
    }
    
    return {
      jsonBody: {
        message: 'Welcome!',
        user: user.username
      }
    };
  },
  methods: ['GET'],
  route: 'protected',
  authLevel: 'anonymous',
  security: [customEasyAuth]
});
```

#### Role-Based Access Control (RBAC)

Check user roles from claims:

```typescript
import { parseEasyAuthPrincipal } from '@apvee/azure-functions-openapi';

function hasRole(user: EasyAuthPrincipal, role: string): boolean {
  return user.claims.some(
    c => c.typ === 'roles' && c.val === role
  );
}

const easyAuth = app.openapiEasyAuth();

app.openapiPath('AdminOnly', 'Admin-only operation', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    
    if (!user) {
      return { status: 401, jsonBody: { error: 'Unauthorized' } };
    }
    
    // Check for admin role
    if (!hasRole(user, 'Admin')) {
      return {
        status: 403,
        jsonBody: { error: 'Forbidden: Admin role required' }
      };
    }
    
    // Admin operation
    await performAdminAction();
    
    return {
      jsonBody: { success: true }
    };
  },
  methods: ['POST'],
  route: 'admin/action',
  authLevel: 'anonymous',
  security: [easyAuth],
  responses: [
    { httpCode: 200, description: 'Success' },
    { httpCode: 401, description: 'Not authenticated' },
    { httpCode: 403, description: 'Insufficient permissions' }
  ]
});
```

#### Multi-Provider Support

EasyAuth can support multiple identity providers simultaneously:

```typescript
const easyAuth = app.openapiEasyAuth({
  description: 'Authenticate with Azure AD, Google, Facebook, GitHub, or Twitter'
});

app.openapiPath('GetProfile', 'Get user profile', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    
    if (!user) {
      return { status: 401, jsonBody: { error: 'Not authenticated' } };
    }
    
    // Handle different providers
    let profileData;
    switch (user.identityProvider) {
      case 'aad':
        profileData = await getAzureADProfile(user);
        break;
      case 'google':
        profileData = await getGoogleProfile(user);
        break;
      case 'facebook':
        profileData = await getFacebookProfile(user);
        break;
      default:
        profileData = {
          id: user.userId,
          name: user.username
        };
    }
    
    return { jsonBody: profileData };
  },
  methods: ['GET'],
  route: 'profile',
  authLevel: 'anonymous',
  security: [easyAuth]
});
```

#### Testing EasyAuth Locally

EasyAuth doesn't work in local development by default. You can mock it:

```typescript
import { InvocationContext, HttpRequest } from '@azure/functions';

function mockEasyAuthPrincipal(request: HttpRequest): void {
  // Only in development
  if (process.env.AZURE_FUNCTIONS_ENVIRONMENT !== 'Production') {
    const mockPrincipal = {
      userId: 'dev-user-123',
      username: 'dev@example.com',
      identityProvider: 'aad',
      claims: [
        { typ: 'name', val: 'Dev User' },
        { typ: 'emails', val: 'dev@example.com' },
        { typ: 'roles', val: 'Admin' }
      ]
    };
    
    // Inject mock principal
    const encoded = Buffer.from(JSON.stringify(mockPrincipal)).toString('base64');
    request.headers.set('X-MS-CLIENT-PRINCIPAL', encoded);
  }
}

// Use in handlers
app.openapiPath('TestEasyAuth', 'Test EasyAuth', {
  handler: async (request, context) => {
    mockEasyAuthPrincipal(request); // Only in dev
    
    const user = parseEasyAuthPrincipal(request);
    return { jsonBody: { user } };
  },
  methods: ['GET'],
  route: 'test/easyauth',
  authLevel: 'anonymous',
  security: [easyAuth]
});
```

#### Complete CRUD Example with EasyAuth

```typescript
import { app } from '@azure/functions';
import { z } from 'zod';
import { parseEasyAuthPrincipal } from '@apvee/azure-functions-openapi';

const easyAuth = app.openapiEasyAuth();

const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  ownerId: z.string()
});

// Create todo (user-specific)
app.openapiPath('CreateTodo', 'Create a new todo', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    if (!user) return { status: 401, jsonBody: { error: 'Unauthorized' } };
    
    const body = await request.json();
    const todo = await db.todos.create({
      ...body,
      ownerId: user.userId
    });
    
    return { status: 201, jsonBody: todo };
  },
  methods: ['POST'],
  route: 'todos',
  authLevel: 'anonymous',
  security: [easyAuth]
});

// List user's todos
app.openapiPath('ListMyTodos', 'List my todos', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    if (!user) return { status: 401, jsonBody: { error: 'Unauthorized' } };
    
    const todos = await db.todos.findMany({
      where: { ownerId: user.userId }
    });
    
    return { jsonBody: todos };
  },
  methods: ['GET'],
  route: 'todos',
  authLevel: 'anonymous',
  security: [easyAuth]
});

// Update todo (ownership check)
app.openapiPath('UpdateTodo', 'Update a todo', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    if (!user) return { status: 401, jsonBody: { error: 'Unauthorized' } };
    
    const { id } = request.params;
    const todo = await db.todos.findUnique({ where: { id } });
    
    // Ownership check
    if (todo.ownerId !== user.userId) {
      return { status: 403, jsonBody: { error: 'Forbidden' } };
    }
    
    const body = await request.json();
    const updated = await db.todos.update({
      where: { id },
      data: body
    });
    
    return { jsonBody: updated };
  },
  methods: ['PATCH'],
  route: 'todos/{id}',
  authLevel: 'anonymous',
  security: [easyAuth]
});

// Delete todo (ownership check)
app.openapiPath('DeleteTodo', 'Delete a todo', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    if (!user) return { status: 401, jsonBody: { error: 'Unauthorized' } };
    
    const { id } = request.params;
    const todo = await db.todos.findUnique({ where: { id } });
    
    // Ownership check
    if (todo.ownerId !== user.userId) {
      return { status: 403, jsonBody: { error: 'Forbidden' } };
    }
    
    await db.todos.delete({ where: { id } });
    return { status: 204 };
  },
  methods: ['DELETE'],
  route: 'todos/{id}',
  authLevel: 'anonymous',
  security: [easyAuth]
});
```

#### EasyAuth Best Practices

**✅ DO:**
- Always check if `parseEasyAuthPrincipal()` returns a user
- Use `authLevel: 'anonymous'` (EasyAuth handles auth)
- Implement ownership checks for user-specific resources
- Log user actions with `user.userId` for auditing
- Configure EasyAuth to return 401 for APIs (not redirect)

**❌ DON'T:**
- Don't use `authLevel: 'function'` with EasyAuth
- Don't trust client-provided user IDs (use EasyAuth principal)
- Don't expose admin operations without role checks
- Don't forget to configure EasyAuth in Azure Portal/CLI

#### Comparison: EasyAuth vs Other Auth Methods

| Feature | EasyAuth | Function Keys | Bearer Token | Client Credentials |
|---------|----------|--------------|--------------|-------------------|
| **User Identity** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes (service) |
| **Setup Location** | Azure Portal | Built-in | Manual | Manual |
| **Code Required** | Minimal | None | Validation logic | Validation logic |
| **Social Login** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Best For** | User-facing apps | Service APIs | Custom auth | Service-to-service |

---

### Azure AD Bearer Token Authentication

Azure AD Bearer Token authentication allows you to manually validate JWT tokens issued by Azure Active Directory (Microsoft Entra ID). Use `app.openapiBearerToken()` when you need fine-grained control over token validation.

#### When to Use Bearer Token Auth

**Use Bearer Token when:**
- ✅ You need custom token validation logic
- ✅ You want to validate specific claims or scopes
- ✅ You're building a SPA or mobile app with MSAL
- ✅ You need user identity with manual control
- ✅ EasyAuth isn't available or suitable

**Use EasyAuth instead when:**
- ❌ You want Azure to handle all validation
- ❌ You need multiple social providers
- ❌ You want zero-code authentication

#### Simple Bearer Token Setup

Basic configuration with Azure AD:

```typescript
import { app } from '@azure/functions';

// Register Bearer token security
const bearerAuth = app.openapiBearerToken({
  issuer: 'https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0',
  audience: 'api://YOUR_API_CLIENT_ID'
});

app.openapiPath('GetUserData', 'Get user data', {
  handler: async (request, context) => {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return { status: 401, jsonBody: { error: 'Missing token' } };
    }
    
    // Validate token (see validation example below)
    const user = await validateToken(token);
    
    if (!user) {
      return { status: 401, jsonBody: { error: 'Invalid token' } };
    }
    
    // User is authenticated
    const data = await getUserData(user.oid);
    return { jsonBody: data };
  },
  methods: ['GET'],
  route: 'user/data',
  authLevel: 'anonymous',
  security: [bearerAuth]
});
```

**Request example:**

```bash
curl http://localhost:7071/api/user/data \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

#### Token Validation with MSAL

Use `@azure/msal-node` to validate tokens:

```typescript
import { CryptoProvider } from '@azure/msal-node';

interface TokenClaims {
  oid: string;          // User object ID
  sub: string;          // Subject
  name: string;         // User name
  email?: string;       // Email (if available)
  roles?: string[];     // App roles
  scp?: string;         // Scopes (space-separated)
}

async function validateToken(token: string): Promise<TokenClaims | null> {
  try {
    const cryptoProvider = new CryptoProvider();
    
    // Verify token signature and claims
    const decodedToken = await cryptoProvider.verifySignature(
      token,
      {
        issuer: process.env.AAD_ISSUER,
        audience: process.env.AAD_AUDIENCE,
        // Additional validation options
        validateLifetime: true,
        clockTolerance: 300 // 5 minutes tolerance
      }
    );
    
    return decodedToken as TokenClaims;
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}
```

#### Complete Token Validation Example

Using `jsonwebtoken` and `jwks-rsa` for validation:

```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Create JWKS client to fetch public keys
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000 // 24 hours
});

// Get signing key
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Validate token
async function validateBearerToken(token: string): Promise<TokenClaims> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        issuer: process.env.AAD_ISSUER,
        audience: process.env.AAD_AUDIENCE,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as TokenClaims);
        }
      }
    );
  });
}

// Use in handler
const bearerAuth = app.openapiBearerToken({
  issuer: process.env.AAD_ISSUER,
  audience: process.env.AAD_AUDIENCE
});

app.openapiPath('ProtectedEndpoint', 'Protected endpoint', {
  handler: async (request, context) => {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return { status: 401, jsonBody: { error: 'No token provided' } };
    }
    
    try {
      const claims = await validateBearerToken(token);
      
      context.log('Authenticated user:', {
        userId: claims.oid,
        name: claims.name,
        email: claims.email
      });
      
      return {
        jsonBody: {
          message: 'Success',
          user: claims.name
        }
      };
    } catch (error) {
      context.error('Token validation failed:', error);
      return {
        status: 401,
        jsonBody: { error: 'Invalid or expired token' }
      };
    }
  },
  methods: ['GET'],
  route: 'protected',
  authLevel: 'anonymous',
  security: [bearerAuth]
});
```

#### Scope-Based Authorization

Validate specific scopes from the token:

```typescript
function hasScope(claims: TokenClaims, requiredScope: string): boolean {
  const scopes = claims.scp?.split(' ') || [];
  return scopes.includes(requiredScope);
}

const bearerAuth = app.openapiBearerToken({
  issuer: process.env.AAD_ISSUER,
  audience: process.env.AAD_AUDIENCE,
  scopes: ['api.read', 'api.write'] // Document required scopes
});

app.openapiPath('WriteData', 'Write data (requires api.write scope)', {
  handler: async (request, context) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return { status: 401, jsonBody: { error: 'No token' } };
    
    try {
      const claims = await validateBearerToken(token);
      
      // Check for required scope
      if (!hasScope(claims, 'api.write')) {
        return {
          status: 403,
          jsonBody: { error: 'Insufficient permissions: api.write scope required' }
        };
      }
      
      // Proceed with write operation
      const body = await request.json();
      await writeData(claims.oid, body);
      
      return { jsonBody: { success: true } };
    } catch (error) {
      return { status: 401, jsonBody: { error: 'Invalid token' } };
    }
  },
  methods: ['POST'],
  route: 'data',
  authLevel: 'anonymous',
  security: [bearerAuth],
  responses: [
    { httpCode: 200, description: 'Data written successfully' },
    { httpCode: 401, description: 'Invalid or missing token' },
    { httpCode: 403, description: 'Insufficient permissions' }
  ]
});
```

#### Role-Based Authorization

Validate app roles from the token:

```typescript
function hasRole(claims: TokenClaims, requiredRole: string): boolean {
  return claims.roles?.includes(requiredRole) || false;
}

const bearerAuth = app.openapiBearerToken({
  issuer: process.env.AAD_ISSUER,
  audience: process.env.AAD_AUDIENCE,
  description: 'Azure AD Bearer token with Admin role required'
});

app.openapiPath('AdminOperation', 'Admin operation', {
  handler: async (request, context) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return { status: 401, jsonBody: { error: 'No token' } };
    
    try {
      const claims = await validateBearerToken(token);
      
      // Check for admin role
      if (!hasRole(claims, 'Admin')) {
        context.warn(`Access denied for user ${claims.oid}: missing Admin role`);
        return {
          status: 403,
          jsonBody: { error: 'Admin role required' }
        };
      }
      
      // Admin operation
      await performAdminOperation();
      
      context.log(`Admin operation performed by ${claims.name}`);
      return { jsonBody: { success: true } };
    } catch (error) {
      return { status: 401, jsonBody: { error: 'Invalid token' } };
    }
  },
  methods: ['POST'],
  route: 'admin/operation',
  authLevel: 'anonymous',
  security: [bearerAuth]
});
```

#### Advanced Configuration

Full Bearer token configuration:

```typescript
const advancedBearerAuth = app.openapiBearerToken({
  name: 'AzureADBearer',
  issuer: 'https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0',
  audience: 'api://YOUR_API_CLIENT_ID',
  scopes: ['api.read', 'api.write', 'api.admin'],
  description: 'Azure AD Bearer token. Obtain from Microsoft Identity Platform.',
  bearerFormat: 'JWT' // Optional: specify token format
});
```

#### Environment Configuration

Store configuration in environment variables:

```typescript
// .env or local.settings.json
AAD_TENANT_ID=your-tenant-id
AAD_CLIENT_ID=your-api-client-id
AAD_ISSUER=https://login.microsoftonline.com/${AAD_TENANT_ID}/v2.0
AAD_AUDIENCE=api://${AAD_CLIENT_ID}
```

```typescript
// In your code
const bearerAuth = app.openapiBearerToken({
  issuer: process.env.AAD_ISSUER!,
  audience: process.env.AAD_AUDIENCE!,
  scopes: process.env.AAD_SCOPES?.split(',') || []
});
```

#### Client Application Example (MSAL.js)

How clients obtain and use tokens:

```typescript
// Frontend: Acquire token with MSAL.js
import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: 'YOUR_SPA_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: window.location.origin
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// Login and acquire token
async function callProtectedAPI() {
  try {
    // Interactive login
    const loginResponse = await msalInstance.loginPopup({
      scopes: ['api://YOUR_API_CLIENT_ID/api.read']
    });
    
    // Get access token
    const tokenResponse = await msalInstance.acquireTokenSilent({
      scopes: ['api://YOUR_API_CLIENT_ID/api.read'],
      account: loginResponse.account
    });
    
    // Call API with token
    const response = await fetch('https://your-function-app.azurewebsites.net/api/user/data', {
      headers: {
        'Authorization': `Bearer ${tokenResponse.accessToken}`
      }
    });
    
    const data = await response.json();
    console.log('API response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

#### Registering App in Azure AD

**Step 1: Register your API:**

```bash
# Create app registration for API
az ad app create \
  --display-name "My Function API" \
  --sign-in-audience AzureADMyOrg

# Expose an API
az ad app update \
  --id YOUR_API_CLIENT_ID \
  --identifier-uris "api://YOUR_API_CLIENT_ID"

# Add app roles (optional)
az ad app update \
  --id YOUR_API_CLIENT_ID \
  --app-roles '[
    {
      "allowedMemberTypes": ["User"],
      "description": "Administrators",
      "displayName": "Admin",
      "id": "00000000-0000-0000-0000-000000000001",
      "isEnabled": true,
      "value": "Admin"
    }
  ]'
```

**Step 2: Configure scopes:**

```bash
# Add OAuth2 permissions
az ad app permission add \
  --id YOUR_API_CLIENT_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope
```

**Step 3: Register client app (SPA/mobile):**

```bash
az ad app create \
  --display-name "My Client App" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "http://localhost:3000" \
  --public-client-redirect-uris "msal://redirect"

# Grant permissions to call API
az ad app permission add \
  --id YOUR_CLIENT_ID \
  --api YOUR_API_CLIENT_ID \
  --api-permissions YOUR_SCOPE_ID=Scope
```

#### Testing with Postman

**1. Get access token:**
- Create a new request
- Go to **Authorization** tab
- Select **OAuth 2.0**
- Configure:
  - Grant Type: `Authorization Code`
  - Auth URL: `https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/authorize`
  - Access Token URL: `https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token`
  - Client ID: Your app's client ID
  - Scope: `api://YOUR_API_CLIENT_ID/api.read`

**2. Make authenticated request:**

```
GET https://your-function-app.azurewebsites.net/api/user/data
Authorization: Bearer {{access_token}}
```

#### Best Practices

**✅ DO:**
- Always validate token signature using JWKS
- Check issuer and audience claims
- Validate token expiration (`exp` claim)
- Implement scope/role checks for authorization
- Cache JWKS keys (with TTL)
- Log authentication failures for monitoring
- Use environment variables for configuration

**❌ DON'T:**
- Don't decode tokens without validation
- Don't trust client-provided claims
- Don't hardcode tenant IDs or client IDs
- Don't skip token expiration checks
- Don't expose detailed error messages to clients
- Don't validate tokens on every request (use caching)

#### Comparison: Bearer Token vs Other Methods

| Feature | Bearer Token | EasyAuth | Function Keys | Client Credentials |
|---------|--------------|----------|--------------|-------------------|
| **User Identity** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes (service) |
| **Code Required** | Validation logic | Minimal | None | Validation logic |
| **Validation Control** | Full control | Azure handles | Azure handles | Full control |
| **Scopes/Roles** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Use Case** | User auth with control | User auth (simple) | Service APIs | Service-to-service |

---

### Azure AD Client Credentials (Service-to-Service)

Azure AD Client Credentials flow is designed for service-to-service authentication where one service (daemon/backend) calls another service without user interaction. Use `app.openapiClientCredentials()` to document APIs that accept service principal tokens.

#### When to Use Client Credentials

**Use Client Credentials when:**
- ✅ Service-to-service communication (no user)
- ✅ Background jobs calling APIs
- ✅ Microservices authentication
- ✅ Daemon applications
- ✅ Server-to-server scenarios

**Use Bearer Token instead when:**
- ❌ User identity is required
- ❌ Delegated permissions needed
- ❌ User interaction is involved

#### Simple Client Credentials Setup

Basic configuration for service authentication:

```typescript
import { app } from '@azure/functions';

// Register Client Credentials security
const clientCredsAuth = app.openapiClientCredentials({
  tokenUrl: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/oauth2/v2.0/token`,
  scopes: {
    'api://YOUR_API_CLIENT_ID/.default': 'Full API access'
  }
});

app.openapiPath('ProcessData', 'Process data (service authentication)', {
  handler: async (request, context) => {
    // Extract token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return { status: 401, jsonBody: { error: 'No token provided' } };
    }
    
    // Validate service token
    const servicePrincipal = await validateServiceToken(token);
    
    if (!servicePrincipal) {
      return { status: 401, jsonBody: { error: 'Invalid service token' } };
    }
    
    context.log('Service authenticated:', servicePrincipal.appId);
    
    // Process data
    const result = await processData();
    return { jsonBody: result };
  },
  methods: ['POST'],
  route: 'data/process',
  authLevel: 'anonymous',
  security: [clientCredsAuth]
});
```

#### Token Validation

Validate service principal tokens:

```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

interface ServicePrincipalClaims {
  oid: string;          // Service principal object ID
  tid: string;          // Tenant ID
  appid: string;        // Application (client) ID
  roles?: string[];     // App roles assigned
  azp?: string;         // Authorized party
  iss: string;          // Issuer
  aud: string;          // Audience
}

// Create JWKS client
const jwksClientInstance = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000
});

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, key?.getPublicKey());
  });
}

async function validateServiceToken(token: string): Promise<ServicePrincipalClaims | null> {
  return new Promise((resolve) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        issuer: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/v2.0`,
        audience: `api://${process.env.AAD_CLIENT_ID}`,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) {
          console.error('Service token validation failed:', err.message);
          resolve(null);
        } else {
          resolve(decoded as ServicePrincipalClaims);
        }
      }
    );
  });
}
```

#### Role-Based Service Authorization

Check app roles assigned to service principals:

```typescript
function hasAppRole(claims: ServicePrincipalClaims, requiredRole: string): boolean {
  return claims.roles?.includes(requiredRole) || false;
}

const clientCredsAuth = app.openapiClientCredentials({
  tokenUrl: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/oauth2/v2.0/token`,
  scopes: {
    'api://YOUR_API_CLIENT_ID/.default': 'API access with roles'
  }
});

app.openapiPath('AdminService', 'Admin service operation', {
  handler: async (request, context) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return { status: 401, jsonBody: { error: 'No token' } };
    
    const servicePrincipal = await validateServiceToken(token);
    if (!servicePrincipal) {
      return { status: 401, jsonBody: { error: 'Invalid token' } };
    }
    
    // Check for required app role
    if (!hasAppRole(servicePrincipal, 'DataProcessor')) {
      context.warn(`Service ${servicePrincipal.appid} lacks DataProcessor role`);
      return {
        status: 403,
        jsonBody: { error: 'DataProcessor role required' }
      };
    }
    
    // Perform admin operation
    context.log(`Admin operation by service: ${servicePrincipal.appid}`);
    await performAdminOperation();
    
    return { jsonBody: { success: true } };
  },
  methods: ['POST'],
  route: 'admin/service',
  authLevel: 'anonymous',
  security: [clientCredsAuth],
  responses: [
    { httpCode: 200, description: 'Operation successful' },
    { httpCode: 401, description: 'Invalid or missing token' },
    { httpCode: 403, description: 'Insufficient permissions' }
  ]
});
```

#### Advanced Configuration

Full configuration with multiple scopes:

```typescript
const advancedClientCreds = app.openapiClientCredentials({
  name: 'ServicePrincipal',
  tokenUrl: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/oauth2/v2.0/token`,
  refreshUrl: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/oauth2/v2.0/token`,
  scopes: {
    'api://YOUR_API_CLIENT_ID/.default': 'Full API access',
    'api://YOUR_API_CLIENT_ID/Data.Read': 'Read data',
    'api://YOUR_API_CLIENT_ID/Data.Write': 'Write data',
    'api://YOUR_API_CLIENT_ID/Data.Admin': 'Administrative access'
  },
  description: 'Azure AD Client Credentials flow for service-to-service authentication. Requires service principal with assigned app roles.'
});

app.openapiPath('ServiceEndpoint', 'Service-only endpoint', {
  handler: serviceHandler,
  methods: ['POST'],
  route: 'service/operation',
  authLevel: 'anonymous',
  security: [advancedClientCreds]
});
```

#### Client Application: Acquiring Tokens

How services acquire access tokens:

```typescript
// Backend service acquiring token
import { ConfidentialClientApplication } from '@azure/msal-node';

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_APP_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}`,
    clientSecret: process.env.CLIENT_APP_SECRET!
  }
};

const cca = new ConfidentialClientApplication(msalConfig);

async function callProtectedAPI() {
  try {
    // Acquire token using client credentials
    const tokenResponse = await cca.acquireTokenByClientCredential({
      scopes: [`api://${process.env.API_CLIENT_ID}/.default`]
    });
    
    if (!tokenResponse?.accessToken) {
      throw new Error('Failed to acquire token');
    }
    
    // Call API with token
    const response = await fetch('https://your-api.azurewebsites.net/api/data/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResponse.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: 'some data' })
    });
    
    const result = await response.json();
    console.log('API response:', result);
    
  } catch (error) {
    console.error('Error calling API:', error);
  }
}

// Call API
await callProtectedAPI();
```

#### Using Azure Identity

Simplified approach with `@azure/identity`:

```typescript
import { ClientSecretCredential } from '@azure/identity';
import fetch from 'node-fetch';

// Create credential
const credential = new ClientSecretCredential(
  process.env.AAD_TENANT_ID!,
  process.env.CLIENT_APP_ID!,
  process.env.CLIENT_APP_SECRET!
);

async function callAPIWithIdentity() {
  try {
    // Get access token
    const tokenResponse = await credential.getToken(
      `api://${process.env.API_CLIENT_ID}/.default`
    );
    
    // Call API
    const response = await fetch('https://your-api.azurewebsites.net/api/service/operation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResponse.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'process' })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

#### Managed Identity (Azure Services)

Use Managed Identity for Azure-hosted services:

```typescript
import { ManagedIdentityCredential } from '@azure/identity';

// For system-assigned managed identity
const credential = new ManagedIdentityCredential();

// For user-assigned managed identity
const credential = new ManagedIdentityCredential(process.env.USER_ASSIGNED_CLIENT_ID);

async function callAPIFromAzureService() {
  try {
    // Get token for target API
    const tokenResponse = await credential.getToken(
      `api://${process.env.API_CLIENT_ID}/.default`
    );
    
    // Call API
    const response = await fetch('https://your-api.azurewebsites.net/api/service/operation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResponse.token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Managed Identity error:', error);
    throw error;
  }
}
```

#### Registering Service Principal in Azure AD

**Step 1: Register API application:**

```bash
# Create app registration for API
az ad app create \
  --display-name "My Function API" \
  --identifier-uris "api://my-function-api"

# Note the Application (client) ID
API_CLIENT_ID=$(az ad app list --display-name "My Function API" --query "[0].appId" -o tsv)
```

**Step 2: Define app roles:**

```bash
# Add app roles to API
az ad app update \
  --id $API_CLIENT_ID \
  --app-roles '[
    {
      "allowedMemberTypes": ["Application"],
      "description": "Data processor services",
      "displayName": "DataProcessor",
      "id": "00000000-0000-0000-0000-000000000001",
      "isEnabled": true,
      "value": "DataProcessor"
    },
    {
      "allowedMemberTypes": ["Application"],
      "description": "Admin services",
      "displayName": "AdminService",
      "id": "00000000-0000-0000-0000-000000000002",
      "isEnabled": true,
      "value": "AdminService"
    }
  ]'
```

**Step 3: Register client service:**

```bash
# Create service principal for client
az ad app create \
  --display-name "My Background Service"

CLIENT_APP_ID=$(az ad app list --display-name "My Background Service" --query "[0].appId" -o tsv)

# Create client secret
az ad app credential reset \
  --id $CLIENT_APP_ID \
  --append \
  --years 2
```

**Step 4: Assign app role:**

```bash
# Get service principal IDs
API_SP_ID=$(az ad sp show --id $API_CLIENT_ID --query id -o tsv)
CLIENT_SP_ID=$(az ad sp show --id $CLIENT_APP_ID --query id -o tsv)

# Assign DataProcessor role to client service
az ad app permission add \
  --id $CLIENT_APP_ID \
  --api $API_CLIENT_ID \
  --api-permissions 00000000-0000-0000-0000-000000000001=Role

# Grant admin consent
az ad app permission admin-consent --id $CLIENT_APP_ID
```

#### Complete Example: Microservices

API with multiple service endpoints:

```typescript
import { app } from '@azure/functions';
import { z } from 'zod';

const clientCredsAuth = app.openapiClientCredentials({
  tokenUrl: `https://login.microsoftonline.com/${process.env.AAD_TENANT_ID}/oauth2/v2.0/token`,
  scopes: {
    'api://my-api/.default': 'API access'
  }
});

// Data processor service endpoint
app.openapiPath('ProcessDataService', 'Process data batch', {
  handler: async (request, context) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return { status: 401, jsonBody: { error: 'No token' } };
    
    const sp = await validateServiceToken(token);
    if (!sp || !hasAppRole(sp, 'DataProcessor')) {
      return { status: 403, jsonBody: { error: 'DataProcessor role required' } };
    }
    
    const body = await request.json();
    const result = await processBatch(body.items);
    
    context.log(`Processed ${result.count} items for service ${sp.appid}`);
    return { jsonBody: result };
  },
  methods: ['POST'],
  route: 'batch/process',
  authLevel: 'anonymous',
  security: [clientCredsAuth],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            items: z.array(z.string())
          })
        }
      }
    }
  }
});

// Analytics service endpoint
app.openapiPath('GetAnalyticsService', 'Get analytics data', {
  handler: async (request, context) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return { status: 401, jsonBody: { error: 'No token' } };
    
    const sp = await validateServiceToken(token);
    if (!sp || !hasAppRole(sp, 'AnalyticsReader')) {
      return { status: 403, jsonBody: { error: 'AnalyticsReader role required' } };
    }
    
    const analytics = await getAnalytics();
    
    context.log(`Analytics requested by service ${sp.appid}`);
    return { jsonBody: analytics };
  },
  methods: ['GET'],
  route: 'analytics',
  authLevel: 'anonymous',
  security: [clientCredsAuth]
});

// Admin service endpoint
app.openapiPath('ResetDataService', 'Reset all data', {
  handler: async (request, context) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return { status: 401, jsonBody: { error: 'No token' } };
    
    const sp = await validateServiceToken(token);
    if (!sp || !hasAppRole(sp, 'AdminService')) {
      return { status: 403, jsonBody: { error: 'AdminService role required' } };
    }
    
    await resetAllData();
    
    context.warn(`All data reset by admin service ${sp.appid}`);
    return { status: 204 };
  },
  methods: ['DELETE'],
  route: 'data/reset',
  authLevel: 'anonymous',
  security: [clientCredsAuth]
});
```

#### Best Practices

**✅ DO:**
- Use Managed Identity when calling from Azure services
- Validate token signature with JWKS
- Check `appid` and `roles` claims
- Rotate client secrets regularly (every 6-12 months)
- Use Azure Key Vault for storing secrets
- Log service principal activity for auditing
- Use specific app roles (not just `.default`)
- Implement retry logic for token acquisition

**❌ DON'T:**
- Don't hardcode client secrets in code
- Don't use user delegation (that's Bearer Token flow)
- Don't skip token validation
- Don't expose secrets in logs
- Don't grant excessive permissions
- Don't reuse client secrets across environments
- Don't ignore token expiration

#### Environment Configuration

```typescript
// local.settings.json / .env
{
  "AAD_TENANT_ID": "your-tenant-id",
  "AAD_CLIENT_ID": "your-api-client-id",
  "CLIENT_APP_ID": "your-client-app-id",
  "CLIENT_APP_SECRET": "your-client-secret",
  "KEY_VAULT_URL": "https://your-vault.vault.azure.net/"
}
```

```typescript
// Use Key Vault for secrets in production
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const keyVaultClient = new SecretClient(
  process.env.KEY_VAULT_URL!,
  new DefaultAzureCredential()
);

const clientSecret = await keyVaultClient.getSecret('client-app-secret');
```

#### Comparison: Client Credentials vs Other Methods

| Feature | Client Credentials | Bearer Token | EasyAuth | Function Keys |
|---------|-------------------|--------------|----------|--------------|
| **User Identity** | ❌ No (service) | ✅ Yes | ✅ Yes | ❌ No |
| **Use Case** | Service-to-service | User auth | User auth | Simple auth |
| **Token Type** | Service principal | User token | User token | Function key |
| **Permissions** | App roles | Scopes/roles | Claims | N/A |
| **Setup Complexity** | Medium | Medium | Low | Very low |
| **Managed Identity** | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

### Request Validation

The library provides comprehensive request validation using Zod schemas. This ensures that incoming requests meet your API's requirements before processing.

#### Basic Request Validation

Validate request body with Zod schema:

```typescript
import { app } from '@azure/functions';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(18).max(120)
});

app.openapiPath('CreateUser', 'Create a new user', {
  handler: async (request, context) => {
    const body = await request.json();
    
    // Validate with Zod
    const validation = CreateUserSchema.safeParse(body);
    
    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          error: 'Validation failed',
          details: validation.error.issues
        }
      };
    }
    
    // Validated data with correct types
    const user = await createUser(validation.data);
    return { status: 201, jsonBody: user };
  },
  methods: ['POST'],
  route: 'users',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateUserSchema
        }
      }
    }
  }
});
```

#### Using Validation Utilities

Use built-in `parseBody()` utility for automatic validation:

```typescript
import { parseBody, ValidationError } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const TodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  completed: z.boolean().default(false)
});

app.openapiPath('CreateTodo', 'Create a todo', {
  handler: async (request, context) => {
    try {
      // parseBody automatically validates and returns typed data
      const todo = await parseBody(request, TodoSchema);
      
      // todo is now typed: { title: string; description?: string; completed: boolean }
      const created = await db.todos.create(todo);
      
      return { status: 201, jsonBody: created };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: {
            error: 'Invalid request body',
            details: error.issues
          }
        };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'todos',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: TodoSchema
        }
      }
    }
  }
});
```

#### Query Parameter Validation

Validate query parameters:

```typescript
import { parseQueryParams } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'date', 'popularity']).default('date')
});

app.openapiPath('SearchUsers', 'Search users', {
  handler: async (request, context) => {
    try {
      // Parse and validate query parameters
      const query = parseQueryParams(request, SearchQuerySchema);
      
      // query is typed: { q: string; limit: number; offset: number; sortBy: 'name' | 'date' | 'popularity' }
      const results = await searchUsers({
        searchTerm: query.q,
        limit: query.limit,
        offset: query.offset,
        sortBy: query.sortBy
      });
      
      return { jsonBody: results };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: { error: 'Invalid query parameters', details: error.issues }
        };
      }
      throw error;
    }
  },
  methods: ['GET'],
  route: 'users/search',
  authLevel: 'anonymous',
  request: {
    query: z.object({
      q: z.string().describe('Search query'),
      limit: z.number().int().min(1).max(100).optional().describe('Results per page'),
      offset: z.number().int().min(0).optional().describe('Pagination offset'),
      sortBy: z.enum(['name', 'date', 'popularity']).optional().describe('Sort field')
    })
  }
});
```

#### Route Parameter Validation

Validate route parameters:

```typescript
import { parseRouteParams } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const RouteParamsSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'pending'])
});

app.openapiPath('UpdateStatus', 'Update item status', {
  handler: async (request, context) => {
    try {
      // Parse and validate route parameters
      const params = parseRouteParams(request, RouteParamsSchema);
      
      // params is typed: { id: string; action: 'approve' | 'reject' | 'pending' }
      const updated = await updateItemStatus(params.id, params.action);
      
      return { jsonBody: updated };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: { error: 'Invalid route parameters', details: error.issues }
        };
      }
      throw error;
    }
  },
  methods: ['PUT'],
  route: 'items/{id}/{action}',
  authLevel: 'anonymous',
  request: {
    params: z.object({
      id: z.string().uuid().describe('Item ID'),
      action: z.enum(['approve', 'reject', 'pending']).describe('Action to perform')
    })
  }
});
```

#### Header Validation

Validate custom headers:

```typescript
import { parseHeaders } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const HeadersSchema = z.object({
  'x-api-version': z.enum(['1.0', '2.0']),
  'x-client-id': z.string().min(1),
  'x-request-id': z.string().uuid().optional()
});

app.openapiPath('VersionedEndpoint', 'Versioned API endpoint', {
  handler: async (request, context) => {
    try {
      // Parse and validate headers
      const headers = parseHeaders(request, HeadersSchema);
      
      // headers is typed: { 'x-api-version': '1.0' | '2.0'; 'x-client-id': string; 'x-request-id'?: string }
      const version = headers['x-api-version'];
      const clientId = headers['x-client-id'];
      
      context.log(`Request from client ${clientId} using API v${version}`);
      
      // Handle based on version
      const result = version === '2.0' 
        ? await handleV2Request(request)
        : await handleV1Request(request);
      
      return { jsonBody: result };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: { error: 'Invalid headers', details: error.issues }
        };
      }
      throw error;
    }
  },
  methods: ['GET'],
  route: 'versioned/data',
  authLevel: 'anonymous',
  request: {
    headers: z.object({
      'x-api-version': z.enum(['1.0', '2.0']).describe('API version'),
      'x-client-id': z.string().describe('Client identifier'),
      'x-request-id': z.string().uuid().optional().describe('Request tracking ID')
    })
  }
});
```

#### Complex Nested Validation

Validate complex nested structures:

```typescript
import { z } from 'zod';

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/)
});

const PhoneSchema = z.object({
  type: z.enum(['mobile', 'home', 'work']),
  number: z.string().regex(/^\+?1?\d{10,14}$/)
});

const CompanySchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string(),
  employees: z.number().int().min(1),
  address: AddressSchema,
  contactPhones: z.array(PhoneSchema).min(1).max(5),
  website: z.string().url().optional(),
  founded: z.coerce.date(),
  tags: z.array(z.string()).max(10).default([])
});

app.openapiPath('CreateCompany', 'Create a company', {
  handler: async (request, context) => {
    try {
      const company = await parseBody(request, CompanySchema);
      
      // Fully typed nested structure
      context.log(`Creating company: ${company.name} in ${company.address.city}, ${company.address.state}`);
      
      const created = await db.companies.create(company);
      return { status: 201, jsonBody: created };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: {
            error: 'Validation failed',
            details: error.issues
          }
        };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'companies',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CompanySchema
        }
      }
    }
  }
});
```

#### Conditional Validation

Validate based on conditions:

```typescript
import { z } from 'zod';

const PaymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('credit_card'),
    cardNumber: z.string().regex(/^\d{16}$/),
    expiryMonth: z.number().int().min(1).max(12),
    expiryYear: z.number().int().min(2024),
    cvv: z.string().regex(/^\d{3,4}$/)
  }),
  z.object({
    method: z.literal('paypal'),
    email: z.string().email()
  }),
  z.object({
    method: z.literal('bank_transfer'),
    accountNumber: z.string().min(8),
    routingNumber: z.string().length(9)
  })
]);

app.openapiPath('ProcessPayment', 'Process payment', {
  handler: async (request, context) => {
    try {
      const payment = await parseBody(request, PaymentSchema);
      
      // TypeScript knows the shape based on method
      let result;
      switch (payment.method) {
        case 'credit_card':
          result = await processCreditCard(payment.cardNumber, payment.cvv);
          break;
        case 'paypal':
          result = await processPayPal(payment.email);
          break;
        case 'bank_transfer':
          result = await processBankTransfer(payment.accountNumber, payment.routingNumber);
          break;
      }
      
      return { jsonBody: result };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { status: 400, jsonBody: { error: 'Invalid payment data', details: error.issues } };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'payments',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: PaymentSchema
        }
      }
    }
  }
});
```

#### Custom Validation Logic

Add custom validation with refinements:

```typescript
import { z } from 'zod';

const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const RegisterSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: PasswordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword']
  }
);

const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  age: z.number().int().min(13).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided'
  }
);

app.openapiPath('Register', 'Register new user', {
  handler: async (request, context) => {
    try {
      const data = await parseBody(request, RegisterSchema);
      
      // Check if username exists
      const existing = await db.users.findUnique({ where: { username: data.username } });
      if (existing) {
        return {
          status: 409,
          jsonBody: { error: 'Username already taken' }
        };
      }
      
      const user = await createUser({
        username: data.username,
        email: data.email,
        passwordHash: await hashPassword(data.password)
      });
      
      return { status: 201, jsonBody: { id: user.id, username: user.username } };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { status: 400, jsonBody: { error: 'Validation failed', details: error.issues } };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'register',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: RegisterSchema
        }
      }
    }
  }
});
```

#### Array Validation

Validate arrays with constraints:

```typescript
import { z } from 'zod';

const BulkCreateSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().int().min(1),
      price: z.number().positive()
    })
  )
    .min(1, 'At least one item is required')
    .max(100, 'Maximum 100 items per request')
});

app.openapiPath('BulkCreateItems', 'Create multiple items', {
  handler: async (request, context) => {
    try {
      const data = await parseBody(request, BulkCreateSchema);
      
      // Process items in batch
      const created = await db.items.createMany({
        data: data.items
      });
      
      context.log(`Created ${created.count} items`);
      return {
        status: 201,
        jsonBody: {
          message: `Successfully created ${created.count} items`,
          count: created.count
        }
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { status: 400, jsonBody: { error: 'Validation failed', details: error.issues } };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'items/bulk',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: BulkCreateSchema
        }
      }
    }
  }
});
```

#### File Upload Validation

Validate file uploads:

```typescript
import { z } from 'zod';

const FileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(10 * 1024 * 1024), // Max 10MB
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'application/pdf']),
  content: z.string().base64() // Base64-encoded file content
});

app.openapiPath('UploadFile', 'Upload a file', {
  handler: async (request, context) => {
    try {
      const upload = await parseBody(request, FileUploadSchema);
      
      // Decode base64 content
      const buffer = Buffer.from(upload.content, 'base64');
      
      // Upload to storage
      const fileUrl = await uploadToStorage({
        fileName: upload.fileName,
        content: buffer,
        mimeType: upload.mimeType
      });
      
      context.log(`Uploaded file: ${upload.fileName} (${upload.fileSize} bytes)`);
      
      return {
        status: 201,
        jsonBody: {
          url: fileUrl,
          fileName: upload.fileName,
          size: upload.fileSize
        }
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { status: 400, jsonBody: { error: 'Invalid file upload', details: error.issues } };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'files',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: FileUploadSchema
        }
      }
    }
  }
});
```

#### Validation Best Practices

**✅ DO:**
- Use specific validation rules (min, max, regex)
- Provide descriptive error messages
- Use `.safeParse()` or utility functions for error handling
- Validate all user input (body, query, params, headers)
- Use Zod's type inference for TypeScript types
- Add custom refinements for business logic
- Return detailed validation errors in development
- Log validation failures for monitoring

**❌ DON'T:**
- Don't trust client data without validation
- Don't expose sensitive validation logic details in production
- Don't validate more than necessary (performance)
- Don't forget to validate nested objects
- Don't use `any` types after validation
- Don't skip validation for "trusted" clients
- Don't hardcode validation rules (use schemas)

#### Validation Error Handling

Consistent error handling pattern:

```typescript
import { ValidationError } from '@apvee/azure-functions-openapi';
import { InvocationContext, HttpRequest } from '@azure/functions';

async function handleValidatedRequest<T>(
  request: HttpRequest,
  context: InvocationContext,
  schema: z.ZodSchema<T>,
  handler: (data: T) => Promise<any>
) {
  try {
    const data = await parseBody(request, schema);
    const result = await handler(data);
    return { jsonBody: result };
  } catch (error) {
    if (error instanceof ValidationError) {
      context.warn('Validation failed:', error.issues);
      return {
        status: 400,
        jsonBody: {
          error: 'Validation failed',
          details: process.env.NODE_ENV === 'development' ? error.issues : undefined
        }
      };
    }
    context.error('Unexpected error:', error);
    throw error;
  }
}

// Usage
app.openapiPath('CreateTodo', 'Create todo', {
  handler: async (request, context) => {
    return handleValidatedRequest(
      request,
      context,
      TodoSchema,
      async (data) => {
        return await db.todos.create(data);
      }
    );
  },
  methods: ['POST'],
  route: 'todos',
  authLevel: 'anonymous'
});
```

---

### Response Configuration

Configure detailed response documentation including multiple status codes, content types, headers, and examples.

#### Basic Response Configuration

Document multiple response status codes:

```typescript
import { app } from '@azure/functions';
import { z } from 'zod';

const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  completed: z.boolean()
});

const ErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional()
});

app.openapiPath('GetTodo', 'Get a todo by ID', {
  handler: async (request, context) => {
    const { id } = request.params;
    const todo = await db.todos.findUnique({ where: { id } });
    
    if (!todo) {
      return {
        status: 404,
        jsonBody: { error: 'Not found', message: `Todo ${id} not found` }
      };
    }
    
    return { jsonBody: todo };
  },
  methods: ['GET'],
  route: 'todos/{id}',
  authLevel: 'anonymous',
  request: {
    params: z.object({
      id: z.string().uuid().describe('Todo ID')
    })
  },
  responses: [
    {
      httpCode: 200,
      description: 'Todo found',
      content: {
        'application/json': {
          schema: TodoSchema
        }
      }
    },
    {
      httpCode: 404,
      description: 'Todo not found',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    }
  ]
});
```

#### Multiple Content Types

Support different response formats:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

app.openapiPath('GetUser', 'Get user in different formats', {
  handler: async (request, context) => {
    const { id } = request.params;
    const user = await db.users.findUnique({ where: { id } });
    
    if (!user) {
      return { status: 404, jsonBody: { error: 'User not found' } };
    }
    
    // Check Accept header for content negotiation
    const acceptHeader = request.headers.get('accept') || 'application/json';
    
    if (acceptHeader.includes('application/xml')) {
      // Return XML
      const xml = `<?xml version="1.0"?>
        <user>
          <id>${user.id}</id>
          <name>${user.name}</name>
          <email>${user.email}</email>
        </user>`;
      return {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
        body: xml
      };
    }
    
    if (acceptHeader.includes('text/csv')) {
      // Return CSV
      const csv = `id,name,email\n${user.id},${user.name},${user.email}`;
      return {
        status: 200,
        headers: { 'Content-Type': 'text/csv' },
        body: csv
      };
    }
    
    // Default: JSON
    return { jsonBody: user };
  },
  methods: ['GET'],
  route: 'users/{id}',
  authLevel: 'anonymous',
  request: {
    params: z.object({
      id: z.string().uuid()
    })
  },
  responses: [
    {
      httpCode: 200,
      description: 'User data in JSON format',
      content: {
        'application/json': {
          schema: UserSchema
        },
        'application/xml': {
          schema: z.string().describe('User data in XML format')
        },
        'text/csv': {
          schema: z.string().describe('User data in CSV format')
        }
      }
    },
    {
      httpCode: 404,
      description: 'User not found'
    }
  ]
});
```

#### Response Headers

Document custom response headers:

```typescript
import { z } from 'zod';

app.openapiPath('CreateResource', 'Create a new resource', {
  handler: async (request, context) => {
    const body = await request.json();
    const resource = await db.resources.create(body);
    
    return {
      status: 201,
      headers: {
        'Location': `/api/resources/${resource.id}`,
        'X-Resource-ID': resource.id,
        'X-Request-ID': context.invocationId
      },
      jsonBody: resource
    };
  },
  methods: ['POST'],
  route: 'resources',
  authLevel: 'anonymous',
  responses: [
    {
      httpCode: 201,
      description: 'Resource created successfully',
      headers: {
        'Location': {
          description: 'URL of the created resource',
          schema: z.string().url()
        },
        'X-Resource-ID': {
          description: 'ID of the created resource',
          schema: z.string().uuid()
        },
        'X-Request-ID': {
          description: 'Request tracking ID',
          schema: z.string()
        }
      },
      content: {
        'application/json': {
          schema: z.object({
            id: z.string().uuid(),
            name: z.string(),
            createdAt: z.string().datetime()
          })
        }
      }
    }
  ]
});
```

#### Response Examples

Provide example responses for documentation:

```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  inStock: z.boolean()
});

app.openapiPath('GetProduct', 'Get product details', {
  handler: async (request, context) => {
    const { id } = request.params;
    const product = await db.products.findUnique({ where: { id } });
    
    if (!product) {
      return { status: 404, jsonBody: { error: 'Product not found' } };
    }
    
    return { jsonBody: product };
  },
  methods: ['GET'],
  route: 'products/{id}',
  authLevel: 'anonymous',
  responses: [
    {
      httpCode: 200,
      description: 'Product found',
      content: {
        'application/json': {
          schema: ProductSchema,
          examples: {
            laptop: {
              summary: 'Example laptop product',
              value: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Gaming Laptop',
                price: 1299.99,
                inStock: true
              }
            },
            phone: {
              summary: 'Example phone product',
              value: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Smartphone Pro',
                price: 899.99,
                inStock: false
              }
            }
          }
        }
      }
    },
    {
      httpCode: 404,
      description: 'Product not found',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string()
          }),
          example: {
            error: 'Product not found'
          }
        }
      }
    }
  ]
});
```

#### Complete CRUD with Full Responses

Comprehensive response documentation:

```typescript
import { z } from 'zod';

const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const ErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.array(z.any()).optional()
});

// CREATE
app.openapiPath('CreateTodo', 'Create a new todo', {
  handler: async (request, context) => {
    const body = await request.json();
    const todo = await db.todos.create(body);
    
    return {
      status: 201,
      headers: { 'Location': `/api/todos/${todo.id}` },
      jsonBody: todo
    };
  },
  methods: ['POST'],
  route: 'todos',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            completed: z.boolean().default(false)
          })
        }
      }
    }
  },
  responses: [
    {
      httpCode: 201,
      description: 'Todo created successfully',
      headers: {
        'Location': {
          description: 'URL of the created todo',
          schema: z.string()
        }
      },
      content: {
        'application/json': {
          schema: TodoSchema
        }
      }
    },
    {
      httpCode: 400,
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    }
  ]
});

// READ (single)
app.openapiPath('GetTodo', 'Get a specific todo', {
  handler: async (request, context) => {
    const { id } = request.params;
    const todo = await db.todos.findUnique({ where: { id } });
    
    if (!todo) {
      return { status: 404, jsonBody: { error: 'Todo not found' } };
    }
    
    return { jsonBody: todo };
  },
  methods: ['GET'],
  route: 'todos/{id}',
  authLevel: 'anonymous',
  responses: [
    {
      httpCode: 200,
      description: 'Todo found',
      content: {
        'application/json': {
          schema: TodoSchema
        }
      }
    },
    {
      httpCode: 404,
      description: 'Todo not found',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    }
  ]
});

// READ (list)
app.openapiPath('ListTodos', 'List all todos', {
  handler: async (request, context) => {
    const todos = await db.todos.findMany();
    
    return {
      jsonBody: todos,
      headers: {
        'X-Total-Count': todos.length.toString()
      }
    };
  },
  methods: ['GET'],
  route: 'todos',
  authLevel: 'anonymous',
  responses: [
    {
      httpCode: 200,
      description: 'List of todos',
      headers: {
        'X-Total-Count': {
          description: 'Total number of todos',
          schema: z.string()
        }
      },
      content: {
        'application/json': {
          schema: z.array(TodoSchema)
        }
      }
    }
  ]
});

// UPDATE
app.openapiPath('UpdateTodo', 'Update a todo', {
  handler: async (request, context) => {
    const { id } = request.params;
    const body = await request.json();
    
    const existing = await db.todos.findUnique({ where: { id } });
    if (!existing) {
      return { status: 404, jsonBody: { error: 'Todo not found' } };
    }
    
    const updated = await db.todos.update({
      where: { id },
      data: body
    });
    
    return { jsonBody: updated };
  },
  methods: ['PATCH'],
  route: 'todos/{id}',
  authLevel: 'anonymous',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            completed: z.boolean().optional()
          })
        }
      }
    }
  },
  responses: [
    {
      httpCode: 200,
      description: 'Todo updated successfully',
      content: {
        'application/json': {
          schema: TodoSchema
        }
      }
    },
    {
      httpCode: 404,
      description: 'Todo not found',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    },
    {
      httpCode: 400,
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    }
  ]
});

// DELETE
app.openapiPath('DeleteTodo', 'Delete a todo', {
  handler: async (request, context) => {
    const { id } = request.params;
    
    const existing = await db.todos.findUnique({ where: { id } });
    if (!existing) {
      return { status: 404, jsonBody: { error: 'Todo not found' } };
    }
    
    await db.todos.delete({ where: { id } });
    
    return { status: 204 };
  },
  methods: ['DELETE'],
  route: 'todos/{id}',
  authLevel: 'anonymous',
  responses: [
    {
      httpCode: 204,
      description: 'Todo deleted successfully'
    },
    {
      httpCode: 404,
      description: 'Todo not found',
      content: {
        'application/json': {
          schema: ErrorSchema
        }
      }
    }
  ]
});
```

#### Pagination Responses

Document paginated responses:

```typescript
import { z } from 'zod';

const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean()
  }),
  links: z.object({
    self: z.string().url(),
    first: z.string().url(),
    last: z.string().url(),
    next: z.string().url().optional(),
    previous: z.string().url().optional()
  })
});

app.openapiPath('ListPaginatedUsers', 'List users with pagination', {
  handler: async (request, context) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    const totalItems = await db.users.count();
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (page - 1) * pageSize;
    
    const users = await db.users.findMany({
      skip,
      take: pageSize
    });
    
    const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
    
    return {
      jsonBody: {
        data: users,
        pagination: {
          page,
          pageSize,
          totalPages,
          totalItems,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        },
        links: {
          self: `${baseUrl}?page=${page}&pageSize=${pageSize}`,
          first: `${baseUrl}?page=1&pageSize=${pageSize}`,
          last: `${baseUrl}?page=${totalPages}&pageSize=${pageSize}`,
          ...(page < totalPages && {
            next: `${baseUrl}?page=${page + 1}&pageSize=${pageSize}`
          }),
          ...(page > 1 && {
            previous: `${baseUrl}?page=${page - 1}&pageSize=${pageSize}`
          })
        }
      }
    };
  },
  methods: ['GET'],
  route: 'users',
  authLevel: 'anonymous',
  request: {
    query: z.object({
      page: z.number().int().min(1).default(1).describe('Page number'),
      pageSize: z.number().int().min(1).max(100).default(10).describe('Items per page')
    })
  },
  responses: [
    {
      httpCode: 200,
      description: 'Paginated list of users',
      content: {
        'application/json': {
          schema: PaginatedResponseSchema
        }
      }
    }
  ]
});
```

#### File Download Responses

Document file downloads:

```typescript
import { z } from 'zod';

app.openapiPath('DownloadReport', 'Download report file', {
  handler: async (request, context) => {
    const { reportId } = request.params;
    const format = request.query.get('format') || 'pdf';
    
    const report = await generateReport(reportId, format);
    
    if (!report) {
      return { status: 404, jsonBody: { error: 'Report not found' } };
    }
    
    const contentTypes = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    
    return {
      status: 200,
      headers: {
        'Content-Type': contentTypes[format],
        'Content-Disposition': `attachment; filename="report-${reportId}.${format}"`,
        'Content-Length': report.length.toString()
      },
      body: report
    };
  },
  methods: ['GET'],
  route: 'reports/{reportId}/download',
  authLevel: 'anonymous',
  request: {
    params: z.object({
      reportId: z.string().uuid()
    }),
    query: z.object({
      format: z.enum(['pdf', 'csv', 'xlsx']).default('pdf')
    })
  },
  responses: [
    {
      httpCode: 200,
      description: 'Report file',
      headers: {
        'Content-Type': {
          description: 'MIME type of the file',
          schema: z.string()
        },
        'Content-Disposition': {
          description: 'File download attachment',
          schema: z.string()
        },
        'Content-Length': {
          description: 'Size of the file in bytes',
          schema: z.string()
        }
      },
      content: {
        'application/pdf': {
          schema: z.string().describe('PDF report file')
        },
        'text/csv': {
          schema: z.string().describe('CSV report file')
        },
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: z.string().describe('Excel report file')
        }
      }
    },
    {
      httpCode: 404,
      description: 'Report not found'
    }
  ]
});
```

#### Response Best Practices

**✅ DO:**
- Document all possible HTTP status codes
- Provide clear descriptions for each response
- Include response schemas for documentation
- Use appropriate status codes (200, 201, 204, 400, 401, 403, 404, 500)
- Add examples for common responses
- Document response headers when relevant
- Support content negotiation for multiple formats
- Include pagination metadata for lists
- Set proper Content-Type headers

**❌ DON'T:**
- Don't return 200 for everything
- Don't expose sensitive data in error messages
- Don't forget to document error responses
- Don't use inconsistent response formats
- Don't skip status codes in documentation
- Don't return HTML in JSON APIs
- Don't forget Content-Disposition for downloads
- Don't mix response formats without Accept header checking

#### Standard Response Patterns

Create reusable response helpers:

```typescript
import { z } from 'zod';

// Standard success response
function successResponse<T>(data: T, statusCode: number = 200) {
  return {
    status: statusCode,
    jsonBody: data
  };
}

// Standard error response
function errorResponse(error: string, statusCode: number = 400, details?: any) {
  return {
    status: statusCode,
    jsonBody: {
      error,
      details,
      timestamp: new Date().toISOString()
    }
  };
}

// Not found response
function notFoundResponse(resource: string, id: string) {
  return errorResponse(`${resource} not found`, 404, { id });
}

// Created response with Location header
function createdResponse<T>(data: T, location: string) {
  return {
    status: 201,
    headers: { 'Location': location },
    jsonBody: data
  };
}

// No content response
function noContentResponse() {
  return { status: 204 };
}

// Usage
app.openapiPath('GetItem', 'Get an item', {
  handler: async (request, context) => {
    const { id } = request.params;
    const item = await db.items.findUnique({ where: { id } });
    
    if (!item) {
      return notFoundResponse('Item', id);
    }
    
    return successResponse(item);
  },
  methods: ['GET'],
  route: 'items/{id}',
  authLevel: 'anonymous'
});
```

---

### Utility Functions

The library provides several utility functions to simplify common tasks like parsing and validating request data, extracting authentication information, and creating typed handlers.

#### parseBody()

Parse and validate request body with Zod schema:

```typescript
import { parseBody, ValidationError } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18)
});

app.openapiPath('CreateUser', 'Create a user', {
  handler: async (request, context) => {
    try {
      // Parse and validate body
      const user = await parseBody(request, CreateUserSchema);
      
      // user is fully typed: { name: string; email: string; age: number }
      const created = await db.users.create(user);
      
      return { status: 201, jsonBody: created };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: {
            error: 'Validation failed',
            issues: error.issues
          }
        };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'users',
  authLevel: 'anonymous'
});
```

**Signature:**
```typescript
async function parseBody<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>
): Promise<T>
```

**Throws:** `ValidationError` if validation fails

#### parseQueryParams()

Parse and validate query parameters:

```typescript
import { parseQueryParams, ValidationError } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const SearchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'date', 'price']).default('name')
});

app.openapiPath('Search', 'Search products', {
  handler: async (request, context) => {
    try {
      // Parse and validate query parameters
      const params = parseQueryParams(request, SearchSchema);
      
      // params is typed: { q: string; page: number; limit: number; sortBy: 'name' | 'date' | 'price' }
      const results = await searchProducts({
        query: params.q,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy
      });
      
      return { jsonBody: results };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: { error: 'Invalid query parameters', issues: error.issues }
        };
      }
      throw error;
    }
  },
  methods: ['GET'],
  route: 'search',
  authLevel: 'anonymous'
});
```

**Signature:**
```typescript
function parseQueryParams<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>
): T
```

**Note:** Use `z.coerce.number()` for numeric query parameters (they come as strings)

**Throws:** `ValidationError` if validation fails

#### parseRouteParams()

Parse and validate route parameters:

```typescript
import { parseRouteParams, ValidationError } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const RouteSchema = z.object({
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  action: z.enum(['approve', 'reject'])
});

app.openapiPath('PostAction', 'Perform action on post', {
  handler: async (request, context) => {
    try {
      // Parse and validate route parameters
      const params = parseRouteParams(request, RouteSchema);
      
      // params is typed: { userId: string; postId: string; action: 'approve' | 'reject' }
      const result = await performPostAction(
        params.userId,
        params.postId,
        params.action
      );
      
      return { jsonBody: result };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: { error: 'Invalid route parameters', issues: error.issues }
        };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'users/{userId}/posts/{postId}/{action}',
  authLevel: 'anonymous'
});
```

**Signature:**
```typescript
function parseRouteParams<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>
): T
```

**Throws:** `ValidationError` if validation fails

#### parseHeaders()

Parse and validate request headers:

```typescript
import { parseHeaders, ValidationError } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const HeadersSchema = z.object({
  'x-api-version': z.enum(['1.0', '2.0']),
  'x-client-id': z.string().min(1),
  'x-request-id': z.string().uuid().optional(),
  'accept-language': z.string().default('en')
});

app.openapiPath('VersionedAPI', 'Versioned API endpoint', {
  handler: async (request, context) => {
    try {
      // Parse and validate headers
      const headers = parseHeaders(request, HeadersSchema);
      
      // headers is typed: { 'x-api-version': '1.0' | '2.0'; 'x-client-id': string; ... }
      context.log(`Request from client ${headers['x-client-id']} using API v${headers['x-api-version']}`);
      
      const result = headers['x-api-version'] === '2.0'
        ? await handleV2(request)
        : await handleV1(request);
      
      return { jsonBody: result };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: { error: 'Invalid headers', issues: error.issues }
        };
      }
      throw error;
    }
  },
  methods: ['GET'],
  route: 'versioned/data',
  authLevel: 'anonymous'
});
```

**Signature:**
```typescript
function parseHeaders<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>
): T
```

**Note:** Header names are case-insensitive

**Throws:** `ValidationError` if validation fails

#### parseEasyAuthPrincipal()

Extract user identity from EasyAuth headers:

```typescript
import { parseEasyAuthPrincipal } from '@apvee/azure-functions-openapi';

app.openapiPath('GetProfile', 'Get user profile', {
  handler: async (request, context) => {
    // Parse EasyAuth principal
    const user = parseEasyAuthPrincipal(request);
    
    if (!user) {
      return {
        status: 401,
        jsonBody: { error: 'Not authenticated' }
      };
    }
    
    // user contains: { userId, username, identityProvider, claims }
    const profile = await db.users.findUnique({
      where: { id: user.userId }
    });
    
    return {
      jsonBody: {
        ...profile,
        provider: user.identityProvider,
        email: user.claims.find(c => c.typ === 'emails')?.val
      }
    };
  },
  methods: ['GET'],
  route: 'me',
  authLevel: 'anonymous'
});
```

**Signature:**
```typescript
function parseEasyAuthPrincipal(
  request: HttpRequest
): EasyAuthPrincipal | null

interface EasyAuthPrincipal {
  userId: string;
  username: string;
  identityProvider: string;
  claims: Array<{ typ: string; val: string }>;
}
```

**Returns:** `EasyAuthPrincipal` object or `null` if not authenticated

#### extractFunctionKey()

Extract Azure Function key from request:

```typescript
import { extractFunctionKey } from '@apvee/azure-functions-openapi';

app.openapiPath('TrackUsage', 'Track API usage', {
  handler: async (request, context) => {
    // Extract function key (from query or header)
    const functionKey = extractFunctionKey(request);
    
    if (functionKey) {
      // Log usage for this key
      await db.apiUsage.create({
        key: functionKey.substring(0, 8) + '...', // Partial key for logging
        endpoint: request.url,
        timestamp: new Date()
      });
      
      context.log(`Request made with key: ${functionKey.substring(0, 8)}...`);
    }
    
    const data = await getData();
    return { jsonBody: data };
  },
  methods: ['GET'],
  route: 'data',
  authLevel: 'function'
});
```

**Signature:**
```typescript
function extractFunctionKey(request: HttpRequest): string | null
```

**Looks for key in:**
1. Query parameter: `?code=xxx`
2. Header: `x-functions-key: xxx`

**Returns:** The function key string or `null` if not found

#### createTypedHandler()

Create a typed handler with automatic parameter extraction:

```typescript
import { createTypedHandler } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().uuid()
});

const QuerySchema = z.object({
  include: z.enum(['comments', 'likes', 'all']).optional()
});

const BodySchema = z.object({
  title: z.string(),
  content: z.string()
});

// Create typed handler
const updatePostHandler = createTypedHandler({
  params: ParamsSchema,
  query: QuerySchema,
  body: BodySchema
}, async (data, request, context) => {
  // data is fully typed: { params: {...}, query: {...}, body: {...} }
  const { id } = data.params;
  const { include } = data.query;
  const { title, content } = data.body;
  
  const post = await db.posts.update({
    where: { id },
    data: { title, content }
  });
  
  // Include additional data based on query
  if (include === 'comments' || include === 'all') {
    post.comments = await db.comments.findMany({ where: { postId: id } });
  }
  if (include === 'likes' || include === 'all') {
    post.likesCount = await db.likes.count({ where: { postId: id } });
  }
  
  return { jsonBody: post };
});

app.openapiPath('UpdatePost', 'Update a post', {
  handler: updatePostHandler,
  methods: ['PUT'],
  route: 'posts/{id}',
  authLevel: 'anonymous',
  request: {
    params: ParamsSchema,
    query: QuerySchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: BodySchema
        }
      }
    }
  }
});
```

**Signature:**
```typescript
function createTypedHandler<
  TParams = undefined,
  TQuery = undefined,
  TBody = undefined,
  THeaders = undefined
>(
  schemas: {
    params?: z.ZodSchema<TParams>;
    query?: z.ZodSchema<TQuery>;
    body?: z.ZodSchema<TBody>;
    headers?: z.ZodSchema<THeaders>;
  },
  handler: (
    data: {
      params?: TParams;
      query?: TQuery;
      body?: TBody;
      headers?: THeaders;
    },
    request: HttpRequest,
    context: InvocationContext
  ) => Promise<HttpResponseInit>
): (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>
```

**Benefits:**
- ✅ Single validation point
- ✅ Full TypeScript type inference
- ✅ Automatic error handling
- ✅ Cleaner handler code
- ✅ Reusable across endpoints

#### ValidationError

Custom error class for validation failures:

```typescript
import { ValidationError } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

// ValidationError is thrown by parse functions
try {
  const body = await parseBody(request, schema);
} catch (error) {
  if (error instanceof ValidationError) {
    // Access validation issues
    console.log('Validation failed:', error.issues);
    
    return {
      status: 400,
      jsonBody: {
        error: 'Validation failed',
        issues: error.issues,
        message: error.message
      }
    };
  }
  throw error;
}
```

**Class Definition:**
```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Properties:**
- `message`: Error message
- `issues`: Array of Zod validation issues

#### Complete Utility Function Example

Using all utilities together:

```typescript
import {
  parseBody,
  parseQueryParams,
  parseRouteParams,
  parseHeaders,
  parseEasyAuthPrincipal,
  extractFunctionKey,
  createTypedHandler,
  ValidationError
} from '@apvee/azure-functions-openapi';
import { z } from 'zod';

// Example 1: Manual validation
app.openapiPath('CreateOrder', 'Create an order', {
  handler: async (request, context) => {
    try {
      // Parse all request parts
      const body = await parseBody(request, OrderSchema);
      const query = parseQueryParams(request, QuerySchema);
      const headers = parseHeaders(request, HeadersSchema);
      const user = parseEasyAuthPrincipal(request);
      
      if (!user) {
        return { status: 401, jsonBody: { error: 'Unauthorized' } };
      }
      
      // Create order
      const order = await db.orders.create({
        ...body,
        userId: user.userId,
        language: headers['accept-language'],
        async: query.async
      });
      
      return { status: 201, jsonBody: order };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          status: 400,
          jsonBody: { error: 'Validation failed', issues: error.issues }
        };
      }
      throw error;
    }
  },
  methods: ['POST'],
  route: 'orders',
  authLevel: 'anonymous'
});

// Example 2: Using typed handler
const createOrderHandler = createTypedHandler(
  {
    body: OrderSchema,
    query: QuerySchema,
    headers: HeadersSchema
  },
  async (data, request, context) => {
    const user = parseEasyAuthPrincipal(request);
    
    if (!user) {
      return { status: 401, jsonBody: { error: 'Unauthorized' } };
    }
    
    const order = await db.orders.create({
      ...data.body,
      userId: user.userId,
      language: data.headers['accept-language'],
      async: data.query.async
    });
    
    return { status: 201, jsonBody: order };
  }
);

app.openapiPath('CreateOrderTyped', 'Create an order (typed)', {
  handler: createOrderHandler,
  methods: ['POST'],
  route: 'orders',
  authLevel: 'anonymous'
});
```

#### Error Handling Patterns

Reusable error handling:

```typescript
import { ValidationError } from '@apvee/azure-functions-openapi';
import { InvocationContext, HttpRequest, HttpResponseInit } from '@azure/functions';

// Global error handler
function handleError(error: unknown, context: InvocationContext): HttpResponseInit {
  if (error instanceof ValidationError) {
    context.warn('Validation error:', error.issues);
    return {
      status: 400,
      jsonBody: {
        error: 'Validation failed',
        details: error.issues
      }
    };
  }
  
  // Log unexpected errors
  context.error('Unexpected error:', error);
  
  return {
    status: 500,
    jsonBody: {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }
  };
}

// Usage
app.openapiPath('Example', 'Example endpoint', {
  handler: async (request, context) => {
    try {
      const body = await parseBody(request, schema);
      const result = await processData(body);
      return { jsonBody: result };
    } catch (error) {
      return handleError(error, context);
    }
  },
  methods: ['POST'],
  route: 'example',
  authLevel: 'anonymous'
});
```

#### Utility Best Practices

**✅ DO:**
- Use `parseBody()` for all request body validation
- Use `z.coerce.number()` for numeric query parameters
- Catch `ValidationError` explicitly
- Use `createTypedHandler()` for complex endpoints
- Log validation failures for monitoring
- Return detailed errors in development only
- Use `parseEasyAuthPrincipal()` for user authentication
- Extract function keys for usage tracking

**❌ DON'T:**
- Don't manually parse JSON without validation
- Don't ignore ValidationError
- Don't expose detailed errors in production
- Don't validate without TypeScript types
- Don't forget to handle null from parse functions
- Don't skip header validation for versioned APIs
- Don't trust query parameters without coercion

#### TypeScript Type Inference

All utilities provide full type inference:

```typescript
import { parseBody } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int()
});

app.openapiPath('CreateUser', 'Create user', {
  handler: async (request, context) => {
    const user = await parseBody(request, UserSchema);
    
    // TypeScript knows:
    // user.name is string
    // user.email is string
    // user.age is number
    
    // TypeScript will error on invalid properties:
    // user.invalidProperty // ❌ Type error
    
    return { jsonBody: user };
  },
  methods: ['POST'],
  route: 'users',
  authLevel: 'anonymous'
});
```

---

### Error Handling

Comprehensive error handling patterns for robust API development.

#### Basic Error Handling

Handle common errors:

```typescript
import { ValidationError } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

app.openapiPath('GetUser', 'Get user by ID', {
  handler: async (request, context) => {
    try {
      const { id } = request.params;
      
      const user = await db.users.findUnique({ where: { id } });
      
      if (!user) {
        return {
          status: 404,
          jsonBody: {
            error: 'Not Found',
            message: `User ${id} not found`
          }
        };
      }
      
      return { jsonBody: user };
    } catch (error) {
      context.error('Error fetching user:', error);
      
      return {
        status: 500,
        jsonBody: {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred'
        }
      };
    }
  },
  methods: ['GET'],
  route: 'users/{id}',
  authLevel: 'anonymous'
});
```

#### Validation Error Handling

Handle Zod validation errors:

```typescript
import { parseBody, ValidationError } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18)
});

app.openapiPath('CreateUser', 'Create a user', {
  handler: async (request, context) => {
    try {
      const userData = await parseBody(request, UserSchema);
      const user = await db.users.create(userData);
      
      return { status: 201, jsonBody: user };
    } catch (error) {
      if (error instanceof ValidationError) {
        context.warn('Validation failed:', error.issues);
        
        return {
          status: 400,
          jsonBody: {
            error: 'Bad Request',
            message: 'Invalid request data',
            details: error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code
            }))
          }
        };
      }
      
      context.error('Unexpected error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal Server Error' }
      };
    }
  },
  methods: ['POST'],
  route: 'users',
  authLevel: 'anonymous'
});
```

#### Custom Error Classes

Define custom error types:

```typescript
import { HttpResponseInit } from '@azure/functions';

// Custom error classes
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

class BadRequestError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'BadRequestError';
  }
}

// Error response mapper
function toErrorResponse(error: unknown, context: InvocationContext): HttpResponseInit {
  if (error instanceof NotFoundError) {
    return {
      status: 404,
      jsonBody: { error: 'Not Found', message: error.message }
    };
  }
  
  if (error instanceof UnauthorizedError) {
    return {
      status: 401,
      jsonBody: { error: 'Unauthorized', message: error.message }
    };
  }
  
  if (error instanceof ForbiddenError) {
    return {
      status: 403,
      jsonBody: { error: 'Forbidden', message: error.message }
    };
  }
  
  if (error instanceof ConflictError) {
    return {
      status: 409,
      jsonBody: { error: 'Conflict', message: error.message }
    };
  }
  
  if (error instanceof BadRequestError) {
    return {
      status: 400,
      jsonBody: {
        error: 'Bad Request',
        message: error.message,
        details: error.details
      }
    };
  }
  
  if (error instanceof ValidationError) {
    return {
      status: 400,
      jsonBody: {
        error: 'Validation Failed',
        message: error.message,
        issues: error.issues
      }
    };
  }
  
  // Unknown error
  context.error('Unexpected error:', error);
  return {
    status: 500,
    jsonBody: {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' 
        ? String(error) 
        : 'An unexpected error occurred'
    }
  };
}

// Usage
app.openapiPath('GetPost', 'Get a post', {
  handler: async (request, context) => {
    try {
      const { id } = request.params;
      const user = parseEasyAuthPrincipal(request);
      
      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      const post = await db.posts.findUnique({ where: { id } });
      
      if (!post) {
        throw new NotFoundError('Post', id);
      }
      
      if (post.ownerId !== user.userId && !post.isPublic) {
        throw new ForbiddenError('You do not have access to this post');
      }
      
      return { jsonBody: post };
    } catch (error) {
      return toErrorResponse(error, context);
    }
  },
  methods: ['GET'],
  route: 'posts/{id}',
  authLevel: 'anonymous'
});
```

#### Global Error Handler

Create a centralized error handler:

```typescript
import { InvocationContext, HttpRequest, HttpResponseInit } from '@azure/functions';
import { ValidationError } from '@apvee/azure-functions-openapi';

// Global error handler
export async function withErrorHandler(
  handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>,
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    return await handler(request, context);
  } catch (error) {
    return handleError(error, context);
  }
}

function handleError(error: unknown, context: InvocationContext): HttpResponseInit {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Validation errors
  if (error instanceof ValidationError) {
    context.warn('Validation error:', error.issues);
    return {
      status: 400,
      jsonBody: {
        error: 'Validation Failed',
        message: 'The request data is invalid',
        details: isDevelopment ? error.issues : undefined
      }
    };
  }
  
  // Custom application errors
  if (error instanceof NotFoundError) {
    return {
      status: 404,
      jsonBody: { error: 'Not Found', message: error.message }
    };
  }
  
  if (error instanceof UnauthorizedError) {
    return {
      status: 401,
      jsonBody: { error: 'Unauthorized', message: error.message }
    };
  }
  
  if (error instanceof ForbiddenError) {
    return {
      status: 403,
      jsonBody: { error: 'Forbidden', message: error.message }
    };
  }
  
  // Database errors
  if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    if (prismaError.code === 'P2002') {
      return {
        status: 409,
        jsonBody: {
          error: 'Conflict',
          message: 'A record with this value already exists'
        }
      };
    }
    
    if (prismaError.code === 'P2025') {
      return {
        status: 404,
        jsonBody: { error: 'Not Found', message: 'Record not found' }
      };
    }
  }
  
  // Network errors
  if (error?.constructor?.name === 'FetchError') {
    context.error('Network error:', error);
    return {
      status: 502,
      jsonBody: {
        error: 'Bad Gateway',
        message: 'Failed to connect to external service'
      }
    };
  }
  
  // Unknown errors
  context.error('Unhandled error:', error);
  return {
    status: 500,
    jsonBody: {
      error: 'Internal Server Error',
      message: isDevelopment ? String(error) : 'An unexpected error occurred',
      stack: isDevelopment && error instanceof Error ? error.stack : undefined
    }
  };
}

// Usage
app.openapiPath('CreateTodo', 'Create a todo', {
  handler: (request, context) => withErrorHandler(
    async (request, context) => {
      const body = await parseBody(request, TodoSchema);
      const todo = await db.todos.create(body);
      return { status: 201, jsonBody: todo };
    },
    request,
    context
  ),
  methods: ['POST'],
  route: 'todos',
  authLevel: 'anonymous'
});
```

#### Async Error Handling

Handle async operations safely:

```typescript
import { z } from 'zod';

app.openapiPath('ProcessData', 'Process data asynchronously', {
  handler: async (request, context) => {
    try {
      const body = await parseBody(request, DataSchema);
      
      // Multiple async operations
      const [user, config, data] = await Promise.all([
        db.users.findUnique({ where: { id: body.userId } }),
        fetchConfiguration(),
        fetchExternalData(body.externalId)
      ]);
      
      if (!user) {
        throw new NotFoundError('User', body.userId);
      }
      
      if (!data) {
        throw new BadRequestError('External data not found', {
          externalId: body.externalId
        });
      }
      
      // Process with timeout
      const result = await Promise.race([
        processData(user, config, data),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Processing timeout')), 30000)
        )
      ]);
      
      return { jsonBody: result };
    } catch (error) {
      if (error instanceof Error && error.message === 'Processing timeout') {
        return {
          status: 504,
          jsonBody: {
            error: 'Gateway Timeout',
            message: 'Processing took too long'
          }
        };
      }
      
      return toErrorResponse(error, context);
    }
  },
  methods: ['POST'],
  route: 'process',
  authLevel: 'anonymous'
});
```

#### Retry Logic with Error Handling

Implement retry for transient failures:

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors
      if (error instanceof BadRequestError || 
          error instanceof UnauthorizedError ||
          error instanceof ForbiddenError ||
          error instanceof NotFoundError) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with optional exponential backoff
      const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Usage
app.openapiPath('FetchExternalData', 'Fetch data from external API', {
  handler: async (request, context) => {
    try {
      const { id } = request.params;
      
      // Retry fetching from external API
      const data = await withRetry(
        () => fetchFromExternalAPI(id),
        { maxRetries: 3, delayMs: 500, backoff: true }
      );
      
      return { jsonBody: data };
    } catch (error) {
      context.error('Failed after retries:', error);
      
      return {
        status: 502,
        jsonBody: {
          error: 'Bad Gateway',
          message: 'Failed to fetch data from external service'
        }
      };
    }
  },
  methods: ['GET'],
  route: 'external/{id}',
  authLevel: 'anonymous'
});
```

#### Error Logging and Monitoring

Log errors for monitoring:

```typescript
import { InvocationContext } from '@azure/functions';

interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn';
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    functionName?: string;
    invocationId: string;
    method?: string;
    url?: string;
  };
  user?: {
    id: string;
    email: string;
  };
}

function logError(
  error: unknown,
  context: InvocationContext,
  request?: HttpRequest,
  user?: any
): void {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: error instanceof ValidationError ? 'warn' : 'error',
    message: error instanceof Error ? error.message : String(error),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined,
    context: {
      functionName: context.functionName,
      invocationId: context.invocationId,
      method: request?.method,
      url: request?.url
    },
    user: user ? {
      id: user.userId,
      email: user.username
    } : undefined
  };
  
  // Log to Application Insights (automatic in Azure Functions)
  if (errorLog.level === 'error') {
    context.error('Error occurred:', errorLog);
  } else {
    context.warn('Warning occurred:', errorLog);
  }
  
  // Optionally send to external monitoring service
  // await sendToMonitoringService(errorLog);
}

// Usage
app.openapiPath('MonitoredEndpoint', 'Endpoint with error monitoring', {
  handler: async (request, context) => {
    const user = parseEasyAuthPrincipal(request);
    
    try {
      const body = await parseBody(request, schema);
      const result = await processData(body);
      return { jsonBody: result };
    } catch (error) {
      logError(error, context, request, user);
      return toErrorResponse(error, context);
    }
  },
  methods: ['POST'],
  route: 'monitored',
  authLevel: 'anonymous'
});
```

#### Circuit Breaker Pattern

Prevent cascading failures:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime! < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try half-open
      this.state = 'half-open';
    }
    
    try {
      const result = await fn();
      
      // Success - reset
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
  
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = undefined;
  }
}

// Create circuit breaker for external service
const externalServiceBreaker = new CircuitBreaker(5, 60000);

app.openapiPath('CallExternalService', 'Call external service', {
  handler: async (request, context) => {
    try {
      const result = await externalServiceBreaker.execute(
        () => callExternalService()
      );
      
      return { jsonBody: result };
    } catch (error) {
      if (error instanceof Error && error.message === 'Circuit breaker is OPEN') {
        context.warn('Circuit breaker is open for external service');
        return {
          status: 503,
          jsonBody: {
            error: 'Service Unavailable',
            message: 'External service is temporarily unavailable'
          }
        };
      }
      
      return toErrorResponse(error, context);
    }
  },
  methods: ['GET'],
  route: 'external/call',
  authLevel: 'anonymous'
});
```

#### Error Handling Best Practices

**✅ DO:**
- Use try-catch blocks for all async operations
- Create custom error classes for different scenarios
- Log errors with context (user, request, timestamp)
- Return appropriate HTTP status codes
- Hide sensitive error details in production
- Implement retry logic for transient failures
- Use circuit breakers for external dependencies
- Validate all input before processing
- Return consistent error response format
- Monitor error rates and patterns

**❌ DON'T:**
- Don't expose stack traces in production
- Don't ignore caught errors
- Don't return generic "error" messages
- Don't retry client errors (4xx)
- Don't leak sensitive data in error messages
- Don't use errors for control flow
- Don't catch errors without handling them
- Don't forget to log errors for debugging
- Don't return HTML error pages from JSON APIs
- Don't use status 200 for errors

#### Standard Error Response Format

Consistent error responses:

```typescript
interface ErrorResponse {
  error: string;           // Error type (e.g., "Bad Request")
  message: string;         // Human-readable message
  code?: string;           // Error code (e.g., "USER_NOT_FOUND")
  details?: any;           // Additional details (dev only)
  timestamp?: string;      // ISO timestamp
  requestId?: string;      // Request tracking ID
  path?: string;           // Request path
}

function createErrorResponse(
  error: string,
  message: string,
  statusCode: number,
  options?: {
    code?: string;
    details?: any;
    context?: InvocationContext;
    request?: HttpRequest;
  }
): HttpResponseInit {
  const response: ErrorResponse = {
    error,
    message,
    code: options?.code,
    timestamp: new Date().toISOString(),
    requestId: options?.context?.invocationId,
    path: options?.request?.url
  };
  
  // Include details only in development
  if (process.env.NODE_ENV === 'development' && options?.details) {
    response.details = options.details;
  }
  
  return {
    status: statusCode,
    jsonBody: response
  };
}

// Usage
app.openapiPath('Example', 'Example with standard errors', {
  handler: async (request, context) => {
    try {
      const { id } = request.params;
      const item = await db.items.findUnique({ where: { id } });
      
      if (!item) {
        return createErrorResponse(
          'Not Found',
          `Item ${id} not found`,
          404,
          {
            code: 'ITEM_NOT_FOUND',
            context,
            request
          }
        );
      }
      
      return { jsonBody: item };
    } catch (error) {
      return createErrorResponse(
        'Internal Server Error',
        'An unexpected error occurred',
        500,
        {
          code: 'INTERNAL_ERROR',
          details: error,
          context,
          request
        }
      );
    }
  },
  methods: ['GET'],
  route: 'items/{id}',
  authLevel: 'anonymous'
});
```

---

## Migration Guide v1.x → v2.x

Version 2.0 is a major rewrite that introduces significant API changes and improvements. This guide will help you migrate your existing v1.x code to v2.x.

### Breaking Changes Overview

| Category | v1.x | v2.x | Impact |
|----------|------|------|--------|
| **API Design** | Standalone functions | Module augmentation on `app` | 🔴 High - All registration code |
| **OpenAPI Setup** | `registerOpenAPIHandler()` | `app.openapiSetup()` | 🔴 High - Configuration |
| **Endpoint Registration** | `registerFunction()` | `app.openapiPath()` | 🔴 High - All endpoints |
| **Type Inference** | Manual type casting | Automatic from schemas | 🟢 Low - Optional but recommended |
| **Swagger UI** | `registerSwaggerUIHandler()` | Built-in with `openapiSetup()` | 🟡 Medium - UI setup |
| **Security Schemes** | Manual object creation | Dedicated methods | 🟡 Medium - Security configuration |
| **Zod Version** | 3.x | 4.x | 🟢 Low - Mostly compatible |

---

### Step-by-Step Migration

#### Step 1: Update Dependencies

Update your `package.json`:

```json
{
  "dependencies": {
    "@apvee/azure-functions-openapi": "^2.0.0",
    "@azure/functions": "^4.0.0",
    "zod": "^4.0.0"
  }
}
```

Then run:
```bash
npm install
```

#### Step 2: Update Import Statement

**Before (v1.x):**
```typescript
import { 
  registerFunction, 
  registerOpenAPIHandler,
  registerSwaggerUIHandler,
  OpenAPIObjectConfig 
} from '@apvee/azure-functions-openapi';
```

**After (v2.x):**
```typescript
import '@apvee/azure-functions-openapi'; // Module augmentation
import { app } from '@azure/functions';
```

#### Step 3: Migrate OpenAPI Configuration

**Before (v1.x):**
```typescript
const openAPIConfig: OpenAPIObjectConfig = {
  info: {
    title: 'My API',
    version: '1.0.0',
    contact: {
      name: 'Apvee Solutions',
      email: 'hello@apvee.com'
    }
  },
  security: [],
  tags: [{ name: 'Users', description: 'User management' }]
};

// Register multiple OpenAPI handlers
const documents = [
  registerOpenAPIHandler('anonymous', openAPIConfig, '3.1.0', 'json'),
  registerOpenAPIHandler('anonymous', openAPIConfig, '3.0.3', 'json'),
  registerOpenAPIHandler('anonymous', openAPIConfig, '2.0', 'json')
];

// Register Swagger UI
registerSwaggerUIHandler('anonymous', 'api', documents);
```

**After (v2.x):**
```typescript
app.openapiSetup({
  info: {
    title: 'My API',
    version: '1.0.0',
    contact: {
      name: 'Apvee Solutions',
      email: 'hello@apvee.com'
    }
  },
  tags: [{ name: 'Users', description: 'User management' }],
  // Swagger UI is automatically configured!
  // All three versions (2.0, 3.0.3, 3.1.0) are automatically available
});
```

**Key Changes:**
- ✅ Single method replaces three separate functions
- ✅ Swagger UI is automatically configured
- ✅ All OpenAPI versions (2.0, 3.0.3, 3.1.0) are automatically generated
- ✅ Simpler, cleaner configuration

#### Step 4: Migrate Endpoint Registration

**Before (v1.x):**
```typescript
import { registerFunction } from '@apvee/azure-functions-openapi';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email()
});

registerFunction('GetUser', 'Get user by ID', {
  handler: async (request, context) => {
    // Manual type casting needed
    const userId = request.params.id as string;
    
    const user = await getUser(userId);
    return { jsonBody: user };
  },
  methods: ['GET'],
  route: 'users/{id}',
  authLevel: 'anonymous',
  request: {
    params: z.object({ id: z.string().uuid() })
  },
  responses: [
    {
      httpCode: 200,
      description: 'Success',
      content: {
        'application/json': { schema: UserSchema }
      }
    }
  ]
});
```

**After (v2.x) - Option 1: Standard Handler**
```typescript
app.openapiPath('GetUser', 'Get user by ID', {
  handler: async (request, context) => {
    const userId = request.params.id; // Still works
    
    const user = await getUser(userId);
    return { jsonBody: user };
  },
  methods: ['GET'],
  route: 'users/{id}',
  authLevel: 'anonymous',
  request: {
    params: z.object({ id: z.string().uuid() })
  },
  responses: [
    {
      httpCode: 200,
      description: 'Success',
      content: { 'application/json': { schema: UserSchema } }
    }
  ]
});
```

**After (v2.x) - Option 2: Typed Handler (Recommended)**
```typescript
app.openapiPath('GetUser', 'Get user by ID', {
  typedHandler: async ({ params, context }) => {
    // params.id is automatically typed as string from UUID schema!
    const user = await getUser(params.id);
    return { jsonBody: user };
  },
  methods: ['GET'],
  route: 'users/{id}',
  params: z.object({ id: z.string().uuid() }),
  response: UserSchema
});
```

**Key Changes:**
- `registerFunction()` → `app.openapiPath()`
- Optional: Use `typedHandler` for automatic type inference
- Simplified schema definitions with `params`, `query`, `body`, `response` shortcuts

#### Step 5: Migrate Security Schemes

**Before (v1.x):**
```typescript
// Manual security scheme creation
const apiKeyScheme = {
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key'
};

registerFunction('SecureEndpoint', 'Secure endpoint', {
  handler: async (request, context) => { /* ... */ },
  security: [{ apiKey: [] }],
  // ... rest of config
});
```

**After (v2.x):**
```typescript
// Dedicated security methods
const apiKey = app.openapiKeySecurity('header', 'X-API-Key');

app.openapiPath('SecureEndpoint', 'Secure endpoint', {
  handler: async (request, context) => { /* ... */ },
  security: [apiKey], // Much simpler!
  // ... rest of config
});
```

**Available Security Methods:**
- `app.openapiKeySecurity(in, name)` - Custom API keys
- `app.openapiAzureFunctionKey(name)` - Azure Function keys
- `app.openapiEasyAuth()` - Azure EasyAuth
- `app.openapiBearerSecurity(bearerFormat)` - JWT Bearer tokens
- `app.openapiOAuth2ClientCredentials(tokenUrl, scopes)` - OAuth2

#### Step 6: Migrate Complex Validation

**Before (v1.x):**
```typescript
registerFunction('CreateUser', 'Create a new user', {
  handler: async (request, context) => {
    // Manual parsing and validation
    const body = await request.json();
    const parsed = UserSchema.parse(body);
    
    const user = await createUser(parsed);
    return { jsonBody: user };
  },
  methods: ['POST'],
  route: 'users',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: UserSchema } }
    }
  }
});
```

**After (v2.x):**
```typescript
import { parseBody } from '@apvee/azure-functions-openapi';

app.openapiPath('CreateUser', 'Create a new user', {
  handler: async (request, context) => {
    // Utility function handles parsing and validation
    const user = await parseBody(request, UserSchema);
    
    const created = await createUser(user);
    return { jsonBody: created };
  },
  methods: ['POST'],
  route: 'users',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: UserSchema } }
    }
  }
});
```

**Or even simpler with Typed Handler:**
```typescript
app.openapiPath('CreateUser', 'Create a new user', {
  typedHandler: async ({ body, context }) => {
    // body is already validated and typed!
    const created = await createUser(body);
    return { jsonBody: created };
  },
  methods: ['POST'],
  route: 'users',
  body: UserSchema
});
```

---

### Migration Checklist

Use this checklist to track your migration progress:

- [ ] Update `package.json` dependencies
- [ ] Install new versions (`npm install`)
- [ ] Update imports (remove old functions, add module augmentation)
- [ ] Migrate `registerOpenAPIHandler()` → `app.openapiSetup()`
- [ ] Remove `registerSwaggerUIHandler()` (now automatic)
- [ ] Migrate all `registerFunction()` → `app.openapiPath()`
- [ ] Update security scheme definitions
- [ ] Consider migrating to `typedHandler` for better type safety
- [ ] Update validation logic to use utility functions
- [ ] Test all endpoints with Swagger UI
- [ ] Update tests if needed
- [ ] Review and update documentation

---

### Common Migration Patterns

#### Pattern 1: Simple GET Endpoint

**v1.x:**
```typescript
registerFunction('ListUsers', 'List all users', {
  handler: async (request, context) => {
    const users = await getAllUsers();
    return { jsonBody: users };
  },
  methods: ['GET'],
  route: 'users',
  authLevel: 'anonymous'
});
```

**v2.x:**
```typescript
app.openapiPath('ListUsers', 'List all users', {
  handler: async (request, context) => {
    const users = await getAllUsers();
    return { jsonBody: users };
  },
  methods: ['GET'],
  route: 'users',
  authLevel: 'anonymous'
});
```

#### Pattern 2: POST with Body Validation

**v1.x:**
```typescript
registerFunction('CreateItem', 'Create item', {
  handler: async (request, context) => {
    const body = await request.json();
    const validated = ItemSchema.parse(body);
    // ... process
  },
  methods: ['POST'],
  route: 'items',
  request: {
    body: { required: true, content: { 'application/json': { schema: ItemSchema } } }
  }
});
```

**v2.x (Option 1 - Standard):**
```typescript
import { parseBody } from '@apvee/azure-functions-openapi';

app.openapiPath('CreateItem', 'Create item', {
  handler: async (request, context) => {
    const validated = await parseBody(request, ItemSchema);
    // ... process
  },
  methods: ['POST'],
  route: 'items',
  request: {
    body: { required: true, content: { 'application/json': { schema: ItemSchema } } }
  }
});
```

**v2.x (Option 2 - Typed Handler):**
```typescript
app.openapiPath('CreateItem', 'Create item', {
  typedHandler: async ({ body, context }) => {
    // body is already validated!
    // ... process
  },
  methods: ['POST'],
  route: 'items',
  body: ItemSchema
});
```

#### Pattern 3: Authenticated Endpoint

**v1.x:**
```typescript
const bearerScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT'
};

registerFunction('GetProfile', 'Get user profile', {
  handler: async (request, context) => { /* ... */ },
  methods: ['GET'],
  route: 'profile',
  authLevel: 'anonymous',
  security: [{ bearer: [] }]
});
```

**v2.x:**
```typescript
const bearer = app.openapiBearerSecurity('JWT');

app.openapiPath('GetProfile', 'Get user profile', {
  handler: async (request, context) => { /* ... */ },
  methods: ['GET'],
  route: 'profile',
  authLevel: 'anonymous',
  security: [bearer]
});
```

---

### New Features in v2.x

Take advantage of these new capabilities:

#### 1. **Automatic Type Inference**
```typescript
app.openapiPath('Example', 'Example endpoint', {
  typedHandler: async ({ params, query, body, headers, context }) => {
    // All parameters are automatically typed from your schemas!
    // No more manual type casting or assertions
  },
  params: z.object({ id: z.string().uuid() }),
  query: z.object({ filter: z.string().optional() }),
  body: z.object({ name: z.string() })
});
```

#### 2. **Utility Functions**
```typescript
import { 
  parseBody, 
  parseQueryParams, 
  parseRouteParams,
  parseHeaders,
  parseEasyAuthPrincipal,
  extractFunctionKey,
  createTypedHandler
} from '@apvee/azure-functions-openapi';
```

#### 3. **Reusable Schemas**
```typescript
app.openapiSchema('User', UserSchema);

// Reference in multiple endpoints
app.openapiPath('GetUser', 'Get user', {
  response: { $ref: '#/components/schemas/User' }
});
```

#### 4. **Webhooks (OpenAPI 3.1.0)**
```typescript
app.openapiWebhook('UserCreated', 'Fired when user is created', {
  methods: ['POST'],
  request: {
    body: {
      content: { 'application/json': { schema: UserSchema } }
    }
  }
});
```

#### 5. **Multiple Response Status Codes**
```typescript
app.openapiPath('GetUser', 'Get user', {
  responses: [
    { httpCode: 200, description: 'Success', content: { 'application/json': { schema: UserSchema } } },
    { httpCode: 404, description: 'Not found', content: { 'application/json': { schema: ErrorSchema } } },
    { httpCode: 500, description: 'Server error' }
  ]
});
```

---

### Troubleshooting

#### Issue: TypeScript errors after migration

**Problem:** TypeScript complains about missing types or incompatible signatures.

**Solution:**
1. Ensure you've imported the module augmentation: `import '@apvee/azure-functions-openapi';`
2. Update TypeScript to version v5.5 or higher (required for Zod v4)
3. Check that `@azure/functions` is version 4.0 or higher

#### Issue: Swagger UI not loading

**Problem:** `/api/openapi/ui` returns 404 or blank page.

**Solution:**
1. Ensure `app.openapiSetup()` is called before any `app.openapiPath()` registrations
2. Check that your function app has `enableHttpStream: true` in the setup

#### Issue: Type inference not working

**Problem:** Parameters in `typedHandler` are not properly typed.

**Solution:**
1. Use the shorthand properties: `params`, `query`, `body` instead of nested `request` object
2. Ensure Zod schemas are properly defined
3. Restart your TypeScript language server

#### Issue: Zod validation errors

**Problem:** Getting errors with Zod 4.x schemas.

**Solution:**
1. Zod 4.x has breaking changes from 3.x
2. Update `.refine()` and `.transform()` usage if needed
3. Check for deprecated Zod methods

---

### Need Help?

If you encounter issues during migration:

1. **Check the examples** in this README for working code patterns
2. **Review the API documentation** for detailed method signatures
3. **Open an issue** on GitHub: [github.com/apvee/azure-functions-nodejs-monorepo/issues](https://github.com/apvee/azure-functions-nodejs-monorepo/issues)
4. **Search existing issues** for similar problems and solutions

---

## License & Links

### License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for full details.

---

### Links & Resources

#### 📦 Package

- **npm Package**: [@apvee/azure-functions-openapi](https://www.npmjs.com/package/@apvee/azure-functions-openapi)
- **Version**: 2.0.0-alpha.0
- **Install**: `npm install @apvee/azure-functions-openapi`

#### 🔗 Repository

- **GitHub Repository**: [apvee/azure-functions-nodejs-monorepo](https://github.com/apvee/azure-functions-nodejs-monorepo)
- **Issues & Bug Reports**: [GitHub Issues](https://github.com/apvee/azure-functions-nodejs-monorepo/issues)
- **Pull Requests**: [GitHub Pull Requests](https://github.com/apvee/azure-functions-nodejs-monorepo/pulls)

#### 📚 Documentation

- **OpenAPI Specification**: [swagger.io/specification](https://swagger.io/specification/)
- **Zod Documentation**: [zod.dev](https://zod.dev/)
- **Azure Functions**: [docs.microsoft.com/azure/azure-functions](https://docs.microsoft.com/en-us/azure/azure-functions/)
- **Swagger UI**: [swagger.io/tools/swagger-ui](https://swagger.io/tools/swagger-ui/)

#### 🛠️ Related Projects

- **@asteasolutions/zod-to-openapi**: [github.com/asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) - Core library for Zod to OpenAPI conversion
- **@azure/functions**: [github.com/Azure/azure-functions-nodejs-library](https://github.com/Azure/azure-functions-nodejs-library) - Azure Functions Node.js library
- **zod**: [github.com/colinhacks/zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation

#### 👥 Author & Support

- **Author**: Fabio Franzini (Apvee Solutions)
- **Company Website**: [apvee.com](https://www.apvee.com)
- **Email**: hello@apvee.com

#### 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

#### ⭐ Show Your Support

If you find this library useful, please consider:

- ⭐ **Starring the repository** on GitHub
- 🐦 **Sharing it** on social media
- 📝 **Writing about it** in your blog or documentation
- 🐛 **Reporting bugs** or suggesting features
- 💻 **Contributing code** or documentation improvements

---

### Keywords

`api`, `azure`, `azure-functions`, `openapi`, `swagger`, `types`, `zod`, `typescript`, `serverless`, `documentation`, `rest-api`, `validation`

---

**Built with ❤️ by [Apvee Solutions](https://www.apvee.com)**

