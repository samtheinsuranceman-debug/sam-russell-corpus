# Provider Verification Brief
## 39 companies across five capital mechanisms — research instructions for Perplexity

Prepared 2026-09-18 for Russell Capital Systems (RCS). Repo: `samtheinsuranceman-debug/sam-russell-corpus`, folder `russell-capital-systems/`. Files this brief feeds: `shared/altCredit/lenders.ts` (the verified directory), `shared/mechanismDossiers.ts` (the provider lists), `shared/thresholds.ts` (the gate registry), `shared/sequencePlanner.ts` (the planner that consumes thresholds).

---

## 1. The goal

Five capital mechanisms are documented on the site — policy loan cycle, velocity banking, BRRRR with DSCR refinance, equity share agreements, and seller financing/wraps. Each has a three-page dossier at `/portal/mechanism/{id}` (how it works / who provides it / where it sits in a sequence), a threshold registry at `/portal/thresholds`, and a sequence planner at `/portal/sequence-planner` that generates stage-by-stage plans from a household's situation.

The provider lists currently carry **name, category description, and homepage only**. That was deliberate: the names came from general knowledge rather than live research, and the site's publishing rule is that no rate, term, phone number or address may appear unless it was read from the company's own material with a recorded source and date. So the lists are honest and thin.

**The goal of this research is to make them thick and still honest.** Every field below, for every one of the 39 companies, read from a primary source, with the URL and the date it was read. Anything that cannot be confirmed from a primary source is returned as "not verified" with the reason — never guessed, never taken from an aggregator.

## 2. What "10 out of 10" means for a provider page

A 10/10 provider page is one where a client or advisor can:

1. **Decide eligibility in sixty seconds** — states served, property types, entity borrowers, credit floor, documentation type, minimum and maximum loan size — without leaving the page.
2. **See the thresholds that actually gate the plan** — seasoning, max cash-out LTV, minimum DSCR, term, prepayment penalty, advance percentage, settlement formula — as numbers, each linked to the page it came from, each dated.
3. **Know the cost band** — rate index and margin, or published rate range, or fee schedule — so the planner's cost-of-capital band per stage can be tightened from a mechanism-wide guess to a provider-specific figure.
4. **Contact them from the site** — phone and address read from the company's own contact page (URL recorded), never from a directory.
5. **Judge them** — BBB profile URL and grade, Google review count and rating, CFPB complaint count if a regulated lender, NMLS ID and licence states, founding year, headquarters, ownership (public / private / mutual / fraternal), any regulatory action in the last five years.
6. **See how they connect** — which threshold variant in the registry this provider is the evidence for; which planner move uses that variant; which archetypes route through it; which genome factors gate it (documentation type, appetite, insurability); which memory-bank group carries the rule.
7. **Trust the freshness** — every field shows its as-of date; anything older than 90 days is flagged on the page for re-verification.

The current page does (7) and half of (6). The research delivers (1)–(5) and completes (6).

## 3. The per-company template — return this for every company

Return one record per company in the JSON schema in §8. Field by field:

| Field | What to find | Acceptable source | Not acceptable |
|---|---|---|---|
| `legalName` | Registered legal entity name | Company site footer/terms, NMLS Consumer Access, state DOI | Wikipedia, directories |
| `identifiers` | NMLS ID, state licence numbers, insurance company NAIC code, A.M. Best rating (carriers) | nmlsconsumeraccess.org, company disclosures page, ambest.com, naic.org | Aggregators |
| `founded` | Year founded | Company "about" page, SEC filing, state incorporation record | Crunchbase alone |
| `headquarters` | Street address of HQ | Company contact page, NMLS record | Google Maps alone |
| `ownership` | Public / private / mutual / mutual holding / fraternal / subsidiary of X | Company site, SEC, state DOI | — |
| `phone` | Main or program phone | Company's own contact or apply page — record the exact URL | Any third-party directory |
| `statesServed` | List or "nationwide", with exclusions | Company site or NMLS licence list | Blog posts |
| `products` | Named products relevant to the mechanism (e.g. "Rental360", "All In One Loan", "Whole Life Legacy 100") | Product page URL | — |
| `thresholds` | See §4 per mechanism | Program page, rate sheet, FAQ, term sheet PDF, policy disclosure | Market-comparison blogs unless nothing else exists — then mark evidence 5 |
| `rates` | Published rate range, or index + margin, or "request a quote" | Rate page, disclosure | Any figure older than 90 days unless dated |
| `fees` | Origination points, annual fee, per-draw fee, prepayment penalty structure | Fee schedule, disclosure | — |
| `eligibility` | Property types, occupancy, entity borrowers, credit floor, reserves, documentation | Program page | — |
| `bbb` | Profile URL, grade, accreditation, complaint count | bbb.org | — |
| `googleReviews` | Count and rating, with the date | Google Business profile | — |
| `cfpb` | Complaint count last 3 years, if a regulated lender | consumerfinance.gov complaint database | — |
| `regulatoryActions` | Any enforcement, consent order, or fine, last 5 years | State DOI/DFPI, CFPB, SEC, court records | — |
| `apiOrPartner` | Broker/partner program, API, referral program, and its URL | Company site | — |
| `recentNews` | Up to 3 items last 12 months: acquisitions, program changes, rate changes, layoffs, funding | Press release or major outlet, dated | — |
| `notVerified` | For every field above that could not be confirmed: the field name and why | — | — |

