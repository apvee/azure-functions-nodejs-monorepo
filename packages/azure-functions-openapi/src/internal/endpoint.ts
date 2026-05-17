import { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { app, HttpHandler } from "@azure/functions";
import { FunctionRouteConfig } from "../types";
import { RequestSchemas } from "../utils";
import { globalConfigManager } from "./config";
import { wrapTypedHandler } from "./parsing";
import { openAPIRegistry } from "./registry";
import { mapHttpMethod, normalizeAzureFunctionRoute, normalizeOpenAPIPath } from "./route";
import { transformToRouteConfig } from "./transform";

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

    // Auth level: explicit option > global default (set by openapiSetup) > 'anonymous'
    const authLevel = options.authLevel || globalConfigManager.getDefaultAuthLevel();

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

    // Disambiguate operationId when the same registration covers multiple HTTP methods.
    // OpenAPI requires operationId to be unique across the document; reusing the same
    // value for, say, PUT and PATCH would generate an invalid spec. We append a stable
    // method suffix only when there is more than one method.
    const baseOperationId = options.operationId || name;
    const needsMethodSuffix = options.methods.length > 1;

    // Register each HTTP method with OpenAPI registry
    options.methods.forEach(method => {
        // Normalize the path for OpenAPI (with prefix and leading slash)
        const fullPath = normalizeOpenAPIPath(routePrefix, options.route);

        const operationId = needsMethodSuffix
            ? `${baseOperationId}_${method.toLowerCase()}`
            : baseOperationId;

        const routeConfig: RouteConfig = {
            ...transformedConfig,
            operationId,  // Unique per (path, method) entry
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
