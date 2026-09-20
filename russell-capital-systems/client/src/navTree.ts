// ─── Recursive navigation tree ──────────────────────────────────────────────
//
// Ported from russell-capital-app, where the shape was first worked out, and
// reconciled against this build's route manifest.
//
// ## Why a tree
//
// The previous structure in AppShell was three fixed levels — Section,
// Subgroup, Item — and could not nest further. Subjects that genuinely have
// depth, like estate planning or tax strategy, had to be flattened into it.
// A NavNode is either a folder (has `children`) or a leaf (has `path`, or is
// a placeholder), and nests to any depth. This tree currently reaches five.
//
// ## Reconciliation against this build
//
// The imported tree was written against a different application with a
// different route surface, so it was reconciled on import:
//
//   - A leaf naming a route this build does not register is kept as a
//     `isPlaceholder` node. It renders as a label rather than a link, so the
//     information architecture survives without a dead target.
//   - Every navigation entry the previous AppShell structure carried is
//     present here, keeping the grouping it already had. Nothing that was
//     reachable before became unreachable.
//   - A path appears at most once.
//
// `navTree.test.ts` enforces all three, plus the rule that every non-placeholder
// path is in `ROUTE_MANIFEST`. Regenerate with scripts/build-nav-tree.mjs.
//
// This file is deliberately free of React imports: icons are string tags that
// the renderer maps to components, so the tree can be imported by tests and
// by node scripts without pulling in the UI.

export type NavNode = {
  label: string;
  icon?: string;
  color?: string;
  path?: string;
  isPlaceholder?: boolean;
  children?: NavNode[];
  defaultOpen?: boolean;
};

