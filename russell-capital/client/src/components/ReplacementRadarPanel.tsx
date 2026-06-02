import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, Eye, Shield, TrendingUp,
  Sun, ArrowRight, FileText, ChevronDown, ChevronUp,
  Zap, DollarSign, BarChart3, Target,
} from "lucide-react";
import {
  scoreReplacementOpportunity,
  type ExistingContract,
  type ReplacementResult,
  type Verdict,
  type ReplacementCandidate,
} from "@shared/replacementScoring";
import { ALL_ANNUITY_PRODUCTS, type StateCode } from "@shared/annuityData";

/* ─── Traffic Light Colors ─── */
const VERDICT_CONFIG: Record<Verdict, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  REPLACE_NOW:      { color: "text-red-400",    bg: "bg-red-500/15",    border: "border-red-500/40",    icon: <AlertTriangle className="w-5 h-5" />, label: "Replace Now" },
  STRONG_CANDIDATE: { color: "text-orange-400",  bg: "bg-orange-500/15",  border: "border-orange-500/40",  icon: <TrendingUp className="w-5 h-5" />,   label: "Strong Candidate" },
  MONITOR:          { color: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-500/40",   icon: <Eye className="w-5 h-5" />,          label: "Monitor" },
  LIKELY_KEEP:      { color: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/40",    icon: <Shield className="w-5 h-5" />,       label: "Likely Keep" },
  KEEP:             { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/40", icon: <CheckCircle2 className="w-5 h-5" />, label: "Keep" },
};

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

/* ─── Score Ring SVG ─── */
function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#ef4444" : score >= 60 ? "#f97316" : score >= 40 ? "#eab308" : "#22c55e";
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={4} className="text-white/10" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000 ease-out" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-current text-foreground font-bold" fontSize={size * 0.28}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}>{score}</text>
    </svg>
  );
}

/* ─── Factor Bar ─── */
function FactorBar({ label, points, maxPoints, explanation }: { label: string; points: number; maxPoints: number; explanation: string }) {
  const pct = Math.max(0, (points / maxPoints) * 100);
  const barColor = pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{points}/{maxPoints}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground/70">{explanation}</p>
    </div>
  );
}

