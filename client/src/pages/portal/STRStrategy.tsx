import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Home, Building2, TrendingUp, DollarSign, Shield,
  ChevronDown, ChevronUp, Info, Zap, Plus, Minus,
  Calculator, BarChart3, Table2, Target, Crown, CheckCircle2,
  MapPin, Calendar, Percent, Banknote, Wallet, ExternalLink,
  Layers, AlertTriangle, Users, Gift, Lock, Unlock,
  Hammer, Wrench, Star, Award, Sparkles, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Cell, PieChart, Pie,
} from "recharts";

// ─── HELPERS ───────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};
const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ─── COST SEGREGATION BREAKDOWN ────────────────────────────────────
const COST_SEG_CATEGORIES = [
  { name: "5-Year Property", pct: 0.15, years: 5, desc: "Carpeting, appliances, furniture, decorative fixtures", color: "#3b82f6" },
  { name: "7-Year Property", pct: 0.10, years: 7, desc: "Office furniture, security systems, landscaping", color: "#8b5cf6" },
  { name: "15-Year Property", pct: 0.10, years: 15, desc: "Land improvements, sidewalks, parking, fencing", color: "#14b8a6" },
  { name: "27.5-Year Property", pct: 0.55, years: 27.5, desc: "Building structure (standard residential depreciation)", color: "#64748b" },
  { name: "Land (Non-Depreciable)", pct: 0.10, years: 0, desc: "Land value — cannot be depreciated", color: "#374151" },
];

