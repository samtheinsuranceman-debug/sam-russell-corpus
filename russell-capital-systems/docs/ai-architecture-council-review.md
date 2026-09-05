# AI Architecture Council Review

## OpenAI — gpt-5

- Safe merge order
  - Create an integration branch; land the shared component first, then the seven pages as stubs with route files present but content behind a feature flag so no existing of the 222 routes is displaced.
  - Introduce a route-manifest JSON (id, path, module, primary/secondary, data-mode: real/simulated) prefilled for all 260 page modules; add the seven pages to it in the same PR to prevent orphaning.
  - Wire the shared component to the design system tokens without changing the homepage: keep the black/green skyline on “/” only; scope the purple design tokens to an interior layout shell.
  - Run a “no-route-deletions” CI check that diffs the manifest and Next/React router to fail any removal; require migration notes for any path change.

- Authorization migration
  - Remove all hardcoded passwords, backdoors, email-owner bypasses, and the custom /login logic at the server boundary; keep the /login route but convert it to a server-side 302 that calls the managed runtime’s OAuth start endpoint and maps returns to server-enforced roles. No client-side secrets.
  - Centralize auth in tRPC with a server-only middleware: resolve session from the managed runtime, load role grants, and attach {userId, roles, orgId} to ctx; block when absent.
  - Replace any client/route guards with server-side procedure guards (isAuthenticated, hasRole, hasPlanAccess) and Drizzle queries filtered by user/org; add a slim users table keyed by managed subjectId only (no passwords).
  - Add a one-time migration script that scans the codebase for password literals and bypass flags; add ESLint rules and a pre-commit grep to prevent reintroduction.

- Persistence boundaries
  - Define data-mode per route/procedure in the manifest: core client/planning workflows = real; secondary/simulated = simulated.
  - For simulated flows, route writes to a sandbox schema or in-memory service on the server; visibly label UI controls as “Simulated” and suppress Drizzle writes. For real flows, require role checks and transactional Drizzle calls.
  - Add a server-only feature flag that can force simulated mode off in staging/production for designated routes; never gate with client flags.
  - New Drizzle migrations (on top of the existing 58) add linkage tables keyed by subjectId/orgId and audit tables (who, when, what) for all real writes.

- Navigation and page classification
  - Introduce two top-level nav buckets: “Primary Workflows” and “Secondary Information”; render category badges from the manifest so every routed page is clearly labeled without changing paths.
  - Keep existing slugs; if a page is reassigned, only update the manifest category and breadcrumbs.
  - Use an InteriorLayout that applies the refined purple system to all non-home routes; keep the homepage skyline theme isolated to HomeLayout to avoid bleed-through.

- Validation and testing
  - Expand tests from 90 to cover: (a) route smoke tests for all 222 routes (SSR render + 200/302), (b) auth matrix tests ensuring 401/403 for missing roles on protected tRPC procedures, (c) persistence tests that assert no Drizzle writes occur in simulated mode.
  - Add Playwright e2e for the seven new pages and critical primary flows; include visual snapshots to lock the homepage skyline and interior purple styling.
  - Implement four audit suites (render, interaction, duplication, placeholder/usefulness) driven by the manifest; export per-route findings without auto-deleting pages.
  - Gate CI on: schema migration up/down, tRPC contract checks, auth middleware coverage threshold, and a “no plain-text password/backdoor” static scan.

## Anthropic — claude-sonnet-4-6

1. **Merge additively in a protected sequence.**  
   First inventory and freeze the 222 routes/260 page modules; then introduce the seven pages and shared component behind new, non-conflicting route entries. Reuse existing layout, tRPC, Drizzle, and managed-runtime adapters before moving visual pieces. Preserve the homepage’s black/green city-at-night skyline and lights as an explicit visual-regression baseline; apply the purple system only to portal interiors. Do not overwrite route files until duplication and dependency audits identify a safe consolidation target.

2. **Replace imported authentication with server-enforced managed OAuth authorization.**  
   Remove hardcoded trial/backdoor passwords, email-owner checks, imported `/login` credential logic, and any client-managed role claims. Make the managed OAuth identity the sole authentication source; resolve roles and permissions server-side from authoritative managed database/session context. Gate tRPC procedures and storage/database access with centralized authorization middleware, using explicit roles such as `client`, `advisor`, `planner`, and `admin`, with deny-by-default behavior.

