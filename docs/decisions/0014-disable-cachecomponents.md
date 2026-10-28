# 0014 — Disable Next.js `cacheComponents`

**Date**: 2026-10-28
**Status**: Accepted

## Context

`create-next-app` (Next.js 16) scaffolded `next.config.ts` with `cacheComponents: true` (and
`partialPrefetching: true`) on by default. `cacheComponents` is Next's newer caching model: it tries
to statically prerender everything and requires every dynamic data access (reading `cookies()`, an
uncached `fetch`, etc.) to be wrapped in a `<Suspense>` boundary, marked `"use cache"`, or opted into
blocking with `export const instant = false`. It also rejects route-segment config like
`export const runtime`.

StockPilot's pages are almost all **per-user and auth-gated**: the dashboard reads the session
cookie, the session API sets it, and future product pages are scoped to the signed-in user. There is
very little that can be meaningfully prerendered or cached. Under `cacheComponents`, every such page
needs ceremony (Suspense wrappers / `instant = false`) that buys us nothing here, and it already
blocked the session route (`runtime`) and the dashboard (cookie read) during the build.

## Decision

- Turn `cacheComponents` **off** (remove it and `partialPrefetching` from `next.config.ts`). The app
  uses standard Next rendering: static where a page has no dynamic input (`/`, `/sign-in`,
  `/sign-up`), server-rendered on demand where it reads per-user state (`/dashboard`, API routes).
- Revisit if genuinely static or ISR-friendly surfaces appear (e.g. a public marketing page or
  cacheable catalog views), at which point `cacheComponents` with targeted `"use cache"` could pay
  off.

## Consequences

- No Suspense-everywhere requirement for cookie/session reads; pages that read `cookies()` are simply
  dynamic, which is correct for an auth-gated app.
- We forgo partial prerendering for now — acceptable, since the dynamic pages wouldn't benefit.
- If we later want it back, this ADR is superseded and the dynamic pages get explicit cache
  boundaries at that time.
