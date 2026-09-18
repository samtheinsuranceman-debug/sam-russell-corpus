// ───────────────────────────────────────────────────────────────────────────
// SI-034 · 1031 Exchange Chain Optimization Engine (1031COE)
// Plans multi-property exchange sequences, monitors the 45/180-day statutory
// windows, and quantifies what IRC § 1014 eliminates permanently at death.
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
import { Loader2, Plus, Trash2, Landmark, CalendarClock, ShieldCheck, TrendingUp } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

type PropertyType = "residential" | "commercial";

interface PropertyRow {
  id: string;
  label: string;
  type: PropertyType;
  marketValue: number;
  purchasePrice: number;
  landAllocationPercent: number;
  yearsHeld: number;
  appreciationRate: number;
  mortgageBalance: number;
}

const seedProperties = (): PropertyRow[] =>
  Array.from({ length: 5 }, (_, i) => ({
    id: `p${i + 1}`,
    label: `Property ${i + 1}`,
    type: i % 2 === 0 ? "commercial" : "residential",
    marketValue: 2_400_000 + i * 350_000,
    purchasePrice: 1_100_000 + i * 180_000,
    landAllocationPercent: 0.2,
    yearsHeld: 8 + i,
    appreciationRate: 0.04 + i * 0.002,
    mortgageBalance: i === 0 ? 0 : 400_000,
  }));

const STATUS_STYLE: Record<string, string> = {
  clear: "border-emerald-400/30 text-emerald-300",
  approaching: "border-amber-400/30 text-amber-300",
  critical: "border-orange-400/40 text-orange-300",
  blown: "border-rose-500/40 text-rose-300",
};

