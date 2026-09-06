# Russell Capital Systems — page inventory for theming

248 declared routes (client/src/App.tsx) in 8 functional roles, and the 12 sections a visitor moves through. Counts first, every path after.

## The 8 roles
- **1. Public front door — marketing, pricing, legal, sign-in** — 14 pages
- **2. Tax pages — strategy, schedule, combinations, filings** — 17 pages
- **3. Prediction & outside forces — taxes, inflation, markets, power, forgiveness, appreciation** — 17 pages
- **4. Calculators & engines — numbers the client runs** — 59 pages
- **5. Client profile & intake — facts about one person, their journey** — 44 pages
- **6. Dashboard & advisor operations — the cockpit, CRM, automations, admin** — 88 pages
- **7. Education & narrative — informative pages, showcases, library** — 9 pages
- **8. Printed & emailed documents** — 12 families (PDFs, emails, decks, shared links): their own colour system, bold company name on top, references block at the bottom

## The 12 sections (one theme map each)
1. Homepage above the fold — Theme 1 lives here only
2. Homepage below the fold and the public pages — /pricing, /support, /privacy, /terms, sign-in
3. Public calculators — /calculators, /ultra-calculator, /fact-finder
4. Portal home and dashboard — /portal, /portal/dashboard, advisory summary, client health, client portfolio
5. Clients and intake — directory, leads, planning cases, onboarding, smart intake, meeting notes, snapshot map
6. New Client Welcome List — assessment, AI advisor, journey, plan ledger, controls, wealth genome, the seven journey pages
7. Tax — every page in role 2
8. Prediction and outside forces — every page in role 3
9. Calculators and engines in the portal — every page in role 4 except the three public ones
10. Protection, estate and legacy — trusts, estate planning, ILIT, policy review, multi-gen transfer, will writer, succession
11. Advisor operations — deals, pipeline, calendar, automations, integrations, billing, settings, compliance, vault, training, system and site health
12. Shared outputs and printed documents — role 8: tokenised links, every PDF, every email

## Quiet by design
Legal (/privacy, /terms), sign-in and reset, settings, billing, compliance, vault, system and site health, the 404, and everything the client receives by link or email. These carry the identity but do not shout.

## Every page by role
### 1. Public front door — marketing, pricing, legal, sign-in (14)
`/`, `/404`, `/administrator`, `/executive`, `/forgot-password`, `/invite`, `/login`, `/pricing`, `/privacy`, `/register`, `/reset-password`, `/support`, `/terms`, `/trial`

### 2. Tax pages — strategy, schedule, combinations, filings (17)
`/portal/charitable-giving`, `/portal/estate-tax`, `/portal/hidden-material`, `/portal/physicians-edge`, `/portal/secret-secrets`, `/portal/secret-secrets/:id`, `/portal/str-strategy`, `/portal/tax-advantaged-growth`, `/portal/tax-brackets`, `/portal/tax-combos`, `/portal/tax-combos/:id`, `/portal/tax-loss-harvesting`, `/portal/tax-opportunities`, `/portal/tax-return-upload`, `/portal/tax-schedule`, `/portal/tax-waterfall`, `/portal/toilet`

### 3. Prediction & outside forces — taxes, inflation, markets, power, forgiveness, appreciation (17)
`/portal/crypto-corner`, `/portal/ecological-drivers`, `/portal/erosion`, `/portal/forgiveness`, `/portal/ibbotson-charts`, `/portal/index-strategies`, `/portal/inflation`, `/portal/market-data`, `/portal/market-stress-test`, `/portal/portfolio-drift`, `/portal/predictive-analytics`, `/portal/sphere`, `/portal/time-lapse`, `/portal/time-machine`, `/portal/time-machine-ag49`, `/portal/time-machine-calculator`, `/portal/time-machine-method`

### 4. Calculators & engines — numbers the client runs (59)
`/calculators`, `/portal/advisor-income-calculator`, `/portal/annuity-accumulation-db`, `/portal/annuity-memory`, `/portal/athene-guaranteed-income`, `/portal/athene-pe-plus15`, `/portal/axonic-sp500`, `/portal/batch-illustration`, `/portal/beneficiary-optimization`, `/portal/carrier-comparison`, `/portal/carrier-rates`, `/portal/carrier-ratings`, `/portal/carrier-settings`, `/portal/client-comparison`, `/portal/commission-calculator`, `/portal/comparison`, `/portal/divorce-calculator`, `/portal/endgame`, `/portal/estate-flow`, `/portal/existing-annuities`, `/portal/fia-top10`, `/portal/financial-vitals`, `/portal/growth-annuities`, `/portal/hot-income`, `/portal/house-recycling`, `/portal/illustration-compare`, `/portal/income-annuity-top10`, `/portal/income-gap`, `/portal/income-timeline`, `/portal/index-backtester`, `/portal/iul-historical`, `/portal/iul-vs-roth`, `/portal/lifetime-income`, `/portal/medicare-irmaa`, `/portal/mortgage-killer`, `/portal/mortgage-killer-v3`, `/portal/multi-gen-wealth`, `/portal/myga-fixed-rate`, `/portal/policy-loans`, `/portal/premium-financing`, `/portal/quick-quote`, `/portal/quotes`, `/portal/real-estate-mogul`, `/portal/rebalance`, `/portal/retirement-guardrails`, `/portal/retirement-projection`, `/portal/reverse-heloc`, `/portal/roth-conversion`, `/portal/russell-number`, `/portal/saved-scenarios`, `/portal/scenario-play`, `/portal/scenario-side-by-side`, `/portal/scenarios`, `/portal/smart-rebalancing`, `/portal/social-security`, `/portal/strategy-compare`, `/portal/the-brotherhood`, `/portal/withdrawal-sequencing`, `/ultra-calculator`

