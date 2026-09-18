/**
 * The single client record every calculator reads from.
 *
 * ## Why this exists
 *
 * Seventy engines in this platform each took their own inputs. That meant the same
 * client's mortgage balance got typed in four times, three of them wrong, and no two
 * calculators agreed on his tax bracket. The fix is not more validation inside each
 * calculator. It is one record, entered once, that hydrates all of them.
 *
 * ## Provenance is a first-class field, not a nicety
 *
 * Every figure carries how we know it. A balance read off a statement and a balance
 * the client remembered are not the same fact, and a projection built on the second
 * should not print with the confidence of the first. `hydrate()` propagates the weakest
 * provenance in the inputs to the output, so a calculator fed one guess reports itself
 * as a guess. That is the difference between a plan and a sales illustration.
 */

export type Provenance =
  /** Read off a statement, a return, or a carrier illustration in the file. */
  | 'documented'
  /** The client said so. Usually close. Occasionally off by a mortgage. */
  | 'stated'
  /** We inferred it from something else. Flag it everywhere it lands. */
  | 'estimated';

export const PROVENANCE_RANK: Record<Provenance, number> = {
  documented: 3,
  stated: 2,
  estimated: 1,
};

export interface Fact<T = number> {
  readonly value: T;
  readonly provenance: Provenance;
  /** Where it came from — a statement date, a conversation date, a derivation. */
  readonly source: string;
  readonly asOf: string;
}

export type AssetKind =
  | 'cash'
  | 'brokerage-taxable'
  | 'retirement-qualified'
  | 'retirement-roth'
  | 'cash-value-life'
  | 'annuity'
  | 'real-estate-primary'
  | 'real-estate-investment'
  | 'business-interest'
  | 'other';

export interface Asset {
  readonly id: string;
  readonly kind: AssetKind;
  readonly label: string;
  readonly balance: Fact;
  /** Fraction reachable within 30 days without penalty or sale at a loss. */
  readonly liquidityFactor: number;
  /** Ordinary income, capital gain, tax-free, or tax-deferred on access. */
  readonly taxOnAccess: 'ordinary' | 'capital-gain' | 'tax-free' | 'deferred';
  readonly annualReturnAssumption?: Fact;
}

export type LiabilityKind =
  | 'mortgage-primary'
  | 'mortgage-investment'
  | 'heloc'
  | 'student-loan'
  | 'auto'
  | 'credit-card'
  | 'business-debt'
  | 'policy-loan'
  | 'other';

export interface Liability {
  readonly id: string;
  readonly kind: LiabilityKind;
  readonly label: string;
  readonly balance: Fact;
  readonly rate: Fact;
  readonly monthlyPayment: Fact;
  readonly remainingMonths?: number;
  /** Set where the debt is attached to a specific asset. */
  readonly securedByAssetId?: string;
  readonly taxDeductibleInterest?: boolean;
}

export interface IncomeStream {
  readonly id: string;
  readonly label: string;
  readonly annualGross: Fact;
  readonly kind: 'w2' | 'self-employment' | 'rental' | 'portfolio' | 'pension' | 'social-security';
  /** Whether it stops at retirement, death, or not at all. */
  readonly durability: 'permanent' | 'employment-dependent' | 'asset-dependent';
}

export interface ExpenseLine {
  readonly id: string;
  readonly label: string;
  readonly annual: Fact;
  readonly essential: boolean;
}

export interface ClientFacts {
  readonly clientId: string;
  readonly currentAge: number;
  readonly state: string;
  readonly filingStatus: 'single' | 'married-joint' | 'married-separate' | 'head-of-household';
  readonly marginalTaxRate: Fact;
  readonly assets: readonly Asset[];
  readonly liabilities: readonly Liability[];
  readonly income: readonly IncomeStream[];
  readonly expenses: readonly ExpenseLine[];
}

