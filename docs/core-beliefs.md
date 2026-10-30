# Core Beliefs

Non-negotiable principles for anyone — human or AI — working in this repository. These are hard
constraints, not suggestions. They exist to prevent security holes, data problems, and architectural
drift.

---

## 1. Authorization is enforced on the server, always

Every mutating or data-returning API call re-checks who the caller is and whether their role may do
it, using the verified session cookie. Hiding a button in the UI is a convenience for the user, never
the access control. If the server check is missing, the feature is not done. See
[design/authorization.md](design/authorization.md).

## 2. The browser never talks to Firestore directly

All database access goes through the server-side data access layer (the repositories in `lib/data/`,
e.g. `productRepository`, `categoryRepository`). React components call our REST API; they never import
the Firestore SDK for reads or writes. This keeps one place to enforce authorization, validation, and
shaping.

## 3. Validate every input at the boundary

Every API Route Handler validates its request body/params with a Zod schema before any database
work. The schema is also the TypeScript type, so they cannot drift. Reject bad input early with a
clear error.

## 4. No secrets or sensitive data in the client, in URLs, or in logs

Firebase Admin credentials and any server secrets live only in server-side env vars, never in the
browser bundle (only `NEXT_PUBLIC_*` vars reach the client). No tokens or ids that grant access go in
URLs. Auth tokens live in memory or an httpOnly cookie — never `localStorage`. `.env.example`
documents the required vars (committed, empty); real values go in `.env.local` (gitignored).

## 5. TypeScript strict — no implicit `any`, no unused code

`strict: true` is on. Fix the types; do not reach for `any` or `// @ts-ignore` to silence the
compiler. Code must pass `npm run check` (type-check) with zero errors.

## 6. Every non-trivial decision gets an ADR

If a choice affects more than one part of the app, or a future reader would want to know _why_ and
not just _what_, write an ADR in [decisions/](decisions/) before or with the change. See
[decisions/index.md](decisions/index.md).

## 7. Code quality is enforced by tooling, not by memory

ESLint, Prettier, and the type-checker run on a pre-commit hook and in CI. Do not bypass the hook
(`--no-verify`) to land code that fails them. See [guides/code-quality.md](guides/code-quality.md).

## 8. Design within the stated scale targets, and write down the trade-off

StockPilot is expected to handle multi-tenancy and 10× product growth. We don't over-build for scale we
don't have, but every data-shape and query choice is made with those targets in mind, and the
reasoning (and what we deferred) is written down — see [design/scalability.md](design/scalability.md).
Concretely: cursor pagination over offsets, targeted composite indexes, and Firestore aggregation
queries (not full-collection scans) for metrics — with maintained counters documented as the scale
path. Scale-_awareness_ is the rule; premature scale machinery is not.

## 9. Test the parts that would actually break — happy path _and_ failure branches

This is about where test effort goes, not about skipping the happy path. For the important logic we
test **both** the happy path (admin creates a product → it's stored; valid sign-in → session set)
**and** the failure/deny branches that a naive suite skips (viewer write → 403; invalid body → 400).
What we don't do is chase 100% coverage of trivial code with no logic (a plain getter, a purely
presentational component).

Two layers (ADR [0009](decisions/0009-testing-strategy.md)): the data access layer and the auth/role
helpers are **unit-tested**, happy path plus deny branches (a viewer trying to write must be tested,
not assumed); the integrated flows are covered by **Playwright e2e** against the Firebase emulator,
with the viewer getting a server-side **403** as a required assertion. Coverage is thoughtful, not
100%-mandated — but the security-critical paths are never left untested.

## 10. No hard-coded user-facing strings — and no raw colors

Every visible string goes through the i18n translator (`t('key')`, keyed in `messages/<locale>.json`),
and every color comes from a semantic design token (`bg-primary`, never a raw hex). Both rules exist
so the same change isn't duplicated across files: one place defines the copy, one place defines the
palette. Non-user-facing text (logs, internal errors) is exempt from translation. See ADRs
[0011](decisions/0011-design-tokens-and-color-system.md) and [0012](decisions/0012-internationalization.md).
