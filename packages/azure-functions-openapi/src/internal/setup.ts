import { OpenAPIDocumentInfo, OpenAPISetupConfig } from '../types';
import { globalConfigManager } from './config';
import { registerOpenAPIHandler } from './handlers/docs';
import { registerSwaggerUIHandler } from './handlers/ui';

/**
 * Sets up OpenAPI documentation and Swagger UI for Azure Functions.
 * This function is assigned to app.openapiSetup() and should be called once during app initialization.
 * 
 * @param config - Configuration for OpenAPI setup
 * @returns Array of generated OpenAPI document information
 * 
 * @example
 * ```typescript
 * app.openapiSetup({
 *   info: { title: 'My API', version: '1.0.0' },
 *   routePrefix: 'api',
 *   versions: ['3.1.0', '3.0.3'],
 *   formats: ['json', 'yaml'],
 *   swaggerUI: { enabled: true }
 * });
 * ```
 * @internal
 */
export function setupOpenAPI(config: OpenAPISetupConfig): OpenAPIDocumentInfo[] {
    // Store global configuration for use by registerFunction
    globalConfigManager.setConfig({
        routePrefix: config.routePrefix || 'api',
        openAPIConfig: {
            info: config.info,
            security: config.security,
            externalDocs: config.externalDocs,
            tags: config.tags,
            servers: config.servers
        }
    });

    // Default values
    const versions = config.versions || ['3.1.0'];
    const formats = config.formats || ['json', 'yaml'];
    const authLevel = config.authLevel || 'anonymous';
    const routePrefix = config.routePrefix || 'api';

    // Generate OpenAPI documents for all version/format combinations
    const documents: OpenAPIDocumentInfo[] = [];
    
    for (const version of versions) {
        for (const format of formats) {
            const document = registerOpenAPIHandler(
                authLevel,
                globalConfigManager.getOpenAPIConfig(),
                version,
                format
            );
            documents.push(document);
        }
    }

    // Setup Swagger UI if enabled (default: true)
    if (config.swaggerUI?.enabled !== false) {
        const swaggerAuthLevel = config.swaggerUI?.authLevel || authLevel;
        const swaggerUIRoute = config.swaggerUI?.route || 'swagger-ui';
        
        registerSwaggerUIHandler(
            swaggerAuthLevel, 
            routePrefix, 
            documents,
            swaggerUIRoute
        );
    }

    return documents;
}