**Every value carries `source` (URL) and `asOf` (YYYY-MM-DD).** A value without both is discarded at ingest.

## 4. Mechanism-specific thresholds to capture

### BRRRR / DSCR lenders (10): Kiavi, Lima One Capital, Visio Lending, Ternus Lending, CoreVest Finance, Angel Oak Mortgage Solutions, Easy Street Capital, New Silver, Griffin Funding, Temple View Capital
- Ownership seasoning for cash-out at appraised value (months) — and whether "value seasoning" is a separate rule
- Whether they honour the delayed-financing exception and its cap
- Max LTV: purchase / rate-and-term / cash-out (three separate numbers)
- Minimum DSCR, and whether sub-1.0 or no-ratio programs exist with their LTV cap
- Minimum and maximum loan size; minimum property value
- Short-term rental income treatment
- Portfolio/blanket product: minimum property count, minimum loan size, LTV, DSCR, **partial-release clause terms**
- Entity borrowers permitted; personal guaranty required
- Prepayment penalty structure (e.g. 5-4-3-2-1, 3-2-1, none)
- Rate structure offered (30-yr fixed, 5/1, 7/1, IO)
- Rehab draw process if a bridge product exists
- Credit floor, reserve requirement

### Equity share (6): Point, Hometap, Unison, Unlock, Splitero, Truehold (sale-leaseback)
- Term (10 / 30 years) and early buy-back terms; partial buy-back permitted?
- Settlement formula: share of TOTAL VALUE or share of APPRECIATION; the multiplier; the starting-value "risk adjustment" discount
- Maximum advance as % of value; maximum CLTV
- **Subordinate financing after the agreement**: permitted? consent process? (this is the covenant the planner enforces — the exact contract language matters)
- **Can the agreement sit behind an existing HELOC** at origination?
- **Investment / non-owner-occupied eligibility** — currently marked "not verifiable"; this is the single most valuable fact to settle
- Settlement triggers: sale, term, refinance, death, default
- States served; minimum credit; minimum equity
- Fees: origination, appraisal, servicing
- For Truehold: purchase price basis, lease term, rent formula, buy-back option

### Policy loan carriers (8): MassMutual, New York Life, Northwestern Mutual, Guardian Life, Penn Mutual, Lafayette Life, Ameritas, Foresters Financial
- Ownership: mutual / mutual holding / fraternal; A.M. Best and S&P ratings
- Named whole life product(s) suited to cash accumulation; paid-up-additions rider name and limits
- **Direct vs non-direct recognition**, by product series, from the carrier's own disclosure
- Policy loan rate: fixed or variable; current rate; preferred/wash loan provision and the year it starts
- Maximum loan as % of cash value ("available loan value" definition)
- Current dividend scale (year and %); dividend history 10 years if published
- Seven-pay test handling in illustrations; MEC warnings
- Surrender charge schedule for the accumulation product
- Underwriting classes; simplified-issue availability
- Financial strength: surplus, comdex if published

### Velocity / HELOC (8): CMG Financial (All In One Loan), Figure, Aven, Third Federal, PenFed, Bethpage FCU, Spring EQ, Rocket Mortgage
- Product type: first-lien HELOC / second-lien HELOC / HE card / fixed home equity loan (only lines run velocity)
- Max CLTV; minimum credit; income documentation required
- **Interest calculation method** (average daily balance is required for the mechanism)
- Per-draw fees, annual fee, inactivity fee, early closure fee
- Draw period / repayment period; fixed-rate conversion option and whether it disables the sweep
- Rate index + margin; rate floor/cap; introductory rate
- Freeze/reduction policy language
- Membership requirements (credit unions)
- States served; minimum and maximum line

