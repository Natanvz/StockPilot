# 0004 — Auth: Admin-SDK-verified httpOnly session cookies + custom-claim roles

**Date**: 2026-10-28
**Status**: Accepted

## Context

StockPilot requires secure Firebase sign-up / sign-in, protected routes and API endpoints, two roles
(admin, viewer), and OWASP basics: no sensitive data in URLs, proper session handling, secure token
usage. We chose how auth state crosses the client/server boundary.

Options considered:

- **Client SDK only** — keep the Firebase ID token in the browser and send it on each call. Simpler,
  but the token tends to live in JS-reachable storage (XSS-exposed), and the server trusts a bearer
  token on every request.
- **Admin-SDK-verified session cookie** — the client signs in, gets an ID token once, and posts it
  to the server; the server verifies it with the Firebase Admin SDK and returns an httpOnly session
  cookie. The browser then sends the cookie automatically; JS can't read it.

## Decision

- **Session cookies, verified server-side.** `POST /api/auth/session` takes the Firebase ID token,
  verifies it with the **Firebase Admin SDK**, and sets an **httpOnly, Secure, SameSite=Lax** session
  cookie. Sign-out clears it.
- **ID tokens never touch `localStorage`.** They exist briefly in memory on the client, only to be
  exchanged for the cookie.
- **Roles via Firebase custom claims.** Each user carries an `admin` or `viewer` custom claim,
  mirrored into their `users/{uid}` doc for listing. The server reads the claim from the verified
  session on every protected call.
- **Server-side enforcement on every call.** Two helpers: `requireUser()` (valid session or 401) and
  `requireRole('admin')` (correct role or 403). The UI additionally hides controls a viewer can't
  use, but that is never the enforcement (core-belief #1).
- **Route protection.** A Next.js proxy (the `proxy.ts` convention, formerly "middleware") guards
  pages; Route Handlers call the helpers above for the API.
- **Cookie flags.** `httpOnly` + `SameSite=Lax` always; `Secure` in production — but **off when
  running against the Firebase emulator** (`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1`), since local dev
  and e2e are `http://`, where a `Secure` cookie would be dropped. Real deploys (no emulator) get
  `Secure`.
- **Sign-in form is `method="post"`.** Belt-and-braces for OWASP "no secrets in URLs": the JS handler
  does the real work, but if it ever failed to run, the native fallback POSTs (never GET-leaks the
  password into the URL).

## Consequences

- Meets the OWASP points directly: no token in `localStorage` or URLs, httpOnly cookie resists XSS
  token theft, and the server independently verifies identity and role.
- Setting a role requires an admin path (custom claims are set with the Admin SDK) — we seed the
  first admin via a script/emulator step, documented in the local-development guide.
- Full end-to-end write-up (diagram, cookie flags, failure modes) lives in
  [../design/authorization.md](../design/authorization.md); this ADR is the decision, that doc is
  the detail.
