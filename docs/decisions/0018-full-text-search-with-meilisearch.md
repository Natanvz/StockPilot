# 0018 — Full-text product search with Meilisearch

**Date**: 2026-10-30
**Status**: Accepted (revisits the "remove free-text search" bullet of ADR
[0015](0015-server-side-product-list-and-pager.md))

## Context

ADR 0015 dropped the free-text search box: Firestore has **no native substring/full-text search**, so
a client-side search over loaded pages would be misleading next to accurate page counts. We narrowed
with server-side `status` + `category` filters instead and recorded true search as a "search index"
follow-up.

We now want real search (type part of a product name, get matches across the whole catalog, with typo
tolerance). Firestore still can't do this, so the standard answer is a dedicated **search engine** that
mirrors the data. The constraint that shaped the choice: this project's local-dev story is
**zero-config on the Firebase emulator** (no external accounts, runs offline), and we want to keep it.

## Decision

- **Add Meilisearch** (open-source, self-hosted) as the product search index.
  - Runs locally via Docker/binary, so **dev and CI need no external account or keys** — it preserves
    the zero-config/emulator posture. (Algolia would be hosted-only; see alternatives.)
  - A single `products` index mirrors each product's searchable fields: `id`, `name`, `category`,
    `categoryId`, `price`, `status`, `createdAt`. `name` + `category` are **searchable**;
    `status` + `categoryId` are **filterable**; `createdAt`/`price` are **sortable**.
- **Firestore stays the source of truth.** The Meilisearch index is a **derived** read model that can
  be rebuilt at any time.
- **Sync (dual-write), best-effort.** A `lib/search/product-index.ts` module wraps the Meilisearch
  client (`indexProduct` / `removeProduct` / `search`). The product API routes call it **after** a
  successful Firestore write; a category rename reindexes the affected products. Indexing failures are
  **logged, never fatal** — a search engine being down must not break a Firestore write. A
  `reindex` script rebuilds the index from Firestore (first run, or drift recovery).
- **Graceful degradation.** If Meilisearch is not configured or not reachable, the **search box is
  hidden** and the dashboard uses the existing `status`/`category` filters + cursor pager. The app
  never crashes because search is unavailable.
- **Search UX.** With a query present, the dashboard shows **Meilisearch results** — Meilisearch's own
  pagination, with the `status`/`category` selections passed through as Meilisearch filters. Clearing
  the query returns to the Firestore-backed cursor pager (ADR 0015). Search and the cursor pager are
  two modes of the same list, not a merge.
- **Config via env.** `MEILI_HOST` and `MEILI_API_KEY` — a dev master key lives in `.env.development`;
  a real key is a deployment secret. Absent/blank config = the degraded (no-search) mode above.

## Alternatives considered

- **Algolia (Firebase Extension)** — the canonical Firestore→search sync with the least custom code,
  but **hosted-only**: needs an account + keys and can't run on the emulator/CI, breaking zero-config.
  Rejected on the local-dev constraint.
- **Typesense (self-hosted)** — essentially equivalent to Meilisearch for our needs; chose Meilisearch
  for its simpler API and single-binary footprint.
- **Firestore prefix search** (range query on a normalized field) — no new service, but **prefix-only**
  (no mid-word or typo tolerance). Too weak to call "search".
- **Client-side search over loaded pages** — only searches the current page; misleading. (This is the
  option ADR 0015 explicitly rejected.)

## Consequences

- Real substring + typo-tolerant search across the whole catalog.
- New moving parts: a local service to run (Docker/binary), a dependency (the `meilisearch` JS
  client), and a sync path to keep consistent. Consistency is **eventual**; the `reindex` script
  recovers any drift, and Firestore remains authoritative.
- CI runs Meilisearch as a service container for search e2e; unit tests mock the client.
- Local dev gains a step (start Meilisearch) — documented in the local-development guide, and the app
  still runs fully without it (just no search box).
