import type { RouteConfig } from '@asteasolutions/zod-to-openapi';
import { OpenApiGeneratorV3, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { stringify as yamlStringify } from 'yaml';
import { OpenAPIDocumentInfo, OpenAPIObject, OpenAPIObjectConfig, ServerObject } from '../../types';
import { Swagger2Converter } from '../converters/swagger2';
import { openAPIRegistry } from '../registry';
import { redactSensitiveUrl } from '../sanitize';
import { getLogger } from '../logger';

/**
 * Options for resolving the `servers` array of a generated OpenAPI document
 * when the caller did not provide one explicitly via `OpenAPISetupConfig.servers`.
 *
 * @internal
 */
export interface HostResolutionOptions {
    /** When `true`, the request's `Host` header may be used as a fallback origin. */
    trustHostHeader: boolean;
    /**
     * Lowercase, host-only allowlist (no scheme or port). When non-empty, only
     * requests whose host matches an entry are honoured.
     */
    trustedHosts: readonly string[];
}

/**
 * Resolves the `servers` field for the generated OpenAPI document, returning
 * `undefined` when no trustworthy origin can be derived. Exported for tests.
 *
 * @internal
 */
export function resolveServers(
    configuredServers: ServerObject[] | undefined,
    requestUrl: string,
    options: HostResolutionOptions
): ServerObject[] | undefined {
    if (configuredServers && configuredServers.length > 0) {
        return configuredServers;
    }

    if (!options.trustHostHeader) {
        return undefined;
    }

    let origin: string;
    let host: string;
    try {
        const url = new URL(requestUrl);
        origin = url.origin;
        host = url.hostname.toLowerCase();
    } catch {
        return undefined;
    }

    if (options.trustedHosts.length > 0) {
        const allow = options.trustedHosts.map((h) => h.toLowerCase());
        if (!allow.includes(host)) {
            getLogger().warn(
                `[openapi] Ignoring untrusted host "${host}" for OpenAPI servers field. ` +
                    `Add it to OpenAPISetupConfig.trustedHosts to opt in.`
            );
            return undefined;
        }
    }

    return [{ url: origin }];
}

/**
 * Internal registration for a single OpenAPI document endpoint. Exposed as a
 * named symbol so the document handler can be re-used and tested without going
 * through {@link setupOpenAPI}.
 *
 * @internal
 */
export interface RegisterOpenAPIHandlerOptions {
    authLevel: 'anonymous' | 'function' | 'admin';
    configuration: OpenAPIObjectConfig;
    version: '2.0' | '3.0.3' | '3.1.0';
    format: 'json' | 'yaml';
    route?: string;
    hostResolution: HostResolutionOptions;
}

/**
 * Registers an OpenAPI document handler for Azure Functions.
 * This function is internal and should not be called directly - use app.openAPISetup() instead.
 *
 * Creates an HTTP GET endpoint that serves the OpenAPI specification in the requested format and version.
 * Automatically converts OpenAPI 3.x to Swagger 2.0 when version '2.0' is requested.
 *
 * @internal
 */
export function registerOpenAPIHandler(
    options: RegisterOpenAPIHandlerOptions
): OpenAPIDocumentInfo {
    const { authLevel, configuration, version, format, route, hostResolution } = options;

    // Generate route and function name
    const finalRoute = route || `openapi-${version}.${format}`;
    const functionName = `X_OpenAPI_${version.replace(/\./g, '_')}_${format === 'json' ? 'Json' : 'Yaml'}Handler`;

    // Per-(host,servers-shape) memoization. Different incoming hosts can legitimately
    // yield different `servers` arrays (when trustHostHeader is enabled), so the
    // cache key includes the resolved server URL set.
    const responseCache = new Map<string, string>();

    app.http(functionName, {
        methods: ['GET'],
        authLevel,
        handler: async (
            request: HttpRequest,
            context: InvocationContext
        ): Promise<HttpResponseInit> => {
            const safeUrl = redactSensitiveUrl(request.url);
            context.log(`Generating OpenAPI ${version} ${format} definition for "${safeUrl}"`);

            // Pre-process definitions: Convert webhooks to routes for OpenAPI < 3.1.0
            let definitions = openAPIRegistry.definitions;

            if (version !== '3.1.0') {
                context.log(
                    'Pre-processing: Converting webhooks to routes for OpenAPI version compatibility'
                );
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

                        context.log(
                            `Converting webhook "${originalWebhook.operationId}" to route at path "${originalWebhook.path}"`
                        );

                        // Create a modified route config with webhook metadata
                        const routeConfig: RouteConfig = {
                            ...originalWebhook,
                            summary: originalWebhook.summary
                                ? `[WEBHOOK] ${originalWebhook.summary}`
                                : `[WEBHOOK] ${originalWebhook.operationId}`,
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
                                  `In OpenAPI 3.1.0, this would be documented in the dedicated "webhooks" section.`,
                        };

                        (routeConfig as unknown as Record<string, unknown>)['x-webhook'] = true;
                        (routeConfig as unknown as Record<string, unknown>)['x-outbound-callback'] =
                            true;

                        // Convert webhook definition to route definition. The
                        // OpenAPIRegistry union narrows this to a discriminated
                        // type, so we route via `unknown` to keep TypeScript happy
                        // without resorting to `any`.
                        processedDefs.push({
                            type: 'route',
                            route: routeConfig,
                        } as unknown as typeof def);
                    } else {
                        processedDefs.push(def);
                    }
                }

                definitions = processedDefs;
                context.log(
                    `Pre-processing complete: ${processedDefs.length} definitions prepared`
                );
            }

            // Safely resolve the `servers` field.
            const servers = resolveServers(configuration.servers, request.url, hostResolution);

            // Build a stable cache key from the inputs that can vary per-request.
            const cacheKey = JSON.stringify(servers ?? null);
            let body = responseCache.get(cacheKey);
            const contentType = format === 'json' ? 'application/json' : 'application/x-yaml';

            if (!body) {
                const OpenApiGenerator =
                    version === '3.1.0' ? OpenApiGeneratorV31 : OpenApiGeneratorV3;

                let openAPIDefinition: OpenAPIObject = new OpenApiGenerator(
                    definitions
                ).generateDocument({
                    openapi: version,
                    info: configuration.info,
                    security: configuration.security,
                    ...(servers ? { servers } : {}),
                    externalDocs: configuration.externalDocs,
                    tags: configuration.tags,
                });

                if (version === '2.0') {
                    const converter = new Swagger2Converter(openAPIDefinition);
                    openAPIDefinition = converter.convert() as OpenAPIObject;
                }

                body =
                    format === 'yaml'
                        ? yamlStringify(openAPIDefinition)
                        : JSON.stringify(openAPIDefinition, null, 2);
                responseCache.set(cacheKey, body);
            }

            return {
                status: 200,
                headers: { 'Content-Type': contentType },
                body,
            };
        },
        route: finalRoute,
    });

    const formatName = format === 'json' ? 'JSON' : 'YAML';
    return {
        title: `${configuration.info.title} (${formatName} - OpenAPI ${version})`,
        url: finalRoute,
    };
}
