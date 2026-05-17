import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { promises as fsp } from 'fs';
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
 * In-process cache for Swagger UI assets. Static files are read once and kept in
 * memory to avoid synchronous disk I/O on every request, which is harmful on
 * Azure Functions where a single host process handles many concurrent invocations.
 *
 * Cache key is the whitelist filename. The cached entry contains:
 *  - content: the file body as a UTF-8 string
 *  - etag: a stable identifier derived from the file modification time
 */
interface CachedAsset {
    content: string;
    etag: string;
}
const ASSET_CACHE = new Map<string, CachedAsset>();

/**
 * Resolves a Swagger UI asset path on disk, supporting both the package's own
 * `node_modules` and a hoisted monorepo root. Returned promise resolves to
 * `null` if the asset cannot be located.
 *
 * @internal
 */
async function resolveAssetPath(relativePath: string): Promise<string | null> {
    const candidates = [
        path.join(process.cwd(), 'node_modules/swagger-ui-dist', relativePath),
        path.join(process.cwd(), '../../node_modules/swagger-ui-dist', relativePath),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

/**
 * Returns a cached asset entry, populating the cache on first access.
 *
 * @internal
 */
async function loadAsset(file: string): Promise<CachedAsset | null> {
    const cached = ASSET_CACHE.get(file);
    if (cached) return cached;

    const fileConfig = ALLOWED_SWAGGER_FILES[file];
    if (!fileConfig) return null;

    const filePath = await resolveAssetPath(fileConfig.path);
    if (!filePath) return null;

    const [content, stats] = await Promise.all([
        fsp.readFile(filePath, 'utf8'),
        fsp.stat(filePath),
    ]);
    const entry: CachedAsset = {
        content,
        etag: `"${stats.mtime.getTime()}"`,
    };
    ASSET_CACHE.set(file, entry);
    return entry;
}

/**
 * Registers Swagger UI handlers for Azure Functions.
 * This function is internal and should not be called directly - use app.openAPISetup() instead.
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

        try {
            const asset = await loadAsset(file);
            if (!asset) {
                context.error(`Swagger UI file not found: ${file}. Please ensure swagger-ui-dist is installed.`);
                return {
                    status: 404,
                    body: 'Swagger UI assets not found. Please install swagger-ui-dist package.'
                };
            }

            // Conditional GET via ETag — clients re-using the same UI page can skip the body.
            const ifNoneMatch = request.headers.get('if-none-match');
            if (ifNoneMatch && ifNoneMatch === asset.etag) {
                return {
                    status: 304,
                    headers: {
                        'cache-control': 'public, max-age=86400',
                        'etag': asset.etag,
                    },
                };
            }

            return {
                status: 200,
                headers: {
                    'content-type': fileConfig.contentType,
                    'cache-control': 'public, max-age=86400',
                    'etag': asset.etag,
                },
                body: asset.content,
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