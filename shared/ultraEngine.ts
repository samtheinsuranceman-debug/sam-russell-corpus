// ============================================================
// ULTRA CALCULATOR ENGINE — one deterministic engine that chains
// every RCS calculator concept across multi-year windows.
//
// Design contract:
// - PURE and deterministic: same inputs → same outputs, no I/O.
// - WINDOWED: the timeline is split into windows (5/10/20/30 yrs
//   or any custom length). Each window carries its own goals and
//   parameter overrides; every window STARTS from the previous
//   window's ending state — income, expenses, assets, debts,
//   properties, IUL values all carry forward automatically.
// - MODULAR: each calculator is a toggleable module. The engine
//   runs whichever modules are enabled and reports per-module
//   contributions so the UI (and the AI advisor) can explain them.
//
// HONESTY: every number is a PROJECTION under stated assumptions —
// not a guarantee, not tax/legal/investment advice. Rate fields are
// user assumptions, clearly labeled. Nothing here invents returns.
// ============================================================

export type ExpenseChange = { atYear: number; newAnnualExpenses: number };

export type DebtInput = { name: string; balance: number; ratePct: number; paymentAnnual: number };

export type ClientProfile = {
  clientAge: number;
  spouseAge?: number | null;
  incomeSelfAnnual: number;
  incomeSpouseAnnual: number;
  otherIncomeAnnual: number; // itemized "other" household income
  incomeGrowthPct: number; // assumed raises, % per year
  baseHouseholdExpensesAnnual: number;
  // "Is it likely to change in 5 / 10 / 20 years, and how":
  expenseChanges: ExpenseChange[];
  effectiveTaxRatePct: number; // blended household assumption
  taxableAssets: number;
  qualifiedAssets: number; // 401k/IRA-style
  cashReserves: number;
  home: {
    value: number;
    mortgageBalance: number;
    mortgageRatePct: number;
    mortgagePaymentAnnual: number;
  };
  otherDebts: DebtInput[]; // student loans, long-term loans
};

export type UltraModules = {
  investmentGrowth: {
    enabled: boolean;
    growthPct: number; // assumed portfolio growth
    savingsRatePctOfNetCash: number; // % of yearly net cash invested
  };
  mortgageKiller: {
    enabled: boolean;
    cycleYears: number; // typically 6–7: each cycle retires one property's debt
    extraPrincipalPctOfNetCash: number; // % of net cash aimed at the active mortgage
  };
  realEstate: {
    enabled: boolean;
    appreciationPctDefault: number; // % per year
    // Optional per-cycle overrides: appreciation can change each 6–7yr increment.
    appreciationPctPerCycle: number[]; // [cycle0, cycle1, ...]; falls back to default
    rentalMode: "str" | "ltr" | "live"; // short-term rental | long-term rental | live in it
    strGrossReceiptsPctOfValue: number; // 0–100: STR gross receipts as % of home value/yr
    strExpenseRatioPct: number; // % of gross receipts consumed by operating costs
    ltrNetYieldPctOfValue: number; // long-term rental net yield
  };
  equityDeployment: {
    enabled: boolean;
    pctOfHomeEquityDeployed: number; // how much home equity is actively deployed
    // Deployed equity flows through trust-owned IUL first (protection layer),
    // per the strategy: divorce/creditor protection + tax-advantaged growth.
    flowsThroughTrustIUL: boolean;
  };
  trustIUL: {
    enabled: boolean;
    premiumAnnual: number;
    premiumYears: number;
    creditRatePct: number; // assumed crediting rate
    incomeRatePct: 2 | 4; // tax-free income draw: 4% or 2% of cash value
    incomeStartYear: number; // years from now
    chronicIllnessMultiple: number; // face-amount access = 12 × annual premium
  };
  incomeAnnuity: {
    enabled: boolean;
    premium: number;
    payoutRatePct: number;
    startYear: number;
  };
};

export type WindowPlan = {
  years: number; // 5, 10, 20, 30, or custom
  goal: string; // what the goals/focus are for this window
  // Optional per-window overrides (e.g. different appreciation next decade).
  overrides?: Partial<{
    incomeGrowthPct: number;
    investmentGrowthPct: number;
    appreciationPct: number;
    savingsRatePctOfNetCash: number;
  }>;
};

