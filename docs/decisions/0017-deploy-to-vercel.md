# 0017 — Deploy to Vercel; deploy Firestore rules/indexes via CI

**Date**: 2026-10-29
**Status**: Rejected (2026-10-29) — deployment is out of scope for this project

> **Why rejected.** CD (continuous deployment) was always a deliberate add-on, not a brief
> requirement — CI already covers the bonus. The owner chose not to pursue a live deploy, so we are
> not standing up a Vercel project, a real Firebase project, or deploy secrets. The design below is
> kept for the record; if deployment is revisited, start from here (likely as a new ADR).

## Context

The app has CI (lint, types, unit, build, e2e) but no automated deploy (CD). We want a live URL and
per-PR previews. The app is a standard Next.js app on Firebase; the brief's CI/CD bonus is already
met by CI, so CD is a deliberate add-on, not a requirement.

## Decision (proposed)

- **Host on Vercel** using its native GitHub integration (not a hand-rolled Actions deploy job):
  - a **preview deployment per PR** (its own URL — great for review), and
  - a **production deployment on merge to `main`**.
- Set the real Firebase config in **Vercel env vars**: `NEXT_PUBLIC_FIREBASE_*` (client) and
  `FIREBASE_*` (Admin SDK service account). `.env.development` keeps local dev on the emulator;
  production never loads it, so it reads Vercel env (ADR 0014 / the env-split).
- **Firestore rules + composite indexes** aren't deployed by Vercel, so add a small **GitHub Actions**
  step on `main`: `firebase deploy --only firestore:rules,firestore:indexes` using a
  `FIREBASE_SERVICE_ACCOUNT` repo secret. This keeps the deny-all rules (core-belief #2) and the
  pager's composite indexes (ADR 0015) in sync with the app.
- Firebase Hosting (web frameworks) is a documented alternative; Vercel is the lower-friction default.

## Consequences

- Push-to-`main` ships the app; PRs get preview URLs; rules/indexes deploy alongside.
- Requires a GitHub repo, a Vercel project, a real Firebase project, and the secrets — supplied by the
  owner; until then this stays Proposed and deployment is manual per `guides/deployment.md`.
- No credentials are committed; all real config lives in Vercel env / GitHub secrets.
