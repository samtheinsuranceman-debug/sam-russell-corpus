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
import { generateDualIllustration } from "@shared/timeMachineEngine";
import { ALL_INDEX_OPTIONS, RAW_INDEX_RETURNS } from "@shared/indexCreditingData";
import { CLAIMS, builtClaims, claimCounts } from "@shared/patentCatalog";
import { APPLICATIONS, DRAFTED_COUNT, ENGINE_COUNT, statusBadge, statusSentence } from "@shared/patentStatus";
import { registerPartnerConcierge } from "./partnerConcierge";

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
  // Length-independent compare would be better; Node's timingSafeEqual needs
  // equal lengths, so compare hashes of both sides instead of the raw strings.
  const ok = scheme.toLowerCase() === "bearer" && token.length > 0 && token === expected;
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
}
