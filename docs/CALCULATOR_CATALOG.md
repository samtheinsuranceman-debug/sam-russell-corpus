# The Calculator Catalogue — what is live, what was broken, what to build next

## What was actually wrong

The catalogue page carried its list of calculators as hand-typed JSX: a name, a
blurb and a guessed URL. **Eighteen of its thirty-five cards pointed at routes
that did not exist.** `/portal/iul-projection`, `/portal/oil-gas`,
`/portal/myga-waterfall`, `/portal/crypto-cycle`, `/portal/estate-planning`,
`/portal/strategy-lab`, `/portal/inflation-analysis` and eleven others all
404'd. The page files were on disk the whole time — they had simply never been
given a route.

Three more were near-misses where the catalogue guessed a slug the router did
not use: `income-gap-analyzer` against the real `/portal/income-gap`,
`inflation-analysis` against `/portal/inflation`, `strategy-lab` against
`/portal/strategy`.

That is why the working set felt like nine calculators. It was not that
calculators were missing. It was that half the index was broken and nothing
checked it.

A hand-typed list cannot be checked. **`shared/calculatorCatalog.ts` can**:
`server/calculatorCatalog.test.ts` resolves every entry's `path` against the
real router in `client/src/App.tsx`, resolves the route's component to a file
on disk, and resolves every `engine:` claim to a real module. A bad entry now
fails the build instead of reaching a client.

## What is live now

**95 instruments across ten rooms**, every one verified:

| Room | Count |
|---|---|
| Retirement & Income | 12 |
| Tax | 14 |
| Insurance & Policy | 18 |
| Real Estate & Property | 11 |
| Estate & Legacy | 10 |
| Business Owners | 4 |
| Life Events | 3 |
| Markets & Outside Forces | 7 |
| Diagnostics & Scoring | 8 |
| Practice Tools | 8 |

Both pages asked for by name are present and routed: **Ecological Drivers of
Retirement Success** (`/portal/ecological-drivers`) and **Real Estate Mogul**
(`/portal/real-estate-mogul`).

### The 39 routes restored

Calculators and tools whose page files existed but had no route:

iul-projection, myga-waterfall, crypto-cycle, oil-gas, estate-planning,
real-estate, str-tax-eliminator, income-annuity, annuity-explorer,
divorce-ilit, mortgage-killer-v2, risk-score, retirement-opportunities,
interop-engine, ai-brain-hub, match-and-deploy, auto-closer, deal-room,
meeting-prep, whisper-coach, market-pulse, referral-engine, career-path,
the-experience, transcend, compete, earn, training, certifications,
compliance-vault, explore, command, divorce-recovery, index-backtester-pro,
settings-classic, support-desk, fia-collateral, strategy-combos,
client-report-generator.

One collision was fixed: `ComboRecommender` had been given
`/portal/combo-recommender`, which `ClientIntakeRecommender` already owned —
wouter takes the first match, so the second page would never have rendered. It
now lives at `/portal/strategy-combos`.

### Not restored, deliberately

`Register`, `ForgotPassword`, `ResetPassword`, `TrialLogin`, `Home` and
`ComponentShowcase` were left unrouted. They were superseded by `EntranceGate`
and `ManagedAuth`; reviving them would reopen a second sign-in path, which is a
security regression, not a feature.

## How the AI uses it

`instrumentBlock()` in `shared/compositeMind.ts` turns the registry into the
list every AI channel receives. The advisor can therefore name a calculator by
its exact path and name the engine that produced a figure — and **cannot invent
either**, because it is only ever given paths the router serves.

---

# The next forty pages, and why

These are the gaps that remain. Each was a hub in the older build pointing at a
page that was never written, so the topic is already understood to belong here.
They are ordered by what they are worth, not alphabetically.

## Tier 1 — the highest-value gaps (build these first)

The physicians, surgeons and practice owners this firm serves hit these
specific walls, and there is nothing on the site today that answers them.

1. **QBI / Section 199A Optimizer** — The single largest deduction available to
   a practice owner, and the one with the most moving parts: the SSTB
   phase-out, the W-2 wage limit, the UBIA basis test. A surgeon with an S-corp
   who gets this wrong overpays by five figures a year, every year.
2. **Cash Balance / Defined Benefit Plan Designer** — The only vehicle that lets
   a high earner in their fifties shelter $150k–$300k a year. Nothing else on
   the site comes close on raw deduction size, and the site currently cannot
   even mention it with a number attached.
3. **Backdoor & Mega Backdoor Roth** — Every client above the income limit asks
   this, and the pro-rata rule makes the answer non-obvious. The system already
   models Roth conversions; this is the same engine with a different entry door.
4. **Pension vs Lump Sum** — An irreversible, one-shot decision made by nearly
   every hospital-employed physician at retirement, usually on a spreadsheet
   from the plan administrator. The Longevity Engine already holds the joint
   survival tables this needs.
5. **Disability Gap Analyzer (own-occupation)** — For a surgeon, the disability
   policy is worth more than the life policy, and group coverage almost never
   covers the specialty definition. This is the largest uninsured exposure in
   the client base.
6. **Practice Valuation** — The client's largest asset, and the one nobody has
   priced. Everything downstream — succession, buy-sell, estate liquidity —
   depends on a number that does not exist yet.
7. **Buy-Sell Funding Calculator** — Partners have an agreement; almost none have
   funded it. The gap between the agreement's number and the funding is the
   whole product.
8. **Key Person Insurance** — Same structural gap, at the practice rather than
   the partner level, and the easiest one to quantify.
9. **Student Loan Optimizer (PSLF / IDR / refinance)** — The decision made at
   age 28 that governs the next twenty years. It is also the first honest reason
   for a young physician to engage at all, which makes it a doorway, not just a
   tool. The Career Ledger already holds the loan-rate tables.
