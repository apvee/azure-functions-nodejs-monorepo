/**
 * Azure AD Bearer Token security scheme implementation.
 * For manual JWT validation from Microsoft Entra ID.
 * 
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
 * 
 * @internal
 */

import type { SecurityRequirementObject } from '../../types';
import type { AzureADBearerConfig } from './types';
import { openAPIRegistry } from '../registry';

/**
 * Registers Azure AD Bearer Token security scheme in the OpenAPI registry.
 * 
 * This is for scenarios where:
 * - You want manual control over JWT validation
 * - You're NOT using Azure EasyAuth
 * - You need to validate Azure AD tokens directly in your function
 * 
 * The Bearer token should be provided in the Authorization header:
 * Authorization: Bearer {token}
 * 
 * Users must implement JWT validation logic themselves using libraries like:
 * - @azure/msal-node
 * - jsonwebtoken
 * - express-jwt
 * 
 * @param config - Azure AD Bearer Token configuration
 * @returns Security requirement object for OpenAPI
 * 
 * @example Basic Bearer token authentication
 * ```typescript
 * const securityReq = registerAzureADBearer({
 *   name: 'AzureADBearer',
 *   tenantId: '11111111-1111-1111-1111-111111111111',
 *   audience: 'api://my-function-app',
 *   description: 'Azure AD Bearer token required'
 * });
 * ```
 * 
 * @example With required scopes
 * ```typescript
 * const securityReq = registerAzureADBearer({
 *   name: 'AzureADBearer',
 *   tenantId: '11111111-1111-1111-1111-111111111111',
 *   audience: 'api://my-function-app',
 *   scopes: ['User.Read', 'Mail.Send'],
 *   description: 'Azure AD token with User.Read and Mail.Send scopes'
 * });
 * ```
 * 
 * @internal
 */
export function registerAzureADBearer(config: AzureADBearerConfig): SecurityRequirementObject {
    const {
        name,
        tenantId,
        audience,
        issuer,
        scopes = [],
        description,
    } = config;

    // Build description
    const parts: string[] = [];
    parts.push(description || 'Azure AD Bearer token authentication (manual JWT validation).');
    
    if (tenantId) {
        parts.push(`Expected tenant: ${tenantId}.`);
    }
    if (audience) {
        parts.push(`Expected audience: ${audience}.`);
    }
    if (scopes.length > 0) {
        parts.push(`Required scopes: ${scopes.join(', ')}.`);
    }
    
    const schemeDescription = parts.join(' ');

    // Build OpenID Connect URLs
    const tenantPath = tenantId || 'common';
    const authorizationUrl = `https://login.microsoftonline.com/${tenantPath}/oauth2/v2.0/authorize`;
    const tokenUrl = `https://login.microsoftonline.com/${tenantPath}/oauth2/v2.0/token`;
    const openIdConfigUrl = `https://login.microsoftonline.com/${tenantPath}/v2.0/.well-known/openid-configuration`;

    // Build scopes object for OpenAPI
    const scopesObject: Record<string, string> = {};
    for (const scope of scopes) {
        scopesObject[scope] = `Required scope: ${scope}`;
    }

    // Register as OpenID Connect (more accurate than plain Bearer)
    openAPIRegistry.registerComponent('securitySchemes', name, {
        type: 'openIdConnect',
        description: schemeDescription,
        openIdConnectUrl: openIdConfigUrl,
        // Add vendor extension for Azure-specific metadata
        'x-azure-ad': true,
        'x-azure-ad-tenantId': tenantId,
        'x-azure-ad-audience': audience,
        'x-azure-ad-issuer': issuer,
        'x-azure-ad-authorizationUrl': authorizationUrl,
        'x-azure-ad-tokenUrl': tokenUrl,
    } as any); // Cast to any to allow vendor extensions

    // Return security requirement with scopes
    return { [name]: scopes };
}

/**
 * Validates tenant ID format (GUID).
 * @internal
 */
export function isValidTenantId(tenantId: string): boolean {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(tenantId);
}

/**
 * Builds issuer URL from tenant ID.
 * @internal
 */
export function buildIssuerUrl(tenantId: string, version: 'v1.0' | 'v2.0' = 'v2.0'): string {
    return `https://login.microsoftonline.com/${tenantId}/${version}`;
}

/**
 * Builds audience URL for API application.
 * @internal
 */
export function buildAudienceUrl(clientId: string): string {
    // Check if it's already a URL
    if (clientId.startsWith('http://') || clientId.startsWith('https://')) {
        return clientId;
    }
    
    // Check if it's a GUID (app registration client ID)
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (guidRegex.test(clientId)) {
        return clientId; // Client ID GUIDs are valid audiences
    }
    
    // Otherwise, assume it's an API identifier and build URL
    return `api://${clientId}`;
}

/**
 * Default Azure AD Bearer configuration.
 * @internal
 */
export const DEFAULT_AZURE_AD_BEARER_CONFIG: Partial<AzureADBearerConfig> = {
    scopes: [],
    description: undefined, // Auto-generated
};