### Seller wrap servicers & note buyers (7): FCI Lender Services, Madison Management Services, Note Servicing Center, Del Toro Loan Servicing, Paperstac, Amerinote Xchange, Seascape Capital
- Servicers: will they service a wrap specifically; do they pay the underlying lender; setup fee, monthly fee, states licensed; impound/tax monitoring; default/cure process; payer reporting
- Note buyers/marketplaces: seasoning required for purchase; typical discount range by seasoning; partial purchase available; documentation checklist for listing; minimum note size; states
- Any consumer-protection licensing (Dodd-Frank seller-finance exemptions, SAFE Act / RMLO requirement by state)

## 5. Verification rules

1. **Primary source or nothing.** Company site, regulator database, SEC filing, rating agency, BBB, Google Business profile. Market-comparison blogs may be cited only when nothing primary exists, and get `evidence: 5`.
2. **Every value gets a URL and a date.** No URL, no value.
3. **Conflicts are reported, not resolved.** If the contact page and the apply page show different addresses (Ternus does), return both with both URLs and flag it.
4. **"Not verified" is a valid answer** and is preferred to a guess. Return the field name and why it could not be confirmed.
5. **Phone numbers only from the company's own domain.** The site's tests reject any phone-shaped string not backed by a same-domain source.
6. **Rates and fees carry the date prominently.** They move weekly.
7. **Evidence score per field**: 10 statute/regulator, 9 company disclosure PDF, 8 company program page, 7 company FAQ/blog, 6 rating agency/BBB, 5 market report, below 5 not accepted.

## 6. How it integrates — the whole engine, not one page

| System | What the research changes |
|---|---|
| **Lender directory** (`altCredit/lenders.ts`) | Every company gets a full `Verified<T>` record. Six exist today (ternus, visio, hometap, unison, unlock, truehold); 33 are new. Contact fields flip from `notVerified` to `verified(value, source, date)`. |
| **Mechanism dossiers** (`mechanismDossiers.ts`) | Each provider's `registryId` resolves; the page links "Verified record →" for all 39, not six. |
| **Threshold registry** (`thresholds.ts`) | Each variant's `providedBy` becomes a list of registry IDs with the source that proves it. Evidence scores rise from 5 (market report) to 8–9 (lender page). New variants get added where research finds them (e.g. a 0-seasoning program, a 30-year HEI term at a second provider, a non-direct-recognition series). |
| **Sequence planner** (`sequencePlanner.ts`) | Stage cost-of-capital bands tighten from mechanism-wide to provider-specific. A stage can name the provider whose threshold it used. Provider eligibility (states, entity, docs) becomes a refusal reason: "no DSCR lender in the registry serves this state at this LTV." |
| **Cycle engine** (`cycleEngine.ts`) | `costOfCapital` bands per mechanism re-derived from real rate sheets with dates. |
| **Genome strategy fit** (`genomeStrategyFit.ts`) | Provider eligibility becomes an external gate: documentation 'none' + no provider accepting it = BLOCKED, with the provider list as the evidence. |
| **Household genome** (`householdGenome.ts`) | Provider consent rules (e.g. HEI subordinate-lien consent) feed the "who decides" logic for jointly owned primaries. |
| **AI brain / memory bank** (`aiMemoryBank.ts`) | Groups `alt-credit`, `mechanism-dossiers`, `thresholds` gain provider-level facts the channels may quote — with the standing rule that a figure is quoted only with its source and date. |
| **Provenance page** (`/portal/how-a-figure-is-made`) | Every provider figure becomes traceable end to end. |
| **Mortgage killer / rental enterprise** | HELOC interest-calculation method and fee data feed the velocity arithmetic; DSCR terms feed the enterprise loan schedule. |
| **Freshness sweep** | A scheduled re-check flags any provider field older than 90 days; the page shows the flag. |

## 7. Known conflicts and notes to carry in

- **Ternus**: contact page shows 6230 Fairview Rd, apply page shows 6320; LinkedIn lists a Dallas HQ. Resolve which is current.
- **Unison**: founded 2004 (not 2006, which earlier material had).
- **Point**: help centre states 30-year term on most agreements, 10 on some; contemplates a HELOC as a *repayment* source; does not publish a consent process for subordinate liens or a universal CLTV cap. Settle these.
- **Hometap, Unlock, Splitero**: rental/investment eligibility not verifiable from earlier pass — this is the highest-value single fact.
- **Roc Capital** (not in the 39 but in the threshold registry): 1.00x DSCR up to $2M / 10 properties, 1.20x NCF above; add as a portfolio lender record.
- **Kiavi / Griffin** 90-day seasoning: reported by a market comparison only. Confirm on the lender's own page or mark not verified.
- **Penn Mutual** preferred-loan provision year 11+ is from the carrier's own PDF (pm9192) — evidence 9. Find the equivalent disclosure for each other carrier.
- The site must **never** publish "patent pending" language anywhere; irrelevant to providers but do not import any RCS marketing text that contains it.

