# Architecture

StockPilot is a single **Next.js 14 (App Router)** application written in **TypeScript (strict)**.
The same app serves the React UI and the Node API; there is no separate backend service. State that
must be trusted lives behind the API; the browser never talks to Firestore directly.

## Quality attributes

StockPilot optimizes for four things. This is our stance on each, with a pointer to the detail.

| Attribute | Our stance | Detail |
|---|---|---|
| **Architecture** | One Next.js app, clear layers (UI → REST API → data access layer → Firestore); decisions recorded as ADRs. | this doc · [decisions/](decisions/) |
| **Security** | Server-side auth on every call: Admin-SDK-verified httpOnly session cookie, custom-claim roles, OWASP basics. UI hiding is never the control. | [design/authorization.md](design/authorization.md) |
| **Scalability** | Stateless compute (scales horizontally), cursor pagination, targeted indexes, maintained aggregate counters for metrics, a clear multi-tenancy path. | [design/scalability.md](design/scalability.md) |
| **Code quality** | TypeScript strict, ESLint + Prettier, enforced by a pre-commit hook and CI; tests on security-critical paths. | [guides/code-quality.md](guides/code-quality.md) |

The hard, non-negotiable rules behind these live in [core-beliefs.md](core-beliefs.md).

## Stack

- **Framework**: Next.js 14, App Router (`app/` directory). UI pages and the API live in one app.
- **Language**: TypeScript, `strict: true`, no implicit `any`.
- **API**: Next.js **Route Handlers** (`app/api/**/route.ts`) — REST, not GraphQL (ADR [0003](decisions/0003-rest-over-graphql.md)).
- **Auth**: Firebase Authentication. The client signs in and obtains an ID token; the server verifies
  it with the **Firebase Admin SDK** and issues an httpOnly **session cookie** (ADR [0004](decisions/0004-auth-session-cookies-admin-sdk-and-custom-claims.md)).
- **Database**: Cloud Firestore. All access goes through a **data access layer** (`ProductRepository`),
  never from React components (ADR [0002](decisions/0002-tech-stack-nextjs-firebase-firestore.md)).
- **Validation**: Zod schemas at every API boundary — one schema is both the runtime check and the
  TypeScript type.
- **UI**: React + Tailwind CSS with **shadcn/ui** (owned Radix primitives), semantic design tokens
  for color + light/dark, lucide icons. Responsive, accessible markup. (ADRs [0010](decisions/0010-frontend-stack-and-component-model.md), [0011](decisions/0011-design-tokens-and-color-system.md).)
- **Frontend data & forms**: TanStack Query for server state; react-hook-form + the shared Zod schema
  for forms (ADR [0013](decisions/0013-data-fetching-and-forms.md)).
- **i18n**: next-intl; all user-facing strings come from `messages/<locale>.json` (ADR [0012](decisions/0012-internationalization.md)).
- **Local dev**: Firebase Local Emulator Suite (Auth + Firestore) — no cloud project needed to run.
- **CI/CD**: GitHub Actions — lint, type-check, test on every push (ADR [0005](decisions/0005-code-quality-enforcement.md)).

## How a request flows

```
Browser (React)
  │  1. firebase-auth signs in → ID token (in memory, never localStorage)
  │  2. POST /api/auth/session  { idToken }
  ▼
Route Handler  /api/auth/session
  │  verifies ID token via Firebase Admin SDK
  │  sets httpOnly, Secure, SameSite session cookie
  ▼
Browser makes data calls (cookie sent automatically)
  │  GET/POST/PATCH/DELETE /api/products
  ▼
Route Handler  /api/products
  │  a. requireUser()  — verify session cookie, load uid + role
  │  b. requireRole()  — reject if role may not do this action
  │  c. Zod-validate the request body
  ▼
ProductRepository  (the only code that touches Firestore)
  ▼
Firestore
```

Authorization is checked on the server for **every** mutating call. The UI also hides controls a
viewer may not use, but that is a convenience, never the enforcement — see
[design/authorization.md](design/authorization.md).

## Key directories (planned)

