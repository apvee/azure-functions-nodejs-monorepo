import { app } from '@azure/functions';
import { z } from 'zod';
import { registerOpenAPIPath, registerOpenAPIWebhook } from './internal/endpoint';
import {
    registerApiKeySecuritySchema,
    registerAzureFunctionKeySecurity,
    registerAzureEasyAuthSecurity,
    registerAzureADBearerSecurity,
    registerAzureADClientCredentialsSecurity,
    registerTypeSchema,
} from './internal/schemas';
import { setupOpenAPI } from './internal/setup';
import {
    FunctionRouteConfig,
    OpenAPIDocumentInfo,
    OpenAPISetupConfig,
    SecurityRequirementObject,
} from './types';
import type { AuthLevel, EasyAuthProvider } from './internal/security/types';

/**
 * Module augmentation for @azure/functions.
 * Extends the app namespace with OpenAPI registration methods.
 *
 * This file must be imported to activate the type augmentation:
 * ```typescript
 * import '@apvee/azure-functions-openapi';
 * ```
 */
declare module '@azure/functions' {
    namespace app {
        /**
         * Sets up OpenAPI documentation and Swagger UI for Azure Functions.
         * Should be called once during app initialization.
         *
         * @param config - Configuration for OpenAPI setup
         * @returns Array of generated OpenAPI document information
         *
         * @example
         * ```typescript
         * import '@apvee/azure-functions-openapi';
         * import { app } from '@azure/functions';
         *
         * app.openAPISetup({
         *   info: { title: 'My API', version: '1.0.0' },
         *   routePrefix: 'api',
         *   versions: ['3.1.0'],
         *   formats: ['json', 'yaml'],
         *   swaggerUI: { enabled: true }
         * });
         * ```
         */
        export function openAPISetup(config: OpenAPISetupConfig): OpenAPIDocumentInfo[];

        /**
         * Registers an Azure Function HTTP path with OpenAPI documentation.
         *
         * The function will be registered with both the Azure Functions runtime and the OpenAPI registry.
         * Paths are documented in the 'paths' section of the OpenAPI specification.
         * If azureFunctionRoutePrefix is not provided, it will use the global route prefix set by app.openAPISetup().
         *
         * **Type Inference**: When using `typedHandler`, TypeScript automatically infers parameter types
         * from the provided schemas. No type assertions needed!
         *
         * @template TParams - Route parameters schema type (auto-inferred from options.params)
         * @template TQuery - Query parameters schema type (auto-inferred from options.query)
         * @template TBody - Request body schema type (auto-inferred from options.body)
         * @template THeaders - Request headers schema type (auto-inferred from options.headers)
         *
         * @param name - The name of the function
         * @param summary - A brief summary for OpenAPI documentation
         * @param options - Configuration options including handler, methods, auth level, route, request/response schemas, etc.
         *
         * @example Simple GET path with traditional handler
         * ```typescript
         * app.openAPIPath('GetUser', 'Get user by ID', {
         *   handler: getUserHandler,
         *   methods: ['GET'],
         *   route: 'users/{id}',
         *   params: z.object({ id: z.string().uuid() }),
         *   response: UserSchema
         * });
         * ```
         *
         * @example Typed handler with automatic type inference
         * ```typescript
         * app.openAPIPath('UpdateTodo', 'Update todo', {
         *   typedHandler: async ({ params, body, context }) => {
         *     // params.id is automatically typed as string!
         *     // body.title is automatically typed as string!
         *     // body.completed is automatically typed as boolean!
         *     return { jsonBody: { id: params.id, ...body } };
         *   },
         *   methods: ['PUT'],
         *   route: 'todos/{id}',
         *   params: z.object({ id: z.string().uuid() }),
         *   body: z.object({ title: z.string(), completed: z.boolean() }),
         *   responses: [
         *     { httpCode: 200, schema: TodoSchema },
         *     { httpCode: 400, schema: ErrorSchema }
         *   ]
         * });
         * ```
         *
         * @example POST with multiple responses
         * ```typescript
         * app.openAPIPath('CreateUser', 'Create new user', {
         *   handler: createUserHandler,
         *   methods: ['POST'],
         *   route: 'users',
         *   body: CreateUserSchema,
         *   responses: [
         *     { httpCode: 201, schema: UserSchema, description: 'User created' },
         *     { httpCode: 400, schema: ErrorSchema }
         *   ],
         *   tags: ['Users']
         * });
         * ```
         *
         * @example Advanced: Multiple content types
         * ```typescript
         * app.openAPIPath('GetReport', 'Get report in multiple formats', {
         *   handler: getReportHandler,
         *   methods: ['GET'],
         *   route: 'reports/{id}',
         *   params: z.object({ id: z.string() }),
         *   responses: [
         *     {
         *       httpCode: 200,
         *       content: [
         *         { mediaType: 'application/json', schema: JsonReportSchema },
         *         { mediaType: 'application/pdf', schema: PdfReportSchema }
         *       ]
         *     }
         *   ]
         * });
         * ```
         */
        export function openAPIPath<
            TParams extends z.ZodTypeAny | undefined = undefined,
            TQuery extends z.ZodTypeAny | undefined = undefined,
            TBody extends z.ZodTypeAny | undefined = undefined,
            THeaders extends z.ZodObject<z.ZodRawShape> | undefined = undefined,
        >(
            name: string,
            summary: string,
            options: FunctionRouteConfig<TParams, TQuery, TBody, THeaders>
        ): void;

