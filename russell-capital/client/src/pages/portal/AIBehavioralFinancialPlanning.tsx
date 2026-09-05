// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSharedField } from "@/context/FinancialDataContext";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend, Tooltip, ResponsiveContainer,
} from "recharts";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { DollarSign, Brain, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { useReportToHub } from "@/contexts/UnifiedDataBusContext";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { ComboPageWrapper } from "@/components/ComboPageWrapper";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { PageInsights } from "@/components/PageInsights";

interface Bias {
  name: string; score: number; cost: number; description: string; debiasingStrategy: string;
}
interface FinancialPath {
  year: number; biasedValue: number; debiasedValue: number; taxImpact: number;
}

const AIBehavioralFinancialPlanning: React.FC = () => {
  // S1: Pull real client data
  const { data: client } = useClientData();
  const { results, getFinancialHealthScore } = useCalcResults();
  const { getRecommendations, getCrossToolSuggestions } = useAIBrain();
  const reportToHub = useReportToHub("combo-behavioral-planning", "AIBehavioralFinancialPlanning", "ai-pro-suite", "/portal/behavioral-planning");

  // S1: Derive defaults from client data
  const clientIncome = client?.annualIncome || 100000;
  const clientTaxBracket = client?.annualIncome
    ? client.annualIncome > 523600 ? 37 : client.annualIncome > 209425 ? 35 : client.annualIncome > 164925 ? 32 : client.annualIncome > 86375 ? 24 : client.annualIncome > 40525 ? 22 : 12
    : 24;
  const clientRisk = client?.riskTolerance || 5;

  const [userProfile, setUserProfile] = useState({
    annualIncome: clientIncome,
    savingsRate: 15,
    investmentReturn: 6,
    taxBracket: clientTaxBracket,
    biases: [
      { name: "Loss Aversion", score: clientRisk > 7 ? 3 : 7, cost: 5000, description: "Fear of losses over gains", debiasingStrategy: "Focus on long-term gains" },
      { name: "Anchoring", score: 6, cost: 3000, description: "Over-reliance on initial information", debiasingStrategy: "Seek diverse data points" },
      { name: "Recency Bias", score: 5, cost: 2000, description: "Overweight recent events", debiasingStrategy: "Review historical trends" },
      { name: "Confirmation Bias", score: 8, cost: 7000, description: "Seeking confirming information", debiasingStrategy: "Challenge assumptions" },
      { name: "Herd Mentality", score: clientRisk > 6 ? 3 : 4, cost: 1500, description: "Following the crowd", debiasingStrategy: "Independent analysis" },
    ] as Bias[],
  });

  // S1: Update from client data when it loads
  useEffect(() => {
    if (client) {
      setUserProfile((prev) => ({
        ...prev,
        annualIncome: client.annualIncome || prev.annualIncome,
        taxBracket: clientTaxBracket,
      }));
    }
  }, [client?.annualIncome]); // eslint-disable-line react-hooks/exhaustive-deps

  const [projectionYears, setProjectionYears] = useSharedField("projectionYears", 50);
  const [biasTrainingActive, setBiasTrainingActive] = useState(false);
  const [selectedBias, setSelectedBias] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // S3: AI Brain recommendations
  const aiRecs = useMemo(() => getRecommendations("behavioral-planning"), [getRecommendations]);
  // S4: Health score from calculators
  const healthScore = useMemo(() => getFinancialHealthScore(), [getFinancialHealthScore]);

  const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
  const totalBiasCost = useCallback((biases: Bias[]) => biases.reduce((sum, b) => sum + b.cost, 0), []);

  const financialPaths = useMemo(() => {
    const paths: FinancialPath[] = [];
    let biased = userProfile.annualIncome * (userProfile.savingsRate / 100);
    let debiased = biased;
    for (let year = 1; year <= projectionYears; year++) {
      biased += biased * (userProfile.investmentReturn / 100) * 0.8 - totalBiasCost(userProfile.biases);
      debiased += debiased * (userProfile.investmentReturn / 100);
      paths.push({
        year,
        biasedValue: Math.round(Math.max(0, biased)),
        debiasedValue: Math.round(debiased),
        taxImpact: Math.round((debiased - biased) * (userProfile.taxBracket / 100)),
      });
    }
    return paths;
  }, [userProfile, projectionYears, totalBiasCost]);

  const handleProfileChange = useCallback((field: string, value: number) => {
    setUserProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCalculateOutcome = useCallback(() => {
    setIsCalculating(true);
    setTimeout(() => {
      const updated = userProfile.biases.map((b) => ({
        ...b, cost: Math.round(b.score * userProfile.annualIncome * 0.005),
      }));
      setUserProfile((prev) => ({ ...prev, biases: updated }));
      reportToHub({ type: "BehavioralPlanning", biasCount: updated.length, projectionYears, totalImpact: financialPaths[financialPaths.length - 1]?.debiasedValue || 0 });
      setIsCalculating(false);
    }, 1000);
  }, [userProfile.biases, projectionYears, financialPaths, reportToHub]);

  const radarData = useMemo(() => userProfile.biases.map((b) => ({ subject: b.name, A: b.score, fullMark: 10 })), [userProfile.biases]);
  const totalImpact = useMemo(() => {
    const last = financialPaths[financialPaths.length - 1];
    return last ? last.debiasedValue - last.biasedValue : 0;
  }, [financialPaths]);

  useEffect(() => {
    if (biasTrainingActive) {
      const interval = setInterval(() => {
        setUserProfile((prev) => ({
          ...prev,
          biases: prev.biases.map((b) => ({
            ...b, score: Math.max(0, b.score - 0.1),
            cost: Math.round(Math.max(0, b.score - 0.1) * prev.annualIncome * 0.005),
          })),
        }));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [biasTrainingActive]);

  return (
    <ComboPageWrapper
      title="AI Behavioral Financial Planning"
      featureId="combo-behavioral-planning"
      featureName="AI Behavioral Financial Planning"
      category="ai-pro-suite"
      pageContext="behavioral-planning"
      route="/portal/behavioral-planning"
    >
      <div className="text-white space-y-6">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-indigo-400" />
            AI Behavioral Financial Planning
          </h1>
          <div className="text-right">
            <p className="text-[#7a95b8] text-sm">Patent: PAT-003 + PAT-008 + SI-003 | IRS §72, §163</p>
            {client && <p className="text-emerald-400 text-xs mt-1">Client: {client.clientName} | Health: {healthScore.overall}/100</p>}
          </div>
        </motion.div>

        {/* S3: AI Recommendations Banner */}
        {aiRecs.length > 0 && (
          <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4">
            <h3 className="text-sm font-bold text-indigo-400 mb-2">AI Brain Insights</h3>
            <div className="space-y-1">
              {aiRecs.slice(0, 3).map((rec) => (
                <div key={rec.id} className="text-xs text-white/60 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${rec.priority === 'critical' ? 'bg-red-500' : rec.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <span className="font-medium text-white/80">{rec.title}:</span> {rec.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Profile — S1: seeded from client data */}
        <motion.div variants={fadeIn} className="bg-[#0d1526]/50 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            Financial Profile
            {client && <span className="text-xs text-emerald-400/60 ml-2">(Pre-filled from {client.clientName})</span>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-[#7a95b8] mb-1">Annual Income</label>
              <input type="number" value={userProfile.annualIncome} onChange={(e) => handleProfileChange("annualIncome", Number(e.target.value))} className="w-full bg-gray-700 rounded-md p-2 text-white" min="10000" max="1000000" />
            </div>
            <div>
              <label className="block text-sm text-[#7a95b8] mb-1">Savings Rate (%)</label>
              <Slider value={[userProfile.savingsRate]} onValueChange={(v) => handleProfileChange("savingsRate", v[0])} min={0} max={50} step={1} className="mt-2" />
              <span className="text-sm text-[#7a95b8]">{userProfile.savingsRate}%</span>
            </div>
            <div>
              <label className="block text-sm text-[#7a95b8] mb-1">Investment Return (%)</label>
              <Slider value={[userProfile.investmentReturn]} onValueChange={(v) => handleProfileChange("investmentReturn", v[0])} min={0} max={15} step={0.1} className="mt-2" />
              <span className="text-sm text-[#7a95b8]">{userProfile.investmentReturn}%</span>
            </div>
            <div>
              <label className="block text-sm text-[#7a95b8] mb-1">Tax Bracket (%)</label>
              <Slider value={[userProfile.taxBracket]} onValueChange={(v) => handleProfileChange("taxBracket", v[0])} min={10} max={37} step={1} className="mt-2" />
              <span className="text-sm text-[#7a95b8]">{userProfile.taxBracket}%</span>
            </div>
          </div>
        </motion.div>

        {/* Bias Radar + Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={fadeIn} className="bg-[#0d1526]/50 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Cognitive Bias Radar
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#444" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#ccc", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#888" }} />
                <Radar name="Bias Score" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: "#333", border: "none" }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div variants={fadeIn} className="bg-[#0d1526]/50 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
            <h2 className="text-xl font-semibold mb-4">Bias Cost Calculator</h2>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {userProfile.biases.map((bias) => (
                <button key={bias.name} onClick={() => setSelectedBias(bias.name === selectedBias ? null : bias.name)} className={`w-full text-left p-3 rounded-lg transition-all ${selectedBias === bias.name ? "bg-indigo-600/30 border border-indigo-500/50" : "bg-gray-700/50 hover:bg-[#162a4a]"}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{bias.name}</span>
                    <span className="text-red-400 text-xs font-bold">-${bias.cost.toLocaleString()}/yr</span>
                  </div>
                  {selectedBias === bias.name && (
                    <div className="mt-2 text-xs text-[#7a95b8]">
                      <p>{bias.description}</p>
                      <p className="text-emerald-400 mt-1">Strategy: {bias.debiasingStrategy}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-[#1e3a5f] pt-2 mt-3">
              <span>Total Annual Bias Cost:</span>
              <span className="text-red-400">${totalBiasCost(userProfile.biases).toLocaleString()}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleCalculateOutcome} disabled={isCalculating} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {isCalculating ? "Analyzing..." : "Generate Outcome"}
              </Button>
              <Toggle pressed={biasTrainingActive} onPressedChange={setBiasTrainingActive} className="data-[state=on]:bg-green-600">
                {biasTrainingActive ? "Training ON" : "Train"}
              </Toggle>
            </div>
          </motion.div>
      <PageInsights section="a-i-behavioral-financial-planning" />
        </div>

        {/* 50-Year Projection */}
        <motion.div variants={fadeIn} className="bg-[#0d1526]/50 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            {projectionYears}-Year Wealth Projection
          </h2>
          <div className="flex gap-4 mb-4">
            <Slider value={[projectionYears]} onValueChange={(v) => setProjectionYears(v[0])} min={5} max={50} step={5} className="max-w-xs" />
            <span className="text-sm text-[#7a95b8]">{projectionYears} years</span>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={financialPaths}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="year" stroke="#fff" />
              <YAxis stroke="#fff" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ backgroundColor: "#333", border: "none" }} />
              <Legend />
              <Area type="monotone" dataKey="biasedValue" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Biased Path" />
              <Area type="monotone" dataKey="debiasedValue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Debiased Path" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-lg font-bold">
              <span>Total Financial Impact: </span>
              <motion.span key={totalImpact} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400">+${totalImpact.toLocaleString()}</motion.span>
            </div>
            <p className="text-[#7a95b8] text-sm">Tax impact per IRS §72</p>
          </div>
        </motion.div>

        {/* Tax Impact Chart */}
        <motion.div variants={fadeIn} className="bg-[#0d1526]/50 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-purple-400" />
            Tax Impact of Behavioral Optimization
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialPaths}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="year" stroke="#fff" />
              <YAxis stroke="#fff" tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ backgroundColor: "#333", border: "none" }} />
              <Legend />
              <Bar dataKey="taxImpact" fill="#c084fc" name="Tax Savings from Debiasing" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gamified Bias Training */}
        <motion.div variants={fadeIn} className="bg-[#0d1526]/50 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-orange-400" />
            Gamified Bias Awareness Training
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {userProfile.biases.map((bias) => (
              <div key={bias.name} className="p-4 bg-gray-700/50 rounded-md text-center">
                <h3 className="text-md font-medium mb-2">{bias.name}</h3>
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <div className="bg-orange-400 h-2.5 rounded-full" style={{ width: `${100 - bias.score * 10}%` }} />
                </div>
                <p className="text-sm text-[#7a95b8] mt-1">Progress: {Math.round(100 - bias.score * 10)}%</p>
              </div>
            ))}
          </div>
          <p className="text-[#7a95b8] text-sm mt-4">
            {biasTrainingActive ? "Training active: Behavioral nudges and Pavlovian conditioning in progress." : "Activate training to reinforce positive financial behaviors."}
          </p>
        </motion.div>

        {/* S4: Cross-Tool Related Features */}
        <motion.div variants={fadeIn} className="bg-[#0d1526]/50 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-[#1e3a5f]">
          <h2 className="text-2xl font-semibold mb-4">Related Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Retirement Calculator", desc: "Plan for retirement with bias-adjusted projections.", route: "/portal/calculators/retirement-income" },
              { title: "Tax Optimization Tool", desc: "Optimize tax strategies with debiased inputs (IRS §163).", route: "/portal/calculators/tax-combo" },
              { title: "Financial DNA Profiler", desc: "Discover your financial personality and bias tendencies.", route: "/portal/financial-dna" },
            ].map((item) => (
              <div key={item.title} className="p-4 bg-gray-700/50 rounded-md">
                <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                <p className="text-[#7a95b8] text-sm">{item.desc}</p>
                <Link href={item.route}>
                  <Button variant="outline" className="mt-2 text-indigo-400 border-indigo-400 hover:bg-indigo-400 hover:text-white">Explore</Button>
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </ComboPageWrapper>
  );
};
export default AIBehavioralFinancialPlanning;
