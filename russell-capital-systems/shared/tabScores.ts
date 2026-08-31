/**
 * Utility scores for all portal tabs (1-10 scale).
 * Scores are publicly visible in the sidebar next to each tab name.
 * Tabs scoring 9+ get slightly larger font treatment.
 */
export const TAB_SCORES: Record<string, number> = {
  // ── Dashboard ──
  "/portal": 10,
  "/portal/advisory-summary": 9,
  "/portal/advisor-directory": 8,
  "/portal/financial-vitals": 9,
  "/portal/client-snapshot": 8,
  "/portal/client-health": 9,

  // ── Clients & CRM ──
  "/portal/clients": 10,
  "/portal/client-files": 8,
  "/portal/client-self-service": 8,
  "/portal/client-portal-config": 5,
  "/portal/client-onboarding": 9,
  "/portal/client-onboarding-auto": 8,
  "/portal/client-intake": 9,
  "/portal/meetings": 8,
  "/portal/meeting-agenda": 8,
  "/portal/ai-meeting-notes": 9,

  // ── Retirement & Income ──
  "/portal/ecological-drivers": 8,
  "/portal/social-security": 9,
  "/portal/income-gap": 9,
  "/portal/goals-planning": 8,
  "/portal/retirement-guardrails": 8,
  "/portal/withdrawal-sequencing": 9,
  "/portal/medicare-irmaa": 8,
  "/portal/retirement-projection": 8,
  "/portal/lifetime-income": 9,
  "/portal/income-timeline": 8,
  "/portal/advisor-income-calculator": 8,

  // ── Tax & Estate ──
  "/portal/tax-waterfall": 10,
  "/portal/tax-brackets": 8,
  "/portal/tax-advantaged-growth": 9,
  "/portal/tax-opportunities": 8,
  "/portal/tax-loss-harvesting": 8,
  "/portal/hot-income": 8,
  "/portal/tax-return-upload": 9,
  "/portal/estate-tax": 9,
  "/portal/estate-flow": 9,
  "/portal/estate-document-gen": 8,
  "/portal/beneficiary-optimization": 9,
  "/portal/multi-gen-wealth": 8,
  "/portal/charitable-giving": 8,
  "/portal/succession-planning": 6,

  // ── Wealth Strategy ──
  "/portal/strategy": 9,
  "/portal/roth-conversion": 10,
  "/portal/strategy-compare": 9,
  "/portal/scenarios": 9,
  "/portal/saved-scenarios": 8,
  "/portal/scenario-play": 8,
  "/portal/scenario-side-by-side": 9,
  "/portal/iul-vs-roth": 9,
  "/portal/risk-tolerance": 8,
  "/portal/ai-recommender": 9,
  "/portal/market-stress-test": 9,
  "/portal/smart-rebalancing": 9,
  "/portal/rebalance": 6,
  "/portal/portfolio-drift": 8,

  // ── Calculators ──
  "/portal/ibbotson-charts": 8,
  "/portal/iul-historical": 10,
  "/portal/index-strategies": 9,
  "/portal/policy-loans": 9,
  "/portal/premium-financing": 9,
  "/portal/index-backtester": 9,
  "/portal/time-machine-calculator": 9,
  "/portal/time-machine-ag49": 9,
  "/portal/time-machine-method": 9,
  "/portal/quick-quote": 8,
  "/portal/inflation": 7,
  "/portal/fee-transparency": 8,
  "/portal/business-owner": 7,
  "/portal/crypto-corner": 6,

  // ── Real Estate ──
  "/portal/mortgage-killer": 10,
  "/portal/house-recycling": 9,
  "/portal/household-wealth": 9,
  "/portal/real-estate-mogul": 9,
  "/portal/reverse-heloc": 9,

  // ── Annuities & Insurance ──
  "/portal/growth-annuities": 9,
  "/portal/myga-fixed-rate": 10,
  "/portal/existing-annuities": 8,
  "/portal/income-annuity-top10": 9,
  "/portal/fia-top10": 9,
  "/portal/annuity-accumulation-db": 7,
  "/portal/carrier-rates": 8,
  "/portal/carrier-comparison": 9,
  "/portal/illustration-compare": 9,
  "/portal/carrier-ratings": 8,
  "/portal/quotes": 8,
  "/portal/axonic-sp500": 7,
  "/portal/athene-pe-plus15": 7,
  "/portal/athene-guaranteed-income": 7,
  "/portal/policy-review-checklist": 8,
  "/portal/ai-policy-review": 9,

  // ── Intelligence Tools ──
  "/portal/ai-assist": 9,
  "/portal/advisor-chat": 8,
  "/portal/voice-plan": 8,
  "/portal/data-query": 7,
  "/portal/document-templates": 7,
  "/portal/report-builder": 8,
  "/portal/collaborative-planning": 7,

  // ── Sales & Presentations ──
  "/portal/recommendations": 8,
  "/portal/sales-story": 8,
  "/portal/lead-generator": 7,
  "/portal/referral-tracking": 7,
  "/portal/engagement-score": 7,
  "/portal/leaderboard": 6,
  "/portal/competitive": 8,
  "/portal/seminar-generator": 7,
  "/portal/presentation-builder": 9,
  "/portal/email-campaigns": 7,

  // ── Market & Analytics ──
  "/portal/market-data": 8,
  "/portal/predictive-analytics": 7,
  "/portal/advisor-performance": 8,
  "/portal/client-comparison": 7,
  "/portal/stale-digest": 8,

  // ── Compliance & Legal ──
  "/portal/compliance": 9,
  "/portal/compliance-monitoring": 9,
  "/portal/compliance-audit": 8,
  "/portal/compliance-alerts": 9,
  "/portal/compliance-reports": 8,
  "/portal/compliance-audit-trail": 9,
  "/portal/disclaimers": 7,
  "/portal/communication-log": 8,
  "/portal/website-usage": 8,
  "/portal/legal-payment-folder": 6,
  "/portal/monitoring-agreement": 7,
  "/portal/owner-oversight": 8,

  // ── Administration ──
  "/portal/team": 8,
  "/portal/team-management": 7,
  "/portal/education": 7,
  "/portal/advisor-training": 9,
  "/portal/agent-tutorial": 7,
  "/portal/agency-tutorial": 6,
  "/portal/billing": 7,
  "/portal/enterprise": 6,
  "/portal/knowledge": 9,
  "/portal/branding": 7,
  "/portal/webhooks": 5,
  "/portal/slack": 6,
  "/portal/hubspot": 7,
  "/portal/affiliate-links": 6,
  "/portal/workflow-automations": 8,
  "/portal/bulk-generation": 7,
  "/portal/hidden-material": 4,

  // ── The Experience ──
  "/portal/nerve-center": 10,
  "/portal/arena": 9,
  "/portal/my-world": 9,
  "/portal/war-room": 9,
  "/portal/rewards": 10,
  "/portal/black-mirror": 10,
  "/portal/social": 9,
  "/portal/endgame": 10,
  "/portal/will-writer": 10,
  "/portal/avatar-twins": 10,
  "/portal/couples": 10,
  "/portal/russell-number": 10,
  "/portal/daily-discovery": 10,
  "/portal/wrapped": 9,
  "/portal/story-generator": 10,
  "/portal/time-machine": 10,
  "/portal/co-pilot": 10,
  "/portal/time-lapse": 10,
};

/** Returns the utility score for a given path, or undefined if not scored */
export function getTabScore(path: string): number | undefined {
  return TAB_SCORES[path];
}

/** Returns true if the tab is rated 9 or above */
export function isHighScoreTab(path: string): boolean {
  const score = TAB_SCORES[path];
  return score !== undefined && score >= 9;
}
