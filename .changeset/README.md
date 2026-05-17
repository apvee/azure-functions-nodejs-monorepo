# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing for the public packages in `packages/*`.

## Quick usage

When you make a user-facing change to a publishable package, run:

```bash
npx changeset
```

Pick the affected packages, choose the semver bump (`patch` / `minor` / `major`) and write a short description. Changesets stores the result in this folder as a Markdown file — commit it alongside the code change.

When a release is cut, `npx changeset version` consolidates the pending markdown files into the package `CHANGELOG.md` and updates `package.json` versions; `npx changeset publish` publishes the bumped packages to npm.

`test-functions` is intentionally listed in `ignore` because it is a sample app, not a published package.
