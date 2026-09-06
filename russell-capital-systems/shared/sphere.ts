// ============================================================
// THE SPHERE — one shape for the whole site instead of a pile of pages.
//
// Every page is a point on a sphere with two coordinates:
//   meridian  = the domain of a client's financial life (12 of them, evenly
//               spaced around the equator)
//   latitude  = the layer of work on that domain, from the surface in:
//               Facts (what is true) → Erosion (what is eating it) →
//               Moves (what to do) → Proof (what the ledger shows happened)
// The same client record (the Plan Ledger) is at the centre; every page is
// a facet of it. Navigation is by coordinate, not by menu, so the site is
// even on every side, and adding a page means placing a point, never adding
// a corridor. Zooming into any point reveals the finer pages under it — the
// structure repeats at every scale.
// ============================================================

export const MERIDIANS = [
  { id: "income", label: "Income", degree: 0 },
  { id: "taxes", label: "Taxes", degree: 30 },
  { id: "practice", label: "Practice", degree: 60 },
  { id: "cash", label: "Cash flow", degree: 90 },
  { id: "debt", label: "Debt", degree: 120 },
  { id: "home", label: "Real estate", degree: 150 },
  { id: "invest", label: "Investments", degree: 180 },
  { id: "protect", label: "Protection", degree: 210 },
  { id: "retire", label: "Retirement", degree: 240 },
  { id: "estate", label: "Estate", degree: 270 },
  { id: "family", label: "Family", degree: 300 },
  { id: "legacy", label: "Legacy", degree: 330 },
] as const;
export type MeridianId = (typeof MERIDIANS)[number]["id"];

export const LATITUDES = [
  { id: "facts", label: "Facts", question: "What is true today?" },
  { id: "erosion", label: "Erosion", question: "What is eating it: taxes, prices, risk?" },
  { id: "moves", label: "Moves", question: "What do we do about it?" },
  { id: "proof", label: "Proof", question: "What does the ledger show happened?" },
] as const;
export type LatitudeId = (typeof LATITUDES)[number]["id"];

export type SpherePoint = { path: string; title: string; meridian: MeridianId; latitude: LatitudeId; core?: boolean };

