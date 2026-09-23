// ============================================================
// The Wealth Genome map, as written at the close of the intake: tendencies
// on four axes, the durability words, approximate money bands, and what the
// map did not observe. Shown to the household (intake close, Wealth Genome
// page) and to the advisor as context. It is never the basis of a
// recommendation, never a diagnosis, and never quotes an answer.
// ============================================================
import {
  AXES,
  TENDENCY_NOTE,
  bandLabel,
  durabilityWord,
  type AxisReading,
  type GenomeMap,
} from "@shared/genomeIntake";

const LEAN_WORD: Record<AxisReading["lean"], string> = {
  control: "leans to control", drift: "leans to drift", solo: "leans solo", shared: "leans shared",
  freeze: "leans to freeze", act: "leans to act", excite: "leans to excite", lock: "leans to lock",
  mixed: "in the middle", unknown: "unknown",
};
const W2_WORD = { w2: "W-2", not_w2: "Not W-2", both: "Some of each" } as const;
const DURABILITY_LABEL = { emotional: "Through a drawdown", income: "Funding through a lean year", cognitive: "Holding a complex decision", relational: "With the people in the decision" } as const;

export default function GenomeMapPanel({
  map,
  reflections,
  variant = "dark",
}: {
  map: GenomeMap;
  reflections?: { mind: string | null; money: string | null };
  variant?: "dark" | "cream";
}) {
  const cream = variant === "cream";
  const card = cream ? "rounded-xl border border-[#1C1A17]/15 bg-white/60 p-4" : "rounded-xl border border-white/10 bg-[#0b0f1a] p-4";
  const label = cream ? "text-[11px] uppercase tracking-[0.18em] text-[#1C1A17]/60" : "text-[11px] uppercase tracking-[0.18em] text-slate-400";
  const strong = cream ? "text-[#1C1A17]" : "text-white";
  const soft = cream ? "text-[#1C1A17]/70" : "text-slate-400";
  const m = map.money;
  return (
    <div className="space-y-4" data-testid="genome-map">
      <p className={`text-sm ${soft}`}>{TENDENCY_NOTE}</p>
      {(reflections?.mind || reflections?.money) && (
        <div className={card}>
          {reflections.mind && <p className={`text-sm ${strong}`}>{reflections.mind}</p>}
          {reflections.money && <p className={`mt-2 text-sm ${strong}`}>{reflections.money}</p>}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className={label}>Mind — tendencies ({map.limbs.mind})</p>
          <ul className="mt-2 space-y-1">
            {map.axes.map((a) => (
              <li key={a.axis} className={`flex justify-between gap-3 text-sm ${strong}`}>
                <span>{AXES[a.axis].label}</span><span className={soft}>{LEAN_WORD[a.lean]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={card}>
          <p className={label}>Money — approximate ({map.limbs.money})</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className={`flex justify-between gap-3 ${strong}`}><span>Income</span><span className={soft}>{bandLabel("income", m.incomeBand) ?? "unknown"}</span></li>
            <li className={`flex justify-between gap-3 ${strong}`}><span>Expenses</span><span className={soft}>{bandLabel("expenses", m.expenseBand) ?? "unknown"}</span></li>
            <li className={`flex justify-between gap-3 ${strong}`}><span>W-2</span><span className={soft}>{m.w2 ? W2_WORD[m.w2] : "unknown"}</span></li>
            <li className={`flex justify-between gap-3 ${strong}`}><span>Taxes last year</span><span className={soft}>{bandLabel("taxes", m.taxBand) ?? "unknown"}</span></li>
          </ul>
        </div>
        <div className={`${card} sm:col-span-2`}>
          <p className={label}>Durability — how a plan tends to hold</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {(Object.keys(DURABILITY_LABEL) as Array<keyof typeof DURABILITY_LABEL>).map((k) => (
              <li key={k} className={`flex justify-between gap-3 text-sm ${strong}`}>
                <span>{DURABILITY_LABEL[k]}</span><span className={soft}>{durabilityWord(map.durability[k])}</span>
              </li>
            ))}
          </ul>
          <p className={`mt-2 text-xs ${soft}`}>Read from what you chose, which is weaker evidence than what anyone has done. Not observed: {map.notObserved.join("; ")}.</p>
        </div>
      </div>
    </div>
  );
}