## 8. Return format — JSON, one object per company

```json
{
  "id": "kiavi",
  "mechanism": "brrrr-dscr",
  "legalName": {"value": "...", "source": "https://...", "asOf": "2026-09-18", "evidence": 8},
  "identifiers": [{"value": "NMLS #...", "source": "https://nmlsconsumeraccess.org/...", "asOf": "...", "evidence": 10}],
  "founded": {"value": 2013, "source": "...", "asOf": "...", "evidence": 8},
  "headquarters": {"value": "...", "source": "...", "asOf": "...", "evidence": 8},
  "ownership": {"value": "private", "source": "...", "asOf": "...", "evidence": 8},
  "phone": {"value": "...", "source": "https://www.kiavi.com/contact", "asOf": "...", "evidence": 8},
  "statesServed": {"value": ["..."], "source": "...", "asOf": "...", "evidence": 8},
  "products": [{"name": "...", "url": "...", "asOf": "..."}],
  "thresholds": [
    {"key": "dscr-seasoning", "value": 6, "unit": "months", "condition": "cash-out at appraised value", "source": "...", "asOf": "...", "evidence": 8},
    {"key": "dscr-cashout-ltv", "value": 75, "unit": "percent", "source": "...", "asOf": "...", "evidence": 8}
  ],
  "rates": {"value": "index + margin or range or 'quote'", "source": "...", "asOf": "...", "evidence": 8},
  "fees": [{"name": "origination", "value": "...", "source": "...", "asOf": "..."}],
  "eligibility": {"propertyTypes": [], "occupancy": "", "entityBorrowers": true, "creditFloor": 660, "documentation": "DSCR", "source": "...", "asOf": "..."},
  "bbb": {"url": "...", "grade": "A+", "accredited": true, "complaints3y": 12, "asOf": "..."},
  "googleReviews": {"count": 0, "rating": 0, "asOf": "..."},
  "cfpb": {"complaints3y": 0, "source": "...", "asOf": "..."},
  "regulatoryActions": [],
  "apiOrPartner": {"value": "...", "source": "...", "asOf": "..."},
  "recentNews": [{"date": "...", "headline": "...", "source": "..."}],
  "notVerified": [{"field": "googleReviews", "why": "No Google Business profile found under the legal name"}],
  "conflicts": [{"field": "headquarters", "values": ["...", "..."], "sources": ["...", "..."]}]
}
```

Threshold `key` values must match the registry: `dscr-seasoning`, `dscr-cashout-ltv`, `dscr-coverage`, `financed-property-cap`, `portfolio-partial-release`, `due-on-sale-exposure`, `note-seasoning-for-sale`, `hei-no-further-encumbrance`, `hei-term`, `hei-investment-property`, `policy-loan-value`, `seven-pay`, `policy-ramp`, `heloc-cltv`. Add new keys with a one-line definition if a threshold is found that the registry lacks.

## 9. The 39, by mechanism

**Policy loan (8):** MassMutual · New York Life · Northwestern Mutual · Guardian Life · Penn Mutual · Lafayette Life · Ameritas · Foresters Financial

**Velocity / HELOC (8):** CMG Financial (All In One Loan) · Figure · Aven · Third Federal Savings & Loan · PenFed Credit Union · Bethpage Federal Credit Union · Spring EQ · Rocket Mortgage

**BRRRR / DSCR (10):** Kiavi · Lima One Capital · Visio Lending (existing record `visio`) · Ternus Lending (existing `ternus`) · CoreVest Finance · Angel Oak Mortgage Solutions · Easy Street Capital · New Silver · Griffin Funding · Temple View Capital

**Equity share (6):** Point · Hometap (existing `hometap`) · Unison (existing `unison`) · Unlock (existing `unlock`) · Splitero · Truehold (existing `truehold`)

**Seller wrap (7):** FCI Lender Services · Madison Management Services · Note Servicing Center · Del Toro Loan Servicing · Paperstac · Amerinote Xchange · Seascape Capital

**Plus one to add:** Roc Capital (portfolio DSCR) — already cited in the threshold registry.

## 10. Priority order if time is short

1. Equity-share investment-property eligibility and subordinate-lien consent (6 companies) — unblocks the planner's biggest unknown.
2. DSCR seasoning / LTV / DSCR / partial-release terms (10 companies) — tightens every BRRRR and blanket stage.
3. Carrier direct/non-direct recognition and loan provisions (8) — decides the policy-loan converter numbers.
4. HELOC interest-calculation method and fees (8) — decides whether velocity works at all with that provider.
5. Servicer wrap handling and note-buyer seasoning (7).
6. Contact, BBB, reviews, CFPB, news for all 39.