export const MEDICAL_TREE: readonly NavNode[] = [
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
              { label: "Annual Financial Physical", isPlaceholder: true },
              { label: "Daily Discovery", path: "/portal/daily-discovery" },
              { label: "Hidden Material", path: "/portal/hidden-material" },
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
              {
                label: "Diagnostic Console",
                children: [
                  { label: "Financial Check-Up", path: "/portal/advisory-summary" },
                  { label: "Command Center", path: "/portal/command-center" },
                  { label: "Strategy Operating Room", path: "/portal/war-room" },
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
              { label: "What Drives Your Retirement", path: "/portal/ecological-drivers" },
              { label: "Predictive Analytics", path: "/portal/predictive-analytics" },
              { label: "Stale Digest", path: "/portal/stale-digest" },
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
              { label: "Advanced Reporting", path: "/portal/advanced-reporting" },
              { label: "Ask Your Data", path: "/portal/data-query" },
            ],
          },
        ],
      },
    ],
  },
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
              {
                label: "Rate Shield Products",
                children: [
                  { label: "Accumulation DB", path: "/portal/annuity-accumulation-db" },
                  { label: "Growth Annuities", path: "/portal/growth-annuities" },
                  { label: "MYGA Fixed Rate", path: "/portal/myga-fixed-rate" },
                  { label: "MYGA Waterfall", path: "/portal/myga-waterfall" },
                ],
              },
            ],
          },
          {
            label: "Income & Riders",
            children: [
              { label: "Athene Guaranteed Income", path: "/portal/athene-guaranteed-income" },
              { label: "Top 10 Income", path: "/portal/income-annuity-top10" },
              { label: "Lifetime Income", path: "/portal/lifetime-income" },
              { label: "Living Benefits Probability", isPlaceholder: true },
            ],
          },
          {
            label: "Indexed & Variable",
            children: [
              { label: "Athene PE+15", path: "/portal/athene-pe-plus15" },
              { label: "Axonic S&P500", path: "/portal/axonic-sp500" },
              { label: "FIA Collateral", path: "/portal/fia-collateral" },
              { label: "Top 10 FIA", path: "/portal/fia-top10" },
              { label: "PPVA", isPlaceholder: true },
            ],
          },
          {
            label: "Reviews & Comparisons",
            children: [
              { label: "Annuity Comparison", isPlaceholder: true },
              { label: "Annuity Hidden Fee Detector", isPlaceholder: true },
              { label: "Annuity Memory", path: "/portal/annuity-memory" },
              { label: "Existing Annuities", path: "/portal/existing-annuities" },
            ],
          },
          {
            label: "Recommenders",
            children: [
              { label: "AI Strategy Prescriber", path: "/portal/combo-recommender" },
              { label: "Combo Recommender V2", isPlaceholder: true },
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
              { label: "529 vs IUL", isPlaceholder: true },
              { label: "Captive + IUL", isPlaceholder: true },
              { label: "Emergency Fund vs IUL", isPlaceholder: true },
              { label: "Illustration Compare", path: "/portal/illustration-compare" },
              { label: "Index Backtester", path: "/portal/index-backtester" },
              { label: "Index Strategies", path: "/portal/index-strategies" },
              { label: "Infinity Banking", isPlaceholder: true },
              { label: "IUL Compliance Engine", isPlaceholder: true },
              { label: "IUL Historical", path: "/portal/iul-historical" },
              { label: "IUL Max Funded", isPlaceholder: true },
              { label: "IUL vs Roth", path: "/portal/iul-vs-roth" },
              { label: "Multi-Carrier IUL", isPlaceholder: true },
              { label: "Term vs Whole vs IUL", isPlaceholder: true },
              { label: "Whole Life Dividend", isPlaceholder: true },
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
              { label: "Policy Loans", path: "/portal/policy-loans" },
              { label: "Policy Review", path: "/portal/policy-review" },
              { label: "Policy Review Checklist", path: "/portal/policy-review-checklist" },
              { label: "PPLI", isPlaceholder: true },
              { label: "PPLI Modeler", isPlaceholder: true },
              { label: "Private Placement", isPlaceholder: true },
              { label: "Split Dollar", isPlaceholder: true },
              { label: "Split Dollar Life", isPlaceholder: true },
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
              { label: "AI Strategy Recommender", path: "/portal/ai-recommender" },
              { label: "Carrier Compare", path: "/portal/carrier-comparison" },
              { label: "5-Slot Comparison", path: "/portal/comparison" },
              { label: "Recommendations", path: "/portal/recommendations" },
            ],
          },
        ],
      },
      {
        label: "Mortgage Killer",
        color: "teal",
        children: [
          {
            label: "Payoff Operations",
            children: [
              { label: "Mortgage Killer", path: "/portal/mortgage-killer" },
            ],
          },
        ],
      },
    ],
  },
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
              { label: "Tax Bracket Navigator", isPlaceholder: true },
              { label: "Tax Brackets", path: "/portal/tax-brackets" },
              { label: "Tax Code Simulator", isPlaceholder: true },
            ],
          },
          {
            label: "Deductions & Credits",
            children: [
              { label: "199A Optimizer", isPlaceholder: true },
              { label: "QBI Calculator", isPlaceholder: true },
              { label: "Section 199A", isPlaceholder: true },
              { label: "Tax Credits", isPlaceholder: true },
              { label: "Tax-Deferred Exchange", isPlaceholder: true },
            ],
          },
          {
            label: "Loss-Harvest Sessions",
            children: [
              { label: "Gain/Loss Harvesting", isPlaceholder: true },
              { label: "Tax-Loss Harvesting", path: "/portal/tax-loss-harvesting" },
              { label: "Tax-Loss Harvesting II", isPlaceholder: true },
              { label: "Volatility Harvesting", isPlaceholder: true },
            ],
          },
          {
            label: "Tax Planning",
            children: [
              {
                label: "Advanced Optimizer Suite",
                children: [
                  { label: "Tax Alpha Scorecard", isPlaceholder: true },
                  { label: "Tax Optimizer", isPlaceholder: true },
                  { label: "Tax Opportunities", path: "/portal/tax-opportunities" },
                ],
              },
              { label: "100 Tax-Free Combos", path: "/portal/tax-combos" },
              { label: "Tax Projection", isPlaceholder: true },
              { label: "Tax Waterfall", path: "/portal/tax-waterfall" },
            ],
          },
          {
            label: "Tax Treatments",
            children: [
              { label: "Capital Gains Tax", isPlaceholder: true },
              { label: "Depreciation Recapture", isPlaceholder: true },
              { label: "Installment Sale", isPlaceholder: true },
              { label: "NUA Calculator", isPlaceholder: true },
              { label: "State Tax Migration", isPlaceholder: true },
              { label: "Tax-Advantaged Growth", path: "/portal/tax-advantaged-growth" },
              { label: "Tax-Equivalent Yield", isPlaceholder: true },
              { label: "Tax Return Upload", path: "/portal/tax-return-upload" },
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
              { label: "Debt Recycling", isPlaceholder: true },
              { label: "IDR Plan Comparison", isPlaceholder: true },
              { label: "Re-Stacking", isPlaceholder: true },
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
              { label: "Safe Withdrawal Rate", isPlaceholder: true },
              { label: "Withdrawal Rate", isPlaceholder: true },
              { label: "Withdrawal Sequencer", isPlaceholder: true },
              { label: "Withdrawal Sequencing", path: "/portal/withdrawal-sequencing" },
            ],
          },
          {
            label: "Guardrails",
            children: [
              { label: "Retirement Guardrails", path: "/portal/retirement-guardrails" },
            ],
          },
        ],
      },
    ],
  },
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
              { label: "Buy-Sell Agreement", isPlaceholder: true },
              { label: "Buy-Sell Funding", isPlaceholder: true },
              { label: "Cross Purchase", isPlaceholder: true },
              { label: "Entity Comparison", isPlaceholder: true },
            ],
          },
          {
            label: "Exec Comp",
            children: [
              { label: "Deferred Compensation", isPlaceholder: true },
              { label: "Equity Compensation", isPlaceholder: true },
              { label: "Executive Bonus", isPlaceholder: true },
              { label: "Executive Bridge", isPlaceholder: true },
              { label: "Executive Comp", isPlaceholder: true },
              { label: "Phantom Stock", isPlaceholder: true },
              { label: "QSBS", isPlaceholder: true },
            ],
          },
          {
            label: "Owner Strategy",
            children: [
              { label: "Business Entity", isPlaceholder: true },
              { label: "Business Exit", isPlaceholder: true },
              { label: "Business Owner", path: "/portal/business-owner" },
              { label: "Business Valuation", isPlaceholder: true },
              { label: "ESOP Analyzer", isPlaceholder: true },
              { label: "ESOP Buyout", isPlaceholder: true },
              { label: "Key Person Insurance", isPlaceholder: true },
            ],
          },
          {
            label: "Practice Management",
            children: [
              { label: "Commission Calculator", path: "/portal/commission-calculator" },
              { label: "Contract Analyzer", isPlaceholder: true },
              { label: "Overhead Expense", isPlaceholder: true },
              { label: "Practice Wealth Sync", isPlaceholder: true },
              { label: "Practice Valuation", isPlaceholder: true },
            ],
          },
          {
            label: "Succession Counseling",
            children: [
              {
                label: "Exit Architecture",
                children: [
                  { label: "Business Succession", isPlaceholder: true },
                  { label: "Succession Plan", isPlaceholder: true },
                ],
              },
              { label: "Succession Planning", path: "/portal/succession-planning" },
              { label: "Succession Valuation", isPlaceholder: true },
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
              { label: "Divorce Financial Impact", path: "/portal/divorce-calculator" },
            ],
          },
          {
            label: "Generational Conversations",
            children: [
              { label: "Generational Wealth Sim", isPlaceholder: true },
              { label: "Heartfire Legacy", isPlaceholder: true },
              { label: "Household Wealth", path: "/portal/household-wealth" },
              { label: "Multi-Generational Wealth", isPlaceholder: true },
              { label: "Multi-Gen Roth", isPlaceholder: true },
              { label: "Multi-Gen Wealth", path: "/portal/multi-gen-wealth" },
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
              { label: "Advisor Training", path: "/portal/advisor-training" },
              { label: "Agency Tutorial", path: "/portal/agency-tutorial" },
              { label: "Platform Training", path: "/portal/agent-tutorial" },
              { label: "Collaborative Planning", path: "/portal/collaborative-planning" },
              { label: "Education", path: "/portal/education" },
              { label: "Goals Planning", path: "/portal/goals-planning" },
              { label: "Meeting Agenda", path: "/portal/meeting-agenda" },
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
              { label: "Backdoor Roth", isPlaceholder: true },
              { label: "Mega Backdoor Roth", isPlaceholder: true },
              { label: "Roth Strategies", path: "/portal/roth-conversion" },
              { label: "Roth Conversion Analyzer", isPlaceholder: true },
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
              { label: "AG49 Compounding", path: "/portal/time-machine-ag49" },
              { label: "Time Machine Calculator", path: "/portal/time-machine-calculator" },
              { label: "Dual Illustration", path: "/portal/time-machine-method" },
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
              { label: "Premium Financing", path: "/portal/premium-financing" },
              { label: "Premium Financing Arbitrage", isPlaceholder: true },
            ],
          },
        ],
      },
    ],
  },
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
              {
                label: "Daily Calorie Log",
                children: [
                  { label: "Crypto Corner", path: "/portal/crypto-corner" },
                  { label: "Inflation", path: "/portal/inflation" },
                  { label: "Taxable Account", isPlaceholder: true },
                ],
              },
              { label: "Micronutrient Tracker", isPlaceholder: true },
              { label: "Spending Vitals Dashboard", isPlaceholder: true },
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
              { label: "Cash Flow Metabolic Rate", isPlaceholder: true },
              { label: "Lifestyle Inflation Meter", isPlaceholder: true },
              { label: "Fixed Cost vs Variable Cost Ratio", isPlaceholder: true },
            ],
          },
        ],
      },
    ],
  },
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
              {
                label: "Vital Compliance Checks",
                children: [
                  { label: "Compliance Center", path: "/portal/compliance" },
                  { label: "Alerts", path: "/portal/compliance-alerts" },
                  { label: "Compliance Audit", path: "/portal/compliance-audit" },
                  { label: "Audit Trail", path: "/portal/compliance-audit-trail" },
                ],
              },
              { label: "Compliance Monitor", path: "/portal/compliance-monitoring" },
              { label: "Compliance Reports", path: "/portal/compliance-reports" },
              { label: "Monitoring Agreement", path: "/portal/monitoring-agreement" },
              { label: "Owner Oversight", path: "/portal/owner-oversight" },
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
              { label: "Ibbotson Charts", path: "/portal/ibbotson-charts" },
              { label: "Market Data", path: "/portal/market-data" },
              { label: "Market Stress Test", path: "/portal/market-stress-test" },
              { label: "Portfolio Drift", path: "/portal/portfolio-drift" },
              { label: "Rebalance", path: "/portal/rebalance" },
              { label: "Smart Rebalancing", path: "/portal/smart-rebalancing" },
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
                  { label: "Strategy Lab", path: "/portal/strategy" },
                  { label: "Strategy Compare", path: "/portal/strategy-compare" },
                ],
              },
              { label: "Saved Scenarios", path: "/portal/saved-scenarios" },
              { label: "Scenario Play", path: "/portal/scenario-play" },
              { label: "Scenario Builder", path: "/portal/scenarios" },
              { label: "Side-by-Side Compare", path: "/portal/scenario-side-by-side" },
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
              { label: "Fee Transparency", path: "/portal/fee-transparency" },
              { label: "Hidden Cost Exposure Report", isPlaceholder: true },
              { label: "Expense Ratio Pathology", isPlaceholder: true },
            ],
          },
        ],
      },
    ],
  },
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
              {
                label: "Premium Deck Arsenal",
                children: [
                  { label: "AI Slide Generator", path: "/portal/ai-slides" },
                  { label: "Batch Slides", path: "/portal/batch-slides" },
                ],
              },
              { label: "Batch Illustration", path: "/portal/batch-illustration" },
              { label: "Bulk Generation", path: "/portal/bulk-generation" },
              { label: "Estate Document Gen", path: "/portal/estate-document-gen" },
              { label: "My Slides Library", path: "/portal/my-slides" },
              { label: "Presentation Builder", path: "/portal/presentation-builder" },
              { label: "Presentation Vault", isPlaceholder: true },
              { label: "Case Presentation Builder", path: "/portal/sales-story" },
              { label: "Seminar Generator", path: "/portal/seminar-generator" },
              { label: "Story Generator", path: "/portal/story-generator" },
              { label: "Video Proposals", path: "/portal/video-proposals" },
              { label: "Voice Plan", path: "/portal/voice-plan" },
              { label: "Case Study Generator", path: "/portal/war-story-generator" },
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
              { label: "Home Affordability", isPlaceholder: true },
              { label: "House Recycling", path: "/portal/house-recycling" },
              { label: "Real Estate Mogul", path: "/portal/real-estate-mogul" },
              { label: "Reverse HELOC", path: "/portal/reverse-heloc" },
              { label: "Reverse Mortgage", isPlaceholder: true },
            ],
          },
          {
            label: "Quick Quotes",
            children: [
              { label: "Quick Quote", path: "/portal/quick-quote" },
              { label: "Quotes", path: "/portal/quotes" },
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
              { label: "Audit Timeline", path: "/portal/audit-timeline" },
              { label: "Regulatory Filing Suite", isPlaceholder: true },
              { label: "Pre-Procedure Compliance Checklist", isPlaceholder: true },
            ],
          },
        ],
      },
    ],
  },
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
              { label: "Charitable Remainder Unitrust", isPlaceholder: true },
              { label: "CLT Engine", isPlaceholder: true },
              { label: "CRT Engine", isPlaceholder: true },
              { label: "CRUT Deep Dive", isPlaceholder: true },
            ],
          },
          {
            label: "Documents & Wills",
            children: [
              { label: "Digital Estate Planner", isPlaceholder: true },
              { label: "Legal Payment Folder", path: "/portal/legal-payment-folder" },
              { label: "Will Writer", path: "/portal/will-writer" },
            ],
          },
          {
            label: "Estate Strategy",
            children: [
              { label: "Estate Flow Chart", path: "/portal/estate-flow" },
              { label: "Estate Freeze Comparison", isPlaceholder: true },
              { label: "Estate Liquidity", isPlaceholder: true },
              { label: "Estate Planning Sim", isPlaceholder: true },
              { label: "Estate Tax", path: "/portal/estate-tax" },
              { label: "Estate Timeline", isPlaceholder: true },
              { label: "Taxable Estate", isPlaceholder: true },
              { label: "Wealth Transfer Comparison", isPlaceholder: true },
            ],
          },
          {
            label: "Trust Planning",
            children: [
              {
                label: "Advanced Trust Instruments",
                children: [
                  { label: "Dynasty Trust", isPlaceholder: true },
                  { label: "GRAT", isPlaceholder: true },
                  { label: "GST Trust", isPlaceholder: true },
                  { label: "IDGT Advanced", isPlaceholder: true },
                ],
              },
              { label: "ILIT", isPlaceholder: true },
              { label: "Incentive Trust", isPlaceholder: true },
              { label: "International Trust", isPlaceholder: true },
              { label: "QPRT Advanced", isPlaceholder: true },
              { label: "QPRT Calculator", isPlaceholder: true },
              { label: "SLAT Deep Dive", isPlaceholder: true },
              { label: "Special Needs Trust", isPlaceholder: true },
              { label: "State Trust Planning", isPlaceholder: true },
              { label: "Trust Comparison Matrix", isPlaceholder: true },
              { label: "Trust Funding", isPlaceholder: true },
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
              { label: "Disability Gap", isPlaceholder: true },
              { label: "Disability Insurance", isPlaceholder: true },
              { label: "Life Insurance Needs", isPlaceholder: true },
              { label: "LTC Hybrid", isPlaceholder: true },
              { label: "LTC Cost", isPlaceholder: true },
              { label: "Own-Occ Disability", isPlaceholder: true },
              { label: "Umbrella Insurance", isPlaceholder: true },
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
              { label: "Beneficiary IRA", isPlaceholder: true },
              { label: "Beneficiary Optimizer", path: "/portal/beneficiary-optimization" },
              { label: "Inherited Roth", isPlaceholder: true },
              { label: "RMD Calculator", isPlaceholder: true },
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
              { label: "Social Security", path: "/portal/social-security" },
              { label: "Social Security Maximizer", isPlaceholder: true },
              { label: "Social Security Bridge", isPlaceholder: true },
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
              { label: "Income Gap Analyzer", path: "/portal/income-gap" },
              { label: "Income Timeline", path: "/portal/income-timeline" },
              { label: "Retirement Projection", path: "/portal/retirement-projection" },
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
              { label: "Pension Max", isPlaceholder: true },
              { label: "Pension vs Lump Sum", isPlaceholder: true },
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
              { label: "Medicare IRMAA", path: "/portal/medicare-irmaa" },
              { label: "IRMAA Reduction Protocol", isPlaceholder: true },
              { label: "Bracket-Shift Strategy", isPlaceholder: true },
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
              { label: "Tax-Free Ladder Strategy", isPlaceholder: true },
              { label: "Muni Bond Allocation", isPlaceholder: true },
              { label: "Tax-Free Income Projector", isPlaceholder: true },
              { label: "Zero-Tax Retirement Blueprint", isPlaceholder: true },
            ],
          },
        ],
      },
    ],
  },
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
              { label: "All Patients", path: "/portal/clients" },
              { label: "Patient Comparison", path: "/portal/client-comparison" },
              { label: "Patient Files", path: "/portal/client-files" },
              { label: "Patient Snapshot", path: "/portal/client-snapshot" },
            ],
          },
          {
            label: "Scorecards & Vitals",
            children: [
              { label: "Patient Scorecard", path: "/portal/client-scorecard" },
              { label: "Engagement Score", path: "/portal/engagement-score" },
              { label: "Financial Vitals", path: "/portal/financial-vitals" },
              { label: "Physician Financial Vitals", path: "/portal/client-health" },
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
              { label: "Patient Intake", path: "/portal/client-intake" },
              { label: "Onboarding Automation", path: "/portal/client-onboarding-auto" },
              { label: "Patient Self-Service Portal", path: "/portal/client-self-service" },
              { label: "Patient Acquisition Engine", path: "/portal/lead-generator" },
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
              { label: "Patient Presentation", isPlaceholder: true },
              { label: "Patient Report Gen", isPlaceholder: true },
              { label: "Patient Portal Config", path: "/portal/client-portal-config" },
            ],
          },
        ],
      },
    ],
  },
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
              { label: "The Arrival", path: "/portal/the-arrival" },
              { label: "The Mirror", path: "/portal/the-mirror" },
              { label: "The Strategy Table", path: "/portal/the-strategy-table" },
              { label: "The Field", path: "/portal/the-field" },
              { label: "The Map", path: "/portal/the-map" },
              { label: "The Legacy", path: "/portal/the-legacy" },
              { label: "The Brotherhood", path: "/portal/the-brotherhood" },
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
              { label: "Advisor Chat", path: "/portal/advisor-chat" },
              { label: "Advisor Directory", path: "/portal/advisor-directory" },
              { label: "Market Intelligence", path: "/portal/competitive" },
              { label: "Integrations", path: "/portal/integrations" },
              { label: "Peer Trust Network", isPlaceholder: true },
              { label: "Pipeline", path: "/portal/pipeline" },
              { label: "Referral Tracker", path: "/portal/referral-tracker" },
              { label: "Referral Tracking", path: "/portal/referral-tracking" },
              { label: "Slack", path: "/portal/slack" },
              { label: "Workflow Automations", path: "/portal/workflow-automations" },
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
              {
                label: "Core AI Algorithms",
                children: [
                  { label: "AI Brain", path: "/portal/ai" },
                  { label: "Policy Gap Analysis", path: "/portal/ai-policy-review" },
                  { label: "AI Strategy Lab Pro", isPlaceholder: true },
                ],
              },
              { label: "Genome Sequencing Suite", isPlaceholder: true },
              { label: "Risk DNA Analysis", isPlaceholder: true },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Home",
    color: "slate",
    children: [
      { label: "Wealth Reels", path: "/portal" },
      { label: "Dashboard", path: "/portal/dashboard" },
      { label: "Physician Dashboard", path: "/portal/physician" },
      { label: "Client Dashboard", path: "/portal/client" },
      { label: "Advisor Dashboard", path: "/portal/advisor" },
      { label: "AI Whisperer", path: "/portal/whisperer" },
      { label: "Voice Studio", path: "/portal/voice" },
      { label: "Calculator Chain", path: "/portal/chain" },
      { label: "Client Portfolio", path: "/portal/client-portfolio" },
    ],
  },
  {
    label: "Rental Properties",
    color: "slate",
    children: [
      { label: "Short-Term Rentals", path: "/portal/short-term-rentals" },
      { label: "The Rental Enterprise", path: "/portal/rental-enterprise" },
      { label: "STR Tax Strategy", path: "/portal/str-strategy" },
      { label: "The Zip Engine", path: "/portal/zip-engine" },
      { label: "Real Estate Intelligence", path: "/portal/recin" },
      { label: "Physician Loan Refi", path: "/portal/physician-loan-refi" },
      { label: "IUL Loan Optimizer", path: "/portal/iul-loan-optimizer" },
      { label: "Hybrid Income Floor", path: "/portal/hybrid-income-floor" },
      { label: "Disability Gap Analyzer", path: "/portal/disability-gap-analyzer" },
      { label: "Multi-Gen Transfer", path: "/portal/multi-gen-transfer" },
      { label: "Practice Acquisition Diligence", path: "/portal/practice-acquisition" },
      { label: "Exchange Chain Optimizer", path: "/portal/exchange-chain" },
      { label: "Key Person Valuation", path: "/portal/key-person-valuation" },
      { label: "Alternative Lines of Credit", path: "/portal/alt-credit" },
      { label: "Infinite Banking", path: "/portal/infinite-banking" },
      { label: "The Five Mechanisms", path: "/portal/mechanisms" },
      { label: "Sequence Planner", path: "/portal/sequence-planner" },
      { label: "Thresholds", path: "/portal/thresholds" },
      { label: "Integration Scorecard", path: "/portal/integration-scorecard" },
    ],
  },
  {
    label: "Clients",
    color: "slate",
    children: [
      { label: "Lead Inbox", path: "/portal/leads" },
      { label: "Planning Cases", path: "/portal/planning-cases" },
      { label: "Onboarding", path: "/portal/client-onboarding" },
      { label: "Meeting Notes", path: "/portal/ai-meeting-notes" },
    ],
  },
  {
    label: "New Client Welcome List",
    color: "slate",
    children: [
      { label: "Financial Assessment", path: "/portal/financial-assessment" },
      { label: "AI Financial Advisor", path: "/portal/ai-advisor" },
      { label: "My Secret Journey", path: "/portal/my-journey" },
      { label: "Plan Ledger", path: "/portal/plan-ledger" },
      { label: "Controls", path: "/portal/controls" },
      { label: "Purchasing Power", path: "/portal/erosion" },
      { label: "Outside Forces", path: "/portal/outside-forces" },
      { label: "Loan Forgiveness", path: "/portal/forgiveness" },
      { label: "Tax Schedule", path: "/portal/tax-schedule" },
      { label: "The Sphere", path: "/portal/sphere" },
      { label: "Wealth Genome Analysis", path: "/portal/wealth-genome" },
      { label: "What the Genome Says to Do", path: "/portal/genome-strategies" },
      { label: "Genome Pairing Protocol", path: "/portal/household-genome" },
    ],
  },
  {
    label: "Planning",
    color: "slate",
    children: [
      {
        label: "Retirement & Income",
        children: [
          { label: "Income Calculator", path: "/portal/advisor-income-calculator" },
        ],
      },
      {
        label: "Tax & Estate",
        children: [
          { label: "Hot Income (Oil & Gas)", path: "/portal/hot-income" },
          { label: "The Inheritance Engine", path: "/portal/inheritance" },
        ],
      },
      {
        label: "Strategy & Scenarios",
        children: [
          { label: "Risk Tolerance", path: "/portal/risk-tolerance" },
        ],
      },
    ],
  },
  {
    label: "Products",
    color: "slate",
    children: [
      {
        label: "IUL & Index",
        children: [
          { label: "The IUL Engine", path: "/portal/iul-engine" },
          { label: "Long-Term Care", path: "/portal/long-term-care" },
          { label: "Policy Cost Lab", path: "/portal/policy-cost-lab" },
        ],
      },
      {
        label: "Annuities",
        children: [
          { label: "Income for Life", path: "/portal/income-for-life" },
        ],
      },
    ],
  },
  {
    label: "AI & Tools",
    color: "slate",
    children: [
      {
        label: "AI Assistants",
        children: [
          { label: "Strategy Assist", path: "/portal/ai-assist" },
        ],
      },
      {
        label: "Sales & Content",
        children: [
          { label: "Document Templates", path: "/portal/document-templates" },
        ],
      },
    ],
  },
  {
    label: "The Experience",
    color: "slate",
    children: [
      {
        label: "Command",
        children: [
          { label: "Daily Briefing", path: "/portal/daily-briefing" },
          { label: "Nerve Center", path: "/portal/nerve-center" },
          { label: "Quick Glance", path: "/portal/toilet" },
          { label: "Russell Number", path: "/portal/russell-number" },
          { label: "My World", path: "/portal/my-world" },
          { label: "Avatar Twins", path: "/portal/avatar-twins" },
          { label: "Morning Ritual", path: "/portal/morning-ritual" },
          { label: "Wealth Feed", path: "/portal/infinite-scroll" },
        ],
      },
      {
        label: "Compete",
        children: [
          { label: "The Arena", path: "/portal/arena" },
          { label: "Time Machine", path: "/portal/time-machine" },
          { label: "Time-Lapse", path: "/portal/time-lapse" },
        ],
      },
      {
        label: "Earn",
        children: [
          { label: "Rewards Vault", path: "/portal/rewards" },
          { label: "Revenue Guarantee", path: "/portal/revenue-guarantee" },
          { label: "Pet Companion", path: "/portal/pet" },
        ],
      },
      {
        label: "Explore",
        children: [
          { label: "Black Mirror", path: "/portal/black-mirror" },
          { label: "Social Narcotic", path: "/portal/social" },
        ],
      },
      {
        label: "Transcend",
        children: [
          { label: "The Endgame", path: "/portal/endgame" },
          { label: "Couples Mode", path: "/portal/couples" },
          { label: "Russell Wrapped", path: "/portal/wrapped" },
          { label: "Live Co-Pilot", path: "/portal/co-pilot" },
        ],
      },
    ],
  },
  {
    label: "Tax Secrets",
    color: "slate",
    children: [
      { label: "100 Secret Strategies", path: "/portal/secret-secrets" },
      { label: "Client Intake Form", path: "/portal/client-intake-recommender" },
      { label: "Trust Structures", path: "/portal/trusts" },
      { label: "Mortgage Killer V3", path: "/portal/mortgage-killer-v3" },
      { label: "Physician's Edge", path: "/portal/physicians-edge" },
    ],
  },
  {
    label: "Secondary Information",
    color: "slate",
    children: [
      { label: "Secondary Library", path: "/portal/secondary-information" },
      { label: "Video Library", path: "/portal/video-library" },
      { label: "Patent Portfolio", path: "/portal/patent-showcase" },
    ],
  },
  {
    label: "Settings",
    color: "slate",
    children: [
      { label: "Billing & Plans", path: "/portal/billing" },
      { label: "Connections", path: "/portal/connections" },
      { label: "System Health", path: "/portal/system-health" },
      { label: "Site Health (SEO & Security)", path: "/portal/site-health" },
      { label: "Leaderboard", path: "/portal/leaderboard" },
    ],
  },
];

/** Every real (non-placeholder) destination in the tree, in order. */
export function collectPaths(nodes: readonly NavNode[] = MEDICAL_TREE): string[] {
  const out: string[] = [];
  const walk = (ns: readonly NavNode[]) => {
    for (const n of ns) {
      if (n.path) out.push(n.path);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** Every node, depth-first, each with the labels of its ancestors. */
export function flattenNavTree(
  nodes: readonly NavNode[] = MEDICAL_TREE,
  trail: string[] = []
): Array<{ node: NavNode; trail: string[] }> {
  const out: Array<{ node: NavNode; trail: string[] }> = [];
  for (const n of nodes) {
    out.push({ node: n, trail });
    if (n.children) out.push(...flattenNavTree(n.children, [...trail, n.label]));
  }
  return out;
}

/** Depth of the deepest branch. Used by the tests to assert the tree still nests. */
export function treeDepth(nodes: readonly NavNode[] = MEDICAL_TREE): number {
  if (!nodes.length) return 0;
  return 1 + Math.max(...nodes.map(n => (n.children ? treeDepth(n.children) : 0)));
}
