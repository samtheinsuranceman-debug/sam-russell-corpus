# RCS Live Build — Structural Audit

**Target:** the build serving russellcapitalsystems.com (`russell-capital-systems/`)

**Date:** 20 September 2026 · **Method:** static parse of `client/src/App.tsx` (route table) and the
`NAV_SECTIONS` array in `client/src/components/AppShell.tsx`, bounded to the array literal.

> **Revision note.** The first version of this document reported 321 routes, 316 page files and 163
> menu links. Those figures were wrong — the parser ran past the end of the `NAV_SECTIONS` array and
> picked up unrelated `path`/`label` pairs, inflating the menu count and the Rental Properties
> section. The figures below are re-verified by three independent commands (`find`, `grep -oE`,
> and a bounded Python parse) and agree.

This is the reference document. Re-read it before importing anything from another repository.

---

## 1. Size

| | Count |
|---|---|
| Routes declared in `App.tsx` | **313** |
| Page components under `client/src/pages/` | **310** |
| Page components wired to a route | 300 |
| Left-menu links | **158** |
| Left-menu sections | 12 |

---

## 2. The headline finding

> **157 of 313 routed pages never appear in the left menu.**

Of those 157: 19 are public or auth pages that belong outside the portal menu, 9 are parameterised detail routes reached from a parent page, and **129 are portal
pages with nowhere to be found from the menu at all.**

This is a discoverability problem, not a missing-features problem. Triage the orphans — promote,
merge, or delete — before importing anything new, or the menu grows while the backlog stays hidden.

---

## 3. Current menu structure

| Section | Links | Subgroups |
|---|---|---|
| Home | 11 | — |
| Rental Properties | 7 | — |
| Clients | 7 | — |
| New Client Welcome List | 20 | — |
| Planning | 23 | Retirement & Income, Tax & Estate, Strategy & Scenarios |
| Products | 26 | IUL & Index, Annuities, Real Estate, Specialty |
| AI & Tools | 13 | AI Assistants, Sales & Content |
| Compliance | 4 | — |
| The Experience | 25 | Command, Compete, Earn, Explore, Transcend |
| Tax Secrets | 8 | — |
| Secondary Information | 5 | — |
| Settings | 9 | — |

**158 links across 12 sections.**

Observations:

- **Rental Properties has 7 flat links and no subgroups** — the clearest candidate for tiering.
- **New Client Welcome List** (20) and **The Experience** (25) are the two largest sections.
- **Secondary Information** (5) has no clear category meaning.

---

## 4. Dead menu links

These menu entries point at routes that do not exist — they 404 today:

- `/portal/knowledge-library`
- `/portal/tool-explorer`

---

## 5. Page components not wired to any route

- `client/src/pages/ComplianceDisclosure.tsx`
- `client/src/pages/ComponentShowcase.tsx`
- `client/src/pages/ForgotPassword.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Register.tsx`
- `client/src/pages/ResetPassword.tsx`
- `client/src/pages/StrategyLabPage.tsx`
- `client/src/pages/TrialLogin.tsx`
- `client/src/pages/TrustsPage.tsx`
- `client/src/pages/portal/_genome/GenomeKit.tsx`

*Register, ForgotPassword and ResetPassword have matching routes declared, so they may be reached
through another import path — check each by hand before deleting.*

---

## 6. The 129 orphaned portal pages

