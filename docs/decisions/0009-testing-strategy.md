# 0009 — Testing strategy: unit (Vitest) + e2e (Playwright) against the emulator

**Date**: 2026-10-28
**Status**: Accepted

## Context

The security guarantees (server-side role enforcement) are only trustworthy if something actually
asserts them, so the project needs real tests and CI. We needed a testing strategy that gives
confidence for this first version without chasing exhaustive coverage.

## Decision

Two layers, each owning what it is best at:

- **Unit tests — Vitest.** Cover the pure, security-critical logic: the `ProductRepository` (mocked
  Firestore) and the `requireUser` / `requireRole` helpers, **including the deny branches** (a viewer
  attempting a write must be asserted, not assumed). Fast; run on the pre-commit hook (related files)
  and in full in CI.
- **End-to-end tests — Playwright, against the Firebase Local Emulator Suite.** The emulator (Auth +
  Firestore) gives a real, running stack that is deterministic and free, with no cloud project and no
  real data. A seed script creates two users — one `admin`, one `viewer` (role set as a custom claim
  via the Admin SDK) — and state is reset between runs.

**e2e flows (small, high-value — not exhaustive):**

1. Sign up → new user defaults to `viewer`.
2. Sign in → httpOnly session cookie set → dashboard loads; sign-out clears it.
3. Admin creates / edits / deletes a product; summary metrics update.
4. **Viewer is read-only** — no edit/delete controls in the UI **and** a direct `POST /api/products`
   returns **403**. This is a required assertion: it proves authorization is enforced on the server,
   not just hidden in the UI (core-belief #1).
5. Filter / sort / search / cursor pagination behave.
6. Signed-out access to `/dashboard` redirects to sign-in.

- **Screenshot proofs.** Playwright captures a screenshot at the key flows (`e2e/screenshots/`);
  CI uploads them (plus the HTML report) as build artifacts, so the UI can be seen without running
  it. They're generated, so they're gitignored rather than committed.
- **CI.** The GitHub Actions workflow (ADR [0005](0005-code-quality-enforcement.md)) boots the
  emulator, builds the app, and runs Playwright headless. The suite is kept to the flows above so CI
  stays under a couple of minutes.
- **Coverage.** Thoughtful, not a 100% gate (core-belief #9): the security-critical paths and the
  integrated happy paths are covered; exhaustive coverage is out of scope.

## Consequences

- The central security guarantee (viewer blocked server-side) is proven by an automated test, not
  just asserted in prose — the strongest evidence that authorization actually works.
- e2e stays free and deterministic (emulator), and fast (small suite), so it can run on every CI push.
- Screenshots give visual proof and double as living UI documentation.
- A dedicated e2e phase is added to plan 0001 (Phase 6), after the dashboard and the additional
  features exist.
- **e2e runs against a production build** (`next build` + `next start`), not `next dev`: under
  headless Chromium the dev server's HMR websocket fails to connect, which stalls client hydration
  and makes the UI non-interactive. A production build has no HMR, hydrates deterministically, and is
  closer to what ships. Both roles are covered — admin (sees controls, full CRUD) and viewer
  (read-only + the 403). The whole suite passes locally (4/4) and in CI.
