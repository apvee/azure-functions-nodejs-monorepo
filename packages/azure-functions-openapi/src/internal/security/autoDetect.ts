/**
 * Auto-detection of Azure authentication configuration from environment variables.
 * 
 * @see https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities
 * @see https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings
 * 
 * @internal
 */

import type { EasyAuthProvider } from './types';

/**
 * Azure App Service Authentication environment variables.
 * These are automatically set by Azure when EasyAuth is enabled.
 * 
 * @see https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings#authentication--authorization
 * 
 * @internal
 */
export const EASYAUTH_ENV_VARS = {
    /** Indicates if EasyAuth is enabled (true/false) */
    WEBSITE_AUTH_ENABLED: 'WEBSITE_AUTH_ENABLED',
    
    /** Default provider (aad, google, facebook, twitter, apple, github, custom) */
    WEBSITE_AUTH_DEFAULT_PROVIDER: 'WEBSITE_AUTH_DEFAULT_PROVIDER',
    
    /** Azure AD specific */
    WEBSITE_AUTH_CLIENT_ID: 'WEBSITE_AUTH_CLIENT_ID',
    WEBSITE_AUTH_OPENID_ISSUER: 'WEBSITE_AUTH_OPENID_ISSUER',
    
    /** Unauthenticated action (RedirectToLoginPage, AllowAnonymous, Return401, Return403) */
    WEBSITE_AUTH_UNAUTHENTICATED_ACTION: 'WEBSITE_AUTH_UNAUTHENTICATED_ACTION',
    
    /** Token store enabled */
    WEBSITE_AUTH_TOKEN_STORE: 'WEBSITE_AUTH_TOKEN_STORE',
} as const;

/**
 * Azure App Service environment variables.
 * @internal
 */
export const AZURE_ENV_VARS = {
    /** Function App name */
    WEBSITE_SITE_NAME: 'WEBSITE_SITE_NAME',
    
    /** Azure subscription ID */
    WEBSITE_OWNER_NAME: 'WEBSITE_OWNER_NAME',
    
    /** Resource group name */
    WEBSITE_RESOURCE_GROUP: 'WEBSITE_RESOURCE_GROUP',
    
    /** Azure region */
    REGION_NAME: 'REGION_NAME',
} as const;

/**
 * Detects if Azure EasyAuth is enabled in the current environment.
 * 
 * @returns true if EasyAuth is enabled, false otherwise
 * 
 * @example
 * ```typescript
 * if (isEasyAuthEnabled()) {
 *   console.log('EasyAuth is enabled');
 * }
 * ```
 * 
 * @internal
 */
export function isEasyAuthEnabled(): boolean {
    const enabled = process.env[EASYAUTH_ENV_VARS.WEBSITE_AUTH_ENABLED];
    return enabled === 'true' || enabled === '1';
}

/**
 * Detects the configured EasyAuth provider from environment.
 * 
 * @returns EasyAuth provider if detected, null otherwise
 * 
 * @example
 * ```typescript
 * const provider = detectEasyAuthProvider();
 * if (provider) {
 *   console.log(`EasyAuth provider: ${provider}`);
 * }
 * ```
 * 
 * @internal
 */
export function detectEasyAuthProvider(): EasyAuthProvider | null {
    if (!isEasyAuthEnabled()) {
        return null;
    }

    const defaultProvider = process.env[EASYAUTH_ENV_VARS.WEBSITE_AUTH_DEFAULT_PROVIDER];
    
    // Map Azure provider names to our internal types
    switch (defaultProvider?.toLowerCase()) {
        case 'azureactivedirectory':
        case 'aad':
            return 'aad';
        case 'google':
            return 'google';
        case 'facebook':
            return 'facebook';
        case 'twitter':
            return 'twitter';
        case 'apple':
            return 'apple';
        case 'github':
            return 'github';
        case 'openidconnect':
        case 'oidc':
            return 'oidc';
        default:
            // Default to AAD if enabled but provider unknown
            return 'aad';
    }
}

/**
 * Gets the Azure AD client ID if configured.
 * 
 * @returns Client ID if configured, null otherwise
 * 
 * @internal
 */
export function getEasyAuthClientId(): string | null {
    if (!isEasyAuthEnabled()) {
        return null;
    }
    return process.env[EASYAUTH_ENV_VARS.WEBSITE_AUTH_CLIENT_ID] || null;
}

/**
 * Gets the OpenID issuer URL if configured.
 * 
 * @returns Issuer URL if configured, null otherwise
 * 
 * @internal
 */
