import { useState, useMemo } from "react";
import { ResultReveal } from "@/components/ResultReveal";
import { useSharedField } from "@/context/FinancialDataContext";

/**
 * Live, self-contained proof of ResultReveal + the shared data layer.
 * Route it at /portal/reveal-demo. Change inputs → result re-animates + chimes.
 * The income/age fields use the SHARED store, so they pre-fill from other tools.
 */
export default function ResultRevealDemo() {
  const [income, setIncome] = useSharedField<number>("annualIncome", 250000);
  const [age, setAge] = useSharedField<number>("currentAge", 45);
  const [muted, setMuted] = useState(false);
  const [run, setRun] = useState(0); // bump to replay the animation

  const result = useMemo(() => {
    const years = Math.max(1, 65 - age);
    // illustrative tax-free advantage figure
    return income * 0.12 * years;
  }, [income, age, run]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-2xl font-semibold text-amber-400">Result Reveal — live demo</h1>
      <p className="mt-1 text-sm text-slate-400">
        Inputs use the shared store (they pre-fill from other tabs). Change a value
        or press Recalculate to see the count-up, pulse, and cha-ching.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <label className="text-sm">
          Annual income
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="mt-1 block rounded-md bg-slate-800 px-3 py-2 text-sm outline-none"
          />
        </label>
        <label className="text-sm">
          Current age
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="mt-1 block rounded-md bg-slate-800 px-3 py-2 text-sm outline-none"
          />
        </label>
      </div>

      <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <ResultReveal
          value={result}
          prefix="$"
          decimals={0}
          label="Projected tax-free advantage"
          muted={muted}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setRun((r) => r + 1)}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950"
        >
          Recalculate
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm"
        >
          {muted ? "Unmute" : "Mute"} sound
        </button>
      </div>
    </div>
  );
}
