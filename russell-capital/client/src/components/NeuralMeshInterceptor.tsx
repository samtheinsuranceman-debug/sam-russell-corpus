/**
 * ═══════════════════════════════════════════════════════════════════
 * NEURAL MESH INTERCEPTOR — S1: Universal Calculator Neural Mesh
 * ═══════════════════════════════════════════════════════════════════
 * 
 * The single most powerful integration component in the platform.
 * Mounted ONCE inside AppShell, it auto-connects EVERY page to:
 *   1. Unified Data Bus — auto-reports page visits and context
 *   2. AI Brain — auto-registers page connection and feeds data
 *   3. Client Data — auto-detects client context for the page
 *   4. Calculator Results — auto-reads cross-calculator data
 *   5. Synaptic Network (S2) — enables calc-to-calc communication
 *   6. Synchronicity Core (S3) — central fusion heartbeat
 * 
 * This replaces the need to manually integrate 281+ orphaned pages.
 * One component = full neural mesh coverage for the entire platform.
 * 
 * Patent References: PAT-001 (Unified Financial Intelligence), 
 *   PAT-003 (AI Advisor), PAT-004 (Strategy Optimization)
 */
import { useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useUnifiedDataBus, type DataCategory } from "@/contexts/UnifiedDataBusContext";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";

/* ═══════════════════════════════════════════════════════════════════
   PAGE INTELLIGENCE MAP — Maps every route to its category, 
   feature ID, and related calculators for the synaptic network
   ═══════════════════════════════════════════════════════════════════ */
interface PageIntelligence {
  featureId: string;
  featureName: string;
  category: DataCategory;
  relatedCalcs: string[];
  dataKeys: string[];
  aiContext: string;
}

