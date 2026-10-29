# Implementation plan — Server-side pager, categories collection, string cleanup, deploy

**Status**: Active
**Date**: 2026-10-29
**Related ADRs**: [0015](../decisions/0015-server-side-product-list-and-pager.md),
[0016](../decisions/0016-categories-as-a-collection.md),
[0017](../decisions/0017-deploy-to-vercel.md); evolves [0006](../decisions/0006-scalability-posture.md),
[0013](../decisions/0013-data-fetching-and-forms.md).

A second plan covering four pieces of follow-up work. Parts are ordered; each is a reviewable unit.

## Part 1 — Code-constant cleanup (ADR 0013 follow-up) ✅ do now

Replace magic string literals used in _logic_ (not UI copy — that's already i18n) with named
constants, and fix the one real smell: the `'new'` form-mode sentinel.

- `lib/auth/roles.ts`: add a `ROLE` value object (`ROLE.ADMIN` / `ROLE.VIEWER`) alongside the `Role`
  union; use it in comparisons (`requireRole`, `role === ROLE.ADMIN`).
- `lib/validation/product.ts`: add a `STATUS` value object (`STATUS.ACTIVE` / `STATUS.INACTIVE`).
- Product form dialog: replace `Product | 'new' | null` with a **discriminated union**
  (`{ mode: 'create' } | { mode: 'edit'; product: Product } | null`).
- **Ships when**: no bare role/status literals remain in logic; the form state is a typed union;
  lint, tsc, and tests pass.

## Part 2 — Server-side list querying + classic pager (ADR 0015)

Move **status filter + sort to Firestore**, add a **count**, and replace "Load more" with a pager.

- Repository `list({ limit, cursor, status, sort })`: `where('status','==',…)` when not "all",
  `orderBy` the chosen sort field (+ `documentId` tiebreaker), `startAfter` cursor; returns
  `{ products, nextCursor }`. New `countProducts({ status })` via `count()` aggregation.
- `firestore.indexes.json`: composite indexes for `(status ==) + orderBy(<sortField>)` for each sort.
- API: `GET /api/products?limit&cursor&status&sort` returns `{ products, nextCursor, total }`.
- Client: `useProducts({ status, sort, cursor, limit })` as a **page-at-a-time** `useQuery` (not
  infinite); the dashboard holds `status`, `sort`, `pageSize`, a **page index**, and a **cursor
  stack** (the cursor that starts each visited page) to support **Prev/Next**.
- New `<Pagination>` primitive: **Prev · Next**, **"Page X of Y"**, **"N items"**, **page-size
  select**. No arbitrary page-jump/Last (Firestore cursors can't skip to page N cheaply — documented).
- **Search box is removed** (see ADR 0015): it would only cover the current page and can't be
  server-side without a search index. A **category filter** returns later (Part 3).
- Update `components/products/dashboard.tsx` (drop client filter/sort/search helpers), repo tests,
  and the e2e (no "Load more"; CRUD flow unchanged).
- **Ships when**: paging works Prev/Next with accurate "Page X of Y · N items"; status filter + sort
  run server-side; page-size select works; lint/tsc/unit/e2e/build green.

## Part 3 — Categories as a collection (ADR 0016)

Promote `category` from a free-text string on the product to its own collection with admin CRUD.

- New `categories/{categoryId}` collection: `{ name, createdAt, updatedAt }` (+ `ownerId`).
- `categoryRepository` (list/get/create/update/remove) + Zod schema; REST routes
  (`/api/categories`, `/api/categories/[id]`) with `requireUser` (read) / `requireRole('admin')`
  (write), mirroring products.
- Product form: category becomes a **select** sourced from the categories list; the product stores a
  `categoryId` (keep `category` name denormalized for display, or resolve on read).
- A small **admin categories screen** (list + create/edit/delete), linked from the dashboard for
  admins only.
- Dashboard gains a server-side **category filter** (replaces the removed search as the narrowing
  control).
- Migration note: existing products have a free-text `category`; document a one-off backfill
  (create categories from distinct names, set `categoryId`).
- **Ships when**: admins can CRUD categories; the product form picks from them; the dashboard filters
  by category server-side; tests cover the category repo deny branches.

## Part 4 — Deploy / CD (ADR 0017)

Deploy the app and wire continuous deployment.

- **Vercel** via its native GitHub integration: preview deploy per PR, production deploy on merge to
  `main`. Set the `NEXT_PUBLIC_FIREBASE_*` + Admin `FIREBASE_*` env vars in Vercel (real Firebase
  project). `.env.development` keeps local dev on the emulator; production reads Vercel env.
- **Firestore rules** aren't deployed by Vercel — add a small GitHub Actions step on `main`
  (`firebase deploy --only firestore:rules,firestore:indexes`) using a `FIREBASE_SERVICE_ACCOUNT`
  secret, so rules + composite indexes ship with the app.
- `docs/guides/deployment.md`: finalize the exact steps.
- **Ships when**: a push to `main` deploys a working live URL; rules + indexes are deployed; CI stays
  green. (Requires a GitHub repo + Vercel project + Firebase project + secrets — provided by the
  owner.)

## Decisions / trade-offs

- **Pager over Load-more** + **server-side filter/sort**: accurate "Page X of Y" needs the count to
  match the shown set, which needs server-side filtering (ADR 0015). Cursor pagination means Prev/Next
  (+ a cursor stack), not arbitrary page jumps — the honest Firestore constraint.
- **Drop free-text search** for now; reintroduce as a server-side **category filter** (Part 3) and,
  at scale, a search index (`design/scalability.md`).
- **Categories as a collection** (ADR 0016) vs. a free-text string: enables admin management,
  validation, and a server-side filter; small migration cost.
- **Vercel** (ADR 0017) over a hand-rolled Actions deploy: native preview + prod deploys for a
  Next.js app; Actions only deploys the Firebase rules/indexes.
