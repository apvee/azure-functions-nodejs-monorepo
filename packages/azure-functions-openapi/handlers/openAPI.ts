import { OpenApiGeneratorV3, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { stringify as yamlStringify } from 'yaml';
import Converter from "../core/openAPI3ToSwagger2";
import { registry } from "../core/registry";
import { OpenAPIDocumentInfo, OpenAPIObject, OpenAPIObjectConfig } from "../core/types";

/**
 * Registers an OpenAPI handler for an Azure Function.
 *
 * @param {'anonymous' | 'function' | 'admin'} authLevel - The authorization level required to access the function.
 * @param {OpenAPIObjectConfig} configuration - The OpenAPI configuration object containing information about the API.
 * @param {'2.0' | '3.0.3' | '3.1.0'} version - The OpenAPI version to use.
 * @param {'json' | 'yaml'} format - The format of the OpenAPI document.
 * @param {string} [route] - Optional. The route at which the OpenAPI document will be served. If not provided, a default route will be used based on the format and version.
 * @returns {OpenAPIDocumentInfo} An object containing the title and URL of the registered OpenAPI document.
 */
export function registerOpenAPIHandler(
    authLevel: 'anonymous' | 'function' | 'admin',
    configuration: OpenAPIObjectConfig,
    version: '2.0' | '3.0.3' | '3.1.0',
    format: 'json' | 'yaml',
    route?: string,
): OpenAPIDocumentInfo {
    const finalRoute = route || ((format === "json") ? `openapi-${version}.json` : `openapi-${version}.yaml`);
    const functionName = `X_OpenAPI_${version.split('.').join('_')}_${format === 'json' ? 'Json' : 'Yaml'}Handler`;

    app.http(functionName, {
        methods: ['GET'],
        authLevel: authLevel,
        handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
            context.log(`Invoking OpenAPI ${version} ${format} definition handler for url "${request.url}"`);

            const openApiGenerator = version === '3.1.0' ? OpenApiGeneratorV31 : OpenApiGeneratorV3;
            let openAPIDefinition: OpenAPIObject = new openApiGenerator(registry.definitions)
                .generateDocument({
                    openapi: version,
                    info: configuration.info,
                    security: configuration.security,
                    servers: configuration.servers || [{ url: `${new URL(request.url).origin}` }],
                    externalDocs: configuration.externalDocs,
                    tags: configuration.tags
                });

            if (version === '2.0') {
                const converter = new Converter(openAPIDefinition);
                openAPIDefinition = converter.convert() as OpenAPIObject;
            }

            return {
                status: 200,
                headers: { 'Content-Type': format === 'json' ? 'application/json' : 'application/x-yaml' },
                body: (format === 'yaml') 
                    ? yamlStringify(openAPIDefinition) 
                    : JSON.stringify(openAPIDefinition, null, 2),
            };
        },
        route: finalRoute
    });

    return { title: `${configuration.info.title} (${format === 'json' ? 'Json' : 'Yaml'} - OpenAPI ${version})`, url: finalRoute };
}