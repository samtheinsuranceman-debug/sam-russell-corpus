import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Home, Building2, TrendingUp, DollarSign, Shield,
  ChevronDown, ChevronUp, Info, Zap, Lock, Unlock, Plus, Minus,
  Calculator, BarChart3, PieChart as PieChartIcon, Table2,
  Gift, Users, Baby, Landmark, Scale, ArrowRight, ExternalLink,
  RefreshCw, Layers, Target, Crown, AlertTriangle, CheckCircle2,
  MapPin, Calendar, Percent, Banknote, Wallet, TrendingDown,
  Clock, Rewind, FastForward, Eye, EyeOff,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Cell, PieChart, Pie,
} from "recharts";

// ─── CONSTANTS ─────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ─── GENERATIONAL TRANSFER STRATEGIES ──────────────────────────────
const TRANSFER_STRATEGIES = [
  {
    id: "step-up",
    name: "Step-Up in Basis at Death",
    icon: Crown,
    color: "amber",
    irsCode: "IRC §1014",
    description: "Hold properties until death. Heirs receive a stepped-up cost basis equal to fair market value at date of death, eliminating all accumulated capital gains.",
    taxSavings: "Eliminates 100% of capital gains tax on appreciation",
    bestFor: "Clients who plan to hold properties long-term and want maximum tax elimination",
    howItWorks: [
      "You purchase properties at $300K each over your lifetime",
      "Properties appreciate to $800K+ each over decades",
      "At death, heirs inherit at current FMV — $800K basis, not $300K",
      "If they sell immediately, capital gains tax = $0",
      "Combined with IUL death benefit to cover any estate tax exposure",
    ],
  },
  {
    id: "qprt",
    name: "Qualified Personal Residence Trust (QPRT)",
    icon: Home,
    color: "blue",
    irsCode: "IRC §2702",
    description: "Transfer your primary residence or vacation home to an irrevocable trust while retaining the right to live in it for a specified term. The gift value is deeply discounted.",
    taxSavings: "Reduces gift tax value by 40-70% depending on term and interest rates",
    bestFor: "Transferring high-value personal residences to children at a fraction of the gift tax cost",
    howItWorks: [
      "Transfer home worth $1.5M into QPRT with 15-year retained interest",
      "Gift tax value: ~$450K (70% discount) instead of $1.5M",
      "You continue living in the home for 15 years rent-free",
      "After the term, property passes to children outside your estate",
      "All future appreciation ($2.5M+) transfers tax-free",
    ],
  },
  {
    id: "idgt",
    name: "Installment Sale to Intentionally Defective Grantor Trust (IDGT)",
    icon: Scale,
    color: "purple",
    irsCode: "IRC §§671-679, §453",
    description: "Sell appreciated properties to a grantor trust in exchange for an installment note. Not a taxable event because the trust is 'you' for income tax purposes. Freezes estate value.",
    taxSavings: "Removes all future appreciation from estate; no capital gains on sale",
    bestFor: "High-net-worth clients with rapidly appreciating real estate portfolios",
    howItWorks: [
      "Create IDGT and seed it with 10% of sale price (e.g., $100K gift)",
      "Sell $1M property to IDGT for installment note at AFR rate (~4.6%)",
      "Trust makes payments from rental income — you receive $46K/yr",
      "Property appreciates inside trust — all growth bypasses your estate",
      "At death, trust assets pass to beneficiaries free of estate tax",
    ],
  },
  {
    id: "1031",
    name: "1031 Exchange Chain → Dynasty Trust",
    icon: RefreshCw,
    color: "teal",
    irsCode: "IRC §1031, §2601",
    description: "Defer capital gains indefinitely by exchanging properties into larger assets. Eventually transfer into a dynasty trust that lasts for generations, avoiding estate tax at each generation.",
    taxSavings: "Defers 100% of capital gains + eliminates estate tax for multiple generations",
    bestFor: "Clients building a multi-generational real estate empire",
    howItWorks: [
      "Exchange 3 smaller properties ($400K each) into one $1.2M property via 1031",
      "Continue exchanging up — $1.2M → $2.5M → $5M over decades",
      "All capital gains deferred through each exchange (never pay tax on appreciation)",
      "Transfer final properties into dynasty trust — bypasses estate tax for 100+ years",
      "Combine with step-up in basis: if you die holding the exchanged property, all deferred gains vanish",
    ],
  },
  {
    id: "crt",
    name: "Charitable Remainder Trust (CRT) + IUL Wealth Replacement",
    icon: Gift,
    color: "emerald",
    irsCode: "IRC §664, §170",
    description: "Sell appreciated properties through a CRT — no capital gains tax. Receive lifetime income from the trust. Use IUL death benefit to replace the charitable gift for your heirs.",
    taxSavings: "Eliminates capital gains + provides income tax deduction + lifetime income stream",
    bestFor: "Clients who want to sell properties, avoid capital gains, and still leave an inheritance",
    howItWorks: [
      "Transfer $2M in appreciated property to CRT (basis: $600K, gain: $1.4M)",
      "CRT sells property for $2M — pays $0 capital gains tax",
      "You receive 5% annual income = $100K/yr for life",
      "Immediate charitable deduction of ~$600K (reduces current year taxes)",
      "IUL death benefit of $2M+ replaces the charitable gift — heirs receive full inheritance tax-free",
    ],
  },
];

