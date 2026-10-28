# 0002 — Tech stack: Next.js (App Router) + Firebase + Firestore

**Date**: 2026-10-28
**Status**: Accepted

## Context

The target stack is Next.js / React, a Node.js API, and Firebase + Firestore, with auth and security
as first-class concerns. The Node API can be either Next.js API routes or a separate service, so we
chose between (a) one Next.js app holding both UI and API, and (b) a separate Node backend.

## Decision

- **One Next.js 16 app (React 19), App Router**, in TypeScript strict mode. It serves both the React UI
  (`app/` pages) and the Node REST API (`app/api/**/route.ts` Route Handlers). No separate backend
  service.
- **Firebase Authentication** for sign-up / sign-in.
- **Cloud Firestore** for product and user data.
- **A data access layer** (`ProductRepository`) is the only code that touches Firestore. React
  components call the REST API; they never read/write Firestore directly. (See core-belief #2.)
- **Firebase Local Emulator Suite** for development, so the app runs with no cloud project.

## Consequences

- Single codebase, single deploy target (Vercel or Firebase Hosting) — the simplest thing that works,
  with less surface to maintain.
- The data access layer is the repository in `lib/data/`, decoupled from both Firestore specifics and
  the HTTP layer — swappable and unit-testable.
- Firestore is NoSQL, which shapes the data-model and indexing work (see
  [../design/database-schema.md](../design/database-schema.md)) and rules out schema-to-API
  auto-generation tools (see ADR [0003](0003-rest-over-graphql.md)).
- A real Firebase project is needed only to deploy; day-to-day development uses the emulator.