const ROUTE_INTELLIGENCE: Record<string, PageIntelligence> = {
  // ── Dashboard & Home ──
  "/portal": { featureId: "portal-home", featureName: "Portal Home", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["overview"], aiContext: "main dashboard" },
  "/portal/dashboard": { featureId: "portal-dashboard", featureName: "Dashboard", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["overview", "metrics"], aiContext: "advisor dashboard with key metrics" },
  "/portal/advisory-summary": { featureId: "advisory-summary", featureName: "Advisory Summary", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["summary"], aiContext: "client advisory summary" },

  // ── Client Management ──
  "/portal/clients": { featureId: "clients-list", featureName: "Client List", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["clientCount", "activeClients"], aiContext: "client management" },
  "/portal/pipeline": { featureId: "pipeline", featureName: "Sales Pipeline", category: "ai-pro-suite", relatedCalcs: ["commission-calculator"], dataKeys: ["pipelineValue", "deals"], aiContext: "sales pipeline management" },
  "/portal/client-health-dashboard": { featureId: "client-health", featureName: "Client Health Dashboard", category: "ai-pro-suite", relatedCalcs: ["financial-health-score", "net-worth-tracker"], dataKeys: ["healthScore", "atRiskClients"], aiContext: "client health monitoring" },
  "/portal/client-scorecard": { featureId: "client-scorecard", featureName: "Client Scorecard", category: "ai-pro-suite", relatedCalcs: ["financial-health-score"], dataKeys: ["scores"], aiContext: "individual client scoring" },
  "/portal/client-comparison": { featureId: "client-comparison", featureName: "Client Comparison", category: "ai-pro-suite", relatedCalcs: ["net-worth-tracker", "financial-health-score"], dataKeys: ["comparison"], aiContext: "comparing multiple clients" },
  "/portal/client-portal": { featureId: "client-portal", featureName: "Client Portal", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["portalAccess"], aiContext: "client-facing portal" },
  "/portal/client-self-service-portal": { featureId: "client-self-service", featureName: "Client Self-Service", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["selfService"], aiContext: "client self-service portal" },
  "/portal/client-journey-navigator": { featureId: "client-journey", featureName: "Client Journey", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["journeyStage"], aiContext: "client journey navigation" },
  "/portal/client-retention-assistant": { featureId: "client-retention", featureName: "Retention Assistant", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["retentionRisk", "churnScore"], aiContext: "client retention prediction" },
  "/portal/client-retention-predictor": { featureId: "retention-predictor", featureName: "Retention Predictor", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["churnProbability"], aiContext: "predictive client retention" },
  "/portal/onboarding-quiz": { featureId: "onboarding-quiz", featureName: "Onboarding Quiz", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["quizResults"], aiContext: "new client onboarding" },
  "/portal/client-onboarding-workflow": { featureId: "onboarding-workflow", featureName: "Onboarding Workflow", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["onboardingStep"], aiContext: "client onboarding workflow" },
  "/portal/couples-mode": { featureId: "couples-mode", featureName: "Couples Mode", category: "ai-pro-suite", relatedCalcs: ["spousal-ss-coordination", "divorce-settlement"], dataKeys: ["couplesPlan"], aiContext: "couples financial planning" },

  // ── Tax Calculators ──
  "/portal/aca-subsidy": { featureId: "calc-aca-subsidy", featureName: "ACA Subsidy Calculator", category: "calculator", relatedCalcs: ["marginal-tax-rate", "retirement-healthcare", "medicare-irmaa-calc"], dataKeys: ["subsidy", "premium", "magi"], aiContext: "ACA subsidy optimization" },
  "/portal/amt-calculator": { featureId: "calc-amt", featureName: "AMT Calculator", category: "calculator", relatedCalcs: ["marginal-tax-rate", "deduction-optimizer", "rsu-tax", "capital-gains-tax"], dataKeys: ["amtLiability", "regularTax", "tentativeMinTax"], aiContext: "alternative minimum tax analysis" },
  "/portal/alimony-tax": { featureId: "calc-alimony-tax", featureName: "Alimony Tax Calculator", category: "calculator", relatedCalcs: ["marginal-tax-rate", "divorce-settlement"], dataKeys: ["alimonyTax", "netAlimony"], aiContext: "alimony tax impact" },
  "/portal/backdoor-roth": { featureId: "calc-backdoor-roth", featureName: "Backdoor Roth Calculator", category: "calculator", relatedCalcs: ["roth-vs-traditional", "mega-backdoor-roth", "marginal-tax-rate"], dataKeys: ["rothConversion", "taxCost", "futureValue"], aiContext: "backdoor Roth conversion strategy" },
  "/portal/capital-gains-tax": { featureId: "calc-capital-gains", featureName: "Capital Gains Tax", category: "calculator", relatedCalcs: ["marginal-tax-rate", "tax-loss-harvest-calc", "opportunity-zone"], dataKeys: ["capitalGains", "taxRate", "netProceeds"], aiContext: "capital gains tax optimization" },
  "/portal/crypto-tax": { featureId: "calc-crypto-tax", featureName: "Crypto Tax Calculator", category: "calculator", relatedCalcs: ["capital-gains-tax", "tax-loss-harvest-calc", "marginal-tax-rate"], dataKeys: ["cryptoGains", "taxOwed"], aiContext: "cryptocurrency tax planning" },
  "/portal/deduction-optimizer": { featureId: "calc-deduction-optimizer", featureName: "Deduction Optimizer", category: "calculator", relatedCalcs: ["marginal-tax-rate", "charitable-stock-donation", "daf-vs-direct-giving", "hsa-triple-tax"], dataKeys: ["totalDeductions", "taxSavings"], aiContext: "tax deduction optimization" },
  "/portal/depreciation-tax-shield": { featureId: "calc-depreciation", featureName: "Depreciation Tax Shield", category: "calculator", relatedCalcs: ["rental-property-roi", "1031-exchange", "cost-segregation"], dataKeys: ["depreciationAmount", "taxShield"], aiContext: "depreciation tax strategy" },
  "/portal/entity-comparison": { featureId: "calc-entity-comparison", featureName: "Entity Comparison", category: "calculator", relatedCalcs: ["self-employment-tax", "qbi-calculator", "marginal-tax-rate"], dataKeys: ["bestEntity", "taxSavings"], aiContext: "business entity tax comparison" },
  "/portal/esop-calculator": { featureId: "calc-esop", featureName: "ESOP Calculator", category: "calculator", relatedCalcs: ["business-valuation", "capital-gains-tax", "estate-tax"], dataKeys: ["esopValue", "taxDeferral"], aiContext: "ESOP planning" },
  "/portal/income-shifting": { featureId: "calc-income-shifting", featureName: "Income Shifting", category: "calculator", relatedCalcs: ["marginal-tax-rate", "entity-comparison", "family-limited-partnership"], dataKeys: ["shiftedIncome", "taxSavings"], aiContext: "income shifting strategies" },
  "/portal/installment-sale": { featureId: "calc-installment-sale", featureName: "Installment Sale", category: "calculator", relatedCalcs: ["capital-gains-tax", "1031-exchange", "opportunity-zone"], dataKeys: ["installmentGain", "deferredTax"], aiContext: "installment sale tax deferral" },
  "/portal/marginal-tax-rate": { featureId: "calc-marginal-tax", featureName: "Marginal Tax Rate", category: "calculator", relatedCalcs: ["capital-gains-tax", "deduction-optimizer", "roth-vs-traditional", "income-shifting"], dataKeys: ["marginalRate", "effectiveRate", "totalTax"], aiContext: "marginal tax rate analysis" },
  "/portal/qbi-calculator": { featureId: "calc-qbi", featureName: "QBI Calculator", category: "calculator", relatedCalcs: ["self-employment-tax", "entity-comparison", "marginal-tax-rate"], dataKeys: ["qbiDeduction", "taxSavings"], aiContext: "qualified business income deduction" },
  "/portal/rsu-tax": { featureId: "calc-rsu-tax", featureName: "RSU Tax Calculator", category: "calculator", relatedCalcs: ["capital-gains-tax", "amt-calculator", "nua-calculator", "marginal-tax-rate"], dataKeys: ["rsuTax", "vestingSchedule"], aiContext: "RSU tax planning" },
  "/portal/self-employment-tax": { featureId: "calc-self-employment", featureName: "Self-Employment Tax", category: "calculator", relatedCalcs: ["entity-comparison", "qbi-calculator", "marginal-tax-rate", "cash-balance-plan"], dataKeys: ["seTax", "deduction"], aiContext: "self-employment tax optimization" },
  "/portal/state-tax-arbitrage": { featureId: "calc-state-tax-arb", featureName: "State Tax Arbitrage", category: "calculator", relatedCalcs: ["marginal-tax-rate", "state-tax-migration"], dataKeys: ["stateTaxDiff", "savings"], aiContext: "state tax arbitrage analysis" },
  "/portal/state-tax-migration": { featureId: "calc-state-migration", featureName: "State Tax Migration", category: "calculator", relatedCalcs: ["state-tax-arbitrage", "marginal-tax-rate", "cost-of-living"], dataKeys: ["migrationSavings", "breakeven"], aiContext: "state tax migration planning" },
  "/portal/tax-code-change-simulator": { featureId: "calc-tax-code-sim", featureName: "Tax Code Change Simulator", category: "si-engine", relatedCalcs: ["marginal-tax-rate", "capital-gains-tax", "estate-tax"], dataKeys: ["projectedImpact", "legislativeRisk"], aiContext: "tax law change simulation" },
  "/portal/tax-equivalent-yield": { featureId: "calc-tax-equiv-yield", featureName: "Tax-Equivalent Yield", category: "calculator", relatedCalcs: ["muni-bond-ladder", "bond-ladder", "marginal-tax-rate"], dataKeys: ["taxEquivYield", "muniYield"], aiContext: "tax-equivalent yield comparison" },
  "/portal/tax-gain-loss": { featureId: "calc-tax-gain-loss", featureName: "Tax Gain/Loss Harvesting", category: "calculator", relatedCalcs: ["capital-gains-tax", "tax-loss-harvest-calc", "marginal-tax-rate"], dataKeys: ["harvestedLosses", "taxSavings"], aiContext: "tax gain/loss harvesting" },
  "/portal/tax-loss-harvest-calc": { featureId: "calc-tax-loss-harvest", featureName: "Tax-Loss Harvesting", category: "calculator", relatedCalcs: ["capital-gains-tax", "tax-gain-loss", "asset-allocation"], dataKeys: ["harvestableAmount", "taxBenefit"], aiContext: "tax-loss harvesting optimization" },
  "/portal/w4-optimizer": { featureId: "calc-w4-optimizer", featureName: "W-4 Optimizer", category: "calculator", relatedCalcs: ["marginal-tax-rate", "deduction-optimizer", "roth-vs-traditional"], dataKeys: ["withholding", "refundEstimate"], aiContext: "W-4 withholding optimization" },

  // ── Retirement Calculators ──
  "/portal/fire-calculator": { featureId: "calc-fire", featureName: "FIRE Calculator", category: "calculator", relatedCalcs: ["safe-withdrawal-rate", "compound-interest", "millionaire-calculator", "retirement-budget"], dataKeys: ["fireNumber", "yearsToFIRE", "savingsRate"], aiContext: "FIRE retirement planning" },
  "/portal/rmd-calculator": { featureId: "calc-rmd", featureName: "RMD Calculator", category: "calculator", relatedCalcs: ["roth-vs-traditional", "safe-withdrawal-rate", "qlac-calculator"], dataKeys: ["rmdAmount", "accountBalance"], aiContext: "required minimum distribution planning" },
  "/portal/roth-vs-traditional": { featureId: "calc-roth-vs-trad", featureName: "Roth vs Traditional", category: "calculator", relatedCalcs: ["marginal-tax-rate", "backdoor-roth", "mega-backdoor-roth", "rmd-calculator"], dataKeys: ["rothAdvantage", "breakeven"], aiContext: "Roth vs Traditional IRA comparison" },
  "/portal/safe-withdrawal-rate": { featureId: "calc-safe-withdrawal", featureName: "Safe Withdrawal Rate", category: "calculator", relatedCalcs: ["fire-calculator", "retirement-budget", "inflation-adjusted-income"], dataKeys: ["withdrawalRate", "portfolioLongevity"], aiContext: "safe withdrawal rate analysis" },
  "/portal/pension-vs-lump-sum": { featureId: "calc-pension-lump", featureName: "Pension vs Lump Sum", category: "calculator", relatedCalcs: ["pension-max", "annuity-comparison", "safe-withdrawal-rate"], dataKeys: ["pensionValue", "lumpSumValue"], aiContext: "pension vs lump sum decision" },
  "/portal/pension-max": { featureId: "calc-pension-max", featureName: "Pension Maximization", category: "calculator", relatedCalcs: ["pension-vs-lump-sum", "life-insurance-needs", "annuity-comparison"], dataKeys: ["pensionMaxBenefit", "insuranceCost"], aiContext: "pension maximization strategy" },
  "/portal/qlac-calculator": { featureId: "calc-qlac", featureName: "QLAC Calculator", category: "calculator", relatedCalcs: ["rmd-calculator", "annuity-comparison", "safe-withdrawal-rate"], dataKeys: ["qlacIncome", "rmdReduction"], aiContext: "qualified longevity annuity contract" },
  "/portal/spousal-ss-coordination": { featureId: "calc-spousal-ss", featureName: "Spousal SS Coordination", category: "calculator", relatedCalcs: ["pension-vs-lump-sum", "safe-withdrawal-rate", "retirement-budget"], dataKeys: ["optimalAge", "lifetimeBenefit"], aiContext: "Social Security spousal coordination" },
  "/portal/social-security-bridge": { featureId: "calc-ss-bridge", featureName: "Social Security Bridge", category: "calculator", relatedCalcs: ["spousal-ss-coordination", "safe-withdrawal-rate", "retirement-budget"], dataKeys: ["bridgeAmount", "delayBenefit"], aiContext: "Social Security bridge strategy" },
  "/portal/retirement-budget": { featureId: "calc-retirement-budget", featureName: "Retirement Budget", category: "calculator", relatedCalcs: ["safe-withdrawal-rate", "fire-calculator", "inflation-adjusted-income"], dataKeys: ["monthlyBudget", "gap"], aiContext: "retirement budget planning" },
  "/portal/retirement-healthcare": { featureId: "calc-retirement-health", featureName: "Retirement Healthcare", category: "calculator", relatedCalcs: ["medicare-irmaa-calc", "aca-subsidy", "hsa-triple-tax"], dataKeys: ["healthcareCost", "coverageGap"], aiContext: "retirement healthcare cost planning" },
  "/portal/medicare-irmaa-calc": { featureId: "calc-medicare-irmaa", featureName: "Medicare IRMAA", category: "calculator", relatedCalcs: ["retirement-healthcare", "roth-vs-traditional", "rmd-calculator"], dataKeys: ["irmaaSurcharge", "magiThreshold"], aiContext: "Medicare IRMAA surcharge optimization" },
  "/portal/retirement-gap-inflation": { featureId: "calc-retirement-gap", featureName: "Retirement Gap & Inflation", category: "calculator", relatedCalcs: ["retirement-budget", "inflation-adjusted-income", "safe-withdrawal-rate"], dataKeys: ["retirementGap", "inflationImpact"], aiContext: "retirement gap and inflation analysis" },
  "/portal/inflation-adjusted-income": { featureId: "calc-inflation-income", featureName: "Inflation-Adjusted Income", category: "calculator", relatedCalcs: ["retirement-budget", "safe-withdrawal-rate", "compound-interest"], dataKeys: ["realIncome", "purchasingPower"], aiContext: "inflation-adjusted income projection" },
  "/portal/deferred-compensation": { featureId: "calc-deferred-comp", featureName: "Deferred Compensation", category: "calculator", relatedCalcs: ["marginal-tax-rate", "roth-vs-traditional", "retirement-budget"], dataKeys: ["deferralAmount", "taxSavings"], aiContext: "deferred compensation planning" },
  "/portal/cash-balance-plan": { featureId: "calc-cash-balance", featureName: "Cash Balance Plan", category: "calculator", relatedCalcs: ["self-employment-tax", "deferred-compensation", "marginal-tax-rate"], dataKeys: ["contribution", "taxDeduction"], aiContext: "cash balance plan optimization" },
  "/portal/mega-backdoor-roth": { featureId: "calc-mega-backdoor", featureName: "Mega Backdoor Roth", category: "calculator", relatedCalcs: ["backdoor-roth", "roth-vs-traditional", "marginal-tax-rate"], dataKeys: ["megaConversion", "futureValue"], aiContext: "mega backdoor Roth strategy" },
  "/portal/nua-calculator": { featureId: "calc-nua", featureName: "NUA Calculator", category: "calculator", relatedCalcs: ["capital-gains-tax", "rsu-tax", "roth-vs-traditional"], dataKeys: ["nuaSavings", "taxDifference"], aiContext: "net unrealized appreciation strategy" },
  "/portal/dca-vs-lump-sum": { featureId: "calc-dca-lump", featureName: "DCA vs Lump Sum", category: "calculator", relatedCalcs: ["compound-interest", "asset-allocation", "cost-of-waiting"], dataKeys: ["dcaReturn", "lumpSumReturn"], aiContext: "dollar cost averaging vs lump sum" },
  "/portal/savings-rate-impact": { featureId: "calc-savings-rate", featureName: "Savings Rate Impact", category: "calculator", relatedCalcs: ["fire-calculator", "compound-interest", "millionaire-calculator"], dataKeys: ["savingsRate", "yearsToGoal"], aiContext: "savings rate impact analysis" },
  "/portal/cost-of-waiting": { featureId: "calc-cost-of-waiting", featureName: "Cost of Waiting", category: "calculator", relatedCalcs: ["compound-interest", "fire-calculator", "millionaire-calculator"], dataKeys: ["costOfDelay", "lostGrowth"], aiContext: "cost of waiting to invest" },

  // ── Insurance Calculators ──
  "/portal/life-insurance-needs": { featureId: "calc-life-insurance", featureName: "Life Insurance Needs", category: "calculator", relatedCalcs: ["term-vs-whole-vs-iul", "disability-insurance-needs", "estate-liquidity"], dataKeys: ["coverageNeeded", "currentGap"], aiContext: "life insurance needs analysis" },
  "/portal/term-vs-whole-vs-iul": { featureId: "calc-term-whole-iul", featureName: "Term vs Whole vs IUL", category: "calculator", relatedCalcs: ["life-insurance-needs", "pension-max", "estate-liquidity"], dataKeys: ["bestOption", "cashValue", "deathBenefit"], aiContext: "life insurance type comparison" },
  "/portal/disability-insurance-needs": { featureId: "calc-disability", featureName: "Disability Insurance", category: "calculator", relatedCalcs: ["life-insurance-needs", "umbrella-insurance", "overhead-expense"], dataKeys: ["coverageGap", "monthlyBenefit"], aiContext: "disability insurance needs" },
  "/portal/ltc-cost": { featureId: "calc-ltc-cost", featureName: "Long-Term Care Cost", category: "calculator", relatedCalcs: ["retirement-healthcare", "life-insurance-needs", "estate-liquidity"], dataKeys: ["ltcCost", "coverageNeeded"], aiContext: "long-term care cost planning" },
  "/portal/umbrella-insurance": { featureId: "calc-umbrella", featureName: "Umbrella Insurance", category: "calculator", relatedCalcs: ["life-insurance-needs", "net-worth-tracker", "disability-insurance-needs"], dataKeys: ["coverageNeeded", "premium"], aiContext: "umbrella insurance analysis" },
  "/portal/key-person-insurance": { featureId: "calc-key-person", featureName: "Key Person Insurance", category: "calculator", relatedCalcs: ["business-valuation", "buy-sell-funding", "life-insurance-needs"], dataKeys: ["keyPersonValue", "coverageAmount"], aiContext: "key person insurance planning" },
  "/portal/buy-sell-funding": { featureId: "calc-buy-sell", featureName: "Buy-Sell Funding", category: "calculator", relatedCalcs: ["business-valuation", "key-person-insurance", "life-insurance-needs"], dataKeys: ["fundingGap", "insuranceNeeded"], aiContext: "buy-sell agreement funding" },
  "/portal/overhead-expense": { featureId: "calc-overhead", featureName: "Overhead Expense", category: "calculator", relatedCalcs: ["disability-insurance-needs", "business-valuation"], dataKeys: ["monthlyOverhead", "coveragePeriod"], aiContext: "overhead expense insurance" },
  "/portal/own-occ-disability": { featureId: "calc-own-occ", featureName: "Own-Occupation Disability", category: "calculator", relatedCalcs: ["disability-insurance-needs", "physician-contract"], dataKeys: ["ownOccBenefit", "premium"], aiContext: "own-occupation disability insurance" },
  "/portal/captive-insurance": { featureId: "calc-captive", featureName: "Captive Insurance", category: "calculator", relatedCalcs: ["entity-comparison", "marginal-tax-rate", "business-valuation"], dataKeys: ["premiumDeduction", "taxSavings"], aiContext: "captive insurance strategy" },
  "/portal/captive-insurance-iul": { featureId: "calc-captive-iul", featureName: "Captive Insurance + IUL", category: "calculator", relatedCalcs: ["captive-insurance", "term-vs-whole-vs-iul", "premium-financing"], dataKeys: ["combinedBenefit", "arbitrage"], aiContext: "captive insurance with IUL" },

  // ── Estate & Trust Calculators ──
  "/portal/estate-tax": { featureId: "calc-estate-tax", featureName: "Estate Tax Calculator", category: "calculator", relatedCalcs: ["estate-liquidity", "ilit-calculator", "grat-calculator", "gstt-calculator"], dataKeys: ["estateTax", "exemption", "taxableEstate"], aiContext: "estate tax planning" },
  "/portal/estate-liquidity": { featureId: "calc-estate-liquidity", featureName: "Estate Liquidity", category: "calculator", relatedCalcs: ["estate-tax", "life-insurance-needs", "ilit-calculator"], dataKeys: ["liquidityGap", "insuranceNeeded"], aiContext: "estate liquidity analysis" },
  "/portal/ilit-calculator": { featureId: "calc-ilit", featureName: "ILIT Calculator", category: "calculator", relatedCalcs: ["estate-tax", "life-insurance-needs", "gstt-calculator"], dataKeys: ["taxSavings", "trustValue"], aiContext: "irrevocable life insurance trust" },
  "/portal/grat-calculator": { featureId: "calc-grat", featureName: "GRAT Calculator", category: "calculator", relatedCalcs: ["estate-tax", "gstt-calculator", "crt-calculator"], dataKeys: ["gratRemainder", "taxSavings"], aiContext: "grantor retained annuity trust" },
  "/portal/gstt-calculator": { featureId: "calc-gstt", featureName: "GSTT Calculator", category: "calculator", relatedCalcs: ["estate-tax", "ilit-calculator", "dynasty-trust"], dataKeys: ["gsttLiability", "exemption"], aiContext: "generation-skipping transfer tax" },
  "/portal/qprt-calculator": { featureId: "calc-qprt", featureName: "QPRT Calculator", category: "calculator", relatedCalcs: ["estate-tax", "home-affordability"], dataKeys: ["qprtSavings", "retainedInterest"], aiContext: "qualified personal residence trust" },
  "/portal/crt-calculator": { featureId: "calc-crt", featureName: "CRT Calculator", category: "calculator", relatedCalcs: ["charitable-stock-donation", "estate-tax", "capital-gains-tax"], dataKeys: ["charitableDeduction", "incomeStream"], aiContext: "charitable remainder trust" },
  "/portal/special-needs-trust": { featureId: "calc-special-needs", featureName: "Special Needs Trust", category: "calculator", relatedCalcs: ["estate-tax", "life-insurance-needs"], dataKeys: ["trustFunding", "benefitProtection"], aiContext: "special needs trust planning" },
  "/portal/succession-plan": { featureId: "calc-succession", featureName: "Succession Plan", category: "calculator", relatedCalcs: ["business-valuation", "estate-tax", "buy-sell-funding"], dataKeys: ["successionValue", "timeline"], aiContext: "business succession planning" },
  "/portal/will-writer": { featureId: "will-writer", featureName: "Will Writer", category: "ai-pro-suite", relatedCalcs: ["estate-tax", "estate-liquidity", "ilit-calculator"], dataKeys: ["willStatus"], aiContext: "will creation and estate documents" },
  "/portal/trusts": { featureId: "trusts-page", featureName: "Trusts Overview", category: "ai-pro-suite", relatedCalcs: ["ilit-calculator", "grat-calculator", "crt-calculator", "gstt-calculator"], dataKeys: ["trustTypes"], aiContext: "trust planning overview" },

  // ── Investment & Wealth Calculators ──
  "/portal/compound-interest": { featureId: "calc-compound-interest", featureName: "Compound Interest", category: "calculator", relatedCalcs: ["fire-calculator", "millionaire-calculator", "cost-of-waiting"], dataKeys: ["futureValue", "totalInterest"], aiContext: "compound interest projection" },
  "/portal/millionaire-calculator": { featureId: "calc-millionaire", featureName: "Millionaire Calculator", category: "calculator", relatedCalcs: ["compound-interest", "fire-calculator", "savings-rate-impact"], dataKeys: ["yearsToMillion", "monthlyNeeded"], aiContext: "path to millionaire status" },
  "/portal/asset-allocation": { featureId: "calc-asset-allocation", featureName: "Asset Allocation", category: "calculator", relatedCalcs: ["portfolio-risk-return", "rebalance-alerts", "sector-rotation"], dataKeys: ["allocation", "riskLevel"], aiContext: "asset allocation optimization" },
  "/portal/portfolio-risk-return": { featureId: "calc-portfolio-risk", featureName: "Portfolio Risk/Return", category: "calculator", relatedCalcs: ["asset-allocation", "safe-withdrawal-rate", "fee-impact"], dataKeys: ["expectedReturn", "volatility", "sharpe"], aiContext: "portfolio risk-return analysis" },
  "/portal/fee-impact": { featureId: "calc-fee-impact", featureName: "Fee Impact Calculator", category: "calculator", relatedCalcs: ["compound-interest", "asset-allocation", "annuity-hidden-fee"], dataKeys: ["feeDrag", "lostGrowth"], aiContext: "investment fee impact analysis" },
  "/portal/drip-growth": { featureId: "calc-drip", featureName: "DRIP Growth Calculator", category: "calculator", relatedCalcs: ["compound-interest", "dividend-reinvestment"], dataKeys: ["dripValue", "sharesAccumulated"], aiContext: "dividend reinvestment growth" },
  "/portal/sector-rotation": { featureId: "calc-sector-rotation", featureName: "Sector Rotation", category: "calculator", relatedCalcs: ["asset-allocation", "portfolio-risk-return"], dataKeys: ["topSectors", "rotation"], aiContext: "sector rotation strategy" },
  "/portal/options-profit": { featureId: "calc-options", featureName: "Options Profit Calculator", category: "calculator", relatedCalcs: ["capital-gains-tax", "portfolio-risk-return"], dataKeys: ["maxProfit", "maxLoss", "breakeven"], aiContext: "options profit analysis" },
  "/portal/private-equity-irr": { featureId: "calc-pe-irr", featureName: "Private Equity IRR", category: "calculator", relatedCalcs: ["compound-interest", "capital-gains-tax"], dataKeys: ["irr", "multiple"], aiContext: "private equity IRR calculation" },
  "/portal/opportunity-zone": { featureId: "calc-opportunity-zone", featureName: "Opportunity Zone", category: "calculator", relatedCalcs: ["capital-gains-tax", "1031-exchange", "installment-sale"], dataKeys: ["taxDeferral", "exclusion"], aiContext: "opportunity zone investment" },
  "/portal/net-worth-tracker": { featureId: "calc-net-worth", featureName: "Net Worth Tracker", category: "calculator", relatedCalcs: ["financial-health-score", "fire-calculator", "millionaire-calculator"], dataKeys: ["netWorth", "growth"], aiContext: "net worth tracking" },
  "/portal/financial-health-score": { featureId: "calc-financial-health", featureName: "Financial Health Score", category: "calculator", relatedCalcs: ["net-worth-tracker", "debt-payoff-optimizer", "retirement-budget"], dataKeys: ["healthScore", "categories"], aiContext: "comprehensive financial health scoring" },
  "/portal/financial-freedom-number": { featureId: "calc-financial-freedom", featureName: "Financial Freedom Number", category: "calculator", relatedCalcs: ["fire-calculator", "safe-withdrawal-rate", "compound-interest"], dataKeys: ["freedomNumber", "progress"], aiContext: "financial freedom number calculation" },

  // ── Real Estate Calculators ──
  "/portal/rental-property-roi": { featureId: "calc-rental-roi", featureName: "Rental Property ROI", category: "calculator", relatedCalcs: ["depreciation-tax-shield", "1031-exchange", "home-affordability"], dataKeys: ["roi", "cashFlow", "capRate"], aiContext: "rental property ROI analysis" },
  "/portal/1031-exchange": { featureId: "calc-1031", featureName: "1031 Exchange", category: "calculator", relatedCalcs: ["capital-gains-tax", "rental-property-roi", "opportunity-zone"], dataKeys: ["deferredGain", "exchangeValue"], aiContext: "1031 exchange planning" },
  "/portal/home-affordability": { featureId: "calc-home-afford", featureName: "Home Affordability", category: "calculator", relatedCalcs: ["mortgage-killer-v3", "refinance-breakeven", "property-tax-appeal"], dataKeys: ["maxPrice", "monthlyPayment"], aiContext: "home affordability analysis" },
  "/portal/refinance-breakeven": { featureId: "calc-refinance", featureName: "Refinance Break-Even", category: "calculator", relatedCalcs: ["home-affordability", "mortgage-killer-v3"], dataKeys: ["breakevenMonths", "monthlySavings"], aiContext: "refinance break-even analysis" },
  "/portal/reverse-mortgage": { featureId: "calc-reverse-mortgage", featureName: "Reverse Mortgage", category: "calculator", relatedCalcs: ["home-affordability", "retirement-budget", "safe-withdrawal-rate"], dataKeys: ["loanAmount", "equity"], aiContext: "reverse mortgage analysis" },
  "/portal/vacation-rental": { featureId: "calc-vacation-rental", featureName: "Vacation Rental", category: "calculator", relatedCalcs: ["rental-property-roi", "depreciation-tax-shield", "str-strategy"], dataKeys: ["rentalIncome", "roi"], aiContext: "vacation rental investment" },
  "/portal/property-tax-appeal": { featureId: "calc-property-tax", featureName: "Property Tax Appeal", category: "calculator", relatedCalcs: ["home-affordability", "rental-property-roi"], dataKeys: ["potentialSavings", "assessedValue"], aiContext: "property tax appeal analysis" },
  "/portal/lease-vs-buy": { featureId: "calc-lease-buy", featureName: "Lease vs Buy", category: "calculator", relatedCalcs: ["home-affordability", "compound-interest", "cost-of-living"], dataKeys: ["leaseCost", "buyCost", "breakeven"], aiContext: "lease vs buy decision" },
  "/portal/like-kind-exchange": { featureId: "calc-like-kind", featureName: "Like-Kind Exchange", category: "calculator", relatedCalcs: ["1031-exchange", "capital-gains-tax"], dataKeys: ["exchangeValue", "deferredTax"], aiContext: "like-kind exchange planning" },
  "/portal/mortgage-killer-v3": { featureId: "mortgage-killer-v3", featureName: "Mortgage Killer V3", category: "si-engine", relatedCalcs: ["home-affordability", "refinance-breakeven", "compound-interest"], dataKeys: ["mortgageSaved", "propertiesAcquired", "portfolioValue"], aiContext: "HELOC-to-IUL mortgage elimination" },
  "/portal/str-strategy": { featureId: "str-strategy", featureName: "Short-Term Rental Strategy", category: "si-engine", relatedCalcs: ["rental-property-roi", "depreciation-tax-shield", "vacation-rental"], dataKeys: ["taxSavings", "rentalIncome", "appreciation"], aiContext: "short-term rental tax strategy" },

  // ── Debt & Budget Calculators ──
  "/portal/debt-payoff-optimizer": { featureId: "calc-debt-payoff", featureName: "Debt Payoff Optimizer", category: "calculator", relatedCalcs: ["credit-card-payoff", "student-loan-vs-invest", "financial-health-score"], dataKeys: ["payoffDate", "interestSaved"], aiContext: "debt payoff optimization" },
  "/portal/credit-card-payoff": { featureId: "calc-credit-card", featureName: "Credit Card Payoff", category: "calculator", relatedCalcs: ["debt-payoff-optimizer", "zero-based-budget"], dataKeys: ["payoffMonths", "totalInterest"], aiContext: "credit card payoff planning" },
  "/portal/student-loan-vs-invest": { featureId: "calc-student-loan", featureName: "Student Loan vs Invest", category: "calculator", relatedCalcs: ["debt-payoff-optimizer", "compound-interest", "pslf-calculator"], dataKeys: ["loanCost", "investmentGain"], aiContext: "student loan vs investing decision" },
  "/portal/budget-50-30-20": { featureId: "calc-budget", featureName: "50/30/20 Budget", category: "calculator", relatedCalcs: ["zero-based-budget", "savings-rate-impact", "financial-health-score"], dataKeys: ["needs", "wants", "savings"], aiContext: "50/30/20 budget planning" },
  "/portal/zero-based-budget": { featureId: "calc-zero-budget", featureName: "Zero-Based Budget", category: "calculator", relatedCalcs: ["budget-50-30-20", "savings-rate-impact", "financial-health-score"], dataKeys: ["totalAllocated", "surplus"], aiContext: "zero-based budgeting" },
  "/portal/emergency-fund-vs-iul": { featureId: "calc-emergency-iul", featureName: "Emergency Fund vs IUL", category: "calculator", relatedCalcs: ["term-vs-whole-vs-iul", "compound-interest"], dataKeys: ["iulAdvantage", "liquidityComparison"], aiContext: "emergency fund vs IUL comparison" },
  "/portal/cost-of-living": { featureId: "calc-cost-of-living", featureName: "Cost of Living", category: "calculator", relatedCalcs: ["state-tax-migration", "retirement-budget", "home-affordability"], dataKeys: ["costIndex", "comparison"], aiContext: "cost of living comparison" },
  "/portal/lifestyle-inflation": { featureId: "calc-lifestyle-inflation", featureName: "Lifestyle Inflation", category: "calculator", relatedCalcs: ["savings-rate-impact", "fire-calculator", "compound-interest"], dataKeys: ["inflationRate", "wealthImpact"], aiContext: "lifestyle inflation impact" },
  "/portal/spend-vs-invest": { featureId: "calc-spend-invest", featureName: "Spend vs Invest", category: "calculator", relatedCalcs: ["compound-interest", "cost-of-waiting", "lifestyle-inflation"], dataKeys: ["opportunityCost", "futureValue"], aiContext: "spending vs investing comparison" },
  "/portal/windfall-management": { featureId: "calc-windfall", featureName: "Windfall Management", category: "calculator", relatedCalcs: ["asset-allocation", "marginal-tax-rate", "compound-interest"], dataKeys: ["allocationPlan", "taxImpact"], aiContext: "windfall management strategy" },
  "/portal/severance-calculator": { featureId: "calc-severance", featureName: "Severance Calculator", category: "calculator", relatedCalcs: ["marginal-tax-rate", "unemployment-bridge"], dataKeys: ["severanceTax", "netAmount"], aiContext: "severance package analysis" },
  "/portal/sabbatical-planner": { featureId: "calc-sabbatical", featureName: "Sabbatical Planner", category: "calculator", relatedCalcs: ["savings-rate-impact", "retirement-budget", "fire-calculator"], dataKeys: ["sabbaticalCost", "savingsNeeded"], aiContext: "sabbatical financial planning" },

  // ── Annuity Calculators ──
  "/portal/annuity-comparison": { featureId: "calc-annuity-comparison", featureName: "Annuity Comparison", category: "calculator", relatedCalcs: ["pension-vs-lump-sum", "safe-withdrawal-rate", "qlac-calculator"], dataKeys: ["bestAnnuity", "guaranteedIncome"], aiContext: "annuity product comparison" },
  "/portal/annuity-hidden-fee": { featureId: "calc-annuity-fee", featureName: "Annuity Hidden Fee Scanner", category: "calculator", relatedCalcs: ["annuity-comparison", "fee-impact"], dataKeys: ["hiddenFees", "totalCost"], aiContext: "annuity hidden fee detection" },
  "/portal/annuity-memory": { featureId: "annuity-memory", featureName: "Annuity Memory", category: "si-engine", relatedCalcs: ["annuity-comparison", "annuity-hidden-fee"], dataKeys: ["memoryFeature"], aiContext: "annuity memory feature analysis" },
  "/portal/athene-guaranteed-income": { featureId: "calc-athene", featureName: "Athene Guaranteed Income", category: "calculator", relatedCalcs: ["annuity-comparison", "safe-withdrawal-rate", "qlac-calculator"], dataKeys: ["guaranteedIncome", "rollupRate"], aiContext: "Athene guaranteed income analysis" },
  "/portal/annuity-accumulation-db": { featureId: "calc-annuity-accum", featureName: "Annuity Accumulation DB", category: "calculator", relatedCalcs: ["annuity-comparison", "compound-interest"], dataKeys: ["accumulationValue", "deathBenefit"], aiContext: "annuity accumulation with death benefit" },

  // ── Education Calculators ──
  "/portal/education-529-vs-iul": { featureId: "calc-529-vs-iul", featureName: "529 vs IUL for Education", category: "calculator", relatedCalcs: ["compound-interest", "term-vs-whole-vs-iul"], dataKeys: ["plan529Value", "iulValue"], aiContext: "529 vs IUL education funding" },
  "/portal/idr-comparison": { featureId: "calc-idr", featureName: "IDR Comparison", category: "calculator", relatedCalcs: ["student-loan-vs-invest", "pslf-calculator"], dataKeys: ["monthlyPayment", "totalPaid"], aiContext: "income-driven repayment comparison" },
  "/portal/pslf-calculator": { featureId: "calc-pslf", featureName: "PSLF Calculator", category: "calculator", relatedCalcs: ["student-loan-vs-invest", "idr-comparison"], dataKeys: ["forgivenAmount", "paymentsRemaining"], aiContext: "public service loan forgiveness" },
  "/portal/residency-to-attending": { featureId: "calc-residency", featureName: "Residency to Attending", category: "calculator", relatedCalcs: ["pslf-calculator", "physician-contract", "compound-interest"], dataKeys: ["incomeJump", "debtPayoff"], aiContext: "physician residency to attending transition" },

  // ── Charitable Calculators ──
  "/portal/charitable-stock-donation": { featureId: "calc-charitable-stock", featureName: "Charitable Stock Donation", category: "calculator", relatedCalcs: ["capital-gains-tax", "deduction-optimizer", "crt-calculator"], dataKeys: ["taxSavings", "charityValue"], aiContext: "charitable stock donation strategy" },
  "/portal/daf-vs-direct-giving": { featureId: "calc-daf-direct", featureName: "DAF vs Direct Giving", category: "calculator", relatedCalcs: ["charitable-stock-donation", "deduction-optimizer", "crt-calculator"], dataKeys: ["dafAdvantage", "taxBenefit"], aiContext: "donor-advised fund vs direct giving" },
  "/portal/crt-wealth-replacement": { featureId: "crt-wealth-replace", featureName: "CRT Wealth Replacement", category: "si-engine", relatedCalcs: ["crt-calculator", "ilit-calculator", "estate-tax"], dataKeys: ["replacementValue"], aiContext: "CRT wealth replacement strategy" },

  // ── Physician & Specialty ──
  "/portal/physician-contract": { featureId: "calc-physician-contract", featureName: "Physician Contract", category: "calculator", relatedCalcs: ["own-occ-disability", "residency-to-attending", "marginal-tax-rate"], dataKeys: ["contractValue", "benefits"], aiContext: "physician contract analysis" },
  "/portal/physicians-edge": { featureId: "physicians-edge", featureName: "Physician's Edge", category: "ai-pro-suite", relatedCalcs: ["physician-contract", "pslf-calculator", "own-occ-disability"], dataKeys: ["physicianPlan"], aiContext: "physician-specific financial planning" },
  "/portal/physician-forum": { featureId: "physician-forum", featureName: "Physician Forum", category: "ai-pro-suite", relatedCalcs: ["physician-contract"], dataKeys: ["forumActivity"], aiContext: "physician community forum" },

  // ── Business Calculators ──
  "/portal/business-valuation": { featureId: "calc-business-val", featureName: "Business Valuation", category: "calculator", relatedCalcs: ["succession-plan", "buy-sell-funding", "esop-calculator"], dataKeys: ["valuation", "multiple"], aiContext: "business valuation" },
  "/portal/commission-calculator": { featureId: "calc-commission", featureName: "Commission Calculator", category: "calculator", relatedCalcs: ["advisor-income-calculator"], dataKeys: ["commission", "revenue"], aiContext: "commission calculation" },
  "/portal/advisor-income-calculator": { featureId: "calc-advisor-income", featureName: "Advisor Income Calculator", category: "calculator", relatedCalcs: ["commission-calculator"], dataKeys: ["totalIncome", "projectedGrowth"], aiContext: "advisor income projection" },

  // ── Misc Calculators ──
  "/portal/hsa-triple-tax": { featureId: "calc-hsa", featureName: "HSA Triple Tax Advantage", category: "calculator", relatedCalcs: ["retirement-healthcare", "deduction-optimizer", "marginal-tax-rate"], dataKeys: ["hsaValue", "taxSavings"], aiContext: "HSA triple tax advantage" },
  "/portal/bond-ladder": { featureId: "calc-bond-ladder", featureName: "Bond Ladder", category: "calculator", relatedCalcs: ["tax-equivalent-yield", "safe-withdrawal-rate", "asset-allocation"], dataKeys: ["ladderYield", "maturitySchedule"], aiContext: "bond ladder construction" },
  "/portal/muni-bond-ladder": { featureId: "calc-muni-bond", featureName: "Municipal Bond Ladder", category: "calculator", relatedCalcs: ["bond-ladder", "tax-equivalent-yield", "marginal-tax-rate"], dataKeys: ["taxFreeYield", "afterTaxReturn"], aiContext: "municipal bond ladder strategy" },
  "/portal/multi-currency-wealth": { featureId: "calc-multi-currency", featureName: "Multi-Currency Wealth", category: "calculator", relatedCalcs: ["asset-allocation", "compound-interest"], dataKeys: ["totalWealth", "fxImpact"], aiContext: "multi-currency wealth management" },

  // ── AI & Intelligence Tools ──
  "/portal/ai-meeting-notes": { featureId: "ai-meeting-notes", featureName: "AI Meeting Notes", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["meetingCount", "actionItems"], aiContext: "AI-powered meeting notes" },
  "/portal/ai-slide-generator": { featureId: "ai-slide-gen", featureName: "AI Slide Generator", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["slidesGenerated"], aiContext: "AI presentation generator" },
  "/portal/ai-deal-closer": { featureId: "ai-deal-closer", featureName: "AI Deal Closer", category: "ai-pro-suite", relatedCalcs: ["commission-calculator"], dataKeys: ["closingRate", "dealValue"], aiContext: "AI deal closing assistant" },
  "/portal/ai-strategy-lab": { featureId: "ai-strategy-lab", featureName: "AI Strategy Lab", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["strategiesGenerated"], aiContext: "AI strategy generation lab" },
  "/portal/ai-wealth-concierge": { featureId: "ai-wealth-concierge", featureName: "AI Wealth Concierge", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["conciergeInteractions"], aiContext: "AI wealth concierge service" },
  "/portal/ai-policy-review-gap": { featureId: "ai-policy-review", featureName: "AI Policy Review & Gap", category: "ai-pro-suite", relatedCalcs: ["life-insurance-needs", "disability-insurance-needs", "umbrella-insurance"], dataKeys: ["gaps", "recommendations"], aiContext: "AI policy review and gap analysis" },
  "/portal/live-copilot": { featureId: "live-copilot", featureName: "Live CoPilot", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["copilotSessions"], aiContext: "live AI copilot for meetings" },
  "/portal/war-story-generator": { featureId: "war-story-gen", featureName: "War Story Generator", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["storiesGenerated"], aiContext: "AI case study generator" },
  "/portal/video-proposal-generator": { featureId: "video-proposal-gen", featureName: "Video Proposal Generator", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["videosGenerated"], aiContext: "AI video proposal generator" },
  "/portal/client-story-generator": { featureId: "client-story-gen", featureName: "Client Story Generator", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["storiesGenerated"], aiContext: "client success story generator" },

  // ── Strategy & Combos ──
  "/portal/tax-free-wealth-combos": { featureId: "tax-free-combos", featureName: "Tax-Free Wealth Combos", category: "si-engine", relatedCalcs: ["marginal-tax-rate", "estate-tax", "compound-interest"], dataKeys: ["combosViewed"], aiContext: "tax-free wealth combination strategies" },
  "/portal/secret-secrets": { featureId: "secret-secrets", featureName: "Secret Strategies", category: "si-engine", relatedCalcs: ["marginal-tax-rate", "compound-interest"], dataKeys: ["secretsViewed"], aiContext: "secret wealth strategies" },
  "/portal/strategy-compare": { featureId: "strategy-compare", featureName: "Strategy Comparison", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["comparisons"], aiContext: "strategy comparison tool" },
  "/portal/combo-recommender": { featureId: "combo-recommender", featureName: "Combo Recommender", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["recommendations"], aiContext: "strategy combo recommender" },
  "/portal/strategy-synergy-hub": { featureId: "strategy-synergy", featureName: "Strategy Synergy Hub", category: "si-engine", relatedCalcs: [], dataKeys: ["synergies"], aiContext: "strategy synergy discovery" },

  // ── Compliance & Admin ──
  "/portal/compliance-alerts": { featureId: "compliance-alerts", featureName: "Compliance Alerts", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["alertCount"], aiContext: "compliance alert monitoring" },
  "/portal/compliance-audit-center": { featureId: "compliance-audit", featureName: "Compliance Audit Center", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["auditStatus"], aiContext: "compliance audit management" },
  "/portal/compliance-monitoring-dashboard": { featureId: "compliance-monitoring", featureName: "Compliance Monitoring", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["monitoringStatus"], aiContext: "compliance monitoring dashboard" },
  "/portal/compliance-doc-generator": { featureId: "compliance-doc-gen", featureName: "Compliance Doc Generator", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["docsGenerated"], aiContext: "compliance document generation" },
  "/portal/compliance-report-generator": { featureId: "compliance-report-gen", featureName: "Compliance Report Generator", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["reportsGenerated"], aiContext: "compliance report generation" },

  // ── Gamification & Engagement ──
  "/portal/leaderboard": { featureId: "leaderboard", featureName: "Leaderboard", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["rank", "points"], aiContext: "advisor leaderboard" },
  "/portal/pet-system": { featureId: "pet-system", featureName: "Pet System", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["petLevel", "petType"], aiContext: "gamification pet system" },
  "/portal/rewards-vault": { featureId: "rewards-vault", featureName: "Rewards Vault", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["rewardsEarned"], aiContext: "rewards and achievements" },
  "/portal/daily-briefing": { featureId: "daily-briefing", featureName: "Daily Briefing", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["briefingItems"], aiContext: "daily financial briefing" },
  "/portal/daily-discovery": { featureId: "daily-discovery", featureName: "Daily Discovery", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["discoveries"], aiContext: "daily feature discovery" },
  "/portal/morning-ritual": { featureId: "morning-ritual", featureName: "Morning Ritual", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["ritualComplete"], aiContext: "morning financial ritual" },
  "/portal/russell-number": { featureId: "russell-number", featureName: "Russell Number", category: "si-engine", relatedCalcs: ["financial-health-score", "net-worth-tracker"], dataKeys: ["russellNumber", "level"], aiContext: "Russell Number score" },
  "/portal/russell-wrapped": { featureId: "russell-wrapped", featureName: "Russell Wrapped", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["yearInReview"], aiContext: "annual year-in-review" },

  // ── Practice Management ──
  "/portal/commission-tracker": { featureId: "commission-tracker", featureName: "Commission Tracker", category: "ai-pro-suite", relatedCalcs: ["commission-calculator"], dataKeys: ["totalCommissions", "pending"], aiContext: "commission tracking" },
  "/portal/commission-optimizer": { featureId: "commission-optimizer", featureName: "Commission Optimizer", category: "ai-pro-suite", relatedCalcs: ["commission-calculator"], dataKeys: ["optimizedRevenue"], aiContext: "commission optimization" },
  "/portal/referral-tracker": { featureId: "referral-tracker", featureName: "Referral Tracker", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["referrals", "conversionRate"], aiContext: "referral tracking" },
  "/portal/lead-generator": { featureId: "lead-generator", featureName: "Lead Generator", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["leadsGenerated"], aiContext: "lead generation" },
  "/portal/meetings": { featureId: "meetings", featureName: "Meetings", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["meetingCount"], aiContext: "meeting management" },
  "/portal/meeting-agenda": { featureId: "meeting-agenda", featureName: "Meeting Agenda", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["agendaItems"], aiContext: "meeting agenda creation" },
  "/portal/team": { featureId: "team", featureName: "Team Management", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["teamSize"], aiContext: "team management" },
  "/portal/team-management": { featureId: "team-mgmt", featureName: "Team Management", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["teamMetrics"], aiContext: "team performance management" },

  // ── Presentations & Content ──
  "/portal/presentation-builder": { featureId: "presentation-builder", featureName: "Presentation Builder", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["presentations"], aiContext: "presentation creation" },
  "/portal/presentation-vault": { featureId: "presentation-vault", featureName: "Presentation Vault", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["savedPresentations"], aiContext: "presentation library" },
  "/portal/my-slides": { featureId: "my-slides", featureName: "My Slides", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["slideDecks"], aiContext: "slide management" },
  "/portal/seminar-generator": { featureId: "seminar-gen", featureName: "Seminar Generator", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["seminarsCreated"], aiContext: "seminar content generation" },
  "/portal/email-campaign-manager": { featureId: "email-campaign", featureName: "Email Campaign Manager", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["campaignsSent"], aiContext: "email campaign management" },
  "/portal/video-library": { featureId: "video-library", featureName: "Video Library", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["videosAvailable"], aiContext: "video content library" },

  // ── Settings & Admin ──
  "/portal/carrier-quotes": { featureId: "carrier-quotes", featureName: "Carrier Quotes", category: "ai-pro-suite", relatedCalcs: ["term-vs-whole-vs-iul", "annuity-comparison"], dataKeys: ["quotesReceived"], aiContext: "insurance carrier quotes" },
  "/portal/carrier-ratings": { featureId: "carrier-ratings", featureName: "Carrier Ratings", category: "ai-pro-suite", relatedCalcs: ["term-vs-whole-vs-iul"], dataKeys: ["topCarriers"], aiContext: "insurance carrier ratings" },
  "/portal/carrier-settings": { featureId: "carrier-settings", featureName: "Carrier Settings", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["carrierConfig"], aiContext: "carrier configuration" },
  "/portal/market-data-dashboard": { featureId: "market-data", featureName: "Market Data Dashboard", category: "ai-pro-suite", relatedCalcs: ["asset-allocation", "portfolio-risk-return"], dataKeys: ["marketIndices"], aiContext: "market data monitoring" },
  "/portal/integrations": { featureId: "integrations", featureName: "Integrations", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["activeIntegrations"], aiContext: "third-party integrations" },
  "/portal/billing": { featureId: "billing", featureName: "Billing", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["billingStatus"], aiContext: "billing management" },
  "/portal/workspace-branding": { featureId: "workspace-branding", featureName: "Workspace Branding", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["brandConfig"], aiContext: "workspace branding" },
  "/portal/website-usage": { featureId: "website-usage", featureName: "Website Usage", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["usageMetrics"], aiContext: "website usage analytics" },
  "/portal/usage-analytics-dashboard": { featureId: "usage-analytics", featureName: "Usage Analytics", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["analyticsData"], aiContext: "usage analytics dashboard" },

  // ── Advanced Features ──
  "/portal/divorce-calculator": { featureId: "divorce-calc", featureName: "Divorce Calculator", category: "si-engine", relatedCalcs: ["divorce-settlement", "alimony-tax", "estate-tax"], dataKeys: ["divorceImpact", "protectedAssets"], aiContext: "divorce financial impact calculator" },
  "/portal/time-machine": { featureId: "time-machine", featureName: "Time Machine", category: "si-engine", relatedCalcs: ["compound-interest", "cost-of-waiting"], dataKeys: ["historicalReturn"], aiContext: "historical what-if time machine" },
  "/portal/generational-wealth-sim": { featureId: "gen-wealth-sim", featureName: "Generational Wealth Simulator", category: "si-engine", relatedCalcs: ["estate-tax", "compound-interest", "ilit-calculator"], dataKeys: ["generationalWealth"], aiContext: "multi-generational wealth simulation" },
  "/portal/generational-wealth-simulator": { featureId: "gen-wealth-sim-2", featureName: "Generational Wealth Simulator", category: "si-engine", relatedCalcs: ["estate-tax", "compound-interest"], dataKeys: ["dynastyWealth"], aiContext: "dynasty wealth simulation" },
  "/portal/family-tree-financial": { featureId: "family-tree", featureName: "Family Tree Financial", category: "si-engine", relatedCalcs: ["estate-tax", "gstt-calculator"], dataKeys: ["familyWealth"], aiContext: "family financial tree visualization" },
  "/portal/financial-dna": { featureId: "financial-dna", featureName: "Financial DNA", category: "si-engine", relatedCalcs: ["financial-health-score", "asset-allocation"], dataKeys: ["dnaProfile"], aiContext: "financial personality DNA" },
  "/portal/premium-financing-arbitrage": { featureId: "premium-financing", featureName: "Premium Financing Arbitrage", category: "si-engine", relatedCalcs: ["term-vs-whole-vs-iul", "compound-interest"], dataKeys: ["arbitrageSpread", "netBenefit"], aiContext: "premium financing arbitrage strategy" },
  "/portal/multi-carrier-iul-optimizer": { featureId: "multi-carrier-iul", featureName: "Multi-Carrier IUL Optimizer", category: "si-engine", relatedCalcs: ["term-vs-whole-vs-iul", "carrier-ratings"], dataKeys: ["bestCarrier", "projectedValue"], aiContext: "multi-carrier IUL comparison" },
  "/portal/policy-replacement-analyzer": { featureId: "policy-replacement", featureName: "Policy Replacement Analyzer", category: "si-engine", relatedCalcs: ["term-vs-whole-vs-iul", "life-insurance-needs"], dataKeys: ["replacementBenefit"], aiContext: "policy replacement analysis" },
  "/portal/iul-compliance-engine": { featureId: "iul-compliance", featureName: "IUL Compliance Engine", category: "si-engine", relatedCalcs: ["term-vs-whole-vs-iul"], dataKeys: ["complianceScore"], aiContext: "IUL compliance monitoring" },
  "/portal/living-benefits-probability": { featureId: "living-benefits", featureName: "Living Benefits Probability", category: "si-engine", relatedCalcs: ["life-insurance-needs", "disability-insurance-needs"], dataKeys: ["claimProbability"], aiContext: "living benefits probability analysis" },
  "/portal/disability-gap-analysis": { featureId: "disability-gap", featureName: "Disability Gap Analysis", category: "si-engine", relatedCalcs: ["disability-insurance-needs", "own-occ-disability"], dataKeys: ["coverageGap"], aiContext: "disability coverage gap analysis" },
  "/portal/annual-financial-physical": { featureId: "annual-physical", featureName: "Annual Financial Physical", category: "ai-pro-suite", relatedCalcs: ["financial-health-score", "net-worth-tracker"], dataKeys: ["physicalResults"], aiContext: "annual financial health checkup" },
  "/portal/retirement-advantage": { featureId: "retirement-advantage", featureName: "Retirement Advantage", category: "si-engine", relatedCalcs: ["safe-withdrawal-rate", "fire-calculator", "annuity-comparison"], dataKeys: ["retirementScore"], aiContext: "retirement advantage analysis" },
  "/portal/calculator-hub": { featureId: "calculator-hub", featureName: "Calculator Hub", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["calculatorsUsed"], aiContext: "central calculator hub" },
  "/portal/innovation-dashboard": { featureId: "innovation-dashboard", featureName: "Innovation Dashboard", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["innovations"], aiContext: "platform innovation tracking" },
  "/portal/knowledge": { featureId: "knowledge", featureName: "Knowledge Base", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["articles"], aiContext: "knowledge base" },
  "/portal/education-hub": { featureId: "education-hub", featureName: "Education Hub", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["courses"], aiContext: "financial education hub" },
  "/portal/advisor-training": { featureId: "advisor-training", featureName: "Advisor Training", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["trainingProgress"], aiContext: "advisor training platform" },
  "/portal/patent-showcase": { featureId: "patent-showcase", featureName: "Patent Showcase", category: "ai-pro-suite", relatedCalcs: [], dataKeys: ["patents"], aiContext: "patent portfolio showcase" },
};

