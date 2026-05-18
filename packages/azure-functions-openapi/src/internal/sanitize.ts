/**
 * Internal sanitisation helpers shared by the OpenAPI document and Swagger UI
 * handlers. These helpers are deliberately small and dependency-free so they
 * can be unit-tested in isolation.
 *
 * @internal
 */

/**
 * Query string parameter names that are considered sensitive (Azure Functions
 * keys, custom API keys, generic access tokens). Used by {@link redactSensitiveUrl}
 * to scrub URLs before they are emitted to application logs / App Insights.
 *
 * @internal
 */
export const SENSITIVE_QUERY_KEYS: readonly string[] = [
    'code',
    'x-functions-key',
    'access_token',
    'token',
    'api_key',
    'apiKey',
];

/**
 * Returns a copy of `url` with the values of any well-known credential-bearing
 * query string parameters replaced by `REDACTED`. Used to prevent secrets such
 * as Azure Function keys (`?code=…`) from leaking into log destinations.
 *
 * Falls back to the input string when it does not parse as a URL.
 *
 * @internal
 */
export function redactSensitiveUrl(url: string, extraKeys: readonly string[] = []): string {
    try {
        const parsed = new URL(url);
        const keys = new Set<string>([...SENSITIVE_QUERY_KEYS, ...extraKeys].map(k => k.toLowerCase()));
        const params = parsed.searchParams;
        const toUpdate: string[] = [];
        for (const key of params.keys()) {
            if (keys.has(key.toLowerCase())) {
                toUpdate.push(key);
            }
        }
        for (const key of toUpdate) {
            params.set(key, 'REDACTED');
        }
        return parsed.toString();
    } catch {
        return url;
    }
}

/**
 * Escapes a value for safe embedding inside an HTML `<script>` block.
 *
 * `JSON.stringify` does not escape sequences that can terminate a `<script>`
 * element (`</`, `<!--`, `<![CDATA[`) nor the JavaScript line/paragraph
 * separators U+2028 and U+2029, which are valid JSON but illegal in inline
 * JavaScript source. This helper produces a string that is both valid JSON
 * and safe to embed verbatim inside `<script>…</script>`.
 *
 * @internal
 */
export function escapeJsonForScript(value: unknown): string {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

/**
 * Returns `true` when the current process is detected to be running on Azure
 * App Service / Azure Functions, by checking for the canonical
 * `WEBSITE_SITE_NAME` environment variable.
 *
 * @internal
 */
export function isRunningOnAzure(): boolean {
    return typeof process !== 'undefined' && !!process.env.WEBSITE_SITE_NAME;
}
