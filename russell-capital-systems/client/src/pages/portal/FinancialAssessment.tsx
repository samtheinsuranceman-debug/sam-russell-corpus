// ============================================================
// FINANCIAL ASSESSMENT — the comprehensive client fact finder (15 sections,
// ~190 questions). Collects and documents only; it never computes results.
// Autosaves, tracks completeness, and renders the printable Financial
// Analysis Document. Completing it unlocks the AI Financial Advisor.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Check, ChevronLeft, ChevronRight, Copy, FileText, Plus, Printer, Sparkles, Trash2 } from "lucide-react";
import {
  FACT_FINDER_SECTIONS, emptyFactFinder, factFinderCompleteness, factFinderSummary, fieldVisible, isBlank,
  type ClientFactFinder, type FieldSpec, type FieldValue, type ListRow, type SectionData,
} from "@shared/clientFactFinder";

const CARD = "rounded-2xl border border-violet-400/20 bg-white/[0.04] backdrop-blur-sm";
const INPUT = "w-full rounded-xl border border-violet-400/25 bg-[#0b0f1a] px-3.5 py-2.5 text-[15px] text-white placeholder:text-slate-500 focus:border-violet-300 focus:outline-none";
const LABEL = "block text-sm text-slate-300";

function formatMoney(n: number | null | undefined) {
  return typeof n === "number" ? n.toLocaleString("en-US") : "";
}
function parseMoney(s: string): number | null {
  const n = Number(s.replace(/[^0-9.-]/g, ""));
  return s.trim() === "" || Number.isNaN(n) ? null : n;
}

