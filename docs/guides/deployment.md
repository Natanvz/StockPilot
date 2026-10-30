# Deployment

> Status: reference. StockPilot is a standard Next.js app, so hosting is straightforward. CI does not
> auto-deploy (no cloud credentials are committed); deploy is a manual connect-and-go.

## CI

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs on every push / PR (skipping
docs-only changes):

- **verify** — `npm ci` → lint → type-check → unit tests → `next build`.
- **e2e** — provisions Java (for the Firestore emulator) + Chromium **and a Meilisearch service
  container** (so the search spec runs), then runs the Playwright suite against the emulator and
  uploads screenshots + the HTML report as artifacts.

## Deploying to Vercel (recommended for Next.js)

1. Create a Firebase project (free tier): enable **Email/Password** auth and **Firestore**.
2. Import the GitHub repo into Vercel.
3. Set environment variables in Vercel from [`.env.example`](../../.env.example): the
   `NEXT_PUBLIC_FIREBASE_*` client values and the server `FIREBASE_*` Admin SDK values (project id,
   client email, private key). Leave `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` unset (or `0`) in
   production.
4. Deploy. Vercel builds with `next build` and serves the app; the API routes run as serverless
   functions.
5. Deploy the Firestore rules separately: `npx firebase deploy --only firestore:rules`.

## Deploying to Firebase Hosting / Cloud Functions

Also supported via the Firebase web frameworks integration (`firebase experiments:enable webframeworks`
then `firebase deploy`). Vercel is the lower-friction path; pick one.

## Full-text search in production (optional)

Search ([ADR 0018](../decisions/0018-full-text-search-with-meilisearch.md)) is optional. To enable it
on a deployed instance: run a **Meilisearch** instance (Meilisearch Cloud or self-hosted), then set
`MEILI_HOST`, `MEILI_API_KEY`, and `NEXT_PUBLIC_SEARCH_ENABLED=1` in the host's env, and run
`npm run reindex:search` once (with the Admin SDK + `MEILI_HOST` env) to build the index. Leave
`MEILI_HOST` unset to deploy without search — the app runs fine and hides the search box.

## First admin in production

Promote a user the same way as locally, but against the real project (service-account credentials in
the environment): `node scripts/seed-admin.mjs <email>` with the Admin SDK env vars set and
`FIREBASE_AUTH_EMULATOR_HOST` unset.
