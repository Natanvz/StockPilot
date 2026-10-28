# Design

Detailed definitions of things [../architecture.md](../architecture.md) only mentions briefly. The
architecture doc is the map; these are the close-ups.

## Documents

| Doc | What it defines |
|---|---|
| **[database-schema.md](database-schema.md)** | Firestore collections, documents, fields, indexing strategy, and how the schema scales (multi-tenancy, 10× products). |
| **[scalability.md](scalability.md)** | The cross-cutting scalability posture: stateless compute, read-cheap queries, aggregate counters for metrics, multi-tenancy path. |
| **[authorization.md](authorization.md)** | The end-to-end auth and role-enforcement model: sign-in, session cookie, custom claims, server-side checks, failure modes. |
| **[ui-components.md](ui-components.md)** | The reusable UI component set, state management approach, and responsive/accessibility conventions. *(Filled as the UI is built.)* |
