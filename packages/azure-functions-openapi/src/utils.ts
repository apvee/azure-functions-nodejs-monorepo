import { HttpHandler, HttpRequest, HttpRequestParams, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { Headers as UndiciHeaders } from "undici";
import { z } from "zod";
import { wrapTypedHandler as internalWrapTypedHandler } from "./internal/parsing";

// ============================================================================
// Public Error Classes
// ============================================================================

/**
 * Custom error class for validation failures.
 * Wraps Zod validation errors with additional context.
 * 
 * Users can catch this error to handle validation failures manually:
 * ```typescript
 * try {
 *   const params = parseRouteParams(request.params, schema);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     // Handle validation error
 *     return { status: 400, jsonBody: { error: error.message } };
 *   }
 * }
 * ```
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public readonly zodError?: z.ZodError
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

// ============================================================================
// Public Type Exports
// ============================================================================

/**
 * Safe HTTP Request type that excludes methods that would re-consume the body stream.
 * Used when the request body has already been parsed to prevent "body already consumed" errors.
 */
export type SafeHttpRequest = Omit<HttpRequest, 'json' | 'text' | 'formData' | 'arrayBuffer' | 'blob'>;

/**
 * Schema configuration object for typed handlers.
 * Each property is optional and can contain a Zod schema for validation.
 */
export interface RequestSchemas {
    params?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    body?: z.ZodTypeAny;
    headers?: z.ZodTypeAny;
}

/**
 * Arguments passed to a typed handler function.
 * All request data is pre-parsed and validated according to provided schemas.
 * 
 * @template T - Request schemas defining params, query, body, and headers validation
 */
export type TypedHandlerArgs<T extends RequestSchemas> = {
    /** Parsed and validated route parameters (e.g., /users/{id}) */
    params: T['params'] extends z.ZodTypeAny ? z.infer<T['params']> : any;
    
    /** Parsed and validated query string parameters */
    query: T['query'] extends z.ZodTypeAny ? z.infer<T['query']> : URLSearchParams;
    
    /** Parsed and validated request body (JSON) */
    body: T['body'] extends z.ZodTypeAny ? z.infer<T['body']> : undefined;
    
    /** Parsed and validated request headers */
    headers: T['headers'] extends z.ZodTypeAny ? z.infer<T['headers']> : any;
    
    /** 
     * Safe HTTP request object with body-consuming methods removed if body was parsed.
     * Use this to access other request properties (url, method, etc.) without risking
     * "body already consumed" errors.
     */
    request: SafeHttpRequest | HttpRequest;
    
    /** Azure Functions invocation context for logging and metadata */
    context: InvocationContext;
};

/**
 * Typed handler function that receives pre-parsed and validated request data.
 * Validation errors are automatically handled and return 400 Bad Request with details.
 * 
 * @template T - Request schemas defining params, query, body, and headers validation
 * 
 * @example Simple typed handler with params
 * ```typescript
 * const handler: TypedHandler<{ params: typeof TodoIdSchema }> = async ({ params, context }) => {
 *   // params.id is already validated and typed!
 *   context.log(`Fetching todo: ${params.id}`);
 *   return { jsonBody: { id: params.id, title: 'Example' } };
 * };
 * ```
 * 
 * @example Typed handler with body and params
 * ```typescript
 * const handler: TypedHandler<{ params: typeof TodoIdSchema; body: typeof UpdateTodoSchema }> = 
 *   async ({ params, body, context }) => {
 *     // params.id and body are both validated and typed
 *     const updated = await updateTodo(params.id, body);
 *     return { jsonBody: updated };
 *   };
 * ```
 */
export type TypedHandler<T extends RequestSchemas> = (
    args: TypedHandlerArgs<T>
) => Promise<HttpResponseInit>;

// ============================================================================
// Private Conversion Helpers
// ============================================================================

/**
 * Converts HttpRequestParams to a plain object.
 * @internal
 */
function convertParamsToObject(params: HttpRequestParams): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
            result[key] = params[key];
        }
    }
    return result;
}

/**
 * Converts URLSearchParams to a plain object.
 * Handles multiple values for the same query parameter (arrays).
 * @internal
 */
function convertQueryToObject(query: URLSearchParams): Record<string, string | string[]> {
    const result: Record<string, string | string[]> = {};
    query.forEach((value: string, key: string) => {
        const existing = result[key];
        if (existing === undefined) {
            result[key] = value;
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            result[key] = [existing, value];
        }
    });
    return result;
}

/**
 * Converts Headers object to a plain object.
 * Normalizes header names to lowercase for case-insensitive matching.
 * @internal
 */