export type Property = {
  acquiredYear: number;
  value: number;
  paidOff: boolean;
};

export type YearRow = {
  year: number; // 1-based from today
  age: number;
  grossIncome: number;
  taxes: number;
  expenses: number;
  debtService: number;
  netCash: number;
  taxableAssets: number;
  qualifiedAssets: number;
  iulCashValue: number;
  iulIncome: number;
  annuityIncome: number;
  rentalIncome: number;
  homeValue: number;
  homeMortgage: number;
  propertiesOwned: number;
  realEstateValue: number; // all properties incl. home
  netWorth: number;
};

export type WindowResult = {
  windowIndex: number;
  startYear: number;
  endYear: number;
  goal: string;
  rows: YearRow[];
  ending: YearRow;
  passiveIncomeAtEnd: number; // rentals + IUL income + annuity
  propertiesAcquired: number;
  narrative: string[];
};

export type UltraResult = {
  windows: WindowResult[];
  final: YearRow;
  chronicIllnessBenefit: {
    available: boolean;
    accessibleAmount: number; // 12 × annual premium (face-amount access)
    note: string;
  };
  moduleNotes: string[];
  disclosure: string;
};

export const ULTRA_DISCLOSURE =
  "All figures are hypothetical projections under the stated assumptions — not guarantees, " +
  "not tax, legal, or investment advice, and not a policy illustration. Actual product values " +
  "require a carrier-issued illustration; consult licensed tax, legal, and insurance professionals.";

const clampPct = (p: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, p));

export function defaultModules(): UltraModules {
  return {
    investmentGrowth: { enabled: true, growthPct: 7, savingsRatePctOfNetCash: 50 },
    mortgageKiller: { enabled: false, cycleYears: 6.5, extraPrincipalPctOfNetCash: 40 },
    realEstate: {
      enabled: false,
      appreciationPctDefault: 3.5,
      appreciationPctPerCycle: [],
      rentalMode: "str",
      strGrossReceiptsPctOfValue: 12,
      strExpenseRatioPct: 45,
      ltrNetYieldPctOfValue: 5,
    },
    equityDeployment: { enabled: false, pctOfHomeEquityDeployed: 50, flowsThroughTrustIUL: true },
    trustIUL: {
      enabled: false,
      premiumAnnual: 24000,
      premiumYears: 5,
      creditRatePct: 6,
      incomeRatePct: 4,
      incomeStartYear: 11,
      chronicIllnessMultiple: 12,
    },
    incomeAnnuity: { enabled: false, premium: 100000, payoutRatePct: 6, startYear: 11 },
  };
}

/** Appreciation for a given mortgage-killer cycle index, with per-cycle overrides. */
export function appreciationForCycle(re: UltraModules["realEstate"], cycleIndex: number): number {
  return re.appreciationPctPerCycle[cycleIndex] ?? re.appreciationPctDefault;
}

