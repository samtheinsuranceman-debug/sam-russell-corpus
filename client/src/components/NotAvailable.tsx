/**
 * NotAvailable — the honest empty state that replaces random or mock figures.
 *
 * A25 (2026-09-23): pages that generated their displayed numbers with a random
 * number generator now render this instead, naming what is missing and where
 * the real figure would come from. Unknown stays unknown: no number is shown.
 */
import { CircleSlash } from "lucide-react";

export function NotAvailable({ what, reason, from, className = "" }: { what: string; reason: string; /** Where the real figure would come from. */ from?: string; className?: string }) {
  return (
    <div
      role="status"
      data-testid="not-available"
      className={`flex items-start gap-3 rounded-lg border border-dashed border-slate-600/60 bg-slate-900/40 p-4 text-sm text-slate-300 ${className}`}
    >
      <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      <div>
        <div className="font-medium text-slate-200">{what}: not available</div>
        <div className="text-slate-400">{reason}</div>
        {from ? <div className="mt-1 text-xs text-slate-500">Would come from: {from}</div> : null}
      </div>
    </div>
  );
}

/** A visible label for fixed illustrative figures that are not the user's data. */
export function SampleDataBadge({ note = "Illustrative sample figures — not live or client data" }: { note?: string }) {
  return (
    <span data-testid="sample-data-badge" className="inline-block rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
      {note}
    </span>
  );
}

export default NotAvailable;
