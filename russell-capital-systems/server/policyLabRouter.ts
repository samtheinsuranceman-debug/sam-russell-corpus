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
  MUTUAL_A_BASELINE,
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
    const cov = coiCoverage(MUTUAL_A_BASELINE);
    return {
      complete: [
        {
          carrierId: MUTUAL_A_BASELINE.carrierId,
          label: MUTUAL_A_BASELINE.carrierLabel,
          product: MUTUAL_A_BASELINE.product,
          source: MUTUAL_A_BASELINE.source,
          creditingTarget: MUTUAL_A_BASELINE.creditingTarget,
          percentOfPremiumByYear: MUTUAL_A_BASELINE.percentOfPremiumByYear,
          perPolicyMonthly: MUTUAL_A_BASELINE.perPolicyMonthly,
          perThousandAnnual: MUTUAL_A_BASELINE.perThousandAnnual,
          perThousandYears: MUTUAL_A_BASELINE.perThousandYears,
          indexedStrategyPctOfAv: MUTUAL_A_BASELINE.indexedStrategyPctOfAv,
          indexedStrategyFromYear: MUTUAL_A_BASELINE.indexedStrategyFromYear,
          surrenderPerThousandByYear: MUTUAL_A_BASELINE.surrenderPerThousandByYear,
          coi: { ...cov, rows: MUTUAL_A_BASELINE.coiPerThousandByAge },
          derivedFrom: MUTUAL_A_BASELINE.derivedFrom,
          caveats: MUTUAL_A_BASELINE.caveats,
        },
      ],
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
      })
    )
    .query(({ input }) => {
      const charges = chargesFromBaseline(MUTUAL_A_BASELINE);
      const cov = coiCoverage(MUTUAL_A_BASELINE);
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
          carrier: MUTUAL_A_BASELINE.carrierLabel,
          product: MUTUAL_A_BASELINE.product,
          source: MUTUAL_A_BASELINE.source,
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
