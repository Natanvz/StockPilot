# UI components & frontend design

> The frontend decisions are ADRs [0010](../decisions/0010-frontend-stack-and-component-model.md)
> (stack), [0011](../decisions/0011-design-tokens-and-color-system.md) (tokens),
> [0012](../decisions/0012-internationalization.md) (i18n), and
> [0013](../decisions/0013-data-fetching-and-forms.md) (data & forms). This doc is the practical
> detail. Status: the token set and primitive list are fleshed out as the UI lands (Phase 4).

## Stack at a glance

Tailwind CSS · shadcn/ui (Radix primitives, owned in `components/ui/`) · CVA for variants · `cn()`
for class composition · lucide-react icons · next-themes (light/dark) · next-intl (i18n) · TanStack
Query (server state) · react-hook-form + Zod (forms).

## Design tokens (color system)

Colors are **semantic CSS variables**, defined once on `:root` and overridden under `.dark`. Tailwind
maps utilities to them, so components use roles (`bg-primary`, `text-muted-foreground`), never raw
hex. Planned token roles:

| Token                                     | Role                                     |
| ----------------------------------------- | ---------------------------------------- |
| `--background` / `--foreground`           | Page surface and its text                |
| `--card` / `--card-foreground`            | Card/panel surface and text              |
| `--muted` / `--muted-foreground`          | Subdued surfaces and secondary text      |
| `--primary` / `--primary-foreground`      | Primary action (buttons, active state)   |
| `--border`, `--input`, `--ring`           | Borders, input borders, focus rings      |
| `--success`, `--warning`, `--destructive` | Status: active/ok, caution, delete/error |
| `--radius`                                | Corner radius scale                      |

Re-theming = editing these values in one place.

## Component set

- **Primitives** (`components/ui/`): Button, Input, Select, Dialog, Table, Card, Badge, Skeleton,
  Toast. Accessible (Radix), themed via tokens, variants via CVA.
- **Feature components** (`components/<feature>/`): `ProductTable`, `ProductForm`, `MetricCard`,
  `FilterBar`, `Pagination`, and role-gated action buttons (admin sees edit/delete; viewer doesn't).
- **Shared UX states**: `EmptyState`, `ErrorState`, loading skeletons, success/error toasts — one
  implementation each, reused across views.

## State management

- **Server state**: TanStack Query owns fetching, caching, loading/error, and cache invalidation
  after mutations. No per-component fetch boilerplate.
- **UI state** (active filter, sort key, pagination cursor): held locally in the dashboard, encoded
  in the URL query where it should be shareable/back-button-friendly.
- **RSC vs. client**: static shell and initial data lean on server components; interactive pieces
  (forms, filter controls, anything with hooks) are client components. The boundary is drawn as
  tightly as possible so most of the tree stays server-rendered.

## Forms

react-hook-form + the **shared Zod schema** from `lib/validation/` (same schema validates client and
server). Field errors come from the schema; no duplicated validation rules.

## Internationalization

All user-facing strings go through next-intl's `t('key')`, keyed in `messages/en.json` and namespaced
by feature. English only for now; adding a locale is a new JSON file. No hard-coded visible text.

## Responsive & accessibility

- Mobile-first; Tailwind breakpoints. The product table reflows to a card/stacked layout on narrow
  screens.
- Semantic HTML, labelled form controls, keyboard navigation and visible focus (Radix handles much of
  this; we don't regress it).
