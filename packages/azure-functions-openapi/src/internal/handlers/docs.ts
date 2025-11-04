import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { OpenApiGeneratorV3, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { stringify as yamlStringify } from 'yaml';
import { OpenAPIDocumentInfo, OpenAPIObject, OpenAPIObjectConfig } from "../../types";
import { Swagger2Converter } from "../converters/swagger2";
import { openAPIRegistry } from "../registry";

/**
 * Registers an OpenAPI document handler for Azure Functions.
 * This function is internal and should not be called directly - use app.openapi() instead.
 * 
 * Creates an HTTP GET endpoint that serves the OpenAPI specification in the requested format and version.
 * Automatically converts OpenAPI 3.x to Swagger 2.0 when version '2.0' is requested.
 *
 * @param authLevel - Authorization level required to access the endpoint
 * @param configuration - OpenAPI configuration object
 * @param version - OpenAPI version to generate
 * @param format - Output format (json or yaml)
 * @param route - Optional custom route for the endpoint
 * @returns Document information including title and URL
 * 
 * @internal
 */
export function registerOpenAPIHandler(
    authLevel: 'anonymous' | 'function' | 'admin',
    configuration: OpenAPIObjectConfig,
    version: '2.0' | '3.0.3' | '3.1.0',
    format: 'json' | 'yaml',
    route?: string,
): OpenAPIDocumentInfo {
    // Generate route and function name
    const finalRoute = route || `openapi-${version}.${format}`;
    const functionName = `X_OpenAPI_${version.replace(/\./g, '_')}_${format === 'json' ? 'Json' : 'Yaml'}Handler`;

    app.http(functionName, {
        methods: ['GET'],
        authLevel,
        handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
            context.log(`Generating OpenAPI ${version} ${format} definition for "${request.url}"`);

            // Pre-process definitions: Convert webhooks to routes for OpenAPI < 3.1.0
            // OpenAPI 3.1.0 supports webhooks natively, but earlier versions do not.
            // For backward compatibility, we convert webhook definitions to route definitions
            // with special metadata (x-webhook, x-outbound-callback) before generating the document.
            let definitions = openAPIRegistry.definitions;
            
            if (version !== '3.1.0') {
                context.log('Pre-processing: Converting webhooks to routes for OpenAPI version compatibility');
                const processedDefs: typeof definitions = [];
                
                for (const def of openAPIRegistry.definitions) {
                    if (def.type === 'webhook') {
                        const webhookDef = def as { type: 'webhook'; webhook: RouteConfig };
                        const originalWebhook = webhookDef.webhook;
                        
                        if (!originalWebhook.operationId || !originalWebhook.path) {
                            context.warn(
                                `Webhook with path "${originalWebhook.path || 'unknown'}" and operationId ` +
                                `"${originalWebhook.operationId || 'unknown'}" is missing required fields - skipping conversion`
                            );
                            continue;
                        }
                        
                        context.log(`Converting webhook "${originalWebhook.operationId}" to route at path "${originalWebhook.path}"`);
                        
                        // Create a modified route config with webhook metadata
                        const routeConfig: RouteConfig = {
                            ...originalWebhook,
                            // Enhance summary to indicate this is a webhook
                            summary: originalWebhook.summary 
                                ? `[WEBHOOK] ${originalWebhook.summary}` 
                                : `[WEBHOOK] ${originalWebhook.operationId}`,
                            // Prepend warning to description
                            description: originalWebhook.description
                                ? `⚠️ **OUTBOUND WEBHOOK** - This is NOT an endpoint you call.\n\n` +
                                  `This describes a webhook callback endpoint that YOUR system should implement to receive ` +
                                  `notifications from this API. When certain events occur, our API will make an HTTP request ` +
                                  `to YOUR configured webhook URL with the payload described below.\n\n` +
                                  `ℹ️ **Note**: This webhook appears under "paths" for OpenAPI ${version} compatibility. ` +
                                  `In OpenAPI 3.1.0, this would be documented in the dedicated "webhooks" section.\n\n` +
                                  `---\n\n${originalWebhook.description}`
                                : `⚠️ **OUTBOUND WEBHOOK** - This is NOT an endpoint you call.\n\n` +
                                  `This describes a webhook callback endpoint that YOUR system should implement to receive ` +
                                  `notifications from this API.\n\n` +
                                  `ℹ️ **Note**: This webhook appears under "paths" for OpenAPI ${version} compatibility. ` +
                                  `In OpenAPI 3.1.0, this would be documented in the dedicated "webhooks" section.`
                        };
                        
                        // Add OpenAPI extension metadata to identify this as a webhook
                        // These extensions will be preserved in the generated OpenAPI document
                        (routeConfig as any)['x-webhook'] = true;
                        (routeConfig as any)['x-outbound-callback'] = true;
                        
                        // Convert webhook definition to route definition
                        processedDefs.push({
                            type: 'route',
                            route: routeConfig
                        } as any);
                    } else {
                        // Keep non-webhook definitions as-is
                        processedDefs.push(def);
                    }
                }
                
                definitions = processedDefs;
                context.log(`Pre-processing complete: ${processedDefs.length} definitions prepared`);
            }

            // Select appropriate generator based on version
            const OpenApiGenerator = version === '3.1.0' ? OpenApiGeneratorV31 : OpenApiGeneratorV3;
            
            // Generate OpenAPI document with processed definitions
            let openAPIDefinition: OpenAPIObject = new OpenApiGenerator(definitions)
                .generateDocument({
                    openapi: version,
                    info: configuration.info,
                    security: configuration.security,
                    servers: configuration.servers || [{ url: new URL(request.url).origin }],
                    externalDocs: configuration.externalDocs,
                    tags: configuration.tags
                });

            // Convert to Swagger 2.0 if requested
            if (version === '2.0') {
                const converter = new Swagger2Converter(openAPIDefinition);
                openAPIDefinition = converter.convert() as OpenAPIObject;
            }

            // Serialize to requested format
            const contentType = format === 'json' ? 'application/json' : 'application/x-yaml';
            const body = format === 'yaml' 
                ? yamlStringify(openAPIDefinition) 
                : JSON.stringify(openAPIDefinition, null, 2);

            return {
                status: 200,
                headers: { 'Content-Type': contentType },
                body
            };
        },
        route: finalRoute
    });

    const formatName = format === 'json' ? 'JSON' : 'YAML';
    return { 
        title: `${configuration.info.title} (${formatName} - OpenAPI ${version})`, 
        url: finalRoute 
    };
}