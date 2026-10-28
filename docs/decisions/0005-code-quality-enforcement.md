# 0005 — Code-quality enforcement: lint + format + strict types + hook + CI

**Date**: 2026-10-28
**Status**: Accepted

## Context

We want code that stays readable, consistent, and maintainable, enforced by tooling that runs
automatically rather than left to memory or reviewer vigilance. The CI side of this also gives us a
continuous-integration pipeline from day one.

## Decision

- **Formatting**: Prettier, one shared config, no per-file style debates.
- **Linting**: ESLint with the Next.js + TypeScript rule sets, plus import-ordering.
- **Types**: TypeScript `strict: true`, `noUnusedLocals`; `npm run check` must pass with zero errors.
- **Clean code / complexity**: ESLint complexity rules enforce ceilings on cyclomatic complexity,
  function length, file length, nesting depth, and parameter count, plus `eslint-plugin-sonarjs` for
  cognitive complexity and copy-paste detection. These are lint errors, so they run in the same
  hook-and-CI gate — a function that grows too tangled fails the build, not a review comment.
  Thresholds and the escape hatch (a justified inline `eslint-disable` with a reason) are in
  [../guides/code-quality.md](../guides/code-quality.md).
- **Pre-commit hook**: Husky + lint-staged run Prettier, ESLint, and related tests on staged files
  before a commit is accepted. Don't bypass with `--no-verify` (core-belief #7).
- **CI**: a GitHub Actions workflow on every push runs install → lint → type-check → test. A red CI
  blocks merge.
- The rules and commands are documented in [../guides/code-quality.md](../guides/code-quality.md).

## Consequences

- Style and a class of type/lint bugs are caught before code lands, keeping the diff reviewable.
- The CI workflow gives a lint + test pipeline on every push.
- Slight local friction (the hook runs on commit); accepted as the cost of consistency.
- Coverage is thoughtful, not a day-one 100% gate (core-belief #8) — the hook runs _related_ tests,
  CI runs the full suite.
