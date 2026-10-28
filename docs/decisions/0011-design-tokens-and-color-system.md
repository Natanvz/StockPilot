# 0011 — Design tokens & color system (semantic CSS variables)

**Date**: 2026-10-28
**Status**: Accepted

## Context

Colors (and other visual constants) must be defined once and reused everywhere, support light and
dark mode, and be easy to re-theme as the product grows. Hard-coding hex values in components is the
anti-pattern we're avoiding — it spreads the same color across dozens of files and makes a theme
change a find-and-replace.

## Decision

- **Design tokens as CSS custom properties** on `:root`, with **semantic (role-based) names**, not
  raw color names. Tokens describe *purpose*: `--background`, `--foreground`, `--card`, `--muted`,
  `--primary`, `--primary-foreground`, `--border`, `--ring`, plus status roles `--success`,
  `--warning`, `--destructive`. A component uses `bg-primary`, never `bg-[#2563eb]`.
- **Light/dark via a second token set** under a `.dark` selector (toggled by next-themes). Components
  don't branch on theme; they read the same token, which resolves per mode.
- **Tailwind maps to the tokens**: `theme.extend.colors` points at the CSS variables, so Tailwind
  utilities (`bg-background`, `text-muted-foreground`) and shadcn components both consume one source
  of truth.
- **Other tokens too**: border radius (`--radius`), and we lean on Tailwind's built-in spacing /
  typography scales rather than inventing ad-hoc values.
- **Re-theming is a one-file change**: edit the token values; every component follows.

## Consequences

- One place defines the palette; a rebrand or a new accent is a token edit, not a sweep through
  components.
- Light/dark is free for any component that uses tokens.
- Consistency is enforced by convention + lint habit (no raw hex in components); the token list lives
  in [../design/ui-components.md](../design/ui-components.md).
- The accent/brand color starts as a sensible default (a blue `--primary`); changing it later is
  trivial and expected.
