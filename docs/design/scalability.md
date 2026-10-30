# Scalability

> How StockPilot handles growth. The decision and rationale are in ADR
> [0006](../decisions/0006-scalability-posture.md); this doc is the detail. The data-model specifics
> (fields, indexes) live in [database-schema.md](database-schema.md); this doc is the cross-cutting
> view. Status: design — confirmed as the relevant pieces land.

There are two scale questions to answer directly: how the schema evolves for **multi-tenancy** and
for **10× the products**. We answer those plus the dimensions that matter for a growing system. The
guiding rule (core-belief #8): design _within_ the stated targets, don't build
machinery for scale we don't have, and write down the trade-off.

## Dimensions

### 1. Compute & traffic

The Next.js app is **stateless**. The only per-user state is the session cookie, which the client
carries on every request — nothing is held in server memory between requests. So any instance can
serve any request, and the app scales **horizontally**: run more instances behind a load balancer,
or deploy to a serverless platform (Vercel / Firebase Functions) that adds instances on demand. No
sticky sessions, no shared in-memory cache to coordinate.

### 2. Database reads & query shape

Firestore scales storage and throughput automatically, but **you pay per document read** and queries
have fixed shapes. So:

- **Cursor pagination, not offsets.** The list uses `orderBy(createdAt) + startAfter(cursor) +
limit(n)`. Cost is proportional to the page size, not to how deep you've paged — page 1000 costs
  the same as page 1. Offset-style paging would read and discard every skipped document.
- **Targeted composite indexes.** A query that filters on one field and sorts by another needs a
  composite index (declared in `firestore.indexes.json`). We add exactly the ones the list view's
  filter+sort combinations need — each index has a storage and write cost, so we don't add
  speculative ones.
- **No N+1 reads.** The list returns everything it needs in one query; we don't fetch a page of ids
  and then read each document separately.

### 3. Summary metrics (the expensive part)

The dashboard shows total products, active count, and revenue total. Computing these by scanning the
whole collection on every page load is `O(number of products)` reads — fine at 50 products, ruinous
at 50,000.

- **Now (small scale):** compute from a bounded query; honest and simple.
- **At scale:** keep a **maintained aggregate document** — e.g. `stats/products` holding `total`,
  `activeCount`, and `revenueCents` — updated inside the same Firestore transaction that writes a
  product (or via a Firestore trigger). The dashboard then reads **three numbers**, not the whole
  collection. Firestore's `count()` aggregation covers counts; a running sum still benefits from the
  maintained counter.
- **Caveat — the hot-counter limit.** A single Firestore document sustains roughly **1 write per
  second**. If product writes ever exceed that, a single `stats/products` doc becomes a write
  bottleneck. The fix is a **distributed (sharded) counter**: spread the count across N shard docs,
  write to a random shard, and sum the shards on read. We note this now and implement it only if the
  write rate demands it.

### 4. Cost control

Because Firestore bills per read/write/delete, scalability here is as much about **cost** as speed.
The counter pattern (reads drop from O(n) to O(1)), cursor pagination (no wasted reads), and tight
indexes (no wasted write amplification) all keep the bill flat as data grows. Metrics can also be
cached for a short TTL if read volume is high.

### 5. Document & query limits

Firestore caps a document at **1 MB** and has fixed query rules (no cross-collection joins, limited
inequality filters per query). Our documents are small and flat (a product is a handful of scalar
fields), and the dashboard's queries are single-collection with one order key — comfortably inside
the limits. If a product ever needed large nested data, it would move to a subcollection rather than
bloating the parent document.

## Multi-tenancy

Add a tenant boundary so one customer's data never mixes with another's. Two shapes:

| Shape                        | How                                                                               | Trade-off                                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Field on every doc**       | Add `tenantId` to each product; every query carries `where('tenantId','==',...)`. | Easiest migration from today's single-tenant model; isolation depends on never forgetting the filter (backstopped by security rules).                              |
| **Subcollection per tenant** | `tenants/{tenantId}/products/{productId}`.                                        | Strong natural isolation, simpler security rules, per-tenant counters fall out naturally; cross-tenant queries become hard (rarely needed by a tenant-scoped app). |

We'd pick the **subcollection** shape for isolation, unless cross-tenant admin reporting became a
core feature. Either way, the aggregate-counter doc becomes **per tenant** (`tenants/{id}/stats/...`),
which also sidesteps the hot-counter limit by spreading writes across tenants.

## 10× products

Covered by the above: cursor pagination keeps list performance flat, maintained counters keep metrics
`O(1)`, and tight composite indexes keep writes cheap. Nothing in the design degrades as the
collection grows from thousands to tens of thousands of products; the one thing to watch is the
counter write rate, handled by sharding if needed.

## Search

Firestore has **no native substring/full-text search**, so full-text search runs on a dedicated
engine — **Meilisearch** (ADR [0018](../decisions/0018-full-text-search-with-meilisearch.md)).
Firestore stays the source of truth; the Meilisearch index is a **derived read model** kept in sync
by a best-effort dual-write on each product change, and rebuildable from Firestore with a `reindex`
script. Search queries hit Meilisearch server-side (with the same status/category filters as the
list), so cost scales with the engine, not with Firestore reads. Search is **optional** — off by
default; when it's not configured the app falls back to the cursor-paged list (ADR 0015). At larger
scale Meilisearch runs as its own horizontally-scalable service, independent of the app and Firestore.

## What we deliberately defer

- The sharded/distributed counter — documented, built only when write rate requires it.
- A real caching layer for metrics — maintained counters (the scale path) already make reads cheap.
- Full multi-tenancy — single-tenant now; the migration path above is the plan, not today's code.
