import { AlertTriangle, Info } from "lucide-react";

interface GuaranteedMinimumFootnoteProps {
  /** Whether the table shows cash values */
  showsCashValues?: boolean;
  /** Whether the table shows surrender values */
  showsSurrenderValues?: boolean;
  /** Whether the table shows death benefit */
  showsDeathBenefit?: boolean;
  /** Whether the table shows loan projections */
  showsLoanProjections?: boolean;
  /** Compact mode for smaller tables */
  compact?: boolean;
}

/**
 * AG 49 Compliant Guaranteed Minimum Footnote
 * 
 * NAIC AG 49-A/B requires that all IUL illustrations clearly distinguish
 * between guaranteed and non-guaranteed (illustrated) values. This component
 * provides a standardized footnote for projection tables.
 */
export function GuaranteedMinimumFootnote({
  showsCashValues = true,
  showsSurrenderValues = false,
  showsDeathBenefit = false,
  showsLoanProjections = false,
  compact = false,
}: GuaranteedMinimumFootnoteProps) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/80 mt-2">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400/70" />
        <span>
          <strong className="text-amber-300/90">Non-Guaranteed Illustration.</strong>{" "}
          Values shown assume the current illustrated crediting rate (AG 49 max 7.50%) and are{" "}
          <em>not guaranteed</em>. Guaranteed minimum crediting rate is 0–2% depending on carrier.
          Actual results may be higher or lower.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mt-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-400" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-amber-300">
            Non-Guaranteed Illustration — AG 49 Disclosure
          </p>
          <div className="text-amber-200/80 space-y-1.5">
            <p>
              All values shown in this projection table are <strong className="text-amber-300">non-guaranteed illustrated values</strong> based
              on the current AG 49 maximum illustrated crediting rate of <strong className="text-amber-300">7.50%</strong>.
              Actual credited rates will vary based on index performance and are subject to caps, floors, and participation rates.
            </p>
            <p>
              <strong className="text-amber-300">Guaranteed minimum crediting rate:</strong> 0%–2% (varies by carrier and crediting strategy).
              Under the guaranteed scenario, {showsCashValues && "cash values"}{showsSurrenderValues && ", surrender values"}{showsDeathBenefit && ", and death benefits"} may be
              significantly lower than illustrated.
            </p>
            {showsLoanProjections && (
              <p>
                <strong className="text-amber-300">Policy loan assumptions:</strong> Stated loan rate of 5.00% with
                a net arbitrage spread of 0.50%. Actual loan rates and arbitrage may vary by carrier and are not guaranteed.
              </p>
            )}
            <p className="text-amber-200/60 text-xs italic">
              This illustration complies with NAIC Actuarial Guideline 49-A/B. Consult your carrier's
              formal illustration for guaranteed and non-guaranteed ledger values side by side.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
