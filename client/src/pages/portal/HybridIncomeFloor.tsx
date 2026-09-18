// ───────────────────────────────────────────────────────────────────────────
// SI-030 · Indexed Annuity + IUL Hybrid Income Floor (IAIUL)
// Guaranteed income layering, upside capture above the floor, and three-phase
// tax-diversified distribution sequencing.
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
import { Loader2, Shield, Layers, AlertTriangle, TrendingUp } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const PHASE_STYLE: Record<string, string> = {
  early: "border-sky-400/40 text-sky-300",
  mid: "border-emerald-400/40 text-emerald-300",
  late: "border-amber-400/40 text-amber-300",
};

export default function HybridIncomeFloor() {
  const [currentAge, setCurrentAge] = useState(58);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancyAge, setLifeExpectancyAge] = useState(90);
  const [totalAssets, setTotalAssets] = useState(2_400_000);
  const [essentialExpenses, setEssentialExpenses] = useState(90_000);
  const [discretionaryExpenses, setDiscretionaryExpenses] = useState(50_000);
  const [legacyTarget, setLegacyTarget] = useState(500_000);
  const [annuityPayoutRate, setAnnuityPayoutRate] = useState(5.5);
  const [annuityRollupRate, setAnnuityRollupRate] = useState(7);
  const [annuityRiderFee, setAnnuityRiderFee] = useState(1.1);
  const [annuityExclusionRatio, setAnnuityExclusionRatio] = useState(35);
  const [iulCreditingRate, setIulCreditingRate] = useState(6.5);
  const [iulCap, setIulCap] = useState(10);
  const [iulFloor, setIulFloor] = useState(0);
  const [iulPolicyCharges, setIulPolicyCharges] = useState(1.2);
  const [qualifiedBalance, setQualifiedBalance] = useState(800_000);
  const [marginalTaxRate, setMarginalTaxRate] = useState(28);
  const [inflationRate, setInflationRate] = useState(2.5);

  const run = trpc.si.hybridIncomeFloor.useMutation({
    onSuccess: () => toast.success("Hybrid income strategy built"),
    onError: e => toast.error(e.message),
  });

  const analyze = () =>
    run.mutate({
      currentAge,
      retirementAge,
      lifeExpectancyAge,
      totalAssets,
      essentialExpenses,
      discretionaryExpenses,
      legacyTarget,
      annuityPayoutRate: annuityPayoutRate / 100,
      annuityRollupRate: annuityRollupRate / 100,
      annuityRiderFee: annuityRiderFee / 100,
      annuityExclusionRatio: annuityExclusionRatio / 100,
      iulCreditingRate: iulCreditingRate / 100,
      iulCap: iulCap / 100,
      iulFloor: iulFloor / 100,
      iulPolicyCharges: iulPolicyCharges / 100,
      qualifiedBalance,
      marginalTaxRate: marginalTaxRate / 100,
      inflationRate: inflationRate / 100,
    });

  const result = run.data;

  return (
    <AppShell
      title="Hybrid Income Floor"
      subtitle="SI-030 · Guaranteed annuity floor, tax-free IUL upside, and phased distribution sequencing"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Retirement profile
            </CardTitle>
            <CardDescription>
              Calibrated for pre-retirees aged 55-65 with $1M+ in assets. The annuity is sized backward from essential
              expenses rather than set as a fixed share.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Current age</Label>
                <Input type="number" value={currentAge} onChange={e => setCurrentAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Retirement age</Label>
                <Input type="number" value={retirementAge} onChange={e => setRetirementAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Life expectancy</Label>
                <Input type="number" value={lifeExpectancyAge} onChange={e => setLifeExpectancyAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total assets</Label>
                <Input type="number" value={totalAssets} onChange={e => setTotalAssets(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Essential expenses /yr</Label>
                <Input type="number" value={essentialExpenses} onChange={e => setEssentialExpenses(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Discretionary /yr</Label>
                <Input type="number" value={discretionaryExpenses} onChange={e => setDiscretionaryExpenses(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Legacy target</Label>
                <Input type="number" value={legacyTarget} onChange={e => setLegacyTarget(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Qualified balance (RMDs)</Label>
                <Input type="number" value={qualifiedBalance} onChange={e => setQualifiedBalance(+e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Indexed annuity</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Payout rate %</Label>
                    <Input type="number" step="0.1" value={annuityPayoutRate} onChange={e => setAnnuityPayoutRate(+e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Roll-up rate %</Label>
                    <Input type="number" step="0.1" value={annuityRollupRate} onChange={e => setAnnuityRollupRate(+e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Rider fee %</Label>
                    <Input type="number" step="0.1" value={annuityRiderFee} onChange={e => setAnnuityRiderFee(+e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Exclusion ratio %</Label>
                    <Input type="number" value={annuityExclusionRatio} onChange={e => setAnnuityExclusionRatio(+e.target.value)} className="h-8" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Indexed universal life</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Crediting rate %</Label>
                    <Input type="number" step="0.1" value={iulCreditingRate} onChange={e => setIulCreditingRate(+e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cap %</Label>
                    <Input type="number" step="0.1" value={iulCap} onChange={e => setIulCap(+e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Floor %</Label>
                    <Input type="number" step="0.1" value={iulFloor} onChange={e => setIulFloor(+e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Policy charges %</Label>
                    <Input type="number" step="0.1" value={iulPolicyCharges} onChange={e => setIulPolicyCharges(+e.target.value)} className="h-8" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Marginal tax %</Label>
                <Input type="number" value={marginalTaxRate} onChange={e => setMarginalTaxRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Inflation %</Label>
                <Input type="number" step="0.1" value={inflationRate} onChange={e => setInflationRate(+e.target.value)} />
              </div>
            </div>

            <Button onClick={analyze} disabled={run.isPending} className="w-full md:w-auto">
              {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Build hybrid strategy
            </Button>
          </CardContent>
        </Card>

        {result ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Guaranteed floor</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.layering.guaranteedAnnualIncome)}/yr</p>
                  <Badge
                    variant="outline"
                    className={`mt-2 ${result.layering.floorCoversEssentials ? "border-emerald-400/40 text-emerald-300" : "border-rose-500/40 text-rose-300"}`}
                  >
                    {result.layering.floorCoversEssentials ? "covers essentials" : "short of essentials"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Lifetime tax</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.sequencing.totalLifetimeTax)}</p>
                  <p className="mt-0.5 text-xs text-emerald-400">
                    {fmt(result.sequencing.taxSavings)} saved ({Math.round(result.sequencing.taxSavingsPercent)}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">After-tax income</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.hybridAdvantage.hybridAfterTaxIncome)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">vs. best single product</p>
                  <p className={`mt-1 flex items-center gap-1.5 text-2xl font-semibold ${result.hybridAdvantage.advantage >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
                    <TrendingUp className="h-5 w-5" />
                    {Math.round(result.hybridAdvantage.advantagePercent)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Income layering (GILM)
                </CardTitle>
                <CardDescription>
                  {result.layering.deferralYears} years of deferral roll the benefit base to{" "}
                  {fmt(result.layering.benefitBaseAtIncome)}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.layering.layers.map(l => (
                  <div key={l.layer} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium capitalize">{l.layer.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{l.source.replace(/_/g, " ")}</span>
                        <span className="font-semibold">{fmt(l.allocation)}</span>
                        <span className="text-muted-foreground">{l.allocationPercent}%</span>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${l.allocationPercent}%`,
                          background: l.source === "indexed_annuity" ? "#34d399" : "#34d399",
                        }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{l.rationale}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upside capture (UCO)</CardTitle>
                <CardDescription>
                  Average credited rate {(result.upside.averageCreditedRate * 100).toFixed(2)}% · the floor prevented a
                  negative credit in {result.upside.floorProtectedYears} year(s), the cap truncated{" "}
                  {result.upside.capTruncatedYears}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Total upside captured</p>
                    <p className="mt-1 text-lg font-semibold">{fmt(result.upside.totalUpsideCaptured)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Final cash value</p>
                    <p className="mt-1 text-lg font-semibold">{fmt(result.upside.finalCashValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Years modeled</p>
                    <p className="mt-1 text-lg font-semibold">{result.upside.years.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution sequencing (TDDS)</CardTitle>
                <CardDescription>
                  Early retirement is annuity-heavy; late retirement leans on tax-free loans to offset RMDs beginning
                  at 75.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">Age</th>
                      <th className="pb-2 pr-3">Phase</th>
                      <th className="pb-2 pr-3">Annuity</th>
                      <th className="pb-2 pr-3">IUL (tax-free)</th>
                      <th className="pb-2 pr-3">RMD</th>
                      <th className="pb-2 pr-3">Taxable</th>
                      <th className="pb-2 pr-3">Tax</th>
                      <th className="pb-2">After-tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sequencing.years
                      .filter((_, i) => i % 3 === 0)
                      .map(y => (
                        <tr key={y.year} className="border-b border-border/40">
                          <td className="py-2 pr-3">{y.age}</td>
                          <td className="py-2 pr-3">
                            <Badge variant="outline" className={PHASE_STYLE[y.phase]}>{y.phase}</Badge>
                          </td>
                          <td className="py-2 pr-3">{fmt(y.annuityIncome)}</td>
                          <td className="py-2 pr-3 text-emerald-400">{fmt(y.iulDistribution)}</td>
                          <td className="py-2 pr-3">{y.rmd > 0 ? fmt(y.rmd) : "—"}</td>
                          <td className="py-2 pr-3">{fmt(y.taxableIncome)}</td>
                          <td className="py-2 pr-3 text-rose-400">{fmt(y.taxOwed)}</td>
                          <td className="py-2 font-semibold">{fmt(y.afterTaxIncome)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-muted-foreground">
                  Showing every third year. Phase boundaries: early ends at age {result.sequencing.phaseBoundaries.earlyEnds},
                  mid ends at {result.sequencing.phaseBoundaries.midEnds}.
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

        <PageInsights pageId="hybrid-income-floor" />
      </div>
    </AppShell>
  );
}