export function runUltraScenario(
  profile: ClientProfile,
  modules: UltraModules,
  windows: WindowPlan[],
): UltraResult {
  const rows: YearRow[] = [];
  const windowResults: WindowResult[] = [];
  const moduleNotes: string[] = [];

  // ── mutable simulation state (carried across ALL windows) ────────────────
  let incomeSelf = profile.incomeSelfAnnual;
  let incomeSpouse = profile.incomeSpouseAnnual;
  let otherIncome = profile.otherIncomeAnnual;
  let expenses = profile.baseHouseholdExpensesAnnual;
  let taxable = profile.taxableAssets;
  let qualified = profile.qualifiedAssets;
  let cash = profile.cashReserves;
  let homeValue = profile.home.value;
  let homeMortgage = profile.home.mortgageBalance;
  const homeRate = profile.home.mortgageRatePct / 100;
  const homePayment = profile.home.mortgagePaymentAnnual;
  const debts = profile.otherDebts.map((d) => ({ ...d }));
  const properties: Property[] = [];
  let iulCash = 0;
  let iulPremiumsPaid = 0;
  let annuityActive = false;
  let equityDeployedOnce = false;
  let cycleIndex = 0;
  let yearsSinceCycleStart = 0;
  let globalYear = 0;

  const expenseSchedule = [...profile.expenseChanges].sort((a, b) => a.atYear - b.atYear);

  for (let w = 0; w < windows.length; w++) {
    const win = windows[w];
    const ov = win.overrides ?? {};
    const winRows: YearRow[] = [];
    const startYear = globalYear + 1;
    let propsAtWindowStart = properties.length;

    for (let y = 0; y < win.years; y++) {
      globalYear++;
      yearsSinceCycleStart++;

      // 1. Income grows.
      const g = (ov.incomeGrowthPct ?? profile.incomeGrowthPct) / 100;
      if (globalYear > 1) {
        incomeSelf *= 1 + g;
        incomeSpouse *= 1 + g;
        otherIncome *= 1 + g;
      }

      // 2. Expense-change schedule ("likely to change in 5/10/20 years").
      for (const ch of expenseSchedule) {
        if (ch.atYear === globalYear) expenses = ch.newAnnualExpenses;
      }

      // 3. Real-estate appreciation (home + acquired properties).
      const apprPct = ov.appreciationPct ?? (modules.realEstate.enabled
        ? appreciationForCycle(modules.realEstate, cycleIndex)
        : 0);
      const appr = clampPct(apprPct, -20, 25) / 100;
      homeValue *= 1 + appr;
      for (const p of properties) p.value *= 1 + appr;

      // 4. Rental income from paid-off acquired properties.
      let rentalIncome = 0;
      if (modules.realEstate.enabled) {
        for (const p of properties.filter((p) => p.paidOff)) {
          if (modules.realEstate.rentalMode === "str") {
            const gross = p.value * (clampPct(modules.realEstate.strGrossReceiptsPctOfValue) / 100);
            rentalIncome += gross * (1 - clampPct(modules.realEstate.strExpenseRatioPct) / 100);
          } else if (modules.realEstate.rentalMode === "ltr") {
            rentalIncome += p.value * (clampPct(modules.realEstate.ltrNetYieldPctOfValue) / 100);
          }
          // "live": no income — it's the home they move into.
        }
      }

      // 5. IUL: premiums in, crediting, then income draws.
      let iulIncome = 0;
      if (modules.trustIUL.enabled) {
        if (globalYear <= modules.trustIUL.premiumYears) {
          iulCash += modules.trustIUL.premiumAnnual;
          iulPremiumsPaid += modules.trustIUL.premiumAnnual;
        }
        iulCash *= 1 + modules.trustIUL.creditRatePct / 100;
        if (globalYear >= modules.trustIUL.incomeStartYear && iulCash > 0) {
          iulIncome = iulCash * (modules.trustIUL.incomeRatePct / 100);
          iulCash -= iulIncome; // draw reduces cash value (policy-loan style, simplified)
        }
      }

      // 6. Income annuity.
      let annuityIncome = 0;
      if (modules.incomeAnnuity.enabled) {
        if (!annuityActive && globalYear >= modules.incomeAnnuity.startYear) {
          annuityActive = true;
          taxable = Math.max(0, taxable - modules.incomeAnnuity.premium); // funded from taxable
        }
        if (annuityActive) annuityIncome = modules.incomeAnnuity.premium * (modules.incomeAnnuity.payoutRatePct / 100);
      }

      // 7. Gross income, taxes, debt service.
      const grossIncome = incomeSelf + incomeSpouse + otherIncome + rentalIncome + annuityIncome;
      // IUL income modeled as non-taxable (policy loans) per the strategy; all
      // other income taxed at the blended assumption.
      const taxes = grossIncome * (clampPct(profile.effectiveTaxRatePct, 0, 60) / 100);

      let debtService = 0;
      if (homeMortgage > 0) {
        const interest = homeMortgage * homeRate;
        const principal = Math.max(0, Math.min(homePayment - interest, homeMortgage));
        homeMortgage -= principal;
        debtService += Math.min(homePayment, interest + principal);
      }
      for (const d of debts) {
        if (d.balance <= 0) continue;
        const interest = d.balance * (d.ratePct / 100);
        const principal = Math.max(0, Math.min(d.paymentAnnual - interest, d.balance));
        d.balance -= principal;
        debtService += Math.min(d.paymentAnnual, interest + principal);
      }

      const iulPremiumOut = modules.trustIUL.enabled && globalYear <= modules.trustIUL.premiumYears
        ? modules.trustIUL.premiumAnnual : 0;
      let netCash = grossIncome + iulIncome - taxes - expenses - debtService - iulPremiumOut;

      // 8. Mortgage killer: extra principal from net cash.
      if (modules.mortgageKiller.enabled && netCash > 0 && homeMortgage > 0) {
        const extra = netCash * (clampPct(modules.mortgageKiller.extraPrincipalPctOfNetCash) / 100);
        const applied = Math.min(extra, homeMortgage);
        homeMortgage -= applied;
        netCash -= applied;
      }

      // 9. One-time equity deployment → trust-owned IUL (protection-first flow).
      if (modules.equityDeployment.enabled && !equityDeployedOnce && globalYear === 1) {
        const equity = Math.max(0, homeValue - homeMortgage);
        const deployed = equity * (clampPct(modules.equityDeployment.pctOfHomeEquityDeployed) / 100);
        if (deployed > 0) {
          homeMortgage += deployed; // drawn as a lien against the home
          if (modules.equityDeployment.flowsThroughTrustIUL && modules.trustIUL.enabled) {
            iulCash += deployed;
            iulPremiumsPaid += deployed;
          } else {
            taxable += deployed;
          }
          equityDeployedOnce = true;
          moduleNotes.push(
            `Year 1: deployed ${(clampPct(modules.equityDeployment.pctOfHomeEquityDeployed)).toFixed(0)}% of home equity ` +
            `($${Math.round(deployed).toLocaleString()}) ${modules.equityDeployment.flowsThroughTrustIUL && modules.trustIUL.enabled ? "through trust-owned IUL (asset-protection-first flow)" : "into taxable investments"}.`,
          );
        }
      }

      // 10. Mortgage-killer CYCLE: every cycleYears with the mortgage retired,
      // the recycled capacity acquires one additional PAID-OFF property at a
      // comparable price point (the "recycle every 6–7 years" pattern).
      if (
        modules.mortgageKiller.enabled &&
        modules.realEstate.enabled &&
        yearsSinceCycleStart >= modules.mortgageKiller.cycleYears &&
        homeMortgage <= 0
      ) {
        properties.push({ acquiredYear: globalYear, value: homeValue, paidOff: true });
        cycleIndex++;
        yearsSinceCycleStart = 0;
        // The next cycle begins: leverage re-arms against the new property
        // (modeled as restarting the payoff clock, not as new personal debt).
        moduleNotes.push(
          `Year ${globalYear}: mortgage-killer cycle ${cycleIndex} complete — additional paid-off property ` +
          `(≈$${Math.round(homeValue).toLocaleString()}) added; ${modules.realEstate.rentalMode === "live" ? "held to live in" : modules.realEstate.rentalMode === "str" ? "operating as short-term rental" : "operating as long-term rental"}.`,
        );
      }

      // 11. Savings & growth on invested assets.
      const growPct = ov.investmentGrowthPct ?? modules.investmentGrowth.growthPct;
      const saveRate = clampPct(ov.savingsRatePctOfNetCash ?? modules.investmentGrowth.savingsRatePctOfNetCash) / 100;
      if (modules.investmentGrowth.enabled) {
        if (netCash > 0) {
          taxable += netCash * saveRate;
          cash += netCash * (1 - saveRate);
        } else {
          cash += netCash; // shortfalls drain cash first
        }
        taxable *= 1 + growPct / 100;
        qualified *= 1 + growPct / 100;
      } else {
        cash += netCash;
      }

      const realEstateValue = homeValue + properties.reduce((a, p) => a + p.value, 0);
      const totalDebt = homeMortgage + debts.reduce((a, d) => a + Math.max(0, d.balance), 0);
      const row: YearRow = {
        year: globalYear,
        age: profile.clientAge + globalYear,
        grossIncome: Math.round(grossIncome),
        taxes: Math.round(taxes),
        expenses: Math.round(expenses),
        debtService: Math.round(debtService),
        netCash: Math.round(netCash),
        taxableAssets: Math.round(taxable),
        qualifiedAssets: Math.round(qualified),
        iulCashValue: Math.round(iulCash),
        iulIncome: Math.round(iulIncome),
        annuityIncome: Math.round(annuityIncome),
        rentalIncome: Math.round(rentalIncome),
        homeValue: Math.round(homeValue),
        homeMortgage: Math.round(Math.max(0, homeMortgage)),
        propertiesOwned: properties.length,
        realEstateValue: Math.round(realEstateValue),
        netWorth: Math.round(taxable + qualified + cash + iulCash + realEstateValue - totalDebt),
      };
      rows.push(row);
      winRows.push(row);
    }

    const ending = winRows[winRows.length - 1];
    windowResults.push({
      windowIndex: w,
      startYear,
      endYear: globalYear,
      goal: win.goal,
      rows: winRows,
      ending,
      passiveIncomeAtEnd: ending.rentalIncome + ending.iulIncome + ending.annuityIncome,
      propertiesAcquired: properties.length - propsAtWindowStart,
      narrative: [
        `Window ${w + 1} (years ${startYear}–${globalYear}) — goal: ${win.goal || "not stated"}.`,
        `Ending net worth: $${ending.netWorth.toLocaleString()}; passive income: $${(ending.rentalIncome + ending.iulIncome + ending.annuityIncome).toLocaleString()}/yr; properties owned: ${ending.propertiesOwned}.`,
        `All ending balances carry forward as the next window's starting position.`,
      ],
    });
  }

  const final = rows[rows.length - 1];
  return {
    windows: windowResults,
    final,
    chronicIllnessBenefit: {
      available: modules.trustIUL.enabled,
      accessibleAmount: modules.trustIUL.enabled
        ? modules.trustIUL.premiumAnnual * modules.trustIUL.chronicIllnessMultiple
        : 0,
      note: modules.trustIUL.enabled
        ? `If a qualifying chronic illness occurs, the strategy contemplates accessing up to ` +
          `${modules.trustIUL.chronicIllnessMultiple}× the annual premium ` +
          `($${(modules.trustIUL.premiumAnnual * modules.trustIUL.chronicIllnessMultiple).toLocaleString()}) of face amount as living-benefit income. ` +
          `Actual availability, triggers, and amounts are set by the issued policy — carrier illustration required.`
        : "Enable the trust-owned IUL module to model chronic-illness living benefits.",
    },
    moduleNotes,
    disclosure: ULTRA_DISCLOSURE,
  };
}

