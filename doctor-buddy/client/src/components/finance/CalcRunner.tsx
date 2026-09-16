import { useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CalcDef, CalcField, CalcValues, ValueFormat, Tone } from "@shared/finance/calc";
import { runCalc } from "@shared/finance/calc";
import { defaultsFor } from "@shared/finance/calc";
import { money, moneyShort, num, pct } from "@shared/finance/format";

export function formatValue(v: unknown, f: ValueFormat = "number"): string {
  if (typeof v !== "number") return String(v ?? "—");
  switch (f) {
    case "money": return money(v);
    case "moneyShort": return moneyShort(v);
    case "percent": return pct(v);
    case "number": return num(v, Number.isInteger(v) ? 0 : 2);
    default: return String(v);
  }
}

const TONE: Record<Tone, string> = {
  key: "border-primary/40 bg-primary/10",
  good: "border-emerald-400/30 bg-emerald-400/10",
  bad: "border-rose-400/30 bg-rose-400/10",
  neutral: "border-border bg-card",
};

export function Stat({ label, value, hint, tone = "neutral" }: { label: string; value: string | number; hint?: string; tone?: Tone }) {
  return (
    <div className={`rounded-lg border p-4 ${TONE[tone]}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold text-foreground tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Field({ field, value, onChange }: {
  field: CalcField;
  value: number | string | boolean;
  onChange: (v: number | string | boolean) => void;
}) {
  if (field.type === "toggle") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
        <input type="checkbox" checked={value === true} onChange={e => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[oklch(0.72_0.18_155)]" />
        <span className="text-sm">
          <span className="block text-foreground">{field.label}</span>
          {field.help && <span className="mt-0.5 block text-xs text-muted-foreground">{field.help}</span>}
        </span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block text-sm">
        <span className="mb-1 block text-foreground">{field.label}</span>
        <select
          className="h-9 w-full rounded-md border border-input bg-input px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          value={String(value)}
          onChange={e => onChange(e.target.value)}
        >
          {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {field.help && <span className="mt-1 block text-xs text-muted-foreground">{field.help}</span>}
      </label>
    );
  }

  const prefix = field.type === "money" ? "$" : null;
  const suffix = field.type === "percent" ? "%" : field.type === "years" ? "yrs" : null;

  return (
    <label className="block text-sm">
      <span className="mb-1 block text-foreground">{field.label}</span>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          className={`font-mono tabular-nums ${prefix ? "pl-7" : ""} ${suffix ? "pr-12" : ""}`}
          value={Number.isFinite(Number(value)) ? String(value) : ""}
          min={field.min}
          max={field.max}
          step={field.step ?? (field.type === "money" ? 1000 : 1)}
          onChange={e => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {field.help && <span className="mt-1 block text-xs leading-snug text-muted-foreground">{field.help}</span>}
    </label>
  );
}

const AXIS = { stroke: "#6b7280", fontSize: 11 };
const PALETTE = ["oklch(0.72 0.18 155)", "oklch(0.65 0.15 200)", "oklch(0.75 0.12 280)", "oklch(0.80 0.16 60)", "oklch(0.68 0.20 25)"];

function initialValues(def: CalcDef, initial?: Partial<CalcValues>): CalcValues {
  const values = defaultsFor(def);
  if (initial) {
    for (const f of def.fields) {
      const v = initial[f.key];
      if (v !== undefined && v !== null) values[f.key] = v;
    }
  }
  return values;
}

export default function CalcRunner({ def, initial, compact = false }: { def: CalcDef; initial?: Partial<CalcValues>; compact?: boolean }) {
  // The router reuses this component across calculator routes; keep the id
  // beside the values and reset during render when it changes.
  const [state, setState] = useState(() => ({ id: def.id, values: initialValues(def, initial), showTable: false }));
  if (state.id !== def.id) {
    setState({ id: def.id, values: initialValues(def, initial), showTable: false });
  }
  const { values, showTable } = state;
  const setValues = (update: (prev: CalcValues) => CalcValues) => setState(prev => ({ ...prev, values: update(prev.values) }));

  const result = useMemo(() => {
    try {
      return runCalc(def, values);
    } catch (err) {
      return { outputs: [{ label: "Error", value: err instanceof Error ? err.message : "Calculation failed", tone: "bad" as const }] };
    }
  }, [def, values]);

  const set = (key: string) => (v: number | string | boolean) => setValues(prev => ({ ...prev, [key]: v }));
  const tableRows = result.table ? (showTable ? result.table.rows : result.table.rows.slice(0, result.table.maxRows ?? 8)) : [];

  const body = (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="space-y-4">
        {def.fields.map(f => <Field key={f.key} field={f} value={values[f.key]} onChange={set(f.key)} />)}
        <button
          type="button"
          onClick={() => setState({ id: def.id, values: initialValues(def, initial), showTable: false })}
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
        >
          Reset
        </button>
      </div>

      <div className="min-w-0 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {result.outputs.map((o, i) => <Stat key={i} label={o.label} value={o.value} hint={o.hint} tone={o.tone} />)}
        </div>

        {result.chart && result.chart.data.length > 1 && (
          <div className="h-64 w-full rounded-lg border border-border bg-card/60 p-3">
            <ResponsiveContainer width="100%" height="100%">
              {result.chart.series.length > 2 ? (
                <LineChart data={result.chart.data} margin={{ top: 6, right: 8, bottom: 0, left: -6 }}>
                  <CartesianGrid stroke="oklch(0.2 0.02 240)" vertical={false} />
                  <XAxis dataKey={result.chart.xKey} tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} width={58}
                    tickFormatter={(x: number) => formatValue(x, result.chart!.yFormat ?? "moneyShort")} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.11 0.015 240)", border: "1px solid oklch(0.2 0.02 240)", borderRadius: 8, fontSize: 12 }}
                    formatter={(x: number, name: string) => [formatValue(x, result.chart!.yFormat ?? "money"), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {result.chart.series.map((sr, i) => (
                    <Line key={sr.key} type="monotone" dataKey={sr.key} name={sr.label} stroke={sr.color ?? PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              ) : (
                <AreaChart data={result.chart.data} margin={{ top: 6, right: 8, bottom: 0, left: -6 }}>
                  <defs>
                    {result.chart.series.map((sr, i) => (
                      <linearGradient key={sr.key} id={`g-${def.id}-${sr.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={sr.color ?? PALETTE[i % PALETTE.length]} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={sr.color ?? PALETTE[i % PALETTE.length]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="oklch(0.2 0.02 240)" vertical={false} />
                  <XAxis dataKey={result.chart.xKey} tick={AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} width={58}
                    tickFormatter={(x: number) => formatValue(x, result.chart!.yFormat ?? "moneyShort")} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.11 0.015 240)", border: "1px solid oklch(0.2 0.02 240)", borderRadius: 8, fontSize: 12 }}
                    formatter={(x: number, name: string) => [formatValue(x, result.chart!.yFormat ?? "money"), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {result.chart.series.map((sr, i) => (
                    <Area key={sr.key} type="monotone" dataKey={sr.key} name={sr.label}
                      stroke={sr.color ?? PALETTE[i % PALETTE.length]} strokeWidth={2} fill={`url(#g-${def.id}-${sr.key})`} />
                  ))}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {result.table && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>{result.table.columns.map(c => <th key={c.key} className="px-3 py-2 text-left font-medium">{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-t border-border/60">
                    {result.table!.columns.map(c => (
                      <td key={c.key} className="px-3 py-1.5 font-mono tabular-nums text-foreground/90">{formatValue(row[c.key], c.format ?? "number")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {result.table.rows.length > tableRows.length && (
              <button type="button" onClick={() => setState(p => ({ ...p, showTable: true }))} className="m-3 text-xs text-primary underline underline-offset-4">
                Show all {result.table.rows.length} rows
              </button>
            )}
          </div>
        )}

        {result.notes && result.notes.length > 0 && (
          <ul className="space-y-2 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
            {result.notes.map((note, i) => (
              <li key={i} className="flex gap-2.5"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary/70" /><span>{note}</span></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  if (compact) return body;
  return <Card className="bg-card border-border"><CardContent className="p-5 sm:p-6">{body}</CardContent></Card>;
}
