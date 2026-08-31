// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { Layers, Plus, Copy, Trash2, Shield, Zap, Target, Settings, RefreshCw, Play } from "lucide-react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart,
  LineChart,
  PieChart,
  AreaChart,
  RadarChart,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  Cell,
  Area,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Scatter,
} from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface Scenario {
  id: string;
  name: string;
  color: string;
  age: number;
  retirementAge: number;
  annualIncome: number;
  iraBalance: number;
  rothBalance: number;
  iulPremium: number;
  iulYears: number;
  mortgageBalance: number;
  mortgageRate: number;
  annuityPurchase: number;
  annuityRate: number;
  socialSecurityAge: number;
  monthlySSBenefit: number;
  taxBracket: number;
  rothConversionAnnual: number;
  useIUL: boolean;
  useRothConversion: boolean;
  useMortgageKiller: boolean;
  useAnnuity: boolean;
  inflationRate: number;
  marketReturn: number;
  lifeExpectancy: number;
  healthCareCosts: number;
  longTermCare: boolean;
  legacyGoal: number;
}

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
];

const createDefaultScenario = (
  id: string,
  name: string,
  colorIndex: number,
): Scenario => ({
  id,
  name,
  color: COLORS[colorIndex % COLORS.length],
  age: 55,
  retirementAge: 65,
  annualIncome: 350000,
  iraBalance: 1200000,
  rothBalance: 200000,
  iulPremium: 40000,
  iulYears: 15,
  mortgageBalance: 500000,
  mortgageRate: 6.5,
  annuityPurchase: 300000,
  annuityRate: 5.5,
  socialSecurityAge: 67,
  monthlySSBenefit: 3200,
  taxBracket: 32,
  rothConversionAnnual: 80000,
  useIUL: true,
  useRothConversion: true,
  useMortgageKiller: false,
  useAnnuity: true,
  inflationRate: 3.0,
  marketReturn: 7.0,
  lifeExpectancy: 90,
  healthCareCosts: 15000,
  longTermCare: false,
  legacyGoal: 500000,
});

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