/* ═══════════════════════════════════════════════════════════════════
   SYNAPTIC NETWORK (S2) — Calc-to-Calc Communication Protocol
   When a calculator produces results, the synaptic network
   automatically identifies which other calculators should be
   notified and what data they need.
   ═══════════════════════════════════════════════════════════════════ */
interface SynapticPulse {
  sourceCalc: string;
  targetCalcs: string[];
  dataKeys: string[];
  timestamp: number;
}

const synapticLog: SynapticPulse[] = [];

function fireSynapticPulse(sourceRoute: string, data: Record<string, any>) {
  const intel = ROUTE_INTELLIGENCE[sourceRoute];
  if (!intel?.relatedCalcs.length) return;
  
  const pulse: SynapticPulse = {
    sourceCalc: intel.featureId,
    targetCalcs: intel.relatedCalcs,
    dataKeys: Object.keys(data),
    timestamp: Date.now(),
  };
  synapticLog.push(pulse);
  // Keep log bounded
  if (synapticLog.length > 500) synapticLog.splice(0, 250);
}

/* ═══════════════════════════════════════════════════════════════════
   SYNCHRONICITY CORE (S3) — Central Heartbeat
   Tracks the overall health and connectivity of the neural mesh.
   ═══════════════════════════════════════════════════════════════════ */
