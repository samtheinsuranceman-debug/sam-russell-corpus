/**
 * HypotheticalCaseBanner — shown at the top of every page that renders the
 * strategy library (client/src/data/strategies*.json, combos.json).
 *
 * The library holds about a hundred generated case narratives with named
 * families ("the Martinez Family…") and exact outcomes. None is a real client.
 * NAIC Model 570 §5.Q / 11 NCAC 12 .0427(k) and 16 CFR 255 require that an
 * invented case be labelled as hypothetical in the same place it appears, so
 * this banner sits above the cases rather than in a footer.
 */
import { Info } from "lucide-react";

export const HYPOTHETICAL_CASE_NOTE =
  "Hypothetical households. Every family name, profile and figure in this library is invented to illustrate how strategies fit together; none is a real client, and the results are neither typical nor guaranteed. Your results depend on your facts. Life insurance and annuities are issued by insurance companies; guarantees are subject to the issuing insurer's claims-paying ability. Not tax, legal or investment advice.";

export default function HypotheticalCaseBanner() {
  return (
    <div data-testid="hypothetical-case-banner" className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-100/80">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <p>{HYPOTHETICAL_CASE_NOTE}</p>
    </div>
  );
}
