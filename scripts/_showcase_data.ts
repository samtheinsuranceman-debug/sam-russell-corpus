import { runTimeMachine, liquidityWindows, everyNthYear, breakEvenPerformanceFactor } from "../shared/timeMachine30";
import { HORIZON_ACCOUNTS, HORIZON_ILLUSTRATION_FACTS } from "../shared/pacificHorizonEcv";
import { writeFileSync } from "node:fs";

const BASE = {
  accountId: "ph-1yr",
  annualPremium: 200_000,
  premiumYears: 5,
  currentAge: 70,
  specifiedAmount: 8_583_171,
};

const deals = [11, 27, 43].map((seed) => {
  const r = runTimeMachine({ ...BASE, seed });
  return {
    seed,
    endingAccountValue: r.endingAccountValue,
    issueAge: r.issueAge,
    endingAge: r.endingAge,
    yearsFloored: r.yearsFloored,
    yearsCapped: r.yearsCapped,
    provenance: r.provenance,
    years: r.years.map((y) => ({
      policyYear: y.policyYear,
      attainedAge: y.attainedAge,
      sourceYear: y.sourceYear,
      rawReturnPct: y.rawReturnPct,
      creditedPct: Number(y.creditedPct.toFixed(2)),
      accountValue: y.accountValue,
      surrenderValue: y.surrenderValue,
      borrowable: y.borrowable,
      indexedCredit: y.indexedCredit,
      flooredThisYear: y.flooredThisYear,
      cappedThisYear: y.cappedThisYear,
    })),
  };
});

const primary = runTimeMachine({ ...BASE, seed: 11 });
const actual = runTimeMachine(BASE);

const out = {
  generatedAt: new Date().toISOString(),
  account: {
    id: primary.account.id,
    name: primary.account.name,
    cap: primary.account.currentCapPct,
    floor: primary.account.floorPct,
    participation: primary.account.currentParticipationPct,
  },
  facts: HORIZON_ILLUSTRATION_FACTS,
  inputs: BASE,
  actualOrder: {
    endingAccountValue: actual.endingAccountValue,
    yearsFloored: actual.yearsFloored,
    yearsCapped: actual.yearsCapped,
  },
  deals,
  liquidity: liquidityWindows(primary, 6).map((w) => ({
    policyYear: w.policyYear,
    attainedAge: w.attainedAge,
    borrowable: w.borrowable,
    creditEarnedAfterLoan: w.creditEarnedAfterLoan,
    creditPerDollarBorrowed: w.creditPerDollarBorrowed,
    yearsRemaining: w.yearsRemaining,
    plain: w.plain,
  })),
  milestones: everyNthYear(primary, 5),
  breakEven: breakEvenPerformanceFactor({ ...BASE, seed: 11 }, "performance-plus"),
  accountsAvailable: HORIZON_ACCOUNTS.map((a) => ({
    id: a.id,
    name: a.name,
    index: a.index,
    cap: a.currentCapPct,
    par: a.currentParticipationPct,
    floor: a.floorPct,
    charge: a.accountChargePctAnnual,
  })),
};

writeFileSync(process.argv[2] ?? "showcase-data.json", JSON.stringify(out, null, 2));
console.log("wrote", process.argv[2], "| deals:", deals.length, "| liquidity:", out.liquidity.length);
