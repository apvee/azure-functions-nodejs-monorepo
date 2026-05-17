import { OpenAPIObjectConfig } from '../types';
import type { AuthLevel } from './security/types';

/**
 * Global configuration for OpenAPI setup.
 * Contains only centralized settings that are shared across all functions.
 */
interface GlobalOpenAPIConfig {
    /** Route prefix for all Azure Functions (e.g., 'api') */
    routePrefix: string;
    /** Default authLevel applied to routes that do not specify one explicitly */
    defaultAuthLevel: AuthLevel;
    /** OpenAPI object configuration (info, security, tags, etc.) */
    openAPIConfig: OpenAPIObjectConfig;
}

/**
 * Singleton manager for global OpenAPI configuration.
 * Stores centralized settings initialized by app.openAPISetup() and used by openAPIPath/openAPIWebhook.
 */
class OpenAPIConfigManager {
    private config: GlobalOpenAPIConfig | null = null;

    /**
     * Sets the global OpenAPI configuration.
     * Should be called once during app initialization via app.openAPISetup().
     *
     * @param config - The global configuration to store
     */
    setConfig(config: GlobalOpenAPIConfig): void {
        this.config = config;
    }

    /**
     * Gets the configured route prefix.
     *
     * @returns The route prefix string
     * @throws Error if configuration has not been set
     */
    getRoutePrefix(): string {
        if (!this.config) {
            throw new Error(
                'OpenAPI configuration not initialized. ' +
                'Please call app.openAPISetup() before registering functions.'
            );
        }
        return this.config.routePrefix;
    }

    /**
     * Gets the default authLevel applied when an endpoint does not specify one.
     * Falls back to 'anonymous' when no global configuration has been set yet
     * (allowing utility usage and tests without explicit setup).
     */
    getDefaultAuthLevel(): AuthLevel {
        return this.config?.defaultAuthLevel ?? 'anonymous';
    }

    /**
     * Gets the OpenAPI object configuration.
     *
     * @returns The OpenAPI configuration object
     * @throws Error if configuration has not been set
     */
    getOpenAPIConfig(): OpenAPIObjectConfig {
        if (!this.config) {
            throw new Error(
                'OpenAPI configuration not initialized. ' +
                'Please call app.openAPISetup() before generating OpenAPI documents.'
            );
        }
        return this.config.openAPIConfig;
    }

    /**
     * Checks if the global configuration has been initialized.
     * 
     * @returns True if configuration is set, false otherwise
     */
    isConfigured(): boolean {
        return this.config !== null;
    }
}

/**
 * Singleton instance of the OpenAPI configuration manager.
 * Used internally to share configuration across the library.
 */
export const globalConfigManager = new OpenAPIConfigManager();
