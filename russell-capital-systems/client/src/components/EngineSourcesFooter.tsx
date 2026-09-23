/**
 * EngineSourcesFooter — "Where these numbers come from", on every catalogue page.
 *
 * Mounted by the app shell. For a route in the calculator catalogue, it names
 * the engine behind the page and lists that engine's own sources, with links
 * and as-of dates, loaded lazily from the engine module. An engine that has
 * not yet exported its sources gets an honest line saying so; the provenance
 * census tracks those and the list is meant to reach zero.
 *
 * Closed by default so the calculator's own layout stands; one click opens it.
 */
import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { catalogueEntryForPath, loadEngineSources, uniqueSources, type SourceRef } from "@shared/engineSources";

export default function EngineSourcesFooter({ path }: { path: string }) {
  const entry = catalogueEntryForPath(path);
  const engine = entry?.engine ?? null;
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<SourceRef[] | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setSources(undefined);
    if (!open || !engine) return;
    loadEngineSources(engine).then(s => { if (live) setSources(s === null ? null : uniqueSources(s)); });
    return () => { live = false; };
  }, [open, engine]);

  if (!entry || !engine) return null;
  const engineName = engine.replace(/^shared\//, "").replace(/\.ts$/, "");

  return (
    <section
      data-testid="engine-sources-footer"
      className="mt-8 rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/60"
      aria-label="Where these numbers come from"
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <BookOpen className="h-4 w-4 text-amber-300" aria-hidden />
        <span className="text-sm font-semibold text-white">Where these numbers come from</span>
        <span className="ml-1 text-xs text-slate-500">engine {engineName}</span>
        {open ? <ChevronUp className="ml-auto h-4 w-4 text-slate-400" aria-hidden /> : <ChevronDown className="ml-auto h-4 w-4 text-slate-400" aria-hidden />}
      </button>

      {open && (
        <div className="border-t border-[#1e3a5f]/40 px-5 py-4 text-sm">
          {sources === undefined && <p className="text-slate-400">Reading the engine's source list…</p>}
          {sources === null && (
            <p className="text-slate-300">
              This engine's constants are typed into <code className="text-amber-300">{engine}</code> and it has not yet
              exported a source list. It is on the provenance census, which the build checks; the list only shrinks.
              Until it is sourced, treat every figure on this page as the firm's assumption, not a published fact.
            </p>
          )}
          {sources && sources.length === 0 && (
            <p className="text-slate-300">The engine exports a source list, but it is empty. Treat the figures as assumptions.</p>
          )}
          {sources && sources.length > 0 && (
            <ol className="space-y-2">
              {sources.map((s, i) => (
                <li key={`${s.label}-${i}`} className="flex gap-2 text-slate-300">
                  <span className="w-5 shrink-0 text-right text-slate-500">{i + 1}.</span>
                  <span>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-amber-200 underline decoration-amber-200/40 underline-offset-2">
                        {s.label} <ExternalLink className="inline h-3 w-3" aria-hidden />
                      </a>
                    ) : (
                      s.label
                    )}
                    {s.asOf && <span className="ml-2 text-xs text-slate-500">as of {s.asOf}</span>}
                    {s.note && <span className="block text-xs text-slate-500">{s.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
