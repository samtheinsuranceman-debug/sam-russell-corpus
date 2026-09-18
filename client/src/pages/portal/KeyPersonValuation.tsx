// ───────────────────────────────────────────────────────────────────────────
// SI-035 · Key Person Insurance Valuation Engine for Medical Practices (KPIVE)
// Revenue attribution beyond billings, replacement cost across a search-then-ramp
// timeline, and the cascading valuation impact of losing a key physician.
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
import { Loader2, Plus, Trash2, Stethoscope, AlertTriangle, Users } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

type ProcedureMix = "primary_care" | "mixed" | "procedural" | "surgical";

interface PhysicianRow {
  id: string;
  name: string;
  directBillings: number;
  patientPanelSize: number;
  procedureMix: ProcedureMix;
  referralsGeneratedPerYear: number;
  avgRevenuePerReferral: number;
  ancillaryRevenue: number;
  tenureYears: number;
  ownershipPercent: number;
  age: number;
}

const seed = (): PhysicianRow[] => [
  { id: "d1", name: "Dr. Alvarez", directBillings: 1_400_000, patientPanelSize: 1800, procedureMix: "surgical", referralsGeneratedPerYear: 120, avgRevenuePerReferral: 2400, ancillaryRevenue: 380_000, tenureYears: 14, ownershipPercent: 0.4, age: 54 },
  { id: "d2", name: "Dr. Chen", directBillings: 980_000, patientPanelSize: 1500, procedureMix: "procedural", referralsGeneratedPerYear: 55, avgRevenuePerReferral: 2100, ancillaryRevenue: 150_000, tenureYears: 8, ownershipPercent: 0.35, age: 47 },
  { id: "d3", name: "Dr. Okafor", directBillings: 820_000, patientPanelSize: 1350, procedureMix: "primary_care", referralsGeneratedPerYear: 20, avgRevenuePerReferral: 1800, ancillaryRevenue: 70_000, tenureYears: 4, ownershipPercent: 0.25, age: 41 },
];

const PRIORITY_STYLE: Record<string, string> = {
  critical: "border-rose-500/40 text-rose-300",
  high: "border-amber-400/40 text-amber-300",
  moderate: "border-white/20 text-muted-foreground",
};

