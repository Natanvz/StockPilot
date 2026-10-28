# Code quality

> The decision and rationale are in ADR [0005](../decisions/0005-code-quality-enforcement.md). This
> guide is the practical "what runs and how." Status: confirmed as the toolchain lands in Phase 1.

Quality is enforced by tooling that runs automatically — not by memory or review alone.

## The rules

| Concern    | Tool                 | Rule                                                                                         |
| ---------- | -------------------- | -------------------------------------------------------------------------------------------- |
| Formatting | **Prettier**         | One shared config. No manual style debates; run the formatter.                               |
| Linting    | **ESLint**           | Next.js + TypeScript rule sets, plus import ordering (alphabetical).                         |
| Types      | **TypeScript**       | `strict: true`, `noUnusedLocals`. No implicit `any`, no `@ts-ignore` to silence real errors. |
| Tests      | **Vitest**           | Security-critical paths (data layer, auth/role helpers) are tested, deny branches included.  |
| Complexity | **ESLint + sonarjs** | Ceilings on complexity, function/file length, nesting, params — see below.                   |

## Clean code & complexity

Readable code isn't just formatting — it's keeping functions small and logic shallow. We enforce
that with lint rules, so "this is getting too complex" is caught by the build, not left to a
reviewer's mood. Starting thresholds (tuned as the code grows):

| Rule                                                    | Limit | What it catches                                             |
| ------------------------------------------------------- | ----- | ----------------------------------------------------------- |
| `complexity`                                            | 10    | Cyclomatic complexity — too many branches in one function.  |
| `max-lines-per-function`                                | 60    | Functions doing too much; split them.                       |
| `max-lines`                                             | 300   | Files that have become grab-bags; split by responsibility.  |
| `max-depth`                                             | 3     | Deeply nested `if`/`for`; flatten with early returns.       |
| `max-params`                                            | 4     | Long parameter lists; pass an options object instead.       |
| `max-nested-callbacks`                                  | 3     | Callback pyramids; use `async`/`await`.                     |
| `sonarjs/cognitive-complexity`                          | 15    | How hard code is for a _human_ to follow (weights nesting). |
| `sonarjs/no-duplicate-string`, `no-identical-functions` | —     | Copy-paste that should be factored out.                     |

These are ESLint **errors**, so they fail the pre-commit hook and CI alongside the other rules.

**The escape hatch.** A limit will occasionally be wrong for a genuinely irreducible piece of code.
In that case, disable the rule on that specific line with a reason — never blanket-disable a file:

```ts
// eslint-disable-next-line complexity -- exhaustive status-code switch, flat and intentional
```

A disable without a `--` reason is itself a lint error. The point is that every exception is a
deliberate, documented choice.

## Commands

```bash
npm run format       # Prettier: write
npm run lint         # ESLint: check
npm run lint:fix     # ESLint: auto-fix
npm run check        # TypeScript type-check (must be zero errors)
npm run test         # Vitest: run the suite
```

## How it's enforced

1. **Pre-commit hook** — Husky + lint-staged run Prettier, ESLint, and the related tests on staged
   files before a commit is accepted. Do not bypass with `--no-verify` (core-belief #7).
2. **CI** — a GitHub Actions workflow on every push runs install → lint → type-check → test. A red
   CI blocks merge.

## Conventions

- Explain _why_ in a comment only where the code isn't self-evident; don't narrate the obvious.
- Keep modules single-purpose: the HTTP layer, the auth helpers, the data layer, and the UI stay
  separable.
- Follow the core beliefs in [../core-beliefs.md](../core-beliefs.md).
