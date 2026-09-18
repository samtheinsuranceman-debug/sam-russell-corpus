import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, BarChart3, Building2, CheckCircle2, Database, Gauge,
  Layers, Loader2, LogOut, Play, ShieldAlert, Scale,
} from "lucide-react";

/**
 * RECIN Workspace — the seven client-facing screens from blueprint §14.
 *
 * Everything shown here is rendered from deterministic engine output returned
 * by the tRPC procedures. The page performs no financial math of its own: if a
 * number appears on this screen, an engine in shared/ computed it, which is
 * what makes the Evidence Ledger tab meaningful.
 */

/* ═══ Formatting ═══════════════════════════════════════════════════════════ */

const money = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : `$${Math.round(n).toLocaleString("en-US")}`;
const pct = (n: number | null | undefined, dp = 1) =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(dp)}%`;
const ratio = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : !Number.isFinite(n) ? "∞" : `${n.toFixed(2)}x`;

const SEVERITY_STYLE: Record<string, string> = {
  critical: "bg-red-500/15 text-red-300 border-red-500/30",
  high: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  medium: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  low: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  info: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const CONSTRAINT_LABEL: Record<string, string> = {
  ltv: "Loan-to-value",
  cltv: "Combined LTV (undrawn lines count)",
  dscr: "Debt service coverage",
  debt_yield: "Debt yield",
  ltc: "Loan-to-cost",
  arv: "After-repair value",
  liquidity: "Reserve runway",
  exit: "Exit coverage",
  unknown: "Not determined",
};

/* ═══ Demo scenario — the §15 workflow ═════════════════════════════════════ */

const DEMO_SCENARIO = {
  scenarioId: "demo-paid-off-rentals",
  properties: [
    {
      id: "propA", name: "Maple Duplex", value: 500_000,
      valueAsOf: "2026-08-01", valueSource: "appraisal" as const,
      annualGrossRent: 48_000, annualOperatingExpenses: 9_000,
      annualTaxes: 5_000, annualInsurance: 2_000, annualMaintenanceReserve: 2_400,
      occupancy: 0.95, ownershipType: "llc" as const, useType: "rental_1_4" as const,
      liens: [], adjustedBasis: 320_000, accumulatedDepreciation: 60_000,
    },
    {
      id: "propB", name: "Cedar Fourplex", value: 400_000,
      valueAsOf: "2026-08-01", valueSource: "appraisal" as const,
      annualGrossRent: 39_000, annualOperatingExpenses: 7_500,
      annualTaxes: 4_200, annualInsurance: 1_800, annualMaintenanceReserve: 1_950,
      occupancy: 0.95, ownershipType: "llc" as const, useType: "rental_1_4" as const,
      liens: [], earmarkedForSuccession: true,
    },
  ],
  debtOptions: [
    {
      id: "heloc", label: "HELOC", category: "heloc" as const, rate: 0.0875,
      rateType: "variable" as const, termMonths: 120, interestOnlyMonths: 120,
      maxLtv: 0.8, maxCltv: 0.8, closingCostsPct: 0.005,
      prepayment: { kind: "none" as const }, recourse: "full" as const,
      collateralMode: "single" as const, paymentMode: "interest_only" as const,
      termsSource: { status: "illustrative" as const },
    },
    {
      id: "dscr", label: "DSCR cash-out refinance", category: "dscr" as const, rate: 0.075,
      rateType: "fixed" as const, termMonths: 360, amortizationMonths: 360,
      maxLtv: 0.75, maxCltv: 0.75, minDscr: 1.25, pointsPct: 0.01, closingCostsPct: 0.02,
      prepayment: { kind: "step_down" as const, stepDownPctByYear: [0.05, 0.04, 0.03, 0.02, 0.01] },
      recourse: "limited" as const, collateralMode: "single" as const,
      paymentMode: "amortizing" as const, termsSource: { status: "illustrative" as const },
    },
    {
      id: "blanket", label: "Blanket DSCR", category: "blanket_dscr" as const, rate: 0.0775,
      rateType: "fixed" as const, termMonths: 360, amortizationMonths: 360,
      maxLtv: 0.7, maxCltv: 0.7, minDscr: 1.25, minimumDebtYield: 0.09,
      pointsPct: 0.01, closingCostsPct: 0.02,
      prepayment: { kind: "step_down" as const, stepDownPctByYear: [0.05, 0.04, 0.03] },
      recourse: "limited" as const, collateralMode: "blanket" as const,
      paymentMode: "amortizing" as const, termsSource: { status: "illustrative" as const },
    },
    {
      id: "bridge", label: "Bridge to DSCR", category: "bridge" as const, rate: 0.115,
      rateType: "variable" as const, termMonths: 18, interestOnlyMonths: 18,
      maxLtv: 0.75, maxLtc: 0.8, maxArv: 0.7, pointsPct: 0.02, closingCostsPct: 0.015,
      prepayment: { kind: "flat_pct" as const, flatPct: 0.01 },
      recourse: "full" as const, collateralMode: "single" as const,
      paymentMode: "interest_only" as const, termsSource: { status: "illustrative" as const },
    },
  ],
  assumptions: {
    vacancyRate: 0.07, rentGrowth: 0.03, expenseGrowth: 0.03, propertyValueGrowth: 0.03,
    rateShockBps: 0, exitMonths: 18, saleCostPct: 0.07,
    refinanceRate: 0.075, refinanceMaxLtv: 0.75, refinanceMinDscr: 1.25,
    taxReviewRequired: true,
  },
  liquidity: {
    totalLiquidReserves: 120_000,
    earmarkedRetirementBuffer: 60_000,
    monthlyFixedCostsOutsideProperty: 4_000,
  },
  requestedProceeds: 400_000,
  acquisition: {
    purchasePrice: 300_000, verifiedRehab: 75_000, eligibleClosingCosts: 10_000,
    afterRepairValue: 450_000, projectedAnnualGrossRent: 54_000,
    projectedAnnualOperatingExpenses: 20_000,
  },
};

type Result = any;

/* ═══ Shared bits ══════════════════════════════════════════════════════════ */

function Stat({ label, value, hint, tone = "default" }: {
  label: string; value: string; hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good" ? "text-[#22c55e]" : tone === "warn" ? "text-amber-300"
      : tone === "bad" ? "text-red-300" : "text-white";
  return (
    <div className="rc-card">
      <div className="text-xs uppercase tracking-wider text-[#7a95b8] mb-1.5">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      {hint && <div className="text-xs text-[#7a95b8] mt-1.5 leading-relaxed">{hint}</div>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rc-card text-sm text-[#7a95b8] text-center py-10">{children}</div>;
}

/* ═══ 1. Portfolio Map ═════════════════════════════════════════════════════ */

function PortfolioMap({ result }: { result: Result }) {
  const p = result.metrics.portfolioMetrics;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Portfolio value" value={money(p.totalValue)} />
        <Stat label="Underwritten NOI" value={money(p.totalNoi)} hint="Net of vacancy and reserves" />
        <Stat label="Existing debt" value={money(p.totalExistingDebt)} />
        <Stat
          label="Portfolio LTV"
          value={pct(p.portfolioLtv)}
          tone={p.portfolioLtv > 0.65 ? "warn" : "good"}
        />
      </div>

      {p.crossCollateralizedCount > 1 && (
        <div className="rc-card border-orange-500/30 bg-orange-500/5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-orange-300 mt-0.5 shrink-0" />
            <div className="text-sm text-[#c8d8ec]">
              <span className="font-semibold text-orange-300">Shared collateral: </span>
              {p.crossCollateralizedCount} properties totalling {money(p.crossCollateralExposureValue)} sit
              behind one loan. A default at any one of them can reach the others.
            </div>
          </div>
        </div>
      )}

      <div className="rc-card overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-[#7a95b8] text-xs uppercase tracking-wider border-b border-[#12233e]">
              <th className="pb-3 pr-4">Property</th>
              <th className="pb-3 pr-4 text-right">Value</th>
              <th className="pb-3 pr-4 text-right">NOI</th>
              <th className="pb-3 pr-4 text-right">Liens</th>
              <th className="pb-3 pr-4 text-right">Undrawn</th>
              <th className="pb-3 pr-4 text-right">LTV</th>
              <th className="pb-3 pr-4 text-right">DSCR</th>
              <th className="pb-3 pr-4 text-right">Capacity</th>
              <th className="pb-3">Binds on</th>
            </tr>
          </thead>
          <tbody>
            {result.metrics.propertyMetrics.map((m: any) => (
              <tr key={m.propertyId} className="border-b border-[#12233e]/50 last:border-0">
                <td className="py-3 pr-4">
                  <div className="text-white font-medium">{m.name}</div>
                  <div className="text-xs text-[#7a95b8] flex items-center gap-2 mt-0.5">
                    {m.isFreeAndClear && (
                      <span className="text-[#22c55e]">Free and clear</span>
                    )}
                    {m.crossCollateralized && (
                      <span className="text-orange-300">Cross-collateralized</span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4 text-right text-[#c8d8ec]">{money(m.value)}</td>
                <td className="py-3 pr-4 text-right text-[#c8d8ec]">{money(m.noi)}</td>
                <td className="py-3 pr-4 text-right text-[#c8d8ec]">
                  {money(m.existingSeniorBalance + m.existingJuniorBalance)}
                </td>
                <td className="py-3 pr-4 text-right text-[#c8d8ec]">
                  {m.undrawnAvailability > 0 ? money(m.undrawnAvailability) : "—"}
                </td>
                <td className="py-3 pr-4 text-right text-[#c8d8ec]">{pct(m.currentLtv)}</td>
                <td className="py-3 pr-4 text-right text-[#c8d8ec]">{ratio(m.currentDscr)}</td>
                <td className="py-3 pr-4 text-right text-white font-medium">
                  {money(m.bindingCapacity)}
                </td>
                <td className="py-3 text-xs text-amber-300">
                  {CONSTRAINT_LABEL[m.bindingConstraint] ?? m.bindingConstraint}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══ 2. Capital Capacity ══════════════════════════════════════════════════ */

function CapitalCapacity({ result }: { result: Result }) {
  const s = result.summary;
  const gap = s.maximumCollateralCapacity - s.recommendedMaximumPrudentCapacity;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat
          label="Collateral capacity"
          value={money(s.maximumCollateralCapacity)}
          hint="What the property value alone would support"
        />
        <Stat
          label="Income capacity"
          value={money(s.maximumIncomeSupportedCapacity)}
          hint="What the rent will actually service"
        />
        <Stat
          label="Prudent capacity"
          value={money(s.recommendedMaximumPrudentCapacity)}
          tone="good"
          hint="What survives the conservative stress"
        />
      </div>

      <div className="rc-card">
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={16} className="text-amber-300" />
          <h3 className="text-white font-semibold">
            Binding constraint: {CONSTRAINT_LABEL[s.bindingConstraint] ?? s.bindingConstraint}
          </h3>
        </div>
        <p className="text-sm text-[#7a95b8] leading-relaxed">
          This is the test that runs out first. Attacking any other constraint moves the
          number by zero — if income binds, adding collateral changes nothing.
        </p>
      </div>

      {gap > 0 && (
        <div className="rc-card border-amber-400/30 bg-amber-400/5">
          <h3 className="text-amber-300 font-semibold mb-2">
            {money(gap)} between the lender maximum and the prudent maximum
          </h3>
          <p className="text-sm text-[#c8d8ec]/80 leading-relaxed">
            That gap is not unused capacity. It is the margin that keeps the plan solvent when
            assumptions move — borrowing to the lender maximum hands the entire margin of safety
            to the lender.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Stat
          label="Severe-case reserves"
          value={`${s.minimumReserveMonths.toFixed(1)} months`}
          tone={s.minimumReserveMonths < result.policyUsed.targetReserveMonths ? "warn" : "good"}
          hint={`Policy target: ${result.policyUsed.targetReserveMonths} months. Only unallocated cash counts.`}
        />
        {s.shortfallAgainstRequest !== null && (
          <Stat
            label="Against the request"
            value={
              s.shortfallAgainstRequest > 0
                ? `${money(s.shortfallAgainstRequest)} short`
                : `${money(-s.shortfallAgainstRequest)} headroom`
            }
            tone={s.shortfallAgainstRequest > 0 ? "bad" : "good"}
          />
        )}
      </div>
    </div>
  );
}

/* ═══ 3. Strategy Compare ══════════════════════════════════════════════════ */

function StrategyCompare({ result, ranked }: { result: Result; ranked: any[] }) {
  const byId = useMemo(
    () => Object.fromEntries(result.options.map((o: any) => [o.optionId, o])),
    [result],
  );
  return (
    <div className="space-y-5">
      <div className="rc-card">
        <p className="text-sm text-[#7a95b8] leading-relaxed">
          Ranked by <span className="text-white font-medium">fragility</span>, not by size of
          loan. The least fragile structure that meets the objective wins; "borrow the most" is
          the wrong objective.
        </p>
      </div>

      <div className="space-y-4">
        {ranked.map((r) => {
          const o = byId[r.optionId];
          if (!o) return null;
          return (
            <div key={r.optionId} className="rc-card">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22c55e]/12 border border-[#22c55e]/25 flex items-center justify-center text-[#22c55e] font-bold text-sm shrink-0">
                    {r.rank}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{r.label}</h3>
                    <div className="text-xs text-[#7a95b8] mt-0.5">
                      Binds on {CONSTRAINT_LABEL[o.bindingConstraint] ?? o.bindingConstraint}
                      {" · "}Illustrative terms, not a quote
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {money(o.recommendedMaximumPrudentCapacity)}
                  </div>
                  <div className="text-xs text-[#7a95b8]">
                    fragility {(r.fragility * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {!o.eligible && (
                <div className="mb-4 text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                  {o.ineligibleReasons.join(" · ")}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-[#7a95b8] text-xs uppercase tracking-wider border-b border-[#12233e]">
                      <th className="pb-2 pr-4">Scenario</th>
                      <th className="pb-2 pr-4 text-right">Proceeds</th>
                      <th className="pb-2 pr-4 text-right">DSCR</th>
                      <th className="pb-2 pr-4 text-right">LTV</th>
                      <th className="pb-2 pr-4 text-right">Reserves</th>
                      <th className="pb-2">Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(["base", "conservative", "severe"] as const).map((k) => {
                      const sc = o.scenarios[k];
                      return (
                        <tr key={k} className="border-b border-[#12233e]/50 last:border-0">
                          <td className="py-2 pr-4 capitalize text-[#c8d8ec]">{k}</td>
                          <td className="py-2 pr-4 text-right text-[#c8d8ec]">
                            {money(sc.supportedProceeds)}
                          </td>
                          <td className="py-2 pr-4 text-right text-[#c8d8ec]">{ratio(sc.dscr)}</td>
                          <td className="py-2 pr-4 text-right text-[#c8d8ec]">{pct(sc.ltv)}</td>
                          <td className="py-2 pr-4 text-right text-[#c8d8ec]">
                            {Number.isFinite(sc.reserveMonths) ? `${sc.reserveMonths.toFixed(1)}m` : "∞"}
                          </td>
                          <td className="py-2">
                            {sc.passesPolicy ? (
                              <span className="text-[#22c55e] text-xs flex items-center gap-1">
                                <CheckCircle2 size={12} /> Passes
                              </span>
                            ) : (
                              <span className="text-amber-300 text-xs" title={sc.failures.join(" · ")}>
                                {sc.failures.length} miss{sc.failures.length === 1 ? "" : "es"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ 4. Exit Map ══════════════════════════════════════════════════════════ */

function ExitMap({ result }: { result: Result }) {
  const withExit = result.options.filter((o: any) => o.exitAnalysis);
  if (withExit.length === 0) {
    return (
      <Empty>
        No option in this scenario repays from a defined exit. Exit analysis applies to bridge
        and hard-money structures, which are repaid by a sale or refinance rather than by rent.
      </Empty>
    );
  }
  return (
    <div className="space-y-5">
      <div className="rc-card">
        <p className="text-sm text-[#7a95b8] leading-relaxed">
          A bridge is only as sound as its exit. Take-out readiness asks whether the permanent
          refinance passes its <span className="text-white">own</span> LTV, DSCR and debt-yield
          tests — an untested exit scores zero.
        </p>
      </div>
      {withExit.map((o: any) => {
        const e = o.exitAnalysis;
        const t = e.takeoutReadiness;
        return (
          <div key={o.optionId} className="rc-card">
            <h3 className="text-white font-semibold mb-4">{o.label}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs text-[#7a95b8] mb-1">Payoff at exit</div>
                <div className="text-white font-semibold">{money(e.payoffAtExit)}</div>
              </div>
              <div>
                <div className="text-xs text-[#7a95b8] mb-1">Take-out proceeds</div>
                <div className="text-white font-semibold">{money(t.refinanceProceeds)}</div>
              </div>
              <div>
                <div className="text-xs text-[#7a95b8] mb-1">Exit coverage</div>
                <div className={`font-semibold ${e.exitCoverage < 1 ? "text-red-300" : e.exitCoverage < 1.1 ? "text-amber-300" : "text-[#22c55e]"}`}>
                  {ratio(e.exitCoverage)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#7a95b8] mb-1">Readiness</div>
                <div className={`font-semibold ${t.score < 0.3 ? "text-red-300" : t.score < 0.6 ? "text-amber-300" : "text-[#22c55e]"}`}>
                  {(t.score * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {([["LTV", t.passesLtv], ["DSCR", t.passesDscr], ["Debt yield", t.passesDebtYield]] as const).map(
                ([label, ok]) => (
                  <span
                    key={label}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      ok
                        ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/25"
                        : "bg-red-500/10 text-red-300 border-red-500/25"
                    }`}
                  >
                    {label} {ok ? "passes" : "fails"}
                  </span>
                ),
              )}
            </div>

            {t.blockers.length > 0 && (
              <ul className="text-sm text-[#c8d8ec]/80 space-y-1">
                {t.blockers.map((b: string) => (
                  <li key={b} className="flex items-start gap-2">
                    <AlertTriangle size={13} className="text-amber-300 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══ 5. Risk Radar ════════════════════════════════════════════════════════ */

function RiskRadar({ result }: { result: Result }) {
  const findings = result.findings as any[];
  if (findings.length === 0) return <Empty>No findings were raised for this scenario.</Empty>;
  return (
    <div className="space-y-4">
      {findings.map((f, i) => (
        <div key={`${f.code}-${i}`} className="rc-card">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${SEVERITY_STYLE[f.severity]}`}>
                {f.severity}
              </span>
              <span className="text-[10px] text-[#7a95b8] uppercase tracking-wider">
                {f.category}
              </span>
              <code className="text-[10px] text-[#4a6585]">{f.code}</code>
            </div>
            <div className="text-xs text-[#7a95b8]">
              confidence {pct(f.confidence, 0)} · materiality {pct(f.materiality, 0)}
            </div>
          </div>

          <h3 className="text-white font-semibold mb-2">{f.title}</h3>
          <p className="text-sm text-[#c8d8ec]/80 leading-relaxed mb-3">{f.detail}</p>

          <div className="text-sm text-[#22c55e]/90 mb-3 leading-relaxed">
            <span className="font-medium">Do this: </span>{f.recommendation}
          </div>

          {/* The "why this observation exists" panel — blueprint §13.12 */}
          <details className="text-xs">
            <summary className="cursor-pointer text-[#7a95b8] hover:text-white transition-colors select-none">
              Why this exists
            </summary>
            <div className="mt-3 pl-3 border-l border-[#12233e] space-y-2">
              <div>
                <div className="text-[#7a95b8] mb-1">Computed from</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(f.evidence).map(([k, v]) => (
                    <span key={k} className="bg-[#0b1628] border border-[#12233e] rounded px-2 py-0.5 text-[#c8d8ec]">
                      {k}: <span className="text-white">{String(v)}</span>
                    </span>
                  ))}
                </div>
              </div>
              {f.invalidatedBy && (
                <div>
                  <div className="text-[#7a95b8] mb-1">What would change this</div>
                  <div className="text-[#c8d8ec]">{f.invalidatedBy}</div>
                </div>
              )}
              {f.requiredReviewer && (
                <div className="text-[#7a95b8]">
                  Requires <span className="text-amber-300 uppercase">{f.requiredReviewer}</span> review
                </div>
              )}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}

/* ═══ 6. Evidence Ledger ═══════════════════════════════════════════════════ */

function EvidenceLedger({ result }: { result: Result }) {
  const channels = trpc.realEstateCapital.dataChannels.useQuery();

  return (
    <div className="space-y-5">
      <div className="rc-card">
        <h3 className="text-white font-semibold mb-3">Policy thresholds in force</h3>
        <p className="text-xs text-[#7a95b8] mb-4 leading-relaxed">
          Every finding was judged against these. A finding is only defensible if the reader can
          see the threshold behind it.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
          {Object.entries(result.policyUsed).map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-[#7a95b8]">
                {k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
              </div>
              <div className="text-white font-medium">{String(v)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rc-card">
        <h3 className="text-white font-semibold mb-3">External data channels</h3>
        <p className="text-xs text-[#7a95b8] mb-4 leading-relaxed">
          Which figures could possibly be live, and which are entered by hand. A channel that is
          not operational returns nothing — it never substitutes an estimate.
        </p>
        {channels.isLoading && (
          <div className="text-sm text-[#7a95b8] flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading channel status…
          </div>
        )}
        {channels.data && (
          <div className="space-y-1.5">
            {channels.data.channels.map((c: any) => (
              <div
                key={c.channel}
                className="flex items-center justify-between gap-4 py-2 border-b border-[#12233e]/50 last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-sm text-[#c8d8ec] truncate">{c.label}</div>
                  <div className="text-xs text-[#7a95b8]">
                    Phase {c.phase}
                    {c.consentScope && <> · consent: {c.consentScope}</>}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                    c.operational
                      ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/25"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/25"
                  }`}
                >
                  {c.operational ? "Live" : !c.enabled ? "Not enabled" : "No credential"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {result.requiredInputs.length > 0 && (
        <div className="rc-card">
          <h3 className="text-white font-semibold mb-3">Missing inputs</h3>
          <div className="space-y-3">
            {result.requiredInputs.map((m: any) => (
              <div key={m.field} className="text-sm">
                <code className="text-amber-300 text-xs">{m.field}</code>
                {m.blocksCalculation && (
                  <span className="ml-2 text-[10px] uppercase text-red-300">blocks calculation</span>
                )}
                <div className="text-[#7a95b8] text-xs mt-1 leading-relaxed">{m.whyItMatters}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rc-card">
        <h3 className="text-white font-semibold mb-3">Disclaimers</h3>
        <ul className="space-y-2">
          {result.disclaimers.map((d: string) => (
            <li key={d} className="text-xs text-[#7a95b8] leading-relaxed flex gap-2">
              <span className="text-[#4a6585]">·</span>{d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ═══ 7. Advisor Review Queue ══════════════════════════════════════════════ */

function ReviewQueue({ result }: { result: Result }) {
  const reviewable = useMemo(
    () =>
      (result.findings as any[]).map((f, i) => ({
        id: `${f.code}-${i}`,
        scenarioRunId: "current",
        findingCode: f.code,
        severity: f.severity,
        title: f.title,
        confidence: f.confidence ?? 0.8,
        materiality: f.materiality ?? 0.5,
        requiredReviewer: f.requiredReviewer ?? "advisor",
        advisorStatus: "pending" as const,
      })),
    [result],
  );

  const queue = trpc.realEstateCapital.reviewQueue.useMutation();
  const data = queue.data;

  return (
    <div className="space-y-5">
      <div className="rc-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold mb-1">Review queue</h3>
          <p className="text-xs text-[#7a95b8] leading-relaxed max-w-lg">
            Ordered by severity weighted by confidence and materiality — a certain, material
            finding outranks a speculative critical one.
          </p>
        </div>
        <button
          onClick={() => queue.mutate({ findings: reviewable })}
          disabled={queue.isPending}
          className="rc-btn rc-btn-primary text-sm shrink-0"
        >
          {queue.isPending ? <Loader2 size={14} className="animate-spin" /> : <Scale size={14} />}
          Build queue
        </button>
      </div>

      {data && (
        <>
          <div
            className={`rc-card ${
              data.releaseGate.releasable
                ? "border-[#22c55e]/30 bg-[#22c55e]/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="flex items-start gap-3">
              {data.releaseGate.releasable ? (
                <CheckCircle2 size={18} className="text-[#22c55e] mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={18} className="text-red-300 mt-0.5 shrink-0" />
              )}
              <div>
                <div className={`font-semibold mb-1 ${data.releaseGate.releasable ? "text-[#22c55e]" : "text-red-300"}`}>
                  {data.releaseGate.releasable ? "Cleared for client release" : "Not cleared for client release"}
                </div>
                <div className="text-sm text-[#c8d8ec]/80">{data.releaseGate.reason}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(data.byReviewer).map(([reviewer, items]: [string, any]) => (
              <div key={reviewer} className="rc-card text-center py-4">
                <div className="text-2xl font-bold text-white">{items.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mt-1">
                  {reviewer}
                </div>
              </div>
            ))}
          </div>

          <div className="rc-card">
            <div className="space-y-3">
              {data.queue.map((f: any, i: number) => (
                <div
                  key={f.id}
                  className="flex items-start gap-3 py-2 border-b border-[#12233e]/50 last:border-0"
                >
                  <div className="text-xs text-[#4a6585] w-5 shrink-0 pt-1">{i + 1}</div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border shrink-0 ${SEVERITY_STYLE[f.severity]}`}>
                    {f.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white">{f.title}</div>
                    <div className="text-xs text-[#7a95b8] mt-0.5">
                      {f.requiredReviewer} · confidence {pct(f.confidence, 0)} · materiality {pct(f.materiality, 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ Page ═════════════════════════════════════════════════════════════════ */

const TABS = [
  { id: "portfolio", label: "Portfolio Map", icon: Building2 },
  { id: "capacity", label: "Capital Capacity", icon: Gauge },
  { id: "compare", label: "Strategy Compare", icon: Layers },
  { id: "exit", label: "Exit Map", icon: LogOut },
  { id: "risk", label: "Risk Radar", icon: ShieldAlert },
  { id: "evidence", label: "Evidence Ledger", icon: Database },
  { id: "review", label: "Review Queue", icon: Scale },
] as const;

export default function RECINWorkspace() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("portfolio");
  const compare = trpc.realEstateCapital.compareStrategies.useMutation();
  const result = compare.data?.result;

  return (
    <div className="min-h-screen bg-[#060f20] text-[#c8d8ec]">
      <div className="container py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[10px] font-medium tracking-widest uppercase mb-3">
              <BarChart3 size={12} /> RECIN
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
              Real Estate Capital Intelligence
            </h1>
            <p className="text-sm text-[#7a95b8] mt-2 max-w-2xl leading-relaxed">
              Decision support, not a loan approval. Terms shown are illustrative and are not
              quotes; tax treatment requires CPA confirmation.
            </p>
          </div>
          <button
            onClick={() => compare.mutate(DEMO_SCENARIO as any)}
            disabled={compare.isPending}
            className="rc-btn rc-btn-primary shrink-0"
          >
            {compare.isPending ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {result ? "Re-run analysis" : "Run analysis"}
          </button>
        </div>

        {compare.error && (
          <div className="rc-card border-red-500/30 bg-red-500/5 text-sm text-red-300">
            {compare.error.message}
          </div>
        )}

        {!result && !compare.isPending && (
          <Empty>
            Run the analysis to model the sample scenario: a client with two paid-off rentals
            choosing between a HELOC, a DSCR cash-out, a blanket DSCR loan, and a bridge-to-DSCR
            sequence.
          </Empty>
        )}

        {result && (
          <>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm whitespace-nowrap transition-colors border ${
                      active
                        ? "bg-[#22c55e]/12 border-[#22c55e]/30 text-[#22c55e]"
                        : "bg-transparent border-[#12233e] text-[#7a95b8] hover:text-white"
                    }`}
                  >
                    <Icon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {tab === "portfolio" && <PortfolioMap result={result} />}
            {tab === "capacity" && <CapitalCapacity result={result} />}
            {tab === "compare" && (
              <StrategyCompare result={result} ranked={compare.data!.ranked} />
            )}
            {tab === "exit" && <ExitMap result={result} />}
            {tab === "risk" && <RiskRadar result={result} />}
            {tab === "evidence" && <EvidenceLedger result={result} />}
            {tab === "review" && <ReviewQueue result={result} />}
          </>
        )}
      </div>
    </div>
  );
}
