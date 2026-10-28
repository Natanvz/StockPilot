# 0008 — Observability (structured logging + error tracking)

**Date**: 2026-10-28
**Status**: Proposed

## Context

Observability — logging, error tracking, and performance monitoring (Firebase Performance, Sentry, or
equivalent) — is a natural addition for a running service. We chose not to build it in the first
version, but record the intended approach here so it is a deliberate deferral, not an oversight.

## Decision (proposed)

If built, observability has two cheap, high-value layers:

- **Structured logging in the API.** A small logger wrapper emits JSON lines (`timestamp`, `level`,
  `route`, `uid`, `latencyMs`, `requestId`) from every Route Handler, instead of ad-hoc
  `console.log`. Never log secrets, tokens, or full request bodies. A `requestId` ties a user action
  to its server logs.
- **Error tracking.** Sentry (or equivalent) on both client and server captures unhandled errors with
  stack traces and release/version tags, so failures surface with context instead of silently.

Optionally, **performance monitoring** (Firebase Performance / Web Vitals) for page-load and API
latency once there is real traffic.

## Consequences

- When traffic is real, failures and slow paths are visible rather than invisible; the structured
  logs also feed the AI-feature metrics in ADR [0007](0007-ai-powered-feature.md).
- Kept out of the first version to protect scope; listed in the plan's "what's next."
- Superseded by an "Accepted" ADR if/when it is actually built.
