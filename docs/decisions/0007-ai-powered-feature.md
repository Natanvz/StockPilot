# 0007 — AI-powered feature (product-description generation)

**Date**: 2026-10-28
**Status**: Proposed

## Context

A natural future feature is a generative-AI integration — for example auto-generating product
descriptions, smart category suggestions, or natural-language search. We chose **not** to build it in
the first version; the effort went to role-based UI, search/pagination, and CI/CD, which tie directly
into the core work. This ADR records the design so the decision is deliberate and the feature is
ready to pick up.

(Building StockPilot _with_ AI tools like Claude Code — see [../guides/tooling.md](../guides/tooling.md)
— is a separate thing from this in-product AI feature.)

## Decision (proposed)

If built, the first AI feature is **auto-generate a product description** from the product's name and
category, via a server-side call to a generative AI API (Claude). Shape:

- A Route Handler `POST /api/products/:id/describe` (or a draft endpoint pre-create) calls the model
  server-side; the API key lives only in a server env var, never in the browser.
- The generated text is a **draft the admin edits and approves**, never written to the product
  silently — a human stays in the loop.
- Only `admin` may call it (same `requireRole` gate as other writes).

## Safe productionization

- **Secrets**: API key server-side only; never shipped to the client or logged.
- **Input/output limits**: cap prompt and response size; validate the product fields with Zod before
  sending.
- **Abuse & cost control**: rate-limit per user; a per-tenant usage cap; short timeouts.
- **Prompt-injection awareness**: treat model output as untrusted text — sanitize before rendering,
  don't let it drive actions.
- **Failure handling**: the feature degrades gracefully — if the AI call fails, the admin just writes
  the description manually.
- **Observability**: log latency, token usage, and failure rate (ties to ADR
  [0008](0008-observability.md)).

## Consequences

- Clear, low-risk first AI feature with a documented safety story, ready to implement if time allows
  or as a "what's next" item.
- Superseded by an "Accepted" ADR if/when it is actually built.
