// ───────────────────────────────────────────────────────────────────────────
// SI-032 · Multi-Generational Wealth Transfer Simulation Engine (MGWTSE)
// Dynasty trust modeling with trustee succession, GST exemption optimization,
// and 100-year four-generation trajectories across three tax-law scenarios.
// ───────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Landmark, AlertTriangle, GitBranch } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
};

type TrusteeType = "individual_family" | "corporate" | "directed_with_advisor" | "private_family_trust_company";
type DistributionPolicy = "income_only" | "haircut_principal" | "ascertainable_standard" | "full_discretion";

interface TrustRow {
  id: string;
  label: string;
  fundingAmount: number;
  trusteeType: TrusteeType;
  distributionPolicy: DistributionPolicy;
  grossReturn: number;
  gstEligible: boolean;
  generationSpan: number;
}

const seed = (): TrustRow[] => [
  { id: "t1", label: "Dynasty Trust A", fundingAmount: 20_000_000, trusteeType: "private_family_trust_company", distributionPolicy: "income_only", grossReturn: 0.07, gstEligible: true, generationSpan: 4 },
  { id: "t2", label: "Marital Trust", fundingAmount: 12_000_000, trusteeType: "corporate", distributionPolicy: "full_discretion", grossReturn: 0.06, gstEligible: false, generationSpan: 1 },
  { id: "t3", label: "Dynasty Trust B", fundingAmount: 15_000_000, trusteeType: "directed_with_advisor", distributionPolicy: "ascertainable_standard", grossReturn: 0.068, gstEligible: true, generationSpan: 3 },
];