10. **AMT Calculator & Planner** — Alive again for incentive stock options and
    large deduction years, and invisible until it bites.

## Tier 2 — advanced planning the firm sells but cannot show

The strategy is already in the sales conversation. Without a page, it is a
claim; with one, it is arithmetic.

11. **GRAT Planner** — Zeroed-out GRATs at current 7520 rates. Pure technique,
    highly visual, and it demonstrates competence faster than anything else.
12. **IDGT Modeller** — The intentionally defective grantor trust: the workhorse
    of estate freezes, and impossible to explain without a diagram that moves.
13. **SLAT Planner** — The exemption-sunset answer for married couples, with the
    reciprocal-trust doctrine shown as the constraint it is.
14. **QPRT Calculator** — The residence out of the estate at a discount. Simple
    maths, memorable result.
15. **ILIT Calculator** — Referenced everywhere on the site already; there is no
    page that actually computes one. The divorce/ILIT page exists but assumes
    the trust.
16. **CRT / CRUT Engine** — Appreciated asset, no capital gain, income for life,
    remainder to charity. The most persuasive single demonstration in planning.
17. **CLT Planner** — The mirror of the CRT, for the client whose problem is
    estate tax rather than income tax.
18. **Charitable Stock / DAF Comparison** — Giving appreciated shares instead of
    cash is the easiest win available; most clients have never been shown it.
19. **Dynasty Trust Architect** — GST exemption across three generations. Pairs
    directly with the Inheritance Engine that already exists.
20. **Estate Liquidity Planner** — Where the cash comes from to pay the estate
    tax without a forced sale. This is the actual reason the insurance exists.
21. **Split-Dollar Life** — Economic benefit and loan regimes for practice
    owners; a genuine differentiator because almost nobody models it correctly.
22. **Premium Financing Arbitrage** — The site has a premium financing page; it
    needs the version that shows the rate at which the arbitrage breaks, so the
    firm is the one naming the risk.
23. **PPLI Modeller** — Private placement life for the accredited client; a
    credibility page as much as a calculation.
24. **Captive Insurance Planner** — 831(b) captives for multi-entity practices,
    with the IRS scrutiny stated honestly and up front.
25. **Executive Bonus (162) Plan** — The simplest business-paid benefit, and the
    easiest to implement in the current year.
26. **Deferred Compensation / 409A Analyzer** — Hospital-employed physicians have
    these and almost never understand the distribution election or the credit
    risk of being an unsecured creditor of their employer.

## Tier 3 — tax and property mechanics

27. **1031 Exchange Analyzer (+ DST)** — Every real-estate client asks. The Zip
    Engine already holds the property data it needs.
28. **Opportunity Zone Planner** — Deferral and basis step-up with the statutory
    dates drawn, since the dates are the whole strategy.
29. **Capital Gains Tax Calculator** — The plain one, missing. NIIT, the 0%
    bracket, and where the next dollar of gain actually lands.
30. **Income Shifting Calculator** — Family employment, entity elections, and
    the kiddie-tax boundary.
31. **Physician Mortgage Analyzer** — The zero-down doctor loan against a
    conventional one, including what the rate premium actually costs over the
    holding period. Feeds the Mortgage Killer.
32. **Refinance Break-Even** — Two minutes to run, asked constantly, and it
    builds the trust that carries the larger conversation.
33. **Reverse Mortgage Calculator** — An HECM line as a standby buffer, which is
    a legitimate sequence-of-returns tool and is usually dismissed on reflex.
34. **Home Affordability / Lease vs Buy** — The entry-level pair that gets a
    young physician into the system before there is anything to plan.

## Tier 4 — policy, protection and completeness

35. **Policy Replacement Analyzer (1035)** — When replacing an existing policy is
    right and when it is not. Being able to say "keep what you have" with
    arithmetic behind it is worth more than any pitch.
36. **Variable Annuity Analyzer** — Clients arrive holding these. The site needs
    to read one honestly, including the cases where it should stay.
37. **Medicare Part D / Advantage Planner** — IRMAA is covered; the plan choice
    itself is not, and it recurs every single year.
38. **Survivor Benefit Planner** — What the surviving spouse actually lives on
    after the Social Security reduction and the filing-status change. The most
    under-modelled event in retirement.
39. **Trust Funding Checklist** — Trusts that were drafted and never funded are
    the most common failure in estate planning, and the cheapest to fix.
40. **Post-Mortem Tax Planner** — Disclaimers, alternate valuation, the 65-day
    rule. The window is short, the decisions are irreversible, and nobody has
    them written down in advance.

## Beyond the calculators — the pages that matter more

The user asked which non-financial pages are critical. These are not
calculators and are worth more than most of them:

- **Ecological Drivers of Retirement Success** — already live. Health, purpose,
  relationships and place decide whether a retirement works. It is the page
  that says this firm is not only counting money, and it should be linked from
  the Fact Finder rather than buried in the catalogue.
- **The AI Brain Hub** (`/portal/ai-brain-hub`, restored this pass) — the twelve
  channels, the language layer and the engines behind every answer. This is the
  page that makes the system legible instead of magic, which matters for both
  trust and the patent record.
- **The Wealth Genome** — 21 weighted factors; the strongest differentiator on
  the site because no competitor has anything structurally like it.
- **The Erosion Engine** and **Outside Forces** — the record rather than the
  assumption. These are what make every projection defensible.
- **The Interop Engine** (restored this pass) — showing that a number entered
  once flows everywhere is the clearest demonstration of what the platform is.
- **A single "How a figure gets made" page** — not yet built. One worked
  example traced from input through engine to output with the source cited at
  each step. For a sceptical, high-numeracy client base this is likely the
  highest-converting page that does not exist yet.