// ── Module metadata the UI and the AI advisor share ─────────────────────────
export type ModuleKey = keyof UltraModules;

export const MODULE_CATALOG: Record<ModuleKey, { name: string; whenNecessary: string; benefit: string }> = {
  investmentGrowth: {
    name: "Investment Growth",
    whenNecessary: "Any plan with investable assets or yearly savings — it compounds everything else.",
    benefit: "Applies your assumed growth rate to taxable and qualified assets and routes surplus cash into savings.",
  },
  mortgageKiller: {
    name: "Mortgage Killer (recycling)",
    whenNecessary: "Clients with a mortgage and positive cash flow — the core 6–7 year recycle engine.",
    benefit: "Aims surplus cash at the mortgage; each completed cycle adds a paid-off property to live in or rent.",
  },
  realEstate: {
    name: "Real Estate & Rentals",
    whenNecessary: "Whenever the mortgage-killer cycles or the client holds/plans investment property.",
    benefit: "Applies appreciation (adjustable per cycle) and models STR gross receipts (0–100% of value) or LTR yield.",
  },
  equityDeployment: {
    name: "Home Equity Deployment",
    whenNecessary: "Clients with substantial idle home equity who accept a lien to put it to work.",
    benefit: "Deploys a chosen % of equity — protection-first through trust-owned IUL — instead of leaving it dormant.",
  },
  trustIUL: {
    name: "Trust-Owned IUL",
    whenNecessary: "Plans needing tax-advantaged future income plus divorce/creditor protection and living benefits.",
    benefit: "Models premiums, crediting, 4%/2% income draws, and 12× premium chronic-illness access.",
  },
  incomeAnnuity: {
    name: "Income Annuity",
    whenNecessary: "Clients wanting a guaranteed-style income floor in later windows.",
    benefit: "Converts a lump sum into level lifetime-style income beginning in the year you choose.",
  },
};