export interface DerivedPosition {
  readonly netWorth: number;
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  /** Reachable inside 30 days without penalty. */
  readonly liquidAssets: number;
  readonly annualIncome: number;
  readonly annualExpenses: number;
  readonly annualSurplus: number;
  readonly monthlyDebtService: number;
  readonly debtToIncome: number;
  /** Months of essential expenses covered by liquid assets. */
  readonly emergencyMonths: number;
  /** Capital genuinely available to deploy, after reserve. */
  readonly deployableCapital: number;
  /** The weakest provenance anywhere in the inputs. */
  readonly weakestProvenance: Provenance;
  readonly warnings: readonly string[];
}

const RESERVE_MONTHS = 6;

function weakest(facts: readonly Fact[]): Provenance {
  let w: Provenance = 'documented';
  for (const f of facts) {
    if (PROVENANCE_RANK[f.provenance] < PROVENANCE_RANK[w]) w = f.provenance;
  }
  return w;
}

export function derive(facts: ClientFacts): DerivedPosition {
  const allFacts: Fact[] = [
    facts.marginalTaxRate,
    ...facts.assets.map((a) => a.balance),
    ...facts.liabilities.flatMap((l) => [l.balance, l.rate, l.monthlyPayment]),
    ...facts.income.map((i) => i.annualGross),
    ...facts.expenses.map((e) => e.annual),
  ];

  const totalAssets = facts.assets.reduce((s, a) => s + a.balance.value, 0);
  const totalLiabilities = facts.liabilities.reduce((s, l) => s + l.balance.value, 0);
  const liquidAssets = facts.assets.reduce((s, a) => s + a.balance.value * a.liquidityFactor, 0);
  const annualIncome = facts.income.reduce((s, i) => s + i.annualGross.value, 0);
  const annualExpenses = facts.expenses.reduce((s, e) => s + e.annual.value, 0);
  const essentialAnnual = facts.expenses.filter((e) => e.essential).reduce((s, e) => s + e.annual.value, 0);
  const monthlyDebtService = facts.liabilities.reduce((s, l) => s + l.monthlyPayment.value, 0);

  const warnings: string[] = [];
  const emergencyMonths =
    essentialAnnual > 0 ? (liquidAssets / (essentialAnnual / 12)) : Number.POSITIVE_INFINITY;

  const reserveNeeded = (essentialAnnual / 12) * RESERVE_MONTHS;
  const deployableCapital = Math.max(0, liquidAssets - reserveNeeded);

  if (emergencyMonths < RESERVE_MONTHS) {
    warnings.push(
      `Liquid assets cover ${emergencyMonths.toFixed(1)} months of essential expenses, below the ` +
        `${RESERVE_MONTHS}-month reserve. Every strategy below is gated on this until it is fixed.`,
    );
  }
  const dti = annualIncome > 0 ? (monthlyDebtService * 12) / annualIncome : 0;
  if (dti > 0.43) {
    warnings.push(
      `Debt service is ${(dti * 100).toFixed(0)}% of gross income. Above 43% most lenders will ` +
        'decline new credit, which closes off the leverage strategies before they are considered.',
    );
  }
  if (annualIncome - annualExpenses < 0) {
    warnings.push('Expenses exceed income. No accumulation strategy works from a deficit.');
  }

  const wp = weakest(allFacts);
  if (wp === 'estimated') {
    warnings.push(
      'At least one input is estimated. Every figure downstream inherits that, and this plan ' +
        'should not be presented as documented until the estimates are replaced.',
    );
  }

  return {
    netWorth: Math.round(totalAssets - totalLiabilities),
    totalAssets: Math.round(totalAssets),
    totalLiabilities: Math.round(totalLiabilities),
    liquidAssets: Math.round(liquidAssets),
    annualIncome: Math.round(annualIncome),
    annualExpenses: Math.round(annualExpenses),
    annualSurplus: Math.round(annualIncome - annualExpenses),
    monthlyDebtService: Math.round(monthlyDebtService),
    debtToIncome: Number(dti.toFixed(4)),
    emergencyMonths: Number(emergencyMonths.toFixed(1)),
    deployableCapital: Math.round(deployableCapital),
    weakestProvenance: wp,
    warnings,
  };
}

