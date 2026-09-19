# RCS Live Build — Structural Audit

**Target:** the build that serves russellcapitalsystems.com (`russell-capital-systems/`)

**Date:** 19 September 2026 · **Method:** static analysis of `client/src/App.tsx` (route table) and `client/src/components/AppShell.tsx` (`NAV_SECTIONS`)

This is the reference document. Re-read it before touching any other repo.

---

## 1. Size

| | Count |
|---|---|
| Routes declared in `App.tsx` | **321** |
| Page components under `client/src/pages/` | **316** |
| Page components wired to a route | 306 |
| Left-menu links (`NAV_SECTIONS`) | **163** |
| Left-menu sections | 12 |
| Server `.ts` files | 336 |
| Shared `.ts` files | 127 |

---

## 2. The headline finding

> **160 of 321 routed pages do not appear anywhere in the left menu.**

The site has 321 working pages. The menu exposes 163. Roughly **49% of what has been built is unreachable except by typing the URL.**

This is not a missing-features problem. It is a discoverability problem. Before importing a
single page from another repo, the existing orphans should be triaged: promote, merge, or delete.

---

## 3. Current menu structure

| Section | Links | Subgroups |
|---|---|---|
| Home | 11 | — |
| Rental Properties | 12 | — |
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

**Total: 163 links across 12 sections.**

Observations:

- **Rental Properties** (12 links) is flat — no subgroups — while Planning, Products and
  The Experience are already grouped. It is the obvious candidate for collapsing into subgroups.
- **New Client Welcome List** (20 links) is the second-largest section and reads as a working
  list rather than a navigation category.
- **The Experience** (25 links, 5 subgroups) is the largest section in the menu.
- **Secondary Information** (5 links) has no clear category meaning.

---

## 4. Dead links in the menu

These menu entries point at routes that do not exist — they 404 today:

- `/portal/knowledge-library`
- `/portal/tool-explorer`

---

## 5. Page components not wired to any route

10 component files are never referenced by the route table:

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

*Some of these (ForgotPassword, Register, ResetPassword) have matching routes declared, so they
may be reached through a different import path — verify each by hand before deleting.*

---

## 6. The 160 orphaned routes

Every route below works but is invisible in the menu.

- `/`
- `/404`
- `/administrator`
- `/calculators`
- `/client-portal/:token`
- `/executive`
- `/fact-finder`
- `/for`
- `/for/:slug`
- `/forgot-password`
- `/invite`
- `/login`
- `/onboarding`
- `/portal/admin`
- `/portal/advanced-reporting`
- `/portal/advisor-chat`
- `/portal/advisor-directory`
- `/portal/advisor-training`
- `/portal/affiliate-links`
- `/portal/agency-tutorial`
- `/portal/ai`
- `/portal/ai-brain-hub`
- `/portal/alt-credit/:slug`
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
- `/portal/clients/:id`
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
- `/portal/mechanism/:slug`
- `/portal/mechanism/:slug/providers`
- `/portal/mechanism/:slug/sequences`
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
- `/portal/secret-secrets/:id`
- `/portal/seminar-generator`
- `/portal/settings-classic`
- `/portal/slack`
- `/portal/smart-rebalancing`
- `/portal/str-tax-eliminator`
- `/portal/strategy-combos`
- `/portal/succession-planning`
- `/portal/support-desk`
- `/portal/tax-brackets`
- `/portal/tax-combos/:id`
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
- `/pricing`
- `/privacy`
- `/register`
- `/reset-password`
- `/shared-slides/:token`
- `/shared/:token`
- `/support`
- `/terms`
- `/trial`
- `/ultra-calculator`
- `/video/:token`

---

## 7. Repositories in scope

Sixteen repositories are reachable, all with push access:

- sam-russell-corpus (public, live build lives here)
- russell-capital (private)
- russell-capital-patents (private)
- russell-capital-domain-redirect (private)
- russell-biomedical (private)
- russell-capital-app (private)
- Russell-Capital-Solutions-NEW (public)
- Really-Russell-Capital (public)
- Russell-Capital-Calibrate-System (public)
- sam-russell-catechism-brotherhood (public)
- sam-russell-corpus-backup (private)
- russell-capital-reports (private)
- russell-capital-skills (private)
- russell-capital-analyses (private)
- russell-capital-combinations (private)
- russell-capital-nlp (private)

The four that plausibly contain competing page implementations are **russell-capital**,
**russell-capital-app**, **Russell-Capital-Solutions-NEW** and **Really-Russell-Capital**.
The rest are content, patents, skills or backups.

---

## 8. Rule for the merge pass

1. Nothing gets imported until its counterpart here has been read.
2. Where both builds have the same page, keep the more capable one and delete the other —
   never both.
3. Nothing enters the menu until the orphan triage in section 2 is done, or the menu simply
   grows from 163 links to 200+ while 160 pages stay hidden.
4. Anything found in another repo that looks genuinely novel gets written up and decided on
   before it is wired in.
