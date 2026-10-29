# Graph Report - D:/Dev/Projects/Personal/StockPilot  (2026-10-28)

## Corpus Check
- Corpus is ~25,532 words - fits in a single context window. You may not need a graph.

## Summary
- 307 nodes · 559 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.82)
- Token cost: 186,862 input · 9,500 output

## Community Hubs (Navigation)
- Product UI Components
- Auth Model & Firestore Schema
- Architecture & Core Beliefs
- Products Data Layer & Hooks
- Session & Roles
- API Route Handlers & Guards
- Auth UI & Client SDK
- Dashboard & Filtering
- Frontend Stack & Design
- App Shell & Providers
- Observability (deferred)
- End-to-End Tests
- Code-Quality Tooling
- Next.js Config
- Internationalization
- E2E Seed
- Demo-Users Seed
- E2E Config
- Admin Seed
- Features Reference

## God Nodes (most connected - your core abstractions)
1. `cn()` - 15 edges
2. `Architecture Overview` - 14 edges
3. `Button()` - 10 edges
4. `toErrorResponse()` - 10 edges
5. `requireUser()` - 10 edges
6. `Core Beliefs (hard constraints)` - 9 edges
7. `Firestore Database Schema` - 9 edges
8. `Scalability Posture` - 9 edges
9. `requireRole()` - 8 edges
10. `getSessionUser()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --calls--> `getSessionUser()`  [EXTRACTED]
  app/(dashboard)/dashboard/page.tsx → lib/auth/session.ts
- `StockPilot (mini SaaS product-catalog dashboard)` --cites--> `ADR 0007 — AI-powered feature (Proposed)`  [EXTRACTED]
  README.md → docs/decisions/0007-ai-powered-feature.md
- `Product CRUD with role-gated writes` --conceptually_related_to--> `Custom-claim roles (admin / viewer)`  [INFERRED]
  README.md → docs/decisions/0004-auth-session-cookies-admin-sdk-and-custom-claims.md
- `POST()` --calls--> `createSessionCookie()`  [EXTRACTED]
  app/api/auth/session/route.ts → lib/auth/session.ts
- `GET()` --calls--> `toErrorResponse()`  [EXTRACTED]
  app/api/products/[id]/route.ts → lib/api/respond.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Server-side authorization enforcement chain** — docs_core_beliefs_server_side_authorization, docs_decisions_0004_auth_session_cookies_admin_sdk_and_custom_claims_session_cookie, docs_decisions_0004_auth_session_cookies_admin_sdk_and_custom_claims_require_user_require_role, docs_decisions_0004_auth_session_cookies_admin_sdk_and_custom_claims_custom_claim_roles [INFERRED 0.85]
- **Request flow: UI -> REST -> repository -> Firestore** — docs_architecture_rest_route_handlers, docs_architecture_zod_validation, docs_decisions_0002_tech_stack_nextjs_firebase_firestore_product_repository, docs_decisions_0002_tech_stack_nextjs_firebase_firestore_firestore [INFERRED 0.85]
- **Scalability posture mechanisms** — docs_decisions_0006_scalability_posture_stateless_compute, docs_decisions_0006_scalability_posture_cursor_pagination, docs_decisions_0006_scalability_posture_aggregate_counters, docs_decisions_0006_scalability_posture_multi_tenancy [INFERRED 0.85]
- **Frontend Stack** — docs_decisions_0010_frontend_stack_and_component_model_tailwind, docs_design_ui_components_shadcn, docs_design_ui_components_design_tokens, docs_design_ui_components_next_intl, docs_decisions_0013_data_fetching_and_forms_tanstack_query [INFERRED 0.85]
- **Data Fetching & Forms Reuse Chain** — docs_decisions_0013_data_fetching_and_forms_tanstack_query, docs_decisions_0013_data_fetching_and_forms_react_hook_form, docs_decisions_0013_data_fetching_and_forms_zod, docs_decisions_0013_data_fetching_and_forms_typed_api_client [INFERRED 0.85]
- **Firestore Scalability Posture** — docs_design_scalability_stateless_compute, docs_design_scalability_aggregate_counter, docs_design_scalability_cursor_pagination, docs_design_scalability_sharded_counter, docs_design_scalability_multi_tenancy [INFERRED 0.85]

## Communities (22 total, 6 thin omitted)

### Community 0 - "Product UI Components"
Cohesion: 0.09
Nodes (32): DeleteDialog(), MetricCards(), ADR-0006, formSchema, FormValues, ProductFormDialog(), toDefaults(), ProductTable() (+24 more)

### Community 1 - "Auth Model & Firestore Schema"
Cohesion: 0.07
Nodes (45): ADR 0014: Disable cacheComponents, Next.js cacheComponents, ADR Index & Structure, Authorization & Auth Model, Firebase Custom Claims, OWASP Basics Compliance, ProductRepository, Admin/Viewer Roles (+37 more)

### Community 2 - "Architecture & Core Beliefs"
Cohesion: 0.08
Nodes (44): CLAUDE.md Agent Instructions, graphify knowledge graph tooling, Layered separation (UI / HTTP / core), Architecture Overview, REST API via Next.js Route Handlers, TanStack Query + react-hook-form (frontend data/forms), Zod validation at every API boundary, No secrets in client, URLs, or logs (+36 more)

### Community 3 - "Products Data Layer & Hooks"
Cohesion: 0.09
Nodes (24): ADR-0002, PRODUCTS_KEY, STATS_KEY, ADR-0006, JSON_HEADERS, productsApi, ADR-0013, isoOrNull() (+16 more)

### Community 4 - "Session & Roles"
Cohesion: 0.12
Nodes (16): CreateSessionSchema, POST(), DashboardPage(), Role, ROLES, toRole(), ADR-0004, createSessionCookie() (+8 more)

### Community 5 - "API Route Handlers & Guards"
Cohesion: 0.21
Nodes (16): DELETE(), GET(), notFound(), PATCH(), RouteContext, GET(), POST(), GET() (+8 more)

### Community 6 - "Auth UI & Client SDK"
Cohesion: 0.19
Nodes (8): authenticate(), AuthForm(), Mode, SignOutButton(), getClientAuth(), Credentials, credentialsSchema, ADR-0013

### Community 7 - "Dashboard & Filtering"
Cohesion: 0.20
Nodes (13): Dashboard(), DashboardToolbar(), filterByStatus(), ResultsProps, searchProducts(), sortProducts(), ToolbarProps, FilterBar() (+5 more)

### Community 8 - "Frontend Stack & Design"
Cohesion: 0.19
Nodes (14): ADR 0010 — Frontend stack & component model, shadcn/ui owned Radix primitives, Tailwind CSS, ADR 0013: Data Fetching & Forms, react-hook-form, TanStack Query, Thin Typed API Client, Reusable UX-State Components (+6 more)

### Community 9 - "App Shell & Providers"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 10 - "Observability (deferred)"
Cohesion: 0.40
Nodes (6): ADR 0008 — Observability, Observability (deferred), Performance monitoring (Firebase Performance / Web Vitals), requestId correlation, Error tracking (Sentry), Structured logging (JSON lines)

### Community 11 - "End-to-End Tests"
Cohesion: 0.67
Nodes (3): ADMIN, signIn(), VIEWER

### Community 12 - "Code-Quality Tooling"
Cohesion: 0.50
Nodes (3): ADR-0005, complexityRules, eslintConfig

### Community 13 - "Next.js Config"
Cohesion: 0.50
Nodes (3): ADR-0014, nextConfig, withNextIntl

## Knowledge Gaps
- **76 isolated node(s):** `RouteContext`, `geistSans`, `geistMono`, `metadata`, `Mode` (+71 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UI Components & Frontend Design` connect `Frontend Stack & Design` to `Auth Model & Firestore Schema`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `Tailwind CSS` connect `Frontend Stack & Design` to `Architecture & Core Beliefs`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `Design Docs Index` connect `Auth Model & Firestore Schema` to `Frontend Stack & Design`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `RouteContext`, `geistSans`, `geistMono` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Product UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.08865248226950355 - nodes in this community are weakly interconnected._
- **Should `Auth Model & Firestore Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Architecture & Core Beliefs` be split into smaller, more focused modules?**
  _Cohesion score 0.07610993657505286 - nodes in this community are weakly interconnected._