// Recursive navigation tree for Russell Capital Systems.
//
// PR-2b. The *model* (NavNode, collectPaths, flattenNavTree) is ported from the
// navigation tree in russell-capital-app. The *content* is generated from this
// repository's own NAV_SECTIONS, so every leaf resolves against this
// repository's route manifest in App.tsx.
//
// Additive by design. This file does not replace NAV_SECTIONS in AppShell.tsx,
// the route table in App.tsx, secondaryCatalog.ts, the tRPC namespaces, the
// database layer, or any existing test. Nothing imports it except the NavTree
// renderer and navTree.test.ts.
//
// Two entries present in NAV_SECTIONS are deliberately omitted because they
// point at routes that do not exist and would be born as dead links:
//   /portal/tool-explorer
//   /portal/knowledge-library
// They remain in NAV_SECTIONS untouched; fixing them is separate work.
//
// GENERATED from NAV_SECTIONS — regenerate rather than hand-edit.

export type NavNode = {
  label: string;
  path?: string;
  children?: NavNode[];
  defaultOpen?: boolean;
};

/** Every leaf path beneath a node, depth-first. */
export function collectPaths(node: NavNode): string[] {
  if (node.path) return [node.path];
  if (!node.children) return [];
  return node.children.flatMap(collectPaths);
}

/** Flatten a forest into path -> node. */
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

/** Deepest nesting level. A forest of bare leaves is depth 1. */
export function treeDepth(nodes: NavNode[]): number {
  let deepest = 0;
  for (const node of nodes) {
    const d = node.children?.length ? 1 + treeDepth(node.children) : 1;
    if (d > deepest) deepest = d;
  }
  return deepest;
}

