// ───────────────────────────────────────────────────────────────────────────
// SI-029 · IUL Policy Loan Optimization Engine (IPLOE)
// Variable rate hedging, wash loan arbitrage detection, and multi-policy loan
// coordination across a portfolio of contracts.
// ───────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Layers, ArrowRightLeft, AlertTriangle, Waves } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

type LoanType = "fixed" | "variable" | "wash";

interface PolicyRow {
  id: string;
  label: string;
  carrier: string;
  cashValue: number;
  deathBenefit: number;
  creditingRate: number;
  loanRate: number;
  loanType: LoanType;
  hasWashProvision: boolean;
  washAvailableAtYear: number;
  policyYear: number;
  maxLoanToValue: number;
  existingLoanBalance: number;
  annualPremium: number;
}

const seed = (): PolicyRow[] => [
  { id: "a", label: "Legacy Builder", carrier: "Carrier A", cashValue: 420_000, deathBenefit: 1_250_000, creditingRate: 0.065, loanRate: 0.05, loanType: "wash", hasWashProvision: true, washAvailableAtYear: 10, policyYear: 14, maxLoanToValue: 0.9, existingLoanBalance: 0, annualPremium: 0 },
  { id: "b", label: "Accumulator II", carrier: "Carrier B", cashValue: 360_000, deathBenefit: 900_000, creditingRate: 0.072, loanRate: 0.055, loanType: "variable", hasWashProvision: false, washAvailableAtYear: 10, policyYear: 7, maxLoanToValue: 0.9, existingLoanBalance: 40_000, annualPremium: 24_000 },
];

const RISK_STYLE: Record<string, string> = {
  safe: "border-emerald-400/30 text-emerald-300",
  caution: "border-amber-400/40 text-amber-300",
  danger: "border-rose-500/40 text-rose-300",
};

