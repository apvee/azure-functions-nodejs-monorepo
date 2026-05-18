# Security Policy

## Supported Versions

Only the latest release of `@apvee/azure-functions-openapi` (the `2.x` line) receives security fixes. Older `1.x` versions are no longer maintained.

| Version | Supported |
| ------- | --------- |
| 2.x     | ✅        |
| 1.x     | ❌        |

## Reporting a Vulnerability

Please **do not** open public GitHub issues for security vulnerabilities.

Instead, report them privately using one of the following channels:

1. **GitHub Security Advisories** — preferred — open a draft advisory at
   <https://github.com/apvee/azure-functions-nodejs-monorepo/security/advisories/new>.
2. **Email** — send a description, reproduction steps and (if possible) a
   proof-of-concept to the package author listed in `package.json`.

We will:

- Acknowledge receipt within **3 business days**.
- Provide an initial assessment (accepted / needs more info / not a vulnerability) within **7 business days**.
- For accepted reports, aim to ship a patched release within **30 days**, coordinating the disclosure timeline with the reporter.

## Scope

In scope:

- Code under `packages/azure-functions-openapi/`.
- The CI / release pipeline under `.github/workflows/`.

Out of scope:

- Vulnerabilities in upstream dependencies — please report them to their maintainers. We are happy to receive a heads-up if such a vulnerability impacts our default configuration.
- The `packages/test-functions/` sample app, which is for illustration only and is not intended for production deployment.

## Hardening Defaults

This library follows secure-by-default principles:

- `OpenAPISetupConfig.trustHostHeader` is **`false`** by default. The `servers` field of the generated spec is **never** derived from a client-controlled `Host` header unless you explicitly opt in.
- Log statements emitted by the library scrub `code`, `x-functions-key`, `access_token`, `token` and `api_key` query parameters before writing them.
- The Swagger UI HTML escapes all data interpolated into `<script>` blocks (including U+2028 / U+2029 and `</`).
- `parseEasyAuthPrincipal` caps the input size at 64 KiB and returns a `ValidationError` for malformed input.
