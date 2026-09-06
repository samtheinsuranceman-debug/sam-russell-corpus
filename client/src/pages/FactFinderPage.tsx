// ============================================================
// FACT FINDER — the discovery intake that feeds the Ultra
// Calculator and the every-page AI advisor. Answers persist in
// this browser only (localStorage) and become the advisor's
// profile context. Speak any answer with the 🎙 button.
// ============================================================
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ULTRA_PROFILE_KEY } from "@/components/VoiceAdvisor";
import PageBackdrop from "@/components/PageBackdrop";

const QUESTIONS: Array<{ id: string; q: string; hint?: string }> = [
  { id: "background", q: "Tell us your background — family, work, how you got to where you are financially." },
  { id: "assets", q: "Walk through everything you own: accounts, balances, real estate, businesses — and what's taxable vs. tax-advantaged." },
  { id: "income", q: "Your income, your spouse's income, and every other household income source — itemized." },
  { id: "expenses", q: "Your base household expenses per year — and is that likely to change in the next 5, 10, or 20 years? How?" },
  { id: "debt", q: "The full debt picture: mortgages, student loans, long-term loans — balances, rates, payments." },
  { id: "goals", q: "What are your goals — in 5-year and 10-year windows if you can? What does 'made it' look like?" },
  { id: "advisorFailures", q: "What have your money advisors failed to do for you in the past?" },
  { id: "moreMoney", q: "If you had two to three times more money and just three more years, what would you do? How would your goals change from what they are now?" },
  { id: "protection", q: "How important are divorce protection, creditor protection, and tax-free future income to you — and why?" },
  { id: "health", q: "Any health or family considerations (chronic illness risk, caregiving, special needs) the plan must survive?" },
];

export default function FactFinderPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ULTRA_PROFILE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { factFinder?: Record<string, string>; savedAt?: number };
        if (data.factFinder) setAnswers(data.factFinder);
        if (data.savedAt) setSavedAt(data.savedAt);
      }
    } catch { /* fresh start */ }
  }, []);

  const save = () => {
    const summary = QUESTIONS
      .filter((q) => answers[q.id]?.trim())
      .map((q) => `${q.q}\n→ ${answers[q.id].trim()}`)
      .join("\n\n");
    try {
      const raw = localStorage.getItem(ULTRA_PROFILE_KEY);
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem(ULTRA_PROFILE_KEY, JSON.stringify({
        ...prev,
        summary: [prev.summary, summary].filter(Boolean).join("\n\n— Fact Finder —\n"),
        factFinder: answers,
        savedAt: Date.now(),
      }));
      setSavedAt(Date.now());
    } catch { /* private mode */ }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <PageBackdrop src="/rcs-city-emerald.webp" phoneSrc="/rcs-city-spire.webp" alt="Emerald-lit city skyline at dawn with a river winding through it" fade="#020617" position="center 30%" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-amber-500">Russell Capital Systems</p>
        <h1 className="mt-1 text-3xl font-bold">Fact Finder</h1>
        <p className="mt-2 text-sm text-slate-400">
          Answer in your own words — type, or use the 🎙 advisor button (bottom-right) to dictate and paste.
          Your answers stay in this browser and become the profile the AI advisor and the{" "}
          <Link href="/ultra-calculator" className="text-amber-400 underline">Ultra Calculator</Link> personalize from.
        </p>

        <div className="mt-8 space-y-6">
          {QUESTIONS.map((q, i) => (
            <label key={q.id} className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-sm font-semibold text-slate-200">{i + 1}. {q.q}</span>
              {q.hint && <span className="block text-xs text-slate-500">{q.hint}</span>}
              <textarea
                rows={3}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          ))}
        </div>

        <button onClick={save}
          className="mt-6 w-full rounded-xl bg-amber-500 px-4 py-3 text-lg font-bold text-slate-900 hover:bg-amber-400">
          Save my profile for the AI advisor
        </button>
        {savedAt && (
          <p className="mt-2 text-center text-xs text-emerald-400">
            Saved {new Date(savedAt).toLocaleString()} — the advisor on every page now knows this profile.
          </p>
        )}
        <p className="mt-4 text-center text-[11px] text-slate-600">
          Stored only in this browser. Nothing is uploaded until you ask the advisor a question, and then only
          as the text context for that question. Educational planning only — not tax, legal, or investment advice.
        </p>
      </div>
    </div>
  );
}
