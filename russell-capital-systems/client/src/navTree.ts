/**
 * navTree.ts — declarative, recursive navigation tree.
 *
 * Ported from russell-capital-app (PR-2b). ADDITIVE ONLY: this file introduces
 * a second, structured way to browse the application. It does not replace
 * AppShell's existing navigation, and nothing that was reachable before this
 * file existed became unreachable because of it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EVERY PATH HERE IS VALIDATED AGAINST shared/routeManifest.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * The donor tree carried 289 leaves. 141 of them do not exist in this
 * application and were removed rather than imported as dead links:
 *
 *   124  target not present in ROUTE_MANIFEST
 *    17  placeholder nodes (the donor routed these to /portal/nav-placeholder,
 *        which this application does not serve)
 *
 * A further 17 folders were dropped because pruning left them empty.
 * What remains: 10 sections, 148 leaves, every one of which
 * resolves to a route this application actually serves.
 *
 * server/navTree.test.ts enforces that invariant on every run. If you add a
 * leaf whose path is not in ROUTE_MANIFEST, the suite fails and names it.
 *
 * The full list of what was dropped is in docs/pr-2b-navtree-pruned.md.
 */

export type NavNode = {
  label: string;
  color?: string;
  path?: string;
  children?: NavNode[];
  defaultOpen?: boolean;
};

/** Leaf shorthand: label + route. */
const l = (label: string, path: string): NavNode => ({ label, path });

