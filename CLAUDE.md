# CLAUDE.md

Agent instructions for Claude Code in this repo. What StockPilot is: see [README.md](README.md)
(full stack + directory layout in [docs/architecture.md](docs/architecture.md); the hard rules in
[docs/core-beliefs.md](docs/core-beliefs.md)).

Keep the reasoning trail (ADRs, plans) current as the code lands.

## Commands

> Confirmed at Phase 1 (scaffold); the shape is set by the plan. See
> [docs/guides/local-development.md](docs/guides/local-development.md).

```bash
npm install        # install dependencies
npm run dev        # Next.js dev server (http://localhost:3000)
npm run emulators  # Firebase Auth + Firestore emulators (no cloud project needed)
npm run build      # production build
npm run check      # tsc --noEmit (strict)
npm run lint       # ESLint (incl. complexity rules)
npm run test       # vitest run
```

The hard rules (server-side authz, data layer, input validation, no client-side secrets, strict
types, ADR-per-decision) live in [docs/core-beliefs.md](docs/core-beliefs.md) — read them first.

## graphify

This repo uses **graphify** to maintain a queryable knowledge graph of the codebase + docs under
`graphify-out/`. Use it to answer "where/how does X connect" questions before grepping by hand.
`graphify-out/cache/`, `graphify-out/memory/`, and dated snapshot dirs are gitignored; the current
graph is committed so it's available from a fresh clone.

A **post-commit hook** (installed via `graphify hook install`) auto-rebuilds the graph from the
**code** files that changed in each commit. It ignores doc-only changes — after a commit that only
touches `docs/**`/`*.md`, refresh the graph manually with `/graphify --update`. The hook's rebuild
lands *after* the commit, so fold any resulting `graphify-out/` diff into a small follow-up commit.

## Where things go

| What | Where |
|---|---|
| Stack + directory layout | `docs/architecture.md` |
| Hard rules / principles | `docs/core-beliefs.md` |
| New ADR | `docs/decisions/NNNN-title.md` (+ update `index.md`) |
| Implementation plan | `docs/plans/NNNN-title-implementation-plan.md` |
| Detailed design (schema, auth, scalability, UI) | `docs/design/` |
| Feature reference (current behavior) | `docs/features/` |
| Process/how-to guides | `docs/guides/` |
| Env var template | `.env.example` (committed, empty) |
| Real secrets | `.env.local` (gitignored) |
