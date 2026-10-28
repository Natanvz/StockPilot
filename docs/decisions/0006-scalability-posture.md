# 0006 — Scalability posture: stateless compute + maintained aggregate counters

**Date**: 2026-10-28
**Status**: Accepted

## Context

StockPilot needs to scale, and there are two direct questions: how the schema evolves for
multi-tenancy, and for 10× the products. Our early docs covered the data-model pieces (cursor
pagination, indexes) but had no single statement of the overall posture, and nowhere that named the
four quality pillars (architecture, security, scalability, code quality) and our stance on each.

Firestore's cost and performance model shaped the decision: you pay per document read, a single
document sustains ~1 write/second, and there are no cross-collection joins.

## Decision

- **Compute is stateless.** The only per-request state is the session cookie; nothing is held in
  server memory. The app scales horizontally / serverless with no sticky sessions.
- **Read-cheap query shapes.** Cursor pagination (`startAfter` + `limit`), not offsets; targeted
  composite indexes only; no N+1 reads.
- **Metrics via maintained aggregate counters.** Keep a `stats/products` document (total, active
  count, revenue) updated transactionally on each product write, so the dashboard reads O(1) numbers
  instead of scanning the collection. The single-document ~1 write/sec limit is handled by a
  **sharded counter** _only if_ write rate demands it — documented now, deferred until needed.
- **Multi-tenancy path**: prefer a `tenants/{id}/products` subcollection (strong isolation, per-tenant
  counters) over a flat `tenantId` field, unless cross-tenant reporting becomes core. Single-tenant
  today; this is the migration plan, not current code.
- **Name the four pillars explicitly.** `architecture.md` gets a "Quality attributes" section stating
  our stance on each and linking the detail; `core-beliefs.md` gets belief #8 (scale-awareness).
  Full detail in [../design/scalability.md](../design/scalability.md).

## Consequences

- List performance and metric cost stay flat as the collection grows to 10× and beyond; the one
  thing to watch (counter write rate) has a named, deferred fix.
- The scalability thinking is in one place, answering both growth questions (multi-tenancy, 10×).
- Some machinery (sharded counters, caching, real multi-tenancy) is intentionally _not_ built now;
  each is listed as deferred with its trigger condition, per core-belief #8.