function convertHeadersToObject(headers: UndiciHeaders): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value: string, key: string) => {
        result[key.toLowerCase()] = value;
    });
    return result;
}

// ============================================================================
// Public Parse Functions
// ============================================================================

/**
 * Parses and validates HTTP request route parameters using a Zod schema.
 * Route parameters are extracted from the URL path (e.g., /users/{id}/posts/{postId}).
 * 
 * @param params - The route parameters from Azure Functions HttpRequest
 * @param schema - Zod schema to validate against
 * @returns Validated and typed parameters
 * @throws {ValidationError} If validation fails (wraps ZodError)
 * 
 * @example
 * ```typescript
 * // For route: /users/{id}
 * const ParamsSchema = z.object({ id: z.string().uuid() });
 * const params = parseRouteParams(request.params, ParamsSchema);
 * // params.id is typed as string and validated as UUID
 * ```
 */
export function parseRouteParams<T extends z.ZodTypeAny>(
    params: HttpRequestParams,
    schema: T
): z.infer<T> {
    const paramsObj = convertParamsToObject(params);
    try {
        return schema.parse(paramsObj);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Route parameters validation failed', error);
        }
        throw error;
    }
}

/**
 * Parses and validates HTTP request query parameters using a Zod schema.
 * Handles multiple values for the same query parameter (arrays).
 * 
 * @param query - The query parameters from Azure Functions HttpRequest
 * @param schema - Zod schema to validate against
 * @returns Validated and typed query parameters
 * @throws {ValidationError} If validation fails (wraps ZodError)
 * 
 * @example
 * ```typescript
 * const QuerySchema = z.object({
 *     page: z.coerce.number().int().positive(),
 *     tags: z.array(z.string()).optional()
 * });
 * const query = parseQueryParams(request.query, QuerySchema);
 * // query.page is typed as number
 * // query.tags is typed as string[] | undefined
 * ```
 */
export function parseQueryParams<T extends z.ZodTypeAny>(
    query: URLSearchParams,
    schema: T
): z.infer<T> {
    const queryObj = convertQueryToObject(query);
    try {
        return schema.parse(queryObj);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Query parameters validation failed', error);
        }
        throw error;
    }
}

/**
 * Parses and validates HTTP request body using a Zod schema.
 * Expects JSON content type and body.
 * 
 * @param request - The HttpRequest from Azure Functions
 * @param schema - Zod schema to validate against
 * @returns Validated and typed request body
 * @throws {ValidationError} If Content-Type is not JSON, body is invalid JSON, or validation fails
 * 
 * @example
 * ```typescript
 * const BodySchema = z.object({
 *     title: z.string().min(1),
 *     completed: z.boolean()
 * });
 * const body = await parseBody(request, BodySchema);
 * // body.title is typed as string
 * // body.completed is typed as boolean
 * ```
 */
export async function parseBody<T extends z.ZodTypeAny>(
    request: HttpRequest,
    schema: T
): Promise<z.infer<T>> {
    // Check Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
        throw new ValidationError('Content-Type must be application/json');
    }
    
    // Parse JSON body
    let bodyData: unknown;
    try {
        bodyData = await request.json();
    } catch (error) {
        throw new ValidationError('Invalid JSON body');
    }
    
    // Validate with schema
    try {
        return schema.parse(bodyData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Request body validation failed', error);
        }
        throw error;
    }
}

/**
 * Parses and validates HTTP request headers using a Zod schema.
 * Header names are normalized to lowercase for case-insensitive matching.
 * 
 * @param headers - The headers from Azure Functions HttpRequest
 * @param schema - Zod schema to validate against (use lowercase header names)
 * @returns Validated and typed headers
 * @throws {ValidationError} If validation fails (wraps ZodError)
 * 
 * @example
 * ```typescript
 * const HeadersSchema = z.object({
 *     'x-api-key': z.string().min(32),
 *     'authorization': z.string().regex(/^Bearer .+/)
 * });
 * const headers = parseHeaders(request.headers, HeadersSchema);
 * // headers['x-api-key'] is typed as string
 * ```
 */