3. **Define real persistence boundaries before wiring workflows.**  
   Persist planning records, client profiles, goals, assumptions, documents/metadata, workflow status, and audit events through tRPC → server authorization → Drizzle migrations/database. Use managed storage only for uploaded artifacts, with database references and ownership checks—not direct client trust. Clearly label calculators, projections, sample dashboards, generated insights, and demo responses as simulated whenever they do not save or derive from authoritative data; never present mocked state as saved financial information.

4. **Reclassify navigation without removing pages.**  
   Establish a primary portal IA for core client and planning work—e.g., Dashboard, Clients, Plans, Goals, Cash Flow, Documents, Tasks/Reviews—and create a visibly labeled **Secondary Information** library for educational content, reference dashboards, FAQs, tools, and lower-frequency informational pages. Keep every existing route reachable, but add route metadata (`primary`, `secondary-information`, `legacy`, `internal`, `workflow`) to drive navigation, breadcrumbs, search, and audit reporting rather than hiding or deleting pages.

5. **Make route audits and migration validation release gates.**  
   For all routed pages, record render, interaction, duplication, placeholder, and usefulness outcomes, with owners and remediation status; flag issues but do not auto-delete routes. Add automated coverage for OAuth role boundaries, unauthorized tRPC calls, ownership isolation, migration up/down or rollback safety, persisted workflow round-trips, storage access checks, and navigation classification. Add visual regression tests for the homepage skyline and representative purple portal interiors, plus route smoke tests for all 222 explicit routes and integration tests for the 90-test baseline before and after each merge stage.

## Google Gemini — gemini-3-flash-preview

Based on the verified facts and platform constraints, here are five concise, implementation-specific recommendations for your portal merge:

### 1. Safe Merge Order: Namespace-Isolated Router Integration
To merge the 7 new pages and shared component without risking the existing 222 routes, use **tRPC Router Namespacing**. Instead of flat-merging procedures into the `appRouter`, mount the new functionality under a dedicated sub-router (e.g., `trpc.newPortal.*`). This prevents naming collisions and allows you to deploy the shared component as a standalone module that existing pages can opt into without modification. 
*   **Action:** Prefix all new Drizzle migrations with a timestamp later than the existing 58 to ensure sequential execution.

### 2. Authorization Migration: Context-Driven Middleware
Immediately replace the custom `/login` flow and hardcoded bypasses by refactoring the `createTRPCContext`. Inject the **managed runtime’s OAuth session** directly into the context. Create a `protectedProcedure` using tRPC middleware that validates the OAuth role before reaching any resolver.
*   **Action:** Delete the `trial_password` and `backdoor` fields from the Drizzle schema and replace them with a `managed_role` enum that maps directly to your OAuth provider's claims.

### 3. Persistence Boundaries: Simulated Data Interceptors
To separate real data from simulated controls, implement a **Service Layer Interceptor**. For planning workflows, use a `is_simulated` flag in the Drizzle schema or a separate `simulated_projections` table. Ensure the tRPC procedures for "Simulated" actions are explicitly typed to return mock-safe data structures, preventing accidental writes to core financial tables.
*   **Action:** Add a global UI decorator (e.g., a "Simulation Mode" banner) triggered by the data source metadata returned in the tRPC response.

### 4. Navigation & Classification: Layout-Based Theme Switching
Implement a **Dual-Layout Routing Strategy** to manage the design system shift. Wrap the homepage in a `SkylineLayout` (Black/Green CSS variables) and all portal routes in a `RefinedPurpleLayout`. Use a nested route structure to classify the "Secondary Information" library under a `/library/*` path, ensuring it uses a distinct `LibrarySidebar` component to separate it from primary workflows.
*   **Action:** Use Tailwind’s `data-theme` attribute on the layout wrapper to toggle between the city-skyline and purple design systems without per-page style overrides.

### 5. Validation: Automated 5-Point Audit Script
Instead of manual page-by-page checks, create a **React Testing Library (RTL) suite** that targets the 260 page modules. Use a script to crawl the 222 routes and verify: (1) **Render** (no crash), (2) **Interaction** (primary button existence), (3) **Duplication** (check for identical route paths), (4) **Placeholder** (detect "lorem ipsum" or TODO strings), and (5) **Usefulness** (log routes with zero internal links).
*   **Action:** Mark audited pages in a `manifest.json` file to track progress without deleting any files, satisfying the "no-deletion" requirement while identifying technical debt.

## Cohere — command-a-03-2025

Here are five concise, implementation-specific recommendations based on the priorities:

1. **Safe Merge Order**: Begin by merging the shared component, followed by the seven additional pages. Use feature flags to isolate new routes during integration, ensuring existing 222 routes remain unaffected. Validate each merge with targeted tests before proceeding.