export default function IULLoanOptimizer() {
  const [policies, setPolicies] = useState<PolicyRow[]>(seed);
  const [currentAge, setCurrentAge] = useState(55);
  const [retirementAge, setRetirementAge] = useState(65);
  const [annualIncomeNeeded, setAnnualIncomeNeeded] = useState(60_000);
  const [projectionYears, setProjectionYears] = useState(20);
  const [marginalTaxRate, setMarginalTaxRate] = useState(35);
  const [rateCycleAmplitude, setRateCycleAmplitude] = useState(4);
  const [rateCycleYears, setRateCycleYears] = useState(7);

  const run = trpc.si.iulLoanOptimizer.useMutation({
    onSuccess: () => toast.success("Loan portfolio optimized"),
    onError: e => toast.error(e.message),
  });

  const update = (id: string, patch: Partial<PolicyRow>) =>
    setPolicies(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const analyze = () =>
    run.mutate({
      policies,
      currentAge,
      retirementAge,
      annualIncomeNeeded,
      projectionYears,
      marginalTaxRate: marginalTaxRate / 100,
      rateCycleAmplitude: rateCycleAmplitude / 100,
      rateCycleYears,
    });

  const result = run.data;

  return (
    <AppShell
      title="IUL Policy Loan Optimizer"
      subtitle="SI-029 · Rate hedging, wash loan arbitrage, and multi-policy coordination"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-500" />
              Policy portfolio
            </CardTitle>
            <CardDescription>
              Calibrated for 2+ policies with combined cash value above $500,000, where coordination across contracts
              exposes opportunities invisible at the single-policy level.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3">Policy</th>
                    <th className="pb-2 pr-3">Cash value</th>
                    <th className="pb-2 pr-3">Crediting %</th>
                    <th className="pb-2 pr-3">Loan %</th>
                    <th className="pb-2 pr-3">Type</th>
                    <th className="pb-2 pr-3">Wash</th>
                    <th className="pb-2 pr-3">Vests yr</th>
                    <th className="pb-2 pr-3">Policy yr</th>
                    <th className="pb-2 pr-3">Premium</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {policies.map(p => (
                    <tr key={p.id} className="border-b border-border/40">
                      <td className="py-2 pr-3"><Input value={p.label} onChange={e => update(p.id, { label: e.target.value })} className="h-8 w-32" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={p.cashValue} onChange={e => update(p.id, { cashValue: +e.target.value })} className="h-8 w-28" /></td>
                      <td className="py-2 pr-3"><Input type="number" step="0.1" value={(p.creditingRate * 100).toFixed(1)} onChange={e => update(p.id, { creditingRate: +e.target.value / 100 })} className="h-8 w-20" /></td>
                      <td className="py-2 pr-3"><Input type="number" step="0.1" value={(p.loanRate * 100).toFixed(1)} onChange={e => update(p.id, { loanRate: +e.target.value / 100 })} className="h-8 w-20" /></td>
                      <td className="py-2 pr-3">
                        <select value={p.loanType} onChange={e => update(p.id, { loanType: e.target.value as LoanType })} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                          <option value="fixed">Fixed</option>
                          <option value="variable">Variable</option>
                          <option value="wash">Wash</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input type="checkbox" checked={p.hasWashProvision} onChange={e => update(p.id, { hasWashProvision: e.target.checked })} />
                      </td>
                      <td className="py-2 pr-3"><Input type="number" value={p.washAvailableAtYear} onChange={e => update(p.id, { washAvailableAtYear: +e.target.value })} className="h-8 w-16" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={p.policyYear} onChange={e => update(p.id, { policyYear: +e.target.value })} className="h-8 w-16" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={p.annualPremium} onChange={e => update(p.id, { annualPremium: +e.target.value })} className="h-8 w-24" /></td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" onClick={() => setPolicies(ps => ps.filter(x => x.id !== p.id))} disabled={policies.length <= 1} aria-label={`Remove ${p.label}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
              <div>
                <Label className="text-xs text-muted-foreground">Current age</Label>
                <Input type="number" value={currentAge} onChange={e => setCurrentAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Retirement age</Label>
                <Input type="number" value={retirementAge} onChange={e => setRetirementAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Income needed</Label>
                <Input type="number" value={annualIncomeNeeded} onChange={e => setAnnualIncomeNeeded(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Projection yrs</Label>
                <Input type="number" value={projectionYears} onChange={e => setProjectionYears(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Marginal tax %</Label>
                <Input type="number" value={marginalTaxRate} onChange={e => setMarginalTaxRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Rate swing %</Label>
                <Input type="number" step="0.1" value={rateCycleAmplitude} onChange={e => setRateCycleAmplitude(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cycle length</Label>
                <Input type="number" value={rateCycleYears} onChange={e => setRateCycleYears(+e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setPolicies(ps => [...ps, { id: `p${Date.now()}`, label: `Policy ${ps.length + 1}`, carrier: "Carrier", cashValue: 250_000, deathBenefit: 700_000, creditingRate: 0.065, loanRate: 0.05, loanType: "fixed", hasWashProvision: false, washAvailableAtYear: 10, policyYear: 5, maxLoanToValue: 0.9, existingLoanBalance: 0, annualPremium: 0 }])}
              >
                <Plus className="mr-1 h-4 w-4" /> Add policy
              </Button>
              <Button onClick={analyze} disabled={run.isPending}>
                {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Optimize loan portfolio
              </Button>
            </div>
          </CardContent>
        </Card>

        {result ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Coordinated annual cost</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.coordinatedAnnualCost)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Naive even split</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.naiveAnnualCost)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Coordination savings</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-500">{fmt(result.coordinationSavings)}/yr</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Loan allocation (MPLC)</CardTitle>
                <CardDescription>Cheapest borrowing source first. Wash-provision policies cost nothing net.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[660px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">Policy</th>
                      <th className="pb-2 pr-3">Type</th>
                      <th className="pb-2 pr-3">Annual draw</th>
                      <th className="pb-2 pr-3">Net cost rate</th>
                      <th className="pb-2 pr-3">Annual cost</th>
                      <th className="pb-2 pr-3">Remaining capacity</th>
                      <th className="pb-2">Lapse risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.allocations.map(a => (
                      <tr key={a.policyId} className="border-b border-border/40">
                        <td className="py-2 pr-3 font-medium">{a.label}</td>
                        <td className="py-2 pr-3 capitalize">{a.loanType}</td>
                        <td className="py-2 pr-3">{fmt(a.annualDraw)}</td>
                        <td className="py-2 pr-3">{(a.netCostRate * 100).toFixed(2)}%</td>
                        <td className="py-2 pr-3">{fmt(a.annualCost)}</td>
                        <td className="py-2 pr-3">{fmt(a.remainingCapacity)}</td>
                        <td className="py-2">
                          <Badge variant="outline" className={RISK_STYLE[a.lapseRisk]}>{a.lapseRisk}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wash loan arbitrage (WLAD)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.washOpportunities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No policies in this portfolio carry a wash provision.</p>
                ) : (
                  result.washOpportunities.map(w => (
                    <div key={w.policyId} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{w.label}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={w.currentlyAvailable ? RISK_STYLE.safe : RISK_STYLE.caution}>
                            {w.currentlyAvailable ? "vested" : `vests in ${w.availableInYears}y`}
                          </Badge>
                          {w.annualArbitrageValue > 0 ? (
                            <span className="text-sm font-semibold text-emerald-400">{fmt(w.annualArbitrageValue)}/yr</span>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{w.detail}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {result.crossPolicyMoves.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    Cross-policy arbitrage
                  </CardTitle>
                  <CardDescription>Impossible at the single-policy level.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.crossPolicyMoves.map((m, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {m.fromLabel} → {m.toLabel}
                        </span>
                        <span className="text-sm font-semibold text-emerald-400">+{fmt(m.netAnnualGain)}/yr</span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{m.detail}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Rate hedging (VRHM)
                </CardTitle>
                <CardDescription>
                  {result.rateHedge.favorableYears.length} favorable window(s) clearing a 2% spread · best in year{" "}
                  {result.rateHedge.bestYear} at {(result.rateHedge.bestSpread * 100).toFixed(2)}% · timing advantage{" "}
                  {fmt(result.rateHedge.timedIncomeAdvantage)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {result.rateHedge.windows.map(w => (
                    <div
                      key={w.year}
                      title={`Year ${w.year}: spread ${(w.spread * 100).toFixed(2)}%`}
                      className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-medium ${
                        w.favorable ? "bg-emerald-500/25 text-emerald-200" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {w.year}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Tax advantage of drawing as loans rather than taxable withdrawals: {fmt(result.taxAdvantageValue)}
                </p>
              </CardContent>
            </Card>

            {result.criticalFindings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Critical findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {result.criticalFindings.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authority</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {result.irsReferences.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </CardContent>
            </Card>
          </>
        ) : null}

        <PageInsights pageId="iul-loan-optimizer" />
      </div>
    </AppShell>
  );
}
