// Exercises the live calculator-chain API from outside: catalog, one
// deterministic run, one 10,000-simulation run, and a ZIP history window.
const BASE = (process.env.BASE_URL || "https://web-production-4b215.up.railway.app").replace(/\/$/, "");
const q = async (proc, input) => {
  const url = `${BASE}/api/trpc/${proc}?input=${encodeURIComponent(JSON.stringify({ json: input ?? null }))}`;
  const r = await fetch(url, { headers: { "user-agent": "rcs-chain-probe" } });
  const body = await r.json().catch(() => null);
  return { status: r.status, data: body?.result?.data?.json ?? body?.result?.data, error: body?.error?.json?.message ?? body?.error?.message };
};
const m = async (proc, input) => {
  const r = await fetch(`${BASE}/api/trpc/${proc}`, { method: "POST", headers: { "content-type": "application/json", "user-agent": "rcs-chain-probe" }, body: JSON.stringify({ json: input }) });
  const body = await r.json().catch(() => null);
  return { status: r.status, data: body?.result?.data?.json ?? body?.result?.data, error: body?.error?.json?.message ?? body?.error?.message };
};

const profile = { clientAge: 45, spouseAge: null, incomeSelfAnnual: 350000, incomeSpouseAnnual: 0, otherIncomeAnnual: 0, incomeGrowthPct: 3, baseHouseholdExpensesAnnual: 150000, expenseChanges: [], effectiveTaxRatePct: 32, taxableAssets: 200000, qualifiedAssets: 400000, cashReserves: 60000, home: { value: 800000, mortgageBalance: 500000, mortgageRatePct: 6.5, mortgagePaymentAnnual: 38000 }, otherDebts: [{ name: "Student loans", balance: 120000, ratePct: 6, paymentAnnual: 15000 }] };
const steps = [
  { id: "s1", calculator: "mortgage-killer", years: 7, goal: "Kill the mortgage", params: { mortgageKiller: { extraPrincipalPctOfNetCash: 50 } }, handoff: { enabled: true, atYear: null, pctOfCashValue: 40, target: null } },
  { id: "s2", calculator: "equity-deployment", years: 8, params: { equityDeployment: { pctOfHomeEquityDeployed: 50 }, trustIUL: { premiumAnnual: 30000, premiumYears: 5, incomeStartYear: 99 } }, handoff: { enabled: true, atYear: null, pctOfCashValue: 30, target: null } },
  { id: "s3", calculator: "real-estate-rentals", years: 8, params: { realEstate: { rentalMode: "ltr", ltrNetYieldPctOfValue: 5 } }, handoff: { enabled: true, atYear: null, pctOfCashValue: 25, target: null } },
  { id: "s4", calculator: "retirement-income", years: 7, params: { incomeAnnuity: { premium: 0, startYear: 1, payoutRatePct: 6 }, trustIUL: { premiumAnnual: 0, premiumYears: 0, incomeStartYear: 1, incomeRatePct: 4 } }, handoff: { enabled: false, atYear: null, pctOfCashValue: 0, target: null } },
];
const macro = { startYear: 2026, baselineCpiPct: 2.5, moneyPrinting: { enabled: true, preset: "print-2020-2021", m2GrowthPct: 18, m2VolPct: 6, trendM2GrowthPct: 6, passThrough: 0.5, lagYears: 1 }, hardAssets: { enabled: true, betaRealEstate: 0.6, betaEquities: 0.8, betaCrypto: 2.5 }, credit: { enabled: true, baseMortgageRatePct: 6.5, rateSensitivityPer10: -1.5, availabilityFloor: 0.5, availabilityCeiling: 1.5 }, futureTaxation: { enabled: true, startEffectiveRatePct: 32, driftPctPointsPerYear: 0.25, capPct: 50 } };

const out = {};
const cat = await q("chain.catalog");
out.catalog = { status: cat.status, calculators: cat.data?.calculators?.length, error: cat.error };
const run = await m("chain.run", { profile, steps, macro });
out.run = { status: run.status, error: run.error, aggregate: run.data?.aggregate, transfers: run.data?.transfers?.length, steps: run.data?.steps?.map((s) => ({ name: s.name, years: `${s.startYear}-${s.endYear}`, contribution: s.contribution, handoff: s.handoff?.amount ?? null })) };
const t0 = Date.now();
const mc = await m("chain.monteCarlo", { profile, steps, macro, simulations: 10000, seed: 42 });
out.monteCarlo = { status: mc.status, error: mc.error, simulations: mc.data?.simulations, serverMs: mc.data?.elapsedMs, wallMs: Date.now() - t0, final: mc.data?.final, bands: mc.data?.netWorth?.length };
const zip = await q("zip.history", { zip: "28429", fromYear: 1990 });
out.zipHistory = { status: zip.status, error: zip.error, window: zip.data?.window, windowAppreciationPct: zip.data?.windowAppreciationPct, windowRentGrowthPct: zip.data?.windowRentGrowthPct, coverage: zip.data?.coverage, note: zip.data?.note };
console.log(JSON.stringify(out, null, 2));
const ok = out.catalog.status === 200 && out.run.status === 200 && out.monteCarlo.status === 200 && out.monteCarlo.simulations === 10000 && out.zipHistory.status === 200;
console.log(ok ? "CHAIN_PROBE_OK" : "CHAIN_PROBE_FAILED");
process.exit(ok ? 0 : 1);
