# Authorization & auth model

> The decision and its rationale are in ADR [0004](../decisions/0004-auth-session-cookies-admin-sdk-and-custom-claims.md).
> This doc is the end-to-end detail. Status: design; confirmed as the auth layer lands.

## Roles

- **admin** — full access: create, read, update, delete products **and categories**; see all
  edit/delete controls and the category-management screen.
- **viewer** — read-only: list and view products, categories, and metrics; no write controls, and the
  server rejects writes.

A user's role is a **Firebase custom claim** (the enforcement source of truth) and is also mirrored
into their `users/{uid}` document for easy listing.

## Sign-in flow

```
1. Browser: firebase-auth sign-in (email/password) → Firebase ID token (held in memory only)
2. Browser → POST /api/auth/session { idToken }
3. Server: Firebase Admin SDK verifies the ID token
4. Server: creates a session cookie from it and returns it as
   Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...
5. Browser stores the cookie (JS cannot read it) and sends it automatically on later requests
```

Sign-out: `DELETE /api/auth/session` clears the cookie.

## Every protected request

```
Request carries the session cookie
  → requireUser(): verify the session cookie via Admin SDK → { uid, role } or 401
  → requireRole('admin'): compare role to what the action needs → or 403
  → Zod-validate body/params
  → ProductRepository performs the Firestore work
```

## Why these choices satisfy OWASP basics

- **No sensitive data in URLs** — identity rides in the cookie, never a query string.
- **Proper session handling** — httpOnly (XSS can't read it), Secure (HTTPS only), SameSite=Lax
  (limits CSRF), with an expiry.
- **Secure token usage** — the ID token is verified server-side and never persisted in JS-reachable
  storage; the client holds only the opaque session cookie it cannot read.
- **Broken access control** (OWASP's #1 risk) — every mutating call re-checks role on the server;
  hiding UI is never the control.

## Failure modes

| Situation                                  | Result                                                 |
| ------------------------------------------ | ------------------------------------------------------ |
| No / invalid / expired session cookie      | 401, redirect to sign-in                               |
| Valid session, role too low for the action | 403                                                    |
| Valid request, invalid body                | 400 with a Zod error summary (no raw internals leaked) |

## Seeding the first admin

Custom claims are set with the Admin SDK, so the first admin is granted via a small script / emulator
step (documented in [../guides/local-development.md](../guides/local-development.md)). New users
default to `viewer`.
