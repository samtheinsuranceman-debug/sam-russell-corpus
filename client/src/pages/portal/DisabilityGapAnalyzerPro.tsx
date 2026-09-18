// ───────────────────────────────────────────────────────────────────────────
// SI-031 · Disability Insurance Gap Analyzer (DIGA)
// Occupation-specific disability probability, multi-policy coordination across
// group / individual / IUL living benefit riders, and after-tax gap analysis.
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
import { Loader2, ShieldAlert, Activity, Scale, AlertTriangle } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

type Definition = "own_occupation" | "modified_own_occupation" | "any_occupation";
type Health = "excellent" | "good" | "fair" | "poor";

const SEVERITY_STYLE: Record<string, string> = {
  critical: "border-rose-500/40 text-rose-300",
  significant: "border-amber-400/40 text-amber-300",
  minor: "border-sky-400/30 text-sky-300",
  none: "border-emerald-400/30 text-emerald-300",
};

export default function DisabilityGapAnalyzerPro() {
  const [annualIncome, setAnnualIncome] = useState(800_000);
  const [age, setAge] = useState(45);
  const [retirementAge, setRetirementAge] = useState(65);
  const [occupationKey, setOccupationKey] = useState("surgeon");
  const [healthStatus, setHealthStatus] = useState<Health>("good");
  const [marginalTaxRate, setMarginalTaxRate] = useState(42);
  const [monthlyExpenses, setMonthlyExpenses] = useState(28_000);

  const [hasGroup, setHasGroup] = useState(true);
  const [groupPercent, setGroupPercent] = useState(60);
  const [groupCap, setGroupCap] = useState(15_000);
  const [groupDefinition, setGroupDefinition] = useState<Definition>("any_occupation");
  const [groupBenefitMonths, setGroupBenefitMonths] = useState(24);
  const [employerPaid, setEmployerPaid] = useState(true);

  const [hasIndividual, setHasIndividual] = useState(false);
  const [indBenefit, setIndBenefit] = useState(10_000);
  const [indDefinition, setIndDefinition] = useState<Definition>("own_occupation");
  const [indAfterTax, setIndAfterTax] = useState(true);
  const [indPremium, setIndPremium] = useState(7_200);

  const [hasRider, setHasRider] = useState(false);
  const [riderMonthly, setRiderMonthly] = useState(6_000);

  const occupations = trpc.si.digaOccupations.useQuery();
  const run = trpc.si.disabilityGapAdvanced.useMutation({
    onSuccess: () => toast.success("Gap analysis complete"),
    onError: e => toast.error(e.message),
  });

  const analyze = () =>
    run.mutate({
      annualIncome,
      age,
      occupationKey,
      healthStatus,
      marginalTaxRate: marginalTaxRate / 100,
      monthlyExpenses,
      retirementAge,
      groupPolicy: hasGroup
        ? {
            replacementPercent: groupPercent / 100,
            monthlyCap: groupCap,
            definition: groupDefinition,
            eliminationPeriodDays: 90,
            benefitPeriodMonths: groupBenefitMonths,
            employerPaid,
          }
        : undefined,
      individualPolicy: hasIndividual
        ? {
            monthlyBenefit: indBenefit,
            definition: indDefinition,
            eliminationPeriodDays: 90,
            benefitPeriodMonths: (retirementAge - age) * 12,
            afterTaxPremium: indAfterTax,
            annualPremium: indPremium,
          }
        : undefined,
      iulRider: hasRider
        ? {
            maxAcceleratedBenefit: riderMonthly * 60,
            monthlyBenefit: riderMonthly,
            benefitPeriodMonths: 60,
            eliminationPeriodDays: 90,
          }
        : undefined,
    });

  const result = run.data;

  return (
    <AppShell
      title="Disability Gap Analyzer"
      subtitle="SI-031 · Occupation-specific probability, multi-policy coordination, and after-tax gap analysis"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-500" />
              Client profile
            </CardTitle>
            <CardDescription>
              Calibrated for professionals earning $300,000+, where a capped group benefit leaves catastrophic exposure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label className="text-xs text-muted-foreground">Annual income</Label>
                <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Occupation</Label>
                <select
                  value={occupationKey}
                  onChange={e => setOccupationKey(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {(occupations.data ?? [{ key: "surgeon", label: "Surgeon", occupationClass: 6 }]).map(o => (
                    <option key={o.key} value={o.key}>
                      {o.label} (class {o.occupationClass})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Health status</Label>
                <select
                  value={healthStatus}
                  onChange={e => setHealthStatus(e.target.value as Health)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Age</Label>
                <Input type="number" value={age} onChange={e => setAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Retirement age</Label>
                <Input type="number" value={retirementAge} onChange={e => setRetirementAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Marginal tax rate %</Label>
                <Input type="number" value={marginalTaxRate} onChange={e => setMarginalTaxRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Monthly expenses</Label>
                <Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(+e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {/* Group */}
              <div className="rounded-lg border p-4">
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={hasGroup} onChange={e => setHasGroup(e.target.checked)} />
                  Employer group LTD
                </label>
                {hasGroup ? (
                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Replacement %</Label>
                      <Input type="number" value={groupPercent} onChange={e => setGroupPercent(+e.target.value)} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Monthly cap</Label>
                      <Input type="number" value={groupCap} onChange={e => setGroupCap(+e.target.value)} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Definition</Label>
                      <select value={groupDefinition} onChange={e => setGroupDefinition(e.target.value as Definition)} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm">
                        <option value="own_occupation">Own occupation</option>
                        <option value="modified_own_occupation">Modified own occ.</option>
                        <option value="any_occupation">Any occupation</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Benefit months</Label>
                      <Input type="number" value={groupBenefitMonths} onChange={e => setGroupBenefitMonths(+e.target.value)} className="h-8" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={employerPaid} onChange={e => setEmployerPaid(e.target.checked)} />
                      Employer pays premium (taxable)
                    </label>
                  </div>
                ) : null}
              </div>

              {/* Individual */}
              <div className="rounded-lg border p-4">
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={hasIndividual} onChange={e => setHasIndividual(e.target.checked)} />
                  Individual DI
                </label>
                {hasIndividual ? (
                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Monthly benefit</Label>
                      <Input type="number" value={indBenefit} onChange={e => setIndBenefit(+e.target.value)} className="h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Definition</Label>
                      <select value={indDefinition} onChange={e => setIndDefinition(e.target.value as Definition)} className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm">
                        <option value="own_occupation">Own occupation</option>
                        <option value="modified_own_occupation">Modified own occ.</option>
                        <option value="any_occupation">Any occupation</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Annual premium</Label>
                      <Input type="number" value={indPremium} onChange={e => setIndPremium(+e.target.value)} className="h-8" />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={indAfterTax} onChange={e => setIndAfterTax(e.target.checked)} />
                      After-tax premium (tax-free benefit)
                    </label>
                  </div>
                ) : null}
              </div>

              {/* IUL rider */}
              <div className="rounded-lg border p-4">
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={hasRider} onChange={e => setHasRider(e.target.checked)} />
                  IUL living benefit rider
                </label>
                {hasRider ? (
                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Monthly benefit</Label>
                      <Input type="number" value={riderMonthly} onChange={e => setRiderMonthly(+e.target.value)} className="h-8" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Accelerated death benefit, tax-free under IRC § 101(g). Does not count against DI issue limits.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <Button onClick={analyze} disabled={run.isPending} className="w-full md:w-auto">
              {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Analyze coverage gaps
            </Button>
          </CardContent>
        </Card>

        {result ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Occupation-specific probability (OSDPM)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Occupation</p>
                  <p className="mt-1 text-lg font-semibold">{result.probability.occupationLabel}</p>
                  <p className="text-xs text-muted-foreground">Class {result.probability.occupationClass}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Annual probability</p>
                  <p className="mt-1 text-lg font-semibold">{(result.probability.annualProbability * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Cumulative to retirement</p>
                  <p className="mt-1 text-lg font-semibold">{(result.probability.cumulativeToRetirement * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected duration</p>
                  <p className="mt-1 text-lg font-semibold">{Math.round(result.probability.expectedDurationMonths)} mo</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Tax-aware gap
                </CardTitle>
                <CardDescription>
                  A pre-tax comparison and an after-tax comparison sit on different bases. What matters is how much
                  stated benefit survives taxation.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">After-tax income</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.taxAware.monthlyAfterTaxIncome)}/mo</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Gross benefit</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.taxAware.grossMonthlyBenefit)}/mo</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Net benefit</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.taxAware.netMonthlyBenefit)}/mo</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Lost to tax</p>
                  <p className="mt-1 text-lg font-semibold text-rose-400">{fmt(result.taxAware.taxBlindSpot)}/mo</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Advertised replacement</p>
                  <p className="mt-1 text-lg font-semibold">{Math.round(result.taxAware.apparentReplacementRatio * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Actual replacement</p>
                  <p className="mt-1 text-lg font-semibold">{Math.round(result.taxAware.actualReplacementRatio * 100)}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>The three gaps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.gaps.map(g => (
                  <div key={g.type} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{g.label}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={SEVERITY_STYLE[g.severity]}>{g.severity}</Badge>
                        {g.monthlyGap > 0 ? <span className="text-sm font-semibold">{fmt(g.monthlyGap)}/mo</span> : null}
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{g.detail}</p>
                    {g.totalExposure > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">Total exposure: {fmt(g.totalExposure)}</p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multi-policy coordination (MPC)</CardTitle>
                <CardDescription>Each source ranked by net benefit delivered per premium dollar.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">Source</th>
                      <th className="pb-2 pr-3">Gross</th>
                      <th className="pb-2 pr-3">Net</th>
                      <th className="pb-2 pr-3">Annual cost</th>
                      <th className="pb-2">Tax treatment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.allocations.map(a => (
                      <tr key={a.source} className="border-b border-border/40">
                        <td className="py-2 pr-3 font-medium capitalize">{a.source.replace("_", " ")}</td>
                        <td className="py-2 pr-3">{fmt(a.grossMonthlyBenefit)}</td>
                        <td className="py-2 pr-3 font-semibold">{fmt(a.netMonthlyBenefit)}</td>
                        <td className="py-2 pr-3">{a.annualCost > 0 ? fmt(a.annualCost) : "—"}</td>
                        <td className="py-2 text-xs text-muted-foreground">{a.taxTreatment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Recommended additional</p>
                    <p className="mt-1 text-lg font-semibold">{fmt(result.recommendedAdditionalBenefit)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Est. added premium</p>
                    <p className="mt-1 text-lg font-semibold">{fmt(result.estimatedAdditionalPremium)}/yr</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Probability-weighted exposure</p>
                    <p className="mt-1 text-lg font-semibold">{fmt(result.probabilityWeightedExposure)}</p>
                  </div>
                </div>
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

        <PageInsights pageId="disability-gap-analyzer" />
      </div>
    </AppShell>
  );
}
