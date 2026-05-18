/**
 * Explicit side-effect entrypoint for `@apvee/azure-functions-openapi`.
 *
 * Importing this module performs the runtime extension of the `@azure/functions`
 * `app` namespace (adding `openAPISetup`, `openAPIPath`, `openAPIWebhook`, …).
 *
 * Prefer this entrypoint when you want the side effect to be explicit in your
 * import graph (recommended for libraries that depend on this package). When you
 * only need types and utilities, import from the package root and avoid this
 * subpath — although the package root currently also performs the side effect
 * for backward compatibility, that may change in a future major version.
 *
 * @example
 * ```typescript
 * import '@apvee/azure-functions-openapi/register';
 * import { app } from '@azure/functions';
 *
 * app.openAPISetup({ info: { title: 'My API', version: '1.0.0' } });
 * ```
 *
 * @packageDocumentation
 */
import './index';

export {};