### 5. Client profile & intake — facts about one person, their journey (44)
`/fact-finder`, `/onboarding`, `/portal/ai-advisor`, `/portal/ai-policy-review`, `/portal/ai-recommender`, `/portal/avatar-twins`, `/portal/black-mirror`, `/portal/business-owner`, `/portal/client-files`, `/portal/client-health`, `/portal/client-intake`, `/portal/client-intake-recommender`, `/portal/client-onboarding`, `/portal/client-onboarding-auto`, `/portal/client-scorecard`, `/portal/client-snapshot`, `/portal/connections`, `/portal/controls`, `/portal/couples`, `/portal/daily-discovery`, `/portal/engagement-score`, `/portal/financial-assessment`, `/portal/goals-planning`, `/portal/household-wealth`, `/portal/my-journey`, `/portal/my-world`, `/portal/onboarding`, `/portal/onboarding-v2`, `/portal/plan-ledger`, `/portal/planning-cases`, `/portal/policy-review`, `/portal/policy-review-checklist`, `/portal/recommendations`, `/portal/risk-tolerance`, `/portal/secondary-information`, `/portal/the-arrival`, `/portal/the-field`, `/portal/the-legacy`, `/portal/the-map`, `/portal/the-mirror`, `/portal/the-strategy-table`, `/portal/wealth-genome`, `/portal/welcome`, `/portal/wrapped`

### 6. Dashboard & advisor operations — the cockpit, CRM, automations, admin (88)
`/portal/admin`, `/portal/advanced-reporting`, `/portal/advisor-chat`, `/portal/advisor-directory`, `/portal/advisor-training`, `/portal/advisory-summary`, `/portal/affiliate-links`, `/portal/agency-tutorial`, `/portal/agent-tutorial`, `/portal/ai`, `/portal/ai-assist`, `/portal/ai-meeting-notes`, `/portal/ai-slides`, `/portal/arena`, `/portal/audit-timeline`, `/portal/batch-slides`, `/portal/billing`, `/portal/branding`, `/portal/bulk-generation`, `/portal/client-portfolio`, `/portal/client-self-service`, `/portal/clients`, `/portal/clients/:id`, `/portal/co-pilot`, `/portal/collaborative-planning`, `/portal/command-center`, `/portal/commission-tracker`, `/portal/competitive`, `/portal/compliance`, `/portal/compliance-alerts`, `/portal/compliance-audit`, `/portal/compliance-audit-trail`, `/portal/compliance-monitoring`, `/portal/compliance-reports`, `/portal/daily-briefing`, `/portal/dashboard`, `/portal/data-query`, `/portal/document-templates`, `/portal/document-vault`, `/portal/email-campaigns`, `/portal/enterprise`, `/portal/estate-document-gen`, `/portal/fee-transparency`, `/portal/hubspot`, `/portal/infinite-scroll`, `/portal/integrations`, `/portal/knowledge`, `/portal/lead-generator`, `/portal/leaderboard`, `/portal/leads`, `/portal/legal-payment-folder`, `/portal/meeting-agenda`, `/portal/meetings`, `/portal/monitoring-agreement`, `/portal/morning-ritual`, `/portal/my-slides`, `/portal/nerve-center`, `/portal/owner-oversight`, `/portal/pet`, `/portal/pipeline`, `/portal/presentation-builder`, `/portal/referral-tracker`, `/portal/referral-tracking`, `/portal/revenue-guarantee`, `/portal/rewards`, `/portal/sales-story`, `/portal/seminar-generator`, `/portal/site-health`, `/portal/slack`, `/portal/social`, `/portal/stale-digest`, `/portal/story-generator`, `/portal/strategy`, `/portal/succession-planning`, `/portal/system-health`, `/portal/team`, `/portal/team-management`, `/portal/trusts`, `/portal/video-proposals`, `/portal/voice-plan`, `/portal/war-room`, `/portal/war-story-generator`, `/portal/wealth-reels`, `/portal/webhooks`, `/portal/website-usage`, `/portal/will-writer`, `/portal/workflow-automations`, `/shared-slides/:token`

### 7. Education & narrative — informative pages, showcases, library (9)
`/client-portal/:token`, `/portal`, `/portal/client-portal-config`, `/portal/combo-recommender`, `/portal/education`, `/portal/patent-showcase`, `/portal/video-library`, `/shared/:token`, `/video/:token`

### 8. Printed & emailed documents (12 families)
- Strategy PDF (strategyPdfService)
- Roth report (rothPdfReport)
- Mortgage Killer PDF
- 1035 exchange PDF
- Bulk comparison PDF
- Batch strategy PDF
- Client report export (pdfExportService)
- Six-way advisor answer PDF (answerPdf)
- Lead follow-up emails (followups)
- Client messages / SMS templates (messaging)
- Slide decks (AI slide generator, shared-slides)
- Shared links: /shared/:token, /shared-slides/:token, /video/:token, /client-portal/:token
