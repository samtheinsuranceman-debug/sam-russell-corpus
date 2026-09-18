// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  Briefcase,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  Download,
  RefreshCw,
  Settings,
  Key,
  Star,
  Zap,
  Save,
  Maximize2,
  Minimize2,
  List,
  Grid,
  BarChart as BarChartIcon,
} from "lucide-react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend
} from "recharts";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

export default function BusinessOwnerPlanning() {
  const { user } = useAuth();
  const { data: clientData, loading: clientDataLoading } = useClientData();
  
  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: notesData } = trpc.notes.list.useQuery({ clientId: 0 });
  const { data: activityData } = trpc.activity.list.useQuery();
  const { data: dashboardData } = trpc.dashboard.stats.useQuery();
  const { data: pipelineData } = trpc.pipeline.list.useQuery();
  const { data: strategyData } = trpc.strategy.list.useQuery();
  
  const [annualRevenue, setAnnualRevenue] = useState<number>(5000000);
  const [ebitda, setEbitda] = useState<number>(1200000);
  const [industryMultiple, setIndustryMultiple] = useState<number>(5);
  const [ownerSalary, setOwnerSalary] = useState<number>(350000);
  const [numEmployees, setNumEmployees] = useState<number>(25);
  const [businessType, setBusinessType] = useState("llc");
  const [ownerAge, setOwnerAge] = useState<number>(55);
  const [exitTimeline, setExitTimeline] = useState<number>(10);
  const [growthRate, setGrowthRate] = useState<number>(8);
  const [discountRate, setDiscountRate] = useState<number>(12);

  const [keyPersonSalary, setKeyPersonSalary] = useState<number>(250000);
  const [keyPersonReplacementTime, setKeyPersonReplacementTime] = useState<number>(12);
  const [numKeyPersons, setNumKeyPersons] = useState<number>(2);
  const [trainingCost, setTrainingCost] = useState<number>(50000);
  const [recruitingFee, setRecruitingFee] = useState<number>(25); // percentage

  const [numPartners, setNumPartners] = useState<number>(2);
  const [partnerOwnership, setPartnerOwnership] = useState<number>(50);
  const [buySellType, setBuySellType] = useState("cross-purchase");
  const [fundingMethod, setFundingMethod] = useState("life-insurance");

  const [estateTaxRate, setEstateTaxRate] = useState<number>(40);
  const [exemptionAmount, setExemptionAmount] = useState<number>(13610000);
  const [spousalPortability, setSpousalPortability] = useState<boolean>(true);

  const [bonusPercentage, setBonusPercentage] = useState<number>(15);
  const [vestingYears, setVestingYears] = useState<number>(5);
  const [participationRate, setParticipationRate] = useState<number>(80);

  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("valuation");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chartType, setChartType] = useState("area");
  
  const [showTooltips, setShowTooltips] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [theme, setTheme] = useState("blue");
  const [fontSize, setFontSize] = useState("medium");
  const [layout, setLayout] = useState("grid");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!clientData) return;
    if (clientData.age) setOwnerAge(clientData.age);
    if (clientData.annualIncome) setOwnerSalary(clientData.annualIncome);
  }, [clientData]);

  const valuation = useMemo(() => {
    const enterpriseValue = ebitda * industryMultiple;
    const adjustedValue = enterpriseValue - (ownerSalary > 200000 ? (ownerSalary - 200000) * industryMultiple * 0.3 : 0);
    const revenueMultiple = annualRevenue * 1.2;
    const blendedValue = Math.round((adjustedValue * 0.6 + revenueMultiple * 0.4));
    const growthValue = Math.round(blendedValue * Math.pow(1 + growthRate/100, exitTimeline));
    const dcfValue = Math.round(blendedValue * (1 - discountRate/100));

    const keyPersonCoverage = Math.round(keyPersonSalary * keyPersonReplacementTime / 12 * numKeyPersons * 2 + trainingCost * numKeyPersons + keyPersonSalary * (recruitingFee/100) * numKeyPersons);
    const keyPersonPremium = Math.round(keyPersonCoverage * 0.008);

    const partnerShareValue = Math.round(blendedValue * partnerOwnership / 100);
    const buySellCoverage = partnerShareValue;
    const buySellPremium = Math.round(buySellCoverage * 0.006);

    const effectiveExemption = spousalPortability ? exemptionAmount * 2 : exemptionAmount;
    const estateTaxOnBusiness = Math.round(Math.max(0, blendedValue - effectiveExemption) * (estateTaxRate/100));
    const iliCoverage = estateTaxOnBusiness > 0 ? estateTaxOnBusiness : Math.round(blendedValue * 0.20);
    const iliPremium = Math.round(iliCoverage * 0.005);

    const execBonusCost = Math.round(ownerSalary * (bonusPercentage/100));
    const deferredCompPool = Math.round(ownerSalary * 0.25 * exitTimeline * (participationRate/100));

    return {
      enterpriseValue, adjustedValue, revenueMultiple, blendedValue, growthValue, dcfValue,
      keyPersonCoverage, keyPersonPremium, partnerShareValue, buySellCoverage, buySellPremium,
      estateTaxOnBusiness, iliCoverage, iliPremium, execBonusCost, deferredCompPool,
    };
  }, [annualRevenue, ebitda, industryMultiple, ownerSalary, ownerAge, exitTimeline, growthRate, discountRate,
      keyPersonSalary, keyPersonReplacementTime, numKeyPersons, trainingCost, recruitingFee,
      numPartners, partnerOwnership, estateTaxRate, exemptionAmount, spousalPortability,
      bonusPercentage, participationRate]);

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csvContent = [
        ["Metric", "Value"],
        ["Enterprise Value", valuation.enterpriseValue],
        ["Adjusted Value", valuation.adjustedValue],
        ["Revenue Multiple", valuation.revenueMultiple],
        ["Blended Value", valuation.blendedValue],
        ["Growth Value", valuation.growthValue],
        ["DCF Value", valuation.dcfValue],
        ["Key Person Coverage", valuation.keyPersonCoverage],
        ["Key Person Premium", valuation.keyPersonPremium],
        ["Partner Share Value", valuation.partnerShareValue],
        ["Buy-Sell Coverage", valuation.buySellCoverage],
        ["Buy-Sell Premium", valuation.buySellPremium],
        ["Estate Tax on Business", valuation.estateTaxOnBusiness],
        ["ILI Coverage", valuation.iliCoverage],
        ["ILI Premium", valuation.iliPremium],
        ["Executive Bonus Cost", valuation.execBonusCost],
        ["Deferred Comp Pool", valuation.deferredCompPool]
      ].map((e) => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "business_planning_export.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 800);
  };
  
  const valuationHistoryData = [
    { year: 2020, revenue: 3500000, ebitda: 700000, multiple: 4.5, value: 3150000 },
    { year: 2021, revenue: 3800000, ebitda: 850000, multiple: 4.8, value: 4080000 },
    { year: 2022, revenue: 4200000, ebitda: 950000, multiple: 5.0, value: 4750000 },
    { year: 2023, revenue: 4600000, ebitda: 1050000, multiple: 5.2, value: 5460000 },
    { year: 2024, revenue: 5000000, ebitda: 1200000, multiple: 5.5, value: 6600000 },
  ];
  
  const keyEmployeesData = [
    { id: 1, name: "John Smith", role: "COO", salary: 250000, age: 45, replacementTime: 12, risk: "High" },
    { id: 2, name: "Sarah Johnson", role: "CTO", salary: 280000, age: 42, replacementTime: 18, risk: "Critical" },
    { id: 3, name: "Michael Brown", role: "VP Sales", salary: 210000, age: 50, replacementTime: 9, risk: "Medium" },
    { id: 4, name: "Emily Davis", role: "CFO", salary: 230000, age: 48, replacementTime: 12, risk: "High" },
    { id: 5, name: "David Wilson", role: "Lead Engineer", salary: 180000, age: 35, replacementTime: 6, risk: "Low" },
  ];
  
  const partnersData = [
    { id: 1, name: "Owner (You)", ownership: partnerOwnership, value: valuation.partnerShareValue, role: "CEO" },
    { id: 2, name: "Partner A", ownership: (100 - partnerOwnership) / (numPartners - 1), value: valuation.blendedValue * ((100 - partnerOwnership) / (numPartners - 1)) / 100, role: "President" },
    { id: 3, name: "Partner B", ownership: numPartners > 2 ? (100 - partnerOwnership) / (numPartners - 1) : 0, value: numPartners > 2 ? valuation.blendedValue * ((100 - partnerOwnership) / (numPartners - 1)) / 100 : 0, role: "VP" },
  ].filter((p) => p.ownership > 0);
  
  const successionTimelineData = [
    { phase: "Years 1-3", action: "Identify successors, implement key person retention", status: "In Progress", cost: "$50k/yr" },
    { phase: "Years 4-5", action: "Begin leadership transition, finalize buy-sell funding", status: "Planning", cost: "$75k/yr" },
    { phase: "Years 6-7", action: "Shift operational control, restructure compensation", status: "Pending", cost: "$100k/yr" },
    { phase: "Years 8-10", action: "Complete ownership transfer, estate plan finalized", status: "Pending", cost: "$150k/yr" },
  ];
  
  const execBenefitsData = [
    { type: "Executive Bonus", participation: "Top 3 Execs", vesting: "Immediate", cost: valuation.execBonusCost, taxDeductible: "Yes" },
    { type: "Split-Dollar", participation: "CEO & President", vesting: "At Retirement", cost: valuation.execBonusCost * 0.6, taxDeductible: "No" },
    { type: "Deferred Comp", participation: "Top 10% Mgmt", vesting: "5-10 Years", cost: valuation.deferredCompPool / exitTimeline, taxDeductible: "When Paid" },
    { type: "SERP", participation: "Founders Only", vesting: "At Age 65", cost: ownerSalary * 0.2, taxDeductible: "When Paid" },
  ];
  
  const fundingOptionsData = [
    { option: "Term Life", initialPremium: "$5,000", year10Premium: "$15,000", cashValue: "$0", flexibility: "Low" },
    { option: "Whole Life", initialPremium: "$25,000", year10Premium: "$25,000", cashValue: "$180,000", flexibility: "Medium" },
    { option: "Universal Life", initialPremium: "$18,000", year10Premium: "$18,000", cashValue: "$140,000", flexibility: "High" },
    { option: "Indexed UL", initialPremium: "$20,000", year10Premium: "$20,000", cashValue: "$165,000", flexibility: "Very High" },
  ];

  return (
    <AppShell>
      <div className="space-y-6 p-6 bg-[#050a14] min-h-screen text-[#c8d8ec]">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="BusinessOwnerPlanning" />

        <ExecutiveSummary
          pageTitle="Business Owner Planning"
          whatItDoes="This strategic planning tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex strategic planning concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="A coordinated strategy that interlocks your tax, insurance, investment, and estate plans can produce 2-3x better outcomes than optimizing each area independently."
          intent="To give you the same caliber of strategic planning analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your strategic planning options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how strategic planning strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this strategic planning strategy interact with my other financial plans?",
            "What\'s the single biggest strategic planning opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Business Owner Planning" pageContext="Business Owner Planning — strategic planning modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This strategic planning strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended strategic planning approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={600000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Strategy Coordination", doNothing: 30, recommended: 90, format: "percent" },
            { label: "Goal Achievement Speed", doNothing: 25, recommended: 15, format: "years", higherIsBetter: false },
            { label: "Lifetime Wealth Impact", doNothing: 0, recommended: 600000, format: "currency" },
          ]}
          summary="Without taking action on strategic planning, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-[#f0c040]" />
              Business Owner Planning Module
            </h1>
            <p className="text-[#7a95b8] mt-1">
              Business valuation, key person insurance, buy-sell analysis, and succession planning
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
              <Input 
                className="pl-9 w-[200px] bg-[#0a1424] border-[#12233e] text-white" 
                placeholder="Search metrics..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Interactive Elements 1-5 */}
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-[100px] bg-[#0a1424] border-[#12233e] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-[#c8d8ec]">
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="bg-[#0a1424] border-[#12233e] text-white hover:bg-[#12233e]" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Star className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            </Button>
            
            <Button variant="outline" className="bg-[#0a1424] border-[#12233e] text-white hover:bg-[#12233e]" onClick={() => setCompactView(!compactView)}>
              {compactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>

            <Button variant="outline" className="bg-[#0a1424] border-[#12233e] text-white hover:bg-[#12233e]" onClick={handleExportCSV} disabled={isExporting}>
              {isExporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              CSV
            </Button>
            <ExportToSlides
              toolName="Business Owner Planning"
              getSections={() => [
                {
                  title: "Business Valuation",
                  items: [
                    { label: "Blended Valuation", value: fmt(valuation.blendedValue) },
                    { label: "Projected at Exit", value: fmt(valuation.growthValue) },
                    { label: "Industry Multiple", value: `${industryMultiple}x` },
                  ]
                },
                {
                  title: "Key Person",
                  items: [
                    { label: "Recommended Coverage", value: fmt(valuation.keyPersonCoverage) },
                    { label: "Estimated Premium", value: `${fmt(valuation.keyPersonPremium)}/yr` },
                  ]
                },
                {
                  title: "Buy-Sell Agreement",
                  items: [
                    { label: "Your Ownership Value", value: fmt(valuation.partnerShareValue) },
                    { label: "Est. Premium", value: `${fmt(valuation.buySellPremium)}/yr` },
                  ]
                },
                {
                  title: "Succession & Estate",
                  items: [
                    { label: "Estate Tax Exposure", value: fmt(valuation.estateTaxOnBusiness) },
                    { label: "ILIT Coverage Solution", value: fmt(valuation.iliCoverage) },
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Settings Bar (Interactive elements 6-12) */}
        {showAdvanced && (
          <div className="flex flex-wrap gap-4 p-4 bg-[#0a1424] border border-[#12233e] rounded-xl items-center">
            <div className="flex items-center space-x-2">
              <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
              <Label htmlFor="auto-save" className="text-white">Auto-Save</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
              <Label htmlFor="notifications" className="text-white">Alerts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="tooltips" checked={showTooltips} onCheckedChange={setShowTooltips} />
              <Label htmlFor="tooltips" className="text-white">Tooltips</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-white">Accept Terms</Label>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[120px] bg-[#0d1a2e] border-[#12233e] text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-[#c8d8ec]">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[120px] bg-[#0d1a2e] border-[#12233e] text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-[#c8d8ec]">
                <SelectItem value="blue">Blue Theme</SelectItem>
                <SelectItem value="green">Green Theme</SelectItem>
                <SelectItem value="gold">Gold Theme</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="text-[#7a95b8] hover:text-white" onClick={() => setLayout(layout === 'grid' ? 'list' : 'grid')}>
              {layout === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${compactView ? 'mb-2' : 'mb-6'}`}>
          <div className="p-4 rounded-xl bg-[#0a1424] border border-[#12233e] flex flex-col justify-between hover:border-[#3b82f6]/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[#7a95b8] font-medium">Business Valuation</div>
              <Briefcase className="h-4 w-4 text-[#3b82f6]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#3b82f6]">{fmt(valuation.blendedValue)}</div>
              <div className="text-xs text-[#7a95b8] mt-1">{industryMultiple}x EBITDA blend</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#0a1424] border border-[#12233e] flex flex-col justify-between hover:border-[#22c55e]/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[#7a95b8] font-medium">Projected at Exit</div>
              <TrendingUp className="h-4 w-4 text-[#22c55e]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#22c55e]">{fmt(valuation.growthValue)}</div>
              <div className="text-xs text-[#7a95b8] mt-1">{exitTimeline} years at {growthRate}%</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#0a1424] border border-[#12233e] flex flex-col justify-between hover:border-[#f0c040]/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[#7a95b8] font-medium">Key Person Coverage</div>
              <Users className="h-4 w-4 text-[#f0c040]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#f0c040]">{fmt(valuation.keyPersonCoverage)}</div>
              <div className="text-xs text-[#7a95b8] mt-1">{numKeyPersons} key employees</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#0a1424] border border-[#12233e] flex flex-col justify-between hover:border-red-400/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[#7a95b8] font-medium">Estate Tax Exposure</div>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{fmt(valuation.estateTaxOnBusiness)}</div>
              <div className="text-xs text-[#7a95b8] mt-1">At current exemption</div>
            </div>
          </div>
        </div>

        {/* Chart Section - 5 Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Chart 1: PieChart */}
          <div className="p-4 rounded-xl bg-[#0a1424] border border-[#12233e]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white">Valuation Components</div>
              <Badge className="bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 border-none">Current</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Adjusted Value", value: valuation.adjustedValue * 0.6 },
                    { name: "Revenue Multiple", value: valuation.revenueMultiple * 0.4 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#22c55e" />
                </Pie>
                <RTooltip 
                  contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#c8d8ec", fontSize: 12 }}
                  itemStyle={{ color: "#c8d8ec" }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart 2: AreaChart */}
          <div className="p-4 rounded-xl bg-[#0a1424] border border-[#12233e]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white">Projected Growth</div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setChartType('area')}><AreaChart className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setChartType('bar')}><BarChartIcon className="h-3 w-3" /></Button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              {chartType === 'area' ? (
                <AreaChart data={Array.from({ length: exitTimeline + 1 }, (_, i) => ({
                  year: `Y${i}`,
                  value: Math.round(valuation.blendedValue * Math.pow(1 + growthRate/100, i))
                }))}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="year" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} width={40} />
                  <RTooltip 
                    contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#c8d8ec", fontSize: 12 }}
                    itemStyle={{ color: "#22c55e" }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              ) : (
                <BarChart data={Array.from({ length: exitTimeline + 1 }, (_, i) => ({
                  year: `Y${i}`,
                  value: Math.round(valuation.blendedValue * Math.pow(1 + growthRate/100, i))
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="year" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} width={40} />
                  <RTooltip 
                    contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#c8d8ec", fontSize: 12 }}
                    itemStyle={{ color: "#22c55e" }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart 3: RadarChart */}
          <div className="p-4 rounded-xl bg-[#0a1424] border border-[#12233e]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white">Business Health</div>
              <Badge className="bg-[#f0c040]/20 text-[#f0c040] hover:bg-[#f0c040]/30 border-none">Analysis</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                { subject: 'Valuation', A: 85, fullMark: 100 },
                { subject: 'Growth', A: 70, fullMark: 100 },
                { subject: 'Retention', A: 60, fullMark: 100 },
                { subject: 'Succession', A: 45, fullMark: 100 },
                { subject: 'Protection', A: 90, fullMark: 100 },
                { subject: 'Liquidity', A: 65, fullMark: 100 },
              ]}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="#f0c040" fill="#f0c040" fillOpacity={0.4} />
                <RTooltip 
                  contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#c8d8ec", fontSize: 12 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 rounded-lg flex overflow-x-auto no-scrollbar justify-start">
              <TabsTrigger value="valuation" className="data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8] rounded-md px-4 py-2">Valuation</TabsTrigger>
              <TabsTrigger value="keyperson" className="data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8] rounded-md px-4 py-2">Key Person</TabsTrigger>
              <TabsTrigger value="buysell" className="data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8] rounded-md px-4 py-2">Buy-Sell</TabsTrigger>
              <TabsTrigger value="succession" className="data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8] rounded-md px-4 py-2">Succession</TabsTrigger>
              <TabsTrigger value="executive" className="data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8] rounded-md px-4 py-2">Exec Benefits</TabsTrigger>
            </TabsList>
            
            {/* Interactive element 13 */}
            <Button variant="outline" size="sm" className="bg-[#0a1424] border-[#12233e] text-white hidden md:flex" onClick={() => setShowAdvanced(!showAdvanced)}>
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? "Hide Settings" : "Advanced"}
            </Button>
          </div>

          {/* Valuation Tab */}
          <TabsContent value="valuation" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e] col-span-1 lg:col-span-1">
                <h3 className="text-lg font-semibold text-white mb-4">Business Inputs</h3>
                <div className="space-y-6">
                  {/* Interactive Elements 14-20 */}
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Business Type</Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger className="bg-[#050a14] border-[#12233e] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-[#c8d8ec]">
                        <SelectItem value="sole">Sole Proprietorship</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="scorp">S-Corporation</SelectItem>
                        <SelectItem value="ccorp">C-Corporation</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Annual Revenue</Label><span className="text-white font-medium">{fmt(annualRevenue)}</span></div>
                    <Slider value={[annualRevenue]} onValueChange={([v]) => setAnnualRevenue(v)} min={500000} max={50000000} step={250000} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">EBITDA</Label><span className="text-white font-medium">{fmt(ebitda)}</span></div>
                    <Slider value={[ebitda]} onValueChange={([v]) => setEbitda(v)} min={100000} max={10000000} step={100000} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Industry Multiple</Label><span className="text-white font-medium">{industryMultiple}x</span></div>
                    <Slider value={[industryMultiple]} onValueChange={([v]) => setIndustryMultiple(v)} min={2} max={15} step={0.5} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label className="text-[#c8d8ec] flex items-center gap-2">
                        Owner Salary
                        {clientData?.annualIncome && <FactFinderBadge />}
                      </Label>
                      <span className="text-white font-medium">{fmt(ownerSalary)}</span>
                    </div>
                    <Slider value={[ownerSalary]} onValueChange={([v]) => setOwnerSalary(v)} min={100000} max={1000000} step={25000} className="py-2" />
                  </div>
                  {showAdvanced && (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Exit Timeline</Label><span className="text-white font-medium">{exitTimeline} years</span></div>
                        <Slider value={[exitTimeline]} onValueChange={([v]) => setExitTimeline(v)} min={1} max={20} step={1} className="py-2" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Growth Rate (%)</Label><span className="text-white font-medium">{growthRate}%</span></div>
                        <Slider value={[growthRate]} onValueChange={([v]) => setGrowthRate(v)} min={0} max={25} step={1} className="py-2" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Discount Rate (%)</Label><span className="text-white font-medium">{discountRate}%</span></div>
                        <Slider value={[discountRate]} onValueChange={([v]) => setDiscountRate(v)} min={5} max={25} step={1} className="py-2" />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e] col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">Valuation Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { method: "EBITDA Multiple", value: valuation.enterpriseValue, desc: `${industryMultiple}x EBITDA of ${fmt(ebitda)}`, weight: "60%" },
                    { method: "Revenue Multiple", value: valuation.revenueMultiple, desc: `1.2x revenue of ${fmt(annualRevenue)}`, weight: "40%" },
                    { method: "Adjusted (Owner Comp)", value: valuation.adjustedValue, desc: "EBITDA adjusted for above-market owner salary", weight: "Primary" },
                    { method: "DCF Method", value: valuation.dcfValue, desc: `Discounted at ${discountRate}%`, weight: "Reference" },
                  ].filter((m) => m.method.toLowerCase().includes(searchQuery.toLowerCase()) || m.desc.toLowerCase().includes(searchQuery.toLowerCase())).map((m) => (
                    <div key={m.method} className="p-4 rounded-xl bg-[#050a14] border border-[#12233e] transition-all hover:border-[#3b82f6]/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-white">{m.method}</span>
                        <Badge className="bg-[#1a2e4c] text-[#7a95b8] hover:bg-[#1a2e4c] border-none">{m.weight}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{fmt(m.value)}</div>
                      <div className="text-xs text-[#7a95b8]">{m.desc}</div>
                    </div>
                  ))}
                </div>
                
                <div className="p-5 rounded-xl bg-gradient-to-br from-[#1a2e4c] to-[#050a14] border border-[#3b82f6]/30 relative overflow-hidden mb-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="text-sm text-[#3b82f6] mb-2 relative z-10 font-medium">Blended Business Value</div>
                  <div className="text-4xl font-bold text-white mb-2 relative z-10">{fmt(valuation.blendedValue)}</div>
                  <div className="text-sm text-[#c8d8ec] relative z-10">60% EBITDA + 40% Revenue weighted</div>
                </div>

                {/* Table 1 */}
                <h4 className="text-md font-semibold text-white mb-3">Historical Valuation</h4>
                <div className="border border-[#12233e] rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#050a14]">
                      <TableRow className="border-[#12233e] hover:bg-transparent">
                        <TableHead className="text-[#7a95b8]">Year</TableHead>
                        <TableHead className="text-[#7a95b8]">Revenue</TableHead>
                        <TableHead className="text-[#7a95b8]">EBITDA</TableHead>
                        <TableHead className="text-[#7a95b8]">Multiple</TableHead>
                        <TableHead className="text-[#7a95b8] text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valuationHistoryData.map((row) => (
                        <TableRow key={row.year} className="border-[#12233e] hover:bg-[#1a2e4c]/30">
                          <TableCell className="font-medium text-white">{row.year}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{fmt(row.revenue)}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{fmt(row.ebitda)}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.multiple}x</TableCell>
                          <TableCell className="text-right text-[#3b82f6] font-medium">{fmt(row.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Key Person Tab */}
          <TabsContent value="keyperson" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e]">
                <h3 className="text-lg font-semibold text-white mb-4">Key Person Analysis</h3>
                <div className="space-y-6">
                  {/* Interactive Elements 21-25 */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Key Person Salary</Label><span className="text-white font-medium">{fmt(keyPersonSalary)}</span></div>
                    <Slider value={[keyPersonSalary]} onValueChange={([v]) => setKeyPersonSalary(v)} min={75000} max={500000} step={25000} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Replacement Time (months)</Label><span className="text-white font-medium">{keyPersonReplacementTime}</span></div>
                    <Slider value={[keyPersonReplacementTime]} onValueChange={([v]) => setKeyPersonReplacementTime(v)} min={3} max={24} step={3} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Number of Key Persons</Label><span className="text-white font-medium">{numKeyPersons}</span></div>
                    <Slider value={[numKeyPersons]} onValueChange={([v]) => setNumKeyPersons(v)} min={1} max={5} step={1} className="py-2" />
                  </div>
                  {showAdvanced && (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Training Cost</Label><span className="text-white font-medium">{fmt(trainingCost)}</span></div>
                        <Slider value={[trainingCost]} onValueChange={([v]) => setTrainingCost(v)} min={10000} max={150000} step={10000} className="py-2" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Recruiting Fee (%)</Label><span className="text-white font-medium">{recruitingFee}%</span></div>
                        <Slider value={[recruitingFee]} onValueChange={([v]) => setRecruitingFee(v)} min={10} max={40} step={5} className="py-2" />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e] col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">Coverage Recommendation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-5 rounded-xl bg-gradient-to-br from-[#2a2010] to-[#050a14] border border-[#f0c040]/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#f0c040]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="text-sm text-[#f0c040] mb-2 relative z-10 font-medium">Recommended Coverage</div>
                    <div className="text-4xl font-bold text-white mb-2 relative z-10">{fmt(valuation.keyPersonCoverage)}</div>
                    <div className="text-sm text-[#c8d8ec] relative z-10">
                      Based on {numKeyPersons} key person(s)
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-[#050a14] border border-[#12233e] flex flex-col justify-center">
                    <div className="text-sm text-[#7a95b8] mb-1">Estimated Annual Premium</div>
                    <div className="text-3xl font-bold text-white">{fmt(valuation.keyPersonPremium)}<span className="text-lg text-[#7a95b8] font-normal">/yr</span></div>
                    <div className="text-xs text-[#7a95b8] mt-2">Assuming preferred health class</div>
                  </div>
                </div>

                {/* Table 2 */}
                <h4 className="text-md font-semibold text-white mb-3">Key Employee Roster</h4>
                <div className="border border-[#12233e] rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#050a14]">
                      <TableRow className="border-[#12233e] hover:bg-transparent">
                        <TableHead className="text-[#7a95b8]">Name</TableHead>
                        <TableHead className="text-[#7a95b8]">Role</TableHead>
                        <TableHead className="text-[#7a95b8]">Salary</TableHead>
                        <TableHead className="text-[#7a95b8]">Replacement</TableHead>
                        <TableHead className="text-[#7a95b8] text-right">Risk Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keyEmployeesData.slice(0, numKeyPersons).map((row) => (
                        <TableRow key={row.id} className="border-[#12233e] hover:bg-[#1a2e4c]/30">
                          <TableCell className="font-medium text-white">{row.name}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.role}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{fmt(row.salary)}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.replacementTime} mo</TableCell>
                          <TableCell className="text-right">
                            <Badge className={`
                              ${row.risk === 'Critical' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : ''}
                              ${row.risk === 'High' ? 'bg-[#f0c040]/20 text-[#f0c040] hover:bg-[#f0c040]/30' : ''}
                              ${row.risk === 'Medium' ? 'bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30' : ''}
                              ${row.risk === 'Low' ? 'bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30' : ''}
                              border-none
                            `}>
                              {row.risk}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            
            {/* Chart 4: ComposedChart */}
            <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e]">
              <h3 className="text-lg font-semibold text-white mb-4">Cost of Loss vs Coverage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={[
                  { name: "Year 1", loss: valuation.keyPersonCoverage * 0.4, coverage: valuation.keyPersonCoverage, premium: valuation.keyPersonPremium },
                  { name: "Year 2", loss: valuation.keyPersonCoverage * 0.7, coverage: valuation.keyPersonCoverage, premium: valuation.keyPersonPremium * 2 },
                  { name: "Year 3", loss: valuation.keyPersonCoverage * 0.9, coverage: valuation.keyPersonCoverage, premium: valuation.keyPersonPremium * 3 },
                  { name: "Year 4", loss: valuation.keyPersonCoverage * 1.0, coverage: valuation.keyPersonCoverage, premium: valuation.keyPersonPremium * 4 },
                  { name: "Year 5", loss: valuation.keyPersonCoverage * 1.1, coverage: valuation.keyPersonCoverage, premium: valuation.keyPersonPremium * 5 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <RTooltip 
                    contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#c8d8ec" }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ color: '#7a95b8' }} />
                  <Bar yAxisId="left" dataKey="loss" name="Cumulative Loss" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line yAxisId="left" type="monotone" dataKey="coverage" name="Coverage Amount" stroke="#22c55e" strokeWidth={3} dot={false} />
                  <Area yAxisId="right" type="monotone" dataKey="premium" name="Cumulative Premium" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Buy-Sell Tab */}
          <TabsContent value="buysell" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e]">
                <h3 className="text-lg font-semibold text-white mb-4">Buy-Sell Agreement</h3>
                <div className="space-y-6">
                  {/* Interactive Elements 26-30 */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Number of Partners/Owners</Label><span className="text-white font-medium">{numPartners}</span></div>
                    <Slider value={[numPartners]} onValueChange={([v]) => setNumPartners(v)} min={2} max={6} step={1} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Your Ownership %</Label><span className="text-white font-medium">{partnerOwnership}%</span></div>
                    <Slider value={[partnerOwnership]} onValueChange={([v]) => setPartnerOwnership(v)} min={10} max={90} step={5} className="py-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Agreement Type</Label>
                    <Select value={buySellType} onValueChange={setBuySellType}>
                      <SelectTrigger className="bg-[#050a14] border-[#12233e] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-[#c8d8ec]">
                        <SelectItem value="cross-purchase">Cross-Purchase</SelectItem>
                        <SelectItem value="entity-purchase">Entity Purchase (Redemption)</SelectItem>
                        <SelectItem value="wait-and-see">Wait-and-See (Hybrid)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Funding Method</Label>
                    <Select value={fundingMethod} onValueChange={setFundingMethod}>
                      <SelectTrigger className="bg-[#050a14] border-[#12233e] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-[#c8d8ec]">
                        <SelectItem value="life-insurance">Life Insurance</SelectItem>
                        <SelectItem value="sinking-fund">Sinking Fund</SelectItem>
                        <SelectItem value="borrowing">Borrowing</SelectItem>
                        <SelectItem value="installment">Installment Sale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-5 rounded-xl bg-gradient-to-br from-[#1a2e4c] to-[#050a14] border border-[#3b82f6]/30 relative overflow-hidden mt-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="text-sm text-[#3b82f6] mb-2 relative z-10 font-medium">Your Ownership Value</div>
                    <div className="text-4xl font-bold text-white relative z-10">{fmt(valuation.partnerShareValue)}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e] col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">Ownership Structure</h3>
                
                {/* Table 3 */}
                <div className="border border-[#12233e] rounded-xl overflow-hidden mb-6">
                  <Table>
                    <TableHeader className="bg-[#050a14]">
                      <TableRow className="border-[#12233e] hover:bg-transparent">
                        <TableHead className="text-[#7a95b8]">Partner</TableHead>
                        <TableHead className="text-[#7a95b8]">Role</TableHead>
                        <TableHead className="text-[#7a95b8]">Ownership %</TableHead>
                        <TableHead className="text-[#7a95b8] text-right">Share Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partnersData.map((row) => (
                        <TableRow key={row.id} className="border-[#12233e] hover:bg-[#1a2e4c]/30">
                          <TableCell className="font-medium text-white">{row.name}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.role}</TableCell>
                          <TableCell className="text-[#c8d8ec]">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-[#12233e] rounded-full overflow-hidden">
                                <div className="h-full bg-[#3b82f6]" style={{ width: `${row.ownership}%` }}></div>
                              </div>
                              {row.ownership.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-white font-medium">{fmt(row.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Chart 5: LineChart */}
                <h4 className="text-md font-semibold text-white mb-3">Funding Accumulation (Sinking Fund vs Insurance)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={[
                    { year: "Y1", fund: valuation.buySellPremium, insurance: valuation.buySellCoverage },
                    { year: "Y5", fund: valuation.buySellPremium * 5 * 1.1, insurance: valuation.buySellCoverage },
                    { year: "Y10", fund: valuation.buySellPremium * 10 * 1.25, insurance: valuation.buySellCoverage },
                    { year: "Y15", fund: valuation.buySellPremium * 15 * 1.45, insurance: valuation.buySellCoverage },
                    { year: "Y20", fund: valuation.buySellPremium * 20 * 1.7, insurance: valuation.buySellCoverage },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="year" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                    <RTooltip 
                      contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#c8d8ec" }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ color: '#7a95b8' }} />
                    <Line type="monotone" dataKey="insurance" name="Insurance Payout" stroke="#22c55e" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="fund" name="Sinking Fund" stroke="#f0c040" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Succession Tab */}
          <TabsContent value="succession" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e]">
                <h3 className="text-lg font-semibold text-white mb-4">Estate & Succession</h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Estate Tax Rate (%)</Label><span className="text-white font-medium">{estateTaxRate}%</span></div>
                    <Slider value={[estateTaxRate]} onValueChange={([v]) => setEstateTaxRate(v)} min={0} max={50} step={5} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Exemption Amount</Label><span className="text-white font-medium">{fmt(exemptionAmount)}</span></div>
                    <Slider value={[exemptionAmount]} onValueChange={([v]) => setExemptionAmount(v)} min={5000000} max={25000000} step={1000000} className="py-2" />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch id="spousal" checked={spousalPortability} onCheckedChange={setSpousalPortability} />
                    <Label htmlFor="spousal" className="text-white">Spousal Portability (2x Exemption)</Label>
                  </div>
                  
                  <div className="p-5 rounded-xl bg-gradient-to-br from-[#2a1010] to-[#050a14] border border-red-500/30 relative overflow-hidden mt-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="text-sm text-red-400 mb-2 relative z-10 font-medium">Estimated Estate Tax</div>
                    <div className="text-4xl font-bold text-white relative z-10">{fmt(valuation.estateTaxOnBusiness)}</div>
                  </div>
                  
                  <div className="p-5 rounded-xl bg-gradient-to-br from-[#102a1a] to-[#050a14] border border-[#22c55e]/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="text-sm text-[#22c55e] mb-2 relative z-10 font-medium">ILIT Solution Coverage</div>
                    <div className="text-3xl font-bold text-white mb-2 relative z-10">{fmt(valuation.iliCoverage)}</div>
                    <div className="text-sm text-[#c8d8ec] relative z-10">Premium: {fmt(valuation.iliPremium)}/yr</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e] col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">Succession Timeline</h3>
                
                {/* Table 4 */}
                <div className="border border-[#12233e] rounded-xl overflow-hidden mb-6">
                  <Table>
                    <TableHeader className="bg-[#050a14]">
                      <TableRow className="border-[#12233e] hover:bg-transparent">
                        <TableHead className="text-[#7a95b8]">Phase</TableHead>
                        <TableHead className="text-[#7a95b8]">Key Actions</TableHead>
                        <TableHead className="text-[#7a95b8]">Status</TableHead>
                        <TableHead className="text-[#7a95b8] text-right">Est. Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {successionTimelineData.map((row, i) => (
                        <TableRow key={i} className="border-[#12233e] hover:bg-[#1a2e4c]/30">
                          <TableCell className="font-medium text-white whitespace-nowrap">{row.phase}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.action}</TableCell>
                          <TableCell>
                            <Badge className={`
                              ${row.status === 'In Progress' ? 'bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30' : ''}
                              ${row.status === 'Planning' ? 'bg-[#f0c040]/20 text-[#f0c040] hover:bg-[#f0c040]/30' : ''}
                              ${row.status === 'Pending' ? 'bg-[#1a2e4c] text-[#7a95b8] hover:bg-[#1a2e4c]' : ''}
                              border-none
                            `}>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-[#c8d8ec]">{row.cost}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="p-4 rounded-xl bg-[#050a14] border border-[#12233e]">
                  <h4 className="font-semibold text-white mb-3">Additional Strategies</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0a1424] border border-[#12233e]">
                      <CheckCircle2 className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-white">Section 6166</div>
                        <div className="text-xs text-[#7a95b8]">Defer estate tax up to 14 years with installment payments.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0a1424] border border-[#12233e]">
                      <CheckCircle2 className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-white">GRAT</div>
                        <div className="text-xs text-[#7a95b8]">Transfer business appreciation to heirs tax-free.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0a1424] border border-[#12233e]">
                      <CheckCircle2 className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-white">FLP / FLLC</div>
                        <div className="text-xs text-[#7a95b8]">Family Limited Partnership for valuation discounts.</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0a1424] border border-[#12233e]">
                      <CheckCircle2 className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-white">IDGT</div>
                        <div className="text-xs text-[#7a95b8]">Intentionally Defective Grantor Trust for tax-free sale.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Executive Benefits Tab */}
          <TabsContent value="executive" className="mt-0 outline-none">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e]">
                <h3 className="text-lg font-semibold text-white mb-4">Executive Benefits</h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Bonus Percentage</Label><span className="text-white font-medium">{bonusPercentage}%</span></div>
                    <Slider value={[bonusPercentage]} onValueChange={([v]) => setBonusPercentage(v)} min={5} max={50} step={5} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Vesting Years</Label><span className="text-white font-medium">{vestingYears} yrs</span></div>
                    <Slider value={[vestingYears]} onValueChange={([v]) => setVestingYears(v)} min={1} max={10} step={1} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><Label className="text-[#c8d8ec]">Participation Rate</Label><span className="text-white font-medium">{participationRate}%</span></div>
                    <Slider value={[participationRate]} onValueChange={([v]) => setParticipationRate(v)} min={10} max={100} step={10} className="py-2" />
                  </div>
                  
                  <div className="p-5 rounded-xl bg-gradient-to-br from-[#1a2e4c] to-[#050a14] border border-[#3b82f6]/30 relative overflow-hidden mt-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="text-sm text-[#3b82f6] mb-2 relative z-10 font-medium">Exec Bonus Cost</div>
                    <div className="text-4xl font-bold text-white relative z-10">{fmt(valuation.execBonusCost)}<span className="text-lg text-[#7a95b8] font-normal">/yr</span></div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-[#0a1424] border border-[#12233e] col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">Benefit Strategies Comparison</h3>
                
                {/* Table 5 */}
                <div className="border border-[#12233e] rounded-xl overflow-hidden mb-6">
                  <Table>
                    <TableHeader className="bg-[#050a14]">
                      <TableRow className="border-[#12233e] hover:bg-transparent">
                        <TableHead className="text-[#7a95b8]">Strategy Type</TableHead>
                        <TableHead className="text-[#7a95b8]">Participation</TableHead>
                        <TableHead className="text-[#7a95b8]">Vesting</TableHead>
                        <TableHead className="text-[#7a95b8]">Tax Deductible</TableHead>
                        <TableHead className="text-[#7a95b8] text-right">Est. Cost/Yr</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {execBenefitsData.map((row, i) => (
                        <TableRow key={i} className="border-[#12233e] hover:bg-[#1a2e4c]/30">
                          <TableCell className="font-medium text-white">{row.type}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.participation}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.vesting}</TableCell>
                          <TableCell>
                            <Badge className={`
                              ${row.taxDeductible === 'Yes' ? 'bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30' : ''}
                              ${row.taxDeductible === 'No' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : ''}
                              ${row.taxDeductible === 'When Paid' ? 'bg-[#f0c040]/20 text-[#f0c040] hover:bg-[#f0c040]/30' : ''}
                              border-none
                            `}>
                              {row.taxDeductible}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-white font-medium">{fmt(row.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Table 6 */}
                <h4 className="text-md font-semibold text-white mb-3">Funding Vehicle Options</h4>
                <div className="border border-[#12233e] rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#050a14]">
                      <TableRow className="border-[#12233e] hover:bg-transparent">
                        <TableHead className="text-[#7a95b8]">Vehicle</TableHead>
                        <TableHead className="text-[#7a95b8]">Initial Prem</TableHead>
                        <TableHead className="text-[#7a95b8]">Year 10 Prem</TableHead>
                        <TableHead className="text-[#7a95b8]">Est. Cash Value (Y10)</TableHead>
                        <TableHead className="text-[#7a95b8] text-right">Flexibility</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundingOptionsData.map((row, i) => (
                        <TableRow key={i} className="border-[#12233e] hover:bg-[#1a2e4c]/30">
                          <TableCell className="font-medium text-white">{row.option}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.initialPremium}</TableCell>
                          <TableCell className="text-[#c8d8ec]">{row.year10Premium}</TableCell>
                          <TableCell className="text-[#22c55e] font-medium">{row.cashValue}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-[#1a2e4c] text-[#7a95b8] hover:bg-[#1a2e4c] border-none">
                              {row.flexibility}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="compact" showsProjections showsCashValues />
        
        <PageInsights pageId="business-owner-planning" />
      </div>
    
        <ComplianceFooter pageName="BusinessOwnerPlanning" showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