2. **Authorization Migration**: Replace hardcoded passwords, backdoors, and email bypasses with server-enforced OAuth roles. Implement a phased rollout: first, disable custom `/login` flows, then integrate managed OAuth, and finally audit all 260 page modules for unauthorized access patterns.

3. **Persistence Boundaries**: Clearly delineate real data persistence in core workflows from simulated controls. Annotate simulated responses in code and documentation. Ensure all 58 migrations align with real data requirements, avoiding accidental simulation data persistence.

4. **Navigation & Page Classification**: Redesign navigation to separate primary workflows from the Secondary Information library. Update route labels and metadata for clarity. Audit all 222 routes to ensure compliance with the refined purple design system, preserving the homepage’s black-and-green theme.

5. **Validation/Testing**: Expand the 90 existing tests to cover new pages, OAuth integration, and persistence boundaries. Conduct render, interaction, duplication, placeholder, and usefulness audits for all routed pages. Use automated tools to flag issues without deleting pages, ensuring full coverage across 260 modules.

## Mistral AI / Le Chat — mistral-small-latest

1. **Safe Merge Order**: Merge the seven new pages and shared component into a feature branch first, validating route conflicts with `tsc --noEmit` and `react-router-config` checks before merging into main to preserve the 222 existing routes.

2. **Authorization Migration**: Replace all hardcoded credentials and `/login` flows with managed OAuth roles by updating Drizzle schema to enforce role-based access, then remove legacy auth code in a single commit referenced in migration #59.

3. **Persistence Boundaries**: Introduce a `PlanningDataService` layer to separate real data workflows from simulated controls, marking non-persisted responses with `@mock` decorators and routing them under `/simulated` for clear separation.

4. **Navigation & Classification**: Add a secondary nav section labeled "Secondary Information" in the layout, grouping non-core pages via a `routeCategory` field in the route manifest while preserving the black-and-green homepage and adopting the purple design system for `/planning/*` routes.

5. **Validation/Testing**: Run automated audits post-merge using Playwright to verify render, interaction, and duplication checks, then extend test coverage to 120 tests by adding role-based interaction tests for the new pages.

## GroqCloud — openai/gpt-oss-20b

**Implementation‑Specific Recommendations (in priority order)**  

1. **Safe Merge Order**  
   • Create a dedicated `import‑stage` feature branch from `main`.  
   • Cherry‑pick the seven new pages plus the shared component into a *small, isolated* sub‑branch (`import‑pages`).  
   • Run the full test suite (`npm test`) and the migration suite (`drizzle-kit up`) locally; ensure no existing route fails.  
   • Merge `import‑pages` into `import‑stage` only after the above passes, then merge `import‑stage` into `main` through a protected pull request.  
   • Use Git hooks to verify that no route files are deleted or renamed during the merge.

2. **Authorization Migration**  
   • Strip the custom `/login` handler and all hardcoded trial/backdoor passwords from both client and server.  
   • Add a server‑side middleware that checks `req.session.oauthRole` for every protected route.  
   • Replace any client‑side role checks with calls to the new `useAuth` hook that reads the session role from the server.  
   • Update route definitions to use the new `protected` wrapper (e.g., `app.route('/plan', protected, …)`).

3. **Persistence Boundaries**  
   • Tag each page module with a `/* @persistent true */` comment if it operates on real user data; otherwise mark `@persistent false`.  
   • Create a lightweight “simulation” context that can be toggled per page via a URL query (`?mock=true`) and use it to render dummy data while keeping the real API untouched.  
   • Ensure all new pages respect this boundary: real‑data pages use Drizzle queries; simulated pages use static fixtures.

4. **Navigation & Page Classification**  
   • Add a top‑level navigation section called “Secondary Information Library” and move all non‑workflow pages into it.  
   • Prefix all library routes with `/library/*` and update the sidebar accordingly.  
   • Keep the core client and planning pages under `/app/*` and mark them with a distinct “Core” badge in the UI.  
   • Maintain the black‑and‑green skyline on the homepage; apply the purple design tokens (spacing, color palette) to all newly merged pages.

5. **Validation & Testing**  
   • For every routed page, add three tests: a **render** snapshot, an **interaction** test (e.g., form submit), and a **duplication** test that ensures a copy of the component renders correctly.  
   • Implement an automated **usefulness audit** script that runs `jest --coverage` and flags pages with < 70 % coverage.  
   • Integrate these tests into the CI pipeline, and block merge until all new pages pass.  
   • Add a manual audit checklist (render, interaction, placeholder, usefulness) that reviewers must tick before approving the merge.
