# Database schema (Firestore)

> Status: initial design. Field names and indexes are confirmed as the data layer lands.

Firestore is a NoSQL document database: data lives in **collections** of **documents**, and a
document can hold **subcollections**. There are no joins and no server-side `WHERE` across
collections, so the model is shaped around the queries the dashboard actually runs.

## Collections

### `products/{productId}`

One document per product.

| Field        | Type      | Notes                                                                                                                |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------------- |
| `name`       | string    | 1–100 chars.                                                                                                         |
| `categoryId` | string    | References a `categories` document (ADR 0016). Used by the server-side category filter.                              |
| `category`   | string    | **Denormalized** category name, kept on the product for cheap table display. Refreshed on category rename (fan-out). |
| `price`      | number    | **Integer, in cents** — avoids floating-point money errors. `1999` = $19.99.                                         |
| `status`     | string    | `"active"` or `"inactive"`.                                                                                          |
| `ownerId`    | string    | `uid` of the user who created it. Enables per-owner scoping and future multi-tenancy.                                |
| `createdAt`  | timestamp | Set on create.                                                                                                       |
| `updatedAt`  | timestamp | Set on every write.                                                                                                  |

### `categories/{categoryId}`

One document per category (ADR 0016). A small, bounded, admin-managed set.

| Field       | Type      | Notes                                          |
| ----------- | --------- | ---------------------------------------------- |
| `name`      | string    | 1–60 chars. Shown in the product table/filter. |
| `ownerId`   | string    | `uid` of the admin who created it.             |
| `createdAt` | timestamp | Set on create.                                 |
| `updatedAt` | timestamp | Set on every write.                            |

Products reference a category by `categoryId` and also store a **denormalized** copy of its `name`
(so the product table needs no join — Firestore has none). On **rename**, the new name is fanned out
to every referencing product. **Delete** is blocked (409) while any product still references the
category. Since the full category list is small, the product form's category dropdown and the
dashboard filter load it directly.

### `users/{uid}`

One document per user, keyed by the Firebase Auth `uid`.

| Field       | Type      | Notes                                                                                                                                                                                                       |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `email`     | string    | From the Firebase Auth record.                                                                                                                                                                              |
| `role`      | string    | `"admin"` or `"viewer"`. **Mirror** of the Firebase custom claim, stored here so an admin can list users and their roles without the Admin SDK on a read. The claim is the source of truth for enforcement. |
| `createdAt` | timestamp | Set on first sign-in.                                                                                                                                                                                       |

## Why `price` is an integer in cents

Floating-point numbers can't represent many decimal money values exactly (e.g. `0.1 + 0.2`). Storing
cents as an integer keeps sums like the dashboard's "revenue total" exact.

## Indexing strategy

- Single-field indexes are automatic in Firestore.
- The dashboard list filters by `status` and/or `categoryId` and sorts by `createdAt`, `name`, or
  `price` (with cursor pagination). A query that filters on one field and orders by another needs a
  **composite index**, declared in `firestore.indexes.json` and committed to the repo. We add exactly
  the composite indexes the list view's filter+sort combinations require — one per sort field for
  `status`, for `categoryId`, and for `status + categoryId` combined — no more.
- Cursor pagination uses `orderBy(createdAt) + startAfter(cursor) + limit(n)` rather than numeric
  offsets, so paging cost stays flat as the collection grows.

## Summary metrics at scale

The dashboard shows total products, active count, and revenue total. Counting or summing the whole
collection on every load does not scale.

- **Small scale (now)**: compute metrics from the current page / a bounded query. Honest and simple.
- **10× products**: keep **aggregate/counter documents** (e.g. `stats/products` holding
  `total`, `activeCount`, `revenueCents`) updated via a Firestore transaction or trigger on each
  product write, so the dashboard reads three numbers instead of scanning the collection. Firestore's
  `count()` aggregation is an option for counts; sums still benefit from a maintained counter.

## How the schema evolves

**Multi-tenancy.** Add a `tenantId` to each product and scope every query by it. Two shapes:

- _Flat with a field_: `products` stays one collection; every doc gets `tenantId`; all queries carry
  `where('tenantId', '==', ...)`. Simple to migrate to.
- _Subcollection per tenant_: `tenants/{tenantId}/products/{productId}`. Strong natural isolation and
  simpler security rules, at the cost of cross-tenant queries (rarely needed by a tenant-scoped app).

We'd choose the subcollection shape for isolation unless cross-tenant admin reporting became a core
need.

**10× products.** Covered above by maintained aggregate documents and tight composite indexes;
cursor pagination means list performance doesn't degrade with collection size.
