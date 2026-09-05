// Medical-themed 10-tab navigation tree
// Each NavNode is either a folder (has children) or a leaf (has path or isPlaceholder).

export type NavNode = {
  label: string;
  icon?: any;
  color?: string;
  path?: string;
  isPlaceholder?: boolean;
  children?: NavNode[];
  defaultOpen?: boolean;
};

// ── Short-hand helpers ─────────────────────────────────────────────────────
const l = (label: string, path: string): NavNode => ({ label, path });
const ph = (label: string): NavNode => ({ label, isPlaceholder: true });

// ── Icon imports are resolved in the renderer (AppShell) ──────────────────
// We keep this file free of React deps by using string tags for icons.
// The renderer maps these tags to lucide components via ICON_MAP.
export type IconTag =
  | "stethoscope" | "heart" | "heart-pulse" | "activity" | "leaf"
  | "search" | "presentation" | "clock" | "trophy" | "dna"
  | "clipboard-list" | "bar-chart" | "network" | "archive" | "layers"
  | "shield" | "briefcase" | "users" | "dollar" | "zap"
  | "piggy-bank" | "landmark" | "receipt" | "lock" | "brain"
  | "trending-up" | "home" | "recycle" | "graduation" | "crown"
  | "file-text" | "target" | "compass" | "scale" | "alert-triangle"
  | "wallet" | "award" | "gauge" | "file-check";

