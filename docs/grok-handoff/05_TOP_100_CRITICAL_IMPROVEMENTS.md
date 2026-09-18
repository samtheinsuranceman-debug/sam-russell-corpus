# The 100 most important things to correct, ranked (handoff for Grok)

Grounded in a full survey of the code on 2026-09-06: 241 routes, 216 portal
pages (199 with `@ts-nocheck`), `server/routers.ts` 9,513 lines with ~120
sub-routers and 436 procedures, `server/db.ts` 4,873 lines and 309 functions,
122 tables with zero secondary indexes, 55 pages using `Math.random`, 85 pages
reachable only by URL, 127 test files of which roughly half assert on source
text rather than math. Each item carries an importance score (100 = do first)
and three sentences on how it makes the site more fluid, more accurate, and
more useful to the client or advisor. Items are grouped by the single idea that
runs through all of them: **one truth, one kernel, one spine** — one client
record, one calculation engine per concept, one event log everything else is
derived from.

## Tier 1 — foundations (do these before anything else)

1. **(100) One client record.** The Financial Assessment (`client_fact_finders`, keyed by user) and the advisor's household fact finder (`household_fact_finders`, keyed by client) are two disconnected truths. Merge them into one assessment keyed by client with an optional owning user, and have `assessmentBridge` write through to `clients`. Every calculator, report, journey and score then reads the same numbers, and a client who fills in the assessment sees their advisor's tools already populated.

2. **(99) No invented numbers on compliance and audit surfaces.** `AuditTimeline`, `ComplianceAuditTrail`, `ComplianceMonitoringDashboard`, `WebsiteUsage` and `ClientHealthDashboard` render `Math.random` events, scores and visitor counts as if real. Wire them to `client_activity_log`, `website_usage` and the score tables, and show honest empty states when there is nothing. A compliance page that fabricates history is the single largest liability in the codebase.

3. **(98) Turn TypeScript back on.** 199 of 215 portal pages start with `@ts-nocheck`, so the compiler cannot see a single money calculation on the client. Remove it in waves, starting with the ten pages that compute dollars, and fix what surfaces. This is the cheapest way to find silent unit and null errors before a client does.

4. **(97) One tax-bracket engine.** `shared/taxBracketEngine.ts` is the intended source, yet hardcoded 2024/2025 bracket edges appear in three other shared engines and about ten pages. Make brackets data with a year and a source, and delete every copy. A bracket change becomes one edit instead of fifteen, and every page agrees on the marginal rate.

5. **(96) One calculation kernel per concept.** Mortgage payoff exists three times, Roth conversion is 906 inline lines in a router plus seven page-side variants, retirement income and IUL/annuity projections each have five or more overlapping implementations. Move each to one tested module in `shared/` and make pages pure views over it. Clients get the same answer on every page, and a fix propagates everywhere at once.

6. **(95) Indexes on every foreign key.** The schema declares zero secondary indexes across 122 tables, and almost every query filters by `workspaceId`, `clientId` or `userId`. Add them in one migration. Page loads that scan whole tables become instant, and the follow-up scheduler and dashboards stop degrading as data grows.

7. **(94) The advisor sees the client's assessment and journey.** The client page shows nothing of the Financial Assessment, its completeness, the Financial Analysis Document or the secret journey. Add that panel (the endpoints exist) and let the advisor ask the librarian *about* a client. The advisor walks into a meeting knowing exactly what the client has already seen and asked.

8. **(93) Switch on GitHub Pages and the custom domain.** DNS at GoDaddy already points at GitHub Pages and the `CNAME` file is committed, but the publish run fails because Pages is not enabled. One settings click (Source: GitHub Actions, custom domain, HTTPS) publishes the homepage on every push. Nothing else in the launch sequence matters until the site is reachable at its own name.

9. **(92) Publish DKIM and verify the sending domain.** The domain has SPF and DMARC at quarantine but no DKIM key, which is why mail is filtered, and Resend has no verified domain. Publish the key, verify the domain, and re-run `pnpm mail:check`. Every automated message, report and follow-up depends on this one DNS record.

10. **(91) Surface or retire the 85 hidden pages.** Thirty-nine percent of portal routes appear in no navigation and can only be typed. Either add them to a searchable Library index or delete them. A page nobody can reach is maintenance cost with no client value, and a client who lands on one by link has no way back.

11. **(90) Collapse the eleven duplicate-page clusters.** Referral ×2, Team ×2, Onboarding ×5, Compare ×4, Policy Review ×2, Compliance ×4, Mortgage Killer ×2, Intake ×2, Client Portal ×2, Client Score ×3. Keep one page per purpose with tabs for the variants. Advisors stop wondering which of four comparison tools is the real one, and every fix lands once.

