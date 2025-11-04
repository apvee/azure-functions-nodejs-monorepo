/**
 * Internal types for security scheme management.
 * These types are not exported from the public API.
 * 
 * @internal
 */

import type { SecurityRequirementObject } from '../../types';

/**
 * Azure EasyAuth identity provider types.
 * @see https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-aad
 */
export type EasyAuthProvider = 
    | 'aad'          // Microsoft Entra ID (Azure Active Directory)
    | 'google'       // Google
    | 'facebook'     // Facebook
    | 'twitter'      // Twitter
    | 'apple'        // Apple
    | 'github'       // GitHub
    | 'oidc';        // Custom OpenID Connect provider

/**
 * Azure Functions authorization levels.
 * @see https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger#authorization-keys
 */
export type AuthLevel = 'anonymous' | 'function' | 'admin';

/**
 * Base configuration for all security schemes.
 */
export interface SecuritySchemeBaseConfig {
    /**
     * Unique name for the security scheme in OpenAPI.
     * This name will be used in security requirements.
     */
    name: string;
    
    /**
     * Description of the security scheme (optional).
     * Shown in OpenAPI documentation.
     */
    description?: string;
}

/**
 * Configuration for custom API key security (user-implemented validation).
 */
export interface CustomApiKeyConfig extends SecuritySchemeBaseConfig {
    /**
     * Location of the API key in the request.
     */
    in: 'query' | 'header' | 'cookie';
    
    /**
     * Name of the parameter/header/cookie containing the key.
     * 
     * @example 'api_key' (query parameter: ?api_key=xxx)
     * @example 'X-API-Key' (header: X-API-Key: xxx)
     * @example 'session' (cookie: session=xxx)
     */
    parameterName: string;
}

/**
 * Configuration for Azure Function Keys authentication.
 */
export interface AzureFunctionKeyConfig extends SecuritySchemeBaseConfig {
    /**
     * Authorization level required for the function.
     * Determines which keys are valid (function keys, host keys, master key).
     * 
     * - 'function': Function-specific keys or host-level keys
     * - 'admin': Only master/admin keys (highest security)
     * - 'anonymous': No key required (but still documented in OpenAPI)
     */
    authLevel: AuthLevel;
    
    /**
     * Whether to check query parameter 'code' (default: true).
     */
    allowQueryParameter?: boolean;
    
    /**
     * Whether to check header 'x-functions-key' (default: true).
     */
    allowHeader?: boolean;
}

/**
 * Configuration for Azure EasyAuth authentication.
 */
export interface AzureEasyAuthConfig extends SecuritySchemeBaseConfig {
    /**
     * Identity provider(s) enabled for this endpoint.
     * Can be a single provider or array of providers for multi-provider support.
     * 
     * @example 'aad' - Single provider (Azure AD only)
     * @example ['aad', 'google'] - Multiple providers
     */
    providers: EasyAuthProvider | EasyAuthProvider[];
    
    /**
     * Whether to require the X-MS-CLIENT-PRINCIPAL header (default: true).
     * Set to false if you only want to document EasyAuth without enforcing presence.
     */
    requirePrincipalHeader?: boolean;
}

/**
 * Configuration for Azure AD Bearer Token authentication (manual JWT validation).
 */
export interface AzureADBearerConfig extends SecuritySchemeBaseConfig {
    /**
     * Azure AD tenant ID (GUID format).
     * Used for token validation.
     * 
     * @example '11111111-1111-1111-1111-111111111111'
     */
    tenantId?: string;
    
    /**
     * Expected audience (client ID) in the token.
     * Validates that the token is intended for your application.
     * 
     * @example 'api://12345678-1234-1234-1234-123456789012'
     */
    audience?: string;
    
    /**
     * Expected issuer URL.
     * Validates the token was issued by Azure AD.
     * 
     * @example 'https://login.microsoftonline.com/{tenant-id}/v2.0'
     */
    issuer?: string;
    
    /**
     * Required scopes for the endpoint (optional).
     * Validates that the token has necessary permissions.
     * 
     * @example ['User.Read', 'Mail.Send']
     */
    scopes?: string[];
}

/**
 * Configuration for Azure AD Client Credentials (service-to-service).
 */
export interface AzureADClientCredentialsConfig extends SecuritySchemeBaseConfig {
    /**
     * Azure AD tenant ID (GUID format).
     * 
     * @example '11111111-1111-1111-1111-111111111111'
     */
    tenantId?: string;
    
    /**
     * Expected audience (application ID URI or client ID).
     * 
     * @example 'api://my-service'
     * @example '12345678-1234-1234-1234-123456789012'
     */
    audience?: string;
    
    /**
     * Required application roles (optional).
     * Validates that the calling application has necessary permissions.
     * 
     * @example ['Service.Read', 'Service.Write']
     */
    roles?: string[];
}

/**
 * Union type for all security configuration types.
 */
export type SecurityConfig = 
    | CustomApiKeyConfig
    | AzureFunctionKeyConfig
    | AzureEasyAuthConfig
    | AzureADBearerConfig
    | AzureADClientCredentialsConfig;

/**
 * Internal registry entry for a security scheme.
 */
export interface SecuritySchemeEntry {
    /**
     * The configuration provided by the user.
     */
    config: SecurityConfig;
    
    /**
     * Generated OpenAPI security requirement object.
     * Maps scheme name to required scopes/values.
     */
    securityRequirement: SecurityRequirementObject;
}

/**
 * Warning information for authLevel conflicts.
 */
export interface AuthLevelWarning {
    /**
     * The function name/path where the conflict was detected.
     */
    functionPath: string;
    
    /**
     * Current authLevel setting.
     */
    currentAuthLevel: AuthLevel;
    
    /**
     * Recommended authLevel value.
     */
    recommendedAuthLevel: AuthLevel;
    
    /**
     * Reason for the warning.
     */
    reason: string;
}
