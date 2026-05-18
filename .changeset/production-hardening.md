---
'@apvee/azure-functions-openapi': minor
---

Production-readiness & security hardening:

- **Security (B1, host-header injection)**: the `servers` field is no longer derived from the incoming `Host` header by default. New `OpenAPISetupConfig.trustHostHeader` (default `false`) and `trustedHosts` allowlist make this opt-in.
- **Security (B2, XSS via Swagger UI)**: data interpolated into the Swagger UI `<script>` block is now escaped against `</`, `&`, `<`, `>`, U+2028 and U+2029.
- **Security (B3, secret leakage in logs)**: `code`, `x-functions-key`, `access_token`, `token`, `api_key`, `apiKey` query parameters are stripped from URLs before they are passed to `context.log`.
- **Security (parseEasyAuthPrincipal)**: enforces a 64 KiB upper bound on the base64 input and rejects non-string values.
- **Hardening**: emits a startup warning when `authLevel: 'anonymous'` is detected together with `WEBSITE_SITE_NAME` (running on Azure).
- **Hardening**: the OpenAPI document is now memoised per `(version, format, servers)` instead of being re-serialised on every request.
- **Hardening**: Swagger UI assets are resolved via `require.resolve('swagger-ui-dist/...')`, which works under pnpm, Yarn PnP and `WEBSITE_RUN_FROM_PACKAGE`.
- **Dependencies**: bump `yaml` to `^2.8.3` (CVE GHSA-48c2-rrv3-qjmp). Raise the `@azure/functions` peer to `^4.5.2` to drop the vulnerable `undici` chain. Promote `openapi3-ts` from transitive to a direct dependency.
- **Tests**: coverage expanded from 25 to 68 tests, adding suites for the host-resolution helper, sanitisation helpers, EasyAuth principal limits, security primitives (authLevel mapping, EasyAuth conflict, environment auto-detection) and the Swagger 2.0 converter.
