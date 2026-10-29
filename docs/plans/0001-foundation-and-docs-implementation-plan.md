# Implementation plan — Foundation, documentation, and the full build sequence

**Status**: Completed (Phases 0–8)
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

1. **Auth & authorization** — Firebase Auth sign-up/sign-in; protect routes _and_ API; two roles
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
- **Stack.** One Next.js 16 App Router app (React 19, UI + API), TypeScript strict, Firebase Auth, Firestore,
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
  together. _(Done in this session.)_

### Phase 1 — Scaffold + toolchain ✅

- `create-next-app` (Next.js 16, React 19, TS strict, App Router, Tailwind v4), the directory layout
  from `architecture.md`, Prettier (+ ESLint complexity rules + sonarjs, ADR 0005), Husky +
  lint-staged, `.env.example`, Firebase emulator config (`firebase.json`, `firestore.rules`,
  `firestore.indexes.json`).
- **Frontend foundation** (ADRs 0010–0013): Tailwind v4 semantic design tokens + light/dark
  (`next-themes`); `cn()` helper + a `Button` primitive (CVA) as the shadcn-style model; next-intl
  wired with `messages/en.json`; the TanStack Query provider; a themed landing page rendering via
  `t()` with a light/dark toggle.
- **Shipped** (commits `329cf81`, `49bc8ed`, `99a8c91`): `npm run lint`, `npm run check`, and
  `npm run build` all pass; the pre-commit hook (lint-staged) runs; the themed page renders strings
  via `t()`. Note: the app connects to the Firebase emulator in Phase 2 (auth); the config is in
  place now. The graphify graph refresh to include code is deferred until Phase 3 (feature code
  makes the code graph worthwhile).

### Phase 2 — Auth ✅

- Firebase client + Admin SDK init (both lazy); sign-up / sign-in / sign-out UI; `POST /api/auth/session`
  (set) and `DELETE` (clear); `requireUser` / `requireRole` helpers; Next.js middleware guarding
  `/dashboard`; `seed:admin` script.
- **Shipped** (commits `05359f2`, `c41ccd9`, `120399b`, + this part): a user can sign up (defaults to
  viewer), sign in, and receive an httpOnly/Secure/SameSite session cookie; `/dashboard` redirects to
  sign-in when the cookie is absent (middleware) or invalid (server `getSessionUser`); `requireRole`
  returns 403 for a viewer. 9 unit tests cover the guards' allow **and** deny branches (ADR 0009).
  Also decided ADR 0014 (disable `cacheComponents`). Live emulator sign-in is exercised in the Phase
  6 e2e suite (needs Java + the running emulator, not run in CI-less local checks here).

### Phase 3 — Data layer + Product CRUD API ✅

- `productRepository` over Firestore; Zod schemas in `lib/validation/product.ts`; Route Handlers for
  list/create/get/update/delete with role checks and validation; `firestore.rules` as the backstop.
- **Shipped** (commits `946293d`, + this part): the five endpoints are implemented — `GET`/`POST`
  `/api/products`, `GET`/`PATCH`/`DELETE` `/api/products/[id]`; reads require any user, writes
  `requireRole('admin')` (viewer → 403), invalid bodies → 400 (Zod), missing → 404. 10 repository
  unit tests (mocked Firestore) cover the mapping and the not-found/no-write branches; 19 tests
  total. lint, tsc, and next build pass. Live emulator CRUD is exercised in the Phase 6 e2e suite.
  The graphify code-graph refresh stays deferred (Windows multiprocessing + junk-file scoping
  friction); the committed docs-graph remains, and the post-commit hook can refresh code
  incrementally — not blocking.

### Phase 4 — Dashboard UI ✅

- Product table; create/edit form dialog; delete with confirm; filter + sort controls; summary metric
  cards (total, active, active catalog value). Responsive + accessible. TanStack Query for
  fetch/mutations.
