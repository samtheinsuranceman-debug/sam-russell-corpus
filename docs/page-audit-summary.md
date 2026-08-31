# Unified Russell Capital Page Audit Summary

**Author:** Manus AI  
**Method:** Source-level audit of every explicit routed page in the managed unified application. Scores evaluate likely usefulness and implementation evidence; they are not a substitute for the authenticated browser smoke tests scheduled in the final validation phase.

> **Coverage:** 231 of 231 routes received an individual score and recommendation. No page was deleted.

| Measure | Result |
|---|---:|
| Average usefulness score | 5.99 / 10 |
| Pages scoring 5 or higher | 153 |
| Pages scoring below 5 | 78 |
| Source-level healthy pages | 225 |
| Source-level at-risk pages | 6 |
| Source-level broken pages | 0 |

## Disposition Recommendations

| Classification | Pages |
|---|---:|
| Keep | 83 |
| Improve | 68 |
| Move To Secondary Information | 68 |
| Retire | 7 |
| Merge | 5 |

## Implementation Evidence

| Classification | Pages |
|---|---:|
| Mixed Connected | 83 |
| Client Only | 49 |
| Database Backed | 40 |
| Prototype | 38 |
| Static Reference | 17 |
| Internet Backed | 4 |

## Category Averages

| Category | Average Score |
|---|---:|
| Administration | 6.00 |
| Ai Workflow | 6.36 |
| Analysis Calculator | 5.86 |
| Client Journey | 3.75 |
| Client Workflow | 6.38 |
| Portal Other | 5.93 |
| Public Home | 8.00 |
| Public Or Auth | 7.24 |
| Reference Education | 5.75 |
| Reports Documents | 5.44 |

## Highest-Value Pages

