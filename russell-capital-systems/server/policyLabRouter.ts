// ============================================================
// THE POLICY COST LAB — tRPC.
//
// Seven engines were built and tested and then reached nobody: the cost
// structure derived from a real Annual Cost Summary, the mortality curve read
// off it, the loan mechanics, the statutory corridor, the multiplier. Correct
// code that no human could see is not a feature. This router is the seam.
//
// Nothing here takes client data, so every procedure is public. What it serves
// is carrier structure and arithmetic, not anybody's case.
// ============================================================
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  COMPLETE_BASELINES,
  MUTUAL_A_BASELINE,
  MUTUAL_B_BASELINE,
  PENDING_BASELINES,
  MULTI_INDEX_BLEND,
  type CostBaseline,
} from "@shared/costStructure";
import {
  runPolicyMechanics,
  type PolicyCharges,
} from "@shared/policyMechanics";
import {
  runPolicyLoanMechanics,
  yearsToCrossover,
  type LoanType,
} from "@shared/policyLoanMechanics";
import { applicablePercentage, VERIFIED_AGAINST_PRIMARY_TEXT, CORRIDOR_AUTHORITY } from "@shared/irc7702";
import { UNPRICED_PARAMETERS, rankedFor } from "@shared/unpricedParameters";
import { EPFR_DESIGNS } from "@shared/pacificHorizonEcv";
import {
  SEGMENT_ACCOUNTS,
  summarizeWindow,
  type SegmentTerms,
} from "@shared/balancedIndexedAccount";
import { RAW_INDEX_RETURNS, MIN_YEAR, MAX_YEAR } from "@shared/indexCreditingData";
import { provenanceWarning, checkSeriesAgainstPublishedClaims, SP500_SERIES_VERIFIED } from "@shared/sp500SeriesAudit";

/** Mutual Company A's baseline, in the shape the projection engine takes. */
export function chargesFromBaseline(b: CostBaseline): PolicyCharges {
  return {
    premiumLoadPctByYear: [...b.percentOfPremiumByYear],
    monthlyPolicyFee: b.perPolicyMonthly,
    perUnitMonthlyPerThousand: b.perThousandAnnual / 12,
    perUnitYears: b.perThousandYears,
    coiTable: b.coiPerThousandByAge.map((c) => ({ age: c.age, perThousand: c.perThousand })),
    coiTableSource: b.source,
    surrenderChargePctByYear: [],
    surrenderChargePerThousandByYear: [...b.surrenderPerThousandByYear],
  };
}

/**
 * The mortality curve only covers the ages the cost summary printed — 64 to 83
 * on the case it came from. Outside that range the engine falls back to the
 * first or last row, which is a real extrapolation and is reported rather than
 * hidden.
 */
function coiCoverage(b: CostBaseline) {
  const ages = b.coiPerThousandByAge.map((c) => c.age);
  return { fromAge: Math.min(...ages), toAge: Math.max(...ages) };
}

