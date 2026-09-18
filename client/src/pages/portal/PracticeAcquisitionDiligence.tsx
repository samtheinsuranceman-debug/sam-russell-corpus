// ───────────────────────────────────────────────────────────────────────────
// SI-033 · Practice Acquisition Due Diligence Automation Engine (PADDA)
// 15-dimension client book scoring, revenue sustainability under new ownership,
// and integration risk that corrects the standard revenue multiple.
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
import { Loader2, Briefcase, AlertTriangle, TrendingDown } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

type ServiceModel = "high_touch" | "hybrid" | "digital_first";
type CompStructure = "salary" | "commission" | "hybrid";

const GRADE_STYLE: Record<string, string> = {
  A: "border-emerald-400/40 text-emerald-300",
  B: "border-sky-400/40 text-sky-300",
  C: "border-amber-400/40 text-amber-300",
  D: "border-orange-400/40 text-orange-300",
  F: "border-rose-500/40 text-rose-300",
};

const RECOMMENDATION_STYLE: Record<string, string> = {
  proceed: "border-emerald-400/40 text-emerald-300",
  proceed_with_conditions: "border-sky-400/40 text-sky-300",
  renegotiate: "border-amber-400/40 text-amber-300",
  walk_away: "border-rose-500/40 text-rose-300",
};

/**
 * Generates a synthetic client book from summary parameters. Real engagements
 * import the target's book; this lets an advisor model a deal before data arrives.
 */
function buildBook(count: number, avgRevenue: number, avgAge: number, avgTenure: number, persistency: number, concentrationPct: number) {
  const clients = [];
  const concentratedRevenue = avgRevenue * count * (concentrationPct / 100);
  const whaleCount = Math.min(3, Math.max(0, Math.floor(count * 0.02)));
  const remainingRevenue = avgRevenue * count - concentratedRevenue;
  const ordinaryCount = Math.max(1, count - whaleCount);

  for (let i = 0; i < whaleCount; i += 1) {
    clients.push({
      id: `whale${i}`,
      age: avgAge - 4,
      annualRevenue: Math.round(concentratedRevenue / Math.max(1, whaleCount)),
      tenureYears: avgTenure + 5,
      products: ["IUL", "Annuity", "LTC"],
      persistency: Math.min(0.99, persistency + 0.04),
      referralsLast12Months: 2,
      satisfactionScore: 88,
    });
  }
  for (let i = 0; i < ordinaryCount; i += 1) {
    clients.push({
      id: `c${i}`,
      age: Math.round(avgAge + (i % 20) - 10),
      annualRevenue: Math.round(remainingRevenue / ordinaryCount),
      tenureYears: Math.max(0.5, avgTenure + (i % 9) - 4),
      products: i % 3 === 0 ? ["Term"] : ["IUL", "Annuity"],
      persistency,
      referralsLast12Months: i % 5 === 0 ? 1 : 0,
      satisfactionScore: Math.min(100, 62 + (i % 30)),
    });
  }
  return clients;
}