| Route | Score | Recommendation | Evidence |
|---|---:|---|---|
| `/administrator` | 10 | Keep | The AdministratorPortal component is a fully functional, database-backed admin dashboard with real authentication and data fetching. It provides essential site management features without relying on simulated data for its core data. |
| `/portal/dashboard` | 10 | Keep | The dashboard is highly functional and clearly database-backed, executing 10 trpc queries to fetch real metrics, planning cases, analytics, net worth, activity, top clients, allocations, goals, meetings, and coaching prompts. It uses sophisticated data formatting, filtering, and charts (Recharts) to present a comprehensive view of the practice. There are no simulated timers, random values, or placeholder terms, and it explicitly states it only shows real saved records. |
| `/portal/household-wealth` | 10 | Keep | The Household Wealth page is a complex, database-backed simulation tool utilizing tRPC for saving and loading state (`saveFactFinder`, `getFactFinder`). It models intricate real estate and financial scenarios, making it an essential, high-value workflow for users. |
| `/portal/pipeline` | 10 | Keep | The page features a fully functional pipeline with Kanban, Table, and Forecast views, drag-and-drop interactions, and deal management. It is directly backed by a robust set of tRPC endpoints for querying clients and managing pipeline deals, indicating real persistence and strong user states. |
| `/portal/planning-cases` | 10 | Keep | The page provides a complete planning workflow with real trpc queries and mutations (create, update, addNote, list, get). It features comprehensive user states including loading, error, empty states, and dynamic status updates. The metrics show 4 queries, 3 mutations, and 15 loading states, confirming a fully database-backed and robust implementation. |
| `/executive` | 9 | Keep | The page provides a clear authentication workflow for executives, calling a dedicated backend API (`/api/executive/login`) and managing session state via localStorage. It is a critical functional entry point with no obvious duplication or simulated behavior. |
| `/portal/agency-tutorial` | 9 | Keep | The page is an extensive agency tutorial with real tRPC endpoints (`trpc.tutorial.getProgress`, `trpc.tutorial.saveProgress`, `trpc.tutorial.completeSection`) and significant workflow logic for onboarding agency leaders. It has no duplicate routes and demonstrates strong, differentiated workflow. |
| `/portal/ai-slides` | 9 | Keep | The source code shows active integration with TRPC for fetching clients, remaining slide quota, and generating/saving PPTX files. The implementation is robust with proper error handling and state management, lacking any placeholder or simulation code. |
| `/portal/athene-pe-plus15` | 9 | Keep | The page is a highly complex illustration tool with 1348 lines of code, 33 charts, and 38 buttons. It uses tRPC queries, useAuth, and useClientData to fetch real data, though it also contains hardcoded strategy projection data. The lack of simulated timers and random values indicates genuine functionality. |
| `/portal/bulk-generation` | 9 | Keep | The page demonstrates robust backend connectivity via tRPC for scheduling, client data fetching, bulk operations, and exporting (PDF/CSV). It manages complex state effectively and uses realistic components, making it a highly useful tool. |
| `/portal/client-onboarding` | 9 | Keep | The page provides a comprehensive 8-step wizard for client onboarding, featuring deep interactive states, AI recommendations via tRPC mutations, and final data persistence to the database. It handles complex form state and effectively drives the primary onboarding workflow without relying on placeholder behavior. |
| `/portal/clients` | 9 | Keep | The page implements a comprehensive client management dashboard with robust features including adding clients, bulk CSV imports, tag management, and risk scoring analytics. It relies on multiple tRPC queries and mutations for real persistence and strong user states, demonstrating essential differentiated workflow without significant simulation or duplication. |
| `/portal/clients/:id` | 9 | Keep | The page is highly complex (1524 lines) and clearly database-backed, featuring 16 tRPC queries and 17 mutations for real persistence (e.g., properties, crypto holdings, risk assessment). It has comprehensive user states including 27 loading states, 30 error states, and 23 empty states, making it an essential workflow. |
| `/portal/email-campaigns` | 9 | Keep | The page has comprehensive tRPC integrations for querying campaigns, templates, and clients, as well as multiple mutations for creating, updating, and managing campaigns. It manages its own state and renders complex charts based on backend data, proving it is a database-backed, high-value page. |
| `/portal/estate-tax` | 9 | Keep | The page utilizes a tRPC query (`trpc.estateTax.calculateComprehensive.useQuery`) to calculate estate taxes, indicating backend connectivity for complex logic rather than just client-side estimation. It also integrates real user state through `useClientData()`, pulling live financial metrics to populate defaults, making it a highly useful workflow. No other routes share this component. |
| `/portal/existing-annuities` | 9 | Keep | The page implements a complex, differentiated workflow for existing annuities analysis with multiple user inputs and state management. It connects to the backend via a tRPC query (analyzeExisting) to perform institutional-grade analysis, demonstrating reliable server behavior. |
| `/portal/income-annuity-top10` | 9 | Keep | The page provides a comprehensive, interactive tool for comparing income annuities, utilizing external data (`@shared/annuityData`) and real TRPC endpoints (`clients.get`, `notes.list`, `activity.list`, `strategy.get`, `scenario.list`). It features robust charting, filtering, and data projection capabilities, indicating a high-value, functional application rather than a mere prototype. |
| `/portal/inflation` | 9 | Keep | The page is a fully featured, interactive inflation analysis tool with extensive charts and data tables. It is heavily connected to the backend, utilizing 5 tRPC queries and 2 mutations to fetch market data, user scenarios, and save new scenarios, demonstrating real persistence and high value. |
| `/portal/knowledge` | 9 | Keep | The source code uses tRPC for real backend mutations (create, upload) and queries (list), proving it is fully database-backed and not a prototype. It features complex UI interactions including file uploads, forms, and charts, making it a high-value essential workflow. |
| `/portal/meeting-agenda` | 9 | Keep | The page is a highly functional Meeting Agenda tool with 11 distinct tRPC calls, including queries for clients, meetings, team members, and templates, as well as mutations for generating, exporting, and emailing agendas. The 1396-line component includes analytics, history, setup, and template tabs, indicating a well-developed, database-backed feature set. |
| `/portal/meetings` | 9 | Keep | The Meetings component is a comprehensive, database-backed page with 679 lines of code. It heavily utilizes tRPC for data fetching (3 queries) and mutations (4 mutations), with strong state management and analytics (13 charts). There are no simulated timers or random values, indicating real server behavior. |
| `/portal/mortgage-killer` | 9 | Keep | The page has a substantial amount of code (3161 lines) and uses tRPC for both queries (e.g., fetching clients and scenarios) and mutations (e.g., saving scenarios, uploading statements, and analyzing). This indicates it is a robust, database-backed implementation. |
| `/portal/onboarding` | 9 | Keep | The page implements a comprehensive 7-step client onboarding wizard that is database-backed, connecting to tRPC mutations (clients.create, onboardingWizardV2.getRecommendation) and queries (lifeGoals.getSuggestions). It has real persistence and robust user state management. The route shares its source component with '/onboarding' and '/portal/welcome', which serve as legitimate aliases for the same workflow. |
| `/portal/premium-financing` | 9 | Keep | The page is a robust, interactive financial projection tool with comprehensive data visualization and integrations. It relies on multiple TRPC queries and mutations, features dynamic calculation models like Monte Carlo simulations, and has no significant duplicate routes. |
| `/portal/retirement-guardrails` | 9 | Keep | The page provides a comprehensive retirement guardrails simulation that is fully database-backed, leveraging real client data, market data, risk profiles, and tax rates via tRPC. It includes complex charting and data visualization without significant duplication or mock data reliance. |