```
stockpilot/
  app/                        # Next.js App Router
    (auth)/
      sign-in/page.tsx        # frontend — UI pages
      sign-up/page.tsx
    (dashboard)/
      dashboard/page.tsx
      layout.tsx
    api/                      # backend — the HTTP layer (REST endpoints)
      auth/session/route.ts
      products/route.ts       #   GET list, POST create
      products/[id]/route.ts  #   GET, PATCH, DELETE one
    layout.tsx
  components/                 # frontend — React components (products/, dashboard/, ui/)
  hooks/                      # frontend — client data-fetching hooks
  lib/                        # backend core — plain TypeScript, no React
    firebase/                 #   client.ts (client SDK), admin.ts (Admin SDK, server only)
    auth/                     #   session.ts, require-user.ts, require-role.ts
    data/                     #   product-repository.ts — the ONLY code that touches Firestore
    validation/               #   Zod schemas (shared by API and client)
  styles/
  docs/                       # this documentation
```

> This is the intended layout; it is kept current as the code lands. The implementation sequence is
> in [plans/0001-foundation-and-docs-implementation-plan.md](plans/0001-foundation-and-docs-implementation-plan.md).

## Layering & separation of concerns

StockPilot is one deployable Next.js app, but it is **not** one undifferentiated blob. Concerns are
separated by *layer*, enforced by what each layer is allowed to import:

| Layer | Lives in | Responsibility | Must not |
|---|---|---|---|
| **Frontend (UI)** | `app/**/page.tsx`, `components/`, `hooks/` | Render UI; call the REST API over HTTP. | Import Firestore or the Admin SDK directly. |
| **Backend — HTTP** | `app/api/**/route.ts` | Thin controllers: authenticate, check role, Zod-validate, call a service. | Hold business/data logic inline. |
| **Backend — core** | `lib/` | Data access (`ProductRepository`), auth, validation — framework-agnostic pure TypeScript. | Import React or anything HTTP-specific. |

Two consequences of this split:

- **The browser never reaches the database.** The UI goes through the REST API, which goes through
  `lib/`, which is the single place that touches Firestore (core-belief #2). Authorization and
  validation therefore have exactly one choke point to get right.
- **A future backend split is cheap.** Because `lib/data` and `lib/auth` are pure and
  framework-agnostic, moving them into a standalone Node service later is mechanical — only the thin
  `app/api/` handlers are Next-specific. The single-app choice (and this extraction path) is recorded
  in ADR [0002](decisions/0002-tech-stack-nextjs-firebase-firestore.md).

On scale: the app is **stateless** (session is in a cookie, not server memory), so it scales
horizontally / serverless with no sticky sessions; Firestore scales on its own. The trade-off is that
UI and API share one deploy and scale together — the right call at this size, revisited via the
extraction path above if independent scaling is ever needed. See
[design/scalability.md](design/scalability.md).

## Trade-offs

The significant calls we made, each with a one-line summary and a pointer to the full reasoning.
These are the calls most worth understanding before changing the system.

| Trade-off | What we chose and why | Detail |
|---|---|---|
| **One app vs. split frontend/backend** | A single Next.js app (UI + API). Simpler to run and explain; the data access layer stays separable if a split is ever needed. | ADR [0002](decisions/0002-tech-stack-nextjs-firebase-firestore.md) |
| **REST vs. GraphQL** | REST via Route Handlers. GraphQL auto-gen targets SQL, not Firestore, and single-entity CRUD doesn't need it. | ADR [0003](decisions/0003-rest-over-graphql.md) |
| **Session cookies vs. client-held tokens** | Admin-SDK-verified httpOnly session cookie. Resists XSS token theft and keeps the OWASP story clean; costs an extra token-exchange step and an admin seed path. | ADR [0004](decisions/0004-auth-session-cookies-admin-sdk-and-custom-claims.md) · [design/authorization.md](design/authorization.md) |
| **Scale now vs. deferred** | Build read-cheap shapes now (cursor pagination, aggregate counters); defer sharded counters and full multi-tenancy until a trigger demands them. | ADR [0006](decisions/0006-scalability-posture.md) · [design/scalability.md](design/scalability.md) |
| **Thoughtful tests vs. 100% coverage** | Unit-test the security-critical paths + deny branches; Playwright e2e for the integrated flows (incl. viewer-403); no blanket coverage mandate. | ADR [0009](decisions/0009-testing-strategy.md) · [core-beliefs.md](core-beliefs.md) #9 |

## Docs organization

- `architecture.md` (this file) — living stack + structure, kept current.
- `core-beliefs.md` — hard constraints.
- `decisions/` — ADRs, append-only; supersede rather than rewrite.
- `design/` — detailed definitions (schema, authorization, UI) the architecture only summarizes.
- `features/` — current-behavior reference per feature.
- `guides/` — how-to / process docs; may go stale, check each guide's header.
- `plans/` — `NNNN-title-implementation-plan.md` for substantial work.
