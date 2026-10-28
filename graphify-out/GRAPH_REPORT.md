# Graph Report - D:/Dev/Projects/Personal/StockPilot  (2026-10-28)

## Corpus Check
- Corpus is ~12,243 words - fits in a single context window. You may not need a graph.

## Summary
- 141 nodes · 170 edges · 15 communities (9 shown, 6 thin omitted)
- Extraction: 94% EXTRACTED · 5% INFERRED · 1% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.76)
- Token cost: 174,373 input · 9,000 output

## Community Hubs (Navigation)
- Architecture & Conventions
- Roles, Auth & Firestore Schema
- Security & Scalability Posture
- Testing & Observability
- Frontend Stack & Components
- Code Quality & Tooling
- i18n & Core Beliefs
- AI Feature (proposed)
- Scalability Mechanics
- Icons
- UX-State Components
- Multi-tenancy
- Features Reference
- Docs Index
- Plans Index

## God Nodes (most connected - your core abstractions)
1. `Next.js 14 App Router application` - 9 edges
2. `ADR index and process` - 8 edges
3. `StockPilot` - 7 edges
4. `ADR 0004: Session cookies + custom-claim roles` - 6 edges
5. `ADR 0005: Code-quality enforcement` - 6 edges
6. `ADR 0006: Scalability posture` - 6 edges
7. `Firebase Custom Claim` - 5 edges
8. `ADR 0003: REST over GraphQL` - 5 edges
9. `ADR 0009 — Testing strategy` - 5 edges
10. `Playwright e2e tests` - 5 edges

## Surprising Connections (you probably didn't know these)
- `StockPilot` --references--> `Firebase Authentication`  [EXTRACTED]
  README.md → docs/architecture.md
- `StockPilot` --references--> `Cloud Firestore`  [EXTRACTED]
  README.md → docs/architecture.md
- `StockPilot` --implements--> `Next.js 14 App Router application`  [EXTRACTED]
  README.md → docs/architecture.md
- `Claude Code` --references--> `graphify knowledge graph`  [INFERRED]
  README.md → CLAUDE.md
- `Maintained aggregate counters (stats/products)` --conceptually_related_to--> `Dashboard summary metrics`  [INFERRED]
  docs/decisions/0006-scalability-posture.md → README.md

## Hyperedges (group relationships)
- **Protected Request Enforcement Chain** — docs_design_authorization_session_cookie, docs_design_authorization_require_user, docs_design_authorization_require_role, docs_plans_0001_foundation_and_docs_implementation_plan_zod_validation, docs_plans_0001_foundation_and_docs_implementation_plan_product_repository [EXTRACTED 1.00]
- **Authenticated request flow (UI to Firestore)** — docs_architecture_route_handlers, docs_decisions_0004_auth_session_cookies_admin_sdk_and_custom_claims_require_user_role, docs_architecture_zod_validation, docs_architecture_data_access_layer, docs_architecture_firestore [EXTRACTED 1.00]
- **Four quality pillars** — docs_architecture_layering, docs_core_beliefs_server_authorization, docs_decisions_0006_scalability_posture_adr, docs_decisions_0005_code_quality_enforcement_adr [EXTRACTED 1.00]
- **Server-side auth model** — docs_architecture_firebase_admin_sdk, docs_architecture_session_cookie, docs_decisions_0004_auth_session_cookies_admin_sdk_and_custom_claims_custom_claims, docs_decisions_0004_auth_session_cookies_admin_sdk_and_custom_claims_require_user_role [EXTRACTED 1.00]
- **StockPilot frontend stack** — docs_decisions_0010_frontend_stack_and_component_model_tailwind_css, docs_decisions_0010_frontend_stack_and_component_model_shadcn_ui, docs_decisions_0010_frontend_stack_and_component_model_class_variance_authority, docs_decisions_0010_frontend_stack_and_component_model_next_themes, docs_decisions_0011_design_tokens_and_color_system_design_tokens, docs_decisions_0012_internationalization_next_intl, docs_decisions_0013_data_fetching_and_forms_tanstack_query [EXTRACTED 1.00]
- **Data/forms reuse chain** — docs_decisions_0013_data_fetching_and_forms_tanstack_query, docs_decisions_0013_data_fetching_and_forms_react_hook_form, docs_decisions_0013_data_fetching_and_forms_shared_zod_schemas, docs_decisions_0013_data_fetching_and_forms_typed_api_client, docs_decisions_0013_data_fetching_and_forms_ux_state_components [EXTRACTED 1.00]
- **Testing strategy (unit + e2e on emulator)** — docs_decisions_0009_testing_strategy_vitest, docs_decisions_0009_testing_strategy_playwright, docs_decisions_0009_testing_strategy_firebase_local_emulator_suite, docs_decisions_0009_testing_strategy_viewer_403_assertion, docs_decisions_0009_testing_strategy_screenshot_proofs [EXTRACTED 1.00]

