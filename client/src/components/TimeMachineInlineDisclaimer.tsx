import { Info } from "lucide-react";

/**
 * Compact inline disclaimer for pages that show Time Machine overlay data.
 * Explains that TM values use a hypothetical pre-existing account at AG 49
 * compliant rates — not non-compliant illustrated rates.
 */
export function TimeMachineInlineDisclaimer() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/80 mt-3 mb-1">
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
      <div className="space-y-1">
        <p className="font-semibold text-amber-300 text-[11px]">
          Time Machine Method — AG 49 Compliance Notice
        </p>
        <p className="leading-relaxed">
          Time Machine (gold) values represent a <strong className="text-amber-300">hypothetical pre-existing account</strong> large
          enough that AG 49-compliant crediting rates (0%–7.5%) produce the same dollar interest credits as actual
          historical index returns. <strong className="text-amber-300">No non-compliant rates are illustrated.</strong>{" "}
          This is an educational tool — not a carrier illustration. Consult your carrier's formal illustration
          for guaranteed and non-guaranteed ledger values.
        </p>
      </div>
    </div>
  );
}