12. **(89) Extract the Roth conversion engine.** The projection model (IUL loads, cost of insurance, loan rates, HELOC, rental yield) lives inside a Zod handler in `routers.ts` with no module and no unit tests. Lift it into `shared/rothEngine.ts` with golden-file tests, as `mortgageKiller` already does. The flagship strategy becomes reviewable, testable and reusable by the librarian.

13. **(88) Test the math, not the text.** Roughly half of the 127 test files check that strings exist in source files; only a dozen exercise real engines. Replace them with golden-file tests: fixed inputs, expected outputs, per engine. A wrong number fails the build instead of reaching a client.

14. **(87) Fix the eighteen N+1 loops.** `db.ts` issues per-row queries inside loops in eighteen places and uses `Promise.all` once. Batch them with `inArray` joins. Client lists, dashboards and bulk exports go from seconds to milliseconds.

15. **(86) Gate and rate-limit the public calculators.** About 35 `publicProcedure` calculators accept arbitrary input with no auth or rate limit, and `carrierRatings` and `modelPortfolios` expose proprietary data to anyone. Require sign-in for proprietary data and add a per-IP limiter to the rest. The compute surface stops being a free denial-of-service target.

16. **(85) Remove the fabricated public business metrics.** `demo.data` is an unauthenticated endpoint returning invented advisors, named clients with balances and a total AUM of $47.8M. Delete it or gate it behind the owner and label it demo. A public endpoint that publishes fake assets under management is a regulatory problem waiting to be screenshotted.

17. **(84) One assumption registry.** Inflation, returns, rates, life expectancy and fees are hardcoded per page. Put every named assumption in one table with a value, a source and an as-of date, fed by the FRED benchmarks where possible, and make every engine read it. Every projection on the site shares the same assumptions and can show where each one came from.

18. **(83) Assumption provenance on every input.** Extend the "Pre-filled from your Financial Assessment" badge so every number on a calculator says whether it came from the assessment, a live benchmark, an advisor override or a default. Store that provenance with the scenario. The client trusts the output because they can see the lineage of every input.

19. **(82) One scenario object.** Every calculator should emit the same shape: inputs, assumptions, outputs, provenance, client, timestamp. Store it once in `saved_scenarios` and let comparison, PDF, slides, video and the journey all consume it. Four comparison tools collapse into one, and any result anywhere can be compared with any other.

20. **(81) The activity log as the spine.** Every mutation (note, message, scenario, document, status change) writes one event to `client_activity_log`. Dashboards, audit trails, health scores, stale-client digests and notifications derive from events instead of their own tables and random data. One append-only stream makes every "what happened" view consistent and cheap.

## Tier 2 — accuracy and data flow

21. **(80) Persist the thirty local-state calculators.** About thirty pages hold financial inputs in `useState` only and lose everything on reload. Save inputs to the scenario table keyed to the selected client. A client's work survives, and the advisor can open exactly what the client last saw.

22. **(79) Cross-field validation on the assessment.** Add checks that flag but never auto-correct: mortgage balance above home value, take-home above income, emergency months inconsistent with savings and fixed expenses. Show them inline as questions. Accuracy rises before any calculation runs, and the librarian stops reasoning from contradictory facts.

23. **(78) Import from account aggregators.** Era Context and PocketSmith are connected and expose balances, recurring charges and cash flow. Map them into *suggested* assessment values the client confirms field by field. Gathering becomes minutes instead of an evening, with the human still deciding what is true.

24. **(77) Extract tax figures from uploaded returns.** The `taxReturnOcr` router and the Document Vault exist but do not feed the assessment. Extract AGI, tax paid, filing status and W-2 wages with a citation to the page, and propose them for confirmation. The most error-prone fields become the most accurate ones.

25. **(76) Benchmark-fed calculator defaults.** The mortgage rate, inflation and Treasury defaults on every calculator should read `dataFeeds.benchmarks` first and show the as-of date. Fall back to labelled reference values only when the feed is absent. Projections stop drifting from reality between releases.

26. **(75) Unify Monte Carlo.** `shared/monteCarloEngine.ts`, the inline simulation in `MortgageKiller`, and the p10/p50/p90 bands in `RetirementIncomeProjection` are three random engines with three seeds. One engine with a stored seed per scenario makes results reproducible and comparable.

27. **(74) Lead → client in one click.** A qualified lead's fact finder should become a client record and a partially complete assessment. Today the inbox and the client directory do not touch. The advisor's first meeting starts with the numbers the prospect already gave.

