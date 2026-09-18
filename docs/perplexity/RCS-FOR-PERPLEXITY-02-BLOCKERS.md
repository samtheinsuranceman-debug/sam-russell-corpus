# RUSSELL CAPITAL SYSTEMS — BRIEFING FOR PERPLEXITY
## 02 — WHERE THE WORK GOT STUCK, AND WHAT UNBLOCKS IT

Each entry states the problem honestly, what was tried, and the specific action that finishes it. Several of these are jobs Perplexity is better placed to do than a coding agent — those are marked **→ PERPLEXITY**.

---

### 1. Sandbox could not reach the government data hosts

**What happened.** The adapters for HUD (huduser.gov), Census (api.census.gov) and FRED (fred.stlouisfed.org) were written and unit-tested against the real file layouts, but every live request from the build sandbox returned an empty response. Eviction Lab's S3 bucket was reachable; the others were not. This is an egress restriction in the build environment, not a bug in the adapters.

**What unblocks it.** Run the first real sweep from an environment that can reach them — the Railway production container, or a local machine. Set `RENTAL_DATA_DAYS=30`, `ZIP_DATA_DAYS=30`, and `CENSUS_API_KEY`, then call the `rentalMarket.refresh` mutation (owner-only) or wait for the boot schedule. Verify afterwards by reading `rentalMarket.status` and `zip.status` from outside — they report, per series, the earliest year, the latest as-of date, and the row count.

**Do not** conclude the adapters are broken because the sandbox returned nothing. Confirm from a reachable host first.

---

### 2. Rent by **bathroom count** does not exist in any public dataset

**What happened.** The owner asked for rents across specific bedroom/bathroom configurations — 2br/1ba versus 2br/2ba, 4br/1ba through 4br/4ba, and so on. Bedroom counts are well covered. **No United States statistical agency has ever collected rent by bathroom count.** HUD's Fair Market Rents are published by bedroom count only. The Census ACS gross-rent tables are by bedroom count only. There is no series to wire.

**What was done instead.** Every configuration row returns a real bedroom-based rent with its source, and a `bathroomAdjustment` of `null` carrying the explicit reason. The matrix the owner asked for is rendered in full — it simply tells the truth in the bathroom column rather than inventing a multiplier.

**What would finish it, if the owner wants a number there.**
- **Option A (current, and the honest default):** leave it null with the reason shown.
- **Option B:** license listing-level data — Zillow Rental Network, CoStar, Apartments.com, or RentCafe — where individual listings carry both bedroom and bathroom counts. This is a commercial contract, not a coding task.
- **Option C:** build an owner-curated adjustment table with a cited source per row and a visible "not a public statistic" label.

**→ PERPLEXITY:** confirm or refute this finding independently. If a public series with rent by bathroom count exists anywhere — a state housing agency, a university housing survey, a metropolitan planning organisation — name it with a URL and its coverage window. A negative answer is a useful answer; say so plainly.

---

### 3. Security deposits have no 36-year time series

