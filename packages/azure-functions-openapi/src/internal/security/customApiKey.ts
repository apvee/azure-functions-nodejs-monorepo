/**
 * Custom API Key security scheme implementation.
 * For user-implemented API key validation (not Azure native Function Keys).
 * 
 * @internal
 */

import type { SecurityRequirementObject } from '../../types';
import type { CustomApiKeyConfig } from './types';
import { openAPIRegistry } from '../registry';

/**
 * Registers a custom API key security scheme in the OpenAPI registry.
 * This is for user-implemented API key validation, NOT for Azure Function Keys.
 * 
 * The API key can be provided in:
 * - Query parameter: ?api_key=xxx
 * - Header: X-API-Key: xxx
 * - Cookie: session=xxx
 * 
 * Users must implement their own validation logic in the handler.
 * 
 * @param config - Custom API key configuration
 * @returns Security requirement object for OpenAPI
 * 
 * @example
 * ```typescript
 * const securityReq = registerCustomApiKey({
 *   name: 'CustomApiKey',
 *   in: 'header',
 *   parameterName: 'X-API-Key',
 *   description: 'Custom API key for application access'
 * });
 * ```
 * 
 * @internal
 */
export function registerCustomApiKey(config: CustomApiKeyConfig): SecurityRequirementObject {
    // Register security scheme in OpenAPI registry
    openAPIRegistry.registerComponent('securitySchemes', config.name, {
        type: 'apiKey',
        name: config.parameterName,
        in: config.in,
        description: config.description || `API key provided in ${config.in}: ${config.parameterName}`,
    });

    // Return security requirement
    return { [config.name]: [] };
}

/**
 * Default custom API key configuration.
 * Maintains backward compatibility with existing openapiKeySecurity API.
 * 
 * @internal
 */
export const DEFAULT_CUSTOM_API_KEY_CONFIG: Omit<CustomApiKeyConfig, 'name' | 'parameterName'> = {
    in: 'header',
    description: 'Custom API key for authentication (user-implemented validation)',
};
