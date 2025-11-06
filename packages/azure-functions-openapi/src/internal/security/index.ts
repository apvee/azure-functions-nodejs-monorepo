/**
 * Internal security module barrel export.
 * Aggregates all security-related functionality for internal use.
 * 
 * @internal
 */

// Type exports
export type {
    EasyAuthProvider,
    AuthLevel,
    SecuritySchemeBaseConfig,
    CustomApiKeyConfig,
    AzureFunctionKeyConfig,
    AzureEasyAuthConfig,
    AzureADBearerConfig,
    AzureADClientCredentialsConfig,
    SecurityConfig,
    SecuritySchemeEntry,
    AuthLevelWarning,
} from './types';

// Custom API Key
export {
    registerCustomApiKey,
    DEFAULT_CUSTOM_API_KEY_CONFIG,
} from './customApiKey';

// Azure Function Keys
export {
    registerAzureFunctionKey,
    isValidAuthLevel,
    DEFAULT_AZURE_FUNCTION_KEY_CONFIG,
} from './functionKeys';

// Azure EasyAuth
export {
    registerAzureEasyAuth,
    getProviderDisplayName,
    isValidEasyAuthProvider,
    getSupportedProviders,
    DEFAULT_AZURE_EASYAUTH_CONFIG,
} from './easyAuth';

// Azure AD Bearer Token
export {
    registerAzureADBearer,
    isValidTenantId as isValidBearerTenantId,
    buildIssuerUrl,
    buildAudienceUrl,
    DEFAULT_AZURE_AD_BEARER_CONFIG,
} from './bearerToken';

// Azure AD Client Credentials
export {
    registerAzureADClientCredentials,
    isValidTenantId as isValidClientCredentialsTenantId,
    buildTokenUrl,
    buildClientCredentialsScope,
    DEFAULT_AZURE_AD_CLIENT_CREDENTIALS_CONFIG,
} from './clientCredentials';

// AuthLevel management
export {
    checkAuthLevelEasyAuthConflict,
    getDefaultSecurityForAuthLevel,
    validateAuthLevelSecurityCompatibility,
    mergeSecurityRequirements,
    formatAuthLevelWarning,
    AuthLevelWarningCollector,
} from './authLevel';

// Auto-detection
export {
    EASYAUTH_ENV_VARS,
    AZURE_ENV_VARS,
    isEasyAuthEnabled,
    detectEasyAuthProvider,
    getEasyAuthClientId,
    getEasyAuthIssuer,
    isTokenStoreEnabled,
    getUnauthenticatedAction,
    getAzureAppServiceMetadata,
    isRunningInAzure,
    autoDetectAzureAuth,
    type AutoDetectionResult,
} from './autoDetect';
