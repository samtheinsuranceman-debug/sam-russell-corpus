// ─── Navigation tree ────────────────────────────────────────────────────────
//
// Ported from russell-capital-app (commit ef74f3f) by PR-2b. The tree structure,
// labels and grouping are the donor's; two mechanical transformations were applied
// so it holds against THIS application's 330-route manifest:
//
//   1. A deliberate "Cross-listed" branch that registered /portal/mortgage-killer
//      a second time was removed. Every destination appears in exactly one place,
//      matching the rule server/navigation-organization.test.ts already enforces
//      for the existing sidebar. If cross-listing is wanted, it needs an explicit
//      flag and a test exemption rather than a silent duplicate.
//
//   2. 124 leaves pointed at routes this application does not serve — they were
//      authored against the donor's 612 routes, and this app has 330. Each became a
//      placeholder via the ph() helper already used here, so the intended structure
//      survives with no dead links. As those routes land, promote the placeholder
//      back to a live leaf; server/navTree.test.ts fails on any target that
//      is not in shared/routeManifest.ts, so a wrong promotion cannot ship.
//
// This file has no React imports by design; the renderer maps icon tags.
//
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
              ph("Annual Financial Physical"),
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
            label: "Financial Dashboards",
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
              ph("Living Benefits Probability"),
            ],
          },
          {
            label: "Indexed & Variable",
            children: [
              l("Athene PE+15",    "/portal/athene-pe-plus15"),
              l("Axonic S&P500",   "/portal/axonic-sp500"),
              l("FIA Collateral",  "/portal/fia-collateral"),
              l("Top 10 FIA",      "/portal/fia-top10"),
              ph("PPVA"),
            ],
          },
          {
            label: "Reviews & Comparisons",
            children: [
              ph("Annuity Comparison"),
              ph("Annuity Hidden Fee Detector"),
              l("Annuity Memory",              "/portal/annuity-memory"),
              l("Existing Annuities",          "/portal/existing-annuities"),
            ],
          },
          {
            label: "Recommenders",
            children: [
              l("AI Strategy Prescriber", "/portal/combo-recommender"),
              ph("Combo Recommender V2"),
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
              ph("529 vs IUL"),
              ph("Captive + IUL"),
              ph("Emergency Fund vs IUL"),
              l("Illustration Compare", "/portal/illustration-compare"),
              l("Index Backtester",     "/portal/index-backtester"),
              l("Index Strategies",     "/portal/index-strategies"),
              ph("Infinity Banking"),
              ph("IUL Compliance Engine"),
              l("IUL Historical",       "/portal/iul-historical"),
              ph("IUL Max Funded"),
              l("IUL vs Roth",          "/portal/iul-vs-roth"),
              ph("Multi-Carrier IUL"),
              ph("Term vs Whole vs IUL"),
              ph("Whole Life Dividend"),
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
              ph("PPLI"),
              ph("PPLI Modeler"),
              ph("Private Placement"),
              ph("Split Dollar"),
              ph("Split Dollar Life"),
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
              ph("Tax Bracket Navigator"),
              l("Tax Brackets",          "/portal/tax-brackets"),
              ph("Tax Code Simulator"),
            ],
          },
          {
            label: "Deductions & Credits",
            children: [
              ph("199A Optimizer"),
              ph("QBI Calculator"),
              ph("Section 199A"),
              ph("Tax Credits"),
              ph("Tax-Deferred Exchange"),
            ],
          },
          {
            label: "Loss-Harvest Sessions",
            children: [
              ph("Gain/Loss Harvesting"),
              l("Tax-Loss Harvesting",    "/portal/tax-loss-harvesting"),
              ph("Tax-Loss Harvesting II"),
              ph("Volatility Harvesting"),
            ],
          },
          {
            label: "Tax Planning",
            children: [
              // ── 5-level branch ───────────────────────────────────────────
              {
                label: "Advanced Optimizer Suite",
                children: [
                  ph("Tax Alpha Scorecard"),
                  ph("Tax Optimizer"),
                  l("Tax Opportunities",   "/portal/tax-opportunities"),
                ],
              },
              l("100 Tax-Free Combos", "/portal/tax-combos"),
              ph("Tax Projection"),
              l("Tax Waterfall",       "/portal/tax-waterfall"),
            ],
          },
          {
            label: "Tax Treatments",
            children: [
              ph("Capital Gains Tax"),
              ph("Depreciation Recapture"),
              ph("Installment Sale"),
              ph("NUA Calculator"),
              ph("State Tax Migration"),
              l("Tax-Advantaged Growth","/portal/tax-advantaged-growth"),
              ph("Tax-Equivalent Yield"),
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
              ph("Debt Recycling"),
              ph("IDR Plan Comparison"),
              ph("Re-Stacking"),
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
              ph("Safe Withdrawal Rate"),
              ph("Withdrawal Rate"),
              ph("Withdrawal Sequencer"),
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
              ph("Buy-Sell Agreement"),
              ph("Buy-Sell Funding"),
              ph("Cross Purchase"),
              ph("Entity Comparison"),
            ],
          },
          {
            label: "Exec Comp",
            children: [
              ph("Deferred Compensation"),
              ph("Equity Compensation"),
              ph("Executive Bonus"),
              ph("Executive Bridge"),
              ph("Executive Comp"),
              ph("Phantom Stock"),
              ph("QSBS"),
            ],
          },
          {
            label: "Owner Strategy",
            children: [
              ph("Business Entity"),
              ph("Business Exit"),
              l("Business Owner",    "/portal/business-owner"),
              ph("Business Valuation"),
              ph("ESOP Analyzer"),
              ph("ESOP Buyout"),
              ph("Key Person Insurance"),
            ],
          },
          {
            label: "Practice Management",
            children: [
              l("Commission Calculator", "/portal/commission-calculator"),
              ph("Contract Analyzer"),
              ph("Overhead Expense"),
              ph("Practice Wealth Sync"),
              ph("Practice Valuation"),
            ],
          },
          {
            label: "Succession Counseling",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Exit Architecture",
                children: [
                  ph("Business Succession"),
                  ph("Succession Plan"),
                ],
              },
              l("Succession Planning", "/portal/succession-planning"),
              ph("Succession Valuation"),
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
              ph("Generational Wealth Sim"),
              ph("Heartfire Legacy"),
              l("Household Wealth",         "/portal/household-wealth"),
              ph("Multi-Generational Wealth"),
              ph("Multi-Gen Roth"),
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
              ph("Backdoor Roth"),
              ph("Mega Backdoor Roth"),
              l("Roth Strategies",         "/portal/roth-conversion"),
              ph("Roth Conversion Analyzer"),
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
              ph("Premium Financing Arbitrage"),
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
                  ph("Taxable Account"),
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
                ],
              },
              l("Batch Illustration",       "/portal/batch-illustration"),
              l("Bulk Generation",          "/portal/bulk-generation"),
              l("Estate Document Gen",      "/portal/estate-document-gen"),
              l("My Slides Library",        "/portal/my-slides"),
              l("Presentation Builder",     "/portal/presentation-builder"),
              ph("Presentation Vault"),
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
              ph("Home Affordability"),
              l("House Recycling",   "/portal/house-recycling"),
              l("Real Estate Mogul", "/portal/real-estate-mogul"),
              l("Reverse HELOC",     "/portal/reverse-heloc"),
              ph("Reverse Mortgage"),
            ],
          },
          {
            label: "Quick Quotes",
            children: [
              l("Quick Quote",  "/portal/quick-quote"),
              l("Quotes",       "/portal/quotes"),
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
              ph("Charitable Remainder Unitrust"),
              ph("CLT Engine"),
              ph("CRT Engine"),
              ph("CRUT Deep Dive"),
            ],
          },
          {
            label: "Documents & Wills",
            children: [
              ph("Digital Estate Planner"),
              l("Legal Payment Folder",   "/portal/legal-payment-folder"),
              l("Will Writer",            "/portal/will-writer"),
            ],
          },
          {
            label: "Estate Strategy",
            children: [
              l("Estate Flow Chart",         "/portal/estate-flow"),
              ph("Estate Freeze Comparison"),
              ph("Estate Liquidity"),
              ph("Estate Planning Sim"),
              l("Estate Tax",                "/portal/estate-tax"),
              ph("Estate Timeline"),
              ph("Taxable Estate"),
              ph("Wealth Transfer Comparison"),
            ],
          },
          {
            label: "Trust Planning",
            children: [
              // ── 5-level branch ─────────────────────────────────────────
              {
                label: "Advanced Trust Instruments",
                children: [
                  ph("Dynasty Trust"),
                  ph("GRAT"),
                  ph("GST Trust"),
                  ph("IDGT Advanced"),
                ],
              },
              ph("ILIT"),
              ph("Incentive Trust"),
              ph("International Trust"),
              ph("QPRT Advanced"),
              ph("QPRT Calculator"),
              ph("SLAT Deep Dive"),
              ph("Special Needs Trust"),
              ph("State Trust Planning"),
              ph("Trust Comparison Matrix"),
              ph("Trust Funding"),
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
              ph("Disability Gap"),
              ph("Disability Insurance"),
              ph("Life Insurance Needs"),
              ph("LTC Hybrid"),
              ph("LTC Cost"),
              ph("Own-Occ Disability"),
              ph("Umbrella Insurance"),
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
              ph("Beneficiary IRA"),
              l("Beneficiary Optimizer","/portal/beneficiary-optimization"),
              ph("Inherited Roth"),
              ph("RMD Calculator"),
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
              ph("Social Security Maximizer"),
              ph("Social Security Bridge"),
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
              ph("Pension Max"),
              ph("Pension vs Lump Sum"),
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
  // 9. PATIENTS
  // ══════════════════════════════════════════════════════════════════════════
  {
    label: "Patients",
    color: "blue",
    children: [
      {
        label: "Patient Roster",
        color: "blue",
        children: [
          {
            label: "Patient List & Profiles",
            children: [
              l("All Patients",          "/portal/clients"),
              l("Patient Comparison",    "/portal/client-comparison"),
              l("Patient Files",         "/portal/client-files"),
              l("Patient Snapshot",      "/portal/client-snapshot"),
            ],
          },
          {
            label: "Scorecards & Vitals",
            children: [
              l("Patient Scorecard",          "/portal/client-scorecard"),
              l("Engagement Score",           "/portal/engagement-score"),
              l("Financial Vitals",           "/portal/financial-vitals"),
              l("Physician Financial Vitals", "/portal/client-health"),
            ],
          },
        ],
      },
      {
        label: "Intake & Onboarding",
        color: "emerald",
        children: [
          {
            label: "New Patient Setup",
            children: [
              l("Patient Intake",              "/portal/client-intake"),
              l("Onboarding Automation",       "/portal/client-onboarding-auto"),
              l("Patient Self-Service Portal", "/portal/client-self-service"),
              l("Patient Acquisition Engine",  "/portal/lead-generator"),
            ],
          },
        ],
      },
      {
        label: "Presentations & Config",
        color: "rose",
        children: [
          {
            label: "Patient Deliverables",
            children: [
              ph("Patient Presentation"),
              ph("Patient Report Gen"),
              l("Patient Portal Config", "/portal/client-portal-config"),
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
        label: "The Sacred Seven",
        color: "indigo",
        children: [
          {
            label: "The Client Journey",
            children: [
              l("The Arrival",        "/portal/the-arrival"),
              l("The Mirror",         "/portal/the-mirror"),
              l("The Strategy Table", "/portal/the-strategy-table"),
              l("The Field",          "/portal/the-field"),
              l("The Map",            "/portal/the-map"),
              l("The Legacy",         "/portal/the-legacy"),
              l("The Brotherhood",    "/portal/the-brotherhood"),
            ],
          },
        ],
      },
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
              ph("Peer Trust Network"),
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
                  ph("AI Strategy Lab Pro"),
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
