import { HttpHandler, HttpMethod, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { RequestSchemas, TypedHandler, SafeHttpRequest } from "./utils";
import {
    ExternalDocumentationObject as OpenAPI3ExternalDocumentationObject,
    InfoObject as OpenAPI3InfoObject,
    OpenAPIObject as OpenAPI3OpenAPIObject,
    SecurityRequirementObject as OpenAPI3SecurityRequirementObject,
    ServerObject as OpenAPI3ServerObject,
    TagObject as OpenAPI3TagObject,
    CallbacksObject as OpenAPI3CallbacksObject,
} from 'openapi3-ts/oas30';
import {
    ExternalDocumentationObject as OpenAPI31ExternalDocumentationObject,
    InfoObject as OpenAPI31InfoObject,
    OpenAPIObject as OpenAPI31OpenAPIObject,
    SecurityRequirementObject as OpenAPI31SecurityRequirementObject,
    ServerObject as OpenAPI31ServerObject,
    TagObject as OpenAPI31TagObject,
    ExampleObject as OpenAPI31ExampleObject,
    CallbacksObject as OpenAPI31CallbacksObject,
} from 'openapi3-ts/oas31';

export type OpenAPIObject = OpenAPI3OpenAPIObject | OpenAPI31OpenAPIObject;
export type InfoObject = OpenAPI3InfoObject | OpenAPI31InfoObject;
export type ServerObject = OpenAPI3ServerObject | OpenAPI31ServerObject;
export type TagObject = OpenAPI3TagObject | OpenAPI31TagObject;
export type SecurityRequirementObject = OpenAPI3SecurityRequirementObject | OpenAPI31SecurityRequirementObject;
export type ExternalDocumentationObject = OpenAPI3ExternalDocumentationObject | OpenAPI31ExternalDocumentationObject;
export type ExampleObject = OpenAPI31ExampleObject;
export type CallbacksObject = OpenAPI3CallbacksObject | OpenAPI31CallbacksObject;

/**
 * Re-exports the `extendZodWithOpenApi` function from the `@asteasolutions/zod-to-openapi` package.
 * 
 * This function extends Zod schemas with OpenAPI metadata, allowing for the generation of OpenAPI documentation
 * from Zod validation schemas.
 * 
 * @module azure-functions-openapi/core/types
 */
export { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

/**
 * Re-export typed handler types from utils for convenience.
 * These are the main types users will interact with when using typed handlers.
 */
export type { SafeHttpRequest, TypedHandler, TypedHandlerArgs, RequestSchemas } from './utils';

// ============================================================================
// Azure Authentication Types (Public API)
// ============================================================================

/**
 * Azure EasyAuth principal information.
 * Parsed from the `X-MS-CLIENT-PRINCIPAL` header when Azure App Service Authentication is enabled.
 * 
 * @see https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities
 * 
 * @example Parsing EasyAuth principal
 * ```typescript
 * import { parseEasyAuthPrincipal } from '@apvee/azure-functions-openapi';
 * 
 * const headerValue = request.headers.get('X-MS-CLIENT-PRINCIPAL');
 * if (headerValue) {
 *   const principal = parseEasyAuthPrincipal(headerValue);
 *   console.log(`User: ${principal.userId}, Provider: ${principal.auth_typ}`);
 * }
 * ```
 */
export interface AzureEasyAuthPrincipal {
    /**
     * Authentication provider type.
     * Identifies which identity provider authenticated the user.
     * 
     * Possible values:
     * - 'aad' - Microsoft Entra ID (Azure Active Directory)
     * - 'google' - Google
     * - 'facebook' - Facebook
     * - 'twitter' - Twitter
     * - 'apple' - Apple
     * - 'github' - GitHub
     * - Custom OIDC provider name
     */
    auth_typ: string;
    
    /**
     * User claims from the identity provider.
     * Structure varies by provider but typically includes:
     * - name: User's display name
     * - email: User's email address
     * - sub: Subject (unique user identifier)
     * - Additional provider-specific claims
     * 
     * @example AAD claims
     * ```typescript
     * {
     *   name: "John Doe",
     *   email: "john@example.com",
     *   oid: "00000000-0000-0000-0000-000000000000",
     *   tid: "11111111-1111-1111-1111-111111111111",
     *   roles: ["Admin", "User"]
     * }
     * ```
     */
    claims: Array<{ typ: string; val: string }>;
    
    /**
     * Unique user identifier within the application.
     * Format depends on the provider:
     * - AAD: Object ID (OID)
     * - Google: Google user ID
     * - Facebook: Facebook user ID
     * - Twitter: Twitter user ID
     * - Apple: Apple user ID
     * - GitHub: GitHub user ID
     */
    userId: string;
    
    /**
     * Name identifier from the identity provider.
     * Often same as userId but may differ based on provider configuration.
     */
    name_typ?: string;
    
    /**
     * Role claim type used in the token.
     * Defines which claim contains user roles.
     */
    role_typ?: string;
}

/**
 * Azure AD JWT token claims (standard + Azure-specific).
 * Used when manually validating Bearer tokens from Microsoft Entra ID.
 * 
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens
 * 
 * @example Extracting JWT claims
 * ```typescript
 * import { HttpRequest } from '@azure/functions';
 * 
 * // Extract Bearer token
 * const authHeader = request.headers.get('Authorization');
 * const token = authHeader?.replace('Bearer ', '');
 * 
 * // Decode and validate (user must implement validation logic)
 * const decoded = jwt.verify(token, publicKey) as AzureAdJwtClaims;
 * console.log(`User: ${decoded.sub}, Roles: ${decoded.roles}`);
 * ```
 */
export interface AzureAdJwtClaims {
    /**
     * Audience - identifies the intended recipient of the token.
     * Should match your application's client ID or API identifier.
     * 
     * @example "api://12345678-1234-1234-1234-123456789012"
     */
    aud: string;
    
    /**
     * Issuer - identifies the Security Token Service (STS) that constructed and returned the token.
     * Also identifies the Azure AD tenant.
     * 
     * @example "https://login.microsoftonline.com/{tenant-id}/v2.0"
     */
    iss: string;
    
    /**
     * Issued At - time when authentication occurred (Unix timestamp).
     */
    iat: number;
    
    /**
     * Not Before - time before which the token must not be accepted (Unix timestamp).
     */
    nbf: number;
    
    /**
     * Expiration Time - time after which the token expires (Unix timestamp).
     */
    exp: number;
    
    /**
     * Subject - principal about which the token asserts information (user).
     * Unique identifier within the Azure AD tenant.
     * 
     * @example "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ"
     */
    sub: string;
    
    /**
     * Object ID - immutable identifier for the user in Azure AD.
     * Use this for authorization decisions.
     * 
     * @example "00000000-0000-0000-0000-000000000000"
     */
    oid?: string;
    
    /**
     * Tenant ID - identifies the Azure AD tenant.
     * 
     * @example "11111111-1111-1111-1111-111111111111"
     */
    tid?: string;
    
    /**
     * Name - human-readable value that identifies the subject.
     * 
     * @example "John Doe"
     */
    name?: string;
    
    /**
     * Preferred Username - primary username of the user.
     * 
     * @example "john.doe@example.com"
     */
    preferred_username?: string;
    
    /**
     * Email - email address of the user (if available).
     */
    email?: string;
    
    /**
     * Application Roles assigned to the user.
     * Defined in Azure AD app manifest.
     * 
     * @example ["Admin", "Reader", "Contributor"]
     */
    roles?: string[];
    
    /**
     * Security groups the user is a member of (if group claims are enabled).
     * 
     * @example ["12345678-1234-1234-1234-123456789012"]
     */
    groups?: string[];
    
    /**
     * Application ID of the client using the token (for app-only tokens).
     * 
     * @example "12345678-1234-1234-1234-123456789012"
     */
    appid?: string;
    
    /**
     * Authentication Method References - methods used to authenticate.
     * 
     * @example ["pwd", "mfa"]
     */
    amr?: string[];
    
    /**
     * Scope - permissions granted to the application.
     * Space-separated list of scopes.
     * 
     * @example "User.Read Mail.Send"
     */
    scp?: string;
    
    /**
     * Additional custom claims.
     * Can include any other properties depending on token configuration.
     */
    [key: string]: any;
}

/**
 * OpenAPI object configuration without generated properties.
 * Excludes 'paths', 'components', 'webhooks', and 'openapi' which are auto-generated.
 */
export type OpenAPIObjectConfig = Omit<OpenAPIObject, 'paths' | 'components' | 'webhooks' | 'openapi'>;

/**
 * Configuration for setting up OpenAPI documentation and Swagger UI.
 * Used by app.openapiSetup() to initialize OpenAPI support for Azure Functions.
 */
export type OpenAPISetupConfig = {
    /** OpenAPI info object (title, version, description, etc.) - Required */
    info: InfoObject;
    
    /** Global security requirements for all endpoints */
    security?: SecurityRequirementObject[];
    
    /** External documentation reference */
    externalDocs?: ExternalDocumentationObject;
    
    /** Tags for organizing endpoints */
    tags?: TagObject[];
    
    /** Server configurations */
    servers?: ServerObject[];
    
    /** Azure Functions authorization level for OpenAPI endpoints */
    authLevel?: 'anonymous' | 'function' | 'admin';
    
    /** Route prefix for all Azure Functions (default: 'api') */
    routePrefix?: string;
    
    /** OpenAPI versions to generate (default: ['3.1.0']) */
    versions?: Array<'2.0' | '3.0.3' | '3.1.0'>;
    
    /** Output formats to generate (default: ['json', 'yaml']) */
    formats?: Array<'json' | 'yaml'>;
    
    /** Swagger UI configuration */
    swaggerUI?: {
        /** Enable Swagger UI (default: true) */
        enabled?: boolean;
        /** Custom route for Swagger UI (default: 'swagger-ui'). Assets will be served at {route}/assets/{file} */
        route?: string;
        /** Authorization level for Swagger UI (default: same as authLevel) */
        authLevel?: 'anonymous' | 'function' | 'admin';
    };
};

/**
 * Configuration for a specific content type (media type) in a response.
 * Used when a single HTTP status code can return multiple content types.
 * 
 * @example Simple JSON response
 * ```typescript
 * { mediaType: 'application/json', schema: UserSchema }
 * ```
 * 
 * @example Binary content (no schema)
 * ```typescript
 * { mediaType: 'application/pdf' }
 * { mediaType: 'image/png' }
 * ```
 * 
 * @example With examples
 * ```typescript
 * {
 *   mediaType: 'application/json',
 *   schema: TodoSchema,
 *   examples: {
 *     simple: { value: { id: '1', title: 'Test' }, summary: 'Simple example' }
 *   }
 * }
 * ```
 */
export type ContentTypeConfig = {
    /**
     * Media type (MIME type) for this response content.
     * Must be a valid MIME type string.
     * 
     * @example 'application/json'
     * @example 'application/xml'
     * @example 'text/plain'
     * @example 'text/csv'
     * @example 'application/pdf'
     * @example 'image/png'
     * @example 'application/octet-stream'
     * 
     * @see https://www.iana.org/assignments/media-types/media-types.xhtml
     */
    mediaType: string;
    
    /**
     * Response schema for this media type (optional).
     * Required for structured data (JSON, XML), optional for binary content (PDF, images).
     * 
     * @example TodoSchema
     * @example z.object({ id: z.string(), name: z.string() })
     * @example z.string() // for text/plain or text/csv
     */
    schema?: z.ZodTypeAny;
    
    /**
     * OpenAPI examples for this media type (optional).
     * Useful for documentation and testing.
     * 
     * @example
     * ```typescript
     * {
     *   successCase: { 
     *     value: { id: '1', name: 'John' }, 
     *     summary: 'Successful response' 
     *   },
     *   errorCase: { 
     *     value: { error: 'Not found' }, 
     *     summary: 'Error response' 
     *   }
     * }
     * ```
     */
    examples?: Record<string, { 
        value: any; 
        summary?: string; 
        description?: string;
    }>;
    
    /**
     * Encoding information for multipart/form-data requests.
     * Only used when mediaType is 'multipart/form-data' or 'multipart/mixed'.
     * Specifies how each part of the multipart request should be encoded.
     * 
     * @example File upload with custom headers
     * ```typescript
     * {
     *   mediaType: 'multipart/form-data',
     *   schema: z.object({
     *     file: z.instanceof(File),
     *     metadata: z.string()
     *   }),
     *   encoding: {
     *     file: {
     *       contentType: 'image/png, image/jpeg',
     *       headers: { 'X-File-Size': { schema: { type: 'integer' } } }
     *     },
     *     metadata: {
     *       contentType: 'application/json'
     *     }
     *   }
     * }
     * ```
     * 
     * @see https://swagger.io/docs/specification/describing-request-body/multipart-requests/
     */
    encoding?: Record<string, {
        /** Content type for this part (overrides default) */
        contentType?: string;
        /** Custom headers for this part */
        headers?: Record<string, any>;
        /** Serialization style (form, spaceDelimited, pipeDelimited, deepObject) */
        style?: string;
        /** Whether to explode array/object parameters */
        explode?: boolean;
        /** Whether to allow reserved characters in parameter values */
        allowReserved?: boolean;
    }>;
};

/**
 * Configuration for a single HTTP response.
 * Supports both simple shortcut syntax and advanced multi-content-type configuration.
 */
export type ResponseConfig = {
    /**
     * HTTP status code.
     * 
     * @example 200
     * @example 201
     * @example 400
     * @example 404
     * @example 500
     */
    httpCode: number;
    
    /**
     * Response description (optional).
     * If not provided, will be auto-generated from the HTTP status code.
     * 
     * @example 'Todo created successfully'
     * @example 'User not found'
     * @example 'Invalid request parameters'
     */
    description?: string;
    
    /**
     * Response headers schema (optional).
     * Define custom headers that will be included in the response.
     * Use Zod object schema to specify header names and their types.
     * Header names are case-insensitive per HTTP spec.
     * 
     * @example Rate limiting headers
     * ```typescript
     * z.object({
     *   'X-Rate-Limit-Remaining': z.string(),
     *   'X-Rate-Limit-Reset': z.string()
     * })
     * ```
     * 
     * @example Pagination headers
     * ```typescript
     * z.object({
     *   'X-Total-Count': z.string(),
     *   'X-Page-Number': z.string(),
     *   'X-Page-Size': z.string()
     * })
     * ```
     * 
     * @example Authentication headers
     * ```typescript
     * z.object({
     *   'X-Auth-Token': z.string(),
     *   'X-Refresh-Token': z.string().optional()
     * })
     * ```
     */
    headers?: z.ZodObject<any>;
    
    // === SHORTCUT: Single content type (use this for 95% of cases) ===
    
    /**
     * Response body schema (shortcut for single content type).
     * Assumes JSON if mediaType not specified.
     * Mutually exclusive with `content` array.
     * 
     * @example TodoSchema
     * @example z.object({ id: z.string(), name: z.string() })
     */
    schema?: z.ZodTypeAny;
    
    /**
     * Media type for single content type response (default: 'application/json').
     * Only used with `schema`, not with `content` array.
     * 
     * @example 'application/json'
     * @example 'application/pdf'
     * @example 'text/plain'
     */
    mediaType?: string;
    
    /**
     * OpenAPI examples for single content type (optional).
     * Only used with `schema`, not with `content` array.
     */
    examples?: Record<string, { 
        value: any; 
        summary?: string; 
        description?: string;
    }>;
    
    // === ADVANCED: Multiple content types (use for edge cases) ===
    
    /**
     * Multiple content types support for the same HTTP status code.
     * Use this when your endpoint can return different formats (JSON, XML, CSV, etc.)
     * based on Accept header or other content negotiation.
     * Mutually exclusive with schema/mediaType/examples.
     * 
     * @example
     * ```typescript
     * content: [
     *   { mediaType: 'application/json', schema: JsonUserSchema },
     *   { mediaType: 'application/xml', schema: XmlUserSchema }
     * ]
     * ```
     */
    content?: ContentTypeConfig[];
};

/**
 * Configuration for an Azure Function route with OpenAPI documentation.
 * New simplified API with shortcuts for common use cases.
 * 
 * Generic type parameters enable full TypeScript type inference for typed handlers.
 * When you provide schemas (params, query, body, headers), TypeScript automatically
 * infers the correct types for your typedHandler parameters.
 * 
 * @template TParams - Route parameters schema type (inferred from params field)
 * @template TQuery - Query parameters schema type (inferred from query field)
 * @template TBody - Request body schema type (inferred from body field)
 * @template THeaders - Request headers schema type (inferred from headers field)
 * 
 * @example Basic usage with type inference
 * ```typescript
 * app.openapiPath('GetTodo', 'Get todo by ID', {
 *   typedHandler: async ({ params, context }) => {
 *     // params.id is automatically typed as string!
 *     return { jsonBody: { id: params.id } };
 *   },
 *   methods: ['GET'],
 *   route: 'todos/{id}',
 *   params: z.object({ id: z.string().uuid() })
 * });
 * ```
 * 
 * @example Complex usage with multiple schemas
 * ```typescript
 * app.openapiPath('UpdateTodo', 'Update todo', {
 *   typedHandler: async ({ params, body, query, context }) => {
 *     // All parameters fully typed automatically!
 *     // params.id: string
 *     // body.title: string, body.completed: boolean
 *     // query.notify: boolean | undefined
 *     return { jsonBody: { id: params.id, ...body } };
 *   },
 *   methods: ['PUT'],
 *   route: 'todos/{id}',
 *   params: z.object({ id: z.string().uuid() }),
 *   body: z.object({ title: z.string(), completed: z.boolean() }),
 *   query: z.object({ notify: z.boolean().optional() })
 * });
 * ```
 */
export type FunctionRouteConfig<
    TParams extends z.ZodTypeAny | undefined = undefined,
    TQuery extends z.ZodTypeAny | undefined = undefined,
    TBody extends z.ZodTypeAny | undefined = undefined,
    THeaders extends z.ZodObject<any> | undefined = undefined
> = {
    // === Azure Functions Configuration (required) ===
    
    /** 
     * The traditional handler function for the route.
     * Use this when you want to manually parse and validate request data.
     * Mutually exclusive with `typedHandler`.
     */
    handler?: HttpHandler;
    
    /**
     * Typed handler with automatic validation and full type inference.
     * 
     * When you provide schemas (params, query, body, headers), TypeScript automatically
     * infers the correct types for all handler parameters. No type assertions needed!
     * 
     * Request data is automatically parsed and validated based on provided schemas.
     * Validation errors return 400 Bad Request with detailed error information.
     * 
     * Mutually exclusive with `handler`.
     * 
     * @example Inline typed handler with automatic type inference
     * ```typescript
     * typedHandler: async ({ params, body, context }) => {
     *   // params and body are fully typed automatically!
     *   return { jsonBody: { id: params.id, ...body } };
     * }
     * ```
     */
    typedHandler?: TypedHandler<{
        params: TParams;
        query: TQuery;
        body: TBody;
        headers: THeaders;
    }>;
    
    /** Array of HTTP methods supported by the route */
    methods: HttpMethod[];
    
    /** The route path (without prefix) */
    route: string;
    
    // === Azure Functions Configuration (optional) ===
    
    /** Authorization level required for the route (optional, uses global config if not specified) */
    authLevel?: 'anonymous' | 'function' | 'admin';
    
    /** Optional route prefix override (uses global config if not specified) */
    azureFunctionRoutePrefix?: string;
    
    // === OpenAPI Metadata ===
    
    /** Tags for organizing endpoints in documentation */
    tags?: string[];
    
    /** Detailed description of the endpoint */
    description?: string;
    
    /** Mark endpoint as deprecated */
    deprecated?: boolean;
    
    /** Security requirements for this endpoint */
    security?: SecurityRequirementObject[];
    
    /** Operation ID (must be unique across all endpoints) */
    operationId?: string;
    
    // === Request Shortcuts (assume JSON content type) ===
    
    /**
     * Path parameters schema (shortcut).
     * TypeScript will automatically infer the type for typedHandler parameters.
     * 
     * @example z.object({ id: z.string().uuid() })
     */
    params?: TParams;
    
    /**
     * Query string parameters schema (shortcut).
     * Validates query parameters in the URL.
     * TypeScript will automatically infer the type for typedHandler parameters.
     * 
     * @example Simple pagination
     * ```typescript
     * z.object({ 
     *   page: z.coerce.number().int().positive(), 
     *   limit: z.coerce.number().int().positive().max(100) 
     * })
     * ```
     * 
     * @example Filtering with optional params
     * ```typescript
     * z.object({
     *   status: z.enum(['active', 'completed', 'archived']).optional(),
     *   search: z.string().optional(),
     *   sortBy: z.enum(['date', 'title']).default('date')
     * })
     * ```
     */
    query?: TQuery;
    
    /**
     * Request body schema (shortcut - assumes JSON content type).
     * Validates the request body payload.
     * TypeScript will automatically infer the type for typedHandler parameters.
     * 
     * @example CreateUserSchema
     * @example z.object({ name: z.string(), email: z.string().email() })
     * 
     * @example With nested validation
     * ```typescript
     * z.object({
     *   title: z.string().min(1).max(100),
     *   description: z.string().optional(),
     *   tags: z.array(z.string()).max(10),
     *   metadata: z.record(z.string(), z.any()).optional()
     * })
     * ```
     */
    body?: TBody;
    
    /**
     * Request headers schema (shortcut).
     * Validates HTTP headers in the request.
     * Header names are case-insensitive per HTTP spec.
     * TypeScript will automatically infer the type for typedHandler parameters.
     * 
     * @example API key authentication
     * ```typescript
     * z.object({ 
     *   'X-API-Key': z.string().uuid() 
     * })
     * ```
     * 
     * @example Multiple custom headers
     * ```typescript
     * z.object({
     *   'X-Request-ID': z.string().uuid(),
     *   'X-Client-Version': z.string(),
     *   'Accept-Language': z.enum(['en', 'it', 'es']).optional()
     * })
     * ```
     */
    headers?: THeaders;
    
    // === Response Shortcuts ===
    
    /**
     * Single response schema (shortcut - assumes 200 OK with JSON).
     * Use this for simple endpoints with only success response.
     * Mutually exclusive with `responses` array.
     * 
     * @example UserSchema
     * @example z.object({ id: z.string(), name: z.string() })
     */
    response?: z.ZodTypeAny;
    
    /**
     * Multiple responses configuration (array-based).
     * Use this when you need multiple status codes (200, 400, 404, etc.).
     * Mutually exclusive with `response` shortcut.
     * 
     * @example
     * ```typescript
     * responses: [
     *   { httpCode: 200, schema: TodoSchema },
     *   { httpCode: 400, schema: ErrorSchema },
     *   { httpCode: 404, schema: NotFoundSchema }
     * ]
     * ```
     */
    responses?: ResponseConfig[];
    
    // === Advanced: Fallback to full RouteConfig ===
    
    /**
     * Advanced request configuration (fallback for complex scenarios).
     * Use this for cases not covered by shortcuts, such as:
     * - Multiple content types (JSON + XML + form-data)
     * - Cookie parameters
     * - Complex multipart/form-data with file uploads
     * - Custom content negotiation
     * 
     * ⚠️ **IMPORTANT**: If `request` is provided, all shortcuts (params, query, body, headers) 
     * are completely ignored. You must specify everything in the `request` object.
     * Do NOT use both `request` and shortcuts together - choose one approach.
     * 
     * @example Multiple content types for request body
     * ```typescript
     * request: {
     *   params: TodoParamIDSchema,
     *   body: {
     *     content: {
     *       'application/json': { schema: JsonTodoSchema },
     *       'application/xml': { schema: XmlTodoSchema },
     *       'multipart/form-data': { schema: FormDataTodoSchema }
     *     }
     *   }
     * }
     * ```
     * 
     * @example File upload with metadata
     * ```typescript
     * request: {
     *   body: {
     *     content: {
     *       'multipart/form-data': {
     *         schema: z.object({
     *           file: z.instanceof(File),
     *           metadata: z.object({ title: z.string(), tags: z.array(z.string()) })
     *         }),
     *         encoding: {
     *           file: { contentType: 'image/png, image/jpeg, application/pdf' },
     *           metadata: { contentType: 'application/json' }
     *         }
     *       }
     *     }
     *   }
     * }
     * ```
     * 
     * @see RouteConfig from @asteasolutions/zod-to-openapi for full structure
     */
    request?: RouteConfig['request'];
};

/**
 * Information about a registered OpenAPI document.
 * Returned by app.openapiSetup() for reference.
 */
export type OpenAPIDocumentInfo = {
    /** Display title of the document */
    title: string;
    /** URL where the document can be accessed */
    url: string;
};