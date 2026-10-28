# Running locally

> Status: placeholder — exact commands are confirmed when the stack is scaffolded (Phase 1). The
> shape below is the intended flow; the README's quick version points here.

Goal: a working local app in under 5 minutes, with **no cloud Firebase project required** — the app
runs against the Firebase Local Emulator Suite.

## Prerequisites

- Node.js (LTS) and npm.
- Firebase CLI (`npm i -g firebase-tools`) for the emulators.

## Steps

```bash
# 1. Install
npm install

# 2. Copy env template and leave the emulator defaults as-is for local dev
cp .env.example .env.local

# 3. Start Auth + Firestore emulators
npm run emulators

# 4. In a second terminal, start the app
npm run dev
# → http://localhost:3000
```

## Seeding the first admin

New users default to the `viewer` role. To get an `admin`, run the seed step (sets the Firebase
custom claim via the Admin SDK against the emulator):

```bash
npm run seed:admin -- you@example.com
```

*(Exact script name confirmed in Phase 2 — auth.)*

## Deploying with a real Firebase project

For a live demo, create a free Firebase project, enable Email/Password auth and Firestore, and fill
the `NEXT_PUBLIC_FIREBASE_*` and server `FIREBASE_*` values in `.env.local` from `.env.example`.
Deployment steps will live in `deployment.md`.
