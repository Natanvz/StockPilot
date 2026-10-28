# Documentation

This folder holds the process and architecture documentation for StockPilot. Start with
[architecture.md](architecture.md) for the system overview, then follow the pointers below.

## Top-level docs

- **[architecture.md](architecture.md)** — the software structure: stack, how the pieces connect,
  key directories. The map; the `design/` folder holds the detail.
- **[core-beliefs.md](core-beliefs.md)** — non-negotiable principles for anyone (human or AI)
  working in this repo. Hard constraints, not suggestions.

## Subfolders

| Folder | What it holds |
|---|---|
| **[decisions/](decisions/)** | Architectural Decision Records (ADRs). Every non-trivial design call, append-only, with context / decision / consequences. Start at [decisions/index.md](decisions/index.md). |
| **[design/](design/)** | Detailed definitions of things `architecture.md` only mentions briefly — database schema, authorization model, UI components. Start at [design/index.md](design/index.md). |
| **[features/](features/)** | Current-behavior reference for each feature (routes, components, systems). Start at [features/index.md](features/index.md). |
| **[guides/](guides/)** | How-to / process docs: running locally, code-quality rules, deployment. Start at [guides/index.md](guides/index.md). |
| **[plans/](plans/)** | Implementation plans — `NNNN-title-implementation-plan.md` — that sequence larger pieces of work. Start at [plans/index.md](plans/index.md). |