// ─── RABBU SECTION ─────────────────────────────────────────────────
function RabbuSection() {
  return (
    <div className="bg-gradient-to-r from-emerald-900/20 via-teal-900/20 to-cyan-900/20 border border-emerald-500/20 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <MapPin className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-white mb-1">
            Validate Your Numbers with Real Market Data{" "}
            <a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
              Rabbu.com <ExternalLink className="w-3 h-3" />
            </a>
          </h3>
          <p className="text-xs text-gray-300">
            <a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Rabbu.com</a> is the leading Airbnb marketplace and analytics platform used by over 650,000 real estate investors. Before committing to any property acquisition cycle, validate your rental income assumptions with real market data.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <a href="https://www.rabbu.com/airbnb-calculator" target="_blank" rel="noopener noreferrer" className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors border border-white/5">
          <div className="text-xs font-bold text-emerald-300 mb-1">Airbnb Calculator</div>
          <div className="text-[10px] text-gray-400">Enter any address → get revenue estimates</div>
        </a>
        <a href="https://www.rabbu.com/market-data" target="_blank" rel="noopener noreferrer" className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors border border-white/5">
          <div className="text-xs font-bold text-emerald-300 mb-1">Market Data</div>
          <div className="text-[10px] text-gray-400">Occupancy, ADR & revenue by ZIP code</div>
        </a>
        <a href="https://www.rabbu.com/str-spreadsheet" target="_blank" rel="noopener noreferrer" className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors border border-white/5">
          <div className="text-xs font-bold text-emerald-300 mb-1">STR Spreadsheet</div>
          <div className="text-[10px] text-gray-400">Free analysis template for STR investments</div>
        </a>
      </div>
      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/10">
        <p className="text-xs text-gray-400">
          <strong className="text-blue-300">Pro Tip:</strong> Use Rabbu's Airbnb Calculator to verify the rental income projections in this model.
          Enter the address of your target property to see comparable Airbnb performance, occupancy rates, average daily rates, and seasonal revenue
          patterns. Monthly revenue typically ranges from $1,300/mo (studios) to $10,000+/mo (6+ bedrooms) depending on market and property type.
          Cross-reference these numbers with the NOI assumptions below to ensure your acquisition model is grounded in real-world data.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function MortgageKillerV3() {
  const [, navigate] = useLocation();

  // ─── INPUT STATE ───────────────────────────────────────────────
  const [inputs, setInputs] = useState({
    startingCash: 100000,
    annualIncome: 200000,
    incomeGrowthRate: 0.03,
    annualSavingsRate: 0.20,
    clientAge: 35,
    firstPropertyValue: 400000,
    downPaymentPct: 0.20,
    mortgageRate: 0.065,
    mortgageTermYears: 30,
    propertyAppreciation: 0.05,
    helocLtvPct: 0.70,
    helocRate: 0.085,
    maxHelocDrawPct: 0.40,
    acquisitionInterval: 24,
    maxProperties: 10,
    iulCreditRate: 0.075,
    iulFloor: 0.0,
    iulCap: 0.12,
    policyLoanRate: 0.05,
    policyLoanPct: 0.80,
    iulPremiumPct: 0.15,
    monthlyRentPct: 0.008,
    vacancyRate: 0.08,
    maintenancePct: 0.01,
    propertyTaxPct: 0.012,
    insurancePct: 0.005,
    managementFeePct: 0.10,
    strPremium: 1.5,
    projectionYears: 50,
    estateExemption: 13610000,
    estateTaxRate: 0.40,
    capitalGainsRate: 0.20,
    stateCapGainsRate: 0.05,
    mygaRate: 0.055, // MYGA growth rate for mortgage interest saved
    helocPayoffYears: 6, // Max HELOC payoff years per cycle
  });

  const [activeTab, setActiveTab] = useState<"overview" | "yearly" | "properties" | "transfer" | "charts" | "comparison" | "amortization">("overview");
  const [expandedTransfer, setExpandedTransfer] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useSTR, setUseSTR] = useState(false);
  const [timeMachineYears, setTimeMachineYears] = useState(0); // 0 = off, 5/10/15/20 = lookback

  const updateInput = useCallback((key: string, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  // ─── 50-YEAR PROJECTION ENGINE ─────────────────────────────────
  const projection = useMemo(() => {
    const years: any[] = [];
    let properties: { id: number; purchaseYear: number; purchasePrice: number; currentValue: number; loanBalance: number; monthlyPayment: number; equityAvailable: number; helocBalance: number; helocDrawYear: number; }[] = [];
    let iulCashValue = 0;
    let iulDeathBenefit = 0;
    let iulSurrenderValue = 0;
    let totalIulPremiums = 0;
    let totalPolicyLoans = 0;
    let totalHelocDrawn = 0;
    let totalRentalIncome = 0;
    let totalPropertyLoansInterest = 0;
    let totalOperatingCosts = 0;
    let totalPropertyTaxesPaid = 0;
    let totalMortgageInterestSaved = 0;
    let mygaAccumulation = 0; // MYGA growth on saved mortgage interest
    let cumulativeNetWorth = inputs.startingCash;
    let nextAcquisitionMonth = 0;
    let propertyCount = 0;
    let totalEquityExtracted = 0;
    let cashReserve = inputs.startingCash;

    // Buy first property
    const firstDown = inputs.firstPropertyValue * inputs.downPaymentPct;
    const firstLoan = inputs.firstPropertyValue - firstDown;
    const monthlyRate = inputs.mortgageRate / 12;
    const totalPayments = inputs.mortgageTermYears * 12;
    const firstMonthlyPayment = firstLoan * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);

    // Standard amortization schedule (for "Do Nothing" comparison)
    const standardAmortization: { year: number; balance: number; interest: number; principal: number; totalInterest: number; }[] = [];
    let stdBalance = firstLoan;
    let stdTotalInterest = 0;
    for (let yr = 1; yr <= inputs.mortgageTermYears; yr++) {
      let yearInterest = 0;
      let yearPrincipal = 0;
      for (let m = 0; m < 12; m++) {
        const mInterest = stdBalance * monthlyRate;
        const mPrincipal = firstMonthlyPayment - mInterest;
        yearInterest += mInterest;
        yearPrincipal += mPrincipal;
        stdBalance = Math.max(0, stdBalance - mPrincipal);
      }
      stdTotalInterest += yearInterest;
      standardAmortization.push({
        year: yr,
        balance: Math.round(stdBalance),
        interest: Math.round(yearInterest),
        principal: Math.round(yearPrincipal),
        totalInterest: Math.round(stdTotalInterest),
      });
    }

    properties.push({
      id: 1,
      purchaseYear: 0,
      purchasePrice: inputs.firstPropertyValue,
      currentValue: inputs.firstPropertyValue,
      loanBalance: firstLoan,
      monthlyPayment: firstMonthlyPayment,
      equityAvailable: 0,
      helocBalance: 0,
      helocDrawYear: 0,
    });
    cashReserve -= firstDown;
    propertyCount = 1;
    nextAcquisitionMonth = inputs.acquisitionInterval;

    for (let year = 1; year <= inputs.projectionYears; year++) {
      const age = inputs.clientAge + year;
      const annualIncome = inputs.annualIncome * Math.pow(1 + inputs.incomeGrowthRate, year - 1);
      const annualSavings = annualIncome * inputs.annualSavingsRate;
      const iulPremium = annualIncome * inputs.iulPremiumPct;

      // ─── IUL GROWTH ─────────────────────────────────────────
      iulCashValue += iulPremium;
      totalIulPremiums += iulPremium;
      const iulCredit = iulCashValue * inputs.iulCreditRate;
      iulCashValue += iulCredit;
      // Surrender value: 0% in years 1-2, ramps to 100% by year 15
      const surrenderPct = year <= 2 ? 0 : year <= 5 ? 0.3 + (year - 2) * 0.1 : year <= 10 ? 0.6 + (year - 5) * 0.06 : year <= 15 ? 0.9 + (year - 10) * 0.02 : 1.0;
      iulSurrenderValue = iulCashValue * Math.min(surrenderPct, 1.0);
      iulDeathBenefit = iulCashValue * 3;

      // ─── PROPERTY APPRECIATION & RENTAL INCOME ──────────────
      let yearRentalIncome = 0;
      let yearOperatingCosts = 0;
      let yearMortgagePayments = 0;
      let yearMortgageInterest = 0;
      let yearPropertyTaxes = 0;
      let yearHelocInterest = 0;

      for (const prop of properties) {
        prop.currentValue *= (1 + inputs.propertyAppreciation);

        // Mortgage payments
        const annualMortgage = prop.monthlyPayment * 12;
        const interestPortion = prop.loanBalance * inputs.mortgageRate;
        const principalPortion = Math.min(annualMortgage - interestPortion, prop.loanBalance);
        prop.loanBalance = Math.max(0, prop.loanBalance - principalPortion);
        yearMortgagePayments += annualMortgage;
        yearMortgageInterest += interestPortion;

        // HELOC payoff: enforce max payoff period
        if (prop.helocBalance > 0) {
          const yearsHeld = year - prop.helocDrawYear;
          const helocPayment = prop.helocBalance / Math.max(1, inputs.helocPayoffYears - yearsHeld);
          const helocInterest = prop.helocBalance * inputs.helocRate;
          prop.helocBalance = Math.max(0, prop.helocBalance - helocPayment);
          yearHelocInterest += helocInterest;
        }

        // Rental income
        const rentMultiplier = useSTR ? inputs.strPremium : 1.0;
        const grossMonthlyRent = prop.currentValue * inputs.monthlyRentPct * rentMultiplier;
        const grossAnnualRent = grossMonthlyRent * 12;
        const effectiveRent = grossAnnualRent * (1 - inputs.vacancyRate);
        yearRentalIncome += effectiveRent;

        // Operating costs
        const maintenance = prop.currentValue * inputs.maintenancePct;
        const insurance = prop.currentValue * inputs.insurancePct;
        const propertyTax = prop.currentValue * inputs.propertyTaxPct;
        const management = effectiveRent * inputs.managementFeePct;
        yearOperatingCosts += maintenance + insurance + propertyTax + management + yearHelocInterest;
        yearPropertyTaxes += propertyTax;

        prop.equityAvailable = Math.max(0, prop.currentValue * inputs.helocLtvPct - prop.loanBalance - prop.helocBalance);
      }

      totalRentalIncome += yearRentalIncome;
      totalPropertyLoansInterest += yearMortgageInterest;
      totalOperatingCosts += yearOperatingCosts;
      totalPropertyTaxesPaid += yearPropertyTaxes;

      // Mortgage interest saved vs standard amortization (first property only)
      const stdYearInterest = year <= standardAmortization.length ? standardAmortization[year - 1].interest : 0;
      // Compare first property's interest against standard — once paid off, ALL standard interest is "saved"
      const firstPropInterest = properties.length > 0 ? properties[0].loanBalance * inputs.mortgageRate : 0;
      const interestSaved = Math.max(0, stdYearInterest - firstPropInterest);
      totalMortgageInterestSaved += interestSaved;
      // MYGA accumulation: saved interest grows at MYGA rate
      mygaAccumulation = (mygaAccumulation + interestSaved) * (1 + inputs.mygaRate);

      const yearNOI = yearRentalIncome - yearOperatingCosts - yearMortgagePayments;

      // ─── PROPERTY ACQUISITION CYCLE ─────────────────────────
      let newPropertyThisYear = false;
      let newPropertyValue = 0;
      let yearHelocDrawn = 0;
      let yearPolicyLoan = 0;

      if (propertyCount < inputs.maxProperties && year * 12 >= nextAcquisitionMonth) {
        let bestProp = properties.reduce((best, p) => p.equityAvailable > best.equityAvailable ? p : best, properties[0]);
        // Year 1 of HELOC: max 40%. Year 2+: remaining equity available
        const drawPct = (year - bestProp.helocDrawYear) <= 1 ? inputs.maxHelocDrawPct : 0.80;
        const maxHelocDraw = bestProp.equityAvailable * drawPct;

        const policyLoanAvailable = iulCashValue * inputs.policyLoanPct;
        const policyLoan = Math.min(policyLoanAvailable * 0.5, 200000);

        const totalAvailable = maxHelocDraw + policyLoan + cashReserve * 0.5;
        const targetPropertyValue = inputs.firstPropertyValue * Math.pow(1 + inputs.propertyAppreciation, year);
        const downNeeded = targetPropertyValue * inputs.downPaymentPct;

        if (totalAvailable >= downNeeded && downNeeded > 0) {
          let remaining = downNeeded;
          const helocUsed = Math.min(remaining, maxHelocDraw);
          remaining -= helocUsed;
          bestProp.helocBalance += helocUsed;
          bestProp.helocDrawYear = year;
          totalHelocDrawn += helocUsed;
          yearHelocDrawn = helocUsed;

          const policyLoanUsed = Math.min(remaining, policyLoan);
          remaining -= policyLoanUsed;
          totalPolicyLoans += policyLoanUsed;
          yearPolicyLoan = policyLoanUsed;
          iulCashValue -= policyLoanUsed * 0.1;

          if (remaining > 0) cashReserve -= remaining;

          totalEquityExtracted += helocUsed;

          const newLoan = targetPropertyValue - downNeeded;
          const newMonthly = newLoan * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);

          propertyCount++;
          properties.push({
            id: propertyCount,
            purchaseYear: year,
            purchasePrice: targetPropertyValue,
            currentValue: targetPropertyValue,
            loanBalance: newLoan,
            monthlyPayment: newMonthly,
            equityAvailable: 0,
            helocBalance: 0,
            helocDrawYear: 0,
          });

          newPropertyThisYear = true;
          newPropertyValue = targetPropertyValue;
          nextAcquisitionMonth = year * 12 + inputs.acquisitionInterval;
        }
      }

      // ─── CASH FLOW ──────────────────────────────────────────
      cashReserve += annualSavings + yearNOI - iulPremium;
      cashReserve = Math.max(0, cashReserve);

      // ─── NET WORTH ──────────────────────────────────────────
      const totalPropertyValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
      const totalDebt = properties.reduce((sum, p) => sum + p.loanBalance + p.helocBalance, 0);
      const totalEquity = totalPropertyValue - totalDebt;
      const netWorth = totalEquity + iulCashValue + cashReserve;

      // ─── DO NOTHING COMPARISON ──────────────────────────────
      // "Do Nothing" = just pay mortgage normally, invest savings in 60/40 portfolio at 7%
      const doNothingInvestment = inputs.annualIncome * inputs.annualSavingsRate;
      const doNothingPortfolioGrowth = 0.07;
      const doNothingPropertyValue = inputs.firstPropertyValue * Math.pow(1 + inputs.propertyAppreciation, year);
      const doNothingMortgageBalance = year <= standardAmortization.length ? standardAmortization[year - 1].balance : 0;
      const doNothingEquity = doNothingPropertyValue - doNothingMortgageBalance;
      // Compound savings at 7% (simplified)
      const doNothingPortfolio = doNothingInvestment * ((Math.pow(1 + doNothingPortfolioGrowth, year) - 1) / doNothingPortfolioGrowth);
      const doNothingNetWorth = doNothingEquity + doNothingPortfolio;

      // ─── TAX ANALYSIS ───────────────────────────────────────
      const depreciationDeduction = properties.reduce((sum, p) => sum + (p.purchasePrice * 0.8 / 27.5), 0);
      const costSegDeduction = useSTR ? depreciationDeduction * 2.5 : depreciationDeduction;
      const mortgageInterestDeduction = yearMortgageInterest;
      const totalDeductions = costSegDeduction + mortgageInterestDeduction + yearPropertyTaxes;
      const taxSaved = totalDeductions * 0.37;

      years.push({
        year,
        age,
        annualIncome: Math.round(annualIncome),
        iulPremium: Math.round(iulPremium),
        iulCashValue: Math.round(iulCashValue),
        iulSurrenderValue: Math.round(iulSurrenderValue),
        iulCredit: Math.round(iulCredit),
        iulDeathBenefit: Math.round(iulDeathBenefit),
        propertyCount: properties.length,
        newPropertyThisYear,
        newPropertyValue: Math.round(newPropertyValue),
        totalPropertyValue: Math.round(totalPropertyValue),
        totalDebt: Math.round(totalDebt),
        totalEquity: Math.round(totalEquity),
        yearRentalIncome: Math.round(yearRentalIncome),
        yearOperatingCosts: Math.round(yearOperatingCosts),
        yearMortgagePayments: Math.round(yearMortgagePayments),
        yearMortgageInterest: Math.round(yearMortgageInterest),
        yearPropertyTaxes: Math.round(yearPropertyTaxes),
        yearHelocInterest: Math.round(yearHelocInterest),
        yearNOI: Math.round(yearNOI),
        cashReserve: Math.round(cashReserve),
        netWorth: Math.round(netWorth),
        depreciationDeduction: Math.round(depreciationDeduction),
        costSegDeduction: Math.round(costSegDeduction),
        mortgageInterestDeduction: Math.round(mortgageInterestDeduction),
        totalDeductions: Math.round(totalDeductions),
        taxSaved: Math.round(taxSaved),
        totalHelocDrawn: Math.round(totalHelocDrawn),
        totalPolicyLoans: Math.round(totalPolicyLoans),
        yearHelocDrawn: Math.round(yearHelocDrawn),
        yearPolicyLoan: Math.round(yearPolicyLoan),
        // Do Nothing comparison
        doNothingNetWorth: Math.round(doNothingNetWorth),
        doNothingEquity: Math.round(doNothingEquity),
        doNothingPortfolio: Math.round(doNothingPortfolio),
        // MYGA / Mortgage Interest
        interestSaved: Math.round(interestSaved),
        mygaAccumulation: Math.round(mygaAccumulation),
        totalMortgageInterestSaved: Math.round(totalMortgageInterestSaved),
      });
    }

    // ─── GENERATIONAL TRANSFER ANALYSIS ─────────────────────────
    const finalYear = years[years.length - 1];
    const totalBasis = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
    const totalFMV = finalYear.totalPropertyValue;
    const totalGain = totalFMV - totalBasis;
    const capGainsTax = totalGain * (inputs.capitalGainsRate + inputs.stateCapGainsRate);
    const estateValue = finalYear.netWorth + finalYear.iulDeathBenefit;
    const estateExcess = Math.max(0, estateValue - inputs.estateExemption);
    const estateTax = estateExcess * inputs.estateTaxRate;
    const stepUpSavings = capGainsTax;
    const dynastyTrustSavings = estateTax;

    return {
      years,
      properties,
      standardAmortization,
      summary: {
        totalProperties: properties.length,
        totalPropertyValue: finalYear.totalPropertyValue,
        totalEquity: finalYear.totalEquity,
        totalDebt: finalYear.totalDebt,
        iulCashValue: finalYear.iulCashValue,
        iulSurrenderValue: finalYear.iulSurrenderValue,
        iulDeathBenefit: finalYear.iulDeathBenefit,
        netWorth: finalYear.netWorth,
        totalRentalIncome,
        totalPropertyLoansInterest,
        totalOperatingCosts,
        totalPropertyTaxesPaid,
        totalIulPremiums,
        totalPolicyLoans,
        totalHelocDrawn,
        totalEquityExtracted,
        totalBasis,
        totalFMV,
        totalGain,
        capGainsTax,
        estateValue,
        estateTax,
        stepUpSavings,
        dynastyTrustSavings,
        cumulativeTaxSaved: years.reduce((sum, y) => sum + y.taxSaved, 0),
        totalMortgageInterestSaved,
        mygaAccumulation: finalYear.mygaAccumulation,
        doNothingNetWorth: finalYear.doNothingNetWorth,
        opportunityCost: finalYear.netWorth - finalYear.doNothingNetWorth,
      },
    };
  }, [inputs, useSTR]);

  // ─── TIME MACHINE PROJECTION ───────────────────────────────────
  const timeMachineData = useMemo(() => {
    if (timeMachineYears === 0) return null;
    // Simulate what would have happened if started X years ago
    // Use slightly higher appreciation (historical avg was higher) and lower rates
    const tmYears: { year: number; netWorth: number; properties: number; iulCashValue: number; }[] = [];
    let tmProperties = 1;
    let tmPropertyValue = inputs.firstPropertyValue * Math.pow(1 / (1 + inputs.propertyAppreciation), timeMachineYears); // lower starting value
    let tmIulCashValue = 0;
    let tmNetWorth = inputs.startingCash;

    for (let y = 1; y <= timeMachineYears + inputs.projectionYears; y++) {
      const income = inputs.annualIncome * Math.pow(1 + inputs.incomeGrowthRate, y - 1);
      tmIulCashValue += income * inputs.iulPremiumPct;
      tmIulCashValue *= (1 + inputs.iulCreditRate);
      tmPropertyValue *= (1 + inputs.propertyAppreciation);

      if (y % Math.ceil(inputs.acquisitionInterval / 12) === 0 && tmProperties < inputs.maxProperties + Math.floor(timeMachineYears / 3)) {
        tmProperties++;
      }

      tmNetWorth = tmPropertyValue * tmProperties * 0.7 + tmIulCashValue + inputs.startingCash;
      tmYears.push({ year: y - timeMachineYears, netWorth: Math.round(tmNetWorth), properties: tmProperties, iulCashValue: Math.round(tmIulCashValue) });
    }
    return tmYears.filter(y => y.year >= 0);
  }, [timeMachineYears, inputs]);

  // ─── INPUT FIELD COMPONENT ─────────────────────────────────────
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

  // ─── CHART COLORS ──────────────────────────────────────────────
  const COLORS = {
    property: "#10b981",
    iul: "#3b82f6",
    equity: "#f59e0b",
    debt: "#ef4444",
    noi: "#8b5cf6",
    cash: "#06b6d4",
    tax: "#f97316",
    rental: "#22c55e",
    doNothing: "#6b7280",
    myga: "#eab308",
    timeMachine: "#ec4899",
  };

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-[#0a0e17]/95 backdrop-blur-xl border-b border-teal-500/20">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/portal/dashboard")} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  MORTGAGE KILLER V3
                </h1>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-bold">INFINITE PROPERTY ENGINE</span>
              </div>
              <p className="text-[10px] text-gray-500">HELOC → IUL → Policy Loan → Buy Property → Appreciate → Extract Equity → Repeat Forever</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-gray-500">50-Year Net Worth</div>
              <div className="text-lg font-bold text-emerald-400">{fmt(projection.summary.netWorth)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Properties</div>
              <div className="text-lg font-bold text-teal-400">{projection.summary.totalProperties}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Opportunity Gained</div>
              <div className="text-lg font-bold text-amber-400">{fmt(projection.summary.opportunityCost)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-6 space-y-6">
        {/* RABBU SECTION */}
        <RabbuSection />

        {/* TIME MACHINE TOGGLE */}
        <div className="bg-gradient-to-r from-pink-900/20 via-purple-900/20 to-indigo-900/20 border border-pink-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Rewind className="w-5 h-5 text-pink-400" />
              <h3 className="text-sm font-bold text-pink-300">Time Machine — What If You Started Earlier?</h3>
            </div>
            <div className="flex gap-2">
              {[0, 5, 10, 15, 20].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setTimeMachineYears(yr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeMachineYears === yr ? "bg-pink-500/30 text-pink-200 border border-pink-500/40" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}
                >
                  {yr === 0 ? "Off" : `${yr}yr Ago`}
                </button>
              ))}
            </div>
          </div>
          {timeMachineYears > 0 && timeMachineData && (
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/10">
                <div className="text-[10px] text-gray-400">If Started {timeMachineYears} Years Ago</div>
                <div className="text-lg font-bold text-pink-300">{fmt(timeMachineData[timeMachineData.length - 1]?.netWorth || 0)}</div>
                <div className="text-[10px] text-gray-500">vs {fmt(projection.summary.netWorth)} starting today</div>
              </div>
              <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/10">
                <div className="text-[10px] text-gray-400">Extra Properties</div>
                <div className="text-lg font-bold text-pink-300">{(timeMachineData[timeMachineData.length - 1]?.properties || 0) - projection.summary.totalProperties}</div>
                <div className="text-[10px] text-gray-500">{timeMachineData[timeMachineData.length - 1]?.properties} total vs {projection.summary.totalProperties}</div>
              </div>
              <div className="bg-pink-500/10 rounded-lg p-3 border border-pink-500/10">
                <div className="text-[10px] text-gray-400">Cost of Waiting</div>
                <div className="text-lg font-bold text-red-400">{fmt((timeMachineData[timeMachineData.length - 1]?.netWorth || 0) - projection.summary.netWorth)}</div>
                <div className="text-[10px] text-gray-500">Lost by not starting {timeMachineYears} years ago</div>
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-500 mt-2">
            The Time Machine shows what your portfolio would look like if you had started the Infinite Property Acquisition Cycle earlier.
            Property values are back-dated using the same 5% appreciation rate, and additional acquisition cycles are modeled for the extra years.
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Properties", value: projection.summary.totalProperties.toString(), color: "#14b8a6" },
            { label: "Property Value", value: fmt(projection.summary.totalPropertyValue), color: "#10b981" },
            { label: "Total Equity", value: fmt(projection.summary.totalEquity), color: "#f59e0b" },
            { label: "IUL Cash Value", value: fmt(projection.summary.iulCashValue), color: "#3b82f6" },
            { label: "Net Worth", value: fmt(projection.summary.netWorth), color: "#10b981" },
            { label: "Death Benefit", value: fmt(projection.summary.iulDeathBenefit), color: "#a855f7" },
            { label: "Total Rental Income", value: fmt(projection.summary.totalRentalIncome), color: "#22c55e" },
            { label: "Tax Saved", value: fmt(projection.summary.cumulativeTaxSaved), color: "#f97316" },
          ].map((card) => (
            <div key={card.label} className="border rounded-xl p-3" style={{ background: `linear-gradient(135deg, ${card.color}15, transparent)`, borderColor: `${card.color}30` }}>
              <div className="text-[10px] text-gray-400">{card.label}</div>
              <div className="text-sm font-bold text-white">{card.value}</div>
            </div>
          ))}
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview & Inputs", icon: Calculator },
            { id: "comparison", label: "Do Nothing vs Strategy", icon: Eye },
            { id: "amortization", label: "Amortization Schedule", icon: Table2 },
            { id: "charts", label: "Growth Charts", icon: BarChart3 },
            { id: "yearly", label: "50-Year Projection", icon: Table2 },
            { id: "properties", label: "Property Portfolio", icon: Building2 },
            { id: "transfer", label: "Generational Transfer", icon: Gift },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"}`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── OVERVIEW & INPUTS TAB ─────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* The Cycle Diagram */}
            <div className="bg-gradient-to-r from-teal-900/20 via-emerald-900/20 to-blue-900/20 border border-teal-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-teal-300 mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> The Infinite Property Acquisition Cycle
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { step: "1", label: "Extract Equity", desc: "HELOC up to 40% of home equity (Year 1)", icon: Unlock, color: "#f59e0b" },
                  { step: "2", label: "Fund IUL", desc: "Premium payment builds cash value", icon: Shield, color: "#3b82f6" },
                  { step: "3", label: "Policy Loan", desc: "Borrow 80% of IUL cash value", icon: Wallet, color: "#8b5cf6" },
                  { step: "4", label: "Buy Property", desc: "Down payment on next property", icon: Home, color: "#10b981" },
                  { step: "5", label: "Appreciate", desc: "5% annual property appreciation", icon: TrendingUp, color: "#14b8a6" },
                  { step: "6", label: "Repeat", desc: "Extract new equity → cycle again", icon: RefreshCw, color: "#f97316" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.step} className="text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${s.color}20`, border: `1px solid ${s.color}40` }}>
                        <Icon className="w-5 h-5" style={{ color: s.color }} />
                      </div>
                      <div className="text-xs font-bold text-white">{s.label}</div>
                      <div className="text-[10px] text-gray-400">{s.desc}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 bg-teal-500/10 rounded-lg p-3 border border-teal-500/10">
                <p className="text-xs text-gray-300">
                  <strong className="text-teal-300">Key Principle:</strong> The same capital cycles through multiple vehicles simultaneously.
                  Your home equity funds the IUL. The IUL funds the down payment. The property appreciates and generates rental income.
                  The new equity funds the next cycle. The money never leaves the system — it multiplies.
                  <strong className="text-amber-300 ml-1">Rule: Never extract more than 40% of equity in year one</strong> (IRC §7702 compliance).
                  Year 2+ allows up to 80% equity draw. HELOC payoff enforced within {inputs.helocPayoffYears} years per cycle.
                </p>
              </div>
            </div>

            {/* Input Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" /> Client Profile
                  </h3>
                  <div className="space-y-3">
                    <InputField label="Starting Cash" value={inputs.startingCash} onChange={(v: number) => updateInput("startingCash", v)} />
                    <InputField label="Annual Income" value={inputs.annualIncome} onChange={(v: number) => updateInput("annualIncome", v)} />
                    <PctField label="Income Growth Rate" value={inputs.incomeGrowthRate} onChange={(v: number) => updateInput("incomeGrowthRate", v)} />
                    <PctField label="Annual Savings Rate" value={inputs.annualSavingsRate} onChange={(v: number) => updateInput("annualSavingsRate", v)} />
                    <InputField label="Client Age" value={inputs.clientAge} onChange={(v: number) => updateInput("clientAge", v)} prefix="" step={1} />
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-400" /> First Property
                  </h3>
                  <div className="space-y-3">
                    <InputField label="Property Value" value={inputs.firstPropertyValue} onChange={(v: number) => updateInput("firstPropertyValue", v)} />
                    <PctField label="Down Payment %" value={inputs.downPaymentPct} onChange={(v: number) => updateInput("downPaymentPct", v)} />
                    <PctField label="Mortgage Rate" value={inputs.mortgageRate} onChange={(v: number) => updateInput("mortgageRate", v)} />
                    <InputField label="Mortgage Term (years)" value={inputs.mortgageTermYears} onChange={(v: number) => updateInput("mortgageTermYears", v)} prefix="" step={1} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-teal-400" /> Acquisition Cycle
                  </h3>
                  <div className="space-y-3">
                    <PctField label="Property Appreciation" value={inputs.propertyAppreciation} onChange={(v: number) => updateInput("propertyAppreciation", v)} tooltip="Annual property value increase" />
                    <PctField label="HELOC LTV %" value={inputs.helocLtvPct} onChange={(v: number) => updateInput("helocLtvPct", v)} />
                    <PctField label="HELOC Rate" value={inputs.helocRate} onChange={(v: number) => updateInput("helocRate", v)} />
                    <PctField label="Max Equity Draw (Year 1)" value={inputs.maxHelocDrawPct} onChange={(v: number) => updateInput("maxHelocDrawPct", v)} tooltip="Never take more than 40% in year 1. Year 2+ allows up to 80%." />
                    <InputField label="HELOC Payoff (years)" value={inputs.helocPayoffYears} onChange={(v: number) => updateInput("helocPayoffYears", v)} prefix="" step={1} tooltip="Max years to pay off each HELOC draw" />
                    <InputField label="Months Between Acquisitions" value={inputs.acquisitionInterval} onChange={(v: number) => updateInput("acquisitionInterval", v)} prefix="" step={6} />
                    <InputField label="Max Properties" value={inputs.maxProperties} onChange={(v: number) => updateInput("maxProperties", v)} prefix="" step={1} />
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" /> IUL Parameters
                  </h3>
                  <div className="space-y-3">
                    <PctField label="IUL Credit Rate (AG 49)" value={inputs.iulCreditRate} onChange={(v: number) => updateInput("iulCreditRate", v)} />
                    <PctField label="IUL Floor" value={inputs.iulFloor} onChange={(v: number) => updateInput("iulFloor", v)} />
                    <PctField label="IUL Cap" value={inputs.iulCap} onChange={(v: number) => updateInput("iulCap", v)} />
                    <PctField label="Policy Loan Rate" value={inputs.policyLoanRate} onChange={(v: number) => updateInput("policyLoanRate", v)} />
                    <PctField label="Policy Loan % of CV" value={inputs.policyLoanPct} onChange={(v: number) => updateInput("policyLoanPct", v)} />
                    <PctField label="IUL Premium (% of Income)" value={inputs.iulPremiumPct} onChange={(v: number) => updateInput("iulPremiumPct", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-green-400" /> Rental Income & Operating Costs
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Short-Term Rental Mode</span>
                      <button onClick={() => setUseSTR(!useSTR)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${useSTR ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-gray-400 border border-white/10"}`}>
                        {useSTR ? "STR Active" : "Long-Term Rental"}
                      </button>
                    </div>
                    <PctField label="Monthly Rent (% of Value)" value={inputs.monthlyRentPct} onChange={(v: number) => updateInput("monthlyRentPct", v)} tooltip="0.8% = $3,200/mo on $400K property" />
                    {useSTR && (
                      <InputField label="STR Premium Multiplier" value={inputs.strPremium} onChange={(v: number) => updateInput("strPremium", v)} prefix="" suffix="x" step={0.1} tooltip="STR typically earns 1.5-2.5x long-term rent" />
                    )}
                    <PctField label="Vacancy Rate" value={inputs.vacancyRate} onChange={(v: number) => updateInput("vacancyRate", v)} />
                    <PctField label="Maintenance (% of Value/yr)" value={inputs.maintenancePct} onChange={(v: number) => updateInput("maintenancePct", v)} />
                    <PctField label="Property Tax (% of Value/yr)" value={inputs.propertyTaxPct} onChange={(v: number) => updateInput("propertyTaxPct", v)} />
                    <PctField label="Insurance (% of Value/yr)" value={inputs.insurancePct} onChange={(v: number) => updateInput("insurancePct", v)} />
                    <PctField label="Management Fee (% of Rent)" value={inputs.managementFeePct} onChange={(v: number) => updateInput("managementFeePct", v)} />
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" /> Tax, Estate & MYGA
                  </h3>
                  <div className="space-y-3">
                    <InputField label="Estate Exemption" value={inputs.estateExemption} onChange={(v: number) => updateInput("estateExemption", v)} step={100000} />
                    <PctField label="Estate Tax Rate" value={inputs.estateTaxRate} onChange={(v: number) => updateInput("estateTaxRate", v)} />
                    <PctField label="Capital Gains Rate" value={inputs.capitalGainsRate} onChange={(v: number) => updateInput("capitalGainsRate", v)} />
                    <PctField label="MYGA Rate (Interest Saved Growth)" value={inputs.mygaRate} onChange={(v: number) => updateInput("mygaRate", v)} tooltip="Mortgage interest saved grows in a Multi-Year Guaranteed Annuity at this rate" />
                    <InputField label="Projection Years" value={inputs.projectionYears} onChange={(v: number) => updateInput("projectionYears", v)} prefix="" step={5} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── DO NOTHING vs STRATEGY COMPARISON TAB ─────────────── */}
        {activeTab === "comparison" && (
          <div className="space-y-6">
            {/* Comparison Summary */}
            <div className="bg-gradient-to-r from-gray-900/40 via-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" /> Do Nothing vs. After Recommendation — {inputs.projectionYears}-Year Comparison
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                "Do Nothing" = Pay mortgage normally on 1 property, invest savings in a 60/40 portfolio at 7% annual return. No IUL, no HELOC strategy, no additional properties.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] text-gray-500">Do Nothing Net Worth</div>
                  <div className="text-xl font-bold text-gray-400">{fmt(projection.summary.doNothingNetWorth)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">After Strategy Net Worth</div>
                  <div className="text-xl font-bold text-emerald-400">{fmt(projection.summary.netWorth)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Total Opportunity Cost Accomplished</div>
                  <div className="text-xl font-bold text-amber-400">{fmt(projection.summary.opportunityCost)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Multiplier</div>
                  <div className="text-xl font-bold text-teal-400">{(projection.summary.netWorth / Math.max(1, projection.summary.doNothingNetWorth)).toFixed(1)}x</div>
                </div>
              </div>
            </div>

            {/* Net Worth Comparison Chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Net Worth: Do Nothing vs. Infinite Property Engine</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={projection.years}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Area type="monotone" dataKey="doNothingNetWorth" name="Do Nothing (1 Property + 60/40 Portfolio)" fill={COLORS.doNothing} stroke={COLORS.doNothing} fillOpacity={0.3} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="netWorth" name="After Recommendation (Infinite Property Engine)" fill={COLORS.property} stroke={COLORS.property} fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mortgage Interest Saved → MYGA Growth */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">Mortgage Interest Saved → MYGA Growth at {(inputs.mygaRate * 100).toFixed(1)}%</h3>
              <p className="text-[10px] text-gray-400 mb-4">
                The mortgage interest you save by paying off properties faster is invested in a Multi-Year Guaranteed Annuity (MYGA) at {(inputs.mygaRate * 100).toFixed(1)}% compounding annually.
                This is the "Total Opportunity Cost Accomplished" — money that would have gone to the bank now grows for you.
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={projection.years}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Area type="monotone" dataKey="totalMortgageInterestSaved" name="Cumulative Interest Saved" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.2} />
                  <Line type="monotone" dataKey="mygaAccumulation" name={`MYGA Growth at ${(inputs.mygaRate * 100).toFixed(1)}%`} stroke={COLORS.myga} strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-200">
                  <strong>Total Opportunity Cost Accomplished:</strong> {fmtFull(projection.summary.mygaAccumulation)} — This is the total value of mortgage interest saved,
                  compounded at {(inputs.mygaRate * 100).toFixed(1)}% in a MYGA over {inputs.projectionYears} years. Without the strategy, this money goes to the bank.
                  With the strategy, it grows tax-deferred in a guaranteed annuity.
                </p>
              </div>
            </div>

            {/* IUL Cash Value vs Surrender Value */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">IUL Cash Value vs. Surrender Value vs. Death Benefit</h3>
              <p className="text-[10px] text-gray-400 mb-4">
                Surrender value starts at $0 (years 1-2), ramps to 30-60% (years 3-5), 60-90% (years 6-10), and reaches 100% by year 15.
                This is why IUL is a long-term strategy — the surrender charge period protects the policy's internal economics.
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={projection.years}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Area type="monotone" dataKey="iulCashValue" name="Cash Value" fill={COLORS.iul} stroke={COLORS.iul} fillOpacity={0.3} />
                  <Line type="monotone" dataKey="iulSurrenderValue" name="Surrender Value" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="iulDeathBenefit" name="Death Benefit" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Time Machine Overlay */}
            {timeMachineYears > 0 && timeMachineData && (
              <div className="bg-white/5 border border-pink-500/20 rounded-xl p-6">
                <h3 className="text-sm font-bold text-pink-300 mb-4 flex items-center gap-2">
                  <Rewind className="w-4 h-4" /> Time Machine: Started {timeMachineYears} Years Ago vs. Starting Today
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} type="number" domain={[0, inputs.projectionYears]} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Legend />
                    <Line data={projection.years} dataKey="netWorth" name="Starting Today" stroke={COLORS.property} strokeWidth={2} dot={false} />
                    <Line data={timeMachineData} dataKey="netWorth" name={`Started ${timeMachineYears}yr Ago`} stroke={COLORS.timeMachine} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Comparison Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white">Side-by-Side: Every 5 Years</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-3 py-2 text-left text-gray-400">Year</th>
                      <th className="px-3 py-2 text-right text-gray-400">Do Nothing Net Worth</th>
                      <th className="px-3 py-2 text-right text-emerald-400">Strategy Net Worth</th>
                      <th className="px-3 py-2 text-right text-amber-400">Advantage</th>
                      <th className="px-3 py-2 text-right text-teal-400">Properties</th>
                      <th className="px-3 py-2 text-right text-blue-400">IUL Cash Value</th>
                      <th className="px-3 py-2 text-right text-blue-300">Surrender Value</th>
                      <th className="px-3 py-2 text-right text-yellow-400">MYGA Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.years.filter((_, i) => (i + 1) % 5 === 0 || i === 0 || i === projection.years.length - 1).map((y) => (
                      <tr key={y.year} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-3 py-2 text-white font-medium">{y.year}</td>
                        <td className="px-3 py-2 text-right text-gray-400">{fmt(y.doNothingNetWorth)}</td>
                        <td className="px-3 py-2 text-right text-emerald-300 font-bold">{fmt(y.netWorth)}</td>
                        <td className="px-3 py-2 text-right text-amber-300 font-bold">{fmt(y.netWorth - y.doNothingNetWorth)}</td>
                        <td className="px-3 py-2 text-right text-teal-300">{y.propertyCount}</td>
                        <td className="px-3 py-2 text-right text-blue-300">{fmt(y.iulCashValue)}</td>
                        <td className="px-3 py-2 text-right text-blue-200">{fmt(y.iulSurrenderValue)}</td>
                        <td className="px-3 py-2 text-right text-yellow-300">{fmt(y.mygaAccumulation)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── AMORTIZATION SCHEDULE TAB ──────────────────────────── */}
        {activeTab === "amortization" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-amber-900/20 border border-orange-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-orange-300 mb-2 flex items-center gap-2">
                <Table2 className="w-5 h-5" /> Current Amortization Schedule — Before Recommendation
              </h2>
              <p className="text-xs text-gray-300 mb-4">
                This is what your mortgage looks like if you do nothing — just make standard payments for {inputs.mortgageTermYears} years.
                You'll pay <span className="text-red-400 font-bold">{fmtFull(projection.standardAmortization.reduce((s, a) => s + a.interest, 0))}</span> in total interest
                on a <span className="text-white font-bold">{fmtFull(inputs.firstPropertyValue * (1 - inputs.downPaymentPct))}</span> loan.
                That's <span className="text-red-400 font-bold">{((projection.standardAmortization.reduce((s, a) => s + a.interest, 0) / (inputs.firstPropertyValue * (1 - inputs.downPaymentPct))) * 100).toFixed(0)}%</span> of the original loan amount going straight to the bank.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/10">
                  <div className="text-[10px] text-gray-400">Total Interest Paid</div>
                  <div className="text-lg font-bold text-red-400">{fmtFull(projection.standardAmortization.reduce((s, a) => s + a.interest, 0))}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-[10px] text-gray-400">Original Loan Amount</div>
                  <div className="text-lg font-bold text-white">{fmtFull(inputs.firstPropertyValue * (1 - inputs.downPaymentPct))}</div>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/10">
                  <div className="text-[10px] text-gray-400">Monthly Payment</div>
                  <div className="text-lg font-bold text-amber-300">{fmtFull(projection.standardAmortization.length > 0 ? (projection.standardAmortization[0].interest + projection.standardAmortization[0].principal) / 12 : 0)}</div>
                </div>
              </div>
            </div>

            {/* Amortization Chart */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Loan Balance & Interest Over Time</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={projection.standardAmortization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Area type="monotone" dataKey="balance" name="Remaining Balance" fill="#ef4444" stroke="#ef4444" fillOpacity={0.3} />
                  <Bar dataKey="interest" name="Annual Interest" fill="#f97316" />
                  <Bar dataKey="principal" name="Annual Principal" fill="#10b981" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Amortization Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-bold text-white">Year-by-Year Amortization</h3>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0f1520] z-10">
                    <tr className="bg-white/5">
                      <th className="px-3 py-2 text-left text-gray-400">Year</th>
                      <th className="px-3 py-2 text-right text-red-400">Remaining Balance</th>
                      <th className="px-3 py-2 text-right text-orange-400">Annual Interest</th>
                      <th className="px-3 py-2 text-right text-emerald-400">Annual Principal</th>
                      <th className="px-3 py-2 text-right text-red-300">Cumulative Interest</th>
                      <th className="px-3 py-2 text-right text-gray-400">Interest %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.standardAmortization.map((a) => (
                      <tr key={a.year} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-3 py-1.5 text-white font-medium">{a.year}</td>
                        <td className="px-3 py-1.5 text-right text-red-300">{fmtFull(a.balance)}</td>
                        <td className="px-3 py-1.5 text-right text-orange-300">{fmtFull(a.interest)}</td>
                        <td className="px-3 py-1.5 text-right text-emerald-300">{fmtFull(a.principal)}</td>
                        <td className="px-3 py-1.5 text-right text-red-200">{fmtFull(a.totalInterest)}</td>
                        <td className="px-3 py-1.5 text-right text-gray-400">{((a.interest / (a.interest + a.principal)) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── CHARTS TAB ────────────────────────────────────────── */}
        {activeTab === "charts" && (
          <div className="space-y-6">
            {/* Net Worth Growth */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Net Worth Growth — {inputs.projectionYears}-Year Projection</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={projection.years}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                  <Legend />
                  <Area type="monotone" dataKey="totalEquity" name="Property Equity" stackId="1" fill={COLORS.equity} stroke={COLORS.equity} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="iulCashValue" name="IUL Cash Value" stackId="1" fill={COLORS.iul} stroke={COLORS.iul} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="cashReserve" name="Cash Reserve" stackId="1" fill={COLORS.cash} stroke={COLORS.cash} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Property Value vs Debt */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Property Value vs Total Debt</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={projection.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Legend />
                    <Area type="monotone" dataKey="totalPropertyValue" name="Property Value" fill={COLORS.property} stroke={COLORS.property} fillOpacity={0.3} />
                    <Line type="monotone" dataKey="totalDebt" name="Total Debt" stroke={COLORS.debt} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="totalEquity" name="Net Equity" stroke={COLORS.equity} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Annual Cash Flow (NOI + IUL Credits)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projection.years.filter((_, i) => i % 5 === 0 || i === projection.years.length - 1)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="yearRentalIncome" name="Rental Income" fill={COLORS.rental} />
                    <Bar dataKey="yearOperatingCosts" name="Operating Costs" fill={COLORS.debt} />
                    <Bar dataKey="iulCredit" name="IUL Credit" fill={COLORS.iul} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* HELOC & Policy Loan Tracking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">HELOC Draws & Policy Loans Per Acquisition</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projection.years.filter(y => y.yearHelocDrawn > 0 || y.yearPolicyLoan > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="yearHelocDrawn" name="HELOC Draw" fill="#f59e0b" />
                    <Bar dataKey="yearPolicyLoan" name="Policy Loan" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Property Count Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projection.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Bar dataKey="propertyCount" name="Properties Owned" fill="#14b8a6">
                      {projection.years.map((entry, index) => (
                        <Cell key={index} fill={entry.newPropertyThisYear ? "#f59e0b" : "#14b8a6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tax Savings & IUL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Cumulative Tax Savings</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={projection.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="taxSaved" name="Annual Tax Saved" fill={COLORS.tax} stroke={COLORS.tax} fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">IUL Cash Value, Surrender Value & Death Benefit</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={projection.years}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                    <Legend />
                    <Area type="monotone" dataKey="iulCashValue" name="Cash Value" fill={COLORS.iul} stroke={COLORS.iul} fillOpacity={0.4} />
                    <Line type="monotone" dataKey="iulSurrenderValue" name="Surrender Value" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="iulDeathBenefit" name="Death Benefit" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ─── 50-YEAR PROJECTION TABLE ──────────────────────────── */}
        {activeTab === "yearly" && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Table2 className="w-4 h-4 text-teal-400" /> Complete {inputs.projectionYears}-Year Projection — All Variables
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Every row shows property loans, interest, NOI, IUL credits, surrender values, HELOC interest, appreciation, and net worth</p>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#0f1520] z-10">
                  <tr className="bg-white/5">
                    <th className="px-2 py-2 text-left text-gray-400 font-medium">Yr</th>
                    <th className="px-2 py-2 text-left text-gray-400 font-medium">Age</th>
                    <th className="px-2 py-2 text-right text-gray-400 font-medium">#Props</th>
                    <th className="px-2 py-2 text-right text-emerald-400 font-medium">Property Value</th>
                    <th className="px-2 py-2 text-right text-red-400 font-medium">Total Debt</th>
                    <th className="px-2 py-2 text-right text-amber-400 font-medium">Equity</th>
                    <th className="px-2 py-2 text-right text-green-400 font-medium">Rental Income</th>
                    <th className="px-2 py-2 text-right text-red-300 font-medium">Op Costs</th>
                    <th className="px-2 py-2 text-right text-red-300 font-medium">Mtg Interest</th>
                    <th className="px-2 py-2 text-right text-amber-300 font-medium">HELOC Int</th>
                    <th className="px-2 py-2 text-right text-purple-400 font-medium">NOI</th>
                    <th className="px-2 py-2 text-right text-blue-400 font-medium">IUL CV</th>
                    <th className="px-2 py-2 text-right text-red-200 font-medium">Surrender</th>
                    <th className="px-2 py-2 text-right text-purple-300 font-medium">Death Benefit</th>
                    <th className="px-2 py-2 text-right text-orange-400 font-medium">Tax Saved</th>
                    <th className="px-2 py-2 text-right text-yellow-400 font-medium">MYGA</th>
                    <th className="px-2 py-2 text-right text-emerald-400 font-medium font-bold">Net Worth</th>
                    <th className="px-2 py-2 text-right text-gray-500 font-medium">Do Nothing</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.years.map((y) => (
                    <tr key={y.year} className={`border-t border-white/5 hover:bg-white/5 ${y.newPropertyThisYear ? "bg-teal-500/10" : ""}`}>
                      <td className="px-2 py-1.5 text-white font-medium">{y.year}</td>
                      <td className="px-2 py-1.5 text-gray-400">{y.age}</td>
                      <td className="px-2 py-1.5 text-right text-white font-medium">
                        {y.propertyCount}
                        {y.newPropertyThisYear && <span className="ml-1 text-teal-400 text-[9px]">+1</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right text-emerald-300">{fmt(y.totalPropertyValue)}</td>
                      <td className="px-2 py-1.5 text-right text-red-300">{fmt(y.totalDebt)}</td>
                      <td className="px-2 py-1.5 text-right text-amber-300">{fmt(y.totalEquity)}</td>
                      <td className="px-2 py-1.5 text-right text-green-300">{fmt(y.yearRentalIncome)}</td>
                      <td className="px-2 py-1.5 text-right text-red-200">{fmt(y.yearOperatingCosts)}</td>
                      <td className="px-2 py-1.5 text-right text-red-200">{fmt(y.yearMortgageInterest)}</td>
                      <td className="px-2 py-1.5 text-right text-amber-200">{fmt(y.yearHelocInterest)}</td>
                      <td className="px-2 py-1.5 text-right" style={{ color: y.yearNOI >= 0 ? "#a78bfa" : "#f87171" }}>{fmt(y.yearNOI)}</td>
                      <td className="px-2 py-1.5 text-right text-blue-300">{fmt(y.iulCashValue)}</td>
                      <td className="px-2 py-1.5 text-right text-red-200">{fmt(y.iulSurrenderValue)}</td>
                      <td className="px-2 py-1.5 text-right text-purple-300">{fmt(y.iulDeathBenefit)}</td>
                      <td className="px-2 py-1.5 text-right text-orange-300">{fmt(y.taxSaved)}</td>
                      <td className="px-2 py-1.5 text-right text-yellow-300">{fmt(y.mygaAccumulation)}</td>
                      <td className="px-2 py-1.5 text-right text-emerald-300 font-bold">{fmt(y.netWorth)}</td>
                      <td className="px-2 py-1.5 text-right text-gray-500">{fmt(y.doNothingNetWorth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── PROPERTY PORTFOLIO TAB ────────────────────────────── */}
        {activeTab === "properties" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projection.properties.map((prop) => {
                const appreciation = ((prop.currentValue - prop.purchasePrice) / prop.purchasePrice * 100).toFixed(1);
                const equity = prop.currentValue - prop.loanBalance - prop.helocBalance;
                const annualRent = prop.currentValue * inputs.monthlyRentPct * (useSTR ? inputs.strPremium : 1) * 12 * (1 - inputs.vacancyRate);
                const annualCosts = prop.currentValue * (inputs.maintenancePct + inputs.propertyTaxPct + inputs.insurancePct) + annualRent * inputs.managementFeePct + prop.helocBalance * inputs.helocRate;
                const noi = annualRent - annualCosts - prop.monthlyPayment * 12;
                const capRate = (annualRent - annualCosts) / prop.currentValue * 100;

                return (
                  <div key={prop.id} className="bg-gradient-to-br from-teal-900/20 to-emerald-900/10 border border-teal-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Property #{prop.id}</div>
                          <div className="text-[10px] text-gray-400">Acquired Year {prop.purchaseYear}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-400 font-bold">+{appreciation}%</div>
                        <div className="text-[10px] text-gray-500">appreciation</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Purchase Price", value: fmtFull(prop.purchasePrice), color: "text-gray-300" },
                        { label: "Current Value", value: fmtFull(prop.currentValue), color: "text-emerald-300" },
                        { label: "Loan Balance", value: fmtFull(prop.loanBalance), color: "text-red-300" },
                        { label: "HELOC Balance", value: fmtFull(prop.helocBalance), color: "text-amber-300" },
                        { label: "Net Equity", value: fmtFull(equity), color: "text-emerald-400 font-bold" },
                        { label: "Annual Rent", value: fmtFull(annualRent), color: "text-green-300" },
                        { label: "Annual NOI", value: fmtFull(noi), color: noi >= 0 ? "text-purple-300" : "text-red-300" },
                        { label: "Cap Rate", value: `${capRate.toFixed(2)}%`, color: "text-blue-300" },
                        { label: "Monthly Payment", value: fmtFull(prop.monthlyPayment), color: "text-gray-300" },
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

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">Portfolio Summary at Year {inputs.projectionYears}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Property Value", value: fmtFull(projection.summary.totalPropertyValue), color: "text-emerald-400" },
                  { label: "Total Debt", value: fmtFull(projection.summary.totalDebt), color: "text-red-400" },
                  { label: "Total Equity", value: fmtFull(projection.summary.totalEquity), color: "text-amber-400" },
                  { label: "Total Rental Income (Lifetime)", value: fmtFull(projection.summary.totalRentalIncome), color: "text-green-400" },
                  { label: "Total Operating Costs (Lifetime)", value: fmtFull(projection.summary.totalOperatingCosts), color: "text-red-300" },
                  { label: "Total Mortgage Interest Paid", value: fmtFull(projection.summary.totalPropertyLoansInterest), color: "text-red-300" },
                  { label: "Total HELOC Drawn", value: fmtFull(projection.summary.totalHelocDrawn), color: "text-amber-300" },
                  { label: "Total Policy Loans Used", value: fmtFull(projection.summary.totalPolicyLoans), color: "text-blue-300" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[10px] text-gray-400">{item.label}</div>
                    <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── GENERATIONAL TRANSFER TAB ─────────────────────────── */}
        {activeTab === "transfer" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5" /> Tax-Efficient Generational Transfer Analysis
              </h2>
              <p className="text-sm text-gray-300 mb-4">
                Your {projection.summary.totalProperties} properties are worth {fmt(projection.summary.totalPropertyValue)} with a cost basis of {fmt(projection.summary.totalBasis)}.
                Without planning, your heirs face {fmt(projection.summary.capGainsTax)} in capital gains tax and potentially {fmt(projection.summary.estateTax)} in estate tax.
                These strategies can eliminate both.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] text-gray-400">Total Appreciation (Gain)</div>
                  <div className="text-lg font-bold text-amber-400">{fmt(projection.summary.totalGain)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Capital Gains Tax Exposure</div>
                  <div className="text-lg font-bold text-red-400">{fmt(projection.summary.capGainsTax)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Estate Tax Exposure</div>
                  <div className="text-lg font-bold text-red-400">{fmt(projection.summary.estateTax)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Total Tax Eliminable</div>
                  <div className="text-lg font-bold text-emerald-400">{fmt(projection.summary.capGainsTax + projection.summary.estateTax)}</div>
                </div>
              </div>
            </div>

            {TRANSFER_STRATEGIES.map((strategy) => {
              const Icon = strategy.icon;
              const isExpanded = expandedTransfer === strategy.id;
              return (
                <div key={strategy.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedTransfer(isExpanded ? null : strategy.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${strategy.color === 'amber' ? '#f59e0b' : strategy.color === 'blue' ? '#3b82f6' : strategy.color === 'purple' ? '#a855f7' : strategy.color === 'teal' ? '#14b8a6' : '#10b981'}15` }}>
                        <Icon className="w-5 h-5" style={{ color: strategy.color === 'amber' ? '#f59e0b' : strategy.color === 'blue' ? '#3b82f6' : strategy.color === 'purple' ? '#a855f7' : strategy.color === 'teal' ? '#14b8a6' : '#10b981' }} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">{strategy.name}</div>
                        <div className="text-[10px] text-gray-400">{strategy.irsCode} — {strategy.taxSavings}</div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-sm text-gray-300">{strategy.description}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-white mb-2">Best For</h4>
                        <p className="text-sm text-gray-300">{strategy.bestFor}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-white mb-3">How It Works With Your Portfolio</h4>
                        <div className="space-y-2">
                          {strategy.howItWorks.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[10px] text-teal-300 font-bold">{i + 1}</span>
                              </div>
                              <p className="text-xs text-gray-300">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-300">Tax Impact on Your Portfolio</span>
                        </div>
                        <p className="text-xs text-gray-300">
                          {strategy.id === "step-up" && `Eliminates ${fmt(projection.summary.capGainsTax)} in capital gains tax on ${fmt(projection.summary.totalGain)} of appreciation across ${projection.summary.totalProperties} properties.`}
                          {strategy.id === "qprt" && `Transfers your primary residence at a 60-70% gift tax discount. On a ${fmt(projection.properties[0]?.currentValue || 0)} home, the gift value drops to ~${fmt((projection.properties[0]?.currentValue || 0) * 0.35)}.`}
                          {strategy.id === "idgt" && `Freezes ${fmt(projection.summary.totalPropertyValue)} in property value outside your estate. All future appreciation passes to beneficiaries tax-free.`}
                          {strategy.id === "1031" && `Defers ${fmt(projection.summary.capGainsTax)} in capital gains indefinitely through exchange chains, then eliminates estate tax via dynasty trust.`}
                          {strategy.id === "crt" && `Sells ${fmt(projection.summary.totalPropertyValue)} in property with $0 capital gains tax. Generates ~${fmt(projection.summary.totalPropertyValue * 0.05)}/yr income for life. IUL death benefit replaces the charitable remainder.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Combined Strategy Recommendation */}
            <div className="bg-gradient-to-r from-amber-900/20 via-orange-900/20 to-red-900/20 border border-amber-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-amber-300 mb-3 flex items-center gap-2">
                <Crown className="w-5 h-5" /> The Gold Standard: Combined Strategy
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <p>
                  <strong className="text-amber-300">Phase 1 (Years 1-20):</strong> Build the portfolio using the Infinite Property Acquisition Cycle.
                  Extract equity → fund IUL → policy loan → buy property → repeat. Accumulate {projection.summary.totalProperties} properties worth {fmt(projection.summary.totalPropertyValue)}.
                </p>
                <p>
                  <strong className="text-amber-300">Phase 2 (Years 20-40):</strong> Begin 1031 exchange chains to consolidate smaller properties into larger,
                  higher-value assets. Defer all capital gains. Transfer select properties to children via installment sales to IDGTs at AFR rates.
                </p>
                <p>
                  <strong className="text-amber-300">Phase 3 (Years 40+):</strong> Transfer remaining properties into a dynasty trust. Hold until death for
                  step-up in basis (eliminates {fmt(projection.summary.capGainsTax)} in capital gains). IUL death benefit of {fmt(projection.summary.iulDeathBenefit)} covers
                  any estate tax exposure and provides tax-free inheritance.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-3">
                  <p className="text-xs text-amber-200">
                    <strong>Total Tax Eliminated:</strong> {fmt(projection.summary.capGainsTax + projection.summary.estateTax + projection.summary.cumulativeTaxSaved)} —
                    combining capital gains elimination ({fmt(projection.summary.capGainsTax)}), estate tax elimination ({fmt(projection.summary.estateTax)}),
                    and annual deductions ({fmt(projection.summary.cumulativeTaxSaved)}).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IRS CODE REFERENCE */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 mb-3">IRS Code References Used in This Model</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              { code: "§72", desc: "Annuity taxation rules (MYGA)" },
              { code: "§101(a)", desc: "Tax-free death benefit" },
              { code: "§163", desc: "Mortgage interest deduction" },
              { code: "§168(k)", desc: "Bonus depreciation" },
              { code: "§170", desc: "Charitable contribution deduction" },
              { code: "§179", desc: "Expensing election" },
              { code: "§280A(g)", desc: "Augusta Rule (14-day rental)" },
              { code: "§453", desc: "Installment sale reporting" },
              { code: "§664", desc: "Charitable remainder trusts" },
              { code: "§671-679", desc: "Grantor trust rules (IDGT)" },
              { code: "§1014", desc: "Step-up in basis at death" },
              { code: "§1031", desc: "Like-kind exchange deferral" },
              { code: "§2601", desc: "Generation-skipping transfer tax" },
              { code: "§2702", desc: "QPRT valuation rules" },
              { code: "§7702", desc: "Life insurance contract definition" },
            ].map((ref) => (
              <div key={ref.code} className="bg-white/5 rounded-lg p-2">
                <div className="text-[10px] font-bold text-teal-400">{ref.code}</div>
                <div className="text-[9px] text-gray-500">{ref.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
