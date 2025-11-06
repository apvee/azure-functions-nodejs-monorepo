import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { SecurityRequirementObject } from "../types";
import { openAPIRegistry } from "./registry";
import {
    registerCustomApiKey,
    registerAzureFunctionKey,
    registerAzureEasyAuth,
    registerAzureADBearer,
    registerAzureADClientCredentials,
    type CustomApiKeyConfig,
    type AzureFunctionKeyConfig,
    type AzureEasyAuthConfig,
    type AzureADBearerConfig,
    type AzureADClientCredentialsConfig,
} from "./security";

// Extend Zod with OpenAPI metadata support
extendZodWithOpenApi(z);

/**
 * Registers a Zod schema as a named type in the OpenAPI registry.
 * 
 * @internal
 * This is an internal implementation function. Do not use directly.
 * Use app.openapiSchema() instead.
 * 
 * This allows the schema to be referenced by name in OpenAPI documentation,
 * promoting reusability and keeping the generated spec cleaner.
 *
 * @param typeName - The name to register the schema under (e.g., 'User', 'Product')
 * @param schema - The Zod schema to register
 */
export function registerTypeSchema(typeName: string, schema: z.ZodTypeAny): void {
    openAPIRegistry.register(typeName, schema);
}

// ============================================================================
// Custom API Key Security (user-implemented validation)
// ============================================================================

/**
 * Sanitizes a parameter name to create a valid OpenAPI security scheme name.
 * Converts to PascalCase and removes special characters.
 * 
 * @param paramName - The parameter name (e.g., 'X-API-Key', 'api_key', 'code')
 * @returns Sanitized scheme name (e.g., 'XApiKey', 'ApiKey', 'Code')
 * 
 * @internal
 */
function sanitizeSchemeNameFromParameter(paramName: string): string {
    // Replace special characters with underscore, then split by underscore
    const parts = paramName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .split('_')
        .filter(part => part.length > 0);
    
    // Convert to PascalCase
    const pascalCase = parts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
    
    // Ensure it starts with a letter (prepend 'Key' if starts with number)
    if (/^\d/.test(pascalCase)) {
        return 'Key' + pascalCase;
    }
    
    return pascalCase || 'ApiKey'; // Fallback to 'ApiKey' if empty
}

/**
 * Registers an API key security schema in the OpenAPI registry.
 * This is for CUSTOM API keys with user-implemented validation logic.
 * For native Azure Function Keys, use registerAzureFunctionKeySecurity instead.
 * 
 * The security scheme name is automatically generated from the parameter name
 * to prevent conflicts when multiple API keys are registered.
 * 
 * @internal
 * This is an internal implementation function. Do not use directly.
 * Use app.openapiKeySecurity() or app.openapiCustomApiKey() instead.
 * 
 * This creates a security scheme that requires an API key to be provided in the specified location
 * (header, query parameter, or cookie). The security requirement can then be applied to endpoints.
 *
 * @param name - The name of the API key parameter (e.g., 'X-API-KEY', 'apiKey', 'session')
 * @param input - The location where the API key should be provided
 * @param description - Optional description for the security scheme
 * @returns A security requirement object to use in endpoint configurations
 * 
 * @example
 * ```typescript
 * // Parameter name 'X-API-Key' generates scheme name 'XApiKey'
 * const sec1 = registerApiKeySecuritySchema('X-API-Key', 'header');
 * // Returns: { XApiKey: [] }
 * 
 * // Parameter name 'api_key' generates scheme name 'ApiKey'
 * const sec2 = registerApiKeySecuritySchema('api_key', 'query');
 * // Returns: { ApiKey: [] }
 * 
 * // No conflicts - each has unique scheme name
 * ```
 */
export function registerApiKeySecuritySchema(
    name: string,
    input: 'header' | 'query' | 'cookie',
    description?: string
): SecurityRequirementObject {
    // Generate unique scheme name from parameter name to prevent conflicts
    const schemeName = sanitizeSchemeNameFromParameter(name);
    
    // Use the new customApiKey module with auto-generated scheme name
    const config: CustomApiKeyConfig = {
        name: schemeName,
        parameterName: name,
        in: input,
        description: description || `Custom API key provided in ${input}: ${name}`,
    };

    return registerCustomApiKey(config);
}

// ============================================================================
// Azure Function Keys Security (native Azure authentication)
// ============================================================================

/**
 * Registers Azure Function Keys security schema in the OpenAPI registry.
 * This is for native Azure Functions key-based authentication.
 * 
 * @internal
 * This is an internal implementation function. Do not use directly.
 * Use app.openapiAzureFunctionKey() instead.
 * 
 * @param config - Azure Function Key configuration
 * @returns Security requirement object
 */
export function registerAzureFunctionKeySecurity(
    config: AzureFunctionKeyConfig
): SecurityRequirementObject {
    return registerAzureFunctionKey(config);
}

// ============================================================================
// Azure EasyAuth Security
// ============================================================================

/**
 * Registers Azure EasyAuth security schema in the OpenAPI registry.
 * This is for Azure App Service Authentication (EasyAuth).
 * 
 * @internal
 * This is an internal implementation function. Do not use directly.
 * Use app.openapiEasyAuth() instead.
 * 
 * @param config - Azure EasyAuth configuration
 * @returns Security requirement object
 */
export function registerAzureEasyAuthSecurity(
    config: AzureEasyAuthConfig
): SecurityRequirementObject {
    return registerAzureEasyAuth(config);
}

// ============================================================================
// Azure AD Bearer Token Security
// ============================================================================

/**
 * Registers Azure AD Bearer Token security schema in the OpenAPI registry.
 * This is for manual JWT validation from Microsoft Entra ID.
 * 
 * @internal
 * This is an internal implementation function. Do not use directly.
 * Use app.openapiAzureADBearer() instead.
 * 
 * @param config - Azure AD Bearer Token configuration
 * @returns Security requirement object
 */
export function registerAzureADBearerSecurity(
    config: AzureADBearerConfig
): SecurityRequirementObject {
    return registerAzureADBearer(config);
}

// ============================================================================
// Azure AD Client Credentials Security
// ============================================================================

/**
 * Registers Azure AD Client Credentials security schema in the OpenAPI registry.
 * This is for service-to-service (daemon) authentication.
 * 
 * @internal
 * This is an internal implementation function. Do not use directly.
 * Use app.openapiAzureADClientCredentials() instead.
 * 
 * @param config - Azure AD Client Credentials configuration
 * @returns Security requirement object
 */
export function registerAzureADClientCredentialsSecurity(
    config: AzureADClientCredentialsConfig
): SecurityRequirementObject {
    return registerAzureADClientCredentials(config);
}