        /**
         * Registers an Azure Function as a webhook with OpenAPI documentation.
         *
         * Webhooks are documented in the 'webhooks' section of the OpenAPI specification.
         * They represent outgoing HTTP requests that your service makes to external URLs.
         * If azureFunctionRoutePrefix is not provided, it will use the global route prefix set by app.openAPISetup().
         *
         * **Type Inference**: When using `typedHandler`, TypeScript automatically infers parameter types
         * from the provided schemas. No type assertions needed!
         *
         * @template TParams - Route parameters schema type (auto-inferred from options.params)
         * @template TQuery - Query parameters schema type (auto-inferred from options.query)
         * @template TBody - Request body schema type (auto-inferred from options.body)
         * @template THeaders - Request headers schema type (auto-inferred from options.headers)
         *
         * @param name - The name of the webhook function
         * @param summary - A brief summary for OpenAPI documentation
         * @param options - Configuration options including handler, methods, auth level, route, request/response schemas, etc.
         *
         * @example Simple webhook
         * ```typescript
         * app.openAPIWebhook('UserUpdated', 'Notify when user is updated', {
         *   handler: userUpdatedHandler,
         *   methods: ['POST'],
         *   body: UserEventSchema,
         *   responses: [
         *     { httpCode: 200, schema: AckSchema }
         *   ]
         * });
         * ```
         *
         * @example Typed webhook with automatic type inference
         * ```typescript
         * app.openAPIWebhook('OrderCreated', 'Notify when order is created', {
         *   typedHandler: async ({ body, context }) => {
         *     // body is automatically typed from OrderEventSchema!
         *     context.log(`Order ${body.orderId} created`);
         *     return { jsonBody: { received: true } };
         *   },
         *   methods: ['POST'],
         *   body: OrderEventSchema,
         *   responses: [
         *     { httpCode: 200, description: 'Success' },
         *     { httpCode: 400, schema: ErrorSchema }
         *   ],
         *   tags: ['Orders']
         * });
         * ```
         */
        export function openAPIWebhook<
            TParams extends z.ZodTypeAny | undefined = undefined,
            TQuery extends z.ZodTypeAny | undefined = undefined,
            TBody extends z.ZodTypeAny | undefined = undefined,
            THeaders extends z.ZodObject<z.ZodRawShape> | undefined = undefined,
        >(
            name: string,
            summary: string,
            options: FunctionRouteConfig<TParams, TQuery, TBody, THeaders>
        ): void; /**
         * Registers a Zod schema as a named type in the OpenAPI registry.
         *
         * This allows the schema to be referenced by name in OpenAPI documentation,
         * promoting reusability and keeping the generated spec cleaner.
         *
         * @param typeName - The name to register the schema under (e.g., 'User', 'Product')
         * @param schema - The Zod schema to register
         *
         * @example
         * ```typescript
         * import '@apvee/azure-functions-openapi';
         * import { app } from '@azure/functions';
         * import { z } from 'zod';
         *
         * const UserSchema = z.object({
         *   id: z.string().uuid(),
         *   name: z.string(),
         *   email: z.string().email()
         * });
         *
         * app.openAPISchema('User', UserSchema);
         * ```
         */
        export function openAPISchema(typeName: string, schema: z.ZodTypeAny): void;

