// ============================================================
// THE PARTNER API — plain REST for front ends that are not this app.
//
// The rest of this server speaks tRPC, which is right for our own client and
// wrong for a WordPress plugin on somebody else's host. This is the small,
// read-only, bearer-authenticated REST surface that partner sites call:
// drasswealthmanagement.com today, others later.
//
// ## Three rules this file holds
//
// 1. Read-only. Every route is a GET. There is no write surface here at all,
//    so a compromised partner key cannot change anything in this system.
//
// 2. No aggregate crediting rate ever leaves this boundary. AG 49-A prohibits
//    displaying a geometric average credited rate above the maximum
//    illustrated rate, and the November 2025 amendment exists because a 2024
//    multi-state review found insurers doing it. The engine computes those
//    averages for internal use; this API strips them. Enforcing it here rather
//    than in the renderer means a partner who writes their own front end
//    cannot print the number either — they will not have it.
//
// 3. Both panels or neither. The time-machine route returns the AG 49
//    illustration and its required historical disclosure together, from one
//    engine call. An illustration without its disclosure is not a complete
//    exhibit, and shipping them separately is how two exhibits drift apart.
// ============================================================

import type { Express, Request, Response, NextFunction } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { generateDualIllustration } from "@shared/timeMachineEngine";
import { ALL_INDEX_OPTIONS, RAW_INDEX_RETURNS } from "@shared/indexCreditingData";
import { CLAIMS, builtClaims, claimCounts } from "@shared/patentCatalog";
import { APPLICATIONS, DRAFTED_COUNT, ENGINE_COUNT, statusBadge, statusSentence } from "@shared/patentStatus";
import { registerPartnerConcierge } from "./partnerConcierge";
import { runMonteCarlo } from "@shared/monteCarloEngine";
import { calculateTax, getStateCodes } from "@shared/taxBracketEngine";
import { calculateComprehensiveEstateTax } from "@shared/estateTaxEngine";
import { runMortgageKillerAnalysis } from "@shared/mortgageKiller";

/** Bearer key. Absent means the whole surface is off, not open. */
const KEY = () => (process.env.PARTNER_API_KEY ?? "").trim();

