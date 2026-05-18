# Changelog

All notable changes to `@apvee/azure-functions-openapi` are documented in this
file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0]

### Added

- Complete v2 rewrite around Azure Functions v4 module augmentation:
  `app.openAPISetup`, `app.openAPIPath`, `app.openAPIWebhook`,
  `app.openAPISchema`, and dedicated security helpers now replace the v1
  registration functions.
- Dedicated side-effect entrypoint `@apvee/azure-functions-openapi/register` for
  consumers that want an explicit augmentation import.
- Pluggable internal logger (`setLogger` / `resetLogger`) so that the library
  no longer hard-codes `console.warn` for configuration warnings.
- `exports` map and `engines.node` field on the published package.
- ESM/CJS-safe re-exports of route helpers via `internal/route.ts`.
- Secure host resolution controls: `OpenAPISetupConfig.trustHostHeader`
  defaults to `false`, while `trustedHosts` can be used as an allowlist when
  request-derived server URLs are explicitly enabled.
- Unit-test suite (Vitest) covering JSON content-type detection, the safe
  request proxy, route normalization, transform/response warnings, and the
  Azure Function Key OpenAPI mapping.
- Automatic disambiguation of `operationId` when an endpoint is registered
  with multiple HTTP methods, ensuring a valid OpenAPI document.
- Default `authLevel` configured by `app.openAPISetup({ authLevel })` is now
  applied to subsequent `openAPIPath` / `openAPIWebhook` registrations that
  omit the option explicitly.
- OpenAPI documents can be generated as OpenAPI 3.1.0, OpenAPI 3.0.3, and
  Swagger 2.0, with JSON and YAML output formats.
- Native Azure security helpers for Function Keys, EasyAuth, Microsoft Entra ID
  bearer tokens, client credentials, and custom API keys.

### Changed

- The default generated OpenAPI version is now only `3.1.0`; `3.0.3` and `2.0`
  remain available when explicitly requested via `versions`.
- `parseBody` now accepts every JSON media type allowed by RFC 6839, i.e. any
  `application/json` and any `*+json` structured-syntax suffix
  (`application/problem+json`, `application/ld+json`, etc.).
- `createSafeRequest` now wraps the original `HttpRequest` with a `Proxy`,
  preserving prototype methods (`request.headers.get(...)`) and non-enumerable
  properties that were previously lost by the old `Object.assign`-based
  implementation.
- Swagger UI assets are now read asynchronously and cached in memory;
  conditional `If-None-Match` requests are answered with `304 Not Modified`.
- Swagger UI asset resolution now uses `require.resolve('swagger-ui-dist/...')`
  so package resolution works under pnpm, Yarn PnP, monorepos, and
  `WEBSITE_RUN_FROM_PACKAGE`.
- Generated OpenAPI documents are memoised per `(version, format, servers)` to
  avoid re-serialising unchanged specs on every request.
- Azure Function Keys are documented as two OpenAPI security schemes (header
  `x-functions-key` and query `code`) when both locations are allowed, so
  generated documents reflect what the Azure runtime accepts.
- TypeScript build target raised to `ES2022` for both packages.
- Runtime compatibility is Node.js `>=18`, `@azure/functions` `^4.5.2`, and
  `zod` `^4.0.0`.
- `yaml` was upgraded to `^2.8.3`, and `openapi3-ts` is now a direct runtime
  dependency.
- ESLint + Prettier + EditorConfig added at the repo root.

### Fixed

- Swagger UI script interpolation now escapes `</`, `&`, `<`, `>`, U+2028, and
  U+2029 before embedding generated data.
- URLs logged by the built-in handlers redact sensitive query parameters:
  `code`, `x-functions-key`, `access_token`, `token`, `api_key`, and `apiKey`.
- `parseEasyAuthPrincipal` rejects non-string values and enforces a 64 KiB
  upper bound on base64 input.
- Startup now warns when OpenAPI endpoints use `authLevel: 'anonymous'` while
  running on Azure (`WEBSITE_SITE_NAME` is present).
- README examples and migration sections no longer claim that all three
  OpenAPI versions are emitted by default; only `3.1.0` is, and additional
  versions remain opt-in via `versions`.
- Internal JSDoc no longer references the obsolete `app.openapi()` factory.

### Removed

- v1 registration APIs such as `registerOpenAPIHandler`,
  `registerSwaggerUIHandler`, `registerFunction`, `registerApiKeySecuritySchema`,
  and `registerTypeSchema`; use the `app.openAPI*` methods instead.
- The unused `SAFE_REQUEST_PROTOTYPE` static prototype previously held by
  `internal/parsing.ts`.

## 1.x

Initial public series. See git history for details.
