# AI & developer tooling

> What tools this project is built and maintained with, for a human reader. This complements the
> README's "AI tool usage" section and the plan's per-phase breakdown.

StockPilot is an AI-first project: it is built with **Claude Code** (Anthropic's agentic coding
tool), with correctness kept by automated quality checks and tests plus human review. Two pieces of
Claude Code tooling are set up in this repo and worth calling out.

## skill-creator (Claude Code plugin)

- **What it is**: an official Claude Code plugin for authoring and editing _skills_ — small, reusable
  instruction packs that teach Claude Code a repeatable, project-specific workflow (for example, "run
  our e2e suite and attach screenshots" or "scaffold a new ADR").
- **Status**: enabled in [`.claude/settings.json`](../../.claude/settings.json) via
  `"skill-creator@claude-plugins-official"`.
- **Why it's here**: as the codebase grows, repeatable chores (new-feature scaffolding, the ADR +
  plan workflow, the e2e-with-screenshots run) are good candidates to capture as project skills so
  they run the same way every time. Any skills we create live under `.claude/skills/` and are
  committed with the repo.
- **How to use it**: in a Claude Code session, ask it to create or edit a skill; the plugin guides
  the structure. There are no project skills yet — this documents the capability and where they'll
  go.

## graphify (knowledge graph)

- **What it is**: a tool that turns the repo (code + docs) into a queryable **knowledge graph** —
  nodes for concepts/files and edges for how they relate — with community detection and a
  plain-language report.
- **Where the output lives**: [`graphify-out/`](../../graphify-out/) — `graph.html` (open in a
  browser), `GRAPH_REPORT.md` (the audit report: god nodes, clusters, surprising connections), and
  `graph.json` (raw data). The current graph is committed; `graphify-out/cache/` and dated snapshots
  are gitignored.
- **Auto-rebuild**: a git **post-commit hook** (installed with `graphify hook install`) rebuilds the
  graph from the **code** files changed in each commit. Doc-only changes don't trigger it — refresh
  those manually with `graphify --update` (or the `/graphify --update` skill in a session).
- **How to use it**: ask a question about the codebase and Claude Code answers from the graph
  (`graphify query "how does auth connect to the data layer?"`), or open `graph.html` to browse it.
- **Why it's here**: it gives a fast map of how the pieces connect — useful for navigating the
  project and seeing the structure at a glance.
