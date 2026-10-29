# 0016 — Categories as a Firestore collection with admin CRUD

**Date**: 2026-10-29
**Status**: Accepted

## Context

`category` is currently a free-text string on each product. That's quick but has no validation, no
canonical list, invites typos and duplicates ("Tools" vs "tools"), and can't back a server-side
category filter. The product is also moving to server-side filtering (ADR 0015), which wants a real,
queryable category value.

## Decision

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

## Resolved at implementation

The two questions this ADR left open are now decided:

- **Rename → fan-out.** A product keeps a denormalized `category` name for cheap table display. On
  rename we update that name on every product with the matching `categoryId` (a batched write), rather
  than resolving the name on every read. The product route orchestrates this; each repository still
  writes only its own collection (`categoryRepository.update` then `productRepository.renameCategory`).
- **Delete → block.** Deleting a category that any product references returns **409 Conflict**. We do
  not silently reassign or orphan products; the admin reassigns or removes those products first. The
  route checks `productRepository.countByCategory(id)` before deleting.

The write path is server-authoritative: the client sends only `categoryId`; the server looks up the
category, rejects an unknown id (400), and stores both `categoryId` and the resolved `category` name.

## Consequences

- Categories become manageable, validated, and filterable server-side.
- Renames cost a small fan-out write; deletes are safe (blocked while referenced).
- Adds a collection + routes + a small admin screen; justified by the data-quality and filtering win.
- Combining a category filter with the status filter + sort needs extra composite indexes
  (`categoryId` + sort field, and `status` + `categoryId` + sort field) — added to
  `firestore.indexes.json`.
