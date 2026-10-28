# 0013 — Data fetching & forms (TanStack Query + react-hook-form + shared Zod)

**Date**: 2026-10-28
**Status**: Accepted

## Context

A dashboard that lists, filters, paginates, and edits products repeats the same patterns everywhere:
fetch, loading state, error state, refetch after a change, form validation. Hand-rolling these per
component is the main source of repetitive frontend code. We also don't want validation rules written
twice (once on the client, once on the server).

## Decision

- **TanStack Query (`@tanstack/react-query`)** for server state: one place handles caching, loading /
  error states, and cache invalidation after a mutation. A list view and a create/edit action share
  the same query/mutation primitives instead of each re-implementing fetch + state.
- **react-hook-form** for forms: minimal re-renders, a consistent form API across every form.
- **Shared Zod schemas** via `@hookform/resolvers/zod`: the **same** schema in `lib/validation/`
  validates the form on the client _and_ the request body on the server (ADR
  [0004](0004-auth-session-cookies-admin-sdk-and-custom-claims.md) / core-belief #3). One rule, two
  consumers — no drift.
- **A thin typed API client** wraps the REST calls so components call `productsApi.create(data)`, not
  raw `fetch`, and get types inferred from the Zod schemas end to end.
- **Reusable UX-state components**: `Skeleton`, `EmptyState`, `ErrorState`, and toast notifications
  (`sonner`) so loading/empty/error/success are rendered the same way everywhere.

## Consequences

- The repetitive fetch/loading/error/refetch boilerplate is written once and reused — directly serves
  the "good code, few repetitions" goal.
- Validation is defined once and shared; a schema change updates client and server together.
- Adds a few dependencies (React Query, react-hook-form); justified by how much per-component code
  they remove across a CRUD-heavy dashboard.
