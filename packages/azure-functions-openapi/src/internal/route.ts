/**
 * Route normalization and method mapping helpers.
 *
 * Extracted into a standalone module so they can be unit-tested without
 * pulling in the full endpoint-registration machinery (which has side effects
 * on `app.http`).
 *
 * @internal
 */

import type { HttpMethod } from '@azure/functions';

/** Lowercase OpenAPI HTTP method literal. */
export type OpenApiMethod =
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch'
    | 'head'
    | 'options'
    | 'trace';

/**
 * Normalizes a path for OpenAPI documentation.
 * Ensures the path starts with a single leading slash and collapses multiple
 * consecutive slashes.
 *
 * @param routePrefix - Optional route prefix for the Azure Function
 * @param route - The route path
 * @returns Normalized path string for OpenAPI (always starts with `/`)
 *
 * @internal
 */
export function normalizeOpenAPIPath(routePrefix: string | undefined, route: string): string {
    const fullPath = routePrefix ? `/${routePrefix}/${route}` : `/${route}`;
    return fullPath.replace(/\/+/g, '/');
}

/**
 * Normalizes a route for Azure Functions registration.
 * Azure Functions expects routes without leading slashes and handles prefixes
 * via configuration.
 *
 * @param route - The route path
 * @returns Normalized route (no leading/trailing slashes, no duplicate slashes)
 *
 * @internal
 */
export function normalizeAzureFunctionRoute(route: string): string {
    const normalized = route.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/+/g, '/');
    return normalized || '';
}

/**
 * Maps Azure Functions HttpMethod (uppercase) to OpenAPI method format (lowercase).
 *
 * @internal
 */
export function mapHttpMethod(method: HttpMethod): OpenApiMethod {
    return method.toLowerCase() as OpenApiMethod;
}