        /**
         * Registers an API key security schema in the OpenAPI registry.
         * This is for CUSTOM API keys with user-implemented validation logic.
         * For native Azure Function Keys, use openAPIAzureFunctionKey() instead.
         *
         * This creates a security scheme that requires an API key to be provided in the specified location
         * (header, query parameter, or cookie). The security requirement can then be applied to endpoints.
         *
         * @param name - The name of the API key parameter (e.g., 'X-API-KEY', 'apiKey')
         * @param input - The location where the API key should be provided
         * @param description - Optional description for the security scheme
         * @returns A security requirement object to use in endpoint configurations
         *
         * @example Header-based API key
         * ```typescript
         * import '@apvee/azure-functions-openapi';
         * import { app } from '@azure/functions';
         *
         * // Register custom API key in header
         * const apiKeySecurity = app.openAPIKeySecurity('X-API-Key', 'header', 'Custom API key for authentication');
         *
         * // Use in path configuration
         * app.openAPIPath('GetData', 'Get data', {
         *   handler: getDataHandler,
         *   methods: ['GET'],
         *   route: 'data',
         *   security: [apiKeySecurity],
         * });
         * ```
         *
         * @example Query parameter API key
         * ```typescript
         * const apiKeySecurity = app.openAPIKeySecurity('api_key', 'query');
         * ```
         */
        export function openAPIKeySecurity(
            name: string,
            input: 'header' | 'query' | 'cookie',
            description?: string
        ): SecurityRequirementObject;

        /**
         * Alias for openAPIKeySecurity for better clarity.
         * Explicitly indicates this is for custom (user-implemented) API keys,
         * not Azure native Function Keys.
         *
         * @see openAPIKeySecurity
         *
         * @example
         * ```typescript
         * const apiKeySecurity = app.openAPICustomApiKey('X-Custom-Key', 'header');
         * ```
         */
        export function openAPICustomApiKey(
            name: string,
            input: 'header' | 'query' | 'cookie',
            description?: string
        ): SecurityRequirementObject;

        /**
         * Registers Azure Function Keys security schema in the OpenAPI registry.
         * This is for native Azure Functions key-based authentication.
         *
         * Azure Functions supports three authorization levels:
         * - anonymous: No key required
         * - function: Function-specific keys or host-level keys
         * - admin: Only master/admin keys (highest security)
         *
         * Function keys can be provided via:
         * - Query parameter: ?code=xxx (most common)
         * - Header: x-functions-key: xxx
         *
         * @param config - Configuration object OR authLevel string for simple setup
         * @returns Security requirement object
         *
         * @example Simple usage with authLevel
         * ```typescript
         * const functionKeySecurity = app.openAPIAzureFunctionKey('function');
         *
         * app.openAPIPath('GetData', 'Get data', {
         *   handler: getDataHandler,
         *   methods: ['GET'],
         *   route: 'data',
         *   security: [functionKeySecurity],
         * });
         * ```
         *
         * @example Advanced configuration
         * ```typescript
         * const adminKeySecurity = app.openAPIAzureFunctionKey({
         *   name: 'AdminKey',
         *   authLevel: 'admin',
         *   description: 'Admin/master key required for this operation',
         *   allowQueryParameter: true,
         *   allowHeader: true
         * });
         * ```
         */
        export function openAPIAzureFunctionKey(
            config:
                | {
                      name: string;
                      authLevel: 'anonymous' | 'function' | 'admin';
                      description?: string;
                      allowQueryParameter?: boolean;
                      allowHeader?: boolean;
                  }
                | 'anonymous'
                | 'function'
                | 'admin'
        ): SecurityRequirementObject;