/** The placed points. Pages not listed here still exist; they are reached by zooming into the nearest point. */
export const SPHERE_POINTS: SpherePoint[] = [
  // Facts
  { path: "/portal/financial-assessment", title: "Financial Assessment", meridian: "income", latitude: "facts", core: true },
  { path: "/portal/wealth-genome", title: "Wealth Genome", meridian: "family", latitude: "facts", core: true },
  { path: "/portal/controls", title: "Controls: consent, mandates, firewall", meridian: "protect", latitude: "facts", core: true },
  { path: "/portal/connections", title: "Connections", meridian: "practice", latitude: "facts" },
  { path: "/portal/market-data", title: "Market data & benchmarks", meridian: "invest", latitude: "facts" },
  { path: "/portal/household-wealth", title: "Household wealth", meridian: "cash", latitude: "facts" },
  { path: "/portal/business-owner", title: "Business owner planning", meridian: "practice", latitude: "facts" },
  { path: "/portal/existing-annuities", title: "Existing annuities", meridian: "retire", latitude: "facts" },
  { path: "/portal/policy-review", title: "Policy review", meridian: "protect", latitude: "facts" },
  // Erosion
  { path: "/portal/erosion", title: "Purchasing power: taxes and prices over 40 years", meridian: "taxes", latitude: "erosion", core: true },
  { path: "/portal/forgiveness", title: "Student loan forgiveness: the record, the odds, the asset it could fund", meridian: "debt", latitude: "moves" },
  { path: "/portal/tax-schedule", title: "Tax optimisation schedule: year by year, strategy by strategy", meridian: "taxes", latitude: "moves" },
  { path: "/portal/site-health", title: "Site health: hosting, security, SEO and speed checklist", meridian: "protect", latitude: "facts" },
  { path: "/portal/tax-brackets", title: "Tax bracket visualizer", meridian: "taxes", latitude: "erosion" },
  { path: "/portal/inflation", title: "Inflation analysis", meridian: "cash", latitude: "erosion" },
  { path: "/portal/medicare-irmaa", title: "Medicare IRMAA", meridian: "retire", latitude: "erosion" },
  { path: "/portal/estate-tax", title: "Estate tax", meridian: "estate", latitude: "erosion" },
  { path: "/portal/market-stress-test", title: "Market stress test", meridian: "invest", latitude: "erosion" },
  { path: "/portal/risk-tolerance", title: "Risk tolerance", meridian: "protect", latitude: "erosion" },
  { path: "/portal/income-gap", title: "Income gap analyzer", meridian: "income", latitude: "erosion" },
  { path: "/portal/portfolio-drift", title: "Portfolio drift", meridian: "invest", latitude: "erosion" },
  // Moves
  { path: "/portal/my-journey", title: "My Secret Journey", meridian: "legacy", latitude: "moves", core: true },
  { path: "/portal/ai-advisor", title: "Financial Librarian", meridian: "family", latitude: "moves", core: true },
  { path: "/portal/mortgage-killer-v3", title: "Mortgage Killer", meridian: "home", latitude: "moves" },
  { path: "/portal/house-recycling", title: "House recycling", meridian: "home", latitude: "moves" },
  { path: "/portal/tax-waterfall", title: "Tax waterfall", meridian: "taxes", latitude: "moves" },
  { path: "/portal/roth-conversion", title: "Roth conversion sequencing", meridian: "taxes", latitude: "moves" },
  { path: "/portal/withdrawal-sequencing", title: "Withdrawal sequencing", meridian: "retire", latitude: "moves" },
  { path: "/portal/social-security", title: "Social Security optimizer", meridian: "retire", latitude: "moves" },
  { path: "/portal/fia-top10", title: "FIA top 10", meridian: "invest", latitude: "moves" },
  { path: "/portal/premium-financing", title: "Premium financing", meridian: "protect", latitude: "moves" },
  { path: "/portal/charitable-giving", title: "Charitable giving optimizer", meridian: "legacy", latitude: "moves" },
  { path: "/portal/multi-gen-wealth", title: "Multi-generation transfer", meridian: "estate", latitude: "moves" },
  { path: "/portal/succession-planning", title: "Succession planning", meridian: "practice", latitude: "moves" },
  { path: "/portal/beneficiary-optimization", title: "Beneficiary optimization", meridian: "family", latitude: "moves" },
  { path: "/portal/goals-planning", title: "Goals-based planning", meridian: "cash", latitude: "moves" },
  { path: "/portal/tax-loss-harvesting", title: "Tax-loss harvesting", meridian: "invest", latitude: "moves" },
  { path: "/portal/str-strategy", title: "Student-loan strategy", meridian: "debt", latitude: "moves" },
  // Proof
  { path: "/portal/plan-ledger", title: "Plan Ledger", meridian: "legacy", latitude: "proof", core: true },
  { path: "/portal/compliance-audit-trail", title: "Compliance audit trail", meridian: "protect", latitude: "proof" },
  { path: "/portal/saved-scenarios", title: "Saved scenarios", meridian: "invest", latitude: "proof" },
  { path: "/portal/client-scorecard", title: "Client scorecard", meridian: "income", latitude: "proof" },
  { path: "/portal/document-vault", title: "Document vault", meridian: "estate", latitude: "proof" },
  { path: "/portal/leads", title: "Lead inbox", meridian: "practice", latitude: "proof" },
];

export function pointsAt(meridian: MeridianId, latitude: LatitudeId): SpherePoint[] {
  return SPHERE_POINTS.filter((p) => p.meridian === meridian && p.latitude === latitude);
}

/** Position of a point on a 2-D projection of the sphere (unit circle): angle from the meridian, radius from the latitude. */
export function projectPoint(p: SpherePoint): { x: number; y: number } {
  const m = MERIDIANS.find((x) => x.id === p.meridian)!;
  const li = LATITUDES.findIndex((x) => x.id === p.latitude);
  const radius = 1 - (li + 0.5) / LATITUDES.length; // Facts at the rim, Proof near the centre
  const a = (m.degree - 90) * (Math.PI / 180);
  return { x: Math.round(Math.cos(a) * radius * 1000) / 1000, y: Math.round(Math.sin(a) * radius * 1000) / 1000 };
}