28. **(73) Lead scoring from assessment signals.** `factFinderSignals` already weights topics from the facts; run it on lead fact finders and sort the inbox by opportunity and urgency. Follow-up templates can then mention the prospect's strongest signal. The advisor calls the right person first.

29. **(72) Wealth Genome everywhere.** Compute the eight-dimension score from the merged client record and show it on the client list, The Mirror, reports and the advisor dashboard from one function. One score becomes the shared language between client and advisor.

30. **(71) Social Security, Medicare/IRMAA and estate engines into `shared/`.** They live inside pages today with no tests. Move them next to the tax engine and cover them with golden files. The librarian and the reports can then use them, not just the page.

31. **(70) Journey catalog coverage.** Only 45 of 216 pages can be recommended by the librarian. Add every page worth routing to with honest tags and walkthroughs, and retire the rest. The secret journey can reach the whole site instead of a fifth of it.

32. **(69) Journey analytics feed the catalog.** `visitedAt` is stored but unused. Measure which steps get opened and which lead to a saved scenario or a booked meeting, and feed the weights back into `buildJourney`. Journeys get better with every client who walks one.

33. **(68) Shared Zod schemas for every financial input.** Validate once, on both client and server, from the same schema. Out-of-range values are caught at the input, error messages match, and the engines never see garbage.

34. **(67) Deterministic demo data.** Replace every `Math.random` in render with a seeded generator or a fixture, and label demo data as demo. Screenshots become reproducible and nobody mistakes a fixture for a fact.

35. **(66) Carrier and index data with dates.** `iulCarriers`, `carrierRatings`, `annuityData` and `indexCreditingData` carry no as-of date or source. Add both, and show them wherever the data appears. Product comparisons stop presenting stale rates as current.

36. **(65) One money and percent formatter.** Rounding and formatting differ page to page (`formatTaxCurrency` exists but is rarely used). One formatter with one rounding policy. Totals reconcile across pages and PDFs.

37. **(64) Household view unified.** The `household` and `householdView` routers and pages overlap. One household model with members, and the client record as a member. Couples and families are modelled once.

38. **(63) Remove the dead code.** `shared/householdWealth.bak.ts` (667 lines), the `handleAction0..N` noise in `RetirementIncomeProjection`, seven orphan tables, six placeholder pages, thirty empty `onClick` handlers. Less surface means less to misread and faster builds.

39. **(62) Real website analytics.** `websiteUsage.logPageVisit` records visits, but the `WebsiteUsage` page invents its numbers. Read the real table. The owner learns which tools clients actually use.

40. **(61) Real webhook logs.** The `webhooks` router persists endpoints and deliveries while `Webhooks.tsx` shows random ones. Bind the page to the router. Integrations can be debugged.

## Tier 3 — structure and performance

41. **(60) Split `routers.ts` by domain.** 9,513 lines and 120 sub-routers in one file. One file per domain under `server/routers/` with a barrel. Reviews, merges and onboarding a second builder become possible.

42. **(59) Split `db.ts` into repositories.** 309 functions in one file. One repository per table family with the JSON-column normaliser applied uniformly. The N+1 fixes and indexes land where they are readable.

43. **(58) One PDF layout layer.** Eight independent generators and six `exportPdf` procedures. One layout with a report-kind parameter and the scenario object as input. Every PDF shares the brand, the disclaimers and the numbers.

44. **(57) One email composer.** Sixteen `send*` functions each build their own HTML. One composer with a header, body blocks, compliance footer and the deliverability headers from `sendMail`. Every message is consistent and inbox-safe.

45. **(56) One scheduler.** The managed heartbeat, the follow-up interval and the report schedules are three mechanisms. One `jobs` table, one runner, one external-cron endpoint. Anything time-based (reminders, digests, report posting, data refresh) is one line to add.

46. **(55) One communication log.** `outbound_messages`, `communicationLog` and `emailCampaigns` overlap. One log, one inbox view per client. The advisor sees every touch in one place.

47. **(54) One notification centre.** `smartAlerts`, `complianceAlerts`, `rebalance` alerts and `notifications` are four inboxes. One centre with severity, source and a link to the action. Nothing important is missed because it was in the wrong list.

48. **(53) Lazy AppShell navigation.** The shell is eager on every route with a 132-item hardcoded nav and a large icon surface. Generate the nav from a config file, lazy-load icons, and memoise. First paint gets faster on every page.

