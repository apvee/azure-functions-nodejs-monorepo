import '@apvee/azure-functions-openapi';
import { app } from '@azure/functions';

app.setup({
    enableHttpStream: true
});

/**
 * Azure Function Keys security scheme.
 * Uses native Azure Functions key-based authentication.
 * Keys can be provided via:
 * - Query parameter: ?code=YOUR_FUNCTION_KEY
 * - Header: x-functions-key: YOUR_FUNCTION_KEY
 * 
 * Exported for use in function registrations.
 */
export const functionKeySecurity = app.openapiAzureFunctionKey('function');

/**
 * Configure OpenAPI documentation with all versions and formats.
 * This single call replaces multiple registerOpenAPIHandler and registerSwaggerUIHandler calls.
 */
app.openapiSetup({
    routePrefix: 'api',
    authLevel: 'function',
    security: [functionKeySecurity],
    info: {
        title: 'Simple Todo REST API',
        version: "1",
        contact: {
            name: "Apvee Solutions",
            email: "hello@apvee.com",
            url: "https://www.apvee.com"
        }
    },
    externalDocs: {
        description: "External Documentation",
        url: "https://www.apvee.com"
    },
    tags: [{
        name: "Todos",
        description: "My Tag Description",
        externalDocs: {
            description: "External Documentation",
            url: "https://www.apvee.com"
        }
    }],
    versions: ['2.0', '3.0.3', '3.1.0'],
    formats: ['json', 'yaml'],
    swaggerUI: {
        enabled: true
    }
});
