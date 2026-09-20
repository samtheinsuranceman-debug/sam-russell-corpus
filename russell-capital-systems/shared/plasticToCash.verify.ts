import { projectPlasticToCash, projectCardCost, DEFAULT_ASSUMPTIONS, usableCards,
         verifiedCardFundingCeiling, ZERO_APR_CARDS, STRATEGY_WEAKNESSES } from "./plasticToCash.ts";
let pass = 0, fail = 0;
const t = (name: string, fn: () => void) => { try { fn(); pass++; console.log("  PASS  " + name); } catch (e: any) { fail++; console.log("  FAIL  " + name + " -> " + e.message); } };
const ok = (c: boolean, m: string) => { if (!c) throw new Error(m); };
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

t("loan mechanism: 20 rows, positive arbitrage", () => {
  const r = projectPlasticToCash({ ...DEFAULT_ASSUMPTIONS, years: 20 });
  ok(r.rows.length === 20, "rows"); ok(r.netArbitrage > 0, "arbitrage not positive");
  ok(r.totalIndexCredits > r.totalLoanCharges, "credits <= charges");
});
t("withdrawal yields less than loan", () => {
  const l = projectPlasticToCash({ ...DEFAULT_ASSUMPTIONS, mechanism: "participating-loan" });
  const w = projectPlasticToCash({ ...DEFAULT_ASSUMPTIONS, mechanism: "withdrawal" });
  ok(w.totalIndexCredits < l.totalIndexCredits, "withdrawal >= loan");
});
t("myth scenario flagged and inflated", () => {
  const m = projectPlasticToCash({ ...DEFAULT_ASSUMPTIONS, mechanism: "benefit-base-myth" });
  const r = projectPlasticToCash({ ...DEFAULT_ASSUMPTIONS, mechanism: "participating-loan" });
  ok(/NOT ACHIEVABLE/.test(m.warnings[0]), "not flagged");
  ok(m.finalAccountValue > r.finalAccountValue, "myth not larger");
});
t("warns when arbitrage inverts", () => {
  const r = projectPlasticToCash({ ...DEFAULT_ASSUMPTIONS, indexCreditRate: 0.04, loanChargeRate: 0.05 });
  ok(/zero or negative/.test(r.warnings.join(" ")), "no inversion warning");
});
t("0% floor holds", () => {
  const r = projectPlasticToCash({ ...DEFAULT_ASSUMPTIONS, indexCreditRate: 0 });
  ok(r.rows.every(x => x.indexCredit >= 0), "negative credit");
});
t("Citi Double Cash excluded from usable cards", () => {
  ok(!usableCards().find(c => c.id === "citi-double-cash"), "not excluded");
  ok(ZERO_APR_CARDS.find(c => c.id === "citi-double-cash")!.introPurchase.value === 0, "not zero");
});
t("usable cards sorted longest-first", () => {
  const u = usableCards(); ok(u[0].introPurchase.value === 21, "top not 21");
  for (let i = 1; i < u.length; i++) ok(u[i-1].introPurchase.value! >= u[i].introPurchase.value!, "unsorted");
});
t("no card interest inside intro window, interest outside", () => {
  const i = projectCardCost({ chargedPerCard: 20000, cards: ["bankamericard"], monthsToRepay: 18, useWorstCaseApr: true });
  const o = projectCardCost({ chargedPerCard: 20000, cards: ["bankamericard"], monthsToRepay: 30, useWorstCaseApr: true });
  ok(i.totalInterestWorstCase === 0, "interest inside window"); ok(o.totalInterestWorstCase > 0, "no interest outside");
});
t("cash-advance downside is severe", () => {
  const r = projectCardCost({ chargedPerCard: 20000, cards: ["chase-slate"], monthsToRepay: 18, useWorstCaseApr: true });
  ok(r.perCard[0].interestIfUnpaid === 0, "purchase interest nonzero");
  ok(r.perCard[0].cashAdvanceDownside! > 5000, "CA downside too low");
});
t("verified funding ceiling is the honest number", () => {
  const c = verifiedCardFundingCeiling();
  ok(c.annual === 10000, "ceiling " + c.annual); ok(/Penn Mutual/.test(c.basis), "basis");
});
t("every card and the strategy state weaknesses", () => {
  ok(ZERO_APR_CARDS.every(c => c.weaknesses.length > 0), "card without weakness");
  ok(STRATEGY_WEAKNESSES.length >= 10, "too few strategy weaknesses");
});

console.log(`\n${pass} passed, ${fail} failed\n`);
console.log("─── 20-year projection, participating loan, $119,988/yr, 9% credit, 5% loan ───");
const r = projectPlasticToCash(DEFAULT_ASSUMPTIONS);
for (const y of [1,2,5,10,20]) { const x = r.rows[y-1];
  console.log(`  yr ${String(y).padStart(2)}  AV ${usd(x.accountValue).padStart(12)}  credit ${usd(x.indexCredit).padStart(11)}  loan bal ${usd(x.loanBalance).padStart(12)}  cash out ${usd(x.accessibleCash).padStart(11)}`); }
console.log(`  TOTALS  premium ${usd(r.totalPremium)}  charges ${usd(r.totalPolicyCharges)}  credits ${usd(r.totalIndexCredits)}  loan cost ${usd(r.totalLoanCharges)}  NET ${usd(r.netArbitrage)}`);
const m = projectPlasticToCash({ ...DEFAULT_ASSUMPTIONS, mechanism: "benefit-base-myth" });
console.log(`\n  Correct (participating loan) final account value: ${usd(r.finalAccountValue)}`);
console.log(`  The "account value never goes down" version:      ${usd(m.finalAccountValue)}   <-- NOT ACHIEVABLE`);
console.log(`  Overstatement factor: ${(m.finalAccountValue / r.finalAccountValue).toFixed(1)}x`);
console.log(`\n  Verified card funding ceiling: ${usd(verifiedCardFundingCeiling().annual)}/yr vs the ${usd(DEFAULT_ASSUMPTIONS.annualPremium)}/yr the model assumes.`);
process.exit(fail ? 1 : 0);