export default function PracticeAcquisitionDiligence() {
  const [practiceName, setPracticeName] = useState("Coastal Advisory Group");
  const [clientCount, setClientCount] = useState(180);
  const [avgRevenuePerClient, setAvgRevenuePerClient] = useState(4_200);
  const [avgClientAge, setAvgClientAge] = useState(58);
  const [avgTenure, setAvgTenure] = useState(7);
  const [persistency, setPersistency] = useState(88);
  const [top3Concentration, setTop3Concentration] = useState(18);
  const [trailRevenuePercent, setTrailRevenuePercent] = useState(68);
  const [principalAge, setPrincipalAge] = useState(63);
  const [principalRetained, setPrincipalRetained] = useState(true);
  const [principalTransitionMonths, setPrincipalTransitionMonths] = useState(18);
  const [russellNumber, setRussellNumber] = useState(74);
  const [askingPrice, setAskingPrice] = useState(1_900_000);

  const [technologyPlatform, setTechnologyPlatform] = useState("Redtail");
  const [targetTechnologyPlatform, setTargetTechnologyPlatform] = useState("Salesforce");
  const [serviceModel, setServiceModel] = useState<ServiceModel>("hybrid");
  const [targetServiceModel, setTargetServiceModel] = useState<ServiceModel>("high_touch");
  const [compensationStructure, setCompensationStructure] = useState<CompStructure>("hybrid");
  const [targetCompensationStructure, setTargetCompensationStructure] = useState<CompStructure>("commission");
  const [geographicOverlap, setGeographicOverlap] = useState(55);
  const [integrationExperience, setIntegrationExperience] = useState(60);

  const run = trpc.si.practiceAcquisition.useMutation({
    onSuccess: () => toast.success("Due diligence complete"),
    onError: e => toast.error(e.message),
  });

  const analyze = () => {
    const clients = buildBook(clientCount, avgRevenuePerClient, avgClientAge, avgTenure, persistency / 100, top3Concentration);
    run.mutate({
      practice: {
        name: practiceName,
        clients,
        annualRevenue: clients.reduce((s, c) => s + c.annualRevenue, 0),
        trailRevenuePercent: trailRevenuePercent / 100,
        yearsInOperation: 18,
        principalAge,
        principalRetained,
        principalTransitionMonths: principalRetained ? principalTransitionMonths : 0,
        russellNumber,
        askingPrice,
      },
      acquirer: {
        technologyPlatform,
        targetTechnologyPlatform,
        serviceModel,
        targetServiceModel,
        compensationStructure,
        targetCompensationStructure,
        geographicOverlap: geographicOverlap / 100,
        integrationExperience: integrationExperience / 100,
      },
      discountRate: 0.12,
    });
  };

  const result = run.data;

  return (
    <AppShell
      title="Practice Acquisition Diligence"
      subtitle="SI-033 · Client book quality, revenue sustainability, and integration-adjusted valuation"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              Target practice
            </CardTitle>
            <CardDescription>
              Calibrated for acquisitions above $500,000 in annual revenue, where diligence complexity justifies
              automated analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="col-span-2 md:col-span-1">
                <Label className="text-xs text-muted-foreground">Practice name</Label>
                <Input value={practiceName} onChange={e => setPracticeName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Client count</Label>
                <Input type="number" value={clientCount} onChange={e => setClientCount(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Avg revenue / client</Label>
                <Input type="number" value={avgRevenuePerClient} onChange={e => setAvgRevenuePerClient(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Avg client age</Label>
                <Input type="number" value={avgClientAge} onChange={e => setAvgClientAge(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Avg tenure (yrs)</Label>
                <Input type="number" value={avgTenure} onChange={e => setAvgTenure(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Persistency %</Label>
                <Input type="number" value={persistency} onChange={e => setPersistency(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Top-3 concentration %</Label>
                <Input type="number" value={top3Concentration} onChange={e => setTop3Concentration(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Trail revenue %</Label>
                <Input type="number" value={trailRevenuePercent} onChange={e => setTrailRevenuePercent(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Russell Number</Label>
                <Input type="number" value={russellNumber} onChange={e => setRussellNumber(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Asking price</Label>
                <Input type="number" value={askingPrice} onChange={e => setAskingPrice(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Principal age</Label>
                <Input type="number" value={principalAge} onChange={e => setPrincipalAge(+e.target.value)} />
              </div>
              <div className="flex flex-col justify-end gap-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={principalRetained} onChange={e => setPrincipalRetained(e.target.checked)} />
                  Principal retained
                </label>
                {principalRetained ? (
                  <Input
                    type="number" value={principalTransitionMonths}
                    onChange={e => setPrincipalTransitionMonths(+e.target.value)}
                    className="h-8" placeholder="Months"
                  />
                ) : null}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Acquirer fit</Label>
              <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Our platform</Label>
                  <Input value={technologyPlatform} onChange={e => setTechnologyPlatform(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Their platform</Label>
                  <Input value={targetTechnologyPlatform} onChange={e => setTargetTechnologyPlatform(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Our service model</Label>
                  <select value={serviceModel} onChange={e => setServiceModel(e.target.value as ServiceModel)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="high_touch">High touch</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="digital_first">Digital first</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Their service model</Label>
                  <select value={targetServiceModel} onChange={e => setTargetServiceModel(e.target.value as ServiceModel)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="high_touch">High touch</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="digital_first">Digital first</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Our comp</Label>
                  <select value={compensationStructure} onChange={e => setCompensationStructure(e.target.value as CompStructure)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="salary">Salary</option>
                    <option value="commission">Commission</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Their comp</Label>
                  <select value={targetCompensationStructure} onChange={e => setTargetCompensationStructure(e.target.value as CompStructure)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="salary">Salary</option>
                    <option value="commission">Commission</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Geo overlap: {geographicOverlap}%</Label>
                  <Input type="range" min={0} max={100} value={geographicOverlap} onChange={e => setGeographicOverlap(+e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Integration experience: {integrationExperience}%</Label>
                  <Input type="range" min={0} max={100} value={integrationExperience} onChange={e => setIntegrationExperience(+e.target.value)} />
                </div>
              </div>
            </div>

            <Button onClick={analyze} disabled={run.isPending} className="w-full md:w-auto">
              {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run due diligence
            </Button>
          </CardContent>
        </Card>

        {result ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Standard valuation</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.standardValuation)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Adjusted valuation</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-500">{fmt(result.adjustedValuation)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Correction</p>
                  <p className="mt-1 flex items-center gap-1.5 text-2xl font-semibold text-amber-300">
                    <TrendingDown className="h-5 w-5" />
                    {Math.round(result.valuationCorrectionPercent)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Bid gap</p>
                  <p className={`mt-1 text-2xl font-semibold ${result.bidGap >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
                    {result.bidGap >= 0 ? "+" : ""}
                    {fmt(result.bidGap)}
                  </p>
                  <Badge variant="outline" className={`mt-2 ${RECOMMENDATION_STYLE[result.recommendation]}`}>
                    {result.recommendation.replace(/_/g, " ")}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Client book quality (CBQS)</CardTitle>
                    <CardDescription>Fifteen weighted dimensions — risks that never reach a P&amp;L.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={GRADE_STYLE[result.bookQuality.grade]}>
                      Grade {result.bookQuality.grade}
                    </Badge>
                    <span className="text-2xl font-semibold">{Math.round(result.bookQuality.compositeScore)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.bookQuality.dimensions.map(d => (
                  <div key={d.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{d.label}</span>
                      <span className="text-muted-foreground">
                        {d.value} · {Math.round(d.score)}/100
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${d.score}%`,
                          background: d.score >= 70 ? "#34d399" : d.score >= 45 ? "#fbbf24" : "#fb7185",
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{d.interpretation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue sustainability (RSA)</CardTitle>
                <CardDescription>
                  Year-1 attrition {Math.round(result.sustainability.year1AttritionRate * 100)}% · five-year survival{" "}
                  {Math.round(result.sustainability.fiveYearSurvivalRate * 100)}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-3">
                  {result.sustainability.projectedRevenue.map((r, i) => (
                    <div key={i} className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Year {i + 1}</p>
                      <p className="mt-1 font-semibold">{fmt(r)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Durable revenue (yr 3)</p>
                    <p className="mt-1 text-lg font-semibold">{fmt(result.sustainability.durableRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Revenue NPV</p>
                    <p className="mt-1 text-lg font-semibold">{fmt(result.sustainability.revenueNPV)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration risk (IRA)</CardTitle>
                <CardDescription>
                  Composite risk {Math.round(result.integrationRisk.compositeRisk)}/100 ·{" "}
                  {result.integrationRisk.estimatedIntegrationMonths} months to stable state ·{" "}
                  {fmt(result.integrationRisk.totalIntegrationCost)} remediation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.integrationRisk.dimensions.map(d => (
                  <div key={d.key} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{d.label}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className={d.riskScore >= 60 ? "text-rose-400" : d.riskScore >= 35 ? "text-amber-300" : "text-emerald-400"}>
                          risk {Math.round(d.riskScore)}
                        </span>
                        <span className="font-semibold">{fmt(d.remediationCost)}</span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{d.detail}</p>
                  </div>
                ))}
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
          </>
        ) : null}

        <PageInsights pageId="practice-acquisition" />
      </div>
    </AppShell>
  );
}