export const RCS_NAV_TREE: NavNode[] = [
  {
    label: "Home",
    children: [
      { label: "Wealth Reels", path: "/portal" },
      { label: "Dashboard", path: "/portal/dashboard" },
      { label: "Physician Dashboard", path: "/portal/physician" },
      { label: "Client Dashboard", path: "/portal/client" },
      { label: "Advisor Dashboard", path: "/portal/advisor" },
      { label: "AI Whisperer", path: "/portal/whisperer" },
      { label: "Voice Studio", path: "/portal/voice" },
      { label: "Calculator Chain", path: "/portal/chain" },
      { label: "Advisory Summary", path: "/portal/advisory-summary" },
      { label: "Client Health", path: "/portal/client-health" },
      { label: "Client Portfolio", path: "/portal/client-portfolio" },
    ],
  },
  {
    label: "Rental Properties",
    children: [
      { label: "Short-Term Rentals", path: "/portal/short-term-rentals" },
      { label: "The Rental Enterprise", path: "/portal/rental-enterprise" },
      { label: "STR Tax Strategy", path: "/portal/str-strategy" },
      { label: "The Zip Engine", path: "/portal/zip-engine" },
      { label: "House Recycling", path: "/portal/house-recycling" },
      { label: "Real Estate Mogul", path: "/portal/real-estate-mogul" },
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
    children: [
      { label: "Client Directory", path: "/portal/clients" },
      { label: "Lead Inbox", path: "/portal/leads" },
      { label: "Planning Cases", path: "/portal/planning-cases" },
      { label: "Onboarding", path: "/portal/client-onboarding" },
      { label: "Smart Intake", path: "/portal/client-intake" },
      { label: "Meeting Notes", path: "/portal/ai-meeting-notes" },
      { label: "Snapshot Map", path: "/portal/client-snapshot" },
    ],
  },
  {
    label: "New Client Welcome List",
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
      { label: "1. The Arrival", path: "/portal/the-arrival" },
      { label: "2. The Mirror", path: "/portal/the-mirror" },
      { label: "3. Strategy Table", path: "/portal/the-strategy-table" },
      { label: "4. The Field", path: "/portal/the-field" },
      { label: "5. The Map", path: "/portal/the-map" },
      { label: "6. The Legacy", path: "/portal/the-legacy" },
      { label: "7. The Brotherhood", path: "/portal/the-brotherhood" },
    ],
  },
  {
    label: "Planning",
    children: [
      {
        label: "Retirement & Income",
        children: [
          { label: "Retirement Drivers", path: "/portal/ecological-drivers" },
          { label: "Social Security", path: "/portal/social-security" },
          { label: "Income Gap Analyzer", path: "/portal/income-gap" },
          { label: "Withdrawal Sequencing", path: "/portal/withdrawal-sequencing" },
          { label: "Lifetime Income", path: "/portal/lifetime-income" },
          { label: "Income Timeline", path: "/portal/income-timeline" },
          { label: "Income Calculator", path: "/portal/advisor-income-calculator" },
        ],
      },
      {
        label: "Tax & Estate",
        children: [
          { label: "Tax Waterfall", path: "/portal/tax-waterfall" },
          { label: "Tax-Advantaged Growth", path: "/portal/tax-advantaged-growth" },
          { label: "Hot Income (Oil & Gas)", path: "/portal/hot-income" },
          { label: "Estate Tax", path: "/portal/estate-tax" },
          { label: "Estate Flow Chart", path: "/portal/estate-flow" },
          { label: "The Inheritance Engine", path: "/portal/inheritance" },
          { label: "Beneficiary Optimizer", path: "/portal/beneficiary-optimization" },
        ],
      },
      {
        label: "Strategy & Scenarios",
        children: [
          { label: "Strategy Lab", path: "/portal/strategy" },
          { label: "Roth Strategies (6)", path: "/portal/roth-conversion" },
          { label: "Strategy Compare", path: "/portal/strategy-compare" },
          { label: "Scenario Builder", path: "/portal/scenarios" },
          { label: "Side-by-Side Compare", path: "/portal/scenario-side-by-side" },
          { label: "5-Slot Comparison", path: "/portal/comparison" },
          { label: "IUL vs Roth", path: "/portal/iul-vs-roth" },
          { label: "Risk Tolerance", path: "/portal/risk-tolerance" },
          { label: "Market Stress Test", path: "/portal/market-stress-test" },
        ],
      },
    ],
  },
  {
    label: "Products",
    children: [
      {
        label: "IUL & Index",
        children: [
          { label: "Ibbotson Charts", path: "/portal/ibbotson-charts" },
          { label: "IUL Historical", path: "/portal/iul-historical" },
          { label: "The IUL Engine", path: "/portal/iul-engine" },
          { label: "Long-Term Care", path: "/portal/long-term-care" },
          { label: "Index Strategies", path: "/portal/index-strategies" },
          { label: "Policy Loans", path: "/portal/policy-loans" },
          { label: "Policy Cost Lab", path: "/portal/policy-cost-lab" },
          { label: "Premium Financing", path: "/portal/premium-financing" },
          { label: "Index Backtester", path: "/portal/index-backtester" },
          { label: "Time Machine", path: "/portal/time-machine-calculator" },
          { label: "AG 49 Compounding", path: "/portal/time-machine-ag49" },
          { label: "Dual Illustration", path: "/portal/time-machine-method" },
        ],
      },
      {
        label: "Annuities",
        children: [
          { label: "Growth Annuities", path: "/portal/growth-annuities" },
          { label: "MYGA Waterfall", path: "/portal/myga-fixed-rate" },
          { label: "Existing Annuities", path: "/portal/existing-annuities" },
          { label: "Income for Life", path: "/portal/income-for-life" },
          { label: "Top 10 Income", path: "/portal/income-annuity-top10" },
          { label: "Top 10 FIA", path: "/portal/fia-top10" },
          { label: "Accumulation DB", path: "/portal/annuity-accumulation-db" },
          { label: "Carrier Compare", path: "/portal/carrier-comparison" },
          { label: "Illustration Compare", path: "/portal/illustration-compare" },
          { label: "Policy Gap Analysis", path: "/portal/ai-policy-review" },
        ],
      },
      {
        label: "Real Estate",
        children: [
          { label: "Mortgage Killer", path: "/portal/mortgage-killer" },
          { label: "Household Wealth", path: "/portal/household-wealth" },
          { label: "Reverse HELOC", path: "/portal/reverse-heloc" },
        ],
      },
      {
        label: "Specialty",
        children: [
          { label: "Business Owner", path: "/portal/business-owner" },
        ],
      },
    ],
  },
  {
    label: "AI & Tools",
    children: [
      {
        label: "AI Assistants",
        children: [
          { label: "Strategy Assist", path: "/portal/ai-assist" },
          { label: "Strategy Recommender", path: "/portal/ai-recommender" },
          { label: "Ask Your Data", path: "/portal/data-query" },
          { label: "Predictive Analytics", path: "/portal/predictive-analytics" },
          { label: "Stale Digest", path: "/portal/stale-digest" },
        ],
      },
      {
        label: "Sales & Content",
        children: [
          { label: "Sales Story Builder", path: "/portal/sales-story" },
          { label: "Lead Generator", path: "/portal/lead-generator" },
          { label: "Competitive Analysis", path: "/portal/competitive" },
          { label: "Presentation Builder", path: "/portal/presentation-builder" },
          { label: "AI Slide Generator", path: "/portal/ai-slides" },
          { label: "My Slides Library", path: "/portal/my-slides" },
          { label: "Document Templates", path: "/portal/document-templates" },
          { label: "Video Proposals (AI)", path: "/portal/video-proposals" },
        ],
      },
    ],
  },
  {
    label: "Compliance",
    children: [
      { label: "Compliance Center", path: "/portal/compliance" },
      { label: "Compliance Monitor", path: "/portal/compliance-monitoring" },
      { label: "Alerts", path: "/portal/compliance-alerts" },
      { label: "Audit Trail", path: "/portal/compliance-audit-trail" },
    ],
  },
  {
    label: "The Experience",
    children: [
      {
        label: "Command",
        children: [
          { label: "Daily Briefing", path: "/portal/daily-briefing" },
          { label: "Nerve Center", path: "/portal/nerve-center" },
          { label: "Quick Glance", path: "/portal/toilet" },
          { label: "Russell Number", path: "/portal/russell-number" },
          { label: "Daily Discovery", path: "/portal/daily-discovery" },
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
          { label: "War Room", path: "/portal/war-room" },
          { label: "War Story Gen", path: "/portal/war-story-generator" },
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
          { label: "Will Writer", path: "/portal/will-writer" },
          { label: "Couples Mode", path: "/portal/couples" },
          { label: "Russell Wrapped", path: "/portal/wrapped" },
          { label: "Story Generator", path: "/portal/story-generator" },
          { label: "Live Co-Pilot", path: "/portal/co-pilot" },
        ],
      },
    ],
  },
  {
    label: "Tax Secrets",
    children: [
      { label: "100 Secret Strategies", path: "/portal/secret-secrets" },
      { label: "100 Tax-Free Combos", path: "/portal/tax-combos" },
      { label: "AI Combo Recommender", path: "/portal/combo-recommender" },
      { label: "Client Intake Form", path: "/portal/client-intake-recommender" },
      { label: "Divorce Devastation Engine", path: "/portal/divorce-calculator" },
      { label: "Trust Structures", path: "/portal/trusts" },
      { label: "Mortgage Killer V3", path: "/portal/mortgage-killer-v3" },
      { label: "Physician's Edge", path: "/portal/physicians-edge" },
    ],
  },
  {
    label: "Secondary Information",
    children: [
      { label: "Secondary Library", path: "/portal/secondary-information" },
      { label: "Video Library", path: "/portal/video-library" },
      { label: "Patent Portfolio", path: "/portal/patent-showcase" },
    ],
  },
  {
    label: "Settings",
    children: [
      { label: "Billing & Plans", path: "/portal/billing" },
      { label: "Platform Training", path: "/portal/agent-tutorial" },
      { label: "Connections", path: "/portal/connections" },
      { label: "Integrations", path: "/portal/integrations" },
      { label: "Bulk Generation", path: "/portal/bulk-generation" },
      { label: "Command Center", path: "/portal/command-center" },
      { label: "System Health", path: "/portal/system-health" },
      { label: "Site Health (SEO & Security)", path: "/portal/site-health" },
      { label: "Leaderboard", path: "/portal/leaderboard" },
    ],
  },
];
