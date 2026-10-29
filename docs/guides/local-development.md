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

# 2. Copy the env template; the emulator defaults work as-is for local dev
cp .env.example .env.local

# 3. Start the Auth + Firestore emulators (Auth :9099, Firestore :8080, UI :4000).
#    Data is imported from / exported to ./.firebase-data, so it survives restarts.
npm run emulators

# 4. One time: create the demo accounts (see below). In a second terminal:
npm run seed:users

# 5. In a second terminal, start the app
npm run dev
# → http://localhost:3000
```

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

## Testing

- Unit: `npm run test` (Vitest).
- End-to-end: `npm run test:e2e` (Playwright). This builds the app, starts the emulators, seeds its
  own `admin`/`viewer`, and runs the browser flows. Needs Java on `PATH` and a Playwright browser
  (`npx playwright install chromium` once). It uses a production build so client hydration is
  deterministic under test.

## Environment variables

`.env.example` documents every variable. For emulator-only local dev you can leave the real Firebase
credentials blank — the client uses a placeholder API key and the Admin SDK auto-detects the emulator
via `FIREBASE_AUTH_EMULATOR_HOST`. Real values are only needed to deploy.

## Deploying with a real Firebase project

For a live demo, create a free Firebase project, enable Email/Password auth and Firestore, and fill
the `NEXT_PUBLIC_FIREBASE_*` and server `FIREBASE_*` values in `.env.local` from `.env.example`. See
[deployment.md](deployment.md).
