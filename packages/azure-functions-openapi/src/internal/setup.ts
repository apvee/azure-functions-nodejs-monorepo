import { OpenAPIDocumentInfo, OpenAPISetupConfig } from '../types';
import { globalConfigManager } from './config';
import { registerOpenAPIHandler } from './handlers/docs';
import { registerSwaggerUIHandler } from './handlers/ui';
import { getLogger } from './logger';
import { isRunningOnAzure } from './sanitize';

/**
 * Sets up OpenAPI documentation and Swagger UI for Azure Functions.
 * This function is assigned to app.openAPISetup() and should be called once during app initialization.
 *
 * @param config - Configuration for OpenAPI setup
 * @returns Array of generated OpenAPI document information
 *
 * @internal
 */
export function setupOpenAPI(config: OpenAPISetupConfig): OpenAPIDocumentInfo[] {
    // Default values
    const versions = config.versions || ['3.1.0'];
    const formats = config.formats || ['json', 'yaml'];
    const authLevel = config.authLevel || 'anonymous';
    const routePrefix = config.routePrefix || 'api';
    const trustHostHeader = config.trustHostHeader === true;
    const trustedHosts = (config.trustedHosts ?? []).map((h) => h.toLowerCase());

    // Surface a clear warning when an anonymous OpenAPI surface is being deployed
    // to Azure. The OpenAPI document discloses every route + schema and is a high
    // value reconnaissance asset; making this explicit avoids accidental exposure.
    if (authLevel === 'anonymous' && isRunningOnAzure()) {
        getLogger().warn(
            '[openapi] OpenAPI endpoints are configured with authLevel="anonymous" while running ' +
                'on Azure (WEBSITE_SITE_NAME detected). This exposes the full API surface publicly. ' +
                'Consider authLevel="function" or "admin", or fronting the app with APIM / EasyAuth.'
        );
    }

    // Store global configuration for use by openAPIPath/openAPIWebhook
    globalConfigManager.setConfig({
        routePrefix,
        defaultAuthLevel: authLevel,
        openAPIConfig: {
            info: config.info,
            security: config.security,
            externalDocs: config.externalDocs,
            tags: config.tags,
            servers: config.servers,
        },
    });

    // Generate OpenAPI documents for all version/format combinations
    const documents: OpenAPIDocumentInfo[] = [];

    for (const version of versions) {
        for (const format of formats) {
            const document = registerOpenAPIHandler({
                authLevel,
                configuration: globalConfigManager.getOpenAPIConfig(),
                version,
                format,
                hostResolution: {
                    trustHostHeader,
                    trustedHosts,
                },
            });
            documents.push(document);
        }
    }

    // Setup Swagger UI if enabled (default: true)
    if (config.swaggerUI?.enabled !== false) {
        const swaggerAuthLevel = config.swaggerUI?.authLevel || authLevel;
        const swaggerUIRoute = config.swaggerUI?.route || 'swagger-ui';

        registerSwaggerUIHandler(swaggerAuthLevel, routePrefix, documents, swaggerUIRoute);
    }

    return documents;
}
