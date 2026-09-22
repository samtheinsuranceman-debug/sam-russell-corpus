# Orphan Triage — the pages with nowhere to be found

**Date:** 20 September 2026 · Companion to `LIVE_BUILD_AUDIT.md`

After tiering Rental Properties, **152 routes remain outside the left menu**: 19 public/auth, 9 parameterised detail routes, and **124 portal pages**.

The first two groups are correct as they are. This document is about the third.

Each page below is proposed for a destination section. Nothing is wired in yet — this is the
decision sheet. Mark each line **promote**, **merge** (into a page that already exists), or
**delete**, and I will apply it in one pass.

---

## → Planning (26)

- [ ] `/portal/charitable-giving`
- [ ] `/portal/collaborative-planning`
- [ ] `/portal/divorce-ilit`
- [ ] `/portal/divorce-recovery`
- [ ] `/portal/estate-document-gen`
- [ ] `/portal/estate-planning`
- [ ] `/portal/financial-vitals`
- [ ] `/portal/goals-planning`
- [ ] `/portal/income-annuity`
- [ ] `/portal/match-and-deploy`
- [ ] `/portal/medicare-irmaa`
- [ ] `/portal/multi-gen-wealth`
- [ ] `/portal/myga-waterfall`
- [ ] `/portal/policy-review`
- [ ] `/portal/policy-review-checklist`
- [ ] `/portal/portfolio-drift`
- [ ] `/portal/rebalance`
- [ ] `/portal/recommendations`
- [ ] `/portal/retirement-guardrails`
- [ ] `/portal/retirement-opportunities`
- [ ] `/portal/retirement-projection`
- [ ] `/portal/risk-score`
- [ ] `/portal/saved-scenarios`
- [ ] `/portal/scenario-play`
- [ ] `/portal/smart-rebalancing`
- [ ] `/portal/succession-planning`

## → Products (15)

- [ ] `/portal/annuity-explorer`
- [ ] `/portal/annuity-memory`
- [ ] `/portal/athene-guaranteed-income`
- [ ] `/portal/athene-pe-plus15`
- [ ] `/portal/axonic-sp500`
- [ ] `/portal/carrier-rates`
- [ ] `/portal/carrier-ratings`
- [ ] `/portal/carrier-settings`
- [ ] `/portal/crypto-corner`
- [ ] `/portal/crypto-cycle`
- [ ] `/portal/fia-collateral`
- [ ] `/portal/index-backtester-pro`
- [ ] `/portal/iul-projection`
- [ ] `/portal/quick-quote`
- [ ] `/portal/quotes`

## → Tax Secrets (5)

- [ ] `/portal/qbi-optimizer`
- [ ] `/portal/tax-brackets`
- [ ] `/portal/tax-loss-harvesting`
- [ ] `/portal/tax-opportunities`
- [ ] `/portal/tax-return-upload`

## → AI & Tools (19)

- [ ] `/portal/advanced-reporting`
- [ ] `/portal/advisor-chat`
- [ ] `/portal/advisor-training`
- [ ] `/portal/ai`
- [ ] `/portal/ai-brain-hub`
- [ ] `/portal/auto-closer`
- [ ] `/portal/batch-illustration`
- [ ] `/portal/batch-slides`
- [ ] `/portal/email-campaigns`
- [ ] `/portal/how-a-figure-is-made`
- [ ] `/portal/hubspot`
- [ ] `/portal/interop-engine`
- [ ] `/portal/seminar-generator`
- [ ] `/portal/slack`
- [ ] `/portal/training`
- [ ] `/portal/voice-plan`
- [ ] `/portal/webhooks`
- [ ] `/portal/whisper-coach`
- [ ] `/portal/workflow-automations`

## → Clients (20)

- [ ] `/portal/advisor-directory`
- [ ] `/portal/client-comparison`
- [ ] `/portal/client-files`
- [ ] `/portal/client-onboarding-auto`
- [ ] `/portal/client-portal-config`
- [ ] `/portal/client-report-generator`
- [ ] `/portal/client-scorecard`
- [ ] `/portal/client-self-service`
- [ ] `/portal/deal-room`
- [ ] `/portal/engagement-score`
- [ ] `/portal/meeting-agenda`
- [ ] `/portal/meeting-prep`
- [ ] `/portal/meetings`
- [ ] `/portal/onboarding`
- [ ] `/portal/onboarding-v2`
- [ ] `/portal/pipeline`
- [ ] `/portal/referral-engine`
- [ ] `/portal/referral-tracker`
- [ ] `/portal/referral-tracking`
- [ ] `/portal/welcome`

## → Compliance (8)

- [ ] `/portal/audit-timeline`
- [ ] `/portal/compliance-audit`
- [ ] `/portal/compliance-reports`
- [ ] `/portal/compliance-vault`
- [ ] `/portal/document-vault`
- [ ] `/portal/fee-transparency`
- [ ] `/portal/legal-payment-folder`
- [ ] `/portal/monitoring-agreement`

## → The Experience (10)

- [ ] `/portal/agency-tutorial`
- [ ] `/portal/career-path`
- [ ] `/portal/certifications`
- [ ] `/portal/command`
- [ ] `/portal/compete`
- [ ] `/portal/earn`
- [ ] `/portal/education`
- [ ] `/portal/explore`
- [ ] `/portal/the-experience`
- [ ] `/portal/transcend`

## → Settings (14)

- [ ] `/portal/admin`
- [ ] `/portal/affiliate-links`
- [ ] `/portal/branding`
- [ ] `/portal/commission-calculator`
- [ ] `/portal/commission-tracker`
- [ ] `/portal/enterprise`
- [ ] `/portal/market-data`
- [ ] `/portal/market-pulse`
- [ ] `/portal/owner-oversight`
- [ ] `/portal/settings-classic`
- [ ] `/portal/support-desk`
- [ ] `/portal/team`
- [ ] `/portal/team-management`
- [ ] `/portal/website-usage`

## → Rental Properties (1)

- [ ] `/portal/oil-gas`

## → NEEDS A DECISION (6)

- [ ] `/portal/hidden-material`
- [ ] `/portal/inflation`
- [ ] `/portal/interior`
- [ ] `/portal/knowledge`
- [ ] `/portal/strategy-combos`
- [ ] `/portal/wealth-reels`

---

## Known duplicate pairs to resolve

These look like two builds of the same thing. Keep one.

| A | B | Note |
|---|---|---|
| `/portal/oil-gas` | `/portal/hot-income` *(in menu)* | Different components, same subject |
| `/portal/onboarding` · `/portal/onboarding-v2` | `/portal/client-onboarding` *(in menu)* | Three onboarding flows |
| `/portal/referral-engine` · `/portal/referral-tracker` · `/portal/referral-tracking` | — | Three referral pages |
| `/portal/rebalance` · `/portal/smart-rebalancing` | — | Two rebalancers |
| `/portal/policy-review` · `/portal/policy-review-checklist` | — | Possibly parent/child |
| `/portal/settings-classic` | `/portal/settings` *(in menu)* | Old settings page |
| `/portal/team` · `/portal/team-management` | — | Two team pages |
| `/portal/compliance-audit` · `/portal/audit-timeline` · `/portal/compliance-reports` | — | Overlapping compliance views |
| `/portal/document-vault` · `/portal/compliance-vault` | — | Two vaults |

---

## Dead menu links to fix or remove

- `/portal/knowledge-library` — 404s today; `/portal/knowledge` exists and is orphaned. Likely a rename that was half-applied.
- `/portal/tool-explorer` — 404s today; no obvious replacement route.