**What happened.** The owner asked for 36 years of security-deposit history. Deposits are not a measured economic series — they are **statute**. Each state caps them (commonly one or two months' rent, some states uncapped), sets a return deadline (14 to 60 days), and some require interest to be paid to the tenant. There is nothing to chart; there is something to tabulate.

**What finishes it.** A 50-state rules table in the same shape as the divorce rules table already in the codebase, with one row per state carrying: the cap expressed in months' rent (or "no statutory cap"), the return deadline in days, whether interest is required and at what rate, any separate-account requirement, the statute citation, and an as-of date. Plus a `RULES_VERSION` and a `neverPrinted` list of claims the table must never be used to support.

**→ PERPLEXITY — this is a direct research job.** For all 50 states plus DC, return JSON rows of exactly this shape, each field verified against the **primary statute text**, not a summary site, not a landlord blog, not memory:

```json
{
  "state": "NC",
  "capMonths": 2.0,
  "capNote": "1.5 months for month-to-month; 2 months for terms longer than month-to-month",
  "returnDeadlineDays": 30,
  "interestRequired": false,
  "separateAccountRequired": true,
  "statuteCitation": "N.C. Gen. Stat. § 42-50 to § 42-56",
  "sourceUrl": "https://www.ncleg.gov/...",
  "asOf": "2026-09-18"
}
```

If a field cannot be verified from the statute, return `null` for it and put the reason in a `notes` field. Do not fill a gap with a plausible number.

---

### 4. Tenant length of stay — the adapter is not written

**What happened.** The data exists. The Census **American Housing Survey** publishes "year householder moved into unit", nationally and for selected metropolitan areas, biennially from 1985. That is 40 years of tenure data. The adapter to pull it into `rental_series` simply has not been built yet.

**What finishes it.** Write the adapter against the AHS table files, store as a `tenure_years` series keyed by geography, and expose it through `rentalMarket.tenure`. Straightforward work, maybe half a day.

**→ PERPLEXITY (helpful, not required):** confirm the current AHS table identifiers and download URLs for "year moved in" across the 1985–2025 series, and whether metropolitan-level files are available for all years or only selected ones.

---

### 5. Perplexity's own deep-research tool timed out

**What happened.** The `perplexity_research` endpoint was called twice from the build session and timed out at sixty seconds both times. Exa was used as a substitute for source verification.

**What works better.** Break the question into smaller pieces and use the faster ask/search endpoints, or run the research inside Perplexity Computer where a long job has room to finish. The provider-verification brief in the repo already has a JSON return schema designed for exactly this.

---

### 6. Two constants disagree about the maximum illustrated rate

**What happened.** `shared/mortgageKiller.ts:14` carries 7.5% as an AG 49-A maximum illustrated rate. `shared/pacificHorizonEcv.ts:88` carries 6.35% for the Pacific Horizon ECV product. These cannot both be the cap for the same illustration. The 7.5% appears to be a loan charge rate that was conflated with a crediting cap at some point.

**What finishes it.** AG 49-A maximum illustrated rates are **product-specific** — calculated by each carrier's illustration actuary from that product's own index parameters. There is no single industry number. Build a per-product table holding each product's current maximum illustrated rate, its effective date, and the carrier's disclosure document as the source. The engine reads the product's cap; no global constant survives.

**→ PERPLEXITY:** for each product the platform illustrates, find the carrier's current published maximum illustrated rate under AG 49-A, with the disclosure document URL and its effective date. Where a carrier does not publish it, say so — that is a real finding and means the product cannot be illustrated until the carrier supplies it.

---

### 7. A shell quirk caused two commits to claim work that had not landed

**What happened.** In this build environment, `set -e` does not abort on a failing Python heredoc. Two early commits therefore described changes that had not actually been written to disk.

**How it was handled.** Corrected forward with explicit commits stating the false claim. Every subsequent commit was gated by checking the actual tool output, then `pnpm check`, then `pnpm test`, before committing.

**The lesson for whoever continues:** verify the file changed before you describe it as changed. Read the diff, do not trust the script's exit code.

---

### 8. Adding a route quietly breaks three tests

**What happened.** The trunk enforces its own coherence. Adding a page route without the matching nav entry fails `navigation-organization.test.ts`; without bumping the expected counts it fails `managed-port.smoke.test.ts` and `grok-merge.smoke.test.ts`; a schema change without regenerating the SQL file fails `databaseSchemaFile.test.ts`. This cost two rounds of rework during the harvest.

**The rule for whoever continues:** after adding any route, run

```bash
pnpm test -- navigation-organization managed-port grok-merge databaseSchemaFile
```

before running the full suite. These guards are a feature — they are what keeps 330 routes coherent.

---

### 9. The colours-and-textures interface the owner could not find

**What happened.** The owner remembered building a distinctive UI with different colours and textures and could not recall which build held it. Three candidates were found and all three are now in the BASE: the **Patent360 design system**, five **homepage concept images** at `client/public/concepts/` (one general, four physician-facing), and the **cinematic layer** harvested in commit `412cf84`.

**What finishes it.** An owner decision: pick one as the default. Once chosen, applying it site-wide is mechanical.

---

### 10. Gate password versus OAuth

**What happened.** The 688-page build was gated behind a shared password (`Welcome1@1`). The production trunk uses OAuth only. The password was deliberately not ported.

**What finishes it.** An owner decision. If he wants a shared-passphrase gate, it should read from an environment variable — never a literal committed to the repository.

---

### 11. Account aggregation does not exist

**What happened.** Every projection on the platform runs from typed inputs. There is no connection to real bank, brokerage or retirement accounts.

**Why it matters.** This is the largest functional gap against JP Morgan, Edward Jones and similar incumbents. A household that has to type its balances will type them once and never update them; a household whose accounts are connected sees a living plan.

**What finishes it.** This is a product and compliance decision before it is a coding one: choose an aggregator (Plaid, MX, or Yodlee), settle custody and consent, then build. Not a task an AI can complete unilaterally.

**→ PERPLEXITY (useful research):** current pricing, data coverage and compliance requirements for Plaid versus MX versus Yodlee for a registered investment advisor or insurance-licensed platform, with sources.

---

### Summary — what Perplexity can finish that a coding agent cannot

1. **Provider verification for 39 providers + Roc Capital** (`docs/PROVIDER_VERIFICATION_BRIEF.md`) — the highest-value job on the list.
2. **50-state security-deposit statutes** in the JSON shape above.
3. **AG 49-A maximum illustrated rates per product**, from carrier disclosures.
4. **Equity-share investment-property eligibility** at Point, Hometap, Unison, Unlock and Splitero — specifically whether each permits a non-owner-occupied property and whether each consents to a subordinate lien. This single fact changes the legal option space for every portfolio owner on the platform.
5. **Kiavi and Griffin 90-day seasoning** — currently supported only by market-comparison sites. Confirm on the lenders' own pages or leave it marked unverified.
6. **Confirm or refute** the "no public bathroom-level rent data" finding.
7. **Account-aggregation vendor comparison.**

For every one of these: a cited, dated primary source, or an explicit "not found." Never a plausible guess.

**Next file: 03 — THE 10/10 PAGE CONTRACT.**