        /**
         * Registers Azure EasyAuth security schema in the OpenAPI registry.
         * Azure EasyAuth provides built-in authentication with multiple identity providers.
         *
         * Supported providers:
         * - aad: Microsoft Entra ID (Azure Active Directory)
         * - google: Google
         * - facebook: Facebook
         * - twitter: Twitter
         * - apple: Apple
         * - github: GitHub
         * - oidc: Custom OpenID Connect provider
         *
         * **IMPORTANT**: EasyAuth requires authLevel: 'anonymous' on the Function.
         * Authentication is handled by Azure App Service BEFORE the function executes.
         *
         * User identity is available in X-MS-CLIENT-PRINCIPAL header (base64-encoded JSON).
         * Use parseEasyAuthPrincipal() from utils to decode it.
         *
         * @param config - Configuration object OR provider string for simple setup
         * @returns Security requirement object
         *
         * @example Simple usage with single provider
         * ```typescript
         * const aadSecurity = app.openAPIEasyAuth('aad');
         *
         * app.openAPIPath('GetProfile', 'Get user profile', {
         *   handler: getProfileHandler,
         *   methods: ['GET'],
         *   route: 'profile',
         *   authLevel: 'anonymous', // Required for EasyAuth!
         *   security: [aadSecurity],
         * });
         * ```
         *
         * @example Multiple providers
         * ```typescript
         * const socialAuth = app.openAPIEasyAuth({
         *   name: 'SocialAuth',
         *   providers: ['aad', 'google', 'github'],
         *   description: 'Sign in with Microsoft, Google, or GitHub'
         * });
         * ```
         */
        export function openAPIEasyAuth(
            config:
                | {
                      name: string;
                      providers: EasyAuthProvider | EasyAuthProvider[];
                      description?: string;
                      requirePrincipalHeader?: boolean;
                  }
                | EasyAuthProvider
        ): SecurityRequirementObject;

        /**
         * Registers Azure AD Bearer Token security schema in the OpenAPI registry.
         * For manual JWT validation from Microsoft Entra ID.
         *
         * Use this when:
         * - You want manual control over JWT validation
         * - You're NOT using Azure EasyAuth
         * - You need to validate Azure AD tokens directly in your function
         *
         * The Bearer token should be provided in Authorization header:
         * Authorization: Bearer {token}
         *
         * @param config - Configuration object OR simple name string
         * @returns Security requirement object
         *
         * @example Simple usage
         * ```typescript
         * const bearerSecurity = app.openAPIAzureADBearer('AzureAD');
         *
         * app.openAPIPath('GetData', 'Get data', {
         *   handler: getDataHandler,
         *   methods: ['GET'],
         *   route: 'data',
         *   security: [bearerSecurity],
         * });
         * ```
         *
         * @example Advanced with tenant and scopes
         * ```typescript
         * const bearerSecurity = app.openAPIAzureADBearer({
         *   name: 'AzureADBearer',
         *   tenantId: '11111111-1111-1111-1111-111111111111',
         *   audience: 'api://my-function-app',
         *   scopes: ['User.Read', 'Mail.Send'],
         *   description: 'Azure AD Bearer token with required scopes'
         * });
         * ```
         */
        export function openAPIAzureADBearer(
            config:
                | {
                      name: string;
                      tenantId?: string;
                      audience?: string;
                      issuer?: string;
                      scopes?: string[];
                      description?: string;
                  }
                | string
        ): SecurityRequirementObject;

        /**
         * Registers Azure AD Client Credentials security schema in the OpenAPI registry.
         * For service-to-service (daemon) authentication.
         *
         * Use this when:
         * - NO user context exists (background jobs, automated services)
         * - Calling application authenticates with its own credentials
         * - Permissions are granted via App Roles, not Scopes
         *
         * @param config - Configuration object OR simple name string
         * @returns Security requirement object
         *
         * @example Simple usage
         * ```typescript
         * const clientCredsSecurity = app.openAPIAzureADClientCredentials('ServiceAuth');
         *
         * app.openAPIPath('ProcessData', 'Process data (service-to-service)', {
         *   handler: processDataHandler,
         *   methods: ['POST'],
         *   route: 'process',
         *   security: [clientCredsSecurity],
         * });
         * ```
         *
         * @example Advanced with roles
         * ```typescript
         * const clientCredsSecurity = app.openAPIAzureADClientCredentials({
         *   name: 'ServiceAuth',
         *   tenantId: '11111111-1111-1111-1111-111111111111',
         *   audience: 'api://my-service',
         *   roles: ['Service.Read', 'Service.Write'],
         *   description: 'Service authentication with read/write permissions'
         * });
         * ```
         */
        export function openAPIAzureADClientCredentials(
            config:
                | {
                      name: string;
                      tenantId?: string;
                      audience?: string;
                      roles?: string[];
                      description?: string;
                  }
                | string
        ): SecurityRequirementObject;
    }
}

