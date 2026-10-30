# Running locally

Goal: a working local app in a few minutes, with **no cloud Firebase project required** — the app
runs against the Firebase Local Emulator Suite, and the emulator **persists data between runs**.

## Prerequisites

- Node.js 22+ and npm.
- **Java (JDK 11+) on your `PATH`** — the Firestore emulator needs it. (`JAVA_HOME` alone is not
  always enough; the Firebase CLI calls `java` directly, so make sure `java -version` works in your
  shell.) The Auth emulator does not need Java.
- The Firebase CLI is a dev dependency (`firebase-tools`), so `npm install` provides it — no global
  install needed.

## Steps

```bash
# 1. Install
npm install

# 2. Start the Auth + Firestore emulators (Auth :9099, Firestore :8080, UI :4000).
#    Data is imported from / exported to ./.firebase-data, so it survives restarts.
npm run emulators

# 3. One time: create the demo accounts (see below). In a second terminal:
npm run seed:users

# 4. In a second terminal, start the app
npm run dev
# → http://localhost:3000
```

No env setup needed for local dev: a committed `.env.development` points the app at the emulator
automatically (see "Environment variables" below).

## Which account do I sign in with?

`npm run seed:users` creates two ready-to-use accounts in the emulator — one per role:

| Role                               | Email                     | Password      |
| ---------------------------------- | ------------------------- | ------------- |
| **admin** (create / edit / delete) | `admin@stockpilot.local`  | `password123` |
| **viewer** (read-only)             | `viewer@stockpilot.local` | `password123` |

Sign in at **/sign-in** with either. Because the emulator persists data (step 3), you only need to
run `seed:users` once — the accounts (and any products you create) are still there after you stop and
restart the emulators.

You can also register your own account at **/sign-up** (new users get the `viewer` role). To promote
any existing user to admin: `npm run seed:admin -- their@email` (emulators must be running), then
have them sign out and back in.

## Start clean (no data)

The emulators persist to `./.firebase-data`, so by default your users and products survive restarts.
To start from a clean slate, run **`npm run emulators:reset`** — it deletes `./.firebase-data` and
starts the normal (persisting) emulators, so you begin empty and new data is saved from there. Re-run
`npm run seed:users` afterward if you want the demo accounts back. (You can also just delete the
`./.firebase-data` folder by hand — it's gitignored.)

## Full-text search (optional)

Search is backed by **Meilisearch** ([ADR 0018](../decisions/0018-full-text-search-with-meilisearch.md))
and is **off by default** — the app runs fully without it; the search box is simply hidden. **Docker is
not required**: Meilisearch is a single self-contained binary. Turn search on in three steps.

**1. Start Meilisearch** — pick whichever you have. It listens on `http://127.0.0.1:7700` and runs
keyless in development mode.

```bash
# Package manager (no Docker):
brew install meilisearch && meilisearch                 # macOS
winget install Meilisearch.Meilisearch && meilisearch   # Windows (or: scoop install meilisearch)
curl -L https://install.meilisearch.com | sh && ./meilisearch   # Linux / macOS script

# Or the binary: download meilisearch-<os> from github.com/meilisearch/meilisearch/releases, then run it.

# Or, if you prefer Docker (convenience):
npm run search
```

**2. Enable it for the app** — add these to `.env.local`:

```bash
MEILI_HOST=http://127.0.0.1:7700
NEXT_PUBLIC_SEARCH_ENABLED=1
```

**3. Build the index** from the emulator's products:

```bash
npm run reindex:search
```

Firestore stays the source of truth; the index is derived and kept in sync on each product write
(best-effort). Re-run `npm run reindex:search` any time to rebuild it.

## Testing

- Unit: `npm run test` (Vitest).
- End-to-end: `npm run test:e2e` (Playwright). This builds the app, starts the emulators, seeds its
  own `admin`/`viewer`, and runs the browser flows. Needs Java on `PATH` and a Playwright browser
  (`npx playwright install chromium` once). It uses a production build so client hydration is
  deterministic under test.

## Environment variables

Local dev needs **no env setup**. A committed **`.env.development`** holds the emulator defaults
(`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1`, the emulator hosts, a throwaway project id) — no secrets, just
the emulator's standard localhost addresses. Next.js loads it only for `next dev`, never for
production builds, so real deploys are unaffected.

- To run dev against a **real Firebase project** instead, copy **`.env.example`** → `.env.local` and
  fill in the real values; `.env.local` overrides `.env.development`.
- `.env.example` is the template for **deploying** (real client config + Admin SDK service-account
  credentials). See [deployment.md](deployment.md).

## Deploying with a real Firebase project

For a live demo, create a free Firebase project, enable Email/Password auth and Firestore, and fill
the `NEXT_PUBLIC_FIREBASE_*` and server `FIREBASE_*` values in `.env.local` from `.env.example`. See
[deployment.md](deployment.md).
