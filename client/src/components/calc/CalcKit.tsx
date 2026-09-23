/**
 * CalcKit — the small set of controlled inputs and read-outs the A25 calculator
 * repairs share. Every input here is controlled (value + onChange), which is
 * the property the dead calculators lacked: their inputs were uncontrolled,
 * readOnly, or bound to state nothing read.
 */
import type { ReactNode } from "react";

export const usd = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? "—" : `$${Math.round(n).toLocaleString("en-US")}`;
export const pct = (n: number | null | undefined, digits = 1) =>
  n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(digits)}%`;

export function NumberField(props: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
  testId?: string;
}) {
  const { label, value, onChange, step, min, max, suffix, hint, testId } = props;
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}{suffix ? <span className="text-slate-500"> ({suffix})</span> : null}</span>
      <input
        type="number"
        data-testid={testId}
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={e => {
          const n = e.target.value === "" ? 0 : Number(e.target.value);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className="mt-1 w-full rounded-md border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-white"
      />
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function SelectField<T extends string>(props: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; testId?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{props.label}</span>
      <select
        data-testid={props.testId}
        value={props.value}
        onChange={e => props.onChange(e.target.value as T)}
        className="mt-1 w-full rounded-md border border-[#1e3a5f] bg-[#0a0f1a] p-2 text-white"
      >
        {props.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Toggle(props: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      <input type="checkbox" checked={props.checked} onChange={e => props.onChange(e.target.checked)} className="accent-emerald-400" />
      {props.label}
    </label>
  );
}

export function Stat(props: { label: string; value: string; sub?: string; tone?: "good" | "bad" | "neutral"; testId?: string }) {
  const color = props.tone === "good" ? "text-emerald-400" : props.tone === "bad" ? "text-rose-400" : "text-white";
  return (
    <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1526] p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{props.label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`} data-testid={props.testId}>{props.value}</div>
      {props.sub ? <div className="mt-1 text-xs text-slate-500">{props.sub}</div> : null}
    </div>
  );
}

export function Panel(props: { title: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <section className="mb-6 rounded-xl border border-[#1e3a5f] bg-[#0d1526] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">{props.icon}{props.title}</h2>
      {props.children}
    </section>
  );
}

export function Notes({ notes }: { notes: readonly string[] }) {
  if (!notes.length) return null;
  return (
    <ul className="mb-6 list-disc space-y-1 pl-5 text-sm text-amber-200/90">
      {notes.map((n, i) => <li key={i}>{n}</li>)}
    </ul>
  );
}

export function ProvenanceSources({ sources, disclosure }: { sources: readonly { label: string; url?: string; asOf?: string; note?: string }[]; disclosure: string }) {
  return (
    <section className="mt-8 rounded-xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/60 p-5 text-sm" aria-label="Where these numbers come from">
      <h2 className="mb-2 font-semibold text-white">Where these numbers come from</h2>
      <ul className="space-y-1 text-slate-400">
        {sources.map((s, i) => (
          <li key={i}>
            {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="text-sky-300 underline">{s.label}</a> : s.label}
            {s.asOf ? <span className="text-slate-500"> — {s.asOf}</span> : null}
            {s.note ? <span className="block text-xs text-slate-500">{s.note}</span> : null}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-500">{disclosure}</p>
    </section>
  );
}
