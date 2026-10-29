# StockPilot

A mini SaaS dashboard for managing a product catalog. Authenticated users sign in, manage products
(create / read / update / delete), and view live summary metrics, with role-based access (admin vs
viewer) enforced on the server. Built as a single **Next.js (App Router)** app — React UI and Node
API in one codebase — on **Firebase Authentication** and **Cloud Firestore**.

The first version is intentionally focused — it does a few things well rather than many partially.
See
[docs/plans/0001-foundation-and-docs-implementation-plan.md](docs/plans/0001-foundation-and-docs-implementation-plan.md)
for the build plan and [docs/decisions/](docs/decisions/) for why each call was made.

## Features

- Email/password **authentication** (Firebase) with secure httpOnly session cookies and two roles.
- **Product CRUD** with Zod-validated input and role-gated writes (admins write, viewers read).
- A **dashboard**: product table with search, status filter, and sort; cursor-based "Load more"
  pagination; summary metrics (total, active, active catalog value).
- **Role-based UI** enforced on the server, never just hidden in the client.
- Light/dark theming and i18n-ready copy throughout.

## Run it locally (under 5 minutes)

> Full, exact steps live in [docs/guides/local-development.md](docs/guides/local-development.md).
> This is the short version.

```bash
npm install

# Start the Firebase emulators (Auth + Firestore). Needs Java on your PATH.
# Data persists in ./.firebase-data, so it survives restarts.
npm run emulators

# In a second terminal: create demo accounts (one admin, one viewer) — run once.
npm run seed:users

# In a second terminal: start the app (auto-targets the emulator, no config needed)
npm run dev        # → http://localhost:3000
```

**Sign in** at `/sign-in` with a demo account created by `seed:users`:

| Role               | Email                     | Password      |
| ------------------ | ------------------------- | ------------- |
| admin (full CRUD)  | `admin@stockpilot.local`  | `password123` |
| viewer (read-only) | `viewer@stockpilot.local` | `password123` |

Or register your own at `/sign-up` (new users are `viewer`); promote anyone with
`npm run seed:admin -- their@email`. To **start clean with no data**, run
`npm run emulators:reset` (wipes the saved data), then `seed:users` again. You do **not** need a real
Firebase project to run locally. To
deploy, create a free one and fill `.env.local` from `.env.example` — see the
[deployment guide](docs/guides/deployment.md).

## What's inside

| Area                | Summary                                                                                                                                                        | Detail                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**    | One Next.js app: App Router pages + Route Handlers (the Node API), a Firestore data access layer, Firebase Auth.                                               | [docs/architecture.md](docs/architecture.md)                                                                                                       |
| **Database schema** | `products` and `users` collections in Firestore; indexing and scale notes (multi-tenancy, 10× growth).                                                         | [docs/design/database-schema.md](docs/design/database-schema.md)                                                                                   |
| **Security & auth** | Firebase ID token verified server-side via the Admin SDK, stored in an httpOnly session cookie; roles via custom claims; every write re-checked on the server. | [docs/design/authorization.md](docs/design/authorization.md) · ADR [0004](docs/decisions/0004-auth-session-cookies-admin-sdk-and-custom-claims.md) |
| **Code quality**    | ESLint + Prettier + TypeScript strict, enforced by a pre-commit hook and GitHub Actions CI.                                                                    | [docs/guides/code-quality.md](docs/guides/code-quality.md) · ADR [0005](docs/decisions/0005-code-quality-enforcement.md)                           |
| **Core beliefs**    | The non-negotiable rules this codebase holds to.                                                                                                               | [docs/core-beliefs.md](docs/core-beliefs.md)                                                                                                       |

## Testing

- **Unit** (Vitest) — the data access layer and the auth/role guards, including the deny branches
  (a viewer's write is tested, not assumed): `npm run test`.
- **End-to-end** (Playwright, against the Firebase emulator) — sign-in + redirect, role-gated UI, the
  **viewer-gets-403** server check, and the admin create/edit/delete loop: `npm run test:e2e`
  (needs Java + `npx playwright install`).
- **CI** (GitHub Actions) runs lint, type-check, unit tests, build, and the e2e suite on every push.

See ADR [0009](docs/decisions/0009-testing-strategy.md) for the testing strategy.

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

## What's next

With another week, in rough priority order:

1. **AI-powered feature** (ADR [0007](docs/decisions/0007-ai-powered-feature.md)) — e.g. generated
   product descriptions, with the safe-productionization story already written.
2. **Observability** (ADR [0008](docs/decisions/0008-observability.md)) — structured logging +
   error tracking.
3. **Server-side search** via a search index, replacing client-side search over loaded pages.
4. **Maintained aggregate counters** for metrics at write-scale (ADR [0006](docs/decisions/0006-scalability-posture.md)).
5. A real **multi-tenancy** pass (subcollection-per-tenant).

## AI tool usage

StockPilot is an **AI-first project**, built with **Claude Code** (model: Claude Opus): AI drafted
the documentation, decisions, and implementation. Correctness is kept by **automated quality checks
and tests** (ESLint incl. complexity rules, TypeScript strict, Vitest, CI) plus **human review**.
The tools used (Claude Code, the skill-creator plugin, graphify) are described in
[docs/guides/tooling.md](docs/guides/tooling.md); a per-area breakdown lives in the plan document's
"AI tool usage" section.
