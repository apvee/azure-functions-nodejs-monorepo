/**
 * Azure AD Client Credentials security scheme implementation.
 * For service-to-service (daemon/background) authentication.
 * 
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow
 * @see https://learn.microsoft.com/en-us/entra/identity-platform/scenario-daemon-overview
 * 
 * @internal
 */

import type { SecurityRequirementObject } from '../../types';
import type { AzureADClientCredentialsConfig } from './types';
import { openAPIRegistry } from '../registry';

/**
 * Registers Azure AD Client Credentials security scheme in the OpenAPI registry.
 * 
 * This is for service-to-service (daemon) authentication where:
 * - NO user context exists (background jobs, automated services)
 * - Calling application authenticates with its own credentials (client ID + secret/certificate)
 * - Permissions are granted via App Roles, not Scopes
 * 
 * The Bearer token should be provided in the Authorization header:
 * Authorization: Bearer {token}
 * 
 * Token contains:
 * - appid: Client ID of the calling application
 * - roles: Application permissions (App Roles)
 * - NO user claims (oid, upn, etc.)
 * 
 * @param config - Azure AD Client Credentials configuration
 * @returns Security requirement object for OpenAPI
 * 
 * @example Basic service-to-service authentication
 * ```typescript
 * const securityReq = registerAzureADClientCredentials({
 *   name: 'ServiceAuth',
 *   tenantId: '11111111-1111-1111-1111-111111111111',
 *   audience: 'api://my-service',
 *   description: 'Service-to-service authentication'
 * });
 * ```
 * 
 * @example With required application roles
 * ```typescript
 * const securityReq = registerAzureADClientCredentials({
 *   name: 'ServiceAuth',
 *   tenantId: '11111111-1111-1111-1111-111111111111',
 *   audience: 'api://my-service',
 *   roles: ['Service.Read', 'Service.Write'],
 *   description: 'Service authentication with read/write permissions'
 * });
 * ```
 * 
 * @internal
 */
export function registerAzureADClientCredentials(config: AzureADClientCredentialsConfig): SecurityRequirementObject {
    const {
        name,
        tenantId,
        audience,
        roles = [],
        description,
    } = config;

    // Build description
    const parts: string[] = [];
    parts.push(description || 'Azure AD Client Credentials (service-to-service) authentication.');
    parts.push('No user context. Application authenticates with client credentials.');
    
    if (tenantId) {
        parts.push(`Expected tenant: ${tenantId}.`);
    }
    if (audience) {
        parts.push(`Expected audience: ${audience}.`);
    }
    if (roles.length > 0) {
        parts.push(`Required app roles: ${roles.join(', ')}.`);
    }
    
    const schemeDescription = parts.join(' ');

    // Build token URL
    const tenantPath = tenantId || 'common';
    const tokenUrl = `https://login.microsoftonline.com/${tenantPath}/oauth2/v2.0/token`;
    const openIdConfigUrl = `https://login.microsoftonline.com/${tenantPath}/v2.0/.well-known/openid-configuration`;

    // Build scopes object (for client credentials, we use .default scope)
    const scopesObject: Record<string, string> = {
        '.default': 'Default scope for client credentials flow',
    };

    // Add roles as additional documentation
    for (const role of roles) {
        scopesObject[`role:${role}`] = `Required app role: ${role}`;
    }

    // Register as OAuth2 Client Credentials flow
    openAPIRegistry.registerComponent('securitySchemes', name, {
        type: 'oauth2',
        description: schemeDescription,
        flows: {
            clientCredentials: {
                tokenUrl,
                scopes: scopesObject,
            },
        },
        // Add vendor extension for Azure-specific metadata
        'x-azure-ad-client-credentials': true,
        'x-azure-ad-tenantId': tenantId,
        'x-azure-ad-audience': audience,
        'x-azure-ad-roles': roles,
        'x-azure-ad-openIdConnectUrl': openIdConfigUrl,
    } as any); // Cast to any to allow vendor extensions

    // Return security requirement with .default scope
    return { [name]: ['.default'] };
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
 * Builds token URL for client credentials flow.
 * @internal
 */
export function buildTokenUrl(tenantId: string, version: 'v1.0' | 'v2.0' = 'v2.0'): string {
    return `https://login.microsoftonline.com/${tenantId}/oauth2/${version}/token`;
}

/**
 * Builds scope string for client credentials (.default).
 * @internal
 */
export function buildClientCredentialsScope(audience: string): string {
    // For client credentials, scope is always {resource}/.default
    if (audience.endsWith('/.default')) {
        return audience;
    }
    return `${audience}/.default`;
}

/**
 * Default Azure AD Client Credentials configuration.
 * @internal
 */
export const DEFAULT_AZURE_AD_CLIENT_CREDENTIALS_CONFIG: Partial<AzureADClientCredentialsConfig> = {
    roles: [],
    description: undefined, // Auto-generated
};
