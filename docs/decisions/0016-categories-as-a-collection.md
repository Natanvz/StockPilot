# 0016 — Categories as a Firestore collection with admin CRUD

**Date**: 2026-10-29
**Status**: Proposed

## Context

`category` is currently a free-text string on each product. That's quick but has no validation, no
canonical list, invites typos and duplicates ("Tools" vs "tools"), and can't back a server-side
category filter. The product is also moving to server-side filtering (ADR 0015), which wants a real,
queryable category value.

## Decision (proposed)

- Add a **`categories/{categoryId}`** collection: `{ name, ownerId, createdAt, updatedAt }`, with a
  `categoryRepository`, a Zod schema, and REST routes (`/api/categories`, `/api/categories/[id]`) —
  `requireUser` to read, `requireRole('admin')` to write — mirroring the products pattern.
- **Admin categories screen**: list + create / edit / delete, linked from the dashboard for admins
  only (viewers never see it; the server still enforces).
- Products reference a category by **`categoryId`** (keep the `name` denormalized on the product for
  cheap display, refreshed if a category is renamed). The product form's category field becomes a
  **select** sourced from the categories list.
- The dashboard gains a **server-side category filter** (the narrowing control that replaces the
  dropped free-text search).
- **Migration**: a one-off backfill creates categories from the distinct existing `category` strings
  and sets each product's `categoryId`.

## Consequences

- Categories become manageable, validated, and filterable server-side.
- Renames need either denormalized-name refresh (a small fan-out update) or resolve-on-read; we start
  with denormalized name + an update on rename.
- Adds a collection + routes + a small admin screen; justified by the data-quality and filtering win.
- Deleting a category that products reference needs a rule (block, or reassign to "Uncategorized") —
  decided at implementation.
