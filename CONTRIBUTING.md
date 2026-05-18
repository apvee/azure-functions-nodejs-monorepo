# Contributing to `apvee/azure-functions-nodejs-monorepo`

Thanks for your interest in contributing! This guide describes how the repo is
structured, how to run the development loop, and the conventions we follow.

## Repository layout

```
azure-functions-nodejs-monorepo/
├── packages/
│   ├── azure-functions-openapi/    # Published library (@apvee/azure-functions-openapi)
│   └── test-functions/              # Sample Azure Functions app (NOT published)
├── .github/workflows/               # CI pipelines
├── .changeset/                      # Pending release notes managed by Changesets
└── package.json                     # npm workspaces root
```

The project uses **npm workspaces** — there is a single root `package-lock.json`.

## Prerequisites

- **Node.js** ≥ 18 (CI tests on 18, 20, 22)
- **npm** ≥ 10
- **Azure Functions Core Tools v4** (only required to run `test-functions` locally)

## Development loop

```bash
npm install                # installs all workspaces
npm run build              # builds every workspace (library + sample)
npm run lint               # runs ESLint where configured
npm test                   # runs vitest on the library
```

To work on a single workspace, use `npm -w <workspace> run <script>`:

```bash
npm -w @apvee/azure-functions-openapi test
npm -w @apvee/azure-functions-openapi run lint
npm -w test-functions run watch
```

## Tests

Unit tests live in `packages/azure-functions-openapi/test/**/*.test.ts` and
are run by [Vitest](https://vitest.dev/). When fixing a bug or adding a
feature, please add or update tests so that the desired behaviour is locked in.

## Code style

- **TypeScript strict mode** is mandatory.
- **ESLint + Prettier** are configured at the repo root; `npm run lint` and
  `npm run format` must pass before opening a PR.
- New code should avoid `any` whenever possible; ESLint flags it as a warning.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). Common
prefixes used in this repo:

- `feat:` — user-visible new functionality
- `fix:` — user-visible bug fix
- `docs:` — documentation only
- `refactor:` — internal refactor without behavior change
- `test:` — adding or updating tests
- `chore:` — tooling, CI, dependencies

## Releases

The library uses [Changesets](https://github.com/changesets/changesets) for
versioning and publishing. When your PR changes user-visible behaviour of a
published package, add a changeset:

```bash
npx changeset
```

Pick the affected package, choose the semver bump, write a short note, and
commit the generated file under `.changeset/`. Maintainers will run
`changeset version` and `changeset publish` when cutting a release.

## Pull requests

1. Fork the repository.
2. Create a branch off `dev-2.x` (or `main` if 2.x is released).
3. Make focused commits; keep diffs small.
4. Ensure `npm run build && npm run lint && npm test` all pass.
5. Open a PR describing _what_ changed and _why_. Reference related issues.

## Reporting issues

Please open issues on
[GitHub Issues](https://github.com/apvee/azure-functions-nodejs-monorepo/issues)
with:

- a clear description of the problem,
- a minimal reproduction (a failing test case is best),
- the version of `@apvee/azure-functions-openapi`, Node.js, and
  `@azure/functions` you are using.

For security-sensitive reports, please use a private channel —
[hello@apvee.com](mailto:hello@apvee.com).