function Field({ spec, value, onChange }: { spec: FieldSpec; value: FieldValue | undefined; onChange: (v: FieldValue) => void }) {
  const id = `f-${spec.key}`;
  const req = spec.required ? <span className="ml-1 text-violet-300">*</span> : null;
  const hint = spec.hint ? <p className="mt-1 text-xs text-slate-500">{spec.hint}</p> : null;
  if (spec.type === "boolean") {
    return (
      <div>
        <span className={LABEL}>{spec.label}{req}</span>
        <div className="mt-1.5 inline-flex overflow-hidden rounded-xl border border-violet-400/25" role="group" aria-label={spec.label}>
          {[true, false].map((b) => (
            <button key={String(b)} type="button" onClick={() => onChange(b)} aria-pressed={value === b}
              className={`px-5 py-2 text-sm font-medium transition ${value === b ? "bg-violet-500 text-white" : "bg-[#0b0f1a] text-slate-300 hover:bg-white/5"}`}>
              {b ? "Yes" : "No"}
            </button>
          ))}
        </div>
        {hint}
      </div>
    );
  }
  if (spec.type === "select") {
    return (
      <label className={LABEL} htmlFor={id}>{spec.label}{req}
        <select id={id} className={`${INPUT} mt-1.5`} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">Select…</option>
          {spec.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {hint}
      </label>
    );
  }
  if (spec.type === "textarea") {
    return (
      <label className={`${LABEL} sm:col-span-2`} htmlFor={id}>{spec.label}{req}
        <textarea id={id} rows={3} className={`${INPUT} mt-1.5`} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
        {hint}
      </label>
    );
  }
  if (spec.type === "money") {
    return (
      <label className={LABEL} htmlFor={id}>{spec.label}{req}
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
          <input id={id} inputMode="decimal" className={`${INPUT} pl-7`} value={formatMoney(typeof value === "number" ? value : null)}
            onChange={(e) => onChange(parseMoney(e.target.value))} placeholder="0" />
        </div>
        {hint}
      </label>
    );
  }
  if (spec.type === "number" || spec.type === "percent") {
    return (
      <label className={LABEL} htmlFor={id}>{spec.label}{req}
        <div className="relative mt-1.5">
          <input id={id} type="number" step="any" className={INPUT} value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />
          {spec.type === "percent" && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">%</span>}
        </div>
        {hint}
      </label>
    );
  }
  return (
    <label className={LABEL} htmlFor={id}>{spec.label}{req}
      <input id={id} type={spec.type === "date" ? "date" : "text"} className={`${INPUT} mt-1.5`} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} />
      {hint}
    </label>
  );
}

export default function FinancialAssessment() {
  const get = trpc.factFinder.get.useQuery(undefined, { refetchOnWindowFocus: false });
  const save = trpc.factFinder.save.useMutation();
  const [data, setData] = useState<ClientFactFinder>(() => emptyFactFinder());
  const [loaded, setLoaded] = useState(false);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "offline">("idle");
  const [showDoc, setShowDoc] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (get.data && !loaded) { setData(get.data.data); setLoaded(true); if (!get.data.persisted) setSaveState("idle"); }
  }, [get.data, loaded]);

  const completeness = useMemo(() => factFinderCompleteness(data), [data]);
  const section = FACT_FINDER_SECTIONS[sectionIdx]!;
  const sectionData: SectionData = data.sections[section.id] ?? {};

  const persist = useCallback((next: ClientFactFinder) => {
    if (timer.current) window.clearTimeout(timer.current);
    setSaveState("dirty");
    timer.current = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const r = await save.mutateAsync({ data: next });
        setSaveState(r.saved ? "saved" : "offline");
      } catch { setSaveState("offline"); }
    }, 900);
  }, [save]);

  const update = (key: string, v: FieldValue) => {
    setData((prev) => {
      const next: ClientFactFinder = { ...prev, sections: { ...prev.sections, [section.id]: { ...(prev.sections[section.id] ?? {}), [key]: v } } };
      persist(next);
      return next;
    });
  };
  const updateList = (rows: ListRow[]) => {
    if (!section.list) return;
    setData((prev) => { const next = { ...prev, lists: { ...prev.lists, [section.list!.key]: rows } }; persist(next); return next; });
  };

  const firstIncomplete = FACT_FINDER_SECTIONS.findIndex((s) => (completeness.sectionPercent[s.id] ?? 100) < 100);
  const doc = useMemo(() => factFinderSummary(data, { includeBlank: true }), [data]);
  const hh = data.sections.household ?? {};
  const clientName = [hh.firstName, hh.lastName].filter((v) => !isBlank(v as FieldValue)).join(" ") || "Client";

  const saveLabel = { idle: "", dirty: "Unsaved changes", saving: "Saving…", saved: "Saved · just now", offline: "Not saved — database unavailable" }[saveState];

  return (
    <AppShell title="Financial Assessment">
      <div className="mx-auto max-w-6xl space-y-5 pb-16">
        {/* header */}
        <div className={`${CARD} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">New Client Welcome List · Step 1</p>
              <h1 className="mt-1 text-2xl font-semibold text-white">Financial Assessment</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">Fifteen sections. Everything — income, taxes, mortgages, debts, investments, insurance, practice, estate, protection, retirement, goals. This is the foundation every answer rests on; the AI Financial Advisor will not advise until it is complete.</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div className="text-3xl font-semibold text-white">{completeness.percent}%</div>
              <div>{completeness.answered} of {completeness.required} required answered</div>
              <div className={`mt-1 ${saveState === "offline" ? "text-amber-300" : "text-slate-500"}`}>{saveLabel}</div>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${completeness.percent}%` }} />
          </div>
          {completeness.complete ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
              <p className="text-sm text-emerald-200"><Check size={14} className="mr-1 inline" /> Assessment complete — the AI Financial Advisor can now answer your questions.</p>
              <Link href="/portal/ai-advisor" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"><Sparkles size={14} className="mr-1 inline" /> Ask the advisor</Link>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3">
              <p className="text-sm text-violet-100">{completeness.missing.length} required answer{completeness.missing.length === 1 ? "" : "s"} remaining.</p>
              {firstIncomplete >= 0 && <button type="button" onClick={() => setSectionIdx(firstIncomplete)} className="rounded-lg border border-violet-300/40 px-3 py-1.5 text-sm text-violet-100 hover:bg-violet-500/20">Jump to next open section</button>}
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* section rail */}
          <nav aria-label="Assessment sections" className={`${CARD} p-3 lg:sticky lg:top-24 lg:self-start`}>
            <ol className="space-y-1">
              {FACT_FINDER_SECTIONS.map((s, i) => {
                const pct = completeness.sectionPercent[s.id] ?? 0;
                const active = i === sectionIdx;
                return (
                  <li key={s.id}>
                    <button type="button" onClick={() => setSectionIdx(i)} aria-current={active ? "step" : undefined}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${active ? "bg-violet-500/20 text-white" : "text-slate-300 hover:bg-white/5"}`}>
                      <span className="flex items-center gap-2"><span className="w-5 text-xs text-slate-500">{i + 1}</span>{s.title}</span>
                      {pct === 100 ? <Check size={14} className="text-emerald-300" /> : <span className="text-xs text-slate-500">{pct}%</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* section form */}
          <div className={`${CARD} p-6`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">Section {sectionIdx + 1} of {FACT_FINDER_SECTIONS.length}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{section.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{section.intro}</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {section.fields.filter((f) => fieldVisible(f, sectionData)).map((f) => (
                <Field key={f.key} spec={f} value={sectionData[f.key]} onChange={(v) => update(f.key, v)} />
              ))}
            </div>

            {section.list && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{section.list.label}</h3>
                  <button type="button" onClick={() => updateList([...(data.lists[section.list!.key] ?? []), {}])} className="inline-flex items-center gap-1 rounded-lg border border-violet-300/40 px-3 py-1.5 text-sm text-violet-100 hover:bg-violet-500/20"><Plus size={14} /> {section.list.addLabel}</button>
                </div>
                {(data.lists[section.list.key] ?? []).map((row, ri) => (
                  <div key={ri} className="mt-3 rounded-xl border border-white/10 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {section.list!.fields.map((f) => (
                        <Field key={f.key} spec={f} value={row[f.key]} onChange={(v) => { const rows = [...(data.lists[section.list!.key] ?? [])]; rows[ri] = { ...rows[ri], [f.key]: v }; updateList(rows); }} />
                      ))}
                    </div>
                    <button type="button" onClick={() => updateList((data.lists[section.list!.key] ?? []).filter((_, i) => i !== ri))} className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-300"><Trash2 size={12} /> Remove</button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
              <button type="button" disabled={sectionIdx === 0} onClick={() => setSectionIdx((i) => Math.max(0, i - 1))} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"><ChevronLeft size={16} /> Previous</button>
              <button type="button" onClick={() => setShowDoc((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-violet-300/40 px-4 py-2 text-sm text-violet-100 hover:bg-violet-500/20"><FileText size={16} /> {showDoc ? "Hide" : "View"} my Financial Analysis Document</button>
              <button type="button" disabled={sectionIdx === FACT_FINDER_SECTIONS.length - 1} onClick={() => setSectionIdx((i) => Math.min(FACT_FINDER_SECTIONS.length - 1, i + 1))} className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-40">Next <ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* the document */}
        {showDoc && (
          <section className={`${CARD} p-6 print:border-0 print:bg-white print:text-black`} aria-label="Financial Analysis Document">
            <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">Financial Analysis Document</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{clientName} · {new Date().toLocaleDateString()}</h2>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void navigator.clipboard?.writeText(`FINANCIAL ANALYSIS DOCUMENT — ${clientName} — ${new Date().toLocaleDateString()}\n\n${doc}`)} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5"><Copy size={14} /> Copy as text</button>
                <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-400"><Printer size={14} /> Print</button>
              </div>
            </div>
            <div className="mt-6 space-y-6">
              {FACT_FINDER_SECTIONS.map((s) => {
                const sd = data.sections[s.id] ?? {};
                return (
                  <div key={s.id}>
                    <h3 className="border-b border-violet-400/20 pb-1 text-sm font-semibold uppercase tracking-wider text-violet-200 print:text-black">{s.title}</h3>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                      {s.fields.filter((f) => fieldVisible(f, sd)).map((f) => {
                        const v = sd[f.key];
                        const text = isBlank(v) ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : f.type === "money" && typeof v === "number" ? `$${v.toLocaleString("en-US")}` : f.type === "percent" && typeof v === "number" ? `${v}%` : String(v);
                        return (
                          <div key={f.key} className="flex justify-between gap-4 border-b border-white/5 py-1 text-sm print:border-gray-200">
                            <dt className="text-slate-400 print:text-gray-600">{f.label}</dt>
                            <dd className={`text-right ${isBlank(v) ? "text-slate-600" : "text-white print:text-black"}`}>{text}</dd>
                          </div>
                        );
                      })}
                    </dl>
                    {s.list && (data.lists[s.list.key] ?? []).map((row, i) => (
                      <p key={i} className="mt-1 text-sm text-slate-300 print:text-black">{s.list!.label} #{i + 1}: {s.list!.fields.filter((f) => !isBlank(row[f.key])).map((f) => `${f.label} ${row[f.key]}`).join(", ")}</p>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="mt-8 border-t border-white/10 pt-4 text-xs text-slate-500 print:text-gray-600">Client-provided information for planning purposes. Not tax, legal, or investment advice. Every strategy is reviewed by a licensed Russell Capital Systems advisor and the tax professional team for suitability and compliance with applicable IRS statutes before anything is implemented.</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
