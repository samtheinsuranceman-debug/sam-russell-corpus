// ============================================================
// HOW A FIGURE GETS MADE.
//
// Content in shared/provenance.ts, where each trace recomputes its own
// headline through the real engine and server/provenance.test.ts asserts the
// match — so this page cannot drift into fiction.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Keyboard, FileSearch, Scale, Calculator, HelpCircle, ArrowRight } from "lucide-react";
import {
  FIGURE_TRACES, PROVENANCE_PROMISE, STEP_KIND_LABELS, STEP_KIND_MEANING, stepMix,
  type StepKind, type FigureTrace,
} from "@shared/provenance";

const CARD = "rounded-2xl border border-emerald-400/20 bg-white/[0.04]";

const KIND_STYLE: Record<StepKind, { ring: string; text: string; Icon: typeof Keyboard }> = {
  input:      { ring: "border-sky-400/40 bg-sky-400/10",       text: "text-sky-200",     Icon: Keyboard },
  sourced:    { ring: "border-emerald-400/40 bg-emerald-400/10", text: "text-emerald-200", Icon: FileSearch },
  rule:       { ring: "border-amber-400/40 bg-amber-400/10",   text: "text-amber-200",   Icon: Scale },
  arithmetic: { ring: "border-white/20 bg-white/[0.06]",       text: "text-slate-200",   Icon: Calculator },
  assumption: { ring: "border-rose-400/40 bg-rose-400/10",     text: "text-rose-200",    Icon: HelpCircle },
};

const KINDS: StepKind[] = ["input", "sourced", "rule", "arithmetic", "assumption"];

function Trace({ t }: { t: FigureTrace }) {
  const mix = stepMix(t);
  return (
    <article className={`${CARD} p-6`}>
      <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/70">{t.question}</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white" style={{ textWrap: "balance" }}>
        {t.headline}
      </h3>
      <p className="mt-2 text-[13px] text-slate-400">
        Appears on <Link href={t.pagePath} className="text-emerald-300 hover:underline">{t.page}</Link>
        {" · "}computed by <code className="rounded bg-black/40 px-1.5 py-0.5 text-[12px] text-slate-300">{t.engine}</code>
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {KINDS.filter((k) => mix[k] > 0).map((k) => (
          <span key={k} className={`rounded-full border px-2.5 py-0.5 text-[11px] ${KIND_STYLE[k].ring} ${KIND_STYLE[k].text}`}>
            {mix[k]} × {STEP_KIND_LABELS[k].toLowerCase()}
          </span>
        ))}
      </div>

      <ol className="mt-6 flex flex-col">
        {t.steps.map((s, i) => {
          const style = KIND_STYLE[s.kind];
          const Icon = style.Icon;
          const last = i === t.steps.length - 1;
          return (
            <li key={s.n} className="relative flex gap-4 pb-6 last:pb-0">
              {!last && <span aria-hidden className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-white/10" />}
              <span className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${style.ring}`}>
                <Icon className={`h-3.5 w-3.5 ${style.text}`} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className={`text-[10.5px] uppercase tracking-[0.16em] ${style.text}`}>{STEP_KIND_LABELS[s.kind]}</span>
                  <span className="text-[15px] font-medium text-white">{s.label}</span>
                </div>
                <p className={`mt-1 text-lg font-semibold tabular-nums ${last ? "text-emerald-300" : "text-slate-100"}`}>{s.value}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300">{s.from}</p>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                     className="mt-1 inline-block text-[12.5px] text-emerald-300 hover:underline">
                    Open the source{s.asOf ? ` · ${s.asOf}` : ""}
                  </a>
                )}
                {!s.url && s.asOf && <p className="mt-1 text-[12px] text-slate-500">{s.asOf}</p>}
                {s.working && (
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12.5px] leading-relaxed text-slate-200">
{s.working}
                  </pre>
                )}
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
                  <span className="text-slate-400">If this is wrong: </span>{s.ifWrong}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-[13.5px] leading-relaxed text-slate-300">
        <span className="font-semibold text-slate-200">What this does not tell you. </span>{t.caveat}
      </p>
    </article>
  );
}

export default function HowAFigureIsMade() {
  const [openId, setOpenId] = useState(FIGURE_TRACES[0]!.id);
  const open = FIGURE_TRACES.find((t) => t.id === openId)!;

  return (
    <AppShell>
      <div className="mx-auto max-w-[880px] px-4 py-8 sm:px-6">
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300/70">Provenance</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            How a Figure Gets Made
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-slate-300">
            You are asked to make decisions on numbers a machine produced. Here are three of them, taken apart
            step by step — what you told us, what came from a document, what the law decided, and what we worked
            out — so you can find the mistake if there is one.
          </p>
        </header>

        <section className={`${CARD} mt-6 p-5`}>
          <h2 className="text-sm font-semibold text-emerald-200">What we promise about every number on this site</h2>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-300">
            {PROVENANCE_PROMISE.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-slate-400">The five kinds of step</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {KINDS.map((k) => {
              const { ring, text, Icon } = KIND_STYLE[k];
              return (
                <div key={k} className={`rounded-xl border p-4 ${ring}`}>
                  <p className={`flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] ${text}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />{STEP_KIND_LABELS[k]}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">{STEP_KIND_MEANING[k]}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-2">
          {FIGURE_TRACES.map((t) => (
            <button key={t.id} type="button" onClick={() => setOpenId(t.id)}
                    aria-pressed={t.id === openId}
                    className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                      t.id === openId
                        ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                        : "border-white/15 text-slate-300 hover:border-white/30"}`}>
              {t.page}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <Trace t={open} />
        </div>

        <section className={`${CARD} mt-8 p-5`}>
          <h2 className="text-sm font-semibold text-emerald-200">Why you can trust this page and not just the page it describes</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300">
            Each walkthrough above recomputes its own headline figure by calling the same module the calculator
            calls. A test asserts the two match on every build. If an engine changes and this narrative stops
            being true, the build fails before anyone reads it — which is the only way an explainer stays honest
            once the thing it explains keeps moving.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
            One of the three figures on this page was typed wrong the first time it was written, and the check
            caught it before it was ever published.
          </p>
        </section>

        <p className="mt-8 border-t border-white/10 pt-5 text-[13px] leading-relaxed text-slate-500">
          Found something that does not add up? That is the point — say so, and it gets fixed or explained.
          Start with <Link href="/portal/financial-assessment" className="text-emerald-300 hover:underline">the Fact Finder</Link> if
          you want these traced against your own numbers rather than examples.
          <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden />
        </p>
      </div>
    </AppShell>
  );
}
