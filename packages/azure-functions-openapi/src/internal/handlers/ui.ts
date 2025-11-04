import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIDocumentInfo } from "../../types";

/**
 * Allowed Swagger UI static files with their content types.
 * This whitelist prevents path traversal attacks.
 */
const ALLOWED_SWAGGER_FILES: Record<string, { path: string; contentType: string }> = {
    'swagger-ui.css': { 
        path: 'swagger-ui.css', 
        contentType: 'text/css' 
    },
    'swagger-ui-bundle.js': { 
        path: 'swagger-ui-bundle.js', 
        contentType: 'application/javascript' 
    },
    'swagger-ui-standalone-preset.js': { 
        path: 'swagger-ui-standalone-preset.js', 
        contentType: 'application/javascript' 
    }
};

/**
 * Registers Swagger UI handlers for Azure Functions.
 * This function is internal and should not be called directly - use app.openapi() instead.
 * 
 * Creates two HTTP GET endpoints:
 * - Custom UI route (default: `/swagger-ui`) - Serves the Swagger UI HTML page
 * - Custom assets route (automatically: `/{uiRoute}/assets/{file}`) - Serves static assets (CSS, JS) from swagger-ui-dist package
 * 
 * The implementation serves files from local node_modules with monorepo support,
 * falling back to root node_modules if not found locally.
 *
 * @param authLevel - Authorization level required to access Swagger UI
 * @param routePrefix - Route prefix for the Azure Function (used to construct document URLs)
 * @param openAPIDocuments - Array of OpenAPI documents to display in the UI
 * @param uiRoute - Custom route for the Swagger UI page (default: 'swagger-ui'). Assets route will be automatically constructed as `{uiRoute}/assets/{file}`
 * 
 * @internal
 */
export function registerSwaggerUIHandler(
    authLevel: 'anonymous' | 'function' | 'admin',
    routePrefix: string | null,
    openAPIDocuments: OpenAPIDocumentInfo[],
    uiRoute: string = 'swagger-ui'
): void {
    // Construct assets route automatically based on UI route
    // e.g., 'swagger-ui' → 'swagger-ui/assets/{file}'
    // e.g., 'docs' → 'docs/assets/{file}'
    const assetsRoute = `${uiRoute}/assets/{file}`;
    const assetsBasePath = `${uiRoute}/assets`;
    
    /**
     * Handler for serving Swagger UI static assets.
     * Supports monorepo structure by checking both local and root node_modules.
     */
    const assetsHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const file = request.params.file;
        
        // Validate file against whitelist
        if (!file || !ALLOWED_SWAGGER_FILES[file]) {
            context.warn(`Attempted to access non-whitelisted file: ${file}`);
            return { 
                status: 404, 
                body: 'File not found' 
            };
        }
        
        const fileConfig = ALLOWED_SWAGGER_FILES[file];
        
        // Try local node_modules first, then root node_modules (monorepo support)
        const localPath = path.join(process.cwd(), 'node_modules/swagger-ui-dist', fileConfig.path);
        const rootPath = path.join(process.cwd(), '../../node_modules/swagger-ui-dist', fileConfig.path);
        
        let filePath: string;
        if (fs.existsSync(localPath)) {
            filePath = localPath;
        } else if (fs.existsSync(rootPath)) {
            filePath = rootPath;
        } else {
            context.error(`Swagger UI file not found: ${file}. Please ensure swagger-ui-dist is installed.`);
            return {
                status: 404,
                body: 'Swagger UI assets not found. Please install swagger-ui-dist package.'
            };
        }
        
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const stats = fs.statSync(filePath);
            
            return {
                status: 200,
                headers: {
                    'content-type': fileConfig.contentType,
                    'cache-control': 'public, max-age=86400', // Cache for 24 hours
                    'etag': `"${stats.mtime.getTime()}"` // Use file modification time for ETag
                },
                body: fileContent
            };
        } catch (error) {
            context.error(`Error reading Swagger UI file "${file}": ${error}`);
            return {
                status: 500,
                body: 'Internal server error'
            };
        }
    };
    
    /**
     * Handler for serving the main Swagger UI HTML page.
     */
    const uiHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        context.log(`Serving Swagger UI for "${request.url}"`);
        
        // Build URLs for OpenAPI documents
        const urls = openAPIDocuments.map(doc => ({
            url: routePrefix ? `/${routePrefix}/${doc.url}` : `/${doc.url}`,
            name: doc.title
        }));
        
        // Construct base path for static assets (respecting routePrefix)
        const assetBase = routePrefix ? `/${routePrefix}/${assetsBasePath}` : `/${assetsBasePath}`;
        
        // Generate Swagger UI HTML with local assets
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="SwaggerUI" />
    <title>SwaggerUI</title>
    <link rel="stylesheet" type="text/css" href="${assetBase}/swagger-ui.css" />
    <script src="${assetBase}/swagger-ui-bundle.js" crossorigin></script>
    <script src="${assetBase}/swagger-ui-standalone-preset.js" crossorigin></script>
</head>
<body>
    <div id="swagger-ui"></div>
    <script>
        window.swaggerUI = SwaggerUIBundle({
            urls: ${JSON.stringify(urls)},
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            layout: "StandaloneLayout"
        });
    </script>
</body>
</html>`;
        
        return {
            status: 200,
            headers: { "Content-Type": "text/html" },
            body: html
        };
    };
    
    // Register static assets handler
    app.http('X_SwaggerUIAssetsHandler', {
        methods: ['GET'],
        authLevel,
        handler: assetsHandler,
        route: assetsRoute
    });
    
    // Register main UI handler
    app.http('X_SwaggerUIHandler', {
        methods: ['GET'],
        authLevel,
        handler: uiHandler,
        route: uiRoute
    });
}