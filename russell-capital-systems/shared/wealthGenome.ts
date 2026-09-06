// ============================================================
// WEALTH GENOME — eight-dimension financial health score computed from the
// client's own Financial Assessment. Deterministic and explainable: every
// point has a stated reason, and every dimension lists what would raise it.
// Education only — a map of where the plan must work hardest, not advice.
// ============================================================
import { factFinderCompleteness, type ClientFactFinder } from "./clientFactFinder";

export type GenomeDimension = {
  key: string;
  name: string;
  score: number; // 0–100
  rationale: string[]; // why it scored this way, from the facts
  raise: string[]; // what would move it up
};

export type WealthGenome = {
  overall: number;
  tier: "Fragile" | "Developing" | "Solid" | "Strong" | "Exceptional";
  dimensions: GenomeDimension[];
  assessmentPercent: number;
  complete: boolean;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const yes = (v: unknown): boolean => v === true || v === "Yes" || v === "Yes, funded";
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function tierFor(score: number): WealthGenome["tier"] {
  if (score >= 85) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Solid";
  if (score >= 40) return "Developing";
  return "Fragile";
}

export function computeWealthGenome(ff: ClientFactFinder | null | undefined): WealthGenome {
  const c = factFinderCompleteness(ff);
  const s = (id: string) => ff?.sections?.[id] ?? {};
  const hh = s("household"), inc = s("income"), tax = s("taxes"), re = s("realEstate"), debt = s("debts"), inv = s("investments");
  const cash = s("cash"), flow = s("cashFlow"), ins = s("insurance"), prac = s("practice"), est = s("estate"), prot = s("protection"), ret = s("retirement");

  const totalIncome = num(inc.w2Income) + num(inc.bonusIncome) + num(inc.contractorIncome) + num(inc.practiceDistributions) + num(inc.spouseIncome) + num(inc.rentalIncome) + num(inc.investmentIncome) + num(inc.otherIncome);
  const agi = num(tax.adjustedGrossIncome) || totalIncome;
  const effRate = agi > 0 ? num(tax.federalTaxPaid) / agi : 0;
  const dependents = num(hh.dependents);
  const monthsCash = num(cash.emergencyFundMonths);
  const takeHome = num(flow.monthlyTakeHome);
  const savingsRate = takeHome > 0 ? num(flow.monthlySavings) / takeHome : 0;

  // ── 1. Income stability ────────────────────────────────────────────────
  const d1: GenomeDimension = { key: "income", name: "Income Stability", score: 50, rationale: [], raise: [] };
  {
    let sc = 50;
    const et = str(inc.employmentType);
    if (/W-2/.test(et)) { sc += 15; d1.rationale.push("Salaried W-2 income is the most predictable base."); }
    else if (/Practice owner/.test(et)) { sc += 10; d1.rationale.push("Owner income is strong but tied to the practice."); }
    else if (/1099|Mixed/.test(et)) { sc += 5; d1.rationale.push("Contract income varies more than salary."); }
    const tr = str(inc.incomeTrajectory);
    if (/significantly/.test(tr)) { sc += 10; d1.rationale.push("Income is expected to rise significantly."); }
    else if (/modestly/.test(tr)) { sc += 5; d1.rationale.push("Income is expected to rise modestly."); }
    else if (/Declining/.test(tr)) { sc -= 15; d1.rationale.push("Income is expected to decline."); d1.raise.push("Plan the decline: lock in savings and coverage while income is high."); }
    else if (/Uncertain/.test(tr)) { sc -= 5; d1.rationale.push("Income direction is uncertain."); }
    if (num(inc.spouseIncome) > 0) { sc += 10; d1.rationale.push("A second household income cushions any single shock."); }
    else d1.raise.push("A second income source (spouse, rental, or investment income) adds resilience.");
    const extra = [num(inc.rentalIncome) > 0, num(inc.investmentIncome) > 0, num(inc.practiceDistributions) > 0].filter(Boolean).length;
    if (extra) { sc += Math.min(10, extra * 5); d1.rationale.push(`${extra} additional income stream${extra > 1 ? "s" : ""} beyond salary.`); }
    if (monthsCash >= 6) { sc += 10; d1.rationale.push(`${monthsCash} months of expenses in cash protect income gaps.`); }
    else if (monthsCash >= 3) { sc += 5; d1.rationale.push(`${monthsCash} months of cash reserves.`); d1.raise.push("Build cash reserves toward six months of expenses."); }
    else { sc -= 10; d1.rationale.push(`Only ${monthsCash} month${monthsCash === 1 ? "" : "s"} of expenses in cash.`); d1.raise.push("Build an emergency reserve — three months first, then six."); }
    d1.score = clamp(sc);
  }

  // ── 2. Tax efficiency ──────────────────────────────────────────────────
  const d2: GenomeDimension = { key: "tax", name: "Tax Efficiency", score: 60, rationale: [], raise: [] };
  {
    let sc = 60;
    if (agi > 0) {
      const pct = Math.round(effRate * 100);
      if (effRate >= 0.3) { sc -= 20; d2.rationale.push(`Federal tax is about ${pct}% of income — the largest lever in the plan.`); }
      else if (effRate >= 0.25) { sc -= 10; d2.rationale.push(`Federal tax is about ${pct}% of income.`); }
      else if (effRate <= 0.15) { sc += 15; d2.rationale.push(`Federal tax is about ${pct}% of income — already efficient.`); }
      else d2.rationale.push(`Federal tax is about ${pct}% of income.`);
      if (effRate >= 0.25) d2.raise.push("Sequence deductions, retirement plan design, and conversion timing to bring the effective rate down.");
    }
    if (num(tax.retirementContributionsPretax) >= 20000) { sc += 10; d2.rationale.push(`${money(num(tax.retirementContributionsPretax))} of pre-tax retirement contributions.`); }
    else d2.raise.push("Max out pre-tax retirement contributions (and a cash-balance plan if you own the practice).");
    if (yes(inv.backdoorRoth)) { sc += 10; d2.rationale.push("Backdoor / mega-backdoor Roth in use."); }
    else d2.raise.push("Backdoor or mega-backdoor Roth contributions add tax-free growth at high income.");
    if (/Itemized/.test(str(tax.deductionMethod))) { sc += 5; d2.rationale.push("Itemizing deductions."); }
    if (num(tax.charitableGiving) > 0) { sc += 5; d2.rationale.push("Charitable giving is part of the picture."); }
    if (num(tax.capitalLossCarryforward) > 0) { sc += 3; d2.rationale.push("A capital-loss carryforward is available to offset gains."); }
    if (yes(tax.niitExposure)) { sc -= 5; d2.rationale.push("Subject to the 3.8% net investment income tax."); d2.raise.push("Shift taxable investment income toward tax-free vehicles to reduce NIIT exposure."); }
    if (/1099|Mixed|Practice/.test(str(inc.employmentType)) && num(tax.quarterlyEstimates) > 0) { sc += 5; d2.rationale.push("Quarterly estimates are being paid."); }
    d2.score = clamp(sc);
  }

  // ── 3. Insurance coverage ──────────────────────────────────────────────
  const d3: GenomeDimension = { key: "insurance", name: "Insurance Coverage", score: 40, rationale: [], raise: [] };
  {
    let sc = 40;
    const lifeDb = num(ins.termLifeDeathBenefit) + num(ins.permanentLifeDeathBenefit);
    if (totalIncome > 0 && lifeDb >= 10 * totalIncome) { sc += 25; d3.rationale.push(`Life coverage of ${money(lifeDb)} is at least ten times income.`); }
    else if (totalIncome > 0 && lifeDb >= 5 * totalIncome) { sc += 15; d3.rationale.push(`Life coverage of ${money(lifeDb)} is about ${Math.round(lifeDb / totalIncome)}× income.`); d3.raise.push("Life coverage of ten times income is the usual target with dependents."); }
    else if (lifeDb > 0) { sc += 8; d3.rationale.push(`Life coverage of ${money(lifeDb)} is under five times income.`); d3.raise.push("Increase life coverage toward ten times income."); }
    else if (dependents > 0) { sc -= 15; d3.rationale.push("Dependents, but no life insurance recorded."); d3.raise.push("Put term life coverage in place — it is the cheapest protection you will buy."); }
    const dis = num(ins.disabilityMonthlyBenefit);
    if (dis > 0 && takeHome > 0 && dis >= 0.5 * takeHome) { sc += 20; d3.rationale.push(`Disability benefit of ${money(dis)}/month replaces at least half of take-home pay.`); }
    else if (dis > 0) { sc += 10; d3.rationale.push(`Disability benefit of ${money(dis)}/month.`); d3.raise.push("Raise disability coverage toward 60% of income with a true own-occupation definition."); }
    else { d3.rationale.push("No disability income coverage recorded — the most-claimed risk for a working physician."); d3.raise.push("Add individual own-occupation disability insurance."); }
    if (yes(ins.disabilityOwnOccupation)) { sc += 5; d3.rationale.push("Own-occupation definition confirmed."); }
    if (str(ins.malpracticeLimits).trim() && !/none|n\/a/i.test(str(ins.malpracticeLimits))) { sc += 10; d3.rationale.push(`Malpractice limits ${str(ins.malpracticeLimits)}.`); }
    if (yes(ins.tailCoverage)) { sc += 3; d3.rationale.push("Tail coverage arranged."); }
    else if (/Claims-made/.test(str(ins.malpracticeType))) d3.raise.push("Confirm tail coverage for the claims-made policy.");
    const umb = num(ins.umbrellaLimit);
    if (umb >= 1_000_000) { sc += 10; d3.rationale.push(`Umbrella liability of ${money(umb)}.`); }
    else if (umb > 0) { sc += 5; d3.rationale.push(`Umbrella liability of ${money(umb)}.`); d3.raise.push("Raise umbrella coverage to at least one million dollars."); }
    else d3.raise.push("Add an umbrella liability policy.");
    if (str(ins.ltcCoverage) && !/None/.test(str(ins.ltcCoverage))) { sc += 5; d3.rationale.push("Long-term-care coverage in place."); }
    d3.score = clamp(sc);
  }

  // ── 4. Retirement readiness ────────────────────────────────────────────
  const d4: GenomeDimension = { key: "retirement", name: "Retirement Readiness", score: 30, rationale: [], raise: [] };
  {
    const investable = num(inv.taxableBrokerage) + num(inv.employerPlanBalance) + num(inv.spouseEmployerPlanBalance) + num(inv.traditionalIra) + num(inv.rothIra) + num(inv.roth401k) + num(inv.cashBalancePlan) + num(inv.annuities);
    const desired = num(ret.desiredRetirementIncomeMonthly);
    const guaranteed = num(ret.socialSecuritySelf) + num(ret.socialSecuritySpouse) + num(ret.pensionIncome);
    const need = Math.max(0, desired - guaranteed) * 12 * 25;
    let sc = 20;
    if (need > 0) {
      const ratio = investable / need;
      sc += Math.min(60, ratio * 60);
      d4.rationale.push(`${money(investable)} invested against roughly ${money(need)} needed to fund ${money(desired)}/month (25× the uncovered income).`);
      if (ratio < 0.5) d4.raise.push("Close the gap with higher savings, a later date, or guaranteed income that lowers the target.");
    } else if (investable > 0) { sc += 30; d4.rationale.push(`${money(investable)} invested; set a retirement income target to measure readiness.`); d4.raise.push("Set a desired retirement income so readiness can be measured."); }
    if (savingsRate > 0) { sc += Math.min(15, savingsRate * 100 * 0.5); d4.rationale.push(`Saving about ${Math.round(savingsRate * 100)}% of take-home pay.`); if (savingsRate < 0.2) d4.raise.push("A 20% savings rate is the physician benchmark."); }
    else d4.raise.push("Automate a monthly savings amount.");
    if (num(inv.employerMatchPct) > 0) { sc += 5; d4.rationale.push("Employer match captured."); }
    const age = ageFrom(hh.dateOfBirth);
    const target = num(ret.targetRetirementAge);
    if (age && target && target - age <= 10 && need > 0 && investable / need < 0.3) { sc -= 10; d4.rationale.push(`Retirement targeted within ${Math.max(0, target - age)} years with under 30% of the need funded.`); }
    d4.score = clamp(sc);
  }

  // ── 5. Estate planning ─────────────────────────────────────────────────
  const d5: GenomeDimension = { key: "estate", name: "Estate Planning", score: 0, rationale: [], raise: [] };
  {
    let sc = 0;
    if (est.hasWill === true) { sc += 30; d5.rationale.push("A current will is in place."); } else { d5.rationale.push("No current will recorded — state law decides who inherits."); d5.raise.push("Execute a will."); }
    if (est.hasRevocableTrust === true) { sc += 20; d5.rationale.push("A revocable living trust avoids probate."); } else { d5.rationale.push("No revocable trust — the estate would go through probate."); d5.raise.push("Consider a revocable living trust to keep the estate out of probate."); }
    if (est.poaFinancial === true) { sc += 10; d5.rationale.push("Durable financial power of attorney signed."); } else d5.raise.push("Sign a durable financial power of attorney.");
    if (est.healthcareDirective === true) { sc += 10; d5.rationale.push("Healthcare directive signed."); } else d5.raise.push("Sign a healthcare directive.");
    if (yes(est.beneficiariesReviewed)) { sc += 15; d5.rationale.push("Beneficiary designations reviewed recently."); } else d5.raise.push("Review every beneficiary designation — they override the will.");
    if (dependents > 0) { if (yes(est.guardianNamed)) { sc += 10; d5.rationale.push("Guardian named for minor children."); } else d5.raise.push("Name a guardian for minor children."); } else sc += 10;
    if (est.hasIrrevocableTrust === true) { sc += 5; d5.rationale.push("An irrevocable trust is in place."); }
    d5.score = clamp(sc);
  }

  // ── 6. Debt management ─────────────────────────────────────────────────
  const d6: GenomeDimension = { key: "debt", name: "Debt Management", score: 70, rationale: [], raise: [] };
  {
    let sc = 70;
    const consumer = num(debt.studentLoanBalance) + num(debt.practiceLoanBalance) + num(debt.autoLoans) + num(debt.creditCardBalance) + num(debt.personalLoans) + num(debt.otherDebt);
    if (consumer === 0 && num(re.primaryMortgageBalance) === 0) { sc += 15; d6.rationale.push("No debt recorded."); }
    if (totalIncome > 0 && consumer > 0) {
      const r = consumer / totalIncome;
      if (r > 1) { sc -= 30; d6.rationale.push(`Non-mortgage debt of ${money(consumer)} exceeds a year of income.`); }
      else if (r > 0.5) { sc -= 20; d6.rationale.push(`Non-mortgage debt of ${money(consumer)} is over half a year of income.`); }
      else if (r > 0.2) { sc -= 10; d6.rationale.push(`Non-mortgage debt of ${money(consumer)}.`); }
      else d6.rationale.push(`Non-mortgage debt of ${money(consumer)} is modest against income.`);
      if (r > 0.2) d6.raise.push("Sequence payoff by rate and tax treatment — highest cost first, forgivable loans last.");
    }
    if (num(debt.creditCardBalance) > 0) { sc -= 15; d6.rationale.push(`Credit-card balance of ${money(num(debt.creditCardBalance))} carried.`); d6.raise.push("Eliminate carried credit-card balances first."); }
    if (num(re.primaryMortgageYearsRemaining) >= 25) { sc -= 5; d6.rationale.push(`${num(re.primaryMortgageYearsRemaining)} years remaining on the mortgage.`); d6.raise.push("An accelerated payoff plan recovers years of interest."); }
    if (num(re.primaryMortgageRate) >= 7) { sc -= 5; d6.rationale.push(`Mortgage rate of ${num(re.primaryMortgageRate)}%.`); }
    if (re.primaryInterestOnly === true) { sc -= 10; d6.rationale.push("The mortgage is interest-only — principal is not falling."); d6.raise.push("Convert interest-only payments into a principal-reduction plan."); }
    if (yes(debt.studentLoanForgiveness)) { sc += 5; d6.rationale.push("On a loan-forgiveness track."); }
    if (consumer === 0 && num(re.primaryMortgageBalance) > 0 && d6.rationale.length === 0) {
      sc += 10;
      d6.rationale.push(`Only mortgage debt: ${money(num(re.primaryMortgageBalance))}${num(re.primaryMortgageRate) ? ` at ${num(re.primaryMortgageRate)}%` : ""}${num(re.primaryMortgageYearsRemaining) ? ` with ${num(re.primaryMortgageYearsRemaining)} years remaining` : ""}.`);
    }
    d6.score = clamp(sc);
  }

  // ── 7. Investment diversification ──────────────────────────────────────
  const d7: GenomeDimension = { key: "diversification", name: "Investment Diversification", score: 50, rationale: [], raise: [] };
  {
    let sc = 50;
    const alloc = num(inv.allocationStocks) + num(inv.allocationBonds) + num(inv.allocationCash);
    if (alloc >= 90 && alloc <= 110) { sc += 10; d7.rationale.push(`Allocation known: ${num(inv.allocationStocks)}% stocks, ${num(inv.allocationBonds)}% bonds, ${num(inv.allocationCash)}% cash.`); if (num(inv.allocationStocks) >= 40 && num(inv.allocationStocks) <= 90) sc += 10; }
    else d7.raise.push("Record the actual allocation so it can be measured against the plan.");
    if (inv.concentratedPosition === true) { sc -= 25; d7.rationale.push(`A single holding exceeds 10% of investable assets${str(inv.concentratedPositionDetail) ? ` (${str(inv.concentratedPositionDetail)})` : ""}.`); d7.raise.push("Diversify the concentrated position on a tax-aware schedule."); }
    else if (inv.concentratedPosition === false) { sc += 10; d7.rationale.push("No single holding dominates."); }
    const types = [num(inv.taxableBrokerage) > 0, num(inv.employerPlanBalance) + num(inv.traditionalIra) + num(inv.cashBalancePlan) > 0, num(inv.rothIra) + num(inv.roth401k) > 0, num(inv.hsaBalance) > 0, num(inv.plan529) > 0].filter(Boolean).length;
    if (types >= 3) { sc += 15; d7.rationale.push(`${types} account types across taxable, tax-deferred, and tax-free.`); }
    else if (types >= 2) { sc += 8; d7.rationale.push(`${types} account types in use.`); d7.raise.push("Add a tax-free bucket (Roth, HSA) alongside taxable and tax-deferred."); }
    else d7.raise.push("Build all three tax buckets: taxable, tax-deferred, and tax-free.");
    const investable = num(inv.taxableBrokerage) + num(inv.employerPlanBalance) + num(inv.traditionalIra) + num(inv.rothIra) + num(inv.roth401k) + num(inv.cryptoAlternatives) + num(inv.privateInvestments);
    const alt = num(inv.cryptoAlternatives) + num(inv.privateInvestments);
    if (investable > 0 && alt / investable > 0.3) { sc -= 10; d7.rationale.push("Alternatives and private investments exceed 30% of investable assets."); }
    if (str(inv.currentAdvisor).trim()) { sc += 5; d7.rationale.push("A custodian/advisor relationship is in place."); }
    d7.score = clamp(sc);
  }

  // ── 8. Risk mitigation ─────────────────────────────────────────────────
  const d8: GenomeDimension = { key: "risk", name: "Risk Mitigation", score: 40, rationale: [], raise: [] };
  {
    let sc = 40;
    if (monthsCash >= 6) { sc += 20; d8.rationale.push("Six or more months of expenses in reserve."); }
    else if (monthsCash >= 3) { sc += 10; d8.rationale.push(`${monthsCash} months of expenses in reserve.`); }
    else { sc -= 10; d8.rationale.push(`Reserves cover ${monthsCash} month${monthsCash === 1 ? "" : "s"}.`); d8.raise.push("Reserves are the first line of defence — build them before optimising anything else."); }
    const rt = str(inv.riskTolerance);
    const react = str(inv.worstYearReaction);
    if (/Sell/.test(react)) { sc -= 10; d8.rationale.push("You would sell in a 30% drop — the plan must not depend on holding through volatility."); d8.raise.push("Use floors and guaranteed income so a downturn never forces a sale."); }
    if (/aggressive/i.test(rt) && /Sell/.test(react)) { sc -= 10; d8.rationale.push("Stated tolerance and likely behaviour disagree."); }
    if (/Buy more|Hold/.test(react)) { sc += 5; d8.rationale.push("You would hold or buy through a downturn."); }
    const dp = parseInt(str(prot.divorceProtectionPriority), 10) || 0;
    const cp = parseInt(str(prot.creditorProtectionPriority), 10) || 0;
    if (dp >= 4) { if (yes(prot.prenup)) { sc += 10; d8.rationale.push("Divorce protection rated essential and a marital agreement is in place."); } else { sc -= 5; d8.rationale.push("Divorce protection rated essential but no marital agreement recorded."); d8.raise.push("Pair the priority with structure: a marital agreement and trust-owned assets."); } }
    if (cp >= 4) { if (str(prot.existingStructures).trim()) { sc += 10; d8.rationale.push("Creditor protection rated essential and structures already exist."); } else { d8.rationale.push("Creditor protection rated essential with no structures recorded."); d8.raise.push("Add asset-protection structures appropriate to your state."); } }
    if (num(ins.umbrellaLimit) > 0) { sc += 5; d8.rationale.push("Umbrella liability in place."); }
    if (est.hasIrrevocableTrust === true) { sc += 5; d8.rationale.push("An irrevocable trust shields part of the estate."); }
    if (str(prot.litigationExposure).trim()) { sc -= 5; d8.rationale.push("Specific litigation exposure noted."); }
    if (yes(prac.ownsPractice) && !/Yes, funded/.test(str(prac.buySellAgreement))) { sc -= 5; d8.rationale.push("Practice owned without a funded buy-sell agreement."); d8.raise.push("Fund the buy-sell agreement so a partner's death or disability doesn't become your problem."); }
    d8.score = clamp(sc);
  }

  const dimensions = [d1, d2, d3, d4, d5, d6, d7, d8];
  for (const d of dimensions) if (d.rationale.length === 0) d.rationale.push("Nothing in the assessment moves this score yet — complete the section to sharpen it.");
  const overall = clamp(dimensions.reduce((a, d) => a + d.score, 0) / dimensions.length);
  return { overall, tier: tierFor(overall), dimensions, assessmentPercent: c.percent, complete: c.complete };
}

function ageFrom(dob: unknown): number | null {
  if (typeof dob !== "string" || !dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}