interface MeshHealth {
  connectedPages: number;
  totalPages: number;
  dataBusEntries: number;
  aiBrainConnections: number;
  synapticPulses: number;
  lastHeartbeat: number;
  healthScore: number; // 0-100
}

let meshHealthSnapshot: MeshHealth = {
  connectedPages: 0,
  totalPages: 384,
  dataBusEntries: 0,
  aiBrainConnections: 0,
  synapticPulses: 0,
  lastHeartbeat: Date.now(),
  healthScore: 0,
};

export function getMeshHealth(): MeshHealth {
  return { ...meshHealthSnapshot };
}

export function getSynapticLog(): SynapticPulse[] {
  return [...synapticLog];
}

/* ═══════════════════════════════════════════════════════════════════
   NEURAL MESH INTERCEPTOR — The Main Component
   Mounted once inside AppShell, auto-connects every page.
   ═══════════════════════════════════════════════════════════════════ */
export function NeuralMeshInterceptor() {
  const [location] = useLocation();
  const { report, getAllEntries } = useUnifiedDataBus();
  const { reportData, state: aiBrainState } = useAIBrain();
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();
  const prevLocationRef = useRef<string>("");
  const visitCountRef = useRef<Record<string, number>>({});

  // Normalize route — strip trailing slash, handle dynamic segments
  const normalizedRoute = useMemo(() => {
    let route = location.replace(/\/$/, "") || "/portal";
    // Handle dynamic routes like /portal/clients/:id → /portal/clients
    if (/^\/portal\/clients\/\d+/.test(route)) route = "/portal/clients";
    if (/^\/portal\/combo\//.test(route)) route = "/portal/tax-free-wealth-combos";
    if (/^\/portal\/secret\//.test(route)) route = "/portal/secret-secrets";
    return route;
  }, [location]);

  // Get intelligence for current page
  const pageIntel = useMemo(() => {
    return ROUTE_INTELLIGENCE[normalizedRoute] || null;
  }, [normalizedRoute]);

  // ── AUTO-REPORT TO DATA BUS (S1 + S4) ──
  useEffect(() => {
    if (!pageIntel || normalizedRoute === prevLocationRef.current) return;
    prevLocationRef.current = normalizedRoute;

    // Track visit count
    visitCountRef.current[normalizedRoute] = (visitCountRef.current[normalizedRoute] || 0) + 1;

    // Build payload from available data
    const payload: Record<string, any> = {
      visited: true,
      visitCount: visitCountRef.current[normalizedRoute],
      timestamp: Date.now(),
    };

    // Inject client data if available
    if (clientData) {
      payload.clientName = clientData.clientName;
      payload.clientAge = clientData.age;
      payload.clientIncome = clientData.annualIncome;
      payload.clientNetWorth = (clientData.cashSavings || 0) + (clientData.taxableInvestments || 0) + 
        (clientData.realEstateEquity || 0) + (clientData.iraBalance || 0) + (clientData.rothBalance || 0) +
        (clientData.k401Balance || 0) + (clientData.lifeInsuranceCv || 0) - (clientData.mortgageBalance || 0) - (clientData.otherDebt || 0);
      payload.clientState = clientData.state;
      payload.clientRiskTolerance = clientData.riskTolerance;
    }

    // Inject relevant calculator results
    if (pageIntel.relatedCalcs.length > 0) {
      for (const relatedCalc of pageIntel.relatedCalcs) {
        const result = calcResults[relatedCalc];
        if (result?.summary) {
          payload[`related_${relatedCalc.replace(/-/g, '_')}`] = true;
          // Pull key metrics from related calc
          const summary = result.summary;
          for (const [key, value] of Object.entries(summary)) {
            if (typeof value === 'number' && !isNaN(value)) {
              payload[`${relatedCalc.replace(/-/g, '_')}_${key}`] = value;
            }
          }
        }
      }
    }

    // Report to Data Bus
    report({
      featureId: pageIntel.featureId,
      featureName: pageIntel.featureName,
      category: pageIntel.category,
      route: normalizedRoute,
      payload,
    });

    // Fire synaptic pulse (S2)
    fireSynapticPulse(normalizedRoute, payload);
  }, [normalizedRoute, pageIntel, report, clientData, calcResults]);

  // ── AUTO-CONNECT TO AI BRAIN (S5) ──
  useEffect(() => {
    if (!pageIntel) return;

    // Build AI context from all available data
    const aiData: Record<string, any> = {
      page: pageIntel.featureName,
      category: pageIntel.category,
      relatedCalculators: pageIntel.relatedCalcs,
      context: pageIntel.aiContext,
    };

    // Add client context
    if (clientData) {
      aiData.clientProfile = {
        name: clientData.clientName,
        age: clientData.age,
        income: clientData.annualIncome,
        state: clientData.state,
        riskTolerance: clientData.riskTolerance,
        retirementAge: clientData.retirementAge,
      };
    }

    // Add cross-calculator intelligence
    const relatedResults: Record<string, any> = {};
    for (const calc of pageIntel.relatedCalcs) {
      if (calcResults[calc]?.summary) {
        relatedResults[calc] = calcResults[calc].summary;
      }
    }
    if (Object.keys(relatedResults).length > 0) {
      aiData.relatedCalculatorResults = relatedResults;
    }

    // Report to AI Brain
    reportData(pageIntel.aiContext, aiData);
  }, [pageIntel, reportData, clientData, calcResults]);

  // ── SYNCHRONICITY CORE HEARTBEAT (S3) ──
  useEffect(() => {
    const allData = getAllEntries();
    meshHealthSnapshot = {
      connectedPages: Object.keys(visitCountRef.current).length,
      totalPages: 384,
      dataBusEntries: allData.length,
      aiBrainConnections: aiBrainState.totalConnectedFeatures,
      synapticPulses: synapticLog.length,
      lastHeartbeat: Date.now(),
      healthScore: Math.min(100, Math.round(
        (Object.keys(visitCountRef.current).length / 384) * 25 +
        (allData.length / 50) * 25 +
        (aiBrainState.totalConnectedFeatures / 20) * 25 +
        (synapticLog.length / 100) * 25
      )),
    };
  }, [getAllEntries, aiBrainState, normalizedRoute]);

  // This is a data-only interceptor — no UI
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   EXPORTS — For use by other components
   ═══════════════════════════════════════════════════════════════════ */
export { ROUTE_INTELLIGENCE, type PageIntelligence, type SynapticPulse, type MeshHealth };