- **Shipped**: the dashboard lists products via `useProducts`, filters by status + sorts
  (name/price/newest, client-side), shows the three metrics, and runs the full CRUD loop from the UI
  (create/edit via a Radix dialog form, delete with a confirm dialog), with new primitives (Card,
  Badge, Dialog, Input, Label). **Role-based UI landed here too** (Phase 5's first item): admin sees
  New/Edit/Delete, viewer is read-only — and the server already enforces it (403). lint, tsc, 19
  tests, and next build pass.

### Phase 5 — Additional features ✅

- ✅ **Role-based UI** — delivered in Phase 4 (admin controls vs read-only viewer; server-enforced).
- ✅ **Search & pagination** — `list` is now Firestore **cursor pagination** (`startAfter` on
  (createdAt, documentId), `nextCursor` null on last page); the client uses a TanStack **infinite
  query** with a "Load more" button; a **search box** filters by name/category (client-side over
  loaded pages — the production search-index path is noted in `design/scalability.md`). A separate
  `/api/products/stats` aggregation endpoint keeps the metric cards accurate under pagination.
- **Shipped**: 22 unit tests (list cursor logic + `getStats` added); lint, tsc, next build pass.

### Phase 6 — End-to-end tests (ADR 0009) ✅

- Playwright config (`playwright.config.ts`) whose webServer **builds the app**, runs the Firebase
  emulators (`firebase emulators:exec`), seeds an `admin` + `viewer` (`scripts/seed-e2e.mjs`), then
  serves a production build. Specs (`e2e/`): signed-out → sign-in redirect; admin sees management
  controls; **viewer is read-only and a direct `POST /api/products` returns 403** (the key security
  assertion); admin create → edit → delete. Screenshots captured at key flows.
- **Shipped**: all **4 specs pass** (both roles) locally against the emulator (Java 21 + Chromium)
  and in CI. A production build is used because `next dev`'s HMR websocket stalls hydration under
  headless Chromium (ADR 0009). Along the way this surfaced two real fixes: the session cookie drops
  its `Secure` flag when on the emulator (http), and the sign-in form is `method="post"` so a no-JS
  submit can't leak credentials into the URL (ADR 0004).

### Phase 7 — CI/CD + deploy ✅

- **GitHub Actions** (`.github/workflows/ci.yml`): a `verify` job (`npm ci` → lint → type-check →
  unit tests → build) and an `e2e` job (Java + Chromium → Playwright against the emulator, uploads
  screenshots + report as artifacts). `paths-ignore` skips docs-only pushes (saves Actions minutes).
- **Deploy**: `docs/guides/deployment.md` documents Vercel (recommended) and Firebase Hosting,
  including env vars and rules deploy. CI does not auto-deploy (no committed credentials).
- **Ships when**: CI is green on a push. (Not triggered yet — fires on first push to GitHub.)

### Phase 8 — README & docs polish ✅

- Finalized the README: a Features list, setup (with the Java note + sign-up/seed-admin flow), a
  Testing section, explicit Trade-offs / Scope / What's next / AI-tool-usage sections, and the
  "What's inside" map into `docs/`. Link-checked the docs; the deployment guide is in.
- **Shipped**: the README covers every item the brief requires and a fresh clone runs locally
  following only the README. All phases (0–8) complete.

## Trade-offs & scope

- **One Next.js app over a split frontend/backend** (ADR 0002) — simpler to run and explain; the
  `lib/` data/auth layer stays cleanly extractable if a split is ever needed.
- **REST over GraphQL** (ADR 0003) — GraphQL auto-gen targets SQL, not Firestore, and single-entity
  CRUD doesn't need it.
- **`cacheComponents` off** (ADR 0014) — the app is per-user/auth-gated, so there's little to
  statically cache.
- **No AI feature / observability in v1** (ADRs 0007, 0008, Proposed) — the effort went to the
  required areas plus role-based UI, search/pagination, and CI.
- **Client-side search over loaded pages** — Firestore has no native substring search; the
  search-index path is documented (`design/scalability.md`).
- **Thoughtful tests, not 100% coverage** — security-critical paths (data layer, guards, viewer-403)
  are covered by unit + e2e; exhaustive coverage is out of scope.

## What's next

With another week, in rough priority order: (1) the **AI-powered feature** (ADR 0007); (2)
**observability** (ADR 0008); (3) **server-side search** via a search index; (4) **maintained
aggregate counters** for metrics at write-scale (ADR 0006); (5) a real **multi-tenancy** pass
(subcollection-per-tenant).

## AI tool usage

StockPilot is an **AI-first project**, built with **Claude Code** (Claude Opus): AI drafted the docs,
the ADRs, the plan, and the implementation. Correctness is kept by automated quality checks and tests
(ESLint incl. complexity rules, TypeScript strict, Vitest, Playwright, CI) plus human review. The
tooling is described in [../guides/tooling.md](../guides/tooling.md). Per phase: AI wrote the
docs/ADRs (Phase 0), scaffolded and configured the toolchain (Phase 1), and implemented auth, the
data layer + API, the dashboard, pagination/search, and the e2e + CI setup (Phases 2–7), each in
small reviewed commits that pass the automated gate.
