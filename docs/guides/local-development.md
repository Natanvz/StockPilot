# Running locally

Goal: a working local app in a few minutes, with **no cloud Firebase project required** — the app
runs against the Firebase Local Emulator Suite.

## Prerequisites

- Node.js 22+ and npm.
- **Java (JDK 11+)** — the Firestore emulator needs it. (The Auth emulator does not.)
- The Firebase CLI is a dev dependency (`firebase-tools`), so `npm install` provides it — no global
  install needed.

## Steps

```bash
# 1. Install
npm install

# 2. Copy the env template; the emulator defaults work as-is for local dev
cp .env.example .env.local

# 3. Start the Auth + Firestore emulators (Auth :9099, Firestore :8080, UI :4000)
npm run emulators

# 4. In a second terminal, start the app
npm run dev
# → http://localhost:3000
```

Then open the app, go to **/sign-up**, and create an account. New users get the `viewer` role by
default.

## Seeding the first admin

New users default to `viewer`. To promote one to `admin`, sign up through the UI first, then run (the
emulators must be running):

```bash
npm run seed:admin -- you@example.com
```

This sets the `role: admin` custom claim via the Admin SDK against the emulator. **Sign out and back
in** for the new role to take effect (the claim is read when the session cookie is minted).

## Environment variables

`.env.example` documents every variable. For emulator-only local dev you can leave the real Firebase
credentials blank — the client uses a placeholder API key and the Admin SDK auto-detects the emulator
via `FIREBASE_AUTH_EMULATOR_HOST`. Real values are only needed to deploy.

## Deploying with a real Firebase project

For a live demo, create a free Firebase project, enable Email/Password auth and Firestore, and fill
the `NEXT_PUBLIC_FIREBASE_*` and server `FIREBASE_*` values in `.env.local` from `.env.example`.
Deployment steps will live in `deployment.md` (Phase 7).