export function parseHeaders<T extends z.ZodTypeAny>(
    headers: UndiciHeaders,
    schema: T
): z.infer<T> {
    const headersObj = convertHeadersToObject(headers);
    try {
        return schema.parse(headersObj);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Request headers validation failed', error);
        }
        throw error;
    }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parses Azure EasyAuth principal information from the X-MS-CLIENT-PRINCIPAL header.
 * This header is automatically populated by Azure App Service when authentication is enabled.
 * 
 * @param headerValue - The base64-encoded value from X-MS-CLIENT-PRINCIPAL header
 * @returns Parsed principal object with user identity information
 * @throws {ValidationError} If header value is invalid or cannot be decoded
 * 
 * @see https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities
 * 
 * @example
 * ```typescript
 * import { parseEasyAuthPrincipal } from '@apvee/azure-functions-openapi';
 * 
 * const handler: HttpHandler = async (request, context) => {
 *   const headerValue = request.headers.get('X-MS-CLIENT-PRINCIPAL');
 *   if (!headerValue) {
 *     return { status: 401, body: 'Not authenticated' };
 *   }
 *   
 *   try {
 *     const principal = parseEasyAuthPrincipal(headerValue);
 *     context.log(`User ${principal.userId} authenticated via ${principal.auth_typ}`);
 *     return { jsonBody: { user: principal } };
 *   } catch (error) {
 *     return { status: 400, body: 'Invalid authentication header' };
 *   }
 * };
 * ```
 */
export function parseEasyAuthPrincipal(headerValue: string): import('./types').AzureEasyAuthPrincipal {
    try {
        // Decode base64 header value
        const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
        const principal = JSON.parse(decoded);
        
        // Basic validation
        if (!principal.auth_typ || !principal.userId) {
            throw new ValidationError('Invalid EasyAuth principal: missing required fields (auth_typ, userId)');
        }
        
        return principal;
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new ValidationError('Failed to parse EasyAuth principal header: invalid base64 or JSON format');
    }
}

/**
 * Extracts Azure Function Key from the request.
 * Checks both `code` query parameter and `x-functions-key` header.
 * 
 * @param request - The HttpRequest from Azure Functions
 * @returns The function key if found, undefined otherwise
 * 
 * @see https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger#api-key-authorization
 * 
 * @example
 * ```typescript
 * import { extractFunctionKey } from '@apvee/azure-functions-openapi';
 * 
 * const handler: HttpHandler = async (request, context) => {
 *   const functionKey = extractFunctionKey(request);
 *   if (!functionKey) {
 *     return { status: 401, body: 'Function key required' };
 *   }
 *   
 *   // Validate the key (user implements validation logic)
 *   const isValid = await validateFunctionKey(functionKey);
 *   if (!isValid) {
 *     return { status: 403, body: 'Invalid function key' };
 *   }
 *   
 *   return { status: 200, body: 'Authorized' };
 * };
 * ```
 */
export function extractFunctionKey(request: HttpRequest): string | undefined {
    // Check query parameter first (most common)
    const queryKey = request.query.get('code');
    if (queryKey) {
        return queryKey;
    }
    
    // Check header as fallback
    const headerKey = request.headers.get('x-functions-key');
    if (headerKey) {
        return headerKey;
    }
    
    return undefined;
}

/**
 * Helper function to create a typed handler with full type inference.
 * Use this when you want TypeScript to automatically infer parameter types from schemas.
 * 
 * This is an alternative to using `typedHandler` directly in FunctionRouteConfig,
 * providing better type inference for inline handlers.
 * 
 * @template T - Request schemas for params, query, body, and headers
 * @param schemas - Zod schemas for validating request data
 * @param handler - The typed handler function with inferred types
 * @returns Azure Functions compatible HttpHandler
 * 
 * @example Simple usage with params
 * ```typescript
 * import { createTypedHandler } from '@apvee/azure-functions-openapi';
 * 
 * const deleteHandler = createTypedHandler(
 *   { params: TodoIdSchema },
 *   async ({ params, context }) => {
 *     // params.id is automatically typed as string!
 *     context.log(`Deleting todo: ${params.id}`);
 *     return { status: 204 };
 *   }
 * );
 * 
 * app.openapiPath('DeleteTodo', 'Delete todo', {
 *   handler: deleteHandler,  // Use as regular handler
 *   methods: ['DELETE'],
 *   route: 'todos/{id}',
 *   params: TodoIdSchema
 * });
 * ```
 * 
 * @example Complex usage with params + body
 * ```typescript
 * const updateHandler = createTypedHandler(
 *   { params: TodoIdSchema, body: UpdateTodoSchema },
 *   async ({ params, body, context }) => {
 *     // Both params.id and body are fully typed!
 *     return { jsonBody: { id: params.id, ...body } };
 *   }
 * );
 * ```
 */
export function createTypedHandler<T extends RequestSchemas>(
    schemas: T,
    handler: TypedHandler<T>
): HttpHandler {
    return internalWrapTypedHandler(schemas, handler) as HttpHandler;
}