export function getEasyAuthIssuer(): string | null {
    if (!isEasyAuthEnabled()) {
        return null;
    }
    return process.env[EASYAUTH_ENV_VARS.WEBSITE_AUTH_OPENID_ISSUER] || null;
}

/**
 * Checks if token store is enabled.
 * Token store caches tokens for authenticated users.
 * 
 * @returns true if token store is enabled, false otherwise
 * 
 * @internal
 */
export function isTokenStoreEnabled(): boolean {
    const tokenStore = process.env[EASYAUTH_ENV_VARS.WEBSITE_AUTH_TOKEN_STORE];
    return tokenStore === 'true' || tokenStore === '1';
}

/**
 * Gets the unauthenticated action configuration.
 * 
 * @returns Unauthenticated action (RedirectToLoginPage, AllowAnonymous, Return401, Return403)
 * 
 * @internal
 */
export function getUnauthenticatedAction(): string | null {
    return process.env[EASYAUTH_ENV_VARS.WEBSITE_AUTH_UNAUTHENTICATED_ACTION] || null;
}

/**
 * Gets Azure App Service metadata from environment.
 * 
 * @returns Object with site name, subscription, resource group, region
 * 
 * @internal
 */
export function getAzureAppServiceMetadata(): {
    siteName: string | null;
    subscriptionId: string | null;
    resourceGroup: string | null;
    region: string | null;
} {
    return {
        siteName: process.env[AZURE_ENV_VARS.WEBSITE_SITE_NAME] || null,
        subscriptionId: extractSubscriptionId(process.env[AZURE_ENV_VARS.WEBSITE_OWNER_NAME]),
        resourceGroup: process.env[AZURE_ENV_VARS.WEBSITE_RESOURCE_GROUP] || null,
        region: process.env[AZURE_ENV_VARS.REGION_NAME] || null,
    };
}

/**
 * Extracts subscription ID from WEBSITE_OWNER_NAME.
 * Format: {subscription-id}+{resource-group}-{region}webspace
 * 
 * @param ownerName - The WEBSITE_OWNER_NAME value
 * @returns Subscription ID if found, null otherwise
 * 
 * @internal
 */
function extractSubscriptionId(ownerName: string | undefined): string | null {
    if (!ownerName) {
        return null;
    }
    
    const parts = ownerName.split('+');
    if (parts.length > 0) {
        const subscriptionId = parts[0];
        // Validate GUID format
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (guidRegex.test(subscriptionId)) {
            return subscriptionId;
        }
    }
    
    return null;
}

/**
 * Checks if running in Azure App Service environment.
 * 
 * @returns true if running in Azure, false otherwise
 * 
 * @internal
 */
export function isRunningInAzure(): boolean {
    return !!(
        process.env[AZURE_ENV_VARS.WEBSITE_SITE_NAME] ||
        process.env[AZURE_ENV_VARS.WEBSITE_OWNER_NAME]
    );
}

/**
 * Auto-detection configuration result.
 * 
 * @internal
 */
export interface AutoDetectionResult {
    /** Whether EasyAuth is enabled */
    easyAuthEnabled: boolean;
    
    /** Detected EasyAuth provider */
    provider: EasyAuthProvider | null;
    
    /** Azure AD client ID (if AAD) */
    clientId: string | null;
    
    /** OpenID issuer URL */
    issuer: string | null;
    
    /** Token store enabled */
    tokenStoreEnabled: boolean;
    
    /** Unauthenticated action */
    unauthenticatedAction: string | null;
    
    /** Azure App Service metadata */
    azureMetadata: ReturnType<typeof getAzureAppServiceMetadata>;
    
    /** Running in Azure */
    isAzure: boolean;
}

/**
 * Performs full auto-detection of Azure authentication configuration.
 * 
 * @returns Complete auto-detection result
 * 
 * @example
 * ```typescript
 * const detection = autoDetectAzureAuth();
 * if (detection.easyAuthEnabled) {
 *   console.log(`EasyAuth detected: ${detection.provider}`);
 * }
 * ```
 * 
 * @internal
 */
export function autoDetectAzureAuth(): AutoDetectionResult {
    return {
        easyAuthEnabled: isEasyAuthEnabled(),
        provider: detectEasyAuthProvider(),
        clientId: getEasyAuthClientId(),
        issuer: getEasyAuthIssuer(),
        tokenStoreEnabled: isTokenStoreEnabled(),
        unauthenticatedAction: getUnauthenticatedAction(),
        azureMetadata: getAzureAppServiceMetadata(),
        isAzure: isRunningInAzure(),
    };
}
