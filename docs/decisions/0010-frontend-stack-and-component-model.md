# 0010 — Frontend stack: Tailwind + shadcn/ui (owned components)

**Date**: 2026-10-28
**Status**: Accepted

## Context

The UI must be clean, accessible, responsive, and — the priority call-out — built from **reusable**
pieces with little repetition. We chose how to style and how to source components.

Options: a batteries-included component library (MUI, Chakra) vs. headless primitives + utility CSS.
Heavy libraries are fast to start but hard to theme deeply and lock us into their abstractions.

### Alternatives considered

**Styling — why Tailwind:**

- **styled-components / Emotion (CSS-in-JS)** — rejected: runtime style cost and no shared spacing/size
  scale by default; styles scatter across components.
- **CSS Modules / plain CSS** — rejected: more boilerplate and a parallel file set that drifts from the
  markup; no design scale out of the box.
- **Bootstrap** — rejected: an opinionated visual brand that's harder to customize deeply.
- **Tailwind** — chosen: utility-first with a consistent scale, styles beside the markup, pairs
  naturally with shadcn; repetition handled by extracting components.

**Component layer — why shadcn/ui:**

- **MUI / Chakra / Ant Design** — rejected: packaged dependencies with heavier bundles, their own
  abstractions, and theming that fights the library.
- **Headless UI** — rejected: fewer primitives than Radix for the dialogs/menus we need.
- **Radix primitives alone** — viable, but shadcn gives Radix-based, Tailwind-styled _starting_
  components (not just bare primitives) while staying copy-in.
- **shadcn/ui** — chosen: accessible Radix primitives, styled with Tailwind, copied into the repo so
  we own the code.

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