- `/portal/admin`
- `/portal/advanced-reporting`
- `/portal/advisor-chat`
- `/portal/advisor-directory`
- `/portal/advisor-training`
- `/portal/affiliate-links`
- `/portal/agency-tutorial`
- `/portal/ai`
- `/portal/ai-brain-hub`
- `/portal/annuity-explorer`
- `/portal/annuity-memory`
- `/portal/athene-guaranteed-income`
- `/portal/athene-pe-plus15`
- `/portal/audit-timeline`
- `/portal/auto-closer`
- `/portal/axonic-sp500`
- `/portal/batch-illustration`
- `/portal/batch-slides`
- `/portal/branding`
- `/portal/career-path`
- `/portal/carrier-rates`
- `/portal/carrier-ratings`
- `/portal/carrier-settings`
- `/portal/certifications`
- `/portal/charitable-giving`
- `/portal/client-comparison`
- `/portal/client-files`
- `/portal/client-onboarding-auto`
- `/portal/client-portal-config`
- `/portal/client-report-generator`
- `/portal/client-scorecard`
- `/portal/client-self-service`
- `/portal/collaborative-planning`
- `/portal/command`
- `/portal/commission-calculator`
- `/portal/commission-tracker`
- `/portal/compete`
- `/portal/compliance-audit`
- `/portal/compliance-reports`
- `/portal/compliance-vault`
- `/portal/crypto-corner`
- `/portal/crypto-cycle`
- `/portal/deal-room`
- `/portal/divorce-ilit`
- `/portal/divorce-recovery`
- `/portal/document-vault`
- `/portal/earn`
- `/portal/education`
- `/portal/email-campaigns`
- `/portal/engagement-score`
- `/portal/enterprise`
- `/portal/estate-document-gen`
- `/portal/estate-planning`
- `/portal/explore`
- `/portal/fee-transparency`
- `/portal/fia-collateral`
- `/portal/financial-vitals`
- `/portal/goals-planning`
- `/portal/hidden-material`
- `/portal/how-a-figure-is-made`
- `/portal/hubspot`
- `/portal/income-annuity`
- `/portal/index-backtester-pro`
- `/portal/inflation`
- `/portal/interior`
- `/portal/interop-engine`
- `/portal/iul-projection`
- `/portal/knowledge`
- `/portal/legal-payment-folder`
- `/portal/liquidity-routes`
- `/portal/market-data`
- `/portal/market-pulse`
- `/portal/match-and-deploy`
- `/portal/medicare-irmaa`
- `/portal/meeting-agenda`
- `/portal/meeting-prep`
- `/portal/meetings`
- `/portal/monitoring-agreement`
- `/portal/mortgage-killer-v2`
- `/portal/mortgage-ledger`
- `/portal/multi-gen-wealth`
- `/portal/myga-waterfall`
- `/portal/oil-gas`
- `/portal/onboarding`
- `/portal/onboarding-v2`
- `/portal/owner-oversight`
- `/portal/pipeline`
- `/portal/policy-review`
- `/portal/policy-review-checklist`
- `/portal/portfolio-drift`
- `/portal/qbi-optimizer`
- `/portal/quick-quote`
- `/portal/quotes`
- `/portal/real-estate`
- `/portal/rebalance`
- `/portal/recommendations`
- `/portal/referral-engine`
- `/portal/referral-tracker`
- `/portal/referral-tracking`
- `/portal/retirement-guardrails`
- `/portal/retirement-opportunities`
- `/portal/retirement-projection`
- `/portal/risk-score`
- `/portal/saved-scenarios`
- `/portal/scenario-play`
- `/portal/seminar-generator`
- `/portal/settings-classic`
- `/portal/slack`
- `/portal/smart-rebalancing`
- `/portal/str-tax-eliminator`
- `/portal/strategy-combos`
- `/portal/succession-planning`
- `/portal/support-desk`
- `/portal/tax-brackets`
- `/portal/tax-loss-harvesting`
- `/portal/tax-opportunities`
- `/portal/tax-return-upload`
- `/portal/team`
- `/portal/team-management`
- `/portal/the-experience`
- `/portal/training`
- `/portal/transcend`
- `/portal/voice-plan`
- `/portal/wealth-reels`
- `/portal/webhooks`
- `/portal/website-usage`
- `/portal/welcome`
- `/portal/whisper-coach`
- `/portal/workflow-automations`

### Public and auth routes (correctly outside the portal menu)

- `/`
- `/404`
- `/administrator`
- `/calculators`
- `/executive`
- `/fact-finder`
- `/for`
- `/forgot-password`
- `/invite`
- `/login`
- `/onboarding`
- `/pricing`
- `/privacy`
- `/register`
- `/reset-password`
- `/support`
- `/terms`
- `/trial`
- `/ultra-calculator`

### Parameterised detail routes

- `/client-portal/:token`
- `/for/:slug`
- `/portal/alt-credit/:slug`
- `/portal/clients/:id`
- `/portal/secret-secrets/:id`
- `/portal/tax-combos/:id`
- `/shared-slides/:token`
- `/shared/:token`
- `/video/:token`

---

## 7. Repositories in scope

Sixteen reachable, all with push access. The four that plausibly hold competing page
implementations: **russell-capital**, **russell-capital-app**, **Russell-Capital-Solutions-NEW**,
**Really-Russell-Capital**. The rest are content, patents, skills, reports or backups.

---

## 8. Rule for the merge pass

1. Nothing is imported until its counterpart here has been read.
2. Where both builds have the same page, keep the stronger one and delete the other — never both.
3. Nothing enters the menu until the orphan triage above is done.
4. Anything genuinely novel found elsewhere gets written up and decided on before it is wired in.