49. **(52) Chart wrapper and vendor chunk.** `recharts` is imported at the top of 27 lazily loaded pages. One `<Chart>` wrapper and a shared vendor chunk. Pages load once the library is cached instead of re-downloading it.

50. **(51) Client-side tests for the money pages.** There are none. Testing Library tests for the ten pages that compute dollars, driven by the same golden inputs as the engine tests. Rendering bugs stop reaching clients.

51. **(50) Continuous integration.** Only the Pages workflow exists. Run `pnpm check`, the suite and the bundle guard on every pull request. Nothing broken merges.

52. **(49) Environment validation at boot.** Validate `process.env` with Zod and expose `/api/health` listing what is configured (database, mail, SMS, FRED, each AI). A misconfigured host says so at startup instead of failing quietly at the first lead.

53. **(48) Owner "what is switched on" panel.** Show the health endpoint in the owner dashboard with a fix link per item. The owner sees in one glance why texts or emails are not going out.

54. **(47) Error boundaries and client error reporting.** Every lazy route gets a boundary and client errors post to the server. Blank screens turn into a message and a log entry.

55. **(46) Structured logs without PII.** The email PIN was logged in plain text and console output is free-form. Use one logger with redaction. Logs become useful and safe to share.

56. **(45) Cryptographic PIN generation.** The six-digit verification PIN uses `Math.random`. Use `crypto.randomInt`. An authentication factor stops being guessable.

57. **(44) Workspace access helper.** `getWorkspaceForUser` (private to `routers.ts`) and `getWorkspaceByOwnerId` are used inconsistently. One exported helper, used by every procedure that touches client data. Authorization is the same everywhere.

58. **(43) Database backup and restore.** `db:build` creates tables but nothing dumps them. A nightly dump script and a restore rehearsal. The archive of every client conversation cannot be lost.

59. **(42) Bundle budget on the client.** The server bundle has a guard; the client does not. Fail the build when a route chunk exceeds a size. Performance does not regress silently.

60. **(41) Mobile layouts for the top ten pages.** Clients open links from their phones. Responsive passes on the assessment, journey, advisor, mirror, genome and the five most-used calculators. The secret journey works in a waiting room.

## Tier 4 — experience and flow

61. **(40) Command palette as primary navigation.** Ctrl-K already exists; index every page, client, scenario and template. Typing beats three levels of menus. The site feels like one tool instead of 216.

62. **(39) The journey as the client's home.** `/portal/my-journey` should be what a client lands on after sign-in, with the assessment gate first. The client is always on a path, never lost in a directory.

63. **(38) Post reports to the portal.** Save each generated report to `client_documents` and message the client with the "report ready" template in one action. Reporting becomes a button, not a workflow.

64. **(37) Client and advisor copy modes.** Every page shows advisor jargon to clients. A copy layer with two registers, chosen by role. Clients read plain language; advisors keep the detail.

65. **(36) One disclaimer component.** `DisclaimerContext` and `disclaimerManager` exist alongside hand-written footers. One component, sourced from the manager, on every page and PDF. Compliance text is edited once.

66. **(35) One deck model.** Presentation builder, AI slides and the seminar generator each hold their own slide shape. One deck model fed by the scenario object. Any result becomes a presentation in one click.

67. **(34) Booking link in every follow-up.** Calendly is connected. A `BOOKING_URL` in the follow-ups and templates instead of "reply with a time". Leads book themselves.

68. **(33) Meeting notes import.** Otter, Zoom and Wispr Flow are connected. Import transcripts into client notes with a summary. The activity log fills itself after every meeting.

69. **(32) Streaming voice with cached guides.** Journey guides and advisor answers are synthesised on every play. Cache audio per guide and stream long answers. The tape recorder responds instantly.

70. **(31) Print and PDF of the secret journey.** The journey page has no export. One PDF from the scenario and journey objects. The client can carry the plan into a meeting.

71. **(30) Glossary from one definitions file.** Terms are explained ad hoc. One file, tooltips everywhere. Every page teaches the same definition.

72. **(29) Emergent question with citations.** The AI polish rewords the emergent question without saying which facts it drew on. Return the assessment fields used. The client sees why the librarian asked what they did not.

73. **(28) Knowledge base for the librarian.** The repository root holds a semantic index of the NLP and AQAL references. Feed retrieved passages into the advisor's context. Answers gain depth without inventing anything.

74. **(27) Video proposals from scenarios.** HeyGen proposals take hand-typed inputs. Generate them from the scenario object. Every saved plan can become a personalised video.

75. **(26) Lead consent versioning for clients too.** Leads store consent version; clients do not. Record consent for messaging on the client record and honour it in `deliver()`. Texting a client is defensible.

