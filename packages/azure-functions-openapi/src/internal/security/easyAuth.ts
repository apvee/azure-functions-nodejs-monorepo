/**
 * Azure EasyAuth (App Service Authentication) security scheme implementation.
 * 
 * @see https://learn.microsoft.com/en-us/azure/app-service/overview-authentication-authorization
 * @see https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-user-identities
 * 
 * @internal
 */

import type { SecurityRequirementObject } from '../../types';
import type { AzureEasyAuthConfig, EasyAuthProvider } from './types';
import { openAPIRegistry } from '../registry';

/**
 * Map of EasyAuth providers to their OAuth2 flows and descriptions.
 * @internal
 */
const EASY_AUTH_PROVIDER_INFO: Record<EasyAuthProvider, {
    displayName: string;
    authorizationUrl: string;
    tokenUrl: string;
    description: string;
}> = {
    aad: {
        displayName: 'Microsoft Entra ID (Azure AD)',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        description: 'Microsoft Entra ID (Azure Active Directory) authentication',
    },
    google: {
        displayName: 'Google',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        description: 'Google OAuth2 authentication',
    },
    facebook: {
        displayName: 'Facebook',
        authorizationUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v12.0/oauth/access_token',
        description: 'Facebook OAuth2 authentication',
    },
    twitter: {
        displayName: 'Twitter',
        authorizationUrl: 'https://api.twitter.com/oauth/authorize',
        tokenUrl: 'https://api.twitter.com/oauth/access_token',
        description: 'Twitter OAuth authentication',
    },
    apple: {
        displayName: 'Apple',
        authorizationUrl: 'https://appleid.apple.com/auth/authorize',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        description: 'Sign in with Apple authentication',
    },
    github: {
        displayName: 'GitHub',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        description: 'GitHub OAuth2 authentication',
    },
    oidc: {
        displayName: 'OpenID Connect',
        authorizationUrl: 'https://your-oidc-provider.com/authorize',
        tokenUrl: 'https://your-oidc-provider.com/token',
        description: 'Custom OpenID Connect provider authentication',
    },
};

/**
 * Registers Azure EasyAuth security scheme in the OpenAPI registry.
 * 
 * Azure EasyAuth provides built-in authentication with multiple identity providers:
 * - Microsoft Entra ID (Azure AD)
 * - Google
 * - Facebook
 * - Twitter
 * - Apple
 * - GitHub
 * - Custom OpenID Connect providers
 * 
 * When enabled, Azure automatically:
 * - Handles OAuth2 flows
 * - Validates tokens
 * - Injects X-MS-CLIENT-PRINCIPAL header with user identity
 * 
 * **IMPORTANT**: EasyAuth requires authLevel: 'anonymous' on the Function.
 * Authentication is handled by Azure App Service BEFORE the function executes.
 * 
 * @param config - Azure EasyAuth configuration
 * @returns Security requirement object for OpenAPI
 * 
 * @example Single provider (Azure AD)
 * ```typescript
 * const securityReq = registerAzureEasyAuth({
 *   name: 'AzureAD',
 *   providers: 'aad',
 *   description: 'Sign in with Microsoft account'
 * });
 * ```
 * 
 * @example Multiple providers
 * ```typescript
 * const securityReq = registerAzureEasyAuth({
 *   name: 'SocialAuth',
 *   providers: ['aad', 'google', 'github'],
 *   description: 'Sign in with Microsoft, Google, or GitHub'
 * });
 * ```
 * 
 * @internal
 */
export function registerAzureEasyAuth(config: AzureEasyAuthConfig): SecurityRequirementObject {
    const {
        name,
        providers,
        description,
        requirePrincipalHeader = true,
    } = config;

    // Normalize providers to array
    const providerList = Array.isArray(providers) ? providers : [providers];

    // Build description
    const providerNames = providerList
        .map(p => EASY_AUTH_PROVIDER_INFO[p]?.displayName || p)
        .join(', ');
    
    const schemeDescription = description || 
        `Azure EasyAuth with ${providerNames}. ` +
        `User identity is available in X-MS-CLIENT-PRINCIPAL header.`;

    // For OpenAPI, we model EasyAuth as OAuth2
    // We'll create a security scheme for the primary provider
    const primaryProvider = providerList[0];
    const providerInfo = EASY_AUTH_PROVIDER_INFO[primaryProvider];

    // Register OAuth2 security scheme
    openAPIRegistry.registerComponent('securitySchemes', name, {
        type: 'oauth2',
        description: schemeDescription,
        flows: {
            authorizationCode: {
                authorizationUrl: providerInfo.authorizationUrl,
                tokenUrl: providerInfo.tokenUrl,
                scopes: {
                    openid: 'OpenID Connect scope',
                    profile: 'User profile information',
                    email: 'User email address',
                },
            },
        },
        // Add vendor extension for Azure-specific metadata
        'x-azure-easyauth': true,
        'x-azure-easyauth-providers': providerList,
        'x-azure-easyauth-requirePrincipalHeader': requirePrincipalHeader,
    } as any); // Cast to any to allow vendor extensions

    // Return security requirement
    return { [name]: ['openid', 'profile', 'email'] };
}

/**
 * Gets display name for provider.
 * @internal
 */
export function getProviderDisplayName(provider: EasyAuthProvider): string {
    return EASY_AUTH_PROVIDER_INFO[provider]?.displayName || provider;
}

/**
 * Validates provider value.
 * @internal
 */
export function isValidEasyAuthProvider(value: string): value is EasyAuthProvider {
    return value in EASY_AUTH_PROVIDER_INFO;
}

/**
 * Gets all supported EasyAuth providers.
 * @internal
 */
export function getSupportedProviders(): EasyAuthProvider[] {
    return Object.keys(EASY_AUTH_PROVIDER_INFO) as EasyAuthProvider[];
}

/**
 * Default Azure EasyAuth configuration.
 * @internal
 */
export const DEFAULT_AZURE_EASYAUTH_CONFIG: Partial<AzureEasyAuthConfig> = {
    providers: 'aad',
    requirePrincipalHeader: true,
    description: undefined, // Auto-generated
};