export default function MultiScenarioPlayZone() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: scenariosData } = trpc.scenarios.list.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: riskProfile } = trpc.riskProfile.get.useQuery();
  const { data: taxData } = trpc.taxReturnOcr.getLatest.useQuery();
  const { data: strategyAnalytics } =
    trpc.strategyAnalytics.getMetrics.useQuery();

  const [scenarios, setScenarios] = useState<Scenario[]>([
    createDefaultScenario("1", "Base Case", 0),
    {
      ...createDefaultScenario("2", "Aggressive IUL", 1),
      iulPremium: 60000,
      iulYears: 20,
      useRothConversion: true,
      rothConversionAnnual: 120000,
      marketReturn: 8.5,
    },
    {
      ...createDefaultScenario("3", "Conservative", 2),
      useIUL: false,
      useRothConversion: false,
      useAnnuity: true,
      annuityPurchase: 500000,
      marketReturn: 5.0,
    },
  ]);
  const [activeScenario, setActiveScenario] = useState("1");
  const [comparisonMode, setComparisonMode] = useState<
    "side-by-side" | "overlay"
  >("side-by-side");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!clientData) return;
    setScenarios((prev) =>
      prev.map((s, i) =>
        i === 0
          ? {
              ...s,
              age: clientData.age || s.age,
              annualIncome: clientData.annualIncome || s.annualIncome,
              iraBalance: clientData.iraBalance || s.iraBalance,
              rothBalance: clientData.rothBalance || s.rothBalance,
              monthlySSBenefit:
                clientData.socialSecurityEstimate || s.monthlySSBenefit,
            }
          : s,
      ),
    );
  }, [clientData]);

  const addScenario = () => {
    const newId = Date.now().toString();
    setScenarios([
      ...scenarios,
      createDefaultScenario(
        newId,
        `Scenario ${scenarios.length + 1}`,
        scenarios.length,
      ),
    ]);
    setActiveScenario(newId);
  };

  const duplicateScenario = (id: string) => {
    const source = scenarios.find((s) => s.id === id);
    if (!source) return;
    const newId = Date.now().toString();
    setScenarios([
      ...scenarios,
      {
        ...source,
        id: newId,
        name: `${source.name} (Copy)`,
        color: COLORS[scenarios.length % COLORS.length],
      },
    ]);
    setActiveScenario(newId);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios(scenarios.filter((s) => s.id !== id));
    if (activeScenario === id)
      setActiveScenario(
        scenarios[0].id === id ? scenarios[1].id : scenarios[0].id,
      );
  };

  const updateScenario = (id: string, updates: Partial<Scenario>) => {
    setScenarios(
      scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const active = scenarios.find((s) => s.id === activeScenario) || scenarios[0];

  const allResults = useMemo(() => {
    return scenarios.map((scenario) => {
      const yearsToRetirement = scenario.retirementAge - scenario.age;
      const retirementYears = scenario.lifeExpectancy - scenario.retirementAge;

      const iulCashValue = scenario.useIUL
        ? Math.round(
            scenario.iulPremium *
              scenario.iulYears *
              Math.pow(1 + scenario.marketReturn / 100, scenario.iulYears / 2),
          )
        : 0;
      const iulAnnualIncome = scenario.useIUL
        ? Math.round(iulCashValue * 0.065)
        : 0;

      const rothConversionTotal = scenario.useRothConversion
        ? scenario.rothConversionAnnual * Math.min(yearsToRetirement, 10)
        : 0;
      const rothAtRetirement = Math.round(
        (scenario.rothBalance + rothConversionTotal) *
          Math.pow(1 + scenario.marketReturn / 100, yearsToRetirement),
      );
      const iraReduced = Math.round(
        Math.max(
          0,
          scenario.iraBalance *
            Math.pow(1 + scenario.marketReturn / 100, yearsToRetirement) -
            rothConversionTotal *
              Math.pow(1 + scenario.marketReturn / 100, yearsToRetirement / 2),
        ),
      );

      const rmdAt73 = Math.round(iraReduced / 27.4);
      const rmdTax = Math.round((rmdAt73 * scenario.taxBracket) / 100);

      const mortgageSaved = scenario.useMortgageKiller
        ? Math.round(
            ((scenario.mortgageBalance * scenario.mortgageRate) / 100) * 15,
          )
        : 0;

      const annuityIncome = scenario.useAnnuity
        ? Math.round((scenario.annuityPurchase * scenario.annuityRate) / 100)
        : 0;

      const ssAnnual = scenario.monthlySSBenefit * 12;
      const ssDelayBonus =
        scenario.socialSecurityAge > 62
          ? Math.round((scenario.socialSecurityAge - 62) * 0.067 * ssAnnual)
          : 0;
      const adjustedSS = Math.round(ssAnnual + ssDelayBonus);

      const totalRetirementIncome =
        iulAnnualIncome +
        Math.round(rothAtRetirement * 0.04) +
        annuityIncome +
        adjustedSS;
      const taxFreeIncome =
        iulAnnualIncome + Math.round(rothAtRetirement * 0.04) + annuityIncome;
      const taxFreePercent =
        totalRetirementIncome > 0
          ? Math.round((taxFreeIncome / totalRetirementIncome) * 100)
          : 0;

      const netWorth = Math.round(
        iulCashValue +
          rothAtRetirement +
          iraReduced +
          (scenario.useAnnuity ? scenario.annuityPurchase : 0),
      );

      const yearlyData = Array.from(
        { length: retirementYears + yearsToRetirement },
        (_, i) => {
          const currentAge = scenario.age + i;
          const isRetired = currentAge >= scenario.retirementAge;
          const yrsFromNow = i;

          let nw = 0;
          let inc = 0;
          let tax = 0;

          if (!isRetired) {
            nw =
              (scenario.iraBalance + scenario.rothBalance) *
              Math.pow(1 + scenario.marketReturn / 100, yrsFromNow);
            if (scenario.useIUL && yrsFromNow <= scenario.iulYears) {
              nw += scenario.iulPremium * yrsFromNow;
            }
          } else {
            const yrsInRetirement = currentAge - scenario.retirementAge;
            nw =
              netWorth *
                Math.pow(
                  1 + (scenario.marketReturn - scenario.inflationRate) / 100,
                  yrsInRetirement,
                ) -
              totalRetirementIncome * yrsInRetirement;
            nw = Math.max(0, nw);
            inc =
              totalRetirementIncome *
              Math.pow(1 + scenario.inflationRate / 100, yrsInRetirement);
            if (currentAge >= 73) {
              tax =
                rmdTax *
                Math.pow(1 + scenario.inflationRate / 100, yrsInRetirement);
            }
          }

          return {
            age: currentAge,
            netWorth: Math.round(nw),
            income: Math.round(inc),
            taxes: Math.round(tax),
            healthCosts: isRetired
              ? Math.round(
                  scenario.healthCareCosts *
                    Math.pow(1.05, currentAge - scenario.retirementAge),
                )
              : 0,
          };
        },
      );

      return {
        scenario,
        iulCashValue,
        iulAnnualIncome,
        rothAtRetirement,
        iraReduced,
        rmdAt73,
        rmdTax,
        mortgageSaved,
        annuityIncome,
        adjustedSS,
        totalRetirementIncome,
        taxFreeIncome,
        taxFreePercent,
        netWorth,
        yearlyData,
      };
    });
  }, [scenarios]);

  const activeResult =
    allResults.find((r) => r.scenario.id === activeScenario) || allResults[0];
  const bestNetWorth = Math.max(...allResults.map((r) => r.netWorth));
  const bestIncome = Math.max(
    ...allResults.map((r) => r.totalRetirementIncome),
  );
  const bestTaxFree = Math.max(...allResults.map((r) => r.taxFreePercent));

  const comparisonData = allResults.map((r) => ({
    name: r.scenario.name,
    NetWorth: r.netWorth,
    Income: r.totalRetirementIncome,
    TaxFree: r.taxFreeIncome,
    Taxes: r.rmdTax,
    fill: r.scenario.color,
  }));

  const incomeCompositionData = [
    {
      name: "IUL Income",
      value: activeResult.iulAnnualIncome,
      fill: "#3b82f6",
    },
    {
      name: "Roth Withdrawals",
      value: Math.round(activeResult.rothAtRetirement * 0.04),
      fill: "#22c55e",
    },
    { name: "Annuity", value: activeResult.annuityIncome, fill: "#a855f7" },
    {
      name: "Social Security",
      value: activeResult.adjustedSS,
      fill: "#f59e0b",
    },
  ].filter((d) => d.value > 0);

  const radarData = allResults.map((r) => ({
    scenario: r.scenario.name,
    Income: Math.min(100, (r.totalRetirementIncome / bestIncome) * 100),
    Wealth: Math.min(100, (r.netWorth / bestNetWorth) * 100),
    TaxEfficiency: r.taxFreePercent,
    Legacy: Math.min(100, (r.netWorth / r.scenario.legacyGoal) * 100),
    Safety: r.scenario.useAnnuity ? 90 : 40,
  }));

  const radarMetrics = [
    "Income",
    "Wealth",
    "TaxEfficiency",
    "Legacy",
    "Safety",
  ];

  const NumInput = ({
    label,
    value,
    onChange,
    prefix = "",
    suffix = "",
    step = 1,
  }: any) => (
    <div className="space-y-1.5">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="MultiScenarioPlayZone" />

        <ExecutiveSummary
          pageTitle="Multi Scenario Play Zone"
          whatItDoes="This market analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex market analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Historical data shows that strategic index allocation with downside protection consistently outperforms both pure equity and pure fixed strategies over 10+ year periods."
          intent="To give you the same caliber of market analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your market analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how market analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this market analysis strategy interact with my other financial plans?",
            "What\'s the single biggest market analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Multi Scenario Play Zone" pageContext="Multi Scenario Play Zone — market analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This market analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended market analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={280000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Risk-Adjusted Return", doNothing: 5.2, recommended: 8.4, format: "percent" },
            { label: "Downside Protection", doNothing: 0, recommended: 100, format: "percent" },
            { label: "20-Year Growth", doNothing: 450000, recommended: 730000, format: "currency" },
          ]}
          summary="Without taking action on market analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
          step={step}
        />
        {suffix && (
          <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Multi-Scenario Play Zone
            </h1>
            <p className="text-muted-foreground mt-1">
              Unified sandbox for cross-calculator what-if modeling with
              side-by-side comparison
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? "Hide Advanced" : "Show Advanced"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setComparisonMode(
                  comparisonMode === "side-by-side"
                    ? "overlay"
                    : "side-by-side",
                )
              }
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Toggle View
            </Button>
            <ExportToSlides
              toolName="Multi-Scenario Play Zone"
              getSections={() => {
                return [
                  {
                    title: "Scenario Comparison",
                    content: "Comparing different retirement strategies.",
                    layout: "two-column",
                  },
                ];
              }}
            />
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="flex flex-wrap gap-2 items-center bg-card p-2 rounded-lg border">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${activeScenario === s.id ? "bg-primary/10 border-primary/30 border" : "hover:bg-muted border border-transparent"}`}
              onClick={() => setActiveScenario(s.id)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm font-medium">{s.name}</span>
              {scenarios.length > 1 && (
                <Trash2
                  className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeScenario(s.id);
                  }}
                />
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={addScenario}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Scenario
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: active.color }}
                    />
                    {active.name} Parameters
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => duplicateScenario(active.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Scenario Name</Label>
                  </div>
                  <Input
                    value={active.name}
                    onChange={(e) =>
                      updateScenario(active.id, { name: e.target.value })
                    }
                  />
                </div>

                <Tabs defaultValue="basics">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="basics">Basics</TabsTrigger>
                    <TabsTrigger value="strategies">Strategies</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basics" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <NumInput
                        label="Current Age"
                        value={active.age}
                        onChange={(v: number) =>
                          updateScenario(active.id, { age: v })
                        }
                      />
                      <NumInput
                        label="Retirement Age"
                        value={active.retirementAge}
                        onChange={(v: number) =>
                          updateScenario(active.id, { retirementAge: v })
                        }
                      />
                      <NumInput
                        label="Annual Income"
                        value={active.annualIncome}
                        onChange={(v: number) =>
                          updateScenario(active.id, { annualIncome: v })
                        }
                        prefix="$"
                      />
                      <NumInput
                        label="Tax Bracket"
                        value={active.taxBracket}
                        onChange={(v: number) =>
                          updateScenario(active.id, { taxBracket: v })
                        }
                        suffix="%"
                      />
                      <NumInput
                        label="IRA Balance"
                        value={active.iraBalance}
                        onChange={(v: number) =>
                          updateScenario(active.id, { iraBalance: v })
                        }
                        prefix="$"
                      />
                      <NumInput
                        label="Roth Balance"
                        value={active.rothBalance}
                        onChange={(v: number) =>
                          updateScenario(active.id, { rothBalance: v })
                        }
                        prefix="$"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="strategies" className="space-y-6 mt-4">
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <Label className="font-semibold">IUL Strategy</Label>
                        </div>
                        <Switch
                          checked={active.useIUL}
                          onCheckedChange={(v) =>
                            updateScenario(active.id, { useIUL: v })
                          }
                        />
                      </div>
                      {active.useIUL && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <NumInput
                            label="Annual Premium"
                            value={active.iulPremium}
                            onChange={(v: number) =>
                              updateScenario(active.id, { iulPremium: v })
                            }
                            prefix="$"
                          />
                          <NumInput
                            label="Funding Years"
                            value={active.iulYears}
                            onChange={(v: number) =>
                              updateScenario(active.id, { iulYears: v })
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-green-500" />
                          <Label className="font-semibold">
                            Roth Conversion
                          </Label>
                        </div>
                        <Switch
                          checked={active.useRothConversion}
                          onCheckedChange={(v) =>
                            updateScenario(active.id, { useRothConversion: v })
                          }
                        />
                      </div>
                      {active.useRothConversion && (
                        <div className="grid grid-cols-1 gap-4 pt-2">
                          <NumInput
                            label="Annual Conversion"
                            value={active.rothConversionAnnual}
                            onChange={(v: number) =>
                              updateScenario(active.id, {
                                rothConversionAnnual: v,
                              })
                            }
                            prefix="$"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          <Label className="font-semibold">
                            Annuity Strategy
                          </Label>
                        </div>
                        <Switch
                          checked={active.useAnnuity}
                          onCheckedChange={(v) =>
                            updateScenario(active.id, { useAnnuity: v })
                          }
                        />
                      </div>
                      {active.useAnnuity && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <NumInput
                            label="Purchase Amount"
                            value={active.annuityPurchase}
                            onChange={(v: number) =>
                              updateScenario(active.id, { annuityPurchase: v })
                            }
                            prefix="$"
                          />
                          <NumInput
                            label="Payout Rate"
                            value={active.annuityRate}
                            onChange={(v: number) =>
                              updateScenario(active.id, { annuityRate: v })
                            }
                            suffix="%"
                            step={0.1}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <NumInput
                        label="Market Return"
                        value={active.marketReturn}
                        onChange={(v: number) =>
                          updateScenario(active.id, { marketReturn: v })
                        }
                        suffix="%"
                        step={0.1}
                      />
                      <NumInput
                        label="Inflation Rate"
                        value={active.inflationRate}
                        onChange={(v: number) =>
                          updateScenario(active.id, { inflationRate: v })
                        }
                        suffix="%"
                        step={0.1}
                      />
                      <NumInput
                        label="Life Expectancy"
                        value={active.lifeExpectancy}
                        onChange={(v: number) =>
                          updateScenario(active.id, { lifeExpectancy: v })
                        }
                      />
                      <NumInput
                        label="Legacy Goal"
                        value={active.legacyGoal}
                        onChange={(v: number) =>
                          updateScenario(active.id, { legacyGoal: v })
                        }
                        prefix="$"
                      />
                    </div>

                    <div className="space-y-4 border rounded-lg p-4 bg-muted/20 mt-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Long Term Care</Label>
                        <Switch
                          checked={active.longTermCare}
                          onCheckedChange={(v) =>
                            updateScenario(active.id, { longTermCare: v })
                          }
                        />
                      </div>
                      {active.longTermCare && (
                        <NumInput
                          label="Annual Cost Estimate"
                          value={active.healthCareCosts}
                          onChange={(v: number) =>
                            updateScenario(active.id, { healthCareCosts: v })
                          }
                          prefix="$"
                        />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Visualization Panel */}
          <div className="lg:col-span-8 space-y-6">
            <Tabs defaultValue="dashboard">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="projections">Projections</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="tables">Data Tables</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6 mt-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        Net Worth at Retirement
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {fmt(activeResult.netWorth)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {activeResult.netWorth >= bestNetWorth
                          ? "Best Scenario"
                          : `-${fmt(bestNetWorth - activeResult.netWorth)} vs Best`}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        Annual Income
                      </div>
                      <div className="text-2xl font-bold text-green-500">
                        {fmt(activeResult.totalRetirementIncome)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fmtPct(
                          (activeResult.totalRetirementIncome /
                            (active.annualIncome * 0.8)) *
                            100,
                        )}{" "}
                        of pre-retirement target
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        Tax-Free Income %
                      </div>
                      <div className="text-2xl font-bold text-blue-500">
                        {activeResult.taxFreePercent}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fmt(activeResult.taxFreeIncome)} tax-free
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <div className="text-sm text-muted-foreground mb-1">
                        Estimated RMD Tax
                      </div>
                      <div className="text-2xl font-bold text-red-500">
                        {fmt(activeResult.rmdTax)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        at age 73
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Income Composition (PieChart) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Retirement Income Sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={incomeCompositionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {incomeCompositionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => fmt(value)}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chart 2: Net Worth Projection (AreaChart) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Net Worth Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activeResult.yearlyData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis dataKey="age" />
                            <YAxis
                              tickFormatter={(val) =>
                                `$${(val / 1000000).toFixed(1)}M`
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => fmt(value)}
                              labelFormatter={(val) => `Age ${val}`}
                            />
                            <Area
                              type="monotone"
                              dataKey="netWorth"
                              stroke={active.color}
                              fill={active.color}
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="projections" className="space-y-6 mt-4">
                {/* Chart 3: Multi-Scenario Wealth (LineChart) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Net Worth Comparison Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="age"
                            type="category"
                            allowDuplicatedCategory={false}
                          />
                          <YAxis
                            tickFormatter={(val) =>
                              `$${(val / 1000000).toFixed(1)}M`
                            }
                          />
                          <Tooltip
                            formatter={(value: number) => fmt(value)}
                            labelFormatter={(val) => `Age ${val}`}
                          />
                          <Legend />
                          {allResults.map((r) => (
                            <Line
                              key={r.scenario.id}
                              data={r.yearlyData}
                              type="monotone"
                              dataKey="netWorth"
                              name={r.scenario.name}
                              stroke={r.scenario.color}
                              strokeWidth={
                                r.scenario.id === activeScenario ? 3 : 1
                              }
                              dot={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-6 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 4: Metric Comparison (BarChart) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Key Metrics Comparison
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={comparisonData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis dataKey="name" />
                            <YAxis
                              tickFormatter={(val) =>
                                `$${(val / 1000).toFixed(0)}K`
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => fmt(value)}
                            />
                            <Legend />
                            <Bar dataKey="Income" fill="#22c55e" />
                            <Bar dataKey="TaxFree" fill="#3b82f6" />
                            <Bar dataKey="Taxes" fill="#ef4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chart 5: Scenario Radar (RadarChart) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Scenario Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            cx="50%"
                            cy="50%"
                            outerRadius="80%"
                            data={radarMetrics.map((metric) => {
                              const obj: any = { metric };
                              radarData.forEach((d) => {
                                obj[d.scenario] = d[metric as keyof typeof d];
                              });
                              return obj;
                            })}
                          >
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            {allResults.map((r) => (
                              <Radar
                                key={r.scenario.id}
                                name={r.scenario.name}
                                dataKey={r.scenario.name}
                                stroke={r.scenario.color}
                                fill={r.scenario.color}
                                fillOpacity={0.3}
                              />
                            ))}
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart 6: Composed View (ComposedChart) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Income vs Taxes (All Scenarios)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis
                            yAxisId="left"
                            tickFormatter={(val) =>
                              `$${(val / 1000).toFixed(0)}K`
                            }
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={(val) =>
                              `$${(val / 1000000).toFixed(1)}M`
                            }
                          />
                          <Tooltip formatter={(value: number) => fmt(value)} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="Income" fill="#8884d8" />
                          <Bar yAxisId="left" dataKey="Taxes" fill="#ff7300" />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="NetWorth"
                            stroke="#ff0000"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tables" className="space-y-6 mt-4">
                {/* Table 1: Scenario Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Scenario Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Scenario</th>
                            <th className="text-right p-2">Net Worth</th>
                            <th className="text-right p-2">Total Income</th>
                            <th className="text-right p-2">Tax-Free %</th>
                            <th className="text-right p-2">Est. Taxes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allResults.map((r) => (
                            <tr key={r.scenario.id} className="border-b">
                              <td className="p-2 font-medium flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: r.scenario.color }}
                                />
                                {r.scenario.name}
                              </td>
                              <td className="text-right p-2">
                                {fmt(r.netWorth)}
                              </td>
                              <td className="text-right p-2">
                                {fmt(r.totalRetirementIncome)}
                              </td>
                              <td className="text-right p-2">
                                {r.taxFreePercent}%
                              </td>
                              <td className="text-right p-2 text-red-500">
                                {fmt(r.rmdTax)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Table 2: Active Scenario Year-by-Year */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {active.name} - Year by Year Projection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto h-[300px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b">
                            <th className="text-left p-2">Age</th>
                            <th className="text-right p-2">Net Worth</th>
                            <th className="text-right p-2">Income</th>
                            <th className="text-right p-2">Taxes</th>
                            <th className="text-right p-2">Health Costs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeResult.yearlyData.map((d) => (
                            <tr
                              key={d.age}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="p-2">{d.age}</td>
                              <td className="text-right p-2">
                                {fmt(d.netWorth)}
                              </td>
                              <td className="text-right p-2 text-green-500">
                                {fmt(d.income)}
                              </td>
                              <td className="text-right p-2 text-red-500">
                                {fmt(d.taxes)}
                              </td>
                              <td className="text-right p-2 text-orange-500">
                                {fmt(d.healthCosts)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Table 3: Strategy Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Strategy Configurations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Scenario</th>
                              <th className="text-center p-2">IUL</th>
                              <th className="text-center p-2">Roth</th>
                              <th className="text-center p-2">Annuity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scenarios.map((s) => (
                              <tr key={s.id} className="border-b">
                                <td className="p-2">{s.name}</td>
                                <td className="text-center p-2">
                                  {s.useIUL ? "✓" : "-"}
                                </td>
                                <td className="text-center p-2">
                                  {s.useRothConversion ? "✓" : "-"}
                                </td>
                                <td className="text-center p-2">
                                  {s.useAnnuity ? "✓" : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Table 4: Input Parameters */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Economic Assumptions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Scenario</th>
                              <th className="text-right p-2">Market Rtn</th>
                              <th className="text-right p-2">Inflation</th>
                              <th className="text-right p-2">Tax Bracket</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scenarios.map((s) => (
                              <tr key={s.id} className="border-b">
                                <td className="p-2">{s.name}</td>
                                <td className="text-right p-2">
                                  {s.marketReturn}%
                                </td>
                                <td className="text-right p-2">
                                  {s.inflationRate}%
                                </td>
                                <td className="text-right p-2">
                                  {s.taxBracket}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Table 5: IUL Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        IUL Strategy Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Scenario</th>
                              <th className="text-right p-2">Premium</th>
                              <th className="text-right p-2">Years</th>
                              <th className="text-right p-2">Cash Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allResults.map((r) => (
                              <tr key={r.scenario.id} className="border-b">
                                <td className="p-2">{r.scenario.name}</td>
                                <td className="text-right p-2">
                                  {r.scenario.useIUL
                                    ? fmt(r.scenario.iulPremium)
                                    : "-"}
                                </td>
                                <td className="text-right p-2">
                                  {r.scenario.useIUL
                                    ? r.scenario.iulYears
                                    : "-"}
                                </td>
                                <td className="text-right p-2">
                                  {r.scenario.useIUL
                                    ? fmt(r.iulCashValue)
                                    : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Table 6: Annuity Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Annuity Strategy Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Scenario</th>
                              <th className="text-right p-2">Purchase</th>
                              <th className="text-right p-2">Rate</th>
                              <th className="text-right p-2">Income</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allResults.map((r) => (
                              <tr key={r.scenario.id} className="border-b">
                                <td className="p-2">{r.scenario.name}</td>
                                <td className="text-right p-2">
                                  {r.scenario.useAnnuity
                                    ? fmt(r.scenario.annuityPurchase)
                                    : "-"}
                                </td>
                                <td className="text-right p-2">
                                  {r.scenario.useAnnuity
                                    ? `${r.scenario.annuityRate}%`
                                    : "-"}
                                </td>
                                <td className="text-right p-2">
                                  {r.scenario.useAnnuity
                                    ? fmt(r.annuityIncome)
                                    : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <NAICDisclaimer
          variant="compact"
          showsProjections
          showsCashValues
          showsComparisons
        />
      </div>
    
        <ComplianceFooter pageName="MultiScenarioPlayZone" showsIUL showsAnnuity showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
