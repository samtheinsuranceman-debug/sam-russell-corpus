import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, ClipboardList, Download, Save, Trash2 } from "lucide-react";
import NavBar from "@/components/NavBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  PRIORITY_OPTIONS, emptyFactFinder, factFinderProgress, financialContextFrom, householdIncome, liquidAssets, netWorth,
  loadFactFinder, saveFactFinder, clearFactFinder, type FactFinderData, type Filing, type Occupation,
} from "@/lib/financeStorage";
import { useClinicalEvidence } from "@/lib/clinicalEvidence";
import { money } from "@shared/finance/format";
import { TIER_STYLE } from "@/components/finance/ReadinessPanel";
import { Badge } from "@/components/ui/badge";
import { usePageTitle } from "@/lib/usePageTitle";

type Section = keyof FactFinderData;

const SECTIONS: Array<{ key: Section; title: string; blurb: string }> = [
  { key: "profile", title: "About you", blurb: "Age, filing status and what you do. Sets the brackets and the horizon." },
  { key: "income", title: "Income", blurb: "Every dollar that comes in. Approximate is fine; you can sharpen it later." },
  { key: "tax", title: "Tax", blurb: "Your marginal federal and state rates. Last year's total tax if you know it." },
  { key: "cashflow", title: "Cash flow", blurb: "What a month costs and what is left. This sets the liquidity floor in dollars." },
  { key: "assets", title: "Assets", blurb: "Cash, brokerage, retirement accounts, home, practice, policy cash values." },
  { key: "debts", title: "Debts", blurb: "Mortgage, student loans, everything else — balance and rate." },
  { key: "protection", title: "Protection", blurb: "What is already covered, so the gap analysis is honest." },
  { key: "goals", title: "Goals", blurb: "What you want this to do, in your words." },
];

type NumberKey<S extends Section> = { [K in keyof FactFinderData[S]]: FactFinderData[S][K] extends number | null ? K : never }[keyof FactFinderData[S]];

function NumberField<S extends Section>({ data, section, field, label, unit, onChange, step }: {
  data: FactFinderData; section: S; field: NumberKey<S>; label: string; unit?: "$" | "%" | "yrs" | "#"; step?: number;
  onChange: (section: S, field: NumberKey<S>, value: number | null) => void;
}) {
  const raw = (data[section] as Record<string, unknown>)[field as string];
  const value = typeof raw === "number" ? String(raw) : "";
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-foreground">{label}</span>
      <div className="relative">
        {unit === "$" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>}
        <Input
          type="number"
          inputMode="decimal"
          className={`font-mono tabular-nums ${unit === "$" ? "pl-7" : ""} ${unit && unit !== "$" ? "pr-12" : ""}`}
          value={value}
          step={step ?? (unit === "$" ? 1000 : unit === "%" ? 0.5 : 1)}
          onChange={e => onChange(section, field, e.target.value === "" ? null : Number(e.target.value))}
        />
        {unit && unit !== "$" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>}
      </div>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 accent-[oklch(0.72_0.18_155)]" />
      <span className="text-foreground">{label}</span>
    </label>
  );
}

