/**
 * Azure Function Keys security scheme implementation.
 * Native Azure Functions key-based authentication.
 * 
 * @see https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger#authorization-keys
 * 
 * @internal
 */

import type { SecurityRequirementObject } from '../../types';
import type { AzureFunctionKeyConfig, AuthLevel } from './types';
import { openAPIRegistry } from '../registry';

/**
 * Registers Azure Function Keys security scheme in the OpenAPI registry.
 * 
 * Azure Functions supports three authorization levels:
 * - anonymous: No key required
 * - function: Function-specific keys or host-level keys
 * - admin: Only master/admin keys (highest security)
 * 
 * Function keys can be provided in two ways:
 * - Query parameter: ?code=xxx (most common)
 * - Header: x-functions-key: xxx
 * 
 * @param config - Azure Function Key configuration
 * @returns Security requirement object for OpenAPI
 * 
 * @example Function-level authentication
 * ```typescript
 * const securityReq = registerAzureFunctionKey({
 *   name: 'AzureFunctionKey',
 *   authLevel: 'function',
 *   description: 'Azure Function key required'
 * });
 * ```
 * 
 * @example Admin-level authentication (master key only)
 * ```typescript
 * const securityReq = registerAzureFunctionKey({
 *   name: 'AdminKey',
 *   authLevel: 'admin',
 *   description: 'Admin/master key required for this operation'
 * });
 * ```
 * 
 * @internal
 */
export function registerAzureFunctionKey(config: AzureFunctionKeyConfig): SecurityRequirementObject {
    const {
        name,
        authLevel,
        description,
        allowQueryParameter = true,
        allowHeader = true,
    } = config;

    // Build description based on authLevel and allowed locations
    let schemeDescription = description || generateDescription(authLevel, allowQueryParameter, allowHeader);

    // For anonymous, document but don't require authentication
    if (authLevel === 'anonymous') {
        schemeDescription += ' (authentication not required but supported)';
    }

    // Register security scheme in OpenAPI registry
    // We model this as an API key since that's what Azure uses under the hood
    openAPIRegistry.registerComponent('securitySchemes', name, {
        type: 'apiKey',
        name: allowQueryParameter ? 'code' : 'x-functions-key',
        in: allowQueryParameter ? 'query' : 'header',
        description: schemeDescription,
        // Add vendor extension for Azure-specific metadata
        'x-azure-function-authLevel': authLevel,
        'x-azure-function-allowQuery': allowQueryParameter,
        'x-azure-function-allowHeader': allowHeader,
    } as any); // Cast to any to allow vendor extensions

    // Return security requirement
    return { [name]: [] };
}

/**
 * Generates description based on authLevel and allowed locations.
 * @internal
 */
function generateDescription(
    authLevel: AuthLevel,
    allowQueryParameter: boolean,
    allowHeader: boolean
): string {
    const levelDesc = getAuthLevelDescription(authLevel);
    const locationParts: string[] = [];
    
    if (allowQueryParameter) {
        locationParts.push('query parameter `code`');
    }
    if (allowHeader) {
        locationParts.push('header `x-functions-key`');
    }
    
    const locationDesc = locationParts.join(' or ');
    
    return `Azure Function ${levelDesc}. Provide the key via ${locationDesc}.`;
}

/**
 * Gets human-readable description for authLevel.
 * @internal
 */
function getAuthLevelDescription(authLevel: AuthLevel): string {
    switch (authLevel) {
        case 'anonymous':
            return 'anonymous access (no key required)';
        case 'function':
            return 'key authentication (function or host keys)';
        case 'admin':
            return 'admin key authentication (master key only)';
        default:
            return 'key authentication';
    }
}

/**
 * Validates authLevel value.
 * @internal
 */
export function isValidAuthLevel(value: string): value is AuthLevel {
    return value === 'anonymous' || value === 'function' || value === 'admin';
}

/**
 * Default Azure Function Key configuration.
 * @internal
 */
export const DEFAULT_AZURE_FUNCTION_KEY_CONFIG: Partial<AzureFunctionKeyConfig> = {
    authLevel: 'function',
    allowQueryParameter: true,
    allowHeader: true,
    description: undefined, // Auto-generated
};