// ─── RABBU SECTION ─────────────────────────────────────────────────
function RabbuSection() {
  return (
    <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-blue-300">Validate STR Revenue with Real Market Data</h3>
            <a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            <a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-semibold">Rabbu.com</a> is
            the leading short-term rental analytics platform with 650,000+ active users. Before acquiring any STR property,
            validate your revenue projections with real Airbnb market data — occupancy rates, average daily rates, and seasonal patterns by ZIP code.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <a href="https://rabbu.com/airbnb-calculator" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 hover:bg-blue-500/20 transition-colors group">
              <Calculator className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
              <div>
                <div className="text-sm font-semibold text-blue-300">Airbnb Calculator</div>
                <div className="text-xs text-gray-400">Enter any address → get revenue estimates</div>
              </div>
            </a>
            <a href="https://rabbu.com/airbnb-data" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 hover:bg-blue-500/20 transition-colors group">
              <BarChart3 className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
              <div>
                <div className="text-sm font-semibold text-blue-300">Market Data</div>
                <div className="text-xs text-gray-400">Occupancy, ADR & revenue by ZIP code</div>
              </div>
            </a>
            <a href="https://rabbu.com/blog/short-term-rental-spreadsheet" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 hover:bg-blue-500/20 transition-colors group">
              <Table2 className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
              <div>
                <div className="text-sm font-semibold text-blue-300">STR Spreadsheet</div>
                <div className="text-xs text-gray-400">Free analysis template for STR investments</div>
              </div>
            </a>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/10">
            <p className="text-xs text-gray-400">
              <strong className="text-blue-300">Why This Matters:</strong> STR revenue varies dramatically by market.
              A 3-bedroom in Scottsdale averages $4,200/mo while the same property in rural Ohio might earn $1,100/mo.
              Rabbu's data covers 650+ U.S. markets with weekly-updated occupancy rates, ADR, and revenue estimates.
              Use it to confirm the gross income assumptions in this model before committing capital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function STRStrategy() {
  const [, navigate] = useLocation();

  const [inputs, setInputs] = useState({
    // Client
    grossIncome: 500000,
    taxBracket: 0.37,
    stateTaxRate: 0.05,
    clientAge: 40,
    filingStatus: "married",

    // STR Property
    propertyValue: 500000,
    downPaymentPct: 0.25,
    mortgageRate: 0.07,
    mortgageTermYears: 30,
    propertyAppreciation: 0.05,

    // STR Revenue
    grossRentPctOfValue: 0.12, // annual gross rent as % of property value (STR premium)
    occupancyRate: 0.72,
    avgDailyRate: 250,
    operatingExpensePct: 0.35, // % of gross rent for all operating expenses
    managementFeePct: 0.20, // STR management is higher than LTR

    // Cost Segregation
    costSegStudyCost: 8000,
    bonusDepreciationPct: 0.60, // 2026 rate (was 100% through 2022, phasing down)
    buildingPct: 0.80, // % of property that's depreciable (excl. land)

    // Acquisition Strategy
    propertiesPerYear: 1,
    maxProperties: 10,
    projectionYears: 30,
    reinvestTaxSavings: true,

    // IUL Integration
    useIUL: true,
    iulPremiumFromSavings: 0.30, // % of tax savings going to IUL
    iulCreditRate: 0.075,
  });

  const [activeTab, setActiveTab] = useState<"overview" | "costseg" | "yearly" | "portfolio" | "charts">("overview");
  const [showCostSegDetail, setShowCostSegDetail] = useState(false);

  const updateInput = useCallback((key: string, value: number | boolean) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  // ─── 30-YEAR PROJECTION ENGINE ─────────────────────────────────
  const projection = useMemo(() => {
    const years: any[] = [];
    let properties: { id: number; year: number; value: number; currentValue: number; loanBalance: number; monthlyPayment: number; costSegDone: boolean; yr1BonusDeduction: number; annualDepreciation: number; }[] = [];
    let iulCashValue = 0;
    let totalTaxSaved = 0;
    let totalRentalIncome = 0;
    let totalOperatingCosts = 0;
    let cumulativeDeductions = 0;
    let cashAvailable = inputs.propertyValue * inputs.downPaymentPct; // Starting capital

    const monthlyRate = inputs.mortgageRate / 12;
    const totalPayments = inputs.mortgageTermYears * 12;

    for (let year = 1; year <= inputs.projectionYears; year++) {
      const income = inputs.grossIncome;
      const combinedTaxRate = inputs.taxBracket + inputs.stateTaxRate;

      // ─── ACQUIRE NEW PROPERTIES ─────────────────────────────
      let newPropertiesThisYear = 0;
      const targetNew = Math.min(inputs.propertiesPerYear, inputs.maxProperties - properties.length);

      for (let p = 0; p < targetNew; p++) {
        const propValue = inputs.propertyValue * Math.pow(1 + inputs.propertyAppreciation, year - 1);
        const downPayment = propValue * inputs.downPaymentPct;
        const loanAmount = propValue - downPayment;
        const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);

        // Cost segregation year-1 bonus depreciation
        const depreciableBasis = propValue * inputs.buildingPct;
        const acceleratedPortion = depreciableBasis * 0.35; // ~35% can be reclassified to shorter lives
        const yr1BonusDeduction = acceleratedPortion * inputs.bonusDepreciationPct;
        const remainingDepreciable = depreciableBasis - acceleratedPortion;
        const annualDepreciation = remainingDepreciable / 27.5;

        properties.push({
          id: properties.length + 1,
          year,
          value: propValue,
          currentValue: propValue,
          loanBalance: loanAmount,
          monthlyPayment,
          costSegDone: true,
          yr1BonusDeduction,
          annualDepreciation,
        });

        newPropertiesThisYear++;
      }

      // ─── PROPERTY APPRECIATION ──────────────────────────────
      for (const prop of properties) {
        prop.currentValue *= (1 + inputs.propertyAppreciation);
        // Mortgage paydown
        const annualInterest = prop.loanBalance * inputs.mortgageRate;
        const annualPayment = prop.monthlyPayment * 12;
        const principalPaydown = Math.min(annualPayment - annualInterest, prop.loanBalance);
        prop.loanBalance = Math.max(0, prop.loanBalance - principalPaydown);
      }

      // ─── RENTAL INCOME ──────────────────────────────────────
      let yearGrossRent = 0;
      let yearOperatingCosts = 0;
      let yearNetRent = 0;
      let yearMortgagePayments = 0;

      for (const prop of properties) {
        const grossRent = prop.currentValue * inputs.grossRentPctOfValue * inputs.occupancyRate;
        const opCosts = grossRent * inputs.operatingExpensePct;
        const mgmtFee = grossRent * inputs.managementFeePct;
        const mortgage = prop.monthlyPayment * 12;

        yearGrossRent += grossRent;
        yearOperatingCosts += opCosts + mgmtFee;
        yearMortgagePayments += mortgage;
        yearNetRent += grossRent - opCosts - mgmtFee - mortgage;
      }

      totalRentalIncome += yearGrossRent;
      totalOperatingCosts += yearOperatingCosts;

      // ─── DEPRECIATION & TAX DEDUCTIONS ──────────────────────
      let yearDepreciation = 0;
      let yearBonusDepreciation = 0;

      for (const prop of properties) {
        // Year-1 bonus depreciation for newly acquired properties
        if (prop.year === year) {
          yearBonusDepreciation += prop.yr1BonusDeduction;
        }
        // Ongoing annual depreciation for all properties
        yearDepreciation += prop.annualDepreciation;
      }

      const totalDepreciation = yearDepreciation + yearBonusDepreciation;

      // Mortgage interest deduction
      const yearMortgageInterest = properties.reduce((sum, p) => sum + p.loanBalance * inputs.mortgageRate, 0);

      // Property tax deduction (capped at $10K SALT for married filing jointly)
      const yearPropertyTax = properties.reduce((sum, p) => sum + p.currentValue * 0.012, 0);
      const saltDeduction = Math.min(yearPropertyTax, 10000);

      // Total deductions
      const yearTotalDeductions = totalDepreciation + yearMortgageInterest + saltDeduction;
      cumulativeDeductions += yearTotalDeductions;

      // Tax impact
      const taxableIncomeWithout = income;
      const taxableIncomeWith = Math.max(0, income - yearTotalDeductions);
      const taxWithout = taxableIncomeWithout * combinedTaxRate;
      const taxWith = taxableIncomeWith * combinedTaxRate;
      const yearTaxSaved = taxWithout - taxWith;
      totalTaxSaved += yearTaxSaved;

      const effectiveTaxRate = taxWith / income;

      // ─── IUL INTEGRATION ────────────────────────────────────
      let iulPremium = 0;
      let iulCredit = 0;
      if (inputs.useIUL) {
        iulPremium = yearTaxSaved * inputs.iulPremiumFromSavings;
        iulCashValue += iulPremium;
        iulCredit = iulCashValue * inputs.iulCreditRate;
        iulCashValue += iulCredit;
      }

      // ─── NET WORTH ──────────────────────────────────────────
      const totalPropertyValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
      const totalDebt = properties.reduce((sum, p) => sum + p.loanBalance, 0);
      const totalEquity = totalPropertyValue - totalDebt;
      const netWorth = totalEquity + iulCashValue + (inputs.reinvestTaxSavings ? 0 : totalTaxSaved * 0.5);

      years.push({
        year,
        age: inputs.clientAge + year,
        propertyCount: properties.length,
        newProperties: newPropertiesThisYear,
        grossIncome: income,
        yearGrossRent: Math.round(yearGrossRent),
        yearOperatingCosts: Math.round(yearOperatingCosts),
        yearMortgagePayments: Math.round(yearMortgagePayments),
        yearMortgageInterest: Math.round(yearMortgageInterest),
        yearNetRent: Math.round(yearNetRent),
        yearDepreciation: Math.round(yearDepreciation),
        yearBonusDepreciation: Math.round(yearBonusDepreciation),
        totalDepreciation: Math.round(totalDepreciation),
        yearMortgageInterestDeduction: Math.round(yearMortgageInterest),
        saltDeduction: Math.round(saltDeduction),
        yearTotalDeductions: Math.round(yearTotalDeductions),
        taxableIncomeWithout: Math.round(taxableIncomeWithout),
        taxableIncomeWith: Math.round(taxableIncomeWith),
        taxWithout: Math.round(taxWithout),
        taxWith: Math.round(taxWith),
        yearTaxSaved: Math.round(yearTaxSaved),
        cumulativeTaxSaved: Math.round(totalTaxSaved),
        effectiveTaxRate,
        totalPropertyValue: Math.round(totalPropertyValue),
        totalDebt: Math.round(totalDebt),
        totalEquity: Math.round(totalEquity),
        iulPremium: Math.round(iulPremium),
        iulCredit: Math.round(iulCredit),
        iulCashValue: Math.round(iulCashValue),
        netWorth: Math.round(netWorth),
      });
    }

    const finalYear = years[years.length - 1];
    return {
      years,
      properties,
      summary: {
        totalProperties: properties.length,
        totalPropertyValue: finalYear?.totalPropertyValue || 0,
        totalEquity: finalYear?.totalEquity || 0,
        totalDebt: finalYear?.totalDebt || 0,
        iulCashValue: finalYear?.iulCashValue || 0,
        netWorth: finalYear?.netWorth || 0,
        totalTaxSaved,
        totalRentalIncome,
        totalOperatingCosts,
        cumulativeDeductions,
        finalEffectiveTaxRate: finalYear?.effectiveTaxRate || 0,
      },
    };
  }, [inputs]);

  // ─── COST SEGREGATION BREAKDOWN FOR SINGLE PROPERTY ────────────
  const costSegBreakdown = useMemo(() => {
    const depreciableBasis = inputs.propertyValue * inputs.buildingPct;
    return COST_SEG_CATEGORIES.map(cat => {
      const amount = inputs.propertyValue * cat.pct;
      const depreciable = cat.years > 0;
      const yr1Deduction = depreciable
        ? (cat.years <= 15 ? amount * inputs.bonusDepreciationPct : amount / cat.years)
        : 0;
      return {
        ...cat,
        amount: Math.round(amount),
        yr1Deduction: Math.round(yr1Deduction),
        depreciable,
      };
    });
  }, [inputs.propertyValue, inputs.buildingPct, inputs.bonusDepreciationPct]);

  const totalYr1Deduction = costSegBreakdown.reduce((sum, c) => sum + c.yr1Deduction, 0);
  const totalYr1TaxSavings = totalYr1Deduction * (inputs.taxBracket + inputs.stateTaxRate);

  // ─── INPUT FIELD ───────────────────────────────────────────────
  const InputField = ({ label, value, onChange, prefix = "$", suffix = "", step = 1000, min = 0, max = 100000000, tooltip = "" }: any) => (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 flex items-center gap-1">
        {label}
        {tooltip && (
          <span className="group relative">
            <Info className="w-3 h-3 text-gray-500" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-[10px] text-gray-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">{tooltip}</span>
          </span>
        )}
      </label>
      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        {prefix && <span className="text-xs text-gray-500 pl-2">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          step={step}
          min={min}
          max={max}
          className="w-full bg-transparent text-white text-sm px-2 py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-xs text-gray-500 pr-2">{suffix}</span>}
      </div>
    </div>
  );

  const PctField = ({ label, value, onChange, tooltip = "" }: any) => (
    <InputField label={label} value={(value * 100).toFixed(1)} onChange={(v: number) => onChange(v / 100)} prefix="" suffix="%" step={0.1} min={0} max={100} tooltip={tooltip} />
  );

  const COLORS = {
    property: "#10b981", iul: "#3b82f6", equity: "#f59e0b",
    debt: "#ef4444", tax: "#f97316", rental: "#22c55e",
    deduction: "#8b5cf6", savings: "#14b8a6",
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-[#0a0e17]/95 backdrop-blur-xl border-b border-orange-500/20">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/portal/dashboard")} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Hammer className="w-5 h-5 text-orange-400" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                  SHORT-TERM RENTAL TAX STRATEGY
                </h1>
                <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full font-bold">ZERO TAX ENGINE</span>
              </div>
              <p className="text-[10px] text-gray-500">Cost Segregation + Bonus Depreciation + STR Loophole = $0 Federal Tax on $500K+ Income</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Effective Tax Rate</div>
              <div className="text-lg font-bold text-emerald-400">{(projection.summary.finalEffectiveTaxRate * 100).toFixed(1)}%</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Total Tax Saved</div>
              <div className="text-lg font-bold text-orange-400">{fmt(projection.summary.totalTaxSaved)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-6 space-y-6">
        {/* RABBU SECTION */}
        <RabbuSection />

        {/* THE STR TAX LOOPHOLE EXPLAINER */}
        <div className="bg-gradient-to-r from-orange-900/20 via-amber-900/20 to-yellow-900/20 border border-orange-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-orange-300 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" /> The Short-Term Rental Tax Loophole
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/5 rounded-xl p-4 border border-orange-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Hammer className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-orange-300">1. Cost Segregation Study</h3>
              </div>
              <p className="text-xs text-gray-300">
                An engineering-based study reclassifies 25-35% of your building into 5, 7, and 15-year property categories
                instead of the standard 27.5-year schedule. This accelerates depreciation massively.
              </p>
              <div className="text-[10px] text-gray-500 mt-2">IRC §168(a), Treasury Reg. §1.167(a)-11</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-orange-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300">2. Bonus Depreciation</h3>
              </div>
              <p className="text-xs text-gray-300">
                Under IRC §168(k), the reclassified short-life components qualify for bonus depreciation — currently 60% in 2026
                (was 100% through 2022, phasing down 20% per year). This creates a massive year-1 deduction.
              </p>
              <div className="text-[10px] text-gray-500 mt-2">IRC §168(k), Tax Cuts and Jobs Act §13201</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-orange-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-bold text-yellow-300">3. STR Material Participation</h3>
              </div>
              <p className="text-xs text-gray-300">
                The key: if your average rental period is 7 days or less AND you materially participate (100+ hours, more than anyone else),
                the losses are NOT limited by passive activity rules. They offset W-2 and active income directly.
              </p>
              <div className="text-[10px] text-gray-500 mt-2">IRC §469(c)(7), Reg. §1.469-1T(e)(3)(ii)(A)</div>
            </div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <p className="text-xs text-gray-300">
              <strong className="text-orange-300">Why STR and Not Long-Term Rental:</strong> Long-term rental losses are passive and can only offset passive income
              (unless you're a Real Estate Professional under IRC §469(c)(7)). Short-term rentals with average stays of 7 days or less are NOT classified as rental
              activities — they're treated as active businesses. This means the depreciation losses can offset your W-2 income, 1099 income, and business income directly.
              A $500K earner can potentially reduce their federal tax bill to $0.
            </p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Properties", value: projection.summary.totalProperties.toString(), color: "#14b8a6" },
            { label: "Property Value", value: fmt(projection.summary.totalPropertyValue), color: "#10b981" },
            { label: "Total Equity", value: fmt(projection.summary.totalEquity), color: "#f59e0b" },
            { label: "IUL Cash Value", value: fmt(projection.summary.iulCashValue), color: "#3b82f6" },
            { label: "Net Worth", value: fmt(projection.summary.netWorth), color: "#10b981" },
            { label: "Total Tax Saved", value: fmt(projection.summary.totalTaxSaved), color: "#f97316" },
            { label: "Total Rental Income", value: fmt(projection.summary.totalRentalIncome), color: "#22c55e" },
            { label: "Effective Tax Rate", value: `${(projection.summary.finalEffectiveTaxRate * 100).toFixed(1)}%`, color: "#ef4444" },
          ].map((card) => (
            <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-3" style={{ borderColor: `${card.color}30` }}>
              <div className="text-[10px] text-gray-400">{card.label}</div>
              <div className="text-sm font-bold" style={{ color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview & Inputs", icon: Calculator },
            { id: "costseg", label: "Cost Segregation", icon: Hammer },
            { id: "charts", label: "Growth Charts", icon: BarChart3 },
            { id: "yearly", label: "Year-by-Year Projection", icon: Table2 },
            { id: "portfolio", label: "Property Portfolio", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── OVERVIEW TAB ──────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" /> Client Profile
                </h3>
                <div className="space-y-3">
                  <InputField label="Gross Income (W-2 or Business)" value={inputs.grossIncome} onChange={(v: number) => updateInput("grossIncome", v)} />
                  <PctField label="Federal Tax Bracket" value={inputs.taxBracket} onChange={(v: number) => updateInput("taxBracket", v)} />
                  <PctField label="State Tax Rate" value={inputs.stateTaxRate} onChange={(v: number) => updateInput("stateTaxRate", v)} />
                  <InputField label="Client Age" value={inputs.clientAge} onChange={(v: number) => updateInput("clientAge", v)} prefix="" step={1} />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-400" /> STR Property
                </h3>
                <div className="space-y-3">
                  <InputField label="Property Value" value={inputs.propertyValue} onChange={(v: number) => updateInput("propertyValue", v)} />
                  <PctField label="Down Payment %" value={inputs.downPaymentPct} onChange={(v: number) => updateInput("downPaymentPct", v)} />
                  <PctField label="Mortgage Rate" value={inputs.mortgageRate} onChange={(v: number) => updateInput("mortgageRate", v)} />
                  <PctField label="Property Appreciation" value={inputs.propertyAppreciation} onChange={(v: number) => updateInput("propertyAppreciation", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-green-400" /> STR Revenue
                </h3>
                <div className="space-y-3">
                  <PctField label="Gross Rent (% of Property Value/yr)" value={inputs.grossRentPctOfValue} onChange={(v: number) => updateInput("grossRentPctOfValue", v)} tooltip="STR typically 10-15% of value" />
                  <PctField label="Occupancy Rate" value={inputs.occupancyRate} onChange={(v: number) => updateInput("occupancyRate", v)} />
                  <PctField label="Operating Expenses (% of Gross)" value={inputs.operatingExpensePct} onChange={(v: number) => updateInput("operatingExpensePct", v)} tooltip="Cleaning, supplies, utilities, repairs, etc." />
                  <PctField label="Management Fee (% of Gross)" value={inputs.managementFeePct} onChange={(v: number) => updateInput("managementFeePct", v)} tooltip="STR management typically 15-25%" />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-orange-400" /> Cost Segregation
                </h3>
                <div className="space-y-3">
                  <InputField label="Cost Seg Study Cost" value={inputs.costSegStudyCost} onChange={(v: number) => updateInput("costSegStudyCost", v)} />
                  <PctField label="Bonus Depreciation Rate (2026)" value={inputs.bonusDepreciationPct} onChange={(v: number) => updateInput("bonusDepreciationPct", v)} tooltip="60% in 2026, was 100% in 2022" />
                  <PctField label="Depreciable % (excl. land)" value={inputs.buildingPct} onChange={(v: number) => updateInput("buildingPct", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-400" /> Acquisition Strategy
                </h3>
                <div className="space-y-3">
                  <InputField label="Properties Per Year" value={inputs.propertiesPerYear} onChange={(v: number) => updateInput("propertiesPerYear", v)} prefix="" step={1} />
                  <InputField label="Max Properties" value={inputs.maxProperties} onChange={(v: number) => updateInput("maxProperties", v)} prefix="" step={1} />
                  <InputField label="Projection Years" value={inputs.projectionYears} onChange={(v: number) => updateInput("projectionYears", v)} prefix="" step={5} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Reinvest Tax Savings</span>
                    <button onClick={() => updateInput("reinvestTaxSavings", !inputs.reinvestTaxSavings)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${inputs.reinvestTaxSavings ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-gray-400 border border-white/10"}`}>
                      {inputs.reinvestTaxSavings ? "Yes" : "No"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" /> IUL Integration
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Fund IUL from Tax Savings</span>
                    <button onClick={() => updateInput("useIUL", !inputs.useIUL)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${inputs.useIUL ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-gray-400 border border-white/10"}`}>
                      {inputs.useIUL ? "Active" : "Off"}
                    </button>
                  </div>
                  {inputs.useIUL && (
                    <>
                      <PctField label="% of Tax Savings → IUL" value={inputs.iulPremiumFromSavings} onChange={(v: number) => updateInput("iulPremiumFromSavings", v)} />
                      <PctField label="IUL Credit Rate" value={inputs.iulCreditRate} onChange={(v: number) => updateInput("iulCreditRate", v)} />
                    </>
                  )}
                </div>
              </div>

              {/* Quick Impact Card */}
              <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-300 mb-2">Year 1 Impact</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Year 1 Deduction</span>
                    <span className="text-emerald-300 font-bold">{fmtFull(totalYr1Deduction)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Year 1 Tax Savings</span>
                    <span className="text-orange-300 font-bold">{fmtFull(totalYr1TaxSavings)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Cost Seg Study Cost</span>
                    <span className="text-red-300">{fmtFull(inputs.costSegStudyCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-white/10 pt-2">
                    <span className="text-gray-400">Net ROI on Study</span>
                    <span className="text-emerald-400 font-bold">{((totalYr1TaxSavings / inputs.costSegStudyCost - 1) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── COST SEGREGATION TAB ──────────────────────────────── */}
        {activeTab === "costseg" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Breakdown Table */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-orange-400" /> Cost Segregation Breakdown — {fmtFull(inputs.propertyValue)} Property
                </h3>
                <div className="space-y-3">
                  {costSegBreakdown.map((cat) => (
                    <div key={cat.name} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-xs font-bold text-white">{cat.name}</span>
                        </div>
                        <span className="text-xs text-gray-300">{fmtFull(cat.amount)} ({(cat.pct * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">{cat.desc}</span>
                        <span className="text-xs font-bold" style={{ color: cat.yr1Deduction > 0 ? "#f97316" : "#64748b" }}>
                          {cat.yr1Deduction > 0 ? `Yr1: ${fmtFull(cat.yr1Deduction)}` : "N/A"}
                        </span>
                      </div>
                      {cat.depreciable && (
                        <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (cat.yr1Deduction / cat.amount) * 100)}%`, backgroundColor: cat.color }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-300 font-bold">Total Year 1 Deduction</span>
                    <span className="text-orange-300 font-bold">{fmtFull(totalYr1Deduction)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-emerald-300 font-bold">Tax Savings at {((inputs.taxBracket + inputs.stateTaxRate) * 100).toFixed(0)}%</span>
                    <span className="text-emerald-300 font-bold">{fmtFull(totalYr1TaxSavings)}</span>
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Property Value Allocation</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costSegBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="amount"
                      nameKey="name"
                      label={({ name, pct }) => `${name}: ${(pct * 100).toFixed(0)}%`}
                    >
                      {costSegBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Without vs With Cost Seg */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-gray-400">Without Cost Seg</div>
                    <div className="text-xs text-gray-300">Standard 27.5-year depreciation</div>
                    <div className="text-lg font-bold text-red-400">{fmtFull(inputs.propertyValue * inputs.buildingPct / 27.5)}/yr</div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-gray-400">With Cost Seg + Bonus</div>
                    <div className="text-xs text-gray-300">Year 1 accelerated deduction</div>
                    <div className="text-lg font-bold text-emerald-400">{fmtFull(totalYr1Deduction)}</div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs text-amber-300 font-bold">
                    {((totalYr1Deduction / (inputs.propertyValue * inputs.buildingPct / 27.5)) ).toFixed(1)}x more deduction in Year 1
                  </span>
                </div>
              </div>
            </div>

            {/* Bonus Depreciation Phase-Down Schedule */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Bonus Depreciation Phase-Down Schedule (IRC §168(k))</h3>
              <div className="grid grid-cols-6 gap-3">
                {[
                  { year: "2022", pct: 100, status: "past" },
                  { year: "2023", pct: 80, status: "past" },
                  { year: "2024", pct: 60, status: "past" },
                  { year: "2025", pct: 40, status: "past" },
                  { year: "2026", pct: 20, status: "current" },
                  { year: "2027+", pct: 0, status: "future" },
                ].map((item) => (
                  <div key={item.year} className={`rounded-lg p-3 text-center border ${item.status === "current" ? "bg-orange-500/20 border-orange-500/30" : item.status === "past" ? "bg-white/5 border-white/10" : "bg-red-500/10 border-red-500/20"}`}>
                    <div className="text-xs font-bold text-white">{item.year}</div>
                    <div className={`text-lg font-bold ${item.status === "current" ? "text-orange-400" : item.pct > 0 ? "text-gray-300" : "text-red-400"}`}>{item.pct}%</div>
                    {item.status === "current" && <div className="text-[9px] text-orange-300">CURRENT</div>}
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-200">
                  <strong>Act Now:</strong> Bonus depreciation is phasing down 20% per year. In 2026, you get 60% bonus depreciation.
                  By 2027, it drops to 0% unless Congress extends it. Every year you wait costs you 20% of the accelerated deduction.
                  On a $500K property, that's ~{fmtFull(inputs.propertyValue * inputs.buildingPct * 0.35 * 0.20)} less in year-1 deductions per year of delay.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── CHARTS TAB ────────────────────────────────────────── */}
        {activeTab === "charts" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Tax Paid: Without STR Strategy vs With STR Strategy</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={projection.years}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Bar dataKey="taxWithout" name="Tax Without Strategy" fill="#ef4444" opacity={0.6} />
                  <Bar dataKey="taxWith" name="Tax With STR Strategy" fill="#10b981" />
                  <Line type="monotone" dataKey="yearTaxSaved" name="Annual Tax Saved" stroke="#f97316" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Cumulative Tax Savings</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={projection.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="cumulativeTaxSaved" name="Cumulative Tax Saved" fill={COLORS.tax} stroke={COLORS.tax} fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Net Worth Growth</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={projection.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Legend />
                    <Area type="monotone" dataKey="totalEquity" name="Property Equity" stackId="1" fill={COLORS.equity} stroke={COLORS.equity} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="iulCashValue" name="IUL Cash Value" stackId="1" fill={COLORS.iul} stroke={COLORS.iul} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Effective Tax Rate Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projection.years}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, 0.5]} />
                  <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="effectiveTaxRate" name="Effective Tax Rate" stroke="#ef4444" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ─── YEARLY PROJECTION TABLE ───────────────────────────── */}
        {activeTab === "yearly" && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Table2 className="w-4 h-4 text-orange-400" /> Year-by-Year STR Tax Strategy Projection
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-2 py-2 text-left text-gray-400 sticky left-0 bg-[#0f1520] z-10">Yr</th>
                    <th className="px-2 py-2 text-right text-gray-400">#Props</th>
                    <th className="px-2 py-2 text-right text-green-400">Gross Rent</th>
                    <th className="px-2 py-2 text-right text-red-300">Op Costs</th>
                    <th className="px-2 py-2 text-right text-purple-400">Net Rent</th>
                    <th className="px-2 py-2 text-right text-orange-400">Depreciation</th>
                    <th className="px-2 py-2 text-right text-orange-300">Bonus Depr</th>
                    <th className="px-2 py-2 text-right text-amber-400">Total Deductions</th>
                    <th className="px-2 py-2 text-right text-gray-300">Taxable W/O</th>
                    <th className="px-2 py-2 text-right text-emerald-400">Taxable With</th>
                    <th className="px-2 py-2 text-right text-red-400">Tax W/O</th>
                    <th className="px-2 py-2 text-right text-emerald-400">Tax With</th>
                    <th className="px-2 py-2 text-right text-orange-400 font-bold">Tax Saved</th>
                    <th className="px-2 py-2 text-right text-blue-400">IUL CV</th>
                    <th className="px-2 py-2 text-right text-emerald-400 font-bold">Net Worth</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.years.map((y) => (
                    <tr key={y.year} className={`border-t border-white/5 hover:bg-white/5 ${y.newProperties > 0 ? "bg-orange-500/5" : ""}`}>
                      <td className="px-2 py-1.5 text-white font-medium sticky left-0 bg-[#0a0e17] z-10">{y.year}</td>
                      <td className="px-2 py-1.5 text-right text-white">
                        {y.propertyCount}
                        {y.newProperties > 0 && <span className="ml-1 text-orange-400 text-[9px]">+{y.newProperties}</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right text-green-300">{fmt(y.yearGrossRent)}</td>
                      <td className="px-2 py-1.5 text-right text-red-200">{fmt(y.yearOperatingCosts)}</td>
                      <td className="px-2 py-1.5 text-right" style={{ color: y.yearNetRent >= 0 ? "#a78bfa" : "#f87171" }}>{fmt(y.yearNetRent)}</td>
                      <td className="px-2 py-1.5 text-right text-orange-300">{fmt(y.yearDepreciation)}</td>
                      <td className="px-2 py-1.5 text-right text-orange-200">{fmt(y.yearBonusDepreciation)}</td>
                      <td className="px-2 py-1.5 text-right text-amber-300">{fmt(y.yearTotalDeductions)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-300">{fmt(y.taxableIncomeWithout)}</td>
                      <td className="px-2 py-1.5 text-right text-emerald-300">{fmt(y.taxableIncomeWith)}</td>
                      <td className="px-2 py-1.5 text-right text-red-300">{fmt(y.taxWithout)}</td>
                      <td className="px-2 py-1.5 text-right text-emerald-300">{fmt(y.taxWith)}</td>
                      <td className="px-2 py-1.5 text-right text-orange-300 font-bold">{fmt(y.yearTaxSaved)}</td>
                      <td className="px-2 py-1.5 text-right text-blue-300">{fmt(y.iulCashValue)}</td>
                      <td className="px-2 py-1.5 text-right text-emerald-300 font-bold">{fmt(y.netWorth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── PORTFOLIO TAB ─────────────────────────────────────── */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projection.properties.map((prop) => {
                const appreciation = ((prop.currentValue - prop.value) / prop.value * 100).toFixed(1);
                const equity = prop.currentValue - prop.loanBalance;
                const grossRent = prop.currentValue * inputs.grossRentPctOfValue * inputs.occupancyRate;
                const netRent = grossRent * (1 - inputs.operatingExpensePct - inputs.managementFeePct) - prop.monthlyPayment * 12;

                return (
                  <div key={prop.id} className="bg-gradient-to-br from-orange-900/20 to-amber-900/10 border border-orange-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <Home className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">STR Property #{prop.id}</div>
                          <div className="text-[10px] text-gray-400">Acquired Year {prop.year}</div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold">+{appreciation}%</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: "Purchase Price", value: fmtFull(prop.value), color: "text-gray-300" },
                        { label: "Current Value", value: fmtFull(prop.currentValue), color: "text-emerald-300" },
                        { label: "Loan Balance", value: fmtFull(prop.loanBalance), color: "text-red-300" },
                        { label: "Equity", value: fmtFull(equity), color: "text-amber-300 font-bold" },
                        { label: "Annual Gross Rent", value: fmtFull(grossRent), color: "text-green-300" },
                        { label: "Annual Net Cash Flow", value: fmtFull(netRent), color: netRent >= 0 ? "text-emerald-300" : "text-red-300" },
                        { label: "Yr1 Bonus Deduction", value: fmtFull(prop.yr1BonusDeduction), color: "text-orange-300" },
                        { label: "Annual Depreciation", value: fmtFull(prop.annualDepreciation), color: "text-orange-200" },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between text-xs">
                          <span className="text-gray-400">{row.label}</span>
                          <span className={row.color}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* IRS CODE REFERENCE */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-3">IRS Code References</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              { code: "§168(a)", desc: "General depreciation rules" },
              { code: "§168(k)", desc: "Bonus depreciation" },
              { code: "§179", desc: "Expensing election" },
              { code: "§469(c)(7)", desc: "Real estate professional" },
              { code: "§469-1T(e)(3)", desc: "STR material participation" },
              { code: "§280A(g)", desc: "Augusta Rule (14-day)" },
              { code: "§1031", desc: "Like-kind exchange" },
              { code: "§199A", desc: "QBI deduction (20%)" },
              { code: "§121", desc: "Primary residence exclusion" },
              { code: "§1014", desc: "Step-up in basis" },
              { code: "§263(c)", desc: "Intangible drilling costs" },
              { code: "§613", desc: "Depletion allowance" },
            ].map((ref) => (
              <div key={ref.code} className="bg-white/5 rounded-lg p-2">
                <div className="text-[10px] font-bold text-orange-400">{ref.code}</div>
                <div className="text-[9px] text-gray-500">{ref.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
