import { HttpHandler, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import type { HttpRequestParams } from '@azure/functions';
import { z } from 'zod';
import {
    SafeHttpRequest,
    RequestSchemas,
    TypedHandler,
    ValidationError,
    parseRouteParams,
    parseQueryParams,
    parseBody,
    parseHeaders,
} from '../utils';

// ============================================================================
// Type Helpers for Request Parsing
// ============================================================================

/**
 * Infers the parsed type for params based on whether a schema is provided.
 * If schema is provided, returns the inferred Zod type. Otherwise, returns the original HttpRequestParams.
 *
 * @internal
 */
export type ParsedParams<T extends z.ZodTypeAny | undefined> = T extends z.ZodTypeAny
    ? z.infer<T>
    : HttpRequestParams;

/**
 * Infers the parsed type for query params based on whether a schema is provided.
 * If schema is provided, returns the inferred Zod type. Otherwise, returns the original URLSearchParams.
 *
 * @internal
 */
export type ParsedQuery<T extends z.ZodTypeAny | undefined> = T extends z.ZodTypeAny
    ? z.infer<T>
    : URLSearchParams;

/**
 * Infers the parsed type for body based on whether a schema is provided.
 * If schema is provided, returns the inferred Zod type. Otherwise, returns undefined.
 *
 * @internal
 */
export type ParsedBody<T extends z.ZodTypeAny | undefined> = T extends z.ZodTypeAny
    ? z.infer<T>
    : undefined;

/**
 * Infers the parsed type for headers based on whether a schema is provided.
 * If schema is provided, returns the inferred Zod type. Otherwise, returns the original Headers.
 *
 * @internal
 */
export type ParsedHeaders<T extends z.ZodTypeAny | undefined> = T extends z.ZodTypeAny
    ? z.infer<T>
    : Headers;

/**
 * Result interface for parseRequest function.
 * Contains validated and typed params, query, body, and headers.
 *
 * @internal
 */
export interface ParsedRequest<
    TParams extends z.ZodTypeAny | undefined = undefined,
    TQuery extends z.ZodTypeAny | undefined = undefined,
    TBody extends z.ZodTypeAny | undefined = undefined,
    THeaders extends z.ZodTypeAny | undefined = undefined,
> {
    params: ParsedParams<TParams>;
    query: ParsedQuery<TQuery>;
    body: ParsedBody<TBody>;
    headers: ParsedHeaders<THeaders>;
}

/**
 * Advanced type helper that infers the result type from a schema configuration.
 * This eliminates the need for explicit type casts by using mapped types.
 *
 * @internal
 */
export type InferParsedRequest<T extends RequestSchemas> = ParsedRequest<
    T['params'],
    T['query'],
    T['body'],
    T['headers']
>;

// ============================================================================
// Request Orchestrator
// ============================================================================

/**
 * Parses and validates all parts of an HTTP request (params, query, body, headers)
 * using the provided Zod schemas. This is an orchestrator function that internally
 * calls the individual parse functions from utils.ts.
 *
 * If a schema is not provided for a specific part, the original value is returned
 * without validation.
 *
 * All validation errors are wrapped in ValidationError with the original ZodError attached.
 *
 * @param request - The HttpRequest from Azure Functions
 * @param schemas - Object containing optional Zod schemas for each request part
 * @returns Object with validated and typed params, query, body, and headers
 * @throws {ValidationError} If Content-Type is invalid, JSON parsing fails, or validation fails
 *
 * @internal
 */
export async function parseRequest<T extends RequestSchemas>(
    request: HttpRequest,
    schemas: T
): Promise<InferParsedRequest<T>> {
    // Parse params (if schema provided)
    const parsedParams = schemas.params
        ? parseRouteParams(request.params, schemas.params)
        : request.params;

    // Parse query (if schema provided)
    const parsedQuery = schemas.query
        ? parseQueryParams(request.query, schemas.query)
        : request.query;

    // Parse body (if schema provided)
    const parsedBody = schemas.body ? await parseBody(request, schemas.body) : undefined;

    // Parse headers (if schema provided)
    const parsedHeaders = schemas.headers
        ? parseHeaders(request.headers, schemas.headers)
        : request.headers;

    return {
        params: parsedParams,
        query: parsedQuery,
        body: parsedBody,
        headers: parsedHeaders,
    } as InferParsedRequest<T>;
}

// ============================================================================
// Typed Handler Support
// ============================================================================

/**
 * Body-consuming methods that must be blocked once the body has already been parsed.
 * Calling these on the original request a second time throws "body already consumed"
 * deep inside the Azure Functions runtime, with no useful stack trace.
 *
 * @internal
 */
const BODY_CONSUMING_METHODS = new Set<string | symbol>([
    'json',
    'text',
    'formData',
    'arrayBuffer',
    'blob',
]);

/**
 * Creates a "safe" HTTP request that wraps the original request via a Proxy so that
 * every property/method (including those defined on the `HttpRequest` prototype
 * and any non-enumerable property) continues to work transparently, while
 * body-consuming methods are replaced with a helpful error.
 *
 * Using a Proxy avoids the pitfalls of `Object.assign` on platform objects
 * (loss of prototype, loss of non-enumerable properties such as `headers`,
 * `params`, `query` getters on some runtimes).
 *
 * @param request - The original HttpRequest
 * @param bodyWasParsed - Whether the body was parsed (schema was provided)
 * @returns Safe request object with body-consuming methods blocked if necessary
 *
 * @internal
 */
export function createSafeRequest(request: HttpRequest, bodyWasParsed: boolean): HttpRequest {
    // If body wasn't parsed, return original request (all methods are safe to use)
    if (!bodyWasParsed) {
        return request;
    }

    return new Proxy(request, {
        get(target, prop, receiver) {
            if (BODY_CONSUMING_METHODS.has(prop)) {
                const methodName = typeof prop === 'symbol' ? prop.toString() : prop;
                const message =
                    `Cannot call request.${methodName}() - body has already been parsed by the typed handler wrapper. ` +
                    `The parsed body is available in the 'body' parameter of your handler. ` +
                    `If you need access to the raw body, use the regular 'handler' instead of 'typedHandler'.`;
                // Body-consuming methods on HttpRequest are async; reject the
                // returned promise instead of throwing synchronously so callers
                // can `await` / `.catch()` the failure as they would for any
                // other body parse error.
                return () => Promise.reject(new Error(message));
            }
            const value = Reflect.get(target, prop, receiver);
            // Re-bind functions so that `this` keeps pointing to the real request,
            // preserving access to internal slots / private fields used by the runtime.
            if (typeof value === 'function') {
                return value.bind(target);
            }
            return value;
        },
    });
}

/**
 * Wraps a typed handler to provide automatic request parsing, validation, and error handling.
 *
 * The wrapper:
 * 1. Parses and validates all request data (params, query, body, headers) using provided schemas
 * 2. Creates a safe request object (removes body-consuming methods if body was parsed)
 * 3. Invokes the typed handler with parsed data
 * 4. Automatically handles ValidationError by returning 400 Bad Request with detailed error info
 *
 * @template T - Request schemas for params, query, body, and headers
 * @param schemas - Zod schemas for validating request data
 * @param handler - The typed handler function to wrap
 * @returns Azure Functions compatible HttpHandler
 *
 * @internal
 */
export function wrapTypedHandler<T extends RequestSchemas>(
    schemas: T,
    handler: TypedHandler<T>
): HttpHandler {
    return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            // Parse and validate all request data
            const parsed = await parseRequest(request, schemas);

            // Create safe request (removes body methods if body was parsed)
            const safeRequest = createSafeRequest(request, schemas.body !== undefined);

            // Invoke typed handler with parsed data
            return await handler({
                params: parsed.params,
                query: parsed.query,
                body: parsed.body,
                headers: parsed.headers,
                request: safeRequest,
                context,
            });
        } catch (error) {
            // Automatically handle validation errors
            if (error instanceof ValidationError) {
                return {
                    status: 400,
                    jsonBody: {
                        error: error.message,
                        details: error.zodError?.issues || [],
                    },
                };
            }

            // Re-throw other errors (will be handled by Azure Functions runtime)
            throw error;
        }
    };
}
