# StockPilot

A mini SaaS dashboard for managing a product catalog. Authenticated users sign in, manage products
(create / read / update / delete), and view live summary metrics, with role-based access (admin vs
viewer) enforced on the server. Built as a single **Next.js (App Router)** app — React UI and Node
API in one codebase — on **Firebase Authentication** and **Cloud Firestore**.

The first version is intentionally focused — it does a few things well rather than many partially.
See
[docs/plans/0001-foundation-and-docs-implementation-plan.md](docs/plans/0001-foundation-and-docs-implementation-plan.md)
for the build plan and [docs/decisions/](docs/decisions/) for why each call was made.

## Run it locally (under 5 minutes)

> Full, exact steps live in [docs/guides/local-development.md](docs/guides/local-development.md).
> This is the short version.

```bash
# 1. Install dependencies
npm install

# 2. Start the Firebase emulators (Auth + Firestore) — no cloud project needed to develop
npm run emulators

# 3. In a second terminal, start the app
npm run dev
# open http://localhost:3000
```

You do **not** need a real Firebase project to run and test locally — the app talks to the local
Firebase Emulator Suite. To deploy, create a free Firebase project and fill in `.env.local` from
`.env.example`; see the local-development guide.

## What's inside

| Area                | Summary                                                                                                                                                        | Detail                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**    | One Next.js app: App Router pages + Route Handlers (the Node API), a Firestore data access layer, Firebase Auth.                                               | [docs/architecture.md](docs/architecture.md)                                                                                                       |
| **Database schema** | `products` and `users` collections in Firestore; indexing and scale notes (multi-tenancy, 10× growth).                                                         | [docs/design/database-schema.md](docs/design/database-schema.md)                                                                                   |
| **Security & auth** | Firebase ID token verified server-side via the Admin SDK, stored in an httpOnly session cookie; roles via custom claims; every write re-checked on the server. | [docs/design/authorization.md](docs/design/authorization.md) · ADR [0004](docs/decisions/0004-auth-session-cookies-admin-sdk-and-custom-claims.md) |
| **Code quality**    | ESLint + Prettier + TypeScript strict, enforced by a pre-commit hook and GitHub Actions CI.                                                                    | [docs/guides/code-quality.md](docs/guides/code-quality.md) · ADR [0005](docs/decisions/0005-code-quality-enforcement.md)                           |
| **Core beliefs**    | The non-negotiable rules this codebase holds to.                                                                                                               | [docs/core-beliefs.md](docs/core-beliefs.md)                                                                                                       |

## Trade-offs

The significant design calls — one Next.js app vs. a split backend, REST vs. GraphQL, session
cookies vs. client-held tokens, what we build for scale now vs. defer — are summarized in the
**Trade-offs** table in [docs/architecture.md](docs/architecture.md#trade-offs), each linking to the
decision record with the full reasoning (for example, the REST-vs-GraphQL call is
ADR [0003](docs/decisions/0003-rest-over-graphql.md)).

## Scope

**In scope** — the four core areas (auth & authorization, product CRUD, dashboard, database design)
plus three additional features: **role-based UI**, **search & cursor pagination**, and **CI/CD**.
Each in-scope decision is an **Accepted** record in [docs/decisions/](docs/decisions/).

**Out of scope (for now)** — features we deliberately did not build in the first version: an
**AI-powered feature** (ADR [0007](docs/decisions/0007-ai-powered-feature.md)) and **observability**
(ADR [0008](docs/decisions/0008-observability.md)). These are recorded as **Proposed** decisions —
designed and ready to pick up, not yet implemented — and are the first items in "what's next."

## AI tool usage

StockPilot is an **AI-first project**, built with **Claude Code** (model: Claude Opus): AI drafted
the documentation, decisions, and implementation. Correctness is kept by **automated quality checks
and tests** (ESLint incl. complexity rules, TypeScript strict, Vitest, CI) plus **human review**.
The tools used (Claude Code, the skill-creator plugin, graphify) are described in
[docs/guides/tooling.md](docs/guides/tooling.md); a per-area breakdown lives in the plan document's
"AI tool usage" section.