export default function ExchangeChainOptimizer() {
  const [properties, setProperties] = useState<PropertyRow[]>(seedProperties);
  const [capitalGainsRate, setCapitalGainsRate] = useState(20);
  const [stateRate, setStateRate] = useState(5);
  const [subjectToNIIT, setSubjectToNIIT] = useState(true);
  const [horizonYears, setHorizonYears] = useState(24);
  const [currentAge, setCurrentAge] = useState(60);
  const [lifeExpectancyAge, setLifeExpectancyAge] = useState(84);

  const run = trpc.si.exchangeChain.useMutation({
    onSuccess: () => toast.success("Exchange chain optimized"),
    onError: e => toast.error(e.message),
  });

  const update = (id: string, patch: Partial<PropertyRow>) =>
    setProperties(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const addProperty = () =>
    setProperties(ps => [
      ...ps,
      {
        id: `p${Date.now()}`,
        label: `Property ${ps.length + 1}`,
        type: "commercial",
        marketValue: 2_000_000,
        purchasePrice: 1_000_000,
        landAllocationPercent: 0.2,
        yearsHeld: 5,
        appreciationRate: 0.04,
        mortgageBalance: 0,
      },
    ]);

  const analyze = () =>
    run.mutate({
      properties: properties.map(p => ({
        id: p.id,
        label: p.label,
        type: p.type,
        marketValue: p.marketValue,
        purchasePrice: p.purchasePrice,
        landAllocationPercent: p.landAllocationPercent,
        yearsHeld: p.yearsHeld,
        appreciationRate: p.appreciationRate,
        mortgageBalance: p.mortgageBalance,
      })),
      capitalGainsRate: capitalGainsRate / 100,
      stateRate: stateRate / 100,
      subjectToNIIT,
      horizonYears,
      currentAge,
      lifeExpectancyAge,
    });

  const result = run.data;

  return (
    <AppShell
      title="1031 Exchange Chain Optimizer"
      subtitle="SI-034 · Multi-property sequence planning, deadline compliance, and basis step-up coordination"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-500" />
              Portfolio
            </CardTitle>
            <CardDescription>
              Calibrated for 5+ properties with combined equity above $5M, where chained exchanges compound deferral
              that individual exchanges cannot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3">Label</th>
                    <th className="pb-2 pr-3">Type</th>
                    <th className="pb-2 pr-3">Market value</th>
                    <th className="pb-2 pr-3">Purchase price</th>
                    <th className="pb-2 pr-3">Years held</th>
                    <th className="pb-2 pr-3">Apprec. %</th>
                    <th className="pb-2 pr-3">Mortgage</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {properties.map(p => (
                    <tr key={p.id} className="border-b border-border/40">
                      <td className="py-2 pr-3">
                        <Input value={p.label} onChange={e => update(p.id, { label: e.target.value })} className="h-8 w-32" />
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={p.type}
                          onChange={e => update(p.id, { type: e.target.value as PropertyType })}
                          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="commercial">Commercial</option>
                          <option value="residential">Residential</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <Input type="number" value={p.marketValue} onChange={e => update(p.id, { marketValue: +e.target.value })} className="h-8 w-32" />
                      </td>
                      <td className="py-2 pr-3">
                        <Input type="number" value={p.purchasePrice} onChange={e => update(p.id, { purchasePrice: +e.target.value })} className="h-8 w-32" />
                      </td>
                      <td className="py-2 pr-3">
                        <Input type="number" value={p.yearsHeld} onChange={e => update(p.id, { yearsHeld: +e.target.value })} className="h-8 w-20" />
                      </td>
                      <td className="py-2 pr-3">
                        <Input
                          type="number" step="0.1"
                          value={(p.appreciationRate * 100).toFixed(1)}
                          onChange={e => update(p.id, { appreciationRate: +e.target.value / 100 })}
                          className="h-8 w-20"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <Input type="number" value={p.mortgageBalance} onChange={e => update(p.id, { mortgageBalance: +e.target.value })} className="h-8 w-28" />
                      </td>
                      <td className="py-2">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setProperties(ps => ps.filter(x => x.id !== p.id))}
                          disabled={properties.length <= 1}
                          aria-label={`Remove ${p.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="outline" size="sm" onClick={addProperty}>
              <Plus className="mr-1 h-4 w-4" /> Add property
            </Button>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div>
                <Label className="text-xs text-muted-foreground">Cap gains %</Label>
                <Input type="number" value={capitalGainsRate} onChange={e => setCapitalGainsRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">State %</Label>
                <Input type="number" value={stateRate} onChange={e => setStateRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Horizon (yrs)</Label>
                <Input type="number" value={horizonYears} onChange={e => setHorizonYears(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Current age</Label>
                <Input type="number" value={currentAge} onChange={e => setCurrentAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Life expectancy</Label>
                <Input type="number" value={lifeExpectancyAge} onChange={e => setLifeExpectancyAge(+e.target.value)} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={subjectToNIIT} onChange={e => setSubjectToNIIT(e.target.checked)} />
                  NIIT (3.8%)
                </label>
              </div>
            </div>

            <Button onClick={analyze} disabled={run.isPending} className="w-full md:w-auto">
              {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Optimize exchange chain
            </Button>
          </CardContent>
        </Card>

        {result ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Tax deferred by chain</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.totalTaxDeferred)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">If sold outright today</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.taxIfAllSoldToday)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Chain compounding</p>
                  <p className="mt-1 flex items-center gap-1.5 text-2xl font-semibold">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    {result.compoundingMultiple}x
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">vs. independent exchanges</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Eliminated at § 1014</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-500">
                    {fmt(result.stepUp.taxPermanentlyEliminated)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {result.stepUp.reachesStepUp ? "Permanently erased" : "Not reached in horizon"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Exchange sequence (MPSP)</CardTitle>
                <CardDescription>
                  Ordered by deferral efficiency. Deferred gain rides forward in the substituted basis under IRC § 1031(d).
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">#</th>
                      <th className="pb-2 pr-3">Year</th>
                      <th className="pb-2 pr-3">Relinquished</th>
                      <th className="pb-2 pr-3">Value</th>
                      <th className="pb-2 pr-3">Gain deferred</th>
                      <th className="pb-2 pr-3">Cumulative</th>
                      <th className="pb-2 pr-3">Substituted basis</th>
                      <th className="pb-2">Identify by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.chain.map(step => (
                      <tr key={step.sequence} className="border-b border-border/40">
                        <td className="py-2 pr-3">{step.sequence}</td>
                        <td className="py-2 pr-3">{step.year}</td>
                        <td className="py-2 pr-3">{step.relinquishedLabel}</td>
                        <td className="py-2 pr-3">{fmt(step.relinquishedValue)}</td>
                        <td className="py-2 pr-3">{fmt(step.gainDeferred)}</td>
                        <td className="py-2 pr-3 font-medium">{fmt(step.cumulativeGainDeferred)}</td>
                        <td className="py-2 pr-3">{fmt(step.substitutedBasis)}</td>
                        <td className="py-2 text-muted-foreground">{step.identifyBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {result.deadlines.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" />
                    Deadline compliance (DCM)
                  </CardTitle>
                  <CardDescription>IRC § 1031(a)(3) windows for the first exchange. No extensions exist.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.deadlines.map((d, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium capitalize">{d.window} window — {d.deadline}</span>
                        <Badge variant="outline" className={STATUS_STYLE[d.status]}>
                          {d.status} · {d.daysRemaining}d
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{d.contingency}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Basis step-up coordination (BSUC)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Final property value</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.stepUp.finalPropertyValue)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Basis before step-up</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.stepUp.basisBeforeStepUp)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Gain eliminated</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.stepUp.gainEliminated)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Step-up age</p>
                  <p className="mt-1 text-lg font-semibold">{result.stepUp.stepUpAge}</p>
                </div>
              </CardContent>
            </Card>

            {result.criticalFindings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Critical findings</CardTitle>
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
                  {result.irsReferences.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        ) : null}

        <PageInsights pageId="exchange-chain" />
      </div>
    </AppShell>
  );
}