export const MEDICAL_TREE: NavNode[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // 1. HEALTH CHECK REPORTS
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Health Check Reports",
    color: "green",
    children: [
      {
        label: "Fact Finders",
        color: "green",
        children: [
          {
            label: "Intake & Discovery",
            children: [
              l("Annual Financial Physical",  "/portal/annual-financial-physical"),
              l("Patient Intake",             "/portal/client-intake"),
              l("Daily Discovery",            "/portal/daily-discovery"),
              l("Hidden Material",            "/portal/hidden-material"),
            ],
          },
        ],
      },
      {
        label: "Vital Signs",
        color: "emerald",
        children: [
          {
            label: "Patient Dashboards",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Diagnostic Console",
                children: [
                  l("Financial Check-Up",          "/portal/advisory-summary"),
                  l("Command Center",              "/portal/command-center"),
                  l("Strategy Operating Room",     "/portal/war-room"),
                ],
              },
              // ── other items at L4 ──────────────────────────────────────
              l("Client Comparison",     "/portal/client-comparison"),
              l("Client Files",          "/portal/client-files"),
              l("Physician Financial Vitals", "/portal/client-health"),
              l("Client Portal Config",  "/portal/client-portal-config"),
              l("Patient Snapshot",      "/portal/client-snapshot"),
            ],
          },
        ],
      },
      {
        label: "Nervous System",
        color: "cyan",
        children: [
          {
            label: "Signal Strength",
            children: [
              l("What Drives Your Retirement", "/portal/ecological-drivers"),
              l("Predictive Analytics",        "/portal/predictive-analytics"),
              l("Stale Digest",                "/portal/stale-digest"),
            ],
          },
        ],
      },
      {
        label: "LabWork",
        color: "indigo",
        children: [
          {
            label: "Bloodwork Panels",
            children: [
              l("Advanced Reporting", "/portal/advanced-reporting"),
              l("Ask Your Data",      "/portal/data-query"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. MEDICINE
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Medicine",
    color: "cyan",
    children: [
      {
        label: "Annuity Formulary",
        color: "emerald",
        children: [
          {
            label: "Fixed & MYGA",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Rate Shield Products",
                children: [
                  l("Accumulation DB",   "/portal/annuity-accumulation-db"),
                  l("Growth Annuities",  "/portal/growth-annuities"),
                  l("MYGA Fixed Rate",   "/portal/myga-fixed-rate"),
                  l("MYGA Waterfall",    "/portal/myga-waterfall"),
                ],
              },
            ],
          },
          {
            label: "Income & Riders",
            children: [
              l("Athene Guaranteed Income",    "/portal/athene-guaranteed-income"),
              l("Top 10 Income",               "/portal/income-annuity-top10"),
              l("Lifetime Income",             "/portal/lifetime-income"),
              l("Living Benefits Probability", "/portal/living-benefits"),
            ],
          },
          {
            label: "Indexed & Variable",
            children: [
              l("Athene PE+15",    "/portal/athene-pe-plus15"),
              l("Axonic S&P500",   "/portal/axonic-sp500"),
              l("FIA Collateral",  "/portal/fia-collateral"),
              l("Top 10 FIA",      "/portal/fia-top10"),
              l("PPVA",            "/portal/ppva"),
            ],
          },
          {
            label: "Reviews & Comparisons",
            children: [
              l("Annuity Comparison",          "/portal/annuity-comparison"),
              l("Annuity Hidden Fee Detector", "/portal/annuity-fee-detector"),
              l("Annuity Memory",              "/portal/annuity-memory"),
              l("Existing Annuities",          "/portal/existing-annuities"),
            ],
          },
          {
            label: "Recommenders",
            children: [
              l("AI Strategy Prescriber", "/portal/combo-recommender"),
              l("Combo Recommender V2",   "/portal/combo-recommender-v2"),
            ],
          },
        ],
      },
      {
        label: "IUL Pharmacy",
        color: "blue",
        children: [
          {
            label: "Illustrations & Charts",
            children: [
              l("529 vs IUL",           "/portal/529-vs-iul"),
              l("Captive + IUL",        "/portal/captive-iul"),
              l("Emergency Fund vs IUL","/portal/emergency-fund-vs-iul"),
              l("Illustration Compare", "/portal/illustration-compare"),
              l("Index Backtester",     "/portal/index-backtester"),
              l("Index Strategies",     "/portal/index-strategies"),
              l("Infinity Banking",     "/portal/infinity-banking"),
              l("IUL Compliance Engine","/portal/iul-compliance-engine"),
              l("IUL Historical",       "/portal/iul-historical"),
              l("IUL Max Funded",       "/portal/iul-max-funded"),
              l("IUL vs Roth",          "/portal/iul-vs-roth"),
              l("Multi-Carrier IUL",    "/portal/multi-carrier-iul"),
              l("Term vs Whole vs IUL", "/portal/term-vs-whole-vs-iul"),
              l("Whole Life Dividend",  "/portal/whole-life-dividend"),
            ],
          },
        ],
      },
      {
        label: "Specialty Policies",
        color: "purple",
        children: [
          {
            label: "Advanced Scripts",
            children: [
              l("Policy Loans",         "/portal/policy-loans"),
              l("Policy Review",        "/portal/policy-review"),
              l("Policy Review Checklist", "/portal/policy-review-checklist"),
              l("PPLI",                 "/portal/ppli"),
              l("PPLI Modeler",         "/portal/ppli-modeler"),
              l("Private Placement",    "/portal/private-placement"),
              l("Split Dollar",         "/portal/split-dollar"),
              l("Split Dollar Life",    "/portal/split-dollar-life"),
            ],
          },
        ],
      },
      {
        label: "Dosage & Recommendations",
        color: "amber",
        children: [
          {
            label: "Rx Picker",
            children: [
              l("AI Strategy Recommender", "/portal/ai-recommender"),
              l("Carrier Compare",         "/portal/carrier-comparison"),
              l("5-Slot Comparison",       "/portal/comparison"),
              l("Recommendations",         "/portal/recommendations"),
            ],
          },
        ],
      },
      // ── Cross-listed ──────────────────────────────────────────────────────
      {
        label: "Mortgage Killer",
        color: "teal",
        children: [
          {
            label: "Payoff Operations",
            children: [
              l("Mortgage Killer", "/portal/mortgage-killer"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. TREATMENT CENTER
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Treatment Center",
    color: "orange",
    children: [
      {
        label: "Tax Therapy",
        color: "orange",
        children: [
          {
            label: "Bracket Diagnostics",
            children: [
              l("Tax Bracket Navigator", "/portal/tax-bracket-navigator"),
              l("Tax Brackets",          "/portal/tax-brackets"),
              l("Tax Code Simulator",    "/portal/tax-code-simulator"),
            ],
          },
          {
            label: "Deductions & Credits",
            children: [
              l("199A Optimizer",       "/portal/199a-optimizer"),
              l("QBI Calculator",       "/portal/qbi-calculator"),
              l("Section 199A",         "/portal/section-199a"),
              l("Tax Credits",          "/portal/tax-credits"),
              l("Tax-Deferred Exchange","/portal/tax-deferred-exchange"),
            ],
          },
          {
            label: "Loss-Harvest Sessions",
            children: [
              l("Gain/Loss Harvesting",   "/portal/gain-loss-harvesting"),
              l("Tax-Loss Harvesting",    "/portal/tax-loss-harvesting"),
              l("Tax-Loss Harvesting II", "/portal/tax-loss-harvest-calc"),
              l("Volatility Harvesting",  "/portal/volatility-harvesting"),
            ],
          },
          {
            label: "Tax Planning",
            children: [
              // ── 5-level branch ───────────────────────────────────────────
              {
                label: "Advanced Optimizer Suite",
                children: [
                  l("Tax Alpha Scorecard", "/portal/tax-alpha-scorecard"),
                  l("Tax Optimizer",       "/portal/tax-optimizer"),
                  l("Tax Opportunities",   "/portal/tax-opportunities"),
                ],
              },
              l("100 Tax-Free Combos", "/portal/tax-combos"),
              l("Tax Projection",      "/portal/tax-projection"),
              l("Tax Waterfall",       "/portal/tax-waterfall"),
            ],
          },
          {
            label: "Tax Treatments",
            children: [
              l("Capital Gains Tax",    "/portal/capital-gains-tax"),
              l("Depreciation Recapture","/portal/depreciation-recapture"),
              l("Installment Sale",     "/portal/installment-sale"),
              l("NUA Calculator",       "/portal/nua-calculator"),
              l("State Tax Migration",  "/portal/state-tax-migration"),
              l("Tax-Advantaged Growth","/portal/tax-advantaged-growth"),
              l("Tax-Equivalent Yield", "/portal/tax-equivalent-yield"),
              l("Tax Return Upload",    "/portal/tax-return-upload"),
            ],
          },
        ],
      },
      {
        label: "Rehabilitation",
        color: "rose",
        children: [
          {
            label: "Debt Recovery",
            children: [
              l("Debt Recycling",    "/portal/debt-recycling"),
              l("IDR Plan Comparison","/portal/idr-comparison"),
              l("Re-Stacking",       "/portal/re-stacking"),
            ],
          },
        ],
      },
      {
        label: "Detox",
        color: "teal",
        children: [
          {
            label: "Withdrawal Sequencing",
            children: [
              l("Safe Withdrawal Rate",  "/portal/safe-withdrawal-rate"),
              l("Withdrawal Rate",       "/portal/withdrawal-rate"),
              l("Withdrawal Sequencer",  "/portal/withdrawal-sequencer"),
              l("Withdrawal Sequencing", "/portal/withdrawal-sequencing"),
            ],
          },
          {
            label: "Guardrails",
            children: [
              l("Retirement Guardrails", "/portal/retirement-guardrails"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. WELLNESS COACHING
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Wellness Coaching",
    color: "emerald",
    children: [
      {
        label: "Business Counseling",
        color: "indigo",
        children: [
          {
            label: "Buy-Sell & Entity",
            children: [
              l("Buy-Sell Agreement", "/portal/buy-sell-agreement"),
              l("Buy-Sell Funding",   "/portal/buy-sell-funding"),
              l("Cross Purchase",     "/portal/cross-purchase"),
              l("Entity Comparison",  "/portal/entity-comparison"),
            ],
          },
          {
            label: "Exec Comp",
            children: [
              l("Deferred Compensation", "/portal/deferred-compensation"),
              l("Equity Compensation",   "/portal/equity-compensation"),
              l("Executive Bonus",       "/portal/executive-bonus"),
              l("Executive Bridge",      "/portal/executive-bridge"),
              l("Executive Comp",        "/portal/executive-comp"),
              l("Phantom Stock",         "/portal/phantom-stock"),
              l("QSBS",                  "/portal/qsbs"),
            ],
          },
          {
            label: "Owner Strategy",
            children: [
              l("Business Entity",   "/portal/business-entity"),
              l("Business Exit",     "/portal/business-exit"),
              l("Business Owner",    "/portal/business-owner"),
              l("Business Valuation","/portal/business-valuation"),
              l("ESOP Analyzer",     "/portal/esop-analyzer"),
              l("ESOP Buyout",       "/portal/esop-buyout"),
              l("Key Person Insurance","/portal/key-person-insurance"),
            ],
          },
          {
            label: "Practice Management",
            children: [
              l("Commission Calculator", "/portal/commission-calculator"),
              l("Contract Analyzer",     "/portal/physician-contract"),
              l("Overhead Expense",      "/portal/overhead-expense"),
              l("Practice Wealth Sync",  "/portal/practice-sync"),
              l("Practice Valuation",    "/portal/practice-valuation"),
            ],
          },
          {
            label: "Succession Counseling",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Exit Architecture",
                children: [
                  l("Business Succession", "/portal/business-succession"),
                  l("Succession Plan",     "/portal/succession-plan"),
                ],
              },
              l("Succession Planning", "/portal/succession-planning"),
              l("Succession Valuation","/portal/succession-valuation"),
            ],
          },
        ],
      },
      {
        label: "Family Counseling",
        color: "rose",
        children: [
          {
            label: "Divorce Therapy",
            children: [
              l("Divorce Financial Impact", "/portal/divorce-calculator"),
            ],
          },
          {
            label: "Generational Conversations",
            children: [
              l("Generational Wealth Sim",  "/portal/generational-wealth-sim"),
              l("Heartfire Legacy",         "/portal/heartfire-legacy"),
              l("Household Wealth",         "/portal/household-wealth"),
              l("Multi-Generational Wealth","/portal/multi-generational-wealth"),
              l("Multi-Gen Roth",           "/portal/multi-gen-roth"),
              l("Multi-Gen Wealth",         "/portal/multi-gen-wealth"),
            ],
          },
        ],
      },
      {
        label: "Coaching Programs",
        color: "purple",
        children: [
          {
            label: "Sessions & Goals",
            children: [
              l("Advisor Training",      "/portal/advisor-training"),
              l("Agency Tutorial",       "/portal/agency-tutorial"),
              l("Platform Training",     "/portal/agent-tutorial"),
              l("Collaborative Planning","/portal/collaborative-planning"),
              l("Education",             "/portal/education"),
              l("Goals Planning",        "/portal/goals-planning"),
              l("Meeting Agenda",        "/portal/meeting-agenda"),
            ],
          },
        ],
      },
      {
        label: "Roth Rehab Sessions",
        color: "cyan",
        children: [
          {
            label: "Conversion Coaching",
            children: [
              l("Backdoor Roth",           "/portal/backdoor-roth"),
              l("Mega Backdoor Roth",      "/portal/mega-backdoor-roth"),
              l("Roth Strategies",         "/portal/roth-conversion"),
              l("Roth Conversion Analyzer","/portal/roth-conversion-analyzer"),
            ],
          },
        ],
      },
      {
        label: "Time Machine",
        color: "amber",
        children: [
          {
            label: "What-If Sessions",
            children: [
              l("AG49 Compounding",      "/portal/time-machine-ag49"),
              l("Time Machine Calculator","/portal/time-machine-calculator"),
              l("Dual Illustration",     "/portal/time-machine-method"),
            ],
          },
        ],
      },
      {
        label: "Premium Financing",
        color: "blue",
        children: [
          {
            label: "Funding Therapy",
            children: [
              l("Premium Financing",          "/portal/premium-financing"),
              l("Premium Financing Arbitrage", "/portal/premium-financing-arbitrage"),
            ],
          },
        ],
      },
      // ── Cross-listed ──────────────────────────────────────────────────────
      {
        label: "Mortgage Killer",
        color: "teal",
        children: [
          {
            label: "Payoff Coaching",
            children: [
              l("Mortgage Killer", "/portal/mortgage-killer"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. FINANCIAL DIET
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Financial Diet",
    color: "amber",
    children: [
      {
        label: "Nutrition Labels",
        color: "amber",
        children: [
          {
            label: "Macro Tracking",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Daily Calorie Log",
                children: [
                  l("Crypto Corner",   "/portal/crypto-corner"),
                  l("Inflation",       "/portal/inflation"),
                  l("Taxable Account", "/portal/taxable-account"),
                ],
              },
              ph("Micronutrient Tracker"),
              ph("Spending Vitals Dashboard"),
            ],
          },
        ],
      },
      {
        label: "Metabolic Analysis",
        color: "orange",
        children: [
          {
            label: "Burn Rate Diagnostics",
            children: [
              ph("Cash Flow Metabolic Rate"),
              ph("Lifestyle Inflation Meter"),
              ph("Fixed Cost vs Variable Cost Ratio"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. WEALTH SCANNING
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Wealth Scanning",
    color: "blue",
    children: [
      {
        label: "Compliance Materials",
        color: "red",
        children: [
          {
            label: "Healthy Lifestyle",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Vital Compliance Checks",
                children: [
                  l("Compliance Center",  "/portal/compliance"),
                  l("Alerts",             "/portal/compliance-alerts"),
                  l("Compliance Audit",   "/portal/compliance-audit"),
                  l("Audit Trail",        "/portal/compliance-audit-trail"),
                ],
              },
              l("Compliance Monitor",   "/portal/compliance-monitoring"),
              l("Compliance Reports",   "/portal/compliance-reports"),
              l("Monitoring Agreement", "/portal/monitoring-agreement"),
              l("Owner Oversight",      "/portal/owner-oversight"),
            ],
          },
        ],
      },
      {
        label: "Imaging Suite",
        color: "indigo",
        children: [
          {
            label: "Portfolio Scans",
            children: [
              l("Ibbotson Charts",  "/portal/ibbotson-charts"),
              l("Market Data",      "/portal/market-data"),
              l("Market Stress Test","/portal/market-stress-test"),
              l("Portfolio Drift",  "/portal/portfolio-drift"),
              l("Rebalance",        "/portal/rebalance"),
              l("Smart Rebalancing","/portal/smart-rebalancing"),
            ],
          },
        ],
      },
      {
        label: "Radiology Archive",
        color: "purple",
        children: [
          {
            label: "Scenario Imaging",
            children: [
              {
                label: "Advanced Scenario Lab",
                children: [
                  l("Strategy Lab",     "/portal/strategy"),
                  l("Strategy Compare", "/portal/strategy-compare"),
                ],
              },
              l("Saved Scenarios",     "/portal/saved-scenarios"),
              l("Scenario Play",       "/portal/scenario-play"),
              l("Scenario Builder",    "/portal/scenarios"),
              l("Side-by-Side Compare","/portal/scenario-side-by-side"),
            ],
          },
        ],
      },
      {
        label: "Anomaly Detection",
        color: "rose",
        children: [
          {
            label: "Fee Forensics",
            children: [
              l("Fee Transparency", "/portal/fee-transparency"),
              ph("Hidden Cost Exposure Report"),
              ph("Expense Ratio Pathology"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 7. PROCEDURES CENTER
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Procedures Center",
    color: "rose",
    children: [
      {
        label: "Presentation Generators",
        color: "rose",
        children: [
          {
            label: "Slideshows & Decks",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Premium Deck Arsenal",
                children: [
                  l("AI Slide Generator",   "/portal/ai-slides"),
                  l("Batch Slides",         "/portal/batch-slides"),
                  l("Client Presentation",  "/portal/client-presentation"),
                ],
              },
              l("Batch Illustration",       "/portal/batch-illustration"),
              l("Bulk Generation",          "/portal/bulk-generation"),
              l("Client Report Gen",        "/portal/client-report-gen"),
              l("Estate Document Gen",      "/portal/estate-document-gen"),
              l("My Slides Library",        "/portal/my-slides"),
              l("Presentation Builder",     "/portal/presentation-builder"),
              l("Presentation Vault",       "/portal/presentation-vault"),
              l("Case Presentation Builder","/portal/sales-story"),
              l("Seminar Generator",        "/portal/seminar-generator"),
              l("Story Generator",          "/portal/story-generator"),
              l("Video Proposals",          "/portal/video-proposals"),
              l("Voice Plan",               "/portal/voice-plan"),
              l("Case Study Generator",     "/portal/war-story-generator"),
            ],
          },
        ],
      },
      {
        label: "Labor & Delivery",
        color: "teal",
        children: [
          {
            label: "Birth Plans (Real Estate)",
            children: [
              l("Home Affordability","/portal/home-affordability"),
              l("House Recycling",   "/portal/house-recycling"),
              l("Real Estate Mogul", "/portal/real-estate-mogul"),
              l("Reverse HELOC",     "/portal/reverse-heloc"),
              l("Reverse Mortgage",  "/portal/reverse-mortgage"),
            ],
          },
          {
            label: "Newborn Onboarding",
            children: [
              l("Client Onboarding Auto",    "/portal/client-onboarding-auto"),
              l("Client Self Service",        "/portal/client-self-service"),
              l("Patient Acquisition Engine", "/portal/lead-generator"),
              l("Quick Quote",               "/portal/quick-quote"),
              l("Quotes",                    "/portal/quotes"),
            ],
          },
        ],
      },
      {
        label: "Compliance Procedures",
        color: "orange",
        children: [
          {
            label: "Audit Operations",
            children: [
              l("Audit Timeline", "/portal/audit-timeline"),
              ph("Regulatory Filing Suite"),
              ph("Pre-Procedure Compliance Checklist"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 8. LONGEVITY MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Longevity Management",
    color: "purple",
    children: [
      {
        label: "Estate & Legacy Ward",
        color: "purple",
        children: [
          {
            label: "Charitable Trusts",
            children: [
              l("Charitable Remainder Unitrust", "/portal/charitable-remainder-unitrust"),
              l("CLT Engine",                    "/portal/clt-engine"),
              l("CRT Engine",                    "/portal/crt-engine"),
              l("CRUT Deep Dive",                "/portal/crut-deep-dive"),
            ],
          },
          {
            label: "Documents & Wills",
            children: [
              l("Digital Estate Planner", "/portal/digital-estate-planner"),
              l("Legal Payment Folder",   "/portal/legal-payment-folder"),
              l("Will Writer",            "/portal/will-writer"),
            ],
          },
          {
            label: "Estate Strategy",
            children: [
              l("Estate Flow Chart",         "/portal/estate-flow"),
              l("Estate Freeze Comparison",  "/portal/estate-freeze-comparison"),
              l("Estate Liquidity",          "/portal/estate-liquidity"),
              l("Estate Planning Sim",       "/portal/estate-planning-sim"),
              l("Estate Tax",                "/portal/estate-tax"),
              l("Estate Timeline",           "/portal/estate-timeline"),
              l("Taxable Estate",            "/portal/taxable-estate"),
              l("Wealth Transfer Comparison","/portal/wealth-transfer-comparison"),
            ],
          },
          {
            label: "Trust Planning",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Advanced Trust Instruments",
                children: [
                  l("Dynasty Trust",  "/portal/dynasty-trust-planner"),
                  l("GRAT",           "/portal/grat-calculator"),
                  l("GST Trust",      "/portal/gst-trust"),
                  l("IDGT Advanced",  "/portal/idgt-advanced"),
                ],
              },
              l("ILIT",                  "/portal/ilit-calculator"),
              l("Incentive Trust",       "/portal/incentive-trust"),
              l("International Trust",   "/portal/international-trust"),
              l("QPRT Advanced",         "/portal/qprt-advanced"),
              l("QPRT Calculator",       "/portal/qprt-calculator"),
              l("SLAT Deep Dive",        "/portal/slat-deep-dive"),
              l("Special Needs Trust",   "/portal/special-needs-trust"),
              l("State Trust Planning",  "/portal/state-trust-planning"),
              l("Trust Comparison Matrix","/portal/trust-comparison-matrix"),
              l("Trust Funding",         "/portal/trust-funding"),
            ],
          },
        ],
      },
      {
        label: "Life Support (Insurance)",
        color: "emerald",
        children: [
          {
            label: "Coverage Vitals",
            children: [
              l("Disability Gap",      "/portal/disability-gap"),
              l("Disability Insurance","/portal/disability-insurance-needs"),
              l("Life Insurance Needs","/portal/life-insurance-needs"),
              l("LTC Hybrid",          "/portal/long-term-care-hybrid"),
              l("LTC Cost",            "/portal/ltc-cost"),
              l("Own-Occ Disability",  "/portal/own-occ-disability"),
              l("Umbrella Insurance",  "/portal/umbrella-insurance"),
            ],
          },
        ],
      },
      {
        label: "Distribution Ward",
        color: "amber",
        children: [
          {
            label: "RMDs & Beneficiaries",
            children: [
              l("Beneficiary IRA",      "/portal/beneficiary-ira"),
              l("Beneficiary Optimizer","/portal/beneficiary-optimization"),
              l("Inherited Roth",       "/portal/inherited-roth"),
              l("RMD Calculator",       "/portal/rmd-calculator"),
            ],
          },
        ],
      },
      {
        label: "Social Security Ward",
        color: "blue",
        children: [
          {
            label: "Claiming Strategy",
            children: [
              l("Social Security",          "/portal/social-security"),
              l("Social Security Maximizer","/portal/social-security-maximizer"),
              l("Social Security Bridge",   "/portal/ss-bridge"),
            ],
          },
        ],
      },
      {
        label: "Income (Life Support)",
        color: "green",
        children: [
          {
            label: "Income Streams",
            children: [
              l("Income Gap Analyzer",  "/portal/income-gap"),
              l("Income Timeline",      "/portal/income-timeline"),
              l("Retirement Projection","/portal/retirement-projection"),
            ],
          },
        ],
      },
      {
        label: "Pension Wing",
        color: "gold",
        children: [
          {
            label: "Lump-Sum vs Income",
            children: [
              l("Pension Max",       "/portal/pension-max"),
              l("Pension vs Lump Sum","/portal/pension-vs-lump-sum"),
            ],
          },
        ],
      },
      {
        label: "IRMAA",
        color: "orange",
        children: [
          {
            label: "Surcharge Avoidance",
            children: [
              l("Medicare IRMAA",           "/portal/medicare-irmaa"),
              ph("IRMAA Reduction Protocol"),
              ph("Bracket-Shift Strategy"),
            ],
          },
        ],
      },
      {
        label: "Tax-Free Income",
        color: "teal",
        children: [
          {
            label: "Roth & Muni",
            children: [
              ph("Tax-Free Ladder Strategy"),
              ph("Muni Bond Allocation"),
              ph("Tax-Free Income Projector"),
              ph("Zero-Tax Retirement Blueprint"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 9. FINANCIAL FITNESS
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Financial Fitness",
    color: "rose",
    children: [
      {
        label: "Balance Sheet",
        color: "rose",
        children: [
          {
            label: "Net-Worth Weigh-In",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Performance Diagnostics",
                children: [
                  l("Client Scorecard",  "/portal/client-scorecard"),
                  l("Engagement Score",  "/portal/engagement-score"),
                  l("Financial Vitals",  "/portal/financial-vitals"),
                ],
              },
              ph("Wealth Accumulation Tracker"),
              ph("Goal Progress Monitor"),
            ],
          },
        ],
      },
      {
        label: "Strength Training",
        color: "amber",
        children: [
          {
            label: "Compound Growth Reps",
            children: [
              ph("Dollar-Cost Averaging Protocol"),
              ph("Rebalancing Regimen"),
              ph("Return Maximization Circuit"),
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 10. WEALTH GENOME
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Wealth Genome",
    color: "indigo",
    children: [
      {
        label: "Platform & Engagement",
        color: "indigo",
        children: [
          {
            label: "Heredity Network",
            children: [
              l("Advisor Chat",         "/portal/advisor-chat"),
              l("Advisor Directory",    "/portal/advisor-directory"),
              l("Market Intelligence",  "/portal/competitive"),
              l("Integrations",         "/portal/integrations"),
              l("Peer Trust Network",   "/portal/peer-network"),
              l("Pipeline",             "/portal/pipeline"),
              l("Referral Tracker",     "/portal/referral-tracker"),
              l("Referral Tracking",    "/portal/referral-tracking"),
              l("Slack",                "/portal/slack"),
              l("Workflow Automations", "/portal/workflow-automations"),
            ],
          },
        ],
      },
      {
        label: "AI Strategy Lab",
        color: "purple",
        children: [
          {
            label: "Genetic Mapping",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Core AI Algorithms",
                children: [
                  l("AI Brain",          "/portal/ai"),
                  l("Policy Gap Analysis","/portal/ai-policy-review"),
                  l("AI Strategy Lab Pro","/portal/ai-strategy-lab"),
                ],
              },
              ph("Genome Sequencing Suite"),
              ph("Risk DNA Analysis"),
            ],
          },
        ],
      },
    ],
  },
];

/** Collect all real-page paths from a node and its descendants. */
export function collectPaths(node: NavNode): string[] {
  if (node.path) return [node.path];
  if (!node.children) return [];
  return node.children.flatMap(collectPaths);
}

/** Flatten the tree into a map: path → { label, color } */
export function flattenNavTree(
  nodes: NavNode[],
  map: Map<string, NavNode> = new Map(),
): Map<string, NavNode> {
  for (const node of nodes) {
    if (node.path) map.set(node.path, node);
    if (node.children) flattenNavTree(node.children, map);
  }
  return map;
}