export default function FactFinder() {
  usePageTitle("Financial fact finder");
  const stored = useMemo(() => loadFactFinder(), []);
  const [data, setData] = useState<FactFinderData>(() => stored?.data ?? emptyFactFinder());
  const [section, setSection] = useState<number>(() => Math.min(stored?.section ?? 0, SECTIONS.length - 1));
  const [savedAt, setSavedAt] = useState<number | null>(stored?.updatedAt ?? null);
  const [storageOk, setStorageOk] = useState(true);

  // Autosave on every change. Best-effort; a blocked storage never blocks the form.
  useEffect(() => {
    const ok = saveFactFinder(data, section);
    setStorageOk(ok);
    if (ok) setSavedAt(Date.now());
  }, [data, section]);

  const progress = factFinderProgress(data);
  const context = useMemo(() => financialContextFrom(data), [data]);
  const { profile } = useClinicalEvidence(context);
  const tier = TIER_STYLE[profile.tier];

  const setNum = <S extends Section>(s: S, f: NumberKey<S>, v: number | null) =>
    setData(prev => ({ ...prev, [s]: { ...prev[s], [f]: v } }));
  const setField = <S extends Section, K extends keyof FactFinderData[S]>(s: S, f: K, v: FactFinderData[S][K]) =>
    setData(prev => ({ ...prev, [s]: { ...prev[s], [f]: v } }));

  const current = SECTIONS[section];

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drbuddy-financial-fact-finder.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (!confirm("Clear everything you have entered?")) return;
    clearFactFinder();
    setData(emptyFactFinder());
    setSection(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-4xl">
        <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Financial planning
        </Link>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Financial fact finder</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tell us the shape of your picture</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Saves automatically on this device. Do a section now and the rest later. Nothing leaves this page until you choose to export or share it.
            </p>
          </div>
          <Badge className={`border ${tier.badge}`}>{tier.label} · capacity {profile.decisionCapacity}</Badge>
        </div>

        <div className="mb-6">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.answered} of {progress.total} answered</span>
            <span className="flex items-center gap-1.5">
              {storageOk ? <><Save className="h-3 w-3" /> {savedAt ? `saved ${new Date(savedAt).toLocaleTimeString()}` : "not saved yet"}</> : "storage unavailable — export before leaving"}
            </span>
          </div>
          <Progress value={progress.ratio * 100} className="h-2 bg-muted" />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {SECTIONS.map((s, i) => {
            const done = Object.entries(data[s.key] as Record<string, unknown>).some(([k, v]) =>
              k !== "notes" && (typeof v === "number" || v === true || (Array.isArray(v) && v.length > 0) || (typeof v === "string" && v.trim() !== "" && k !== "filing" && k !== "occupation")),
            );
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(i)}
                className={`rounded-full border px-3 py-1 text-xs ${i === section ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                {done && <Check className="mr-1 inline h-3 w-3" />}{s.title}
              </button>
            );
          })}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground mb-5">{current.blurb}</p>

            {current.key === "profile" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField data={data} section="profile" field="age" label="Age" unit="yrs" onChange={setNum} />
                <NumberField data={data} section="profile" field="retireAge" label="Age you want the option to stop" unit="yrs" onChange={setNum} />
                <label className="block text-sm">
                  <span className="mb-1 block text-foreground">Filing status</span>
                  <select className="h-9 w-full rounded-md border border-input bg-input px-3 text-sm" value={data.profile.filing} onChange={e => setField("profile", "filing", e.target.value as Filing)}>
                    <option value="single">Single</option>
                    <option value="mfj">Married filing jointly</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-foreground">What you do</span>
                  <select className="h-9 w-full rounded-md border border-input bg-input px-3 text-sm" value={data.profile.occupation} onChange={e => setField("profile", "occupation", e.target.value as Occupation)}>
                    <option value="physician">Physician</option>
                    <option value="surgeon">Surgeon</option>
                    <option value="psychiatrist">Psychiatrist</option>
                    <option value="dentist">Dentist</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-foreground">State</span>
                  <Input value={data.profile.state} maxLength={2} placeholder="NC" onChange={e => setField("profile", "state", e.target.value.toUpperCase())} />
                </label>
                <NumberField data={data} section="profile" field="dependents" label="Dependents" unit="#" onChange={setNum} />
              </div>
            )}

            {current.key === "income" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField data={data} section="income" field="salary" label="Your W-2 / practice income" unit="$" onChange={setNum} />
                <NumberField data={data} section="income" field="spouseIncome" label="Spouse income" unit="$" onChange={setNum} />
                <NumberField data={data} section="income" field="bonus" label="Bonus / RVU / 1099" unit="$" onChange={setNum} />
                <NumberField data={data} section="income" field="otherIncome" label="Rental, dividends, other" unit="$" onChange={setNum} />
                <div className="sm:col-span-2 text-sm text-muted-foreground">Household income: <span className="font-mono text-foreground">{money(householdIncome(data))}</span></div>
              </div>
            )}

            {current.key === "tax" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField data={data} section="tax" field="marginalRate" label="Marginal federal rate" unit="%" onChange={setNum} />
                <NumberField data={data} section="tax" field="stateRate" label="State income tax rate" unit="%" onChange={setNum} />
                <NumberField data={data} section="tax" field="priorYearTax" label="Total tax paid last year (if known)" unit="$" onChange={setNum} />
              </div>
            )}

            {current.key === "cashflow" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField data={data} section="cashflow" field="monthlyExpenses" label="What a month costs, all in" unit="$" onChange={setNum} step={500} />
                <NumberField data={data} section="cashflow" field="monthlySavings" label="What is left each month" unit="$" onChange={setNum} step={500} />
                {typeof data.cashflow.monthlyExpenses === "number" && (
                  <div className="sm:col-span-2 text-sm text-muted-foreground">
                    Your liquidity floor at the current tier: <span className="font-mono text-foreground">{profile.guardrails.liquidityFloorMonths} months = {money(data.cashflow.monthlyExpenses * profile.guardrails.liquidityFloorMonths)}</span>
                    {liquidAssets(data) > 0 && <> · liquid now <span className="font-mono text-foreground">{money(liquidAssets(data))}</span></>}
                  </div>
                )}
              </div>
            )}

            {current.key === "assets" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField data={data} section="assets" field="cash" label="Cash and savings" unit="$" onChange={setNum} />
                <NumberField data={data} section="assets" field="brokerage" label="Taxable brokerage" unit="$" onChange={setNum} />
                <NumberField data={data} section="assets" field="preTax" label="401(k) / 403(b) / IRA / TSP (pre-tax)" unit="$" onChange={setNum} />
                <NumberField data={data} section="assets" field="roth" label="Roth accounts" unit="$" onChange={setNum} />
                <NumberField data={data} section="assets" field="hsa" label="HSA" unit="$" onChange={setNum} />
                <NumberField data={data} section="assets" field="homeValue" label="Home value" unit="$" onChange={setNum} step={10000} />
                <NumberField data={data} section="assets" field="otherRealEstate" label="Other real estate" unit="$" onChange={setNum} step={10000} />
                <NumberField data={data} section="assets" field="businessValue" label="Practice / business value" unit="$" onChange={setNum} step={10000} />
                <NumberField data={data} section="assets" field="lifeInsuranceCashValue" label="Life insurance cash value" unit="$" onChange={setNum} />
                <div className="sm:col-span-2 text-sm text-muted-foreground">Net worth so far: <span className="font-mono text-foreground">{money(netWorth(data))}</span></div>
              </div>
            )}

            {current.key === "debts" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField data={data} section="debts" field="mortgageBalance" label="Mortgage balance" unit="$" onChange={setNum} step={5000} />
                <NumberField data={data} section="debts" field="mortgageRate" label="Mortgage rate" unit="%" onChange={setNum} step={0.125} />
                <NumberField data={data} section="debts" field="mortgageYearsLeft" label="Years left" unit="yrs" onChange={setNum} />
                <NumberField data={data} section="debts" field="heloc" label="HELOC balance" unit="$" onChange={setNum} />
                <NumberField data={data} section="debts" field="studentLoans" label="Student loans" unit="$" onChange={setNum} step={5000} />
                <NumberField data={data} section="debts" field="studentLoanRate" label="Student loan rate" unit="%" onChange={setNum} step={0.125} />
                <NumberField data={data} section="debts" field="otherDebt" label="Other debt" unit="$" onChange={setNum} />
                <NumberField data={data} section="debts" field="otherDebtRate" label="Other debt rate" unit="%" onChange={setNum} step={0.5} />
              </div>
            )}

            {current.key === "protection" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField data={data} section="protection" field="lifeInsuranceFace" label="Life insurance in force (death benefit)" unit="$" onChange={setNum} step={50000} />
                <NumberField data={data} section="protection" field="disabilityMonthlyBenefit" label="Disability benefit per month" unit="$" onChange={setNum} step={500} />
                <Toggle label="Long-term care coverage" checked={data.protection.hasLongTermCare} onChange={v => setField("protection", "hasLongTermCare", v)} />
                <Toggle label="Umbrella liability policy" checked={data.protection.hasUmbrella} onChange={v => setField("protection", "hasUmbrella", v)} />
                <Toggle label="Will / trust / powers of attorney in place" checked={data.protection.hasEstateDocuments} onChange={v => setField("protection", "hasEstateDocuments", v)} />
              </div>
            )}

            {current.key === "goals" && (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-sm text-foreground">What matters most (pick any)</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PRIORITY_OPTIONS.map(p => (
                      <Toggle
                        key={p.id}
                        label={p.label}
                        checked={data.goals.priorities.includes(p.id)}
                        onChange={v => setField("goals", "priorities", v ? [...data.goals.priorities, p.id] : data.goals.priorities.filter(x => x !== p.id))}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField data={data} section="goals" field="horizonYears" label="Years until you need this to have worked" unit="yrs" onChange={setNum} />
                  <label className="block text-sm">
                    <span className="mb-1 block text-foreground">Comfort with swings, 1 (need certainty) to 5</span>
                    <input type="range" min={1} max={5} step={1} value={data.goals.riskComfort ?? 3} onChange={e => setField("goals", "riskComfort", Number(e.target.value))} className="w-full accent-[oklch(0.72_0.18_155)]" />
                    <span className="text-xs text-muted-foreground">{data.goals.riskComfort ?? "—"}</span>
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="mb-1 block text-foreground">Anything else, in your words</span>
                  <textarea
                    className="min-h-28 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground"
                    value={data.goals.notes}
                    onChange={e => setField("goals", "notes", e.target.value)}
                  />
                </label>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportJson}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
                <Button variant="ghost" size="sm" onClick={reset}><Trash2 className="mr-1.5 h-4 w-4" /> Clear</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={section === 0} onClick={() => setSection(s => Math.max(0, s - 1))}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                {section < SECTIONS.length - 1 ? (
                  <Button size="sm" onClick={() => setSection(s => Math.min(SECTIONS.length - 1, s + 1))}>
                    Next <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Link href="/finance"><Button size="sm">See my plan <ArrowRight className="ml-1.5 h-4 w-4" /></Button></Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          Stored only in this browser until you export it. Clearing site data clears the form. General education, not tax, legal, investment or medical advice.
        </p>
      </div>
    </div>
  );
}