/** What a calculator receives when the fact-finder fills it in. */
export interface Prefill {
  readonly calculator: string;
  readonly values: Readonly<Record<string, number | string>>;
  readonly provenance: Provenance;
  readonly missing: readonly string[];
}

/**
 * Fill every calculator from the one record.
 *
 * `missing` is the honest part: a calculator that needs a figure the fact-finder does
 * not hold says so by name rather than defaulting to zero and producing a confident
 * wrong answer.
 */
export function hydrate(facts: ClientFacts): Prefill[] {
  const d = derive(facts);
  const out: Prefill[] = [];

  const primaryMortgage = facts.liabilities.find((l) => l.kind === 'mortgage-primary');
  const investmentMortgages = facts.liabilities.filter((l) => l.kind === 'mortgage-investment');
  const policies = facts.assets.filter((a) => a.kind === 'cash-value-life');
  const primaryHome = facts.assets.find((a) => a.kind === 'real-estate-primary');

  // Mortgage Killer
  {
    const missing: string[] = [];
    if (!primaryMortgage) missing.push('primary mortgage');
    if (policies.length === 0) missing.push('at least one cash value policy');
    out.push({
      calculator: 'mortgageKiller',
      values: {
        mortgageBalance: primaryMortgage?.balance.value ?? 0,
        mortgageRate: primaryMortgage?.rate.value ?? 0,
        monthlyPayment: primaryMortgage?.monthlyPayment.value ?? 0,
        policyCashValue: policies.reduce((s, p) => s + p.balance.value, 0),
        currentAge: facts.currentAge,
        marginalTaxRate: facts.marginalTaxRate.value,
      },
      provenance: weakest(
        [facts.marginalTaxRate, ...(primaryMortgage ? [primaryMortgage.balance, primaryMortgage.rate] : []), ...policies.map((p) => p.balance)],
      ),
      missing,
    });
  }

  // Real Estate Mogul
  {
    const missing: string[] = [];
    if (investmentMortgages.length === 0) missing.push('investment property loans');
    out.push({
      calculator: 'realEstateMogul',
      values: {
        propertyCount: facts.assets.filter((a) => a.kind === 'real-estate-investment').length,
        totalInvestmentDebt: investmentMortgages.reduce((s, l) => s + l.balance.value, 0),
        totalInvestmentEquity: facts.assets
          .filter((a) => a.kind === 'real-estate-investment')
          .reduce((s, a) => s + a.balance.value, 0),
        deployableCapital: d.deployableCapital,
        marginalTaxRate: facts.marginalTaxRate.value,
      },
      provenance: weakest([facts.marginalTaxRate, ...investmentMortgages.map((l) => l.balance)]),
      missing,
    });
  }

  // Time Machine — needs only the real current age.
  out.push({
    calculator: 'timeMachine30',
    values: { currentAge: facts.currentAge, state: facts.state },
    provenance: 'documented',
    missing: facts.currentAge > 30 ? [] : ['a current age above 30 for a 30-year look-back'],
  });

  // HELOC sourcing
  {
    const equity = (primaryHome?.balance.value ?? 0) - (primaryMortgage?.balance.value ?? 0);
    const missing: string[] = [];
    if (!primaryHome) missing.push('primary residence value');
    out.push({
      calculator: 'helocLenders',
      values: {
        availableEquity: Math.max(0, equity),
        existingLiens: primaryMortgage?.balance.value ?? 0,
        state: facts.state,
      },
      provenance: weakest([
        ...(primaryHome ? [primaryHome.balance] : []),
        ...(primaryMortgage ? [primaryMortgage.balance] : []),
      ]),
      missing,
    });
  }

  // Small business lending — deployable capital only, never reserve.
  out.push({
    calculator: 'smallBusinessLending',
    values: {
      deployableCapital: d.deployableCapital,
      marginalTaxRate: facts.marginalTaxRate.value,
      state: facts.state,
    },
    provenance: facts.marginalTaxRate.provenance,
    missing: d.deployableCapital <= 0 ? ['deployable capital after the six-month reserve'] : [],
  });

  return out;
}