export const policyLabRouter = router({
  /** What each of the three companies is known to charge, and what is still absent. */
  carriers: publicProcedure.query(() => {
    return {
      // A first (the page's default basis), then B, each read off its own
      // cost summary.
      complete: COMPLETE_BASELINES.map((b) => ({
        carrierId: b.carrierId,
        label: b.carrierLabel,
        product: b.product,
        source: b.source,
        creditingTarget: b.creditingTarget,
        percentOfPremiumByYear: b.percentOfPremiumByYear,
        perPolicyMonthly: b.perPolicyMonthly,
        perThousandAnnual: b.perThousandAnnual,
        perThousandYears: b.perThousandYears,
        indexedStrategyPctOfAv: b.indexedStrategyPctOfAv,
        indexedStrategyFromYear: b.indexedStrategyFromYear,
        bonusInterestPctOfCashValue: b.bonusInterestPctOfCashValue ?? null,
        bonusInterestFromYear: b.bonusInterestFromYear ?? null,
        surrenderPerThousandByYear: b.surrenderPerThousandByYear,
        coi: { ...coiCoverage(b), rows: b.coiPerThousandByAge },
        derivedFrom: b.derivedFrom,
        caveats: b.caveats,
      })),
      pending: PENDING_BASELINES.map((p) => ({
        carrierId: p.carrierId,
        label: p.carrierLabel,
        creditingTarget: p.creditingTarget,
        creditingTargetSource: p.creditingTargetSource,
        chargeNamesKnown: p.chargeNamesKnown,
        ratesKnown: p.ratesKnown,
      })),
      multiIndexBlend: MULTI_INDEX_BLEND,
      /** The multiplier's real factors, so the trade can be shown with numbers. */
      multiplierDesigns: EPFR_DESIGNS,
    };
  }),

  /**
   * Run a policy on a real charge structure.
   *
   * This is the first procedure on the platform that projects a policy using
   * charges that came off a carrier document rather than out of a band.
   */
  project: publicProcedure
    .input(
      z.object({
        issueAge: z.number().min(18).max(85).default(63),
        faceAmount: z.number().min(50_000).max(50_000_000).default(4_755_883),
        annualPremium: z.number().min(0).max(5_000_000).default(480_000),
        premiumYears: z.number().min(1).max(40).default(5),
        years: z.number().min(5).max(60).default(30),
        creditedRatePct: z.number().min(0).max(12).default(6.75),
        /** Which carrier's cost summary drives the charges. */
        carrierId: z.enum(["mutual-a", "mutual-b"]).default("mutual-a"),
      })
    )
    .query(({ input }) => {
      const baseline = input.carrierId === "mutual-b" ? MUTUAL_B_BASELINE : MUTUAL_A_BASELINE;
      const charges = chargesFromBaseline(baseline);
      const cov = coiCoverage(baseline);
      const result = runPolicyMechanics({
        issueAge: input.issueAge,
        faceAmount: input.faceAmount,
        annualPremium: input.annualPremium,
        premiumYears: input.premiumYears,
        years: input.years,
        charges,
        creditedRatePctByYear: Array.from({ length: input.years }, () => input.creditedRatePct),
      });

      // A one-year convention difference, worth stating rather than hiding.
      // runPolicyMechanics labels policy year 1 with the ISSUE age; the
      // illustration the curve came from labels year 1 with issue age PLUS
      // one — its first row is "age 64" for an issue age of 63. So an engine
      // lookup at the issue age falls one below the table, resolves to the
      // first row, and charges exactly the rate that row was derived for.
      // The value is right; only the label differs. The low bound is
      // therefore fromAge - 1, not fromAge — anything below that really is
      // outside the evidence.
      const firstAge = input.issueAge;
      const lastAge = input.issueAge + input.years - 1;
      const extrapolated = firstAge < cov.fromAge - 1 || lastAge > cov.toAge;

      return {
        ...result,
        basis: {
          carrier: baseline.carrierLabel,
          product: baseline.product,
          source: baseline.source,
          coiCoverage: cov,
          /**
           * The curve was read off one case. Running outside its age range, or
           * for a different sex or class, is extrapolation — stated, because a
           * projection that quietly reuses one person's mortality for another
           * is the failure this whole exercise was about.
           */
          extrapolatedBeyondCoiTable: extrapolated,
          extrapolationNote: extrapolated
            ? `The mortality curve covers attained ages ${cov.fromAge} to ${cov.toAge}. This projection runs ages ${firstAge} to ${lastAge}, so outside that band the first or last rate is held flat. It is also a curve for one sex and one underwriting class.`
            : null,
        },
      };
    }),

  /** What a loan actually does — the three types side by side on the same policy. */
  loans: publicProcedure
    .input(
      z.object({
        startingCashValue: z.number().min(0).max(50_000_000).default(2_600_000),
        annualDraw: z.number().min(0).max(2_000_000).default(150_000),
        years: z.number().min(5).max(40).default(25),
        attainedAge: z.number().min(30).max(90).default(73),
        creditedRatePct: z.number().min(0).max(12).default(6.75),
        chargedRatePct: z.number().min(0).max(10).default(5),
        collateralCreditRatePct: z.number().min(0).max(10).default(3),
        cumulativePremiumsPaid: z.number().min(0).max(50_000_000).default(2_100_000),
        isMec: z.boolean().default(false),
        ordinaryIncomeRatePct: z.number().min(0).max(50).default(37),
        chargedInAdvance: z.boolean().default(false),
      })
    )
    .query(({ input }) => {
      // A policy that simply grows, so the loan overlay is what is on show.
      const states = Array.from({ length: input.years }, (_, i) => {
        const value = input.startingCashValue * Math.pow(1 + input.creditedRatePct / 100, i + 1);
        return {
          policyYear: i + 1,
          attainedAge: input.attainedAge + i + 1,
          accountValue: value,
          surrenderValue: value,
          creditedRatePct: input.creditedRatePct,
          loanTaken: input.annualDraw,
        };
      });

      const tax = {
        cumulativePremiumsPaid: input.cumulativePremiumsPaid,
        isMec: input.isMec,
        ownerAgeAtStart: input.attainedAge,
        ordinaryIncomeRatePct: input.ordinaryIncomeRatePct,
      };

      const run = (type: LoanType) =>
        runPolicyLoanMechanics(
          states,
          {
            type,
            chargedRatePct: input.chargedRatePct,
            collateralCreditRatePct: input.collateralCreditRatePct,
            inArrears: !input.chargedInAdvance,
          },
          tax
        );

      return {
        wash: run("wash"),
        fixed: run("fixed"),
        participating: run("participating"),
        crossoverYears: yearsToCrossover(
          input.annualDraw,
          input.startingCashValue,
          input.chargedRatePct,
          input.creditedRatePct
        ),
      };
    }),

  /** The statutory corridor, so the page can show why a funded policy's death benefit climbs. */
  corridor: publicProcedure.query(() => ({
    authority: CORRIDOR_AUTHORITY,
    verifiedAgainstPrimaryText: VERIFIED_AGAINST_PRIMARY_TEXT,
    byAge: Array.from({ length: 56 }, (_, i) => {
      const age = 40 + i;
      return { age, applicablePercentage: Math.round(applicablePercentage(age) * 100) / 100 };
    }),
  })),

  /**
   * The multi-year index segments, over any window the viewer chooses.
   *
   * The window steps one year at a time — from 1994 to the last year of the
   * series — so a client can walk back through the record rather than being
   * shown one flattering stretch. Every row carries its segment term and its
   * annualized equivalent, because a two-year credit of 48% is 21.64% a year
   * and the two must never be read as the same number.
   */
  segments: publicProcedure
    .input(
      z
        .object({
          accountId: z.string().default("bia-2yr"),
          fromYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR).default(MAX_YEAR - 6),
          toYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR).default(MAX_YEAR),
          /** Counted against the SEGMENT credit, which is how the claim is made. */
          thresholdPct: z.number().min(0).max(200).default(40),
        })
        .default(() => ({
          accountId: "bia-2yr",
          fromYear: MAX_YEAR - 6,
          toYear: MAX_YEAR,
          thresholdPct: 40,
        }))
    )
    .query(({ input }) => {
      const account =
        SEGMENT_ACCOUNTS.find((a) => a.id === input.accountId) ??
        (SEGMENT_ACCOUNTS[0] as SegmentTerms);
      const fromYear = Math.min(input.fromYear, input.toYear);
      const toYear = Math.max(input.fromYear, input.toYear);
      const series = RAW_INDEX_RETURNS.SP500;

      return {
        seriesRange: { from: MIN_YEAR, to: MAX_YEAR },
        /**
         * The series these figures are computed from does not reconcile to the
         * carrier's own published claims about the S&P 500. The method is
         * right; the inputs are not established. Surfaced rather than buried —
         * a figure whose provenance is unknown must say so on the same screen.
         */
        seriesProvenance: {
          verified: SP500_SERIES_VERIFIED,
          warning: provenanceWarning(series),
          checks: checkSeriesAgainstPublishedClaims(series),
        },
        accounts: SEGMENT_ACCOUNTS.map((a) => ({
          id: a.id,
          name: a.name,
          carrierLabel: a.carrierLabel,
          termYears: a.termYears,
          participationPct: a.participationPct,
          spreadPct: a.spreadPct,
          capPct: a.capPct,
          floorPct: a.floorPct,
          sourced: a.sourced,
          source: a.source,
          note: a.note ?? null,
        })),
        selected: account.id,
        /** Every account over the same window, so they are compared like for like. */
        windows: SEGMENT_ACCOUNTS.map((a) => ({
          accountId: a.id,
          ...summarizeWindow(a, series, fromYear, toYear, input.thresholdPct),
        })),
        /** The raw index years in the window, so the segment arithmetic is checkable. */
        indexByYear: Array.from({ length: toYear - fromYear + 1 }, (_, i) => ({
          year: fromYear + i,
          returnPct: series[fromYear + i] ?? null,
        })),
      };
    }),

  /** What still cannot be priced, ranked by what closing it is worth. */
  gaps: publicProcedure
    .input(z.object({ design: z.enum(["maxFunded", "midFunded", "thin"]).default("maxFunded") }).default(() => ({ design: "maxFunded" as const })))
    .query(({ input }) => ({
      design: input.design,
      ranked: rankedFor(input.design).map((p) => ({
        id: p.id,
        label: p.label,
        status: p.status,
        swingPct: p.swingPct[input.design],
        closedBy: p.closedBy,
        whyNotGuessable: p.whyNotGuessable,
      })),
      total: UNPRICED_PARAMETERS.length,
    })),
});
