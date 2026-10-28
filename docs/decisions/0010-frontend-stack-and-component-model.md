# 0010 — Frontend stack: Tailwind + shadcn/ui (owned components)

**Date**: 2026-10-28
**Status**: Accepted

## Context

The UI must be clean, accessible, responsive, and — the priority call-out — built from **reusable**
pieces with little repetition. We chose how to style and how to source components.

Options: a batteries-included component library (MUI, Chakra) vs. headless primitives + utility CSS.
Heavy libraries are fast to start but hard to theme deeply and lock us into their abstractions.

## Decision

- **Tailwind CSS** for styling — utility-first, consistent spacing/size scale, no parallel CSS files
  drifting from markup. Repetition is avoided by extracting components, not by copy-pasting classes.
- **shadcn/ui** for the component layer: accessible **Radix UI** primitives, styled with Tailwind,
  **copied into the repo** (`components/ui/`) so we _own_ the code — no black-box dependency, full
  freedom to theme and extend.
- **class-variance-authority (CVA)** for component variants (e.g. a `Button` with `variant` /
  `size`), so one component defines all its looks in one place instead of many near-duplicate
  components.
- **`cn()` helper** (`clsx` + `tailwind-merge`) for composing/overriding classes safely.
- **lucide-react** for a single, consistent icon set.
- **next-themes** for light/dark, driven by the design tokens in ADR [0011](0011-design-tokens-and-color-system.md).

Component structure:

- `components/ui/` — primitives (Button, Input, Select, Dialog, Table, Card, Badge, Skeleton…).
- `components/<feature>/` — composed feature components (ProductTable, ProductForm, MetricCard).
- `hooks/` — client data/UI hooks. Presentational vs. data concerns stay separate.

## Consequences

- Reuse is structural: primitives in `ui/`, composed once per feature, variants via CVA — few
  repetitions by construction.
- We own every component, so theming and accessibility tweaks are direct edits, not dependency
  fights.
- Some upfront setup (shadcn init, a few primitives) before feature UI; paid back immediately in the
  dashboard and forms.
- Component inventory and conventions are documented in [../design/ui-components.md](../design/ui-components.md).
