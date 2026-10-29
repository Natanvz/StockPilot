# 0015 — Server-side product list (filter + sort + count) and a cursor pager

**Date**: 2026-10-29
**Status**: Accepted

## Context

The product list paged with a cursor server-side, but **status filter, sort, and search ran
client-side** over the pages loaded so far, and the UI was "Load more." That's fine at small scale but
has two problems: filters/sort only see loaded pages, and a classic pager ("Page X of Y · N items")
needs a total count that **matches the shown set** — which only works if filtering happens
server-side.

Firestore constraints shape what a pager can do: cursors go forward (`startAfter`) and backward (a
remembered cursor / `endBefore`), but there is **no offset** — you cannot cheaply jump to page N.
`count()` aggregation gives a cheap total. Firestore also has **no substring/full-text search**.

## Decision

- **Move status filter and sort into the Firestore query** (`where('status','==',…)` + `orderBy`),
  keeping cursor pagination. Add composite indexes in `firestore.indexes.json` for each
  `(status) + orderBy(<sortField>)` combination.
- **Add a count** (`count()` aggregation over the same filter) and return `{ products, nextCursor,
total }` from `GET /api/products`.
- **Replace "Load more" with a pager**: Prev · Next, "Page X of Y", "N items", and a page-size
  select. The client keeps a **cursor stack** (the cursor starting each visited page) for Prev. No
  arbitrary page-jump / Last — that's the Firestore no-offset limitation, stated in the UI.
- **Remove the free-text search box.** It can't be server-side in Firestore without a search index,
  and a client-side search over one page would be misleading next to accurate page counts. The
  narrowing control returns as a **server-side category filter** (ADR 0016); true search is the
  search-index path in `design/scalability.md`.

## Consequences

- Filter/sort/count are now consistent and correct across the whole catalog, not just loaded pages.
- The data flow changes from a TanStack **infinite** query to a page-at-a-time query keyed on
  `{ status, sort, cursor, limit }`.
- Production needs the composite indexes deployed (handled in ADR 0017's rules/index deploy).
- A feature (free-text search) is intentionally dropped now and re-planned; documented so it's a
  deliberate trade-off, not a regression by accident.
