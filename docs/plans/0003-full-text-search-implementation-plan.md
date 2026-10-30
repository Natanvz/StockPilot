# Implementation plan — Full-text product search (Meilisearch)

**Status**: Active
**Date**: 2026-10-30
**Related ADRs**: [0018](../decisions/0018-full-text-search-with-meilisearch.md); revisits
[0015](../decisions/0015-server-side-product-list-and-pager.md); touches
[0016](../decisions/0016-categories-as-a-collection.md).

Bring back a real search box, backed by Meilisearch (ADR 0018). Firestore stays the source of truth;
the Meilisearch index is a derived read model kept in sync by a best-effort dual-write. Built in three
ordered, reviewable parts. Throughout: **the app must run fully with Meilisearch absent** (search box
just hidden).

## Part 1 — Search index + sync (backend)

- Add the `meilisearch` JS client dependency.
- `lib/search/product-index.ts`: read `MEILI_HOST` / `MEILI_API_KEY`; expose `isSearchEnabled()`,
  `ensureProductIndex()` (searchable `name`,`category`; filterable `status`,`categoryId`; sortable
  `createdAt`,`price`), `indexProduct(product)`, `removeProduct(id)`, and `search(params)`. All writes
  are **best-effort**: wrapped so a Meilisearch error is logged and swallowed, never thrown into the
  request path.
- Wire sync into the product routes **after** the Firestore write succeeds: POST → index, PATCH →
  re-index, DELETE → remove. Category **rename** (ADR 0016 fan-out) → re-index the affected products
  (extend `renameCategory` to return the updated products, or re-read them, then index).
- `scripts/reindex-search.mjs` (+ `npm run reindex:search`): rebuild the index from Firestore.
- Local run: `npm run search` (Meilisearch via Docker) + a binary fallback note; env defaults in
  `.env.development` and `.env.example`; document in `docs/guides/local-development.md`.
- Unit tests: mock the `meilisearch` client — index/remove/search call the client correctly, and a
  thrown client error is swallowed (best-effort) not propagated; `isSearchEnabled()` reflects config.
- **Ships when**: product writes sync to the index best-effort (failure logged, non-fatal); reindex
  rebuilds it; the app runs normally with Meilisearch off; lint/tsc/unit green.

## Part 2 — Search endpoint + dashboard UI

- `GET /api/products/search?q=&status=&categoryId=&page=` (auth required) → `product-index.search`,
  returning `{ products, total, page, totalPages }` from Meilisearch (its own pagination). Returns a
  clear "search unavailable" signal when `!isSearchEnabled()`.
- Client: `productsApi.search(...)` + a `useProductSearch` hook; expose whether search is enabled
  (a public `NEXT_PUBLIC_SEARCH_ENABLED` flag or a tiny status endpoint).
- Dashboard: a debounced **search box**. With a non-empty query, render Meilisearch results with the
  `status`/`category` selections passed as Meilisearch filters, and a simple page control; with an
  empty query, fall back to the existing Firestore cursor pager (ADR 0015). Hide the box entirely when
  search is disabled.
- **Ships when**: typing searches the whole catalog (name/category), status/category still narrow it,
  clearing returns to the cursor pager, the box is hidden when unconfigured; lint/tsc/build green.

## Part 3 — Tests & CI

- Unit: the search route's param parsing + the disabled-path response.
- e2e (Playwright): run **Meilisearch as a CI service container**; the e2e setup seeds the index
  (reuse `reindex` or index the seeded products), then a test searches by name and asserts the match.
  Keep the existing suites green (search box hidden paths unaffected when the service is down locally).
- CI: add the Meilisearch service to the e2e job; the unit/build job is unchanged.
- **Ships when**: CI runs the search e2e green; full `npm run test` + build pass.

## Decisions / trade-offs (from ADR 0018)

- **Dual-write, best-effort, Firestore authoritative**: simplest sync that keeps the primary write
  safe; the index is eventually consistent and rebuildable (`reindex`). A trigger/Cloud Function sync
  is the heavier alternative, deferred.
- **Search replaces the list while querying** (not merged with the cursor pager): two clean modes
  instead of reconciling Meilisearch ranking with Firestore cursors.
- **Self-hosted Meilisearch over hosted Algolia**: keeps zero-config local dev and keyless CI; costs a
  local service to run.
- **Graceful degradation is a first-class requirement**, not an afterthought: every part is verified
  with search both on and off.
