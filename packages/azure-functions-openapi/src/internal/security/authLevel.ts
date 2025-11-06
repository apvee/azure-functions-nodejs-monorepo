/**
 * Azure Functions authLevel to OpenAPI security requirements mapping.
 * 
 * @see https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger#authorization-keys
 * 
 * @internal
 */

import type { SecurityRequirementObject } from '../../types';
import type { AuthLevel, AuthLevelWarning, AzureEasyAuthConfig } from './types';

/**
 * Checks if authLevel conflicts with EasyAuth configuration.
 * 
 * **IMPORTANT**: EasyAuth requires authLevel: 'anonymous'.
 * When Azure App Service Authentication (EasyAuth) is enabled, authentication
 * happens BEFORE the function executes. The function must be set to 'anonymous'
 * to allow Azure to handle authentication.
 * 
 * @param authLevel - The current authLevel setting
 * @param easyAuthConfig - EasyAuth configuration (if enabled)
 * @returns Warning if conflict detected, null otherwise
 * 
 * @internal
 */
export function checkAuthLevelEasyAuthConflict(
    authLevel: AuthLevel,
    easyAuthConfig: AzureEasyAuthConfig | null,
    functionPath: string
): AuthLevelWarning | null {
    // No conflict if EasyAuth is not enabled
    if (!easyAuthConfig) {
        return null;
    }

    // Conflict: EasyAuth + non-anonymous authLevel
    if (authLevel !== 'anonymous') {
        return {
            functionPath,
            currentAuthLevel: authLevel,
            recommendedAuthLevel: 'anonymous',
            reason: `EasyAuth is enabled but authLevel is '${authLevel}'. ` +
                `Azure App Service Authentication requires authLevel: 'anonymous' because ` +
                `authentication is handled by Azure BEFORE the function executes. ` +
                `Change authLevel to 'anonymous' or disable EasyAuth for this endpoint.`,
        };
    }

    return null;
}

/**
 * Gets default security requirements based on authLevel.
 * This is used when no explicit security is configured.
 * 
 * @param authLevel - The authLevel setting
 * @returns Security requirements array (empty for anonymous)
 * 
 * @internal
 */
export function getDefaultSecurityForAuthLevel(authLevel: AuthLevel): SecurityRequirementObject[] {
    switch (authLevel) {
        case 'anonymous':
            // No authentication required
            return [];
        
        case 'function':
        case 'admin':
            // Function keys required (will be registered automatically if not already)
            return [{ AzureFunctionKey: [] }];
        
        default:
            return [];
    }
}

/**
 * Validates that authLevel is compatible with configured security schemes.
 * 
 * Rules:
 * - anonymous: Compatible with any security (security is opt-in)
 * - function/admin: Must have at least one security scheme OR rely on default function keys
 * - EasyAuth: MUST use anonymous authLevel
 * 
 * @param authLevel - The authLevel setting
 * @param security - Configured security requirements
 * @param hasEasyAuth - Whether EasyAuth is configured
 * @returns Validation result with warnings
 * 
 * @internal
 */
export function validateAuthLevelSecurityCompatibility(
    authLevel: AuthLevel,
    security: SecurityRequirementObject[] | undefined,
    hasEasyAuth: boolean,
    functionPath: string
): AuthLevelWarning | null {
    // Rule 1: EasyAuth requires anonymous
    if (hasEasyAuth && authLevel !== 'anonymous') {
        return {
            functionPath,
            currentAuthLevel: authLevel,
            recommendedAuthLevel: 'anonymous',
            reason: `EasyAuth requires authLevel: 'anonymous'. Current value: '${authLevel}'.`,
        };
    }

    // Rule 2: function/admin without security should use default function keys
    if ((authLevel === 'function' || authLevel === 'admin') && (!security || security.length === 0)) {
        // This is OK - default function keys will be used
        // No warning needed
        return null;
    }

    // Rule 3: anonymous with no security (open endpoint)
    if (authLevel === 'anonymous' && (!security || security.length === 0)) {
        // This is intentional - truly open endpoint
        // No warning needed (user explicitly chose anonymous)
        return null;
    }

    return null;
}

/**
 * Merges authLevel-based security with explicit security configuration.
 * 
 * @param authLevel - The authLevel setting
 * @param explicitSecurity - User-configured security requirements
 * @returns Merged security requirements
 * 
 * @internal
 */
export function mergeSecurityRequirements(
    authLevel: AuthLevel,
    explicitSecurity: SecurityRequirementObject[] | undefined
): SecurityRequirementObject[] {
    // If explicit security is configured, use it as-is
    if (explicitSecurity && explicitSecurity.length > 0) {
        return explicitSecurity;
    }

    // Otherwise, use default based on authLevel
    return getDefaultSecurityForAuthLevel(authLevel);
}

/**
 * Formats authLevel warning for logging.
 * 
 * @param warning - The warning to format
 * @returns Formatted warning message
 * 
 * @internal
 */
export function formatAuthLevelWarning(warning: AuthLevelWarning): string {
    return [
        `⚠️  authLevel Configuration Warning`,
        `   Function: ${warning.functionPath}`,
        `   Current authLevel: '${warning.currentAuthLevel}'`,
        `   Recommended authLevel: '${warning.recommendedAuthLevel}'`,
        `   Reason: ${warning.reason}`,
        '',
    ].join('\n');
}

/**
 * Collects all authLevel warnings for a set of functions.
 * 
 * @internal
 */
export class AuthLevelWarningCollector {
    private warnings: AuthLevelWarning[] = [];

    /**
     * Adds a warning if one is generated.
     */
    addWarning(warning: AuthLevelWarning | null): void {
        if (warning) {
            this.warnings.push(warning);
        }
    }

    /**
     * Gets all collected warnings.
     */
    getWarnings(): AuthLevelWarning[] {
        return [...this.warnings];
    }

    /**
     * Checks if any warnings were collected.
     */
    hasWarnings(): boolean {
        return this.warnings.length > 0;
    }

    /**
     * Formats all warnings for logging.
     */
    formatAll(): string {
        if (!this.hasWarnings()) {
            return '';
        }

        return [
            '',
            '═══════════════════════════════════════════════════════════════',
            '⚠️  authLevel Configuration Warnings',
            '═══════════════════════════════════════════════════════════════',
            '',
            ...this.warnings.map(formatAuthLevelWarning),
            '═══════════════════════════════════════════════════════════════',
            '',
        ].join('\n');
    }

    /**
     * Clears all warnings.
     */
    clear(): void {
        this.warnings = [];
    }
}
