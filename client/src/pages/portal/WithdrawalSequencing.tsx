// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line,
  RadarChart, ComposedChart, Legend, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  AlertTriangle,
  CheckCircle2,
  Landmark,
  Activity,
  Settings,
  FileText,
  Save,
  Calculator,
} from "lucide-react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { PlatformEnhancements } from "@/components/PlatformEnhancements";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const fmtPct = (n: number) => `${n.toFixed(2)}%`;

interface AccountBalance {
  taxable: number;
  traditional: number;
  roth: number;
  iulCashValue: number;
  annuityValue: number;
  socialSecurity: number;
  hsa: number;
  realEstate: number;
  business: number;
  crypto: number;
}

interface YearResult {
  year: number;
  age: number;
  withdrawal: number;
  sources: { name: string; amount: number; taxable: boolean; category: string }[];
  taxesPaid: number;
  effectiveRate: number;
  marginalRate: number;
  remainingBalances: AccountBalance;
  irmaaTriggered: boolean;
  rmdRequired: number;
  strategy: string;
  inflationFactor: number;
  marketReturn: number;
  sequenceOfReturnsRisk: number;
  longevityRisk: number;
  healthCareCosts: number;
  legacyValue: number;
}

const MOCK_MARKET_RETURNS = [
  0.08, -0.12, 0.15, 0.05, 0.09, 0.22, -0.05, 0.11, 0.07, 0.03,
  0.18, -0.08, 0.14, 0.06, 0.10, 0.25, -0.15, 0.12, 0.08, 0.04,
  0.16, -0.06, 0.13, 0.07, 0.09, 0.20, -0.10, 0.11, 0.08, 0.05,
  0.17, -0.07, 0.14, 0.06, 0.10, 0.21, -0.09, 0.12, 0.08, 0.04
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export default function WithdrawalSequencing() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: strategyData } = trpc.strategy.getOptimal.useQuery({ clientId: clientData?.id || "default" }, { enabled: !!clientData?.id });
  const { data: marketData } = trpc.marketData.getHistorical.useQuery({ years: 30 });
  const { data: taxRules } = trpc.compliance.getTaxBrackets.useQuery({ year: new Date().getFullYear() });
  const { data: userPreferences } = trpc.dashboard.getPreferences.useQuery();
  
  const saveStrategyMutation = trpc.savedStrategies.save.useMutation();
  const logActivityMutation = trpc.activity.log.useMutation();
  const generateReportMutation = trpc.reports.generate.useMutation();

  const [currentAge, setCurrentAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(95);
  const [annualNeed, setAnnualNeed] = useState(150000);
  const [inflationRate, setInflationRate] = useState(3);
  const [healthcareInflation, setHealthcareInflation] = useState(5);
  
  const [taxable, setTaxable] = useState(500000);
  const [traditional, setTraditional] = useState(1800000);
  const [roth, setRoth] = useState(400000);
  const [iulCashValue, setIulCashValue] = useState(800000);
  const [annuityValue, setAnnuityValue] = useState(300000);
  const [ssBenefit, setSsBenefit] = useState(36000);
  const [hsa, setHsa] = useState(50000);
  const [realEstate, setRealEstate] = useState(750000);
  const [business, setBusiness] = useState(0);
  const [crypto, setCrypto] = useState(25000);
  
  const [projectionYears, setProjectionYears] = useState(30);
  const [marketCondition, setMarketCondition] = useState("average"); // average, bear, bull, historical
  const [withdrawalStrategy, setWithdrawalStrategy] = useState("proportional"); // proportional, tax-efficient, roth-first, traditional-first
  const [taxRegime, setTaxRegime] = useState("current"); // current, sunset, high
  const [dynamicSpending, setDynamicSpending] = useState(false);
  const [includeSocialSecurity, setIncludeSocialSecurity] = useState(true);
  const [ssStartAge, setSsStartAge] = useState(67);
  const [rmdAge, setRmdAge] = useState(73);
  
  const [activeTab, setActiveTab] = useState("sequence");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (!clientData) return;
    if (clientData.age) setCurrentAge(clientData.age);
    if (clientData.annualIncomeNeeded) setAnnualNeed(clientData.annualIncomeNeeded);
    if (clientData.taxableInvestments) setTaxable(clientData.taxableInvestments);
    if (clientData.rothBalance) setRoth(clientData.rothBalance);
    if (clientData.lifeInsuranceCv) setIulCashValue(clientData.lifeInsuranceCv);
    if (clientData.annuityValue) setAnnuityValue(clientData.annuityValue);
    if (clientData.socialSecurityEstimate) setSsBenefit(clientData.socialSecurityEstimate * 12);
    
    logActivityMutation.mutate({
      action: "VIEW_WITHDRAWAL_SEQUENCING",
      details: "Loaded client data into withdrawal sequencing tool"
    });
  }, [clientData]);

  const handleSaveStrategy = () => {
    saveStrategyMutation.mutate({
      clientId: clientData?.id || "default",
      strategyType: "withdrawal_sequencing",
      parameters: {
        currentAge,
        annualNeed,
        inflationRate,
        withdrawalStrategy,
        marketCondition
      }
    });
  };

  const handleGenerateReport = () => {
    generateReportMutation.mutate({
      type: "withdrawal_analysis",
      clientId: clientData?.id || "default",
      data: { results }
    });
  };

  const results = useMemo(() => {
    const years: YearResult[] = [];
    let balances: AccountBalance = {
      taxable, traditional, roth,
      iulCashValue, annuityValue,
      socialSecurity: ssBenefit,
      hsa, realEstate, business, crypto
    };

    for (let i = 0; i < projectionYears; i++) {
      const age = currentAge + i;
      
      let adjustedNeed = annualNeed;
      if (dynamicSpending && i > 0) {
        const prevTotal = years[i-1].remainingBalances.taxable + years[i-1].remainingBalances.traditional + years[i-1].remainingBalances.roth;
        const currentTotal = balances.taxable + balances.traditional + balances.roth;
        if (currentTotal < prevTotal * 0.8) {
          adjustedNeed = annualNeed * 0.9; // Cut spending by 10%
        } else if (currentTotal > prevTotal * 1.2) {
          adjustedNeed = annualNeed * 1.05; // Increase spending by 5%
        }
      }
      
      const inflationFactor = Math.pow(1 + inflationRate / 100, i);
      const inflatedNeed = Math.round(adjustedNeed * inflationFactor);
      const hcCosts = Math.round(15000 * Math.pow(1 + healthcareInflation / 100, i));
      
      const sources: { name: string; amount: number; taxable: boolean; category: string }[] = [];
      let remaining = inflatedNeed + hcCosts;
      let totalTaxable = 0;

      let returnIdx = i % MOCK_MARKET_RETURNS.length;
      let marketReturn = MOCK_MARKET_RETURNS[returnIdx];
      if (marketCondition === "bear") marketReturn -= 0.05;
      if (marketCondition === "bull") marketReturn += 0.05;
      if (marketCondition === "average") marketReturn = 0.06;

      if (balances.hsa > 0 && hcCosts > 0) {
        const hsaUsed = Math.min(hcCosts, balances.hsa);
        sources.push({ name: "HSA", amount: hsaUsed, taxable: false, category: "Tax-Free" });
        balances.hsa -= hsaUsed;
        remaining -= hsaUsed;
      }

      let rmdRequired = 0;
      if (age >= rmdAge && balances.traditional > 0) {
        const divisor = Math.max(1, 27.4 - (age - rmdAge) * 0.5);
        rmdRequired = Math.round(balances.traditional / divisor);
      }

      if (includeSocialSecurity && age >= ssStartAge) {
        const ssAmount = Math.round(balances.socialSecurity * Math.pow(1.02, i));
        if (ssAmount > 0) {
          const ssUsed = Math.min(remaining, ssAmount);
          sources.push({ name: "Social Security", amount: ssUsed, taxable: true, category: "Income" });
          totalTaxable += Math.round(ssUsed * 0.85); // up to 85% taxable
          remaining -= ssUsed;
        }
      }

      if (balances.annuityValue > 0 && remaining > 0) {
        const annuityIncome = Math.round(balances.annuityValue * 0.055);
        const annuityUsed = Math.min(remaining, annuityIncome);
        sources.push({ name: "Annuity Income", amount: annuityUsed, taxable: false, category: "Income" });
        remaining -= annuityUsed;
      }

      if (rmdRequired > 0) {
        const rmdUsed = Math.min(remaining, rmdRequired);
        if (rmdUsed > 0) {
          sources.push({ name: "Traditional IRA (RMD)", amount: rmdUsed, taxable: true, category: "Tax-Deferred" });
          totalTaxable += rmdUsed;
          balances.traditional -= rmdUsed;
          remaining -= rmdUsed;
        }
        
        if (rmdRequired > rmdUsed) {
          const excessRmd = rmdRequired - rmdUsed;
          sources.push({ name: "Traditional IRA (Excess RMD)", amount: excessRmd, taxable: true, category: "Tax-Deferred" });
          totalTaxable += excessRmd;
          balances.traditional -= excessRmd;
          balances.taxable += excessRmd; // Reinvest
        }
      }

      let strategyDesc = "";
      
      if (withdrawalStrategy === "tax-efficient") {
        strategyDesc = age < rmdAge ? "Fill Low Brackets" : "RMD + Tax-Free";
        
        if (age < rmdAge && remaining > 0 && balances.traditional > 0) {
          const bracketLimit = taxRegime === "sunset" ? 44537 : 89075; // 22% bracket top
          const bracketFill = Math.min(remaining, Math.max(0, bracketLimit - totalTaxable));
          
          if (bracketFill > 0) {
            const tradUsed = Math.min(bracketFill, balances.traditional);
            sources.push({ name: "Traditional IRA (Bracket Fill)", amount: tradUsed, taxable: true, category: "Tax-Deferred" });
            totalTaxable += tradUsed;
            balances.traditional -= tradUsed;
            remaining -= tradUsed;
          }
        }
        
        if (remaining > 0 && balances.taxable > 0) {
          const taxableUsed = Math.min(remaining, balances.taxable);
          sources.push({ name: "Taxable Account", amount: taxableUsed, taxable: true, category: "Taxable" });
          totalTaxable += Math.round(taxableUsed * 0.15); // Assume 15% cap gains rate on 100% of withdrawal for simplicity
          balances.taxable -= taxableUsed;
          remaining -= taxableUsed;
        }
        
        if (remaining > 0 && balances.iulCashValue > 0) {
          const iulAvailable = Math.round(balances.iulCashValue * 0.08);
          const iulUsed = Math.min(remaining, iulAvailable);
          sources.push({ name: "IUL Policy Loans", amount: iulUsed, taxable: false, category: "Tax-Free" });
          remaining -= iulUsed;
        }
        
        if (remaining > 0 && balances.roth > 0) {
          const rothUsed = Math.min(remaining, balances.roth);
          sources.push({ name: "Roth IRA", amount: rothUsed, taxable: false, category: "Tax-Free" });
          balances.roth -= rothUsed;
          remaining -= rothUsed;
        }
      } else if (withdrawalStrategy === "proportional") {
        strategyDesc = "Proportional Drawdown";
        
        const liquidAssets = balances.taxable + balances.traditional + balances.roth;
        if (remaining > 0 && liquidAssets > 0) {
          const taxPct = balances.taxable / liquidAssets;
          const tradPct = balances.traditional / liquidAssets;
          const rothPct = balances.roth / liquidAssets;
          
          if (balances.taxable > 0) {
            const taxUsed = Math.min(remaining * taxPct, balances.taxable);
            sources.push({ name: "Taxable Account", amount: taxUsed, taxable: true, category: "Taxable" });
            totalTaxable += Math.round(taxUsed * 0.15);
            balances.taxable -= taxUsed;
          }
          
          if (balances.traditional > 0) {
            const tradUsed = Math.min(remaining * tradPct, balances.traditional);
            sources.push({ name: "Traditional IRA", amount: tradUsed, taxable: true, category: "Tax-Deferred" });
            totalTaxable += tradUsed;
            balances.traditional -= tradUsed;
          }
          
          if (balances.roth > 0) {
            const rothUsed = Math.min(remaining * rothPct, balances.roth);
            sources.push({ name: "Roth IRA", amount: rothUsed, taxable: false, category: "Tax-Free" });
            balances.roth -= rothUsed;
          }
          
          remaining = Math.max(0, remaining - (remaining * taxPct + remaining * tradPct + remaining * rothPct));
        }
      } else if (withdrawalStrategy === "roth-first") {
        strategyDesc = "Roth First";
      } else {
        strategyDesc = "Traditional First";
      }

      let taxesPaid = 0;
      let marginalRate = 0;
      
      if (taxRegime === "sunset") {
        if (totalTaxable <= 22000) { taxesPaid = Math.round(totalTaxable * 0.10); marginalRate = 10; }
        else if (totalTaxable <= 89075) { taxesPaid = Math.round(2200 + (totalTaxable - 22000) * 0.15); marginalRate = 15; }
        else if (totalTaxable <= 170050) { taxesPaid = Math.round(12261 + (totalTaxable - 89075) * 0.25); marginalRate = 25; }
        else if (totalTaxable <= 215950) { taxesPaid = Math.round(32505 + (totalTaxable - 170050) * 0.28); marginalRate = 28; }
        else if (totalTaxable <= 539900) { taxesPaid = Math.round(45357 + (totalTaxable - 215950) * 0.33); marginalRate = 33; }
        else { taxesPaid = Math.round(152260 + (totalTaxable - 539900) * 0.396); marginalRate = 39.6; }
      } else {
        if (totalTaxable <= 22000) { taxesPaid = Math.round(totalTaxable * 0.10); marginalRate = 10; }
        else if (totalTaxable <= 89075) { taxesPaid = Math.round(2200 + (totalTaxable - 22000) * 0.12); marginalRate = 12; }
        else if (totalTaxable <= 170050) { taxesPaid = Math.round(10294 + (totalTaxable - 89075) * 0.22); marginalRate = 22; }
        else if (totalTaxable <= 215950) { taxesPaid = Math.round(28108 + (totalTaxable - 170050) * 0.24); marginalRate = 24; }
        else if (totalTaxable <= 539900) { taxesPaid = Math.round(39124 + (totalTaxable - 215950) * 0.32); marginalRate = 32; }
        else { taxesPaid = Math.round(142790 + (totalTaxable - 539900) * 0.35); marginalRate = 35; }
      }

      const effectiveRate = inflatedNeed > 0 ? Math.round((taxesPaid / inflatedNeed) * 100) : 0;
      const irmaaTriggered = totalTaxable > 206000;

      balances = {
        ...balances,
        taxable: Math.round(balances.taxable * (1 + marketReturn - 0.01)), // 1% tax drag
        traditional: Math.round(balances.traditional * (1 + marketReturn)),
        roth: Math.round(balances.roth * (1 + marketReturn)),
        iulCashValue: Math.round(balances.iulCashValue * 1.055),
        annuityValue: Math.round(balances.annuityValue * 1.03),
        hsa: Math.round(balances.hsa * (1 + marketReturn)),
        realEstate: Math.round(balances.realEstate * 1.04),
        business: Math.round(balances.business * 1.08),
        crypto: Math.round(balances.crypto * (1 + marketReturn * 2)), // Higher volatility
        socialSecurity: balances.socialSecurity,
      };

      years.push({
        year: new Date().getFullYear() + i,
        age,
        withdrawal: inflatedNeed + hcCosts,
        sources,
        taxesPaid,
        effectiveRate,
        marginalRate,
        remainingBalances: { ...balances },
        irmaaTriggered,
        rmdRequired,
        strategy: strategyDesc,
        inflationFactor,
        marketReturn,
        sequenceOfReturnsRisk: marketReturn < 0 && i < 10 ? 1 : 0,
        longevityRisk: age > 90 && balances.taxable + balances.traditional + balances.roth < inflatedNeed * 5 ? 1 : 0,
        healthCareCosts: hcCosts,
        legacyValue: Object.values(balances).reduce((a, b) => a + b, 0)
      });
    }

    return years;
  }, [
    currentAge, annualNeed, inflationRate, healthcareInflation,
    taxable, traditional, roth, iulCashValue, annuityValue, ssBenefit, hsa, realEstate, business, crypto,
    projectionYears, marketCondition, withdrawalStrategy, taxRegime, dynamicSpending, includeSocialSecurity, ssStartAge, rmdAge
  ]);

  const totalTaxesPaid = results.reduce((s, r) => s + r.taxesPaid, 0);
  const totalWithdrawn = results.reduce((s, r) => s + r.withdrawal, 0);
  const avgEffectiveRate = Math.round(totalTaxesPaid / totalWithdrawn * 100) || 0;
  const irmaaYears = results.filter((r) => r.irmaaTriggered).length;
  const finalLegacy = results.length > 0 ? results[results.length - 1].legacyValue : 0;
  
  const totalStartingAssets = taxable + traditional + roth + iulCashValue + annuityValue + hsa + realEstate + business + crypto;
  
  const sourcesPieData = [
    { name: 'Taxable', value: results.reduce((s, r) => s + r.sources.filter((src) => src.category === 'Taxable').reduce((ss, src) => ss + src.amount, 0), 0) },
    { name: 'Tax-Deferred', value: results.reduce((s, r) => s + r.sources.filter((src) => src.category === 'Tax-Deferred').reduce((ss, src) => ss + src.amount, 0), 0) },
    { name: 'Tax-Free', value: results.reduce((s, r) => s + r.sources.filter((src) => src.category === 'Tax-Free').reduce((ss, src) => ss + src.amount, 0), 0) },
    { name: 'Income', value: results.reduce((s, r) => s + r.sources.filter((src) => src.category === 'Income').reduce((ss, src) => ss + src.amount, 0), 0) },
  ].filter((d) => d.value > 0);

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
          {payload.name}
        </text>
        <path d={`M${cx},${cy}L${sx},${sy}`} stroke={fill} fill="none" />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff" fontSize={12}>{`$${(value/1000).toFixed(0)}k`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <PlatformEnhancements
            pageTitle="Withdrawal Sequencing"
            monteCarloConfig={{ years: projectionYears, initialValue: totalStartingAssets, preset: "retirementWithdrawal" }}
        />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="WithdrawalSequencing" />

        <ExecutiveSummary
          pageTitle="Withdrawal Sequencing"
          whatItDoes="This retirement income tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex retirement income concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Most retirees leave significant income on the table by not optimizing the sequence, timing, and tax treatment of their various income sources."
          intent="To give you the same caliber of retirement income analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your retirement income options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how retirement income strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this retirement income strategy interact with my other financial plans?",
            "What\'s the single biggest retirement income opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Withdrawal Sequencing" pageContext="Withdrawal Sequencing — retirement income modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This retirement income strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended retirement income approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={420000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Monthly Retirement Income", doNothing: 6500, recommended: 9200, format: "currency" },
            { label: "Income Tax Efficiency", doNothing: 45, recommended: 78, format: "percent" },
            { label: "Income Longevity", doNothing: 22, recommended: 35, format: "years" },
          ]}
          summary="Without taking action on retirement income, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Dynamic Withdrawal Sequencing Engine
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Advanced decumulation strategy optimizer modeling taxes, RMDs, and market conditions across {projectionYears} years.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveStrategy} className="gap-2">
              <Save className="h-4 w-4" /> Save Strategy
            </Button>
            <Button variant="outline" onClick={handleGenerateReport} className="gap-2">
              <FileText className="h-4 w-4" /> Generate Report
            </Button>
            <ExportToSlides
              toolName="Withdrawal Sequencing"
              getSections={() => [
                {
                  title: "Strategy Overview",
                  items: [
                    { label: "Total Starting Assets", value: fmt(totalStartingAssets) },
                    { label: "Projection Years", value: projectionYears.toString() },
                    { label: "Withdrawal Strategy", value: withdrawalStrategy },
                    { label: "Market Condition", value: marketCondition }
                  ]
                },
                {
                  title: "Outcomes",
                  items: [
                    { label: `Total Taxes (${projectionYears} yr)`, value: fmt(totalTaxesPaid) },
                    { label: "Avg Effective Rate", value: `${avgEffectiveRate}%` },
                    { label: "IRMAA Trigger Years", value: irmaaYears.toString() },
                    { label: "Final Legacy Value", value: fmt(finalLegacy) }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* ─── CALCULATE BUTTON ─── */}
        <div className="flex justify-center my-6">
          <button
            className="rc-btn rc-btn-primary px-8 py-3 text-lg font-semibold flex items-center gap-2"
            onClick={() => {
              toast.success("Withdrawal sequencing recalculated");
            }}
          >
            <Calculator className="w-5 h-5" />
            Generate Chart
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Starting Assets</div>
              <div className="text-2xl font-bold text-primary">{fmt(totalStartingAssets)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-red-500/20">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Taxes Paid</div>
              <div className="text-2xl font-bold text-red-400">{fmt(totalTaxesPaid)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-amber-500/20">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Avg Eff. Tax Rate</div>
              <div className="text-2xl font-bold text-amber-400">{avgEffectiveRate}%</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-blue-500/20">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Withdrawn</div>
              <div className="text-2xl font-bold text-blue-400">{fmt(totalWithdrawn)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-green-500/20">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Final Legacy</div>
              <div className="text-2xl font-bold text-green-400">{fmt(finalLegacy)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-purple-500/20">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center h-full">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">IRMAA Years</div>
              <div className="text-2xl font-bold text-purple-400">{irmaaYears} / {projectionYears}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Controls & Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar Controls */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" /> Strategy Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Withdrawal Method</Label>
                  <Select value={withdrawalStrategy} onValueChange={setWithdrawalStrategy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tax-efficient">Tax-Efficient (Bracket Fill)</SelectItem>
                      <SelectItem value="proportional">Proportional Drawdown</SelectItem>
                      <SelectItem value="roth-first">Roth First</SelectItem>
                      <SelectItem value="traditional-first">Traditional First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Market Condition</Label>
                  <Select value={marketCondition} onValueChange={setMarketCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="average">Average Returns (6%)</SelectItem>
                      <SelectItem value="bull">Bull Market (+5%)</SelectItem>
                      <SelectItem value="bear">Bear Market (-5%)</SelectItem>
                      <SelectItem value="historical">Historical Sequence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Tax Regime</Label>
                  <Select value={taxRegime} onValueChange={setTaxRegime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tax regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current TCJA Rates</SelectItem>
                      <SelectItem value="sunset">2026 Sunset Rates</SelectItem>
                      <SelectItem value="high">High Tax Environment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Label className="text-sm cursor-pointer" htmlFor="dynamic-spending">Dynamic Spending Rule</Label>
                  <Switch id="dynamic-spending" checked={dynamicSpending} onCheckedChange={setDynamicSpending} />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm cursor-pointer" htmlFor="include-ss">Include Social Security</Label>
                  <Switch id="include-ss" checked={includeSocialSecurity} onCheckedChange={setIncludeSocialSecurity} />
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between text-sm mb-2">
                    <Label>Annual Need</Label>
                    <span className="font-mono">{fmt(annualNeed)}</span>
                  </div>
                  <Slider value={[annualNeed]} onValueChange={([v]) => setAnnualNeed(v)} min={50000} max={500000} step={5000} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <Label>Inflation Rate</Label>
                    <span className="font-mono">{inflationRate}%</span>
                  </div>
                  <Slider value={[inflationRate]} onValueChange={([v]) => setInflationRate(v)} min={1} max={8} step={0.5} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <Label>Projection Years</Label>
                    <span className="font-mono">{projectionYears} yrs</span>
                  </div>
                  <Slider value={[projectionYears]} onValueChange={([v]) => setProjectionYears(v)} min={10} max={50} step={1} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" /> Risk Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Sequence of Returns Risk</span>
                      <span className={marketCondition === 'bear' ? 'text-red-400' : 'text-green-400'}>
                        {marketCondition === 'bear' ? 'High' : marketCondition === 'historical' ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${marketCondition === 'bear' ? 'bg-red-500 w-4/5' : marketCondition === 'historical' ? 'bg-amber-500 w-1/2' : 'bg-green-500 w-1/5'}`} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Longevity Risk (Outliving Assets)</span>
                      <span className={finalLegacy < 0 ? 'text-red-400' : finalLegacy < 500000 ? 'text-amber-400' : 'text-green-400'}>
                        {finalLegacy < 0 ? 'Critical' : finalLegacy < 500000 ? 'Elevated' : 'Low'}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${finalLegacy < 0 ? 'bg-red-500 w-full' : finalLegacy < 500000 ? 'bg-amber-500 w-3/5' : 'bg-green-500 w-1/4'}`} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tax Policy Risk</span>
                      <span className={taxRegime === 'sunset' ? 'text-amber-400' : 'text-blue-400'}>
                        {taxRegime === 'sunset' ? 'Realized' : 'Mitigated'}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${taxRegime === 'sunset' ? 'bg-amber-500 w-3/4' : 'bg-blue-500 w-1/3'}`} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Main Area */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Portfolio Balance Projection
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTaxable" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorTrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorRoth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ffc658" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="age" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                        <RTooltip 
                          contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                          formatter={(value: number) => fmt(value)}
                          labelFormatter={(label) => `Age: ${label}`}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Area type="monotone" dataKey="remainingBalances.taxable" name="Taxable" stackId="1" stroke="#8884d8" fill="url(#colorTaxable)" />
                        <Area type="monotone" dataKey="remainingBalances.traditional" name="Traditional" stackId="1" stroke="#82ca9d" fill="url(#colorTrad)" />
                        <Area type="monotone" dataKey="remainingBalances.roth" name="Roth" stackId="1" stroke="#ffc658" fill="url(#colorRoth)" />
                        <Area type="monotone" dataKey="remainingBalances.iulCashValue" name="IUL" stackId="1" stroke="#ff8042" fill="#ff8042" fillOpacity={0.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Withdrawal Sources & Taxes
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="age" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                        <RTooltip 
                          contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                          formatter={(value: number, name: string) => name.includes('Rate') ? `${value}%` : fmt(value)}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Bar yAxisId="left" dataKey="withdrawal" name="Gross Withdrawal" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar yAxisId="left" dataKey="taxesPaid" name="Taxes Paid" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="effectiveRate" name="Effective Tax Rate" stroke="#f59e0b" strokeWidth={3} dot={false} />
                        <Line yAxisId="right" type="stepAfter" dataKey="marginalRate" name="Marginal Tax Rate" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-1 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Lifetime Source Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          data={sourcesPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          onMouseEnter={onPieEnter}
                        >
                          {sourcesPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Account Depletion Heatmap (Simulated)
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" dataKey="age" name="Age" domain={['dataMin', 'dataMax']} stroke="#94a3b8" />
                        <YAxis type="number" dataKey="marketReturn" name="Market Return" stroke="#94a3b8" tickFormatter={(v) => `${(v*100).toFixed(0)}%`} />
                        <ZAxis type="number" dataKey="withdrawal" range={[50, 400]} name="Withdrawal Amount" />
                        <RTooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff" }}
                          formatter={(value, name) => {
                            if (name === 'Market Return') return `${(value as number * 100).toFixed(1)}%`;
                            if (name === 'Withdrawal Amount') return fmt(value as number);
                            return value;
                          }}
                        />
                        <Scatter name="Withdrawals" data={results} fill="#8884d8">
                          {results.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.marketReturn < 0 ? '#ef4444' : entry.marketReturn > 0.1 ? '#10b981' : '#3b82f6'} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 3 */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Longevity Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="age" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                        <RTooltip 
                          contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                          formatter={(value: number) => fmt(value)}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="healthCareCosts" name="Healthcare Costs" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="legacyValue" name="Legacy Value" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Data Tabs */}
            <Card className="overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-border px-4 py-2 bg-muted/20">
                  <TabsList className="bg-transparent h-auto p-0 gap-4 justify-start w-full overflow-x-auto">
                    <TabsTrigger value="sequence" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-full px-4 py-1.5">
                      Year-by-Year Sequence
                    </TabsTrigger>
                    <TabsTrigger value="balances" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-full px-4 py-1.5">
                      Account Balances
                    </TabsTrigger>
                    <TabsTrigger value="taxes" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-full px-4 py-1.5">
                      Tax Analysis
                    </TabsTrigger>
                    <TabsTrigger value="inputs" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-full px-4 py-1.5">
                      Starting Assets
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="sequence" className="p-0 m-0">
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-muted-foreground whitespace-nowrap">Year / Age</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Total Need</th>
                          <th className="text-left p-3 font-medium text-muted-foreground min-w-[300px]">Funding Sources</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Taxes Paid</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Eff. Rate</th>
                          <th className="text-center p-3 font-medium text-muted-foreground">Market</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {results.map((r) => (
                          <tr key={r.year} className={`hover:bg-muted/30 transition-colors ${r.irmaaTriggered ? "bg-amber-500/5" : ""}`}>
                            <td className="p-3">
                              <div className="font-medium">{r.year}</div>
                              <div className="text-xs text-muted-foreground">Age {r.age}</div>
                            </td>
                            <td className="p-3 text-right font-mono">{fmt(r.withdrawal)}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1.5">
                                {r.sources.map((s, i) => (
                                  <Badge key={i} variant="outline" className={`text-[10px] py-0 h-5 ${
                                    s.category === 'Tax-Free' ? "text-green-400 border-green-400/30 bg-green-400/5" : 
                                    s.category === 'Taxable' ? "text-blue-400 border-blue-400/30 bg-blue-400/5" :
                                    s.category === 'Income' ? "text-purple-400 border-purple-400/30 bg-purple-400/5" :
                                    "text-red-400 border-red-400/30 bg-red-400/5"
                                  }`}>
                                    {s.name.replace("Traditional IRA ", "Trad ").replace("Account", "Acct")}: {fmt(s.amount)}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-right text-red-400 font-mono">{fmt(r.taxesPaid)}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {r.effectiveRate}%
                                {r.irmaaTriggered && <AlertTriangle className="h-3 w-3 text-amber-500" title="IRMAA Triggered" />}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className={`text-[10px] ${r.marketReturn < 0 ? 'text-red-400 border-red-400/30' : 'text-green-400 border-green-400/30'}`}>
                                {(r.marketReturn * 100).toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="balances" className="p-0 m-0">
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-muted-foreground">Age</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Taxable</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Traditional</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Roth</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">IUL / Annuity</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Other Assets</th>
                          <th className="text-right p-3 font-medium text-primary">Total Net Worth</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {results.map((r) => {
                          const otherAssets = r.remainingBalances.hsa + r.remainingBalances.realEstate + r.remainingBalances.business + r.remainingBalances.crypto;
                          const total = r.remainingBalances.taxable + r.remainingBalances.traditional + r.remainingBalances.roth + r.remainingBalances.iulCashValue + r.remainingBalances.annuityValue + otherAssets;
                          
                          return (
                            <tr key={r.year} className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-medium">{r.age}</td>
                              <td className="p-3 text-right font-mono">{fmt(r.remainingBalances.taxable)}</td>
                              <td className="p-3 text-right font-mono">{fmt(r.remainingBalances.traditional)}</td>
                              <td className="p-3 text-right text-green-400 font-mono">{fmt(r.remainingBalances.roth)}</td>
                              <td className="p-3 text-right text-blue-400 font-mono">
                                {fmt(r.remainingBalances.iulCashValue + r.remainingBalances.annuityValue)}
                              </td>
                              <td className="p-3 text-right text-purple-400 font-mono">{fmt(otherAssets)}</td>
                              <td className="p-3 text-right font-bold text-primary font-mono">{fmt(total)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="taxes" className="p-6 m-0">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-red-400" /> Cumulative Tax Burden
                      </h3>
                      <div className="space-y-3">
                        {results.filter((_, i) => i % 5 === 0 || i === results.length - 1).map((r) => {
                          const cumTax = results.slice(0, results.indexOf(r) + 1).reduce((s, yr) => s + yr.taxesPaid, 0);
                          return (
                            <div key={r.year} className="flex items-center gap-3">
                              <div className="w-16 text-sm font-medium shrink-0">Age {r.age}</div>
                              <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${Math.max(2, (cumTax / totalTaxesPaid) * 100)}%` }} />
                                <div className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white mix-blend-difference">
                                  {((cumTax / totalTaxesPaid) * 100).toFixed(0)}%
                                </div>
                              </div>
                              <div className="w-24 text-right text-sm font-mono text-red-400">{fmt(cumTax)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-400" /> Strategy Insights
                      </h3>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <h4 className="font-medium text-sm text-primary mb-1">Pre-RMD Phase (Ages {currentAge}-{rmdAge-1})</h4>
                          <p className="text-xs text-muted-foreground">
                            {withdrawalStrategy === 'tax-efficient' 
                              ? `Filling the ${taxRegime === 'sunset' ? '15%' : '12%'} tax bracket with Traditional IRA distributions to reduce future RMDs. Using taxable accounts for remaining needs.`
                              : `Taking proportional distributions across all accounts. This may result in higher RMDs later in retirement.`}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <h4 className="font-medium text-sm text-primary mb-1">RMD Phase (Ages {rmdAge}+)</h4>
                          <p className="text-xs text-muted-foreground">
                            Required Minimum Distributions are forcing taxable income. {irmaaYears > 0 ? `IRMAA thresholds are crossed in ${irmaaYears} years, increasing Medicare premiums.` : `Careful sequencing keeps income below IRMAA thresholds.`}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <h4 className="font-medium text-sm text-primary mb-1">Tax Policy Impact</h4>
                          <p className="text-xs text-muted-foreground">
                            {taxRegime === 'sunset' 
                              ? `The 2026 TCJA sunset increases tax liability significantly. The marginal rate jumps to ${results[0]?.marginalRate}% early in retirement.`
                              : `Assuming current tax brackets remain permanent. If TCJA sunsets, lifetime taxes could increase by 15-25%.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="inputs" className="p-6 m-0">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium uppercase text-muted-foreground border-b pb-2">Liquid Assets</h3>
                      <div className="space-y-3">
                        <div><Label className="text-xs">Taxable Brokerage</Label><NumberInput value={taxable} onChange={setTaxable} className="mt-1" /></div>
                        <div><Label className="text-xs">Traditional IRA/401(k)</Label><NumberInput value={traditional} onChange={setTraditional} className="mt-1" /></div>
                        <div><Label className="text-xs">Roth IRA</Label><NumberInput value={roth} onChange={setRoth} className="mt-1" /></div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium uppercase text-muted-foreground border-b pb-2">Insurance & Annuities</h3>
                      <div className="space-y-3">
                        <div><Label className="text-xs">IUL Cash Value</Label><NumberInput value={iulCashValue} onChange={setIulCashValue} className="mt-1" /></div>
                        <div><Label className="text-xs">Annuity Value</Label><NumberInput value={annuityValue} onChange={setAnnuityValue} className="mt-1" /></div>
                        <div><Label className="text-xs">HSA Balance</Label><NumberInput value={hsa} onChange={setHsa} className="mt-1" /></div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium uppercase text-muted-foreground border-b pb-2">Other Assets & Income</h3>
                      <div className="space-y-3">
                        <div><Label className="text-xs">Real Estate Equity</Label><NumberInput value={realEstate} onChange={setRealEstate} className="mt-1" /></div>
                        <div><Label className="text-xs">Business Interest</Label><NumberInput value={business} onChange={setBusiness} className="mt-1" /></div>
                        <div><Label className="text-xs">Annual Social Security</Label><NumberInput value={ssBenefit} onChange={setSsBenefit} className="mt-1" /></div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>

        <NAICDisclaimer variant="compact" showsProjections showsCashValues showsPolicyLoans />
      </div>
    
        <PageInsights pageId="withdrawal-sequencing" />
        <ComplianceFooter pageName="WithdrawalSequencing" showsIUL showsAnnuity showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