/* ─── Candidate Card ─── */
function CandidateCard({ candidate, rank, isSolar }: { candidate: ReplacementCandidate; rank: number; isSolar?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const medalColors = ["text-amber-400", "text-gray-400", "text-orange-600"];
  return (
    <Card className={`border ${isSolar ? "border-amber-500/30 bg-amber-500/5" : "border-border/50"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-black ${medalColors[rank] ?? "text-muted-foreground"}`}>#{rank + 1}</span>
            <div>
              <p className="font-semibold text-sm">{candidate.product.carrier}</p>
              <p className="text-xs text-muted-foreground">{candidate.product.product}</p>
            </div>
          </div>
          <div className="text-right">
            {isSolar && candidate.solarUplift > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-1">
                <Sun className="w-3 h-3 mr-1" /> Solar +{fmt(candidate.solarUplift)}
              </Badge>
            )}
            <p className="text-lg font-bold text-emerald-400">+{fmt(candidate.monthlyIncomeImprovement)}/mo</p>
            <p className="text-[10px] text-muted-foreground">
              {isSolar ? "Tax-Free Income Uplift" : "Income Improvement"}
            </p>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border/30">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Bonus</p>
            <p className="text-sm font-semibold text-emerald-400">{fmtPct(candidate.product.premiumBonus ?? 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Rollup</p>
            <p className="text-sm font-semibold">{fmtPct(candidate.product.rollupRate ?? 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">AM Best</p>
            <p className="text-sm font-semibold">{candidate.product.amBest}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Breakeven</p>
            <p className="text-sm font-semibold">{candidate.breakevenMonths < 999 ? `${candidate.breakevenMonths}mo` : "N/A"}</p>
          </div>
        </div>

        {isSolar && candidate.combinedBonusTotal > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-xs">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-medium">Solar Strategy Bonus Stack</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>Solar ITC: +{fmt(candidate.solarUplift)}</span>
              <ArrowRight className="w-3 h-3" />
              <span>Annuity Bonus: +{fmt(candidate.bonusUplift)}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="text-amber-400 font-semibold">Combined: +{fmt(candidate.combinedBonusTotal)}</span>
            </div>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
          {expanded ? "Hide Details" : "View Details"}
        </Button>

        {expanded && (
          <div className="mt-2 space-y-2 text-xs text-muted-foreground border-t border-border/30 pt-2">
            <div className="flex items-start gap-2">
              <BarChart3 className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
              <span>Match Score: {candidate.matchScore}/100</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <span>Rating Change: {candidate.ratingChange}</span>
            </div>
            {candidate.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Panel ─── */
export function ReplacementRadarPanel() {
  // Contract input state
  const [accountValue, setAccountValue] = useState(250000);
  const [surrenderPenaltyPct, setSurrenderPenaltyPct] = useState(5);
  const [yearsInForce, setYearsInForce] = useState(4);
  const [surrenderPeriodYears, setSurrenderPeriodYears] = useState(10);
  const [currentMonthlyIncome, setCurrentMonthlyIncome] = useState(1200);
  const [carrierRating, setCarrierRating] = useState("A");
  const [carrierComdex, setCarrierComdex] = useState(70);
  const [rollupRate, setRollupRate] = useState(5);
  const [premiumBonusPct, setPremiumBonusPct] = useState(5);
  const [clientAge, setClientAge] = useState(62);
  const [accountType, setAccountType] = useState<ExistingContract["accountType"]>("ira");
  const [stateCode, setStateCode] = useState<StateCode>("TX");
  const [carrierName, setCarrierName] = useState("Current Carrier");
  const [productName, setProductName] = useState("Current Product");
  const [category, setCategory] = useState<"income" | "growth" | "myga">("income");

  const [result, setResult] = useState<ReplacementResult | null>(null);
  const [showForm, setShowForm] = useState(true);

  const productCount = useMemo(() => {
    return ALL_ANNUITY_PRODUCTS.filter(p => !p.excludedStates.includes(stateCode)).length;
  }, [stateCode]);

  const handleAnalyze = () => {
    const surrenderValue = accountValue * (1 - surrenderPenaltyPct / 100);
    const contract: ExistingContract = {
      accountValue,
      surrenderValue,
      yearsInForce,
      surrenderPeriodYears,
      surrenderPenaltyPct,
      currentMonthlyIncome,
      carrierRating,
      carrierComdex,
      rollupRate,
      premiumBonusPct,
      clientAge,
      accountType,
      carrierName,
      productName,
      category,
    };
    const scored = scoreReplacementOpportunity(contract, stateCode);
    setResult(scored);
    setShowForm(false);
    toast.success(`Replacement analysis complete — Score: ${scored.score}/100`);
  };

  const [generating1035, setGenerating1035] = useState(false);
  const handleGenerate1035 = async () => {
    if (!result) return;
    setGenerating1035(true);
    toast.info("Generating 1035 Exchange Analysis PDF...");
    try {
      const surrenderValue = accountValue * (1 - surrenderPenaltyPct / 100);
      const contract = {
        accountValue, surrenderValue, yearsInForce, surrenderPeriodYears, surrenderPenaltyPct,
        currentMonthlyIncome, carrierRating, carrierComdex, rollupRate, premiumBonusPct,
        clientAge, accountType, carrierName, productName, category,
      };
      const res = await fetch("/api/generate-1035-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract, stateCode }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `1035_Exchange_Analysis_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("1035 Exchange Analysis PDF downloaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate PDF");
    } finally {
      setGenerating1035(false);
    }
  };

  const verdictCfg = result ? VERDICT_CONFIG[result.verdict] : null;

  return (
    <div className="space-y-6">
      {/* Input Form */}
      {showForm && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Existing Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Account Value</Label>
                <Input type="number" value={accountValue} onChange={e => setAccountValue(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Surrender Penalty %</Label>
                <Input type="number" value={surrenderPenaltyPct} onChange={e => setSurrenderPenaltyPct(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Years In Force</Label>
                <Input type="number" value={yearsInForce} onChange={e => setYearsInForce(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Surrender Period (yrs)</Label>
                <Input type="number" value={surrenderPeriodYears} onChange={e => setSurrenderPeriodYears(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Current Monthly Income</Label>
                <Input type="number" value={currentMonthlyIncome} onChange={e => setCurrentMonthlyIncome(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Carrier AM Best</Label>
                <Select value={carrierRating} onValueChange={setCarrierRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["A++", "A+", "A", "A-", "B++", "B+", "B", "B-", "C++", "C+"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Carrier Comdex (0-100)</Label>
                <Input type="number" value={carrierComdex} onChange={e => setCarrierComdex(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Rollup Rate %</Label>
                <Input type="number" value={rollupRate} onChange={e => setRollupRate(Number(e.target.value))} step={0.1} />
              </div>
              <div>
                <Label className="text-xs">Premium Bonus %</Label>
                <Input type="number" value={premiumBonusPct} onChange={e => setPremiumBonusPct(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Client Age</Label>
                <Input type="number" value={clientAge} onChange={e => setClientAge(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Account Type</Label>
                <Select value={accountType} onValueChange={v => setAccountType(v as ExistingContract["accountType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ira">IRA</SelectItem>
                    <SelectItem value="401k">401(k)</SelectItem>
                    <SelectItem value="403b">403(b)</SelectItem>
                    <SelectItem value="tsp">TSP</SelectItem>
                    <SelectItem value="taxfree">Tax-Free (Roth)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input value={stateCode} onChange={e => setStateCode(e.target.value.toUpperCase() as StateCode)} maxLength={2} />
              </div>
              <div>
                <Label className="text-xs">Carrier Name</Label>
                <Input value={carrierName} onChange={e => setCarrierName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Product Name</Label>
                <Input value={productName} onChange={e => setProductName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Product Category</Label>
                <Select value={category} onValueChange={v => setCategory(v as "income" | "growth" | "myga")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="myga">MYGA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAnalyze} className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold">
                <Zap className="w-4 h-4 mr-2" /> Run Replacement Analysis
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                Analyzes {productCount} products available in {stateCode}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && verdictCfg && (
        <>
          {/* Verdict Header */}
          <Card className={`border-2 ${verdictCfg.border} ${verdictCfg.bg}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <ScoreRing score={result.score} size={90} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={verdictCfg.color}>{verdictCfg.icon}</span>
                      <h2 className={`text-2xl font-bold ${verdictCfg.color}`}>{result.verdictLabel}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">{result.summary}</p>
                    {result.solarEnhancedScore > result.score && (
                      <div className="flex items-center gap-2 mt-2">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-amber-400 font-medium">
                          Solar-Enhanced Score: {result.solarEnhancedScore}/100
                          <span className="text-xs ml-1 text-muted-foreground">(+{result.solarEnhancedScore - result.score} with Solar Strategy)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                    Edit Contract
                  </Button>
                  <Button size="sm" onClick={handleGenerate1035} disabled={generating1035} className="bg-emerald-600 hover:bg-emerald-700">
                    <FileText className="w-4 h-4 mr-1" /> {generating1035 ? "Generating..." : "Generate 1035 Analysis"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Factor Breakdown */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                7-Factor Scoring Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.factors.map((f, i) => (
                <FactorBar key={i} label={f.name} points={f.points} maxPoints={f.maxPoints} explanation={f.explanation} />
              ))}
            </CardContent>
          </Card>

          {/* Solar Strategy Pathway */}
          {result.solarPathway && result.solarPathway.eligible && (
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Solar Strategy Pathway — Tax-Free Lifetime Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "After Surrender", value: fmt(result.solarPathway.netAfterPenalties), sub: "Penalties paid" },
                    { label: "Solar ITC Bonus", value: `+${fmtPct(result.solarPathway.solarGrowthPct)}`, sub: fmt(result.solarPathway.solarBonusAmount), highlight: true },
                    { label: "Post-Solar Principal", value: fmt(result.solarPathway.principalAfterSolar), sub: "Enhanced base" },
                    { label: "Annuity Bonus", value: `+${fmtPct(result.solarPathway.annuityBonusPct)}`, sub: fmt(result.solarPathway.annuityBonusAmount) },
                    { label: "Tax-Free Income", value: `${fmt(result.solarPathway.monthlyTaxFreeIncome)}/mo`, sub: "Guaranteed for life", highlight: true },
                  ].map((step, i) => (
                    <div key={i} className={`p-3 rounded-lg text-center ${step.highlight ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/5"}`}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{step.label}</p>
                      <p className={`text-lg font-bold mt-1 ${step.highlight ? "text-amber-400" : ""}`}>{step.value}</p>
                      <p className="text-[10px] text-muted-foreground">{step.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Comparison: Current vs Solar */}
                <div className="mt-4 p-4 rounded-lg bg-black/20 border border-border/30">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Income Comparison</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400 font-medium">Current — Taxable & Unreliable</p>
                      <p className="text-2xl font-bold text-red-400 mt-1">{fmt(result.solarPathway.currentMonthlyTaxableIncome)}/mo</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Subject to future tax rate changes</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-emerald-400 font-medium">Solar Strategy — Tax-Free & Guaranteed</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(result.solarPathway.monthlyTaxFreeIncome)}/mo</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        +{fmtPct(result.solarPathway.pctIncomeImprovement)} more income, tax-free for life
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lifetime savings */}
                <div className="mt-3 flex items-center justify-between text-xs p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div>
                    <span className="text-muted-foreground">Estimated Lifetime Tax Savings:</span>
                    <span className="text-emerald-400 font-bold ml-2">{fmt(result.solarPathway.lifetimeTaxSavings)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Breakeven on Conversion Tax:</span>
                    <span className="text-amber-400 font-bold ml-2">{result.solarPathway.yearsToBreakeven.toFixed(1)} years</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inaction Risk */}
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Risk of Inaction</p>
                <p className="text-xs text-muted-foreground mt-1">{result.inactionRisk}</p>
              </div>
              <div className="ml-auto text-right shrink-0">
                <p className="text-xs text-muted-foreground">Advisor Revenue Opportunity</p>
                <p className="text-lg font-bold text-emerald-400">{fmt(result.estimatedAdvisorRevenue)}/yr</p>
              </div>
            </CardContent>
          </Card>

          {/* Top Replacement Candidates */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Top Replacement Candidates ({result.topCandidates.length} found)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {result.topCandidates.map((c, i) => (
                <CandidateCard
                  key={i}
                  candidate={c}
                  rank={i}
                  isSolar={!!result.solarPathway?.eligible}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
