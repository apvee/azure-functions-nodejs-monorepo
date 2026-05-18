# Changelog

All notable changes to `@apvee/azure-functions-openapi` are documented in this
file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — 2.0.0 hardening

### Added

- Dedicated side-effect entrypoint `@apvee/azure-functions-openapi/register` for
  consumers that want an explicit augmentation import.
- Pluggable internal logger (`setLogger` / `resetLogger`) so that the library
  no longer hard-codes `console.warn` for configuration warnings.
- `exports` map and `engines.node` field on the published package.
- ESM/CJS-safe re-exports of route helpers via `internal/route.ts`.
- Unit-test suite (Vitest) covering JSON content-type detection, the safe
  request proxy, route normalization, transform/response warnings, and the
  Azure Function Key OpenAPI mapping.
- Automatic disambiguation of `operationId` when an endpoint is registered
  with multiple HTTP methods, ensuring a valid OpenAPI document.
- Default `authLevel` configured by `app.openAPISetup({ authLevel })` is now
  applied to subsequent `openAPIPath` / `openAPIWebhook` registrations that
  omit the option explicitly.

### Changed

- `parseBody` now accepts every JSON media type allowed by RFC 6839, i.e. any
  `application/json` and any `*+json` structured-syntax suffix
  (`application/problem+json`, `application/ld+json`, etc.).
- `createSafeRequest` now wraps the original `HttpRequest` with a `Proxy`,
  preserving prototype methods (`request.headers.get(...)`) and non-enumerable
  properties that were previously lost by the old `Object.assign`-based
  implementation.
- Swagger UI assets are now read asynchronously and **cached in memory**;
  conditional `If-None-Match` requests are answered with `304 Not Modified`.
- Azure Function Keys are documented as **two** OpenAPI security schemes
  (header `x-functions-key` _and_ query `code`) when both locations are
  allowed, so generated documents reflect what the Azure runtime accepts.
- TypeScript build target raised to `ES2022` for both packages.
- ESLint + Prettier + EditorConfig added at the repo root.

### Fixed

- README examples and migration sections no longer claim that all three
  OpenAPI versions are emitted by default — only `3.1.0` is, and additional
  versions remain opt-in via `versions`.
- Internal JSDoc no longer references the obsolete `app.openapi()` factory.

### Removed

- The unused `SAFE_REQUEST_PROTOTYPE` static prototype previously held by
  `internal/parsing.ts`.

## 1.x

Initial public series. See git history for details.
