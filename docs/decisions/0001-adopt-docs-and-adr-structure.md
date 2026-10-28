# 0001 — Adopt docs/ + ADR structure

**Date**: 2026-10-28
**Status**: Accepted

## Context

StockPilot is a new project. Before writing code, we wanted a home for process and architecture
documentation and a way to record _why_ decisions were made, so a future contributor can understand
and defend each call and the README can carry honest architecture notes and trade-offs. Capturing
reasoning as we go is cheaper and more honest than reconstructing it at the end.

The structure mirrors the one used in the author's other projects (a `docs/` folder with
`architecture.md`, `decisions/` ADRs, and supporting subfolders).

## Decision

- Add a `docs/` folder with an `index.md` that explains the folder and links its subfolders.
- Top-level docs: `architecture.md` (living stack + structure) and `core-beliefs.md` (hard
  constraints).
- Subfolders, each with its own `index.md`:
  - `decisions/` — ADRs, append-only, numbered `NNNN-*`, with the process in `decisions/index.md`.
  - `design/` — detailed definitions (database schema, authorization, UI) the architecture only
    summarizes.
  - `features/` — current-behavior reference per feature.
  - `guides/` — how-to / process docs.
  - `plans/` — `NNNN-title-implementation-plan.md` for substantial work.
- Record every non-trivial decision here as an ADR, before or alongside the change.
- Documentation is **Phase 0**: the docs skeleton and seed ADRs land before the stack is scaffolded.

## Consequences

- Future contributors can trace each call to its reasoning.
- There is one obvious place for each kind of writing, so docs don't pile up in the README or in
  chat history.
- Small overhead per decision; accepted deliberately — the reasoning trail is a first-class part of
  the project, not a nice-to-have.
