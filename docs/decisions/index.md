# Architectural Decision Records (ADRs)

When a non-trivial design call is made on this project, capture it here as `NNNN-short-title.md`.
**Append-only** — supersede an old ADR with a new one rather than rewriting history.

## When to write an ADR

- The choice affects more than one part of the app.
- A future contributor (or future-you) would benefit from knowing *why*, not just *what*.
- The decision isn't already covered in [../architecture.md](../architecture.md).

If the architecture doc already covers it, update the architecture doc instead. ADRs are for net-new
decisions.

## Template

```markdown
# NNNN — Title of the decision

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Superseded by NNNN

## Context
What changed, what we know, what's unclear.

## Decision
The call we made.

## Consequences
What this enables, breaks, or implies for future work.
```

## Numbering

Sequential, zero-padded to 4 digits. Don't reuse a number even if an ADR is later superseded.

## Index

The individual file's own `Status` line is the source of truth — this table is a convenience view.
Update both together in the same commit whenever a status changes.

| # | Title | Status |
|---|---|---|
| [0001](0001-adopt-docs-and-adr-structure.md) | Adopt docs/ + ADR structure | Accepted |
| [0002](0002-tech-stack-nextjs-firebase-firestore.md) | Tech stack: Next.js (App Router) + Firebase + Firestore | Accepted |
| [0003](0003-rest-over-graphql.md) | Use REST (Route Handlers), not GraphQL | Accepted |
| [0004](0004-auth-session-cookies-admin-sdk-and-custom-claims.md) | Auth: Admin-SDK-verified httpOnly session cookies + custom-claim roles | Accepted |
| [0005](0005-code-quality-enforcement.md) | Code-quality enforcement: lint + format + strict types + hook + CI | Accepted |
| [0006](0006-scalability-posture.md) | Scalability posture: stateless compute + maintained aggregate counters | Accepted |
| [0007](0007-ai-powered-feature.md) | AI-powered feature (product-description generation) | Proposed |
| [0008](0008-observability.md) | Observability (structured logging + error tracking) | Proposed |
| [0009](0009-testing-strategy.md) | Testing strategy: unit (Vitest) + e2e (Playwright) against the emulator | Accepted |
| [0010](0010-frontend-stack-and-component-model.md) | Frontend stack: Tailwind + shadcn/ui (owned components) | Accepted |
| [0011](0011-design-tokens-and-color-system.md) | Design tokens & color system (semantic CSS variables) | Accepted |
| [0012](0012-internationalization.md) | Internationalization (next-intl, structured from day one) | Accepted |
| [0013](0013-data-fetching-and-forms.md) | Data fetching & forms (TanStack Query + react-hook-form + shared Zod) | Accepted |
