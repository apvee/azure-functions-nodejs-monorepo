/**
 * @internal
 * Transformation utilities to convert simplified API shortcuts to astea RouteConfig format.
 */

import { RouteConfig } from '@asteasolutions/zod-to-openapi';
import { ContentTypeConfig, FunctionRouteConfig, ResponseConfig } from '../types';
import { getLogger } from './logger';

/**
 * HTTP status code descriptions mapping.
 * Used to auto-generate response descriptions when not provided.
 */
const STATUS_CODE_DESCRIPTIONS: Record<number, string> = {
    // 2xx Success
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',

    // 3xx Redirection
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',

    // 4xx Client Errors
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: "I'm a teapot",
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',

    // 5xx Server Errors
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    510: 'Not Extended',
    511: 'Network Authentication Required',
};

/**
 * Get default description for an HTTP status code.
 */
function getStatusCodeDescription(code: number): string {
    return STATUS_CODE_DESCRIPTIONS[code] || `HTTP ${code}`;
}

/**
 * Transform ContentTypeConfig array to OpenAPI content object.
 * Handles both structured content (with schema) and binary content (without schema).
 */
function transformContentTypes(contentTypes: ContentTypeConfig[]): Record<string, unknown> {
    const content: Record<string, Record<string, unknown>> = {};

    for (const ct of contentTypes) {
        const contentDef: Record<string, unknown> = {};

        // Schema is optional (for binary content like PDFs, images)
        if (ct.schema) {
            contentDef.schema = ct.schema;
        }

        if (ct.examples) {
            contentDef.examples = ct.examples;
        }

        if (ct.encoding) {
            contentDef.encoding = ct.encoding;
        }

        content[ct.mediaType] = contentDef;
    }

    return content;
}

/**
 * Transform a single ResponseConfig to OpenAPI response format.
 */
function transformResponse(response: ResponseConfig): Record<string, unknown> {
    const description = response.description || getStatusCodeDescription(response.httpCode);

    // Validation: schema and content are mutually exclusive
    if (response.schema && response.content) {
        throw new Error(
            `Response ${response.httpCode}: Cannot use both 'schema' and 'content'. ` +
                `Use 'schema' for single content type, 'content' array for multiple content types.`
        );
    }

    // Case 1: Multiple content types (explicit)
    if (response.content) {
        // Validate no duplicate mediaTypes
        const mediaTypes = new Set<string>();
        for (const ct of response.content) {
            if (mediaTypes.has(ct.mediaType)) {
                throw new Error(
                    `Response ${response.httpCode}: Duplicate mediaType '${ct.mediaType}' in content array`
                );
            }
            mediaTypes.add(ct.mediaType);
        }

        return {
            description,
            content: transformContentTypes(response.content),
            ...(response.headers && { headers: response.headers }),
        };
    }

    // Case 2: Single content type (shortcut)
    if (response.schema) {
        const mediaType = response.mediaType || 'application/json';

        return {
            description,
            content: {
                [mediaType]: {
                    schema: response.schema,
                    ...(response.examples && { examples: response.examples }),
                },
            },
            ...(response.headers && { headers: response.headers }),
        };
    }

    // Case 3: No body (e.g., 204 No Content, 304 Not Modified)
    // Validation: warn if 2xx status without body (except allowed codes)
    const allowedNoBody = [204, 205, 304]; // No Content, Reset Content, Not Modified
    if (
        !allowedNoBody.includes(response.httpCode) &&
        response.httpCode >= 200 &&
        response.httpCode < 300
    ) {
        getLogger().warn(
            `Response ${response.httpCode} has no schema or content. ` +
                `This is unusual for successful 2xx responses. ` +
                `Did you forget to add a schema? If this is intentional (e.g., 202 Accepted with async processing), ignore this warning.`
        );
    }

    return {
        description,
        ...(response.headers && { headers: response.headers }),
    };
}

/**
 * Transform responses array to OpenAPI responses object.
 */
function transformResponses(responses: ResponseConfig[]): Record<number, Record<string, unknown>> {
    const result: Record<number, Record<string, unknown>> = {};

    // Validate no duplicate httpCodes
    const httpCodes = new Set<number>();
    for (const response of responses) {
        if (httpCodes.has(response.httpCode)) {
            throw new Error(`Duplicate httpCode: ${response.httpCode}`);
        }
        httpCodes.add(response.httpCode);

        result[response.httpCode] = transformResponse(response);
    }

    return result;
}

/**
 * Transform request shortcuts to OpenAPI request object.
 */
function transformRequest(config: FunctionRouteConfig): RouteConfig['request'] | undefined {
    // Validation: shortcuts and request are mutually exclusive
    const hasShortcuts = !!(config.params || config.query || config.body || config.headers);

    if (config.request && hasShortcuts) {
        getLogger().warn(
            'Both "request" and shortcuts (params/query/body/headers) are provided. ' +
                'The shortcuts will be IGNORED. Use either shortcuts OR request, not both. ' +
                'See FunctionRouteConfig.request JSDoc for details.'
        );
    }

    // If explicit request object provided, use it as-is (shortcuts are ignored)
    if (config.request) {
        return config.request;
    }

    // Build request object from shortcuts
    if (!hasShortcuts) {
        return undefined;
    }

    const request: RouteConfig['request'] = {};

    if (config.params) {
        // `RouteConfig['request']['params']` is a generic `ZodObject<…>` shape from astea;
        // we re-narrow through `unknown` instead of using an explicit `any`.
        request.params = config.params as unknown as NonNullable<
            NonNullable<RouteConfig['request']>['params']
        >;
    }

    if (config.query) {
        request.query = config.query as unknown as NonNullable<
            NonNullable<RouteConfig['request']>['query']
        >;
    }

    if (config.body) {
        request.body = {
            content: {
                'application/json': {
                    schema: config.body,
                },
            },
        };
    }

    if (config.headers) {
        request.headers = config.headers as unknown as NonNullable<
            NonNullable<RouteConfig['request']>['headers']
        >;
    }

    return request;
}

/**
 * Transform FunctionRouteConfig to astea RouteConfig format.
 * Converts all shortcuts and conveniences to the full OpenAPI structure.
 */
export function transformToRouteConfig(config: FunctionRouteConfig): RouteConfig {
    // Validation: response and responses are mutually exclusive
    if (config.response && config.responses) {
        throw new Error(
            "Cannot use both 'response' and 'responses'. " +
                "Use 'response' for single 200 OK response, 'responses' for multiple status codes."
        );
    }

    // Build responses
    let responses: NonNullable<RouteConfig['responses']> | undefined;

    if (config.response) {
        // Shortcut: single response assumes 200 OK with JSON
        responses = {
            200: {
                description: 'OK',
                content: {
                    'application/json': {
                        schema: config.response,
                    },
                },
            },
        };
    } else if (config.responses) {
        responses = transformResponses(config.responses) as unknown as NonNullable<
            RouteConfig['responses']
        >;
    }

    // Build request
    const request = transformRequest(config);

    // Build final RouteConfig (the loose `Record<string, unknown>` mirrors astea's format
    // and avoids modelling the union of optional fields here).
    const routeConfig: Record<string, unknown> = {
        ...(request && { request }),
        ...(responses && { responses }),
        ...(config.tags && { tags: config.tags }),
        ...(config.description && { description: config.description }),
        ...(config.deprecated && { deprecated: config.deprecated }),
        ...(config.security && { security: config.security }),
        ...(config.operationId && { operationId: config.operationId }),
    };

    return routeConfig as RouteConfig;
}