/**
 * Auto-extension of Azure Functions app with OpenAPI support.
 * This side-effect extends the app object with the OpenAPI methods when the package is imported.
 *
 * The library augments the `@azure/functions` `app` namespace at runtime. Because the
 * `app` object is typed as a fixed namespace by upstream, we narrow it to a string-indexed
 * record to attach the new methods. The companion `declare module` block above provides
 * the user-facing typings.
 */
const appAug = app as unknown as Record<string, unknown>;

if (!appAug.openAPISetup) {
    appAug.openAPISetup = setupOpenAPI;
}

if (!appAug.openAPIPath) {
    appAug.openAPIPath = registerOpenAPIPath;
}

if (!appAug.openAPIWebhook) {
    appAug.openAPIWebhook = registerOpenAPIWebhook;
}

if (!appAug.openAPISchema) {
    appAug.openAPISchema = registerTypeSchema;
}

if (!appAug.openAPIKeySecurity) {
    appAug.openAPIKeySecurity = registerApiKeySecuritySchema;
}

// Alias for custom API key (backward compatibility + clarity)
if (!appAug.openAPICustomApiKey) {
    appAug.openAPICustomApiKey = registerApiKeySecuritySchema;
}

// Azure Function Keys
if (!appAug.openAPIAzureFunctionKey) {
    appAug.openAPIAzureFunctionKey = (config: unknown) => {
        // Support simple string authLevel OR full config object
        if (typeof config === 'string') {
            return registerAzureFunctionKeySecurity({
                name: 'AzureFunctionKey',
                authLevel: config as AuthLevel,
            });
        }
        return registerAzureFunctionKeySecurity(
            config as Parameters<typeof registerAzureFunctionKeySecurity>[0]
        );
    };
}

// Azure EasyAuth
if (!appAug.openAPIEasyAuth) {
    appAug.openAPIEasyAuth = (config: unknown) => {
        // Support simple string provider OR full config object
        if (typeof config === 'string') {
            return registerAzureEasyAuthSecurity({
                name: 'AzureEasyAuth',
                providers: config as EasyAuthProvider,
            });
        }
        return registerAzureEasyAuthSecurity(
            config as Parameters<typeof registerAzureEasyAuthSecurity>[0]
        );
    };
}

// Azure AD Bearer Token
if (!appAug.openAPIAzureADBearer) {
    appAug.openAPIAzureADBearer = (config: unknown) => {
        // Support simple string name OR full config object
        if (typeof config === 'string') {
            return registerAzureADBearerSecurity({
                name: config,
            });
        }
        return registerAzureADBearerSecurity(
            config as Parameters<typeof registerAzureADBearerSecurity>[0]
        );
    };
}

// Azure AD Client Credentials
if (!appAug.openAPIAzureADClientCredentials) {
    appAug.openAPIAzureADClientCredentials = (config: unknown) => {
        // Support simple string name OR full config object
        if (typeof config === 'string') {
            return registerAzureADClientCredentialsSecurity({
                name: config,
            });
        }
        return registerAzureADClientCredentialsSecurity(
            config as Parameters<typeof registerAzureADClientCredentialsSecurity>[0]
        );
    };
}

/**
 * Export all public APIs.
 * Only types and utils are exported - internal implementation is not exposed.
 * Use app.openAPISetup(), app.openAPIPath(), app.openAPIWebhook(),
 * app.openAPISchema(), and app.openAPIKeySecurity() for functionality.
 */
export * from './types';
export * from './utils';

// Export Azure authentication types for user type annotations
export type { AuthLevel, EasyAuthProvider } from './internal/security/types';