## Communities (15 total, 6 thin omitted)

### Community 0 - "Architecture & Conventions"
Cohesion: 0.11
Nodes (25): ProductRepository data access layer, Firebase Local Emulator Suite, Cloud Firestore, GitHub Actions CI/CD, Layered separation of concerns, next-intl i18n, Next.js 14 App Router application, Next.js Route Handlers (REST API) (+17 more)

### Community 1 - "Roles, Auth & Firestore Schema"
Cohesion: 0.11
Nodes (23): Admin Role, Authorization & Auth Model, Broken Access Control Protection, Firebase Admin SDK, Firebase Custom Claim, OWASP Basics Compliance, requireRole Helper, requireUser Helper (+15 more)

### Community 2 - "Security & Scalability Posture"
Cohesion: 0.10
Nodes (21): graphify knowledge graph, graphify post-commit hook, StockPilot, Firebase Admin SDK, Firebase Authentication, httpOnly session cookie, Stateless compute, No secrets in client, URLs, or logs (+13 more)

### Community 3 - "Testing & Observability"
Cohesion: 0.12
Nodes (20): Firestore, requireUser / requireRole helpers, GitHub Actions CI, ADR 0008 — Observability, Observability (deferred), Performance monitoring (Firebase Performance / Web Vitals), requestId correlation, Error tracking (Sentry) (+12 more)

### Community 4 - "Frontend Stack & Components"
Cohesion: 0.14
Nodes (19): httpOnly session cookie, ADR 0010 — Frontend stack & component model, class-variance-authority (CVA), cn() helper (clsx + tailwind-merge), next-themes (light/dark), Radix UI primitives, shadcn/ui (owned components), Tailwind CSS (+11 more)

### Community 5 - "Code Quality & Tooling"
Cohesion: 0.20
Nodes (12): Code quality (guide), Complexity ceilings (lint-enforced), ESLint, Pre-commit hook (Husky + lint-staged), Prettier, sonarjs complexity rules, TypeScript strict mode, Guides index (+4 more)

### Community 6 - "i18n & Core Beliefs"
Cohesion: 0.33
Nodes (6): Core beliefs, Next.js App Router, ADR 0012 — Internationalization, JSON message catalogs per locale, next-intl, Scalability (design doc)

### Community 7 - "AI Feature (proposed)"
Cohesion: 0.50
Nodes (5): Server-side authorization enforcement, requireUser / requireRole helpers, ADR 0007: AI-powered feature (product-description generation), POST /api/products/:id/describe endpoint, Prompt-injection awareness

### Community 8 - "Scalability Mechanics"
Cohesion: 0.50
Nodes (4): Maintained aggregate counter document, Multi-tenancy (subcollection per tenant), Distributed (sharded) counter, Dashboard (list + summary metrics)

## Ambiguous Edges - Review These
- `Shared Zod schemas (client + server)` → `httpOnly session cookie`  [AMBIGUOUS]
  docs/decisions/0013-data-fetching-and-forms.md · relation: references

## Knowledge Gaps
- **44 isolated node(s):** `Features Index`, `Firebase Local Emulator Suite`, `Documentation Index`, `Plans Index`, `graphify post-commit hook` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Shared Zod schemas (client + server)` and `httpOnly session cookie`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `ADR index and process` connect `Architecture & Conventions` to `Security & Scalability Posture`, `AI Feature (proposed)`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Core beliefs` connect `i18n & Core Beliefs` to `Testing & Observability`, `Frontend Stack & Components`, `Code Quality & Tooling`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `Build sequence (Phases 0–8)` connect `Testing & Observability` to `Frontend Stack & Components`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `Price as Integer Cents`, `Composite Index Strategy`, `Cursor Pagination` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Architecture & Conventions` be split into smaller, more focused modules?**
  _Cohesion score 0.10666666666666667 - nodes in this community are weakly interconnected._
- **Should `Roles, Auth & Firestore Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.1067193675889328 - nodes in this community are weakly interconnected._