import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { app, HttpHandler, HttpMethod } from "@azure/functions";
import { FunctionRouteConfig } from "../types";
import { RequestSchemas } from "../utils";
import { globalConfigManager } from "./config";
import { wrapTypedHandler } from "./parsing";
import { openAPIRegistry } from "./registry";
import { transformToRouteConfig } from "./transform";

/**
 * Normalizes a path for OpenAPI documentation.
 * Ensures the path starts with a single leading slash and removes multiple consecutive slashes.
 * 
 * @param routePrefix - Optional route prefix for the Azure Function
 * @param route - The route path
 * @returns Normalized path string for OpenAPI (always starts with /)
 */
function normalizeOpenAPIPath(routePrefix: string | undefined, route: string): string {
    const fullPath = routePrefix ? `/${routePrefix}/${route}` : `/${route}`;
    
    // Replace multiple slashes with a single slash
    return fullPath.replace(/\/+/g, '/');
}

/**
 * Normalizes a route for Azure Functions registration.
 * Azure Functions expects routes without leading slashes and handles prefixes via configuration.
 * Cleans the route by removing leading/trailing slashes and multiple consecutive slashes.
 * 
 * @param route - The route path
 * @returns Normalized route for Azure Functions (no leading/trailing slashes)
 */
function normalizeAzureFunctionRoute(route: string): string {
    // Remove leading/trailing slashes and replace multiple slashes with single slash
    const normalized = route
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')
        .replace(/\/+/g, '/');
    
    // Return empty string for root route
    return normalized || '';
}

/**
 * Registers an Azure Function HTTP path with OpenAPI documentation.
 * 
 * @internal
 * This is an internal implementation function. Do not use directly.
 * Use the public API via module augmentation instead.
 * 
 * The path will be registered with both the Azure Functions runtime and documented
 * in the 'paths' section of the OpenAPI specification.
 * 
 * If azureFunctionRoutePrefix is not provided, it will use the global route prefix 
 * from the global configuration.
 *
 * @param name - The name of the function
 * @param summary - A brief summary for OpenAPI documentation
 * @param options - Configuration options including handler, methods, auth level, route, request/response schemas, etc.
 */
export function registerOpenAPIPath(
    name: string,
    summary: string,
    options: FunctionRouteConfig) {

    registerPath(name, summary, false, options);
}

/**
 * Registers an Azure Function as a webhook with OpenAPI documentation.
 * 
 * @internal
 * This is an internal implementation function. Do not use directly.
 * Use the public API via module augmentation instead.
 * 
 * Webhooks are documented in the 'webhooks' section of the OpenAPI 3.1.0 specification,
 * representing callback endpoints that your API will call, rather than endpoints that clients call.
 * 
 * If azureFunctionRoutePrefix is not provided, it will use the global route prefix 
 * from the global configuration.
 *
 * @param name - The name of the webhook
 * @param summary - A brief summary for OpenAPI documentation
 * @param options - Configuration options including handler, methods, auth level, route, request/response schemas, etc.
 */
export function registerOpenAPIWebhook(
    name: string,
    summary: string,
    options: FunctionRouteConfig) {

    registerPath(name, summary, true, options);
}

/**
 * Internal function to register a path or webhook with Azure Functions and OpenAPI registry.
 * Uses global configuration for route prefix and auth level if not explicitly provided.
 * 
 * @param name - The name of the function
 * @param summary - A summary of the function for OpenAPI documentation
 * @param isWebHook - Whether this is a webhook registration
 * @param options - Configuration options for the function
 */
function registerPath(
    name: string,
    summary: string,
    isWebHook: boolean,
    options: FunctionRouteConfig
) {
    // Determine which handler to use
    let actualHandler: HttpHandler;
    
    if (options.typedHandler) {
        // Build schemas from request shortcuts
        const schemas: RequestSchemas = {
            params: options.params,
            query: options.query,
            body: options.body,
            headers: options.headers
        };
        
        // Wrap typed handler with automatic validation
        actualHandler = wrapTypedHandler(schemas, options.typedHandler);
    } else if (options.handler) {
        // Use traditional handler
        actualHandler = options.handler;
    } else {
        throw new Error(`Function '${name}' must provide either 'handler' or 'typedHandler'`);
    }
    
    // Normalize the route for Azure Functions registration (without leading slash and prefix)
    const normalizedRoute = normalizeAzureFunctionRoute(options.route);

    // Get auth level from options or use anonymous as default
    const authLevel = options.authLevel || 'anonymous';

    // Register with Azure Functions
    app.http(name, {
        methods: options.methods,
        authLevel,
        handler: actualHandler,
        route: normalizedRoute
    });

    // Get route prefix from options or global config
    const routePrefix = options.azureFunctionRoutePrefix || globalConfigManager.getRoutePrefix();

    // Transform FunctionRouteConfig to RouteConfig using shortcuts
    const transformedConfig = transformToRouteConfig(options);

    // Register each HTTP method with OpenAPI registry
    options.methods.forEach(method => {
        // Normalize the path for OpenAPI (with prefix and leading slash)
        const fullPath = normalizeOpenAPIPath(routePrefix, options.route);

        const routeConfig: RouteConfig = {
            ...transformedConfig,
            operationId: options.operationId || name,  // Used to map webhook name to path in docs generation
            summary,
            method: mapHttpMethod(method),
            path: fullPath
        };

        if (isWebHook) {
            openAPIRegistry.registerWebhook(routeConfig);
        } else {
            openAPIRegistry.registerPath(routeConfig);
        }
    });
}

/**
 * Maps Azure Functions HttpMethod to OpenAPI method format.
 * 
 * @param method - Azure Functions HTTP method
 * @returns OpenAPI method string in lowercase
 */
function mapHttpMethod(method: HttpMethod): 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace' {
    return method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';
}