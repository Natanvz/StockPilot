# Implementation plan — Foundation, documentation, and the full build sequence

**Status**: Active
**Date**: 2026-10-28
**Related ADRs**: [0001](../decisions/0001-adopt-docs-and-adr-structure.md),
[0002](../decisions/0002-tech-stack-nextjs-firebase-firestore.md),
[0003](../decisions/0003-rest-over-graphql.md),
[0004](../decisions/0004-auth-session-cookies-admin-sdk-and-custom-claims.md),
[0005](../decisions/0005-code-quality-enforcement.md),
[0006](../decisions/0006-scalability-posture.md),
[0007](../decisions/0007-ai-powered-feature.md),
[0008](../decisions/0008-observability.md),
[0009](../decisions/0009-testing-strategy.md)

This is the first plan. It captures the kickoff decisions for StockPilot — the product goals, the
decisions made, and the ordered build sequence. Later plans cover individual features if they need
their own sequencing.

## Product goals

StockPilot is a mini SaaS product-management dashboard. The first version is intentionally small in
scope and prioritizes clear architecture, security, scalability, and code quality over feature
breadth. The README is the entry point to the repository.

**Core features:**

1. **Auth & authorization** — Firebase Auth sign-up/sign-in; protect routes *and* API; two roles
   (admin, viewer); OWASP basics (no secrets in URLs, proper sessions, secure tokens).
2. **Product CRUD** — UI + backend to create/read/update/delete products. Each product: `name`,
   `category`, `price`, `status` (active/inactive), timestamp. Store in Firestore. Clean data access
   layer in Node.
3. **Dashboard** — responsive product list with filtering/sorting + summary metrics (total products,
   active count, revenue total). Usable, not flashy.
4. **Database design** — a documented Firestore model; indexing strategy and how it scales to
   multi-tenancy or 10× products.

**Additional features (built):** **role-based UI**, **search & cursor pagination**, and **CI/CD** —
each tightly coupled to the core work. An AI product feature and observability are designed but not
built in the first version (ADRs [0007](../decisions/0007-ai-powered-feature.md),
[0008](../decisions/0008-observability.md), both Proposed).

**The README covers:** setup (<5 min), architecture overview, DB schema, security decisions,
trade-offs & scope, what's next, and the tooling used.

## Decisions carried in (see ADRs)

- **Docs-first.** The documentation skeleton and seed ADRs land before any stack code (Phase 0).
  (ADR 0001.)
- **Stack.** One Next.js 14 App Router app (UI + API), TypeScript strict, Firebase Auth, Firestore,
  Firebase emulator for local dev, data access layer isolating Firestore. (ADR 0002.)
- **REST, not GraphQL.** Route Handlers. GraphQL auto-gen tools target SQL, not Firestore, and
  single-entity CRUD doesn't need GraphQL. (ADR 0003.)
- **Auth.** Admin-SDK-verified httpOnly session cookie; roles via custom claims; server-side
  enforcement on every call; UI hiding is convenience only. (ADR 0004.)
- **Code quality.** Prettier + ESLint + TS strict, enforced by a pre-commit hook and GitHub Actions
  CI (automated lint + test on every push). (ADR 0005.)
- **Project name.** StockPilot. **Firebase.** No cloud project yet; develop on the emulator, add a
  real project only to deploy.

## Open questions

- **Product name** — "StockPilot" is the working name; trivial to change before the repo goes
  public. (Alternatives floated: Cataliq, Shelfdash, Productly.)
- **Deploy target** — Vercel vs Firebase Hosting; decide at Phase 7. Vercel is the lower-friction
  default for Next.js.
- **Category model** — free-text string now; promote to a `categories` collection only if a later
  feature needs it.

## Build sequence

Each Part is a reviewable unit (roughly one PR). "Ships when" lists what must be true to call it
done.

### Phase 0 — Documentation (this plan) ✅

- `docs/` skeleton with per-folder `index.md`; `architecture.md`; `core-beliefs.md`; ADRs 0001–0013
  (incl. scalability, testing strategy, and the frontend-design set); design docs (database-schema,
  authorization, scalability, ui-components); guides (code-quality, local-development, tooling);
  `CLAUDE.md`, `.claude/`, `.gitignore`; the graphify graph; README.
- **Ships when**: the structure exists, every decision so far has an ADR, and the README links it
  together. *(Done in this session.)*

### Phase 1 — Scaffold + toolchain

- `create-next-app` (TS, App Router, ESLint), the directory layout from `architecture.md`, Prettier
  (+ ESLint complexity rules, ADR 0005), Husky + lint-staged, `.env.example`, Firebase emulator
  config (`firebase.json`, `firestore.rules`, `firestore.indexes.json`).