export const MEDICAL_TREE: NavNode[] = [
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
              l("Daily Discovery", "/portal/daily-discovery"),
              l("Hidden Material", "/portal/hidden-material"),
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
                  l("Financial Check-Up", "/portal/advisory-summary"),
                  l("Command Center", "/portal/command-center"),
                  l("Strategy Operating Room", "/portal/war-room"),
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
              l("Predictive Analytics", "/portal/predictive-analytics"),
              l("Stale Digest", "/portal/stale-digest"),
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
              l("Ask Your Data", "/portal/data-query"),
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
                  l("Accumulation DB", "/portal/annuity-accumulation-db"),
                  l("Growth Annuities", "/portal/growth-annuities"),
                  l("MYGA Fixed Rate", "/portal/myga-fixed-rate"),
                  l("MYGA Waterfall", "/portal/myga-waterfall"),
                ],
              },
            ],
          },
          {
            label: "Income & Riders",
            children: [
              l("Athene Guaranteed Income", "/portal/athene-guaranteed-income"),
              l("Top 10 Income", "/portal/income-annuity-top10"),
              l("Lifetime Income", "/portal/lifetime-income"),
            ],
          },
          {
            label: "Indexed & Variable",
            children: [
              l("Athene PE+15", "/portal/athene-pe-plus15"),
              l("Axonic S&P500", "/portal/axonic-sp500"),
              l("FIA Collateral", "/portal/fia-collateral"),
              l("Top 10 FIA", "/portal/fia-top10"),
            ],
          },
          {
            label: "Reviews & Comparisons",
            children: [
              l("Annuity Memory", "/portal/annuity-memory"),
              l("Existing Annuities", "/portal/existing-annuities"),
            ],
          },
          {
            label: "Recommenders",
            children: [
              l("AI Strategy Prescriber", "/portal/combo-recommender"),
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
              l("Illustration Compare", "/portal/illustration-compare"),
              l("Index Backtester", "/portal/index-backtester"),
              l("Index Strategies", "/portal/index-strategies"),
              l("IUL Historical", "/portal/iul-historical"),
              l("IUL vs Roth", "/portal/iul-vs-roth"),
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
              l("Policy Loans", "/portal/policy-loans"),
              l("Policy Review", "/portal/policy-review"),
              l("Policy Review Checklist", "/portal/policy-review-checklist"),
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
              l("Carrier Compare", "/portal/carrier-comparison"),
              l("5-Slot Comparison", "/portal/comparison"),
              l("Recommendations", "/portal/recommendations"),
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
              l("Mortgage Killer", "/portal/mortgage-killer"),
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
              l("Tax Brackets", "/portal/tax-brackets"),
            ],
          },
          {
            label: "Loss-Harvest Sessions",
            children: [
              l("Tax-Loss Harvesting", "/portal/tax-loss-harvesting"),
            ],
          },
          {
            label: "Tax Planning",
            children: [
              {
                label: "Advanced Optimizer Suite",
                children: [
                  l("Tax Opportunities", "/portal/tax-opportunities"),
                ],
              },
              l("100 Tax-Free Combos", "/portal/tax-combos"),
              l("Tax Waterfall", "/portal/tax-waterfall"),
            ],
          },
          {
            label: "Tax Treatments",
            children: [
              l("Tax-Advantaged Growth", "/portal/tax-advantaged-growth"),
              l("Tax Return Upload", "/portal/tax-return-upload"),
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
  {
    label: "Wellness Coaching",
    color: "emerald",
    children: [
      {
        label: "Business Counseling",
        color: "indigo",
        children: [
          {
            label: "Owner Strategy",
            children: [
              l("Business Owner", "/portal/business-owner"),
            ],
          },
          {
            label: "Practice Management",
            children: [
              l("Commission Calculator", "/portal/commission-calculator"),
            ],
          },
          {
            label: "Succession Counseling",
            children: [
              l("Succession Planning", "/portal/succession-planning"),
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
              l("Household Wealth", "/portal/household-wealth"),
              l("Multi-Gen Wealth", "/portal/multi-gen-wealth"),
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
              l("Advisor Training", "/portal/advisor-training"),
              l("Agency Tutorial", "/portal/agency-tutorial"),
              l("Platform Training", "/portal/agent-tutorial"),
              l("Collaborative Planning", "/portal/collaborative-planning"),
              l("Education", "/portal/education"),
              l("Goals Planning", "/portal/goals-planning"),
              l("Meeting Agenda", "/portal/meeting-agenda"),
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
              l("Roth Strategies", "/portal/roth-conversion"),
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
              l("AG49 Compounding", "/portal/time-machine-ag49"),
              l("Time Machine Calculator", "/portal/time-machine-calculator"),
              l("Dual Illustration", "/portal/time-machine-method"),
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
              l("Premium Financing", "/portal/premium-financing"),
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
                  l("Crypto Corner", "/portal/crypto-corner"),
                  l("Inflation", "/portal/inflation"),
                ],
              },
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
                  l("Compliance Center", "/portal/compliance"),
                  l("Alerts", "/portal/compliance-alerts"),
                  l("Compliance Audit", "/portal/compliance-audit"),
                  l("Audit Trail", "/portal/compliance-audit-trail"),
                ],
              },
              l("Compliance Monitor", "/portal/compliance-monitoring"),
              l("Compliance Reports", "/portal/compliance-reports"),
              l("Monitoring Agreement", "/portal/monitoring-agreement"),
              l("Owner Oversight", "/portal/owner-oversight"),
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
              l("Ibbotson Charts", "/portal/ibbotson-charts"),
              l("Market Data", "/portal/market-data"),
              l("Market Stress Test", "/portal/market-stress-test"),
              l("Portfolio Drift", "/portal/portfolio-drift"),
              l("Rebalance", "/portal/rebalance"),
              l("Smart Rebalancing", "/portal/smart-rebalancing"),
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
                  l("Strategy Lab", "/portal/strategy"),
                  l("Strategy Compare", "/portal/strategy-compare"),
                ],
              },
              l("Saved Scenarios", "/portal/saved-scenarios"),
              l("Scenario Play", "/portal/scenario-play"),
              l("Scenario Builder", "/portal/scenarios"),
              l("Side-by-Side Compare", "/portal/scenario-side-by-side"),
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
                  l("AI Slide Generator", "/portal/ai-slides"),
                  l("Batch Slides", "/portal/batch-slides"),
                ],
              },
              l("Batch Illustration", "/portal/batch-illustration"),
              l("Bulk Generation", "/portal/bulk-generation"),
              l("Estate Document Gen", "/portal/estate-document-gen"),
              l("My Slides Library", "/portal/my-slides"),
              l("Presentation Builder", "/portal/presentation-builder"),
              l("Case Presentation Builder", "/portal/sales-story"),
              l("Seminar Generator", "/portal/seminar-generator"),
              l("Story Generator", "/portal/story-generator"),
              l("Video Proposals", "/portal/video-proposals"),
              l("Voice Plan", "/portal/voice-plan"),
              l("Case Study Generator", "/portal/war-story-generator"),
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
              l("House Recycling", "/portal/house-recycling"),
              l("Real Estate Mogul", "/portal/real-estate-mogul"),
              l("Reverse HELOC", "/portal/reverse-heloc"),
            ],
          },
          {
            label: "Quick Quotes",
            children: [
              l("Quick Quote", "/portal/quick-quote"),
              l("Quotes", "/portal/quotes"),
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
            label: "Documents & Wills",
            children: [
              l("Legal Payment Folder", "/portal/legal-payment-folder"),
              l("Will Writer", "/portal/will-writer"),
            ],
          },
          {
            label: "Estate Strategy",
            children: [
              l("Estate Flow Chart", "/portal/estate-flow"),
              l("Estate Tax", "/portal/estate-tax"),
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
              l("Beneficiary Optimizer", "/portal/beneficiary-optimization"),
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
              l("Social Security", "/portal/social-security"),
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
              l("Income Gap Analyzer", "/portal/income-gap"),
              l("Income Timeline", "/portal/income-timeline"),
              l("Retirement Projection", "/portal/retirement-projection"),
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
              l("Medicare IRMAA", "/portal/medicare-irmaa"),
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
              l("All Patients", "/portal/clients"),
              l("Patient Comparison", "/portal/client-comparison"),
              l("Patient Files", "/portal/client-files"),
              l("Patient Snapshot", "/portal/client-snapshot"),
            ],
          },
          {
            label: "Scorecards & Vitals",
            children: [
              l("Patient Scorecard", "/portal/client-scorecard"),
              l("Engagement Score", "/portal/engagement-score"),
              l("Financial Vitals", "/portal/financial-vitals"),
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
              l("Patient Intake", "/portal/client-intake"),
              l("Onboarding Automation", "/portal/client-onboarding-auto"),
              l("Patient Self-Service Portal", "/portal/client-self-service"),
              l("Patient Acquisition Engine", "/portal/lead-generator"),
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
              l("Patient Portal Config", "/portal/client-portal-config"),
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
              l("The Arrival", "/portal/the-arrival"),
              l("The Mirror", "/portal/the-mirror"),
              l("The Strategy Table", "/portal/the-strategy-table"),
              l("The Field", "/portal/the-field"),
              l("The Map", "/portal/the-map"),
              l("The Legacy", "/portal/the-legacy"),
              l("The Brotherhood", "/portal/the-brotherhood"),
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
              l("Advisor Chat", "/portal/advisor-chat"),
              l("Advisor Directory", "/portal/advisor-directory"),
              l("Market Intelligence", "/portal/competitive"),
              l("Integrations", "/portal/integrations"),
              l("Pipeline", "/portal/pipeline"),
              l("Referral Tracker", "/portal/referral-tracker"),
              l("Referral Tracking", "/portal/referral-tracking"),
              l("Slack", "/portal/slack"),
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
              {
                label: "Core AI Algorithms",
                children: [
                  l("AI Brain", "/portal/ai"),
                  l("Policy Gap Analysis", "/portal/ai-policy-review"),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

/** Every route reachable at or below this node. */
export function collectPaths(node: NavNode): string[] {
  if (node.path) return [node.path];
  if (!node.children) return [];
  return node.children.flatMap(collectPaths);
}

/** Flatten the tree into a map: path -> node. */
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
