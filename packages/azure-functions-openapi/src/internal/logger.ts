/**
 * Internal pluggable logger.
 *
 * The library emits informational warnings (configuration smells, validation
 * footguns, etc.). Hardcoding `console.warn` is undesirable in serverless
 * environments where structured logging is the norm. This module exposes a
 * tiny, dependency-free logger that:
 *  - defaults to `console.warn` / `console.error`
 *  - can be replaced at runtime via `setLogger`
 *  - can be silenced for tests via `setLogger({ warn() {}, error() {} })`
 *
 * @internal
 */

export interface InternalLogger {
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}

const DEFAULT_LOGGER: InternalLogger = {
    warn: (message, ...args) => console.warn(message, ...args),
    error: (message, ...args) => console.error(message, ...args),
};

let activeLogger: InternalLogger = DEFAULT_LOGGER;

/**
 * Replaces the active internal logger.
 * @internal
 */
export function setLogger(logger: InternalLogger): void {
    activeLogger = logger;
}

/**
 * Resets the logger to the built-in console-based implementation.
 * @internal
 */
export function resetLogger(): void {
    activeLogger = DEFAULT_LOGGER;
}

/**
 * Returns the currently active logger.
 * @internal
 */
export function getLogger(): InternalLogger {
    return activeLogger;
}