export default function KeyPersonValuation() {
  const [physicians, setPhysicians] = useState<PhysicianRow[]>(seed);
  const [practiceName, setPracticeName] = useState("Cape Fear Surgical Associates");
  const [specialty, setSpecialty] = useState("General Surgery");
  const [annualEbitda, setAnnualEbitda] = useState(2_800_000);
  const [ebitdaMultiple, setEbitdaMultiple] = useState(4.5);
  const [annualFixedOverhead, setAnnualFixedOverhead] = useState(2_200_000);
  const [recruitmentDifficulty, setRecruitmentDifficulty] = useState(65);
  // Payer mix is applied practice-wide; per-physician overrides go through the API.
  const [commercial, setCommercial] = useState(60);
  const [medicare, setMedicare] = useState(25);
  const [medicaid, setMedicaid] = useState(10);

  const selfPay = Math.max(0, 100 - commercial - medicare - medicaid);

  const run = trpc.si.keyPersonValuation.useMutation({
    onSuccess: () => toast.success("Key person valuation complete"),
    onError: e => toast.error(e.message),
  });

  const update = (id: string, patch: Partial<PhysicianRow>) =>
    setPhysicians(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const analyze = () =>
    run.mutate({
      name: practiceName,
      specialty,
      annualEbitda,
      ebitdaMultiple,
      annualFixedOverhead,
      recruitmentDifficulty: recruitmentDifficulty / 100,
      totalCollections: physicians.reduce((s, p) => s + p.directBillings + p.ancillaryRevenue, 0),
      physicians: physicians.map(p => ({
        ...p,
        payerMix: {
          commercial: commercial / 100,
          medicare: medicare / 100,
          medicaid: medicaid / 100,
          selfPay: selfPay / 100,
        },
      })),
    });

  const result = run.data;

  return (
    <AppShell
      title="Key Person Valuation"
      subtitle="SI-035 · Revenue attribution, replacement cost, and business continuity impact for medical practices"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-emerald-500" />
              Practice
            </CardTitle>
            <CardDescription>
              Calibrated for 3-20 physician practices where individual physician revenue exceeds $1M annually.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label className="text-xs text-muted-foreground">Practice name</Label>
                <Input value={practiceName} onChange={e => setPracticeName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Specialty</Label>
                <Input value={specialty} onChange={e => setSpecialty(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual EBITDA</Label>
                <Input type="number" value={annualEbitda} onChange={e => setAnnualEbitda(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">EBITDA multiple</Label>
                <Input type="number" step="0.1" value={ebitdaMultiple} onChange={e => setEbitdaMultiple(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Fixed overhead</Label>
                <Input type="number" value={annualFixedOverhead} onChange={e => setAnnualFixedOverhead(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Recruitment difficulty: {recruitmentDifficulty}%</Label>
                <Input type="range" min={0} max={100} value={recruitmentDifficulty} onChange={e => setRecruitmentDifficulty(+e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Payer mix</Label>
              <div className="mt-1 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Commercial %</Label>
                  <Input type="number" value={commercial} onChange={e => setCommercial(+e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Medicare %</Label>
                  <Input type="number" value={medicare} onChange={e => setMedicare(+e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Medicaid %</Label>
                  <Input type="number" value={medicaid} onChange={e => setMedicaid(+e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Self-pay % (auto)</Label>
                  <Input type="number" value={selfPay} readOnly className="opacity-70" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3">Physician</th>
                    <th className="pb-2 pr-3">Billings</th>
                    <th className="pb-2 pr-3">Panel</th>
                    <th className="pb-2 pr-3">Mix</th>
                    <th className="pb-2 pr-3">Referrals/yr</th>
                    <th className="pb-2 pr-3">Ancillary</th>
                    <th className="pb-2 pr-3">Tenure</th>
                    <th className="pb-2 pr-3">Age</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {physicians.map(p => (
                    <tr key={p.id} className="border-b border-border/40">
                      <td className="py-2 pr-3"><Input value={p.name} onChange={e => update(p.id, { name: e.target.value })} className="h-8 w-32" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={p.directBillings} onChange={e => update(p.id, { directBillings: +e.target.value })} className="h-8 w-32" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={p.patientPanelSize} onChange={e => update(p.id, { patientPanelSize: +e.target.value })} className="h-8 w-20" /></td>
                      <td className="py-2 pr-3">
                        <select
                          value={p.procedureMix}
                          onChange={e => update(p.id, { procedureMix: e.target.value as ProcedureMix })}
                          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="primary_care">Primary care</option>
                          <option value="mixed">Mixed</option>
                          <option value="procedural">Procedural</option>
                          <option value="surgical">Surgical</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3"><Input type="number" value={p.referralsGeneratedPerYear} onChange={e => update(p.id, { referralsGeneratedPerYear: +e.target.value })} className="h-8 w-20" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={p.ancillaryRevenue} onChange={e => update(p.id, { ancillaryRevenue: +e.target.value })} className="h-8 w-28" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={p.tenureYears} onChange={e => update(p.id, { tenureYears: +e.target.value })} className="h-8 w-16" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={p.age} onChange={e => update(p.id, { age: +e.target.value })} className="h-8 w-16" /></td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" onClick={() => setPhysicians(ps => ps.filter(x => x.id !== p.id))} disabled={physicians.length <= 1} aria-label={`Remove ${p.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() =>
                  setPhysicians(ps => [...ps, { id: `d${Date.now()}`, name: `Dr. ${ps.length + 1}`, directBillings: 900_000, patientPanelSize: 1400, procedureMix: "mixed", referralsGeneratedPerYear: 30, avgRevenuePerReferral: 2000, ancillaryRevenue: 100_000, tenureYears: 5, ownershipPercent: 0.2, age: 45 }])
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add physician
              </Button>
              <Button onClick={analyze} disabled={run.isPending}>
                {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Valuate coverage
              </Button>
            </div>
          </CardContent>
        </Card>

        {result ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total recommended coverage</p>
                  <p className="mt-1 text-3xl font-semibold">{fmt(result.totalRecommendedCoverage)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated annual premium</p>
                  <p className="mt-1 text-3xl font-semibold">{fmt(result.totalEstimatedPremium)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue attribution (RAM)</CardTitle>
                <CardDescription>
                  True contribution accounts for payer yield, procedure intensity, referral generation and ancillary
                  revenue — none of which appear in standard billing reports.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">Physician</th>
                      <th className="pb-2 pr-3">Booked billings</th>
                      <th className="pb-2 pr-3">Referral rev.</th>
                      <th className="pb-2 pr-3">Ancillary</th>
                      <th className="pb-2 pr-3">True contribution</th>
                      <th className="pb-2 pr-3">Share</th>
                      <th className="pb-2">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.attribution.map(a => (
                      <tr key={a.physicianId} className="border-b border-border/40">
                        <td className="py-2 pr-3 font-medium">{a.name}</td>
                        <td className="py-2 pr-3">{fmt(a.directBillings)}</td>
                        <td className="py-2 pr-3">{fmt(a.referralRevenue)}</td>
                        <td className="py-2 pr-3">{fmt(a.ancillaryRevenue)}</td>
                        <td className="py-2 pr-3 font-semibold">{fmt(a.trueContribution)}</td>
                        <td className="py-2 pr-3">{Math.round(a.contributionShare * 100)}%</td>
                        <td className={`py-2 ${a.attributionVariancePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {a.attributionVariancePercent > 0 ? "+" : ""}
                          {Math.round(a.attributionVariancePercent)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Cascading continuity impact (BCIA)
                </CardTitle>
                <CardDescription>
                  Practice valuation falls by a multiple of the departing physician's direct revenue once workload and
                  satisfaction effects on remaining physicians are modeled.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">Physician</th>
                      <th className="pb-2 pr-3">Workload +</th>
                      <th className="pb-2 pr-3">Satisfaction drop</th>
                      <th className="pb-2 pr-3">Cascade rev. loss</th>
                      <th className="pb-2 pr-3">Valuation decline</th>
                      <th className="pb-2">Cascade multiple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.continuityImpacts.map(c => {
                      const who = result.attribution.find(a => a.physicianId === c.physicianId);
                      return (
                        <tr key={c.physicianId} className="border-b border-border/40">
                          <td className="py-2 pr-3 font-medium">{who?.name}</td>
                          <td className="py-2 pr-3">{Math.round(c.workloadIncreasePercent)}%</td>
                          <td className="py-2 pr-3">{Math.round(c.satisfactionDropPoints)} pts</td>
                          <td className="py-2 pr-3">{fmt(c.cascadeRevenueLoss)}</td>
                          <td className="py-2 pr-3">{fmt(c.practiceValuationDecline)}</td>
                          <td className="py-2 font-semibold text-amber-300">{c.cascadeMultiple}x</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coverage recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.recommendations.map(r => {
                  const repl = result.replacementCosts.find(x => x.physicianId === r.physicianId);
                  return (
                    <div key={r.physicianId} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{r.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={PRIORITY_STYLE[r.priority]}>{r.priority}</Badge>
                          <span className="text-lg font-semibold">{fmt(r.recommendedCoverage)}</span>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Replacement cost</p>
                          <p>{fmt(r.coverageBasis.replacementCost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Lost contribution</p>
                          <p>{fmt(r.coverageBasis.lostContribution)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Valuation protection</p>
                          <p>{fmt(r.coverageBasis.valuationProtection)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Est. annual premium</p>
                          <p>{fmt(r.estimatedAnnualPremium)}</p>
                        </div>
                      </div>
                      {repl ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {repl.replacementMonths}-month replacement timeline · attrition loss {fmt(repl.patientAttritionLoss)}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
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

        <PageInsights pageId="key-person-valuation" />
      </div>
    </AppShell>
  );
}
