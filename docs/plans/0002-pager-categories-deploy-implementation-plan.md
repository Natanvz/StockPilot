# Implementation plan — Server-side pager, categories collection, string cleanup

**Status**: Active
**Date**: 2026-10-29
**Related ADRs**: [0015](../decisions/0015-server-side-product-list-and-pager.md),
[0016](../decisions/0016-categories-as-a-collection.md); evolves
[0006](../decisions/0006-scalability-posture.md),
[0013](../decisions/0013-data-fetching-and-forms.md).

Follow-up work in ordered, reviewable parts.

**Progress**: Part 1 ✅ done · Part 2 ✅ done (commit `7fd8e86`) · Part 3 🔨 in progress ·
Part 4 ❌ dropped (deployment out of scope — [ADR 0017](../decisions/0017-deploy-to-vercel.md) Rejected).

## Part 1 — Code-constant cleanup (ADR 0013 follow-up) ✅ done

Replace magic string literals used in _logic_ (not UI copy — that's already i18n) with named
constants, and fix the one real smell: the `'new'` form-mode sentinel.

- `lib/auth/roles.ts`: add a `ROLE` value object (`ROLE.ADMIN` / `ROLE.VIEWER`) alongside the `Role`
  union; use it in comparisons (`requireRole`, `role === ROLE.ADMIN`).
- `lib/validation/product.ts`: add a `STATUS` value object (`STATUS.ACTIVE` / `STATUS.INACTIVE`).
- Product form dialog: replace `Product | 'new' | null` with a **discriminated union**
  (`{ mode: 'create' } | { mode: 'edit'; product: Product } | null`).
- **Ships when**: no bare role/status literals remain in logic; the form state is a typed union;
  lint, tsc, and tests pass.

## Part 2 — Server-side list querying + classic pager (ADR 0015) ✅ done

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

## Part 3 — Categories as a collection (ADR 0016) 🔨 in progress

Promote `category` from a free-text string on the product to its own collection with admin CRUD.
Built in three green sub-commits:

**3a — Categories backend.**

- New `categories/{categoryId}` collection: `{ name, ownerId, createdAt, updatedAt }`.
- `categoryRepository` (list/getById/create/update/remove) + Zod schema; REST routes
  (`/api/categories`, `/api/categories/[id]`) with `requireUser` (read) / `requireRole('admin')`
  (write), mirroring products. Client + `use-categories` hooks. Repo unit tests (incl. deny branches).

**3b — Admin categories screen.**

- A small admin screen (list + create / edit / delete), linked from the dashboard for admins only
  (`app/(dashboard)/categories`). Viewers never see the link; the server still enforces.

**3c — Product ↔ category integration.**

- Product stores `categoryId` **plus** a denormalized `category` name (ADR 0016 — resolved). The
  product form's category field becomes a **select** sourced from the categories list; the client
  sends only `categoryId`, the server resolves + stores the name.
- **Rename fan-out**: `productRepository.renameCategory(id, name)` updates the denormalized name on
  referencing products; the category PATCH route calls it after the rename.
- **Delete block**: the category DELETE route returns 409 when
  `productRepository.countByCategory(id) > 0`.
- Dashboard gains a server-side **category filter** (the narrowing control that replaced search).
- `firestore.indexes.json`: add `categoryId` + sort-field and `status` + `categoryId` + sort-field
  composite indexes.
- Backfill script for existing free-text categories; e2e seed creates categories; product repo test
  - e2e updated for the select.
- **Ships when**: admins can CRUD categories; the product form picks from them; the dashboard filters
  by category server-side; delete-while-referenced is blocked; lint/tsc/unit/e2e/build green.

## Decisions / trade-offs

- **Pager over Load-more** + **server-side filter/sort**: accurate "Page X of Y" needs the count to
  match the shown set, which needs server-side filtering (ADR 0015). Cursor pagination means Prev/Next
  (+ a cursor stack), not arbitrary page jumps — the honest Firestore constraint.
- **Drop free-text search** for now; reintroduce as a server-side **category filter** (Part 3) and,
  at scale, a search index (`design/scalability.md`).
- **Categories as a collection** (ADR 0016) vs. a free-text string: enables admin management,
  validation, and a server-side filter; small migration cost. Rename fans out to the denormalized
  product name; delete is blocked while referenced (both resolved in ADR 0016).
- **Deployment dropped** ([ADR 0017](../decisions/0017-deploy-to-vercel.md) Rejected): CD was a
  bonus add-on, not a brief requirement, and the owner chose not to pursue a live deploy.