export default function MultiGenTransfer() {
  const [trusts, setTrusts] = useState<TrustRow[]>(seed);
  const [familyName, setFamilyName] = useState("Russell");
  const [netWorth, setNetWorth] = useState(60_000_000);
  const [gstExemptionAvailable, setGstExemptionAvailable] = useState(15_000_000);
  const [exemptionHolders, setExemptionHolders] = useState(2);
  const [generationLength, setGenerationLength] = useState(25);
  const [horizonYears, setHorizonYears] = useState(100);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [annualFamilySpending, setAnnualFamilySpending] = useState(900_000);

  const run = trpc.si.multiGenTransfer.useMutation({
    onSuccess: () => toast.success("Multi-generational simulation complete"),
    onError: e => toast.error(e.message),
  });

  const update = (id: string, patch: Partial<TrustRow>) =>
    setTrusts(ts => ts.map(t => (t.id === id ? { ...t, ...patch } : t)));

  const analyze = () =>
    run.mutate({
      familyName,
      netWorth,
      gstExemptionAvailable,
      exemptionHolders,
      generationLength,
      horizonYears,
      inflationRate: inflationRate / 100,
      annualFamilySpending,
      trusts,
    });

  const result = run.data;

  return (
    <AppShell
      title="Multi-Generational Wealth Transfer"
      subtitle="SI-032 · Dynasty trust modeling, GST exemption optimization, and 100-year trajectories"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-500" />
              Family and trust structures
            </CardTitle>
            <CardDescription>
              Calibrated for families above $25M net worth where dynasty trusts and GST planning create complexity
              beyond single-generation analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Family name</Label>
                <Input value={familyName} onChange={e => setFamilyName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Net worth</Label>
                <Input type="number" value={netWorth} onChange={e => setNetWorth(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">GST exemption / person</Label>
                <Input type="number" value={gstExemptionAvailable} onChange={e => setGstExemptionAvailable(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Exemption holders</Label>
                <Input type="number" min={1} max={2} value={exemptionHolders} onChange={e => setExemptionHolders(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Generation length (yrs)</Label>
                <Input type="number" value={generationLength} onChange={e => setGenerationLength(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Horizon (yrs)</Label>
                <Input type="number" value={horizonYears} onChange={e => setHorizonYears(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Inflation %</Label>
                <Input type="number" step="0.1" value={inflationRate} onChange={e => setInflationRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual family spending</Label>
                <Input type="number" value={annualFamilySpending} onChange={e => setAnnualFamilySpending(+e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3">Trust</th>
                    <th className="pb-2 pr-3">Funding</th>
                    <th className="pb-2 pr-3">Trustee</th>
                    <th className="pb-2 pr-3">Distribution</th>
                    <th className="pb-2 pr-3">Return %</th>
                    <th className="pb-2 pr-3">Gen span</th>
                    <th className="pb-2 pr-3">GST</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {trusts.map(t => (
                    <tr key={t.id} className="border-b border-border/40">
                      <td className="py-2 pr-3"><Input value={t.label} onChange={e => update(t.id, { label: e.target.value })} className="h-8 w-36" /></td>
                      <td className="py-2 pr-3"><Input type="number" value={t.fundingAmount} onChange={e => update(t.id, { fundingAmount: +e.target.value })} className="h-8 w-32" /></td>
                      <td className="py-2 pr-3">
                        <select value={t.trusteeType} onChange={e => update(t.id, { trusteeType: e.target.value as TrusteeType })} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                          <option value="individual_family">Individual family</option>
                          <option value="corporate">Corporate</option>
                          <option value="directed_with_advisor">Directed + advisor</option>
                          <option value="private_family_trust_company">Private family TC</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <select value={t.distributionPolicy} onChange={e => update(t.id, { distributionPolicy: e.target.value as DistributionPolicy })} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
                          <option value="income_only">Income only</option>
                          <option value="haircut_principal">Haircut principal</option>
                          <option value="ascertainable_standard">Ascertainable std.</option>
                          <option value="full_discretion">Full discretion</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <Input type="number" step="0.1" value={(t.grossReturn * 100).toFixed(1)} onChange={e => update(t.id, { grossReturn: +e.target.value / 100 })} className="h-8 w-20" />
                      </td>
                      <td className="py-2 pr-3"><Input type="number" min={1} max={10} value={t.generationSpan} onChange={e => update(t.id, { generationSpan: +e.target.value })} className="h-8 w-16" /></td>
                      <td className="py-2 pr-3">
                        <input type="checkbox" checked={t.gstEligible} onChange={e => update(t.id, { gstEligible: e.target.checked })} />
                      </td>
                      <td className="py-2">
                        <Button variant="ghost" size="icon" onClick={() => setTrusts(ts => ts.filter(x => x.id !== t.id))} disabled={trusts.length <= 1} aria-label={`Remove ${t.label}`}>
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
                onClick={() => setTrusts(ts => [...ts, { id: `t${Date.now()}`, label: `Trust ${ts.length + 1}`, fundingAmount: 10_000_000, trusteeType: "directed_with_advisor", distributionPolicy: "income_only", grossReturn: 0.068, gstEligible: true, generationSpan: 3 }])}
              >
                <Plus className="mr-1 h-4 w-4" /> Add trust
              </Button>
              <Button onClick={analyze} disabled={run.isPending}>
                {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run 100-year simulation
              </Button>
            </div>
          </CardContent>
        </Card>

        {result ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>GST exemption optimization (GSTO)</CardTitle>
                <CardDescription>
                  Exemption is allocated by compounding leverage, not split equally. Inclusion ratio per IRC § 2642(a).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">GST tax avoided</p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-500">{fmt(result.gstOptimization.totalGstTaxAvoided)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">If split equally</p>
                    <p className="mt-1 text-2xl font-semibold">{fmt(result.gstOptimization.equalAllocationTaxAvoided)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Optimization advantage</p>
                    <p className="mt-1 text-2xl font-semibold">{result.gstOptimization.optimizationAdvantage}x</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-2 pr-3">Trust</th>
                        <th className="pb-2 pr-3">Exemption allocated</th>
                        <th className="pb-2 pr-3">Inclusion ratio</th>
                        <th className="pb-2 pr-3">Sheltered value</th>
                        <th className="pb-2">Leverage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.gstOptimization.allocations.map(a => (
                        <tr key={a.trustId} className="border-b border-border/40">
                          <td className="py-2 pr-3 font-medium">{a.label}</td>
                          <td className="py-2 pr-3">{fmt(a.exemptionAllocated)}</td>
                          <td className="py-2 pr-3">{a.inclusionRatio.toFixed(3)}</td>
                          <td className="py-2 pr-3">{fmt(a.shelteredValue)}</td>
                          <td className="py-2">{a.leverageMultiple}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax-law scenarios (HYWTP)</CardTitle>
                <CardDescription>Family wealth at the end of each generation, in nominal dollars.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">Scenario</th>
                      {result.scenarios[0]?.generationEndValues.map((_, i) => (
                        <th key={i} className="pb-2 pr-3">Gen {i + 1}</th>
                      ))}
                      <th className="pb-2 pr-3">Transfer tax</th>
                      <th className="pb-2">Final (real)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.scenarios.map(s => (
                      <tr key={s.scenario} className="border-b border-border/40">
                        <td className="py-2 pr-3 font-medium">{s.label}</td>
                        {s.generationEndValues.map((v, i) => (
                          <td key={i} className="py-2 pr-3">{fmt(v)}</td>
                        ))}
                        <td className="py-2 pr-3 text-rose-400">{fmt(s.totalTransferTaxPaid)}</td>
                        <td className="py-2 font-semibold">{fmt(s.finalRealWealth)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Trustee succession (DTM)
                </CardTitle>
                <CardDescription>
                  A {(result.feeDragImpact.annualFeeDifference * 100).toFixed(2)}% annual cost difference compounds to{" "}
                  {fmt(result.feeDragImpact.spread)} across the horizon.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">Succession plan</th>
                      <th className="pb-2 pr-3">At generation</th>
                      <th className="pb-2 pr-3">Final trust wealth</th>
                      <th className="pb-2">vs. baseline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.successionComparisons.map((s, i) => (
                      <tr key={i} className="border-b border-border/40">
                        <td className="py-2 pr-3">{s.label}</td>
                        <td className="py-2 pr-3">{s.atGeneration}</td>
                        <td className="py-2 pr-3">{fmt(s.finalWealth)}</td>
                        <td className={`py-2 font-medium ${s.deltaVsBaseline >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {s.deltaVsBaseline >= 0 ? "+" : ""}
                          {fmt(s.deltaVsBaseline)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

        <PageInsights pageId="multi-gen-transfer" />
      </div>
    </AppShell>
  );
}
