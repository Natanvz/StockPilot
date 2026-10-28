# 0003 — Use REST (Route Handlers), not GraphQL

**Date**: 2026-10-28
**Status**: Accepted

## Context

We considered whether to expose the API as REST or GraphQL, and specifically whether a framework that
**auto-generates** a GraphQL layer from the database schema would save work.

Findings on auto-generation:

| Framework | Generates API from | Authorization model |
|---|---|---|
| Hasura | A SQL database (Postgres, etc.) | Declarative per-table permission rules keyed on a role + session variables (e.g. `x-hasura-user-id`) from JWT claims |
| PostGraphile | Postgres schema | Postgres row-level security (RLS) + database roles |
| Supabase `pg_graphql` | Postgres schema | Postgres RLS |
| Prisma + Pothos/Nexus | Prisma schema (code-first, not pure auto-gen) | Written in resolver code / middleware |

Two things stand out:

1. Every true "generate from schema" tool targets **SQL** databases. This project uses **Firestore**
   (NoSQL). None of them generate a GraphQL layer from Firestore. GraphQL on Firestore would mean
   hand-writing resolvers (e.g. Apollo Server) over our repository — more code, no generation.
2. The data is a single entity (`products`) with plain CRUD. GraphQL's core benefit — clients
   selecting exactly the fields they need across a rich graph — buys us little here.

The common authorization pattern in the auto-gen tools is worth keeping even without them: they push
authorization **down into the data layer** (declarative rules or database RLS) rather than scattering
checks through resolver code.

## Decision

- Expose a **REST API** via Next.js Route Handlers.
- Do **not** adopt GraphQL. Auto-generation doesn't apply to Firestore, and GraphQL's strengths
  don't pay off for single-entity CRUD.
- Borrow the auto-gen tools' *spirit*: centralize authorization in one server-side place
  (`requireUser` / `requireRole` + the repository), not spread across handlers.

## Consequences

- Simpler auth story and less surface to maintain.
- If the domain later grows into a rich, interconnected graph with many client shapes, revisit
  GraphQL; this ADR would be superseded, not edited.
- Input validation moves to the REST boundary via Zod schemas (core-belief #3), filling the role a
  GraphQL schema's type system would otherwise play.