## Pages Scoring Below Five

| Route | Score | Recommendation | Merge Target | Required Action |
|---|---:|---|---|---|
| `/portal/ai-meeting-notes` | 2 | Retire | `` | Retire the page after owner approval as it contains no real functionality. The page consists of hardcoded chart data, hundreds of filler lines, and placeholder buttons that only log to the console. |
| `/portal/avatar-twins` | 2 | Move to Secondary Information | `` | Move this novelty avatar generator feature to Secondary Information since it provides no core financial utility and uses hardcoded toasts instead of actual API integration. Ensure it does not distract from main application workflows. |
| `/portal/advisor-directory` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information since it is heavily presentation-focused and relies entirely on hardcoded state and mock data. Remove unused tRPC hooks to clean up the component. |
| `/portal/arena` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information as it is primarily a presentation-heavy prototype with simulated gamification mechanics. Require owner approval before deciding whether to retire it or invest in fully backing the gamification engine with real data. |
| `/portal/batch-illustration` | 3 | Move to Secondary Information | `` | Move this heavy prototype to Secondary Information since it lacks real backend integration. If batch illustration is a core feature, implement real tRPC mutations and connect the UI to actual server data instead of simulated processing. |
| `/portal/batch-slides` | 3 | Move to Secondary Information | `` | Remove the massive blocks of dummy variables and hardcoded static data. Implement real backend integrations for the statistics and presentation generation before considering this for production. |
| `/portal/black-mirror` | 3 | Move to Secondary Information | `` | Move this gamified presentation layer to Secondary Information or a sandbox environment. If real integration is desired, connect the phantom clients and dream journal to actual CRM data and AI pipelines. |
| `/portal/collaborative-planning` | 3 | Move to Secondary Information | `/portal/dashboard` | Merge the collaborative planning workflow into the main client dashboard or retire if it's just a mockup. The page currently relies on hardcoded data arrays and local state mutations, making it non-functional for real multi-advisor collaboration. |
| `/portal/command-center` | 3 | Retire | `` | Retire the page as it relies heavily on mock data and simulated timers for its numerous charts, providing no real operational value. If the layout is needed for future development, move it to secondary information. |
| `/portal/commission-tracker` | 3 | Move to Secondary Information | `` | Move to Secondary Information as this is a static marketing or presentation page. Remove unused tRPC hooks and consider if this content belongs in a CMS or presentation deck instead of a functional route. |
| `/portal/data-query` | 3 | Move to Secondary Information | `` | The page's natural language querying is entirely simulated with regex rules on client-side data, and heavily relies on hardcoded patterns and random confidence scores. It should be moved to Secondary Information until a real backend NLP service is implemented. |
| `/portal/document-templates` | 3 | Keep | `` | Connect the disabled tRPC queries to the backend to fetch real templates. Replace the hardcoded TEMPLATES array and local state modifications with actual database mutations for saving, starring, and AI generation. |
| `/portal/education` | 3 | Move to Secondary Information | `` | Remove unused tRPC queries and redundant state variables. Consolidate the duplicate charts into a single visualization or remove them if unnecessary, and consider migrating the hardcoded content to a database or moving the page to a static resource section. |
| `/portal/estate-document-gen` | 3 | Move to Secondary Information | `` | Since the page merely generates static text drafts with hardcoded placeholders on the client side, it should be moved to Secondary Information to avoid misleading users into thinking it performs actual server-side legal document generation. Remove the PRO badge and explicitly label it as a static template viewer. |
| `/portal/lead-generator` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information since it relies on simulated data generation with Math.random() and setTimeout. Remove or document the disabled tRPC queries to prevent confusion. |
| `/portal/medicare-irmaa` | 3 | Move to Secondary Information | `` | Remove the dummy padding lines and hardcoded API status tables. Merge the core calculator functionality into a more robust financial planning tool, or move it to Secondary Information if it remains a standalone prototype. |
| `/portal/monitoring-agreement` | 3 | Retire | `` | Retire the page and move its agreement signing functionality to a modal or a settings section within the user profile. The extensive chart rendering and simulated data should be removed as they are unnecessary for a legal agreement page. |
| `/portal/my-world` | 3 | Retire | `` | Retire the page since it is an unused, static prototype that offers no real value. The backend hooks are present but completely ignored in the rendering logic. |
| `/portal/nerve-center` | 3 | Retire | `` | Retire this prototype after owner approval, as it serves as a presentation-heavy mockup rather than a functional workflow. Any genuine gamification logic should be extracted into core reusable components. |
| `/portal/patent-showcase` | 3 | Move to Secondary Information | `` | Move this page out of the core portal navigation into a secondary marketing or legal section. The content is static and serves as an educational reference rather than a functional tool. |
| `/portal/predictive-analytics` | 3 | Move to Secondary Information | `` | Connect the tRPC queries to actually populate the client profile and scenario data instead of using hardcoded defaults. Remove unused tRPC queries or implement their corresponding UI sections. |
| `/portal/referral-tracking` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information as it relies purely on mock data and simulated actions. A complete backend implementation with real database mutations is required before it can be useful. |
| `/portal/rewards` | 3 | Retire | `` | Retire the page after owner approval, as it is mostly a static prototype. If kept, it requires a full backend implementation for shop items, collections, and prestige tracking. |
| `/portal/secret-secrets/:id` | 3 | Retire | `` | Retire the page after owner approval, as it relies on hardcoded JSON data and provides no real user persistence or backend connectivity. If the calculators are deemed valuable, extract them into a shared utility or a secondary reference section. |
| `/portal/seminar-generator` | 3 | Move to Secondary Information | `` | This page is a heavily mocked, static prototype disguised as a functional tool. It should be moved to Secondary Information until actual backend persistence and data flow are implemented. |
| `/portal/social` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information or a prototype archive. Replace hardcoded social features with real backend implementations or retire the page if actual social networking is not a planned product capability. |
| `/portal/story-generator` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information since it is a prototype that simulates AI generation with hardcoded strings and a timer. It can be revisited if actual AI integration is planned. |
| `/portal/the-arrival` | 3 | Move to Secondary Information | `` | Move to Secondary Information or retire after owner approval since it is a pure frontend prototype with hardcoded steps and no real backend persistence yet. Alternatively, implement the planned tRPC mutations for `tutorial_progress` and `advisor_goals` to make it database-backed. |
| `/portal/the-legacy` | 3 | Move to Secondary Information | `` | Move to secondary information or retire after owner approval. The page currently has no backend functionality and only serves as a visual prototype. |
| `/portal/the-map` | 3 | Move to Secondary Information | `` | Move this calculator to Secondary Information until actual persistence and dynamic base values are implemented. Alternatively, integrate it as a widget within the main dashboard. |
| `/portal/workflow-automations` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information since it is a pure client-side simulation. Remove the unused tRPC hooks and consider migrating the static logic to a real backend if this feature is prioritized. |
| `/portal/advisor-training` | 4 | Move to Secondary Information | `` | Move this training module prototype to Secondary Information since it is mostly a static, hardcoded demonstration. Alternatively, connect the quiz progress, scores, and certification status to a real backend database to make it a fully functional training portal. |
| `/portal/advisory-summary` | 4 | Move to Secondary Information | `` | Remove unused tRPC queries and move the page to a secondary information section or documentation portal. Ensure the static data is maintained if it serves as a reference. |
| `/portal/audit-timeline` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is heavily reliant on simulated data and incomplete UI. Remove it from primary navigation. |
| `/portal/axonic-sp500` | 4 | Move to Secondary Information | `` | Move this static calculator to Secondary Information or a prototype directory until it can be connected to real, dynamic annuity data. Remove the unused tRPC hooks and dummy row generators. |
| `/portal/beneficiary-optimization` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information or retire it. If retained, replace the hardcoded `generateAccounts` and client-side simulations with actual backend data and persistence. |
| `/portal/business-owner` | 4 | Move to Secondary Information | `` | Move this page to a secondary tools menu or sandbox area. Remove unused TRPC query declarations and replace hardcoded arrays with real data fetches if it is to be fully integrated. |
| `/portal/client-intake` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is a static prototype with simulated interactions. Before retiring or refactoring, owner approval is required to confirm if the complex UI layout should be preserved for a future real implementation. |
| `/portal/client-intake-recommender` | 4 | Merge | `/portal/combo-recommender` | Merge the two duplicate routes into a single recommender page. Ensure the unified page clarifies the scope of the static data used for recommendations. |
| `/portal/client-onboarding-auto` | 4 | Merge | `/portal/client-onboarding` | Convert hardcoded mock data (PIPELINE_DATA, COMPLIANCE_ALERTS, etc.) and simulated actions (handleRefresh, handleSubmit) to use actual tRPC mutations and backend queries. Since this appears to be a prototype dashboard, merge it into the main client onboarding flow or retire it if it's purely a conceptual mockup. |
| `/portal/client-portal-config` | 4 | Move to Secondary Information | `` | Move the static presentation code to Secondary Information for reference. Replace this route with a fully connected version using the actual tRPC queries and mutations. |
| `/portal/combo-recommender` | 4 | Move to Secondary Information | `` | Move this client-side prototype to Secondary Information since it relies entirely on static JSON files and local state. Consider integrating it with the backend database to provide real recommendations. |
| `/portal/competitive` | 4 | Merge | `/portal/calculators` | Merge the competitive analysis visualizations and calculators into the primary calculator tools page to consolidate redundant tools. Extract the hardcoded carrier data to the backend. |
| `/portal/compliance-audit-trail` | 4 | Improve | `` | Remove client-side mock data generation and fully integrate the table with real backend data via tRPC. Enhance the error handling and loading states to reflect actual API responses. |
| `/portal/compliance-monitoring` | 4 | Improve | `` | Replace the `generateComplianceItems` mock array with a TRPC query that fetches real compliance items from the database. Implement the corresponding TRPC mutations for the actions currently triggering dummy toasts (e.g., marking items resolved, updating settings, creating policies). |
| `/portal/daily-discovery` | 4 | Move to Secondary Information | `/portal/dashboard` | This page should be moved to Secondary Information or merged into a gamification/dashboard hub because its core "discovery" features are simulated via hardcoded arrays, despite having some live database connections for profile check-ins and client aggregates. The hardcoded insights and gamified streaks reduce its utility as a standalone core workflow. |
| `/portal/ecological-drivers` | 4 | Move to Secondary Information | `` | Remove the unused tRPC hooks and move this static presentation page to a secondary information or reference section. Alternatively, bind the real data from the hooks to make it a functional dashboard. |
| `/portal/enterprise` | 4 | Improve | `` | Replace the simulated data in the System Health and Feature Flags tabs with actual backend endpoints. If these features are not yet supported by the backend, remove them to prevent misleading users. |
| `/portal/fia-top10` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is primarily a presentation-heavy calculator with simulated interactions. The core calculations and scenarios should be integrated into a unified financial planning view rather than existing as a standalone interactive prototype. |
| `/portal/index-backtester` | 4 | Improve | `` | Connect the charts and tables to real backend data via tRPC. Remove hardcoded mock data. |
| `/portal/index-strategies` | 4 | Move to Secondary Information | `` | Move the component and its complex hardcoded calculators out of the primary application routes into a secondary documentation or reference section. Remove the unused tRPC hooks and empty mutations before moving. |
| `/portal/integrations` | 4 | Improve | `` | Remove simulated random data and hardcoded states, and replace with actual backend integration. Connect the configuration forms to actual mutation endpoints. |
| `/portal/legal-payment-folder` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information until real backend mutations and actual metric data replace the dummy widgets and simulated charts. |
| `/portal/mortgage-killer-v3` | 4 | Merge | `/portal/tools` | Merge this client-only calculator into the main portal dashboard or tools section to consolidate financial simulators. Ensure any shared components are properly abstracted. |
| `/portal/multi-gen-wealth` | 4 | Move to Secondary Information | `` | Move the page to Secondary Information pending owner review. Replace the simulated Monte Carlo timer and hardcoded data generators with actual backend calculation endpoints before promoting it to a primary workflow. |
| `/portal/physicians-edge` | 4 | Move to Secondary Information | `` | Since this page is a static presentation with hardcoded data and no real calculations, it should be moved to Secondary Information or merged into a marketing page. It does not perform the 248-calculator functions it advertises. |
| `/portal/policy-review-checklist` | 4 | Move to Secondary Information | `` | Move to Secondary Information or merge into a real policy review workflow. The page has extensive hardcoded data and client-side only state, with unused tRPC queries. |
| `/portal/portfolio-drift` | 4 | Move to Secondary Information | `` | Connect the component to actual backend endpoints to fetch real portfolio and market data. Remove the simulated random drift generation and rely on actual live metrics before moving it back to primary navigation. |
| `/portal/presentation-builder` | 4 | Move to Secondary Information | `` | This is a heavy client-side UI with complex local state (slides array, drag/drop sorting, auto-populate logic) but no actual backend persistence for the presentations created. The data tab claims integration but only has placeholder edit buttons. Move to secondary information or retire if a real presentation builder isn't planned, as this is essentially a static prototype. |
| `/portal/revenue-guarantee` | 4 | Move to Secondary Information | `` | Move this marketing-heavy page to a secondary information section or landing page. It is largely a static promotional calculator and lacks deep backend persistence despite having a hook. |
| `/portal/sales-story` | 4 | Move to Secondary Information | `` | Complete the remaining presentation templates and implement the simulation logic. Add proper loading and error states for the tRPC queries to ensure reliable rendering. |
| `/portal/scenario-play` | 4 | Move to Secondary Information | `` | Move to Secondary Information or retire after owner approval since it relies entirely on hardcoded scenarios and math without server persistence or meaningful state management. If keeping, consider integrating with backend scenario storage. |
| `/portal/secret-secrets` | 4 | Move to Secondary Information | `` | The page renders purely static JSON content from @/data/strategies.json without backend integration or interactivity beyond local filtering. It should be moved to Secondary Information or merged into a knowledge base since it serves as an educational reference. |
| `/portal/slack` | 4 | Move to Secondary Information | `` | Move to Secondary Information as it is a presentation-heavy prototype with extensive hardcoded mock data. Consider merging useful real integration parts if they exist, but the current page is mostly simulated. |
| `/portal/stale-digest` | 4 | Move to Secondary Information | `` | Remove client-side data simulation and wire the table and charts directly to real backend data. If the backend cannot support these metrics, the page should be moved to Secondary Information until real data is available. |
| `/portal/str-strategy` | 4 | Move to Secondary Information | `` | Move the component to a secondary tools section if the business wants to keep it as an educational calculator. If persistence is needed, wire the inputs and generated projections to the database. |
| `/portal/strategy-compare` | 4 | Move to Secondary Information | `` | Move this static client-side comparison tool to Secondary Information since it lacks backend integration and relies entirely on local JSON files. Wait for owner approval before retiring or moving. |
| `/portal/succession-planning` | 4 | Move to Secondary Information | `` | Move the succession planning wizard to Secondary Information pending a complete backend integration of the valuation logic. Fix the render risks by ensuring string replacements are only called on valid non-empty strings, and clean up the dead code. |
| `/portal/tax-combos/:id` | 4 | Move to Secondary Information | `` | The page is a highly static, data-driven prototype with simulated calculators and hardcoded data references. Move it to Secondary Information or convert it into a fully connected, database-backed workflow. |
| `/portal/tax-loss-harvesting` | 4 | Move to Secondary Information | `` | The page relies entirely on hardcoded sample holdings and a mocked execution function. The tRPC queries are mostly disabled and unused. It should be moved to secondary information or retired until backend integration and actual execution logic are implemented. |
| `/portal/the-field` | 4 | Move to Secondary Information | `` | Move to Secondary Information as it is an unintegrated prototype. Ensure owner approval before moving. |
| `/portal/the-mirror` | 4 | Improve | `` | Replace the hardcoded seed data (DOMAINS, GOALS, MEMORY) with actual tRPC reads and mutations to make the dashboard functional. Connect the somatic check-in state to persistent storage. |
| `/portal/the-strategy-table` | 4 | Move to Secondary Information | `` | Move to secondary information or prototype gallery unless backend calculation and saving logic is wired up. The 'calculation_audit_logs' saving is purely client-side state ('setSaved(true)') without real persistence. |
| `/portal/time-lapse` | 4 | Move to Secondary Information | `/portal/planning` | This page should be moved to Secondary Information or merged with a broader planning module. The data visualization is mostly client-side simulation, though it connects to the client list via tRPC. |
| `/portal/toilet` | 4 | Move to Secondary Information | `/portal/dashboard` | Move this novelty dashboard to a secondary Easter egg section or retire it entirely if not actively used. If kept, consider merging its scannable mobile-friendly view into the main dashboard's responsive layout. |
| `/portal/video-library` | 4 | Move to Secondary Information | `` | Move this static video library to a secondary information section like a resources hub. It contains hardcoded video data and static content without backend integration. |
| `/portal/war-story-generator` | 4 | Move to Secondary Information | `` | Move this prototype page to Secondary Information until the 'Hall of Fame' and statistics features are connected to a real database. The AI generation endpoint is functional but the surrounding application shell is mostly simulated data. |
| `/support` | 4 | Move to Secondary Information | `` | Move this static content to a secondary information section such as a help center modal or footer link. |

## Interpretation and Limits

The audit intentionally keeps all routes. A **Retire** recommendation means the page should remain until the owner approves removal after reviewing usage and authenticated runtime evidence. A **Move to Secondary Information** recommendation means the route remains active but should not compete with primary advisor workflows. A **Merge** recommendation identifies an overlapping destination that can absorb the unique useful material after content and data contracts are reconciled.

Scores rely on route source, interaction hooks, state handling, duplicate-source evidence, and detected integration patterns. Final validation added TypeScript, a zero-failure deterministic test suite, a successful production build, 231 production route requests, desktop and mobile public-page checks, managed-auth route checks, module loading, and runtime-log review. Post-disclosure authenticated page-content verification remains an owner-session acceptance test and is documented in the implementation audit.
