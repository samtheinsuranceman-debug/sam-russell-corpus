import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Brain, User, Target, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

const COMBOS_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/k6Jb8r8EmU3emMqZxg5jdm/combos_9e44bb5c.json";

const PROFESSIONS = [
  "Physician / Surgeon", "Attorney", "Dentist", "Business Owner", "Real Estate Investor",
  "Tech Executive", "Financial Advisor", "Pharmacist", "Engineer", "Consultant",
  "Veterinarian", "Chiropractor", "Pilot", "Professional Athlete", "Entertainment Professional",
];

const STATES = [
  "California", "Texas", "Florida", "New York", "Illinois", "Pennsylvania", "Ohio",
  "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia", "Washington",
  "Arizona", "Massachusetts", "Tennessee", "Indiana", "Missouri", "Maryland", "Colorado",
];

const GOALS = [
  "Minimize taxes", "Maximize retirement income", "Estate planning", "Asset protection",
  "Wealth transfer", "Tax-free income", "Real estate optimization", "Business succession",
  "Charitable giving", "College funding",
];

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function ComboRecommender() {
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profession, setProfession] = useState("");
  const [age, setAge] = useState(45);
  const [state, setState] = useState("");
  const [netWorth, setNetWorth] = useState(5000000);
  const [annualIncome, setAnnualIncome] = useState(500000);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(1);

  const recommend = trpc.comboRecommend.useMutation();

  useEffect(() => {
    fetch(COMBOS_URL).then(r => r.json()).then(d => { setCombos(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function toggleGoal(g: string) {
    setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  async function runRecommendation() {
    if (!profession || !state || selectedGoals.length === 0) return;
    setAnalyzing(true);
    setStep(3);

    const scored = combos.map((c: any) => {
      let score = 0;
      const cp = c.clientProfile;
      if (cp.profession?.toLowerCase().includes(profession.toLowerCase().split(" ")[0])) score += 30;
      const nwRatio = Math.min(netWorth, cp.startingNetWorth) / Math.max(netWorth, cp.startingNetWorth);
      score += nwRatio * 25;
      if (cp.state === state) score += 15;
      score += Math.max(0, 15 - Math.abs(cp.age - age));
      const stratNames = c.steps?.map((s: any) => s.strategyName?.toLowerCase() || "").join(" ") || "";
      selectedGoals.forEach(g => { if (stratNames.includes(g.toLowerCase().split(" ")[0])) score += 5; });
      score += (c.netWorthMultiplier || 1) * 3;
      return { ...c, matchScore: Math.round(score) };
    });

    scored.sort((a: any, b: any) => b.matchScore - a.matchScore);
    const top5 = scored.slice(0, 5);
    setResults(top5);

    try {
      const res = await recommend.mutateAsync({
        profession, age, state, netWorth, annualIncome,
        goals: selectedGoals,
        topComboNames: top5.map((c: any) => c.comboName),
        topComboIds: top5.map((c: any) => c.id),
      });
      setAiAnalysis(String(res.analysis));
    } catch {
      setAiAnalysis("AI analysis unavailable. The recommendations above are based on algorithmic profile matching.");
    }
    setAnalyzing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="ml-3 text-gray-400">Loading combo data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
          <Brain className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">AI-Powered</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Combo Recommender</h1>
        <p className="text-gray-400 mt-2 max-w-xl mx-auto text-sm">
          Enter your client's profile and our AI will match them to the best Tax-Free Wealth Combos from our library of 100 elite strategies.
        </p>
      </div>

      {step >= 1 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" /> Client Profile
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Profession</label>
              <select value={profession} onChange={e => setProfession(e.target.value)}
                className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">Select profession...</option>
                {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">State</label>
              <select value={state} onChange={e => setState(e.target.value)}
                className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">Select state...</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Age: {age}</label>
              <input type="range" min={25} max={75} value={age} onChange={e => setAge(Number(e.target.value))}
                className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Net Worth: {formatMoney(netWorth)}</label>
              <input type="range" min={1000000} max={75000000} step={500000} value={netWorth}
                onChange={e => setNetWorth(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Annual Income: {formatMoney(annualIncome)}</label>
              <input type="range" min={100000} max={5000000} step={50000} value={annualIncome}
                onChange={e => setAnnualIncome(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {step >= 1 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" /> Client Goals
          </h2>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (
              <button key={g} onClick={() => toggleGoal(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedGoals.includes(g)
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"
                }`}>
                {g}
              </button>
            ))}
          </div>
          <button onClick={runRecommendation}
            disabled={!profession || !state || selectedGoals.length === 0 || analyzing}
            className="mt-4 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2">
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Find Best Combos</>}
          </button>
        </div>
      )}

      {step >= 3 && results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" /> Top 5 Recommended Combos
          </h2>
          {results.map((c: any, i: number) => (
            <Link key={c.id} href={`/portal/tax-combos/${c.id}`}
              className="block rounded-xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 p-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{c.comboName}</p>
                    <p className="text-gray-500 text-xs">{c.clientProfile?.profession} | {c.steps?.length} steps | Match: {c.matchScore}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center"><p className="text-emerald-400 font-bold">{formatMoney(c.finalNetWorth)}</p><p className="text-gray-500">Final NW</p></div>
                  <div className="text-center"><p className="text-yellow-400 font-bold">{formatMoney(c.totalTaxSaved)}</p><p className="text-gray-500">Tax Saved</p></div>
                  <div className="text-center"><p className="text-purple-400 font-bold">{c.netWorthMultiplier}x</p><p className="text-gray-500">Multiplier</p></div>
                  <ArrowRight className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </Link>
          ))}

          {aiAnalysis && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" /> AI Strategy Analysis
              </h3>
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div>
            </div>
          )}
        </div>
      )}

      {analyzing && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-gray-400 text-sm">AI is analyzing your client's profile against 100 combos...</p>
        </div>
      )}
    </div>
  );
}
