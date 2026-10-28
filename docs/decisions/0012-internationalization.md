# 0012 — Internationalization (next-intl, structured from day one)

**Date**: 2026-10-28
**Status**: Accepted

## Context

Even though the first version ships in English, we want translation structured from the start so
adding a language later is a content task, not a refactor. Retrofitting i18n onto hard-coded strings
is expensive and error-prone, so we avoid hard-coded user-facing text now.

## Decision

- **`next-intl`** for internationalization — the standard fit for the Next.js App Router (works in
  both server and client components, typed message keys).
- **Message catalogs as JSON per locale** in `messages/` (`messages/en.json` to start). Keys are
  namespaced by feature (e.g. `products.form.nameLabel`).
- **No hard-coded user-facing strings** in components — every visible string goes through the `t()`
  translator. (This mirrors a standing rule in the author's other projects.)
- **English-first, growable**: only `en` exists now. Adding a locale = add `messages/<locale>.json`
  and register it; no component changes.
- **Non-UI strings** (log messages, internal errors) are *not* translated — only user-facing text.

## Consequences

- Shipping a second language later is a translation-file task, not a code change.
- A small upfront cost: strings live in `messages/en.json` and are referenced by key, one extra
  indirection versus inline text.
- Keys must be kept in sync with usage — a missing key is a visible bug, so we add the key in the
  same change as the `t()` call.
- This becomes a core convention; it's referenced from [../core-beliefs.md](../core-beliefs.md).