76. **(25) Data export and deletion.** No way to hand a client their data or delete it on request. One export (assessment, scenarios, messages, documents) and one deletion procedure. Privacy requests take minutes.

77. **(24) Feature flags for unfinished pages.** Six placeholder pages ship live. A flags table hides them until they are real. Clients never meet "coming soon".

78. **(23) Notifications to the advisor's phone.** Lead alerts text the owner; nothing else does. Route high-severity notification-centre items through SMS. The advisor learns of a client action while it still matters.

79. **(22) Rebalance and drift from real holdings.** Drift monitors compute against allocation targets with no holdings source. Connect the aggregator import. Alerts reflect the actual portfolio.

80. **(21) Referral attribution from recorded clicks.** `referralLinks.recordClick` stores clicks that the referral pages ignore. Bind them. Referral rewards are computed from evidence.

## Tier 5 — hygiene and polish

81. **(20) Team and roles enforced server-side.** `accessControl.ts` defines roles; procedures rarely check them. Apply the helper per procedure. Permissions on the page match permissions on the data.

82. **(19) Stripe webhook idempotency and tests.** Billing has no idempotency keys or replay tests. Add both. Double charges and missed upgrades become impossible.

83. **(18) HubSpot sync or removal.** `hubspotContactId` exists without a sync. Either two-way sync through the CRM router or remove the field. No half-built integration confuses the next builder.

84. **(17) Email campaigns through the deliverability layer.** The campaigns router sends outside `sendMail`, without unsubscribe or suppression. Route it through. Campaigns cannot damage the domain's reputation.

85. **(16) Crypto cycle engine labelled speculative.** It projects cycles as if predictive. Label, gate behind advisor, and exclude from client journeys. Education stays honest.

86. **(15) Gamification tied to the journey.** Quest tracker and badges track nothing meaningful. Award them for assessment completion and journey steps. Motivation points at the plan.

87. **(14) Sound and entrainment off by default.** Audio engines can autoplay. Opt-in only, never on first load. Clients are not startled in an office.

88. **(13) One theme token set.** Public emerald and portal purple are both fine, but tokens are duplicated. One token file with two themes. Restyling is one edit.

89. **(12) Component catalogue.** 77 components with no gallery. A lightweight catalogue page. Builders reuse instead of recreating.

90. **(11) Strings in one place.** Copy is scattered through JSX. Centralise the client-facing strings. Copy edits and the client/advisor register (item 64) become trivial.

91. **(10) Session hardening.** Add CSRF protection to the owner login form and confirm cookie flags in production. Sign-in stays safe behind a reverse proxy.

92. **(9) Deterministic seed script.** Demo workspaces are seeded with random values. One fixture with named clients and known totals. Every screenshot and test starts from the same world.

93. **(8) Product manual.** `LAUNCH.md` covers hosting; nothing covers using the site. One manual per role. Advisors onboard themselves.

94. **(7) Rename mislabelled pages.** `WebsiteUsage` is titled "System Compliance Portal"; several files and titles disagree. Titles that match purpose. Search and navigation stop lying.

95. **(6) Bump deprecated actions.** The Pages workflow uses actions on the deprecated Node 20 runtime. Update to current majors. The publish pipeline keeps working after the cutoff.

96. **(5) Lint and format enforced.** Prettier exists; nothing runs it. Enforce in CI. Diffs show intent, not whitespace.

97. **(4) Accessibility pass.** Money inputs and the tape recorder lack labels and keyboard paths in places. Label and test with a screen reader. The site is usable by every client.

98. **(3) Uptime monitor.** Nothing watches production. A ping on `/api/health` every minute with an alert to the owner's phone. Downtime is known before a client mentions it.

99. **(2) Retire the sibling prototype leftovers.** `russell-capital/` keeps `.BACKUP` and `.orig` variants of `App.tsx`. Delete them. One working file per project.

100. **(1) Internationalisation readiness.** Not needed now, but once strings live in one place (item 90) a locale file is trivial. Prepare the hook, ship English. A Spanish-speaking household is one file away.

## How to read this as a plan

Items 1–20 are the foundation and are mostly server and data work; they make
every later item smaller. Items 21–40 make the numbers trustworthy. Items 41–60
make the codebase maintainable and fast. Items 61–80 make the client's path
fluid. Items 81–100 are hygiene. The single most valuable sequence is
1 → 5 → 17 → 19 → 20: one client record, one engine per concept, one assumption
registry, one scenario object, one event spine. Once those exist, almost every
page becomes a view over the same three things, and the site stops being 216
tools and becomes one instrument.