- **Frontend foundation** (ADRs 0010–0013): Tailwind + shadcn/ui init with the semantic design
  tokens and light/dark (`next-themes`); next-intl wired with `messages/en.json`; the TanStack Query
  provider; `cn()` helper, lucide, and a first primitive or two (Button, Input).
- **Ships when**: `npm run dev` serves a themed page against the emulator; a string renders via
  `t()`; `npm run lint` + `npm run check` pass; the pre-commit hook runs.

### Phase 2 — Auth

- Firebase client + Admin SDK init; sign-up / sign-in / sign-out UI; `POST /api/auth/session` (set)
  and logout (clear); `requireUser` / `requireRole` helpers; Next.js middleware guarding pages;
  `seed:admin` step.
- **Ships when**: a user can sign up (defaults to viewer), sign in, and get an httpOnly session
  cookie; protected pages redirect when signed out; `requireRole` returns 403 for a viewer. Unit
  tests cover the helpers' allow **and** deny branches.

### Phase 3 — Data layer + Product CRUD API

- `ProductRepository` over Firestore; Zod schemas in `lib/validation/`; Route Handlers for
  list/create/get/update/delete with role checks and validation; `firestore.rules` as the backstop.
- **Ships when**: all five endpoints work against the emulator; an admin can write, a viewer gets
  403 on writes; invalid bodies get 400; repository unit tests pass (mocked Firestore), deny paths
  included.

### Phase 4 — Dashboard UI

- Product table; create/edit forms; delete with confirm; filter + sort controls; the summary metric
  cards (total, active, revenue). Responsive + accessible. Fill `design/ui-components.md`.
- **Ships when**: the dashboard lists products, filters/sorts, shows correct metrics, and the full
  CRUD loop works from the UI on mobile and desktop widths.

### Phase 5 — Additional features

- **Role-based UI**: admin sees edit/delete controls, viewer is read-only (server already enforces).
- **Search & pagination**: search box + Firestore cursor pagination (`startAfter` + `limit`).
- **Ships when**: a viewer sees no write controls and is blocked server-side; search filters the
  list; paging works forward/back via cursors, not offsets.

### Phase 6 — End-to-end tests (ADR 0009)

- Playwright against the Firebase emulator; a seed script for an `admin` and a `viewer` (custom
  claims via Admin SDK); the ~6 flows in ADR 0009, including the required **viewer-403** server-side
  assertion; per-flow **screenshot proofs** committed under `e2e/screenshots/`.
- **Ships when**: all e2e flows pass against the emulator; the viewer-403 test fails if server-side
  enforcement is removed; screenshots are generated for each flow.

### Phase 7 — CI/CD + deploy

- GitHub Actions: install → lint → type-check → unit tests → boot emulator → build → Playwright
  (headless). Optional deploy to Vercel/Firebase Hosting with a real Firebase project; write
  `guides/deployment.md`.
- **Ships when**: CI is green on a push (lint, types, unit, e2e); (if deployed) a live URL works
  end-to-end.

### Phase 8 — README & docs polish

- Finalize every required README section, link-check the docs, and attach the e2e screenshots.
- **Ships when**: the README satisfies every "must include" item; a fresh clone runs locally in
  under 5 minutes following only the README.

## Trade-offs & scope (living — finalized at Phase 8)

- **One Next.js app over a split frontend/backend** — simpler to run and explain; the data layer
  stays cleanly separable if a split is ever needed.
- **REST over GraphQL** — see ADR 0003.
- **No AI feature** — focused on role-based UI + search/pagination + CI, which tie directly into the
  core work.
- **Coverage is thoughtful, not 100%** — security-critical paths are tested; exhaustive coverage is
  out of scope for this first version.
- *(Add cuts here as they're made.)*

## What's next

*(Finalized at Phase 8. Candidates: an AI feature — e.g. AI-generated product descriptions with a
safe productionization write-up; observability — structured logging + error tracking; maintained
aggregate counters for metrics at scale; a real multi-tenancy pass.)*

## AI tool usage (living — finalized at Phase 8)

StockPilot is an **AI-first project**, built with **Claude Code** (Claude Opus): AI drafted the docs
structure, the ADRs, and this plan from the product goals and a short discussion. Correctness is kept by
automated quality checks and tests (ESLint incl. complexity rules, TypeScript strict, Vitest, CI)
plus human review. The tooling is described in [../guides/tooling.md](../guides/tooling.md); a
per-area breakdown is added as phases complete.