/** Comma-separated origins permitted to call from a browser. */
const ORIGINS = () =>
  (process.env.PARTNER_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Lowest number of years of history a table may be built from (AG 49-A). */
const MIN_HISTORY_YEARS = 10;

function clampInt(raw: unknown, lo: number, hi: number, fallback: number): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

function clampNum(raw: unknown, lo: number, hi: number, fallback: number): number {
  const n = Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Constant-time comparison of two secrets.
 *
 * `timingSafeEqual` refuses buffers of different lengths, and a bearer token
 * from a caller is arbitrary length — so hash both sides to a fixed 32 bytes
 * first and compare the digests. A digest comparison leaks nothing about the
 * key: an attacker who learns that byte 3 of SHA-256(guess) matches byte 3 of
 * SHA-256(key) learns nothing about the key itself, because they cannot walk
 * a preimage backwards one byte at a time the way they could walk a plaintext
 * `===` comparison.
 *
 * This is what the comment here previously claimed was happening. It was not;
 * the code did a plain `===`. The practical risk over HTTPS against a 256-bit
 * token was small, but a comment describing a mitigation that is not there is
 * worse than no comment, because the next reader believes it.
 */
function sameSecret(a: string, b: string): boolean {
  const da = createHash("sha256").update(a, "utf8").digest();
  const db = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(da, db);
}

/**
 * Bearer gate. Closed by default: with no PARTNER_API_KEY set the surface
 * answers 503 and explains, rather than serving openly. An API that silently
 * becomes public when a variable is unset is the failure nobody notices.
 */
function requireKey(req: Request, res: Response, next: NextFunction) {
  const expected = KEY();
  if (!expected) {
    res.status(503).json({
      error: "partner_api_not_configured",
      detail:
        "The partner API is disabled until PARTNER_API_KEY is set on this service. Set it, then call with Authorization: Bearer <that value>.",
    });
    return;
  }
  const header = String(req.headers.authorization ?? "");
  const [scheme, ...rest] = header.split(" ");
  const token = rest.join(" ").trim();
  const ok = scheme.toLowerCase() === "bearer" && token.length > 0 && sameSecret(token, expected);
  if (!ok) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="rcs-partner"');
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}

function cors(req: Request, res: Response, next: NextFunction) {
  const origin = String(req.headers.origin ?? "");
  if (origin && ORIGINS().includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

/** How many years of history this index actually has. Not a guess. */
function indexAgeYears(indexKey: string): number {
  const series = RAW_INDEX_RETURNS[indexKey];
  if (!series) return 0;
  const years = Object.keys(series).map(Number).filter(Number.isFinite);
  if (!years.length) return 0;
  return Math.max(...years) - Math.min(...years) + 1;
}

export function registerPartnerApi(app: Express): void {
  app.use("/api/partner", cors);

  // The public microphone. Same bearer gate, same read-only invariant.
  registerPartnerConcierge(app, requireKey);

  /** Whether the surface is wired. Deliberately unauthenticated and cheap: a
   *  partner needs to be able to tell "misconfigured" from "my key is wrong"
   *  without holding a valid key to find out. Reveals no data. */
  app.get("/api/partner/health", (_req, res) => {
    res.json({
      ok: true,
      service: "rcs-partner-api",
      configured: Boolean(KEY()),
      indices: Object.keys(RAW_INDEX_RETURNS),
      originsConfigured: ORIGINS().length,
    });
  });

  /**
   * The catalogue of engines a partner site may present.
   * GET /api/partner/catalog
   *
   * Returns only what is built. The partial, dropped and unbuilt entries stay
   * on this side of the wire: a partner marketing page listing 57 tools where
   * 18 do nothing is worse than one listing 39 that work, and the counts are
   * returned so the caller can see the difference is deliberate rather than a
   * truncated response.
   *
   * Internal file paths are not exposed, and neither are the catalogue's
   * `note` fields: those now carry the pre-filing review's findings about
   * which drafted claims recite hardware the system does not have, which is
   * attorney work product and nobody's business on a partner marketing page.
   * A partner needs to know a tool exists and what it is called.
   */
  app.get("/api/partner/catalog", requireKey, (req, res) => {
    const body: Record<string, unknown> = {
      counts: claimCounts(),
      // The one true sentence, sent over the wire so a partner front end
      // cannot compose its own. A partner writing "patent pending" on their
      // own page is the same exposure under 35 U.S.C. § 292 as writing it on
      // ours, and they have no way of knowing when that becomes true. So they
      // get the sentence and the badge, not the ingredients.
      ip: {
        statusSentence: statusSentence(),
        badge: statusBadge(),
        claims: ENGINE_COUNT,
        applicationsDrafted: DRAFTED_COUNT,
        applicationsFiled: APPLICATIONS.length,
      },
      offered: builtClaims().map((c) => ({ ref: c.ref, title: c.title })),
    };
    // ?include=roadmap adds the engines under development, clearly separated
    // and clearly labelled. A partner may want to show what is coming; what
    // they must not be able to do is present it as working, which is why it
    // arrives under its own key rather than mixed into `offered`.
    if (String(req.query.include ?? "") === "roadmap") {
      body.roadmap = CLAIMS.filter((c) => c.status === "partial").map((c) => ({
        ref: c.ref,
        title: c.title,
        status: "in development",
      }));
    }
    res.json(body);
  });

  /**
   * Raw index history — the educational view's data.
   * GET /api/partner/index-history?index=SP500&years=30
   */
  app.get("/api/partner/index-history", requireKey, (req, res) => {
    const indexKey = String(req.query.index ?? "SP500");
    const series = RAW_INDEX_RETURNS[indexKey];
    if (!series) {
      res.status(404).json({
        error: "unknown_index",
        detail: `No history is held for "${indexKey}".`,
        available: Object.keys(RAW_INDEX_RETURNS),
      });
      return;
    }

    const age = indexAgeYears(indexKey);
    if (age < MIN_HISTORY_YEARS) {
      // Refuse rather than serve a short series the caller might table.
      res.status(422).json({
        error: "index_too_young",
        detail: `This index has ${age} years of history. Backtested performance may not be shown for an index under ${MIN_HISTORY_YEARS} years old.`,
      });
      return;
    }

    const want = clampInt(req.query.years, MIN_HISTORY_YEARS, 40, 30);
    const all = Object.keys(series).map(Number).sort((a, b) => a - b);
    const chosen = all.slice(-want);

    res.json({
      index: indexKey,
      index_age_years: age,
      years: chosen.map((y) => ({ year: y, change: series[y] })),
      // Stated rather than assumed: the caller should label the column with
      // what the series is anchored to, and only this service knows.
      basis:
        "Annual index change as held by Russell Capital Systems. Confirm the segment anchor before labelling a public column.",
    });
  });

  /**
   * The Time Machine dual view.
   * GET /api/partner/time-machine?premium=25000&fundingYears=5&age=45&years=30&ag49Rate=6&index=SP500&startYear=1994
   */
  app.get("/api/partner/time-machine", requireKey, (req, res) => {
    const indexKey = String(req.query.index ?? "SP500");
    const age = indexAgeYears(indexKey);
    if (age < MIN_HISTORY_YEARS) {
      res.status(422).json({
        error: "index_too_young",
        detail: `This index has ${age} years of history; ${MIN_HISTORY_YEARS} are required.`,
      });
      return;
    }

    // Pick an index option carrying this underlying. The engine works from
    // carrier option definitions, not bare index keys, because the cap, floor
    // and participation live on the option.
    const option =
      ALL_INDEX_OPTIONS.find((o) => o.index === indexKey) ?? ALL_INDEX_OPTIONS[0];
    if (!option) {
      res.status(500).json({ error: "no_index_options_configured" });
      return;
    }

    const projectionYears = clampInt(req.query.years, MIN_HISTORY_YEARS, 40, 30);
    const ag49Rate = clampNum(req.query.ag49Rate, 0, 6.5, 6);

    let result;
    try {
      result = generateDualIllustration({
        premiumSchedule: {
          annualPremium: clampInt(req.query.premium, 0, 10_000_000, 25_000),
          fundingYears: clampInt(req.query.fundingYears, 1, 40, 5),
        },
        currentAge: clampInt(req.query.age, 0, 90, 45),
        projectionYears,
        boringRate: ag49Rate / 100,
        selectedIndexOptions: [option.id],
        historicalStartYear: clampInt(req.query.startYear, 1994, 2015, 1994),
        statedLoanRate: 0.05,
        actualArbitrageSpread: 0.005,
      });
    } catch {
      res.status(500).json({ error: "engine_error", detail: "The illustration engine did not complete." });
      return;
    }

    const raw = RAW_INDEX_RETURNS[indexKey] ?? {};

    // Both panels, mapped narrowly. Note what is NOT included: summary
    // averages, benchmark milestones and loan arbitrage figures all exist on
    // the engine result and none of them cross this boundary. The averages are
    // withheld for the AG 49-A reason above; the loan figures because a
    // partner site is not the place to publish them.
    res.json({
      indexAgeYears: age,
      ag49Rate,
      index: { id: option.id, name: option.name, carrier: option.carrier, underlying: option.index },
      boring: result.boring.map((r) => ({
        year: r.year,
        age: r.age,
        accountValue: Math.round(r.accountValue),
        surrenderValue: Math.round(r.surrenderValue),
      })),
      historical: result.historical.map((r) => ({
        year: r.year,
        calendarYear: r.calendarYear,
        indexChange: raw[r.calendarYear] ?? 0,
        // Engine stores the crediting rate as a decimal; partners render a
        // percentage. Convert here so no caller has to know the convention.
        creditedRate: Number((r.creditingRate * 100).toFixed(2)),
        accountValue: Math.round(r.accountValue),
        surrenderValue: Math.round(r.surrenderValue),
      })),
      floorProtectedYears: result.summary.historicalFloorProtectedYears,
      capLimitedYears: result.summary.historicalCapLimitedYears,
      notice:
        "Historical index changes shown in this illustration are not indicative of future returns.",
    });
  });

  // ── The calculators ───────────────────────────────────────────────────
  //
  // Three engines the partner site can run for a visitor. Each is a pure
  // function of its inputs: nothing is stored, no client record is created,
  // and no personally identifying field is accepted at all. A partner asking
  // "what tax does $400,000 of joint income pay in Texas" sends three values
  // and gets an answer; there is nothing here to breach.
  //
  // Every numeric input is clamped rather than trusted. An unclamped
  // simulation count is a denial-of-service knob, and an unclamped horizon
  // produces a table nobody asked for and a response nobody can render.
  //
  // The mortgage engine is exposed too, on terms. Its 27 fields looked like a
  // reason to withhold it; they are not, because the engine already defaults
  // twenty of them. Six values plus an age produce a complete analysis, and a
  // visitor who wants to supply their IUL crediting assumption or their HELOC
  // rate may. Answer as much or as little as you like.
  //
  // What does not move: the illustrated crediting rate is capped at 6.5% here
  // however high the caller asks, the same ceiling the time-machine route
  // applies, and the AG 49-A notice rides with every response. A partner
  // writing their own front end cannot raise the rate, because they are not
  // given the knob.
  //
  // Still NOT exposed: the lifetime-income engine. Its defaults name a
  // specific carrier product and assume 22-28% additional growth, and a
  // public page projecting that is a performance claim rather than a
  // calculation. That one needs its assumptions rebuilt before it can go
  // anywhere near a visitor.

  /**
   * Monte Carlo projection.
   * GET /api/partner/monte-carlo?initial=500000&years=30&return=7&volatility=15
   */
  app.get("/api/partner/monte-carlo", requireKey, (req, res) => {
    const q = req.query;
    const result = runMonteCarlo({
      simulations: clampInt(q.simulations, 200, 5000, 1000),
      years: clampInt(q.years, 1, 50, 30),
      initialValue: clampNum(q.initial, 0, 1e9, 500_000),
      expectedReturn: clampNum(q.return, -20, 30, 7) / 100,
      volatility: clampNum(q.volatility, 0, 60, 15) / 100,
      annualContribution: clampNum(q.contribution, -1e7, 1e7, 0),
      inflationRate: clampNum(q.inflation, 0, 20, 3) / 100,
    });
    res.json({
      summary: result.summary,
      // Bands, not the raw paths: twenty full simulation paths is a large
      // payload a chart does not need, and the percentile bands are what a
      // reader can actually interpret.
      bands: result.bands,
      basis:
        "A Monte Carlo projection is a distribution of modelled outcomes, not a forecast. " +
        "It assumes returns are normally distributed around the rate you entered, which real markets are not.",
    });
  });

  /**
   * Federal and state income tax for a household.
   * GET /api/partner/tax?income=400000&filing=married&state=TX
   */
  app.get("/api/partner/tax", requireKey, (req, res) => {
    // The engine's own vocabulary is single | joint | hoh. A partner form is
    // more likely to say "married", so both spellings are accepted and mapped
    // rather than silently falling back to single, which would understate the
    // standard deduction and overstate the tax for every married household.
    const filingRaw = String(req.query.filing ?? "single").toLowerCase();
    const filing =
      filingRaw === "joint" || filingRaw === "married" ? "joint"
      : filingRaw === "hoh" || filingRaw === "headofhousehold" ? "hoh"
      : "single";
    const state = String(req.query.state ?? "TX").toUpperCase().slice(0, 2);
    if (!getStateCodes().includes(state)) {
      res.status(400).json({
        error: "unknown_state",
        detail: `No rate is held for "${state}".`,
        available: getStateCodes(),
      });
      return;
    }
    res.json({
      ...calculateTax(clampNum(req.query.income, 0, 1e9, 0), filing, state),
      basis: "2026 federal brackets and the state's top marginal rate. An estimate, not tax advice.",
    });
  });

  /**
   * Federal estate tax and what reaches the heirs.
   * GET /api/partner/estate-tax?estate=30000000&filing=married&deathBenefit=5000000&ilit=true
   */
  app.get("/api/partner/estate-tax", requireKey, (req, res) => {
    const estate = clampNum(req.query.estate, 0, 1e11, 0);
    const r = calculateComprehensiveEstateTax({
      // The engine itemises by asset class; a public form asks for one number,
      // so the whole estate arrives as one line rather than inventing a split.
      assets: {
        realEstate: 0, investments: estate, retirementAccounts: 0, businessInterests: 0,
        lifeInsurance: 0, cashAndSavings: 0, personalProperty: 0, otherAssets: 0,
      },
      deductions: {
        maritalDeduction: 0,
        charitableDeduction: clampNum(req.query.charity, 0, 1e11, 0),
        debtsAndMortgages: clampNum(req.query.debts, 0, 1e11, 0),
        funeralExpenses: 0, adminExpenses: 0, stateDeathTaxDeduction: 0,
      },
      iulDeathBenefit: clampNum(req.query.deathBenefit, 0, 1e10, 0),
      useILIT: String(req.query.ilit ?? "") === "true",
      gifting: { annualGiftsPerRecipient: 0, numberOfRecipients: 0, yearsOfGifting: 0, lifetimeGiftsUsed: 0 },
      filingStatus: String(req.query.filing ?? "married") === "single" ? "single" : "married",
      spouseEstateValue: 0,
      year: clampInt(req.query.year, 2024, 2035, new Date().getFullYear()),
      currentAge: clampInt(req.query.age, 18, 110, 65),
      growthRate: clampNum(req.query.growth, 0, 20, 6) / 100,
      spouseAge: clampInt(req.query.spouseAge, 18, 110, 65),
      numberOfBeneficiaries: clampInt(req.query.beneficiaries, 1, 50, 2),
    });
    res.json({
      grossEstate: r.grossEstate,
      exemption: r.exemption,
      taxableEstate: r.taxableEstate,
      federalEstateTax: r.federalEstateTax,
      effectiveRate: r.effectiveRate,
      netToHeirs: r.netToHeirs,
      estateShrinkagePercent: r.estateShrinkagePercent,
      basis:
        "Federal estate tax only. State estate and inheritance taxes are not included and apply in several states. " +
        "An estimate, not legal or tax advice.",
    });
  });

  /**
   * Mortgage elimination: what the mortgage costs as it stands, and what an
   * accelerated plan does to it.
   * GET /api/partner/mortgage?balance=650000&rate=6.75&termMonths=360&payment=4216&homeValue=900000&income=450000&age=45
   *
   * Six values and an age are enough. Everything else — assets held, premium
   * allocation, HELOC rate, policy-loan drag, reinvestment assumptions — has a
   * default in the engine and is accepted here if the caller wants to supply
   * it.
   */
  app.get("/api/partner/mortgage", requireKey, (req, res) => {
    const q = req.query;
    const balance = clampNum(q.balance, 0, 1e8, 0);
    const homeValue = clampNum(q.homeValue, 0, 1e9, 0);
    if (balance <= 0 || homeValue <= 0) {
      res.status(400).json({
        error: "missing_inputs",
        detail: "A mortgage balance and a home value are required. The rest have defaults.",
        required: ["balance", "rate", "termMonths", "payment", "homeValue", "income", "age"],
      });
      return;
    }

    const r = runMortgageKillerAnalysis({
      mortgageBalance: balance,
      mortgageRate: clampNum(q.rate, 0.01, 25, 6.75) / 100,
      mortgageTermMonths: clampInt(q.termMonths, 12, 480, 360),
      monthlyMortgagePayment: clampNum(q.payment, 1, 1e6, 0),
      homeMarketValue: homeValue,
      annualIncome: clampNum(q.income, 0, 1e8, 0),
      clientAge: clampInt(q.age, 18, 90, 45),

      // Required by the type, unused by the analysis. Passed explicitly rather
      // than cast away, so a future engine that starts reading them fails the
      // typecheck here instead of silently reading zero.
      monthlyInterestOnlyPayment: 0,
      totalInterestPayments: 0,
      homeEquityValue: Math.max(0, homeValue - balance),

      // Optional, and genuinely optional: each is the engine's own default
      // when the caller says nothing.
      iraValue: clampNum(q.ira, 0, 1e9, 0),
      cashValue: clampNum(q.cash, 0, 1e9, 0),
      investments: clampNum(q.investments, 0, 1e9, 0),
      annuities: clampNum(q.annuities, 0, 1e9, 0),
      otherInvestments: clampNum(q.other, 0, 1e9, 0),
      cryptocurrency: clampNum(q.crypto, 0, 1e9, 0),
      incomeAllocationPct: clampNum(q.allocationPct, 1, 50, 20) / 100,
      // AG 49-A: the ceiling is ours, not the caller's.
      iulCreditRate: clampNum(q.creditRate, 0, 6.5, 6) / 100,
      helocRate: clampNum(q.helocRate, 0, 25, 8.5) / 100,
    });

    res.json({
      current: {
        totalInterest: Math.round(r.currentPlan.totalInterest),
        payoffMonths: r.currentPlan.payoffMonths,
        payoffDate: r.summary.originalPayoffDate,
      },
      accelerated: {
        totalInterest: Math.round(r.recommendedPlan.totalInterest),
        payoffMonths: r.recommendedPlan.payoffMonths,
        payoffDate: r.summary.mortgageFreeDate,
      },
      saved: {
        interest: Math.round(r.summary.totalInterestSaved),
        years: r.summary.yearsSaved,
        months: r.summary.monthsSaved,
      },
      policy: {
        annualPremium: Math.round(r.summary.annualIulPremium),
        totalPremiums: Math.round(r.summary.totalIulPremiums),
        totalPolicyLoans: Math.round(r.summary.totalPolicyLoans),
        finalCashValue: Math.round(r.summary.finalPolicyCashValue),
      },
      // The year-by-year table, not the 360-row monthly schedules. A partner
      // page cannot render 720 rows and no reader wants them.
      byYear: r.cascadingProjection.map((y) => ({
        year: y.year,
        mortgageBalance: Math.round(y.mortgageBalance),
        // The surrender value, not the account value: it is what the
        // policyholder could actually take, and the two differ by the
        // surrender charge for a decade or more.
        policySurrenderValue: Math.round(y.iulSurrenderValue),
        helocBalance: Math.round(y.helocBalance),
        netWorth: Math.round(y.netWorth),
      })),
      basis:
        "An illustration, not a promise. Indexed crediting is capped at 6.5% here and is not guaranteed; " +
        "actual credited rates vary with the index and the carrier's declared cap, and may be zero in a year the index falls. " +
        "Historical index changes are not indicative of future returns. Borrowing against a policy reduces its cash value " +
        "and death benefit, and a policy that lapses with a loan outstanding can create a taxable event.",
    });
  });
}
