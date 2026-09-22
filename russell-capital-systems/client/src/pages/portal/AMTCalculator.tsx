/**
 * Alternative minimum tax — the calculator behind the question this platform
 * already asks clients twice.
 *
 * Design note: the ISO bargain element input is first, and the exercise
 * ceiling is the largest number on the page. That is deliberate. "Do I owe
 * AMT" is rarely the decision; "how much can I exercise before I do" is, and
 * it is the one figure a client can act on before 31 December.
 */
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Info, TrendingUp } from "lucide-react";
import { calculateAmt, maxIsoExerciseBeforeAmt } from "@shared/amtEngine";
import { TAX_RULES_2026 } from "@shared/taxRules";
import type { AmtKey } from "@shared/taxRules";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const STATUSES: { key: AmtKey; label: string }[] = [
  { key: "single", label: "Single" },
  { key: "joint", label: "Married filing jointly" },
  { key: "hoh", label: "Head of household" },
  { key: "separate", label: "Married filing separately" },
];

function NumberField({
  id, label, hint, value, onChange,
}: { id: string; label: string; hint?: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-slate-300">{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="bg-slate-900/60 border-slate-700"
      />
      {hint && <p className="text-[11.5px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: "warn" | "good" }) {
  const colour = tone === "warn" ? "text-amber-300" : tone === "good" ? "text-emerald-300" : "text-slate-100";
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-800/70 py-2 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`font-mono text-sm tabular-nums ${colour}`}>{value}</span>
    </div>
  );
}

export default function AMTCalculator() {
  const [filingStatus, setFilingStatus] = useState<AmtKey>("single");
  const [isoBargainElement, setIso] = useState(0);
  const [regularTaxableIncome, setIncome] = useState(400_000);
  const [regularTax, setRegularTax] = useState(105_000);
  const [disallowedDeduction, setDeduction] = useState(16_100);
  const [privateActivityBondInterest, setPab] = useState(0);

  const input = {
    filingStatus, regularTaxableIncome, regularTax,
    disallowedDeduction, privateActivityBondInterest,
  };

  const result = useMemo(() => calculateAmt({ ...input, isoBargainElement }), [
    filingStatus, regularTaxableIncome, regularTax, disallowedDeduction, privateActivityBondInterest, isoBargainElement,
  ]);

  const ceiling = useMemo(() => maxIsoExerciseBeforeAmt(input), [
    filingStatus, regularTaxableIncome, regularTax, disallowedDeduction, privateActivityBondInterest,
  ]);

  const rules = TAX_RULES_2026;

  return (
    <AppShell title="Alternative Minimum Tax" subtitle={`Tax year ${rules.taxYear} · ${rules.source.split(";")[0]}`}>
      <div className="mx-auto max-w-5xl space-y-5 p-6">

        {/* The number to act on, first. */}
        <Card className="border-amber-400/25 bg-gradient-to-br from-slate-950/80 to-slate-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-slate-300">
              Incentive stock options you can exercise before AMT begins
            </CardTitle>
            <CardDescription>
              The bargain element — fair market value at exercise minus strike — on shares still held at year end.
              Exercising up to this figure costs no alternative minimum tax.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-4xl tabular-nums text-amber-300">{usd(ceiling)}</p>
            {ceiling === 0 && (
              <p className="mt-2 text-sm text-amber-200/80">
                This client is already in AMT before exercising anything. There is no free room.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="bg-slate-950/60 border-slate-800">
            <CardHeader><CardTitle className="text-base">Inputs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Filing status</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setFilingStatus(s.key)}
                      className={`rounded-md border px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                        filingStatus === s.key
                          ? "border-amber-400/50 bg-amber-500/10 text-amber-200"
                          : "border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <NumberField id="iso" label="ISO bargain element" value={isoBargainElement} onChange={setIso}
                hint="Zero if the shares were sold in the same calendar year — that makes it ordinary income and removes it from AMT entirely." />
              <NumberField id="income" label="Regular taxable income" value={regularTaxableIncome} onChange={setIncome} />
              <NumberField id="tax" label="Regular federal tax" value={regularTax} onChange={setRegularTax}
                hint="AMT is only the amount by which the tentative minimum exceeds this." />
              <NumberField id="ded" label="Deduction AMT disallows" value={disallowedDeduction} onChange={setDeduction}
                hint="The standard deduction, or the state and local tax deduction if itemising." />
              <NumberField id="pab" label="Private activity bond interest" value={privateActivityBondInterest} onChange={setPab}
                hint="Tax-exempt for regular tax, a preference item under §57(a)(5)." />
            </CardContent>
          </Card>

          <Card className="bg-slate-950/60 border-slate-800">
            <CardHeader><CardTitle className="text-base">Result</CardTitle></CardHeader>
            <CardContent>
              <Figure label="Alternative minimum taxable income" value={usd(result.amti)} />
              <Figure label="Exemption before phaseout" value={usd(result.exemptionBeforePhaseOut)} />
              <Figure label="Lost to phaseout"
                value={result.exemptionLostToPhaseOut > 0 ? `− ${usd(result.exemptionLostToPhaseOut)}` : "—"}
                tone={result.exemptionLostToPhaseOut > 0 ? "warn" : undefined} />
              <Figure label="Exemption applied" value={usd(result.exemption)} />
              <Figure label="AMT base" value={usd(result.amtBase)} />
              <Figure label="Tentative minimum tax" value={usd(result.tentativeMinimumTax)} />
              <Figure label="Regular tax" value={usd(result.regularTax)} />
              <Figure
                label="Additional tax from AMT"
                value={usd(result.amtOwed)}
                tone={result.owesAmt ? "warn" : "good"}
              />

              {result.inPhaseOut && (
                <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/5 p-3">
                  <p className="flex items-center gap-2 text-[13px] font-medium text-amber-200">
                    <TrendingUp className="h-4 w-4" /> In the AMT bubble
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-amber-100/75">
                    Each additional dollar of AMT income costs{" "}
                    <span className="font-mono">{(result.amtMarginalRate * 100).toFixed(0)}%</span> — above the 37% top
                    regular bracket — because the dollar is taxed and{" "}
                    {(rules.amt!.phaseOutRate * 100).toFixed(0)} cents of exemption is lost with it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-950/40 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <AlertTriangle className="h-4 w-4 text-amber-400/80" /> What this estimate does not include
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.caveats.map((c, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-slate-400">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-slate-800 pt-3 text-[11.5px] leading-relaxed text-slate-500">
              A planning estimate, not a filing position. Figures are from {rules.source}. The alternative minimum tax
              is computed on Form 6251 and interacts with credits, carryforwards and the treatment of capital gains in
              ways this page does not model. Have it confirmed by the client's own CPA before acting on it.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
