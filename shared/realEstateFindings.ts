// ─── Real Estate Findings Engine ────────────────────────────────────────────
// Deterministic, rule-based diagnostics over a modelled capital stack and its
// stress results. Every finding carries the numbers it was derived from, so an
// advisor can defend it in front of a client and an LLM downstream can cite it
// instead of inventing one.
//
// This layer deliberately holds no LLM calls and no randomness: the same deal
// always produces the same findings. Narrative generation happens above it.

import {
  debtConstant,
  goingInCapRate,
  weightedAverageDebtCost,
} from "./realEstateDealModel";
import type {
  CapitalStackInput,
  CapitalStackResult,
  Finding,
  FindingSeverity,
  FindingsReport,
  StressResult,
  LiquidityProfile,
  RealEstateCapitalScenarioInput,
  RealEstateCapitalScenarioResult,
  RealEstatePolicy,
} from "./realEstateCapitalTypes";

const SEVERITY_WEIGHT: Record<FindingSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 0,
};

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const bps = (n: number) => `${Math.round(n)}bp`;
const money = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`;

/* ═══ Rules ════════════════════════════════════════════════════════════════ */

export function generateFindings(
  input: CapitalStackInput,
  stack: CapitalStackResult,
  stress?: StressResult,
): FindingsReport {
  const findings: Finding[] = [];
  const push = (f: Finding) => findings.push(f);

  const goingIn = goingInCapRate(input);
  const constant = debtConstant(input.debt);
  const avgDebtCost = weightedAverageDebtCost(input.debt);
  const totalDebt = input.debt.reduce((s, d) => s + d.principal, 0);
  const commonEquity =
    input.commonEquity.lpContribution + input.commonEquity.gpContribution;

  /* ── Structure integrity ── */

  if (!stack.sourcesAndUses.balanced) {
    const short = stack.sourcesAndUses.surplus;
    push({
      code: "SOURCES_USES_IMBALANCE",
      severity: "critical",
      category: "structure",
      title:
        short < 0 ? "Capital stack is underfunded" : "Capital stack is over-funded",
      detail:
        short < 0
          ? `Sources fall short of uses by ${money(Math.abs(short))}. The deal cannot close as structured — every projected return below assumes money that has not been raised.`
          : `Sources exceed uses by ${money(short)}. Un-deployed equity drags the return; either reduce the raise or document the reserve.`,
      evidence: {
        totalSources: stack.sourcesAndUses.totalSources,
        totalUses: stack.sourcesAndUses.totalUses,
        surplus: short,
      },
      recommendation:
        short < 0
          ? "Increase the equity raise or debt proceeds to cover the gap — origination fees and closing costs are the usual omission."
          : "Right-size the raise, or explicitly designate the surplus as an operating reserve.",
    });
  }

  /* ── Leverage ── */

  if (totalDebt > 0 && constant > goingIn) {
    push({
      code: "NEGATIVE_LEVERAGE",
      severity: constant - goingIn > 0.01 ? "high" : "medium",
      category: "leverage",
      title: "Negative leverage at close",
      detail: `The debt constant of ${pct(constant)} exceeds the going-in cap rate of ${pct(goingIn)}. Every borrowed dollar currently costs more than the asset yields, so leverage is reducing near-term cash-on-cash rather than amplifying it. The deal only works if NOI growth or an exit at a tighter cap closes the gap.`,
      evidence: {
        debtConstant: constant,
        goingInCapRate: goingIn,
        spread: constant - goingIn,
        weightedAverageDebtCost: avgDebtCost,
      },
      recommendation:
        "Reduce proceeds, extend the interest-only period, or underwrite the growth that closes the gap explicitly — do not rely on exit cap compression to rescue it.",
    });
  }

  if (stack.returns.maxLtv > 0.75) {
    push({
      code: "HIGH_LEVERAGE",
      severity: stack.returns.maxLtv > 0.85 ? "high" : "medium",
      category: "leverage",
      title: `Peak LTV reaches ${pct(stack.returns.maxLtv)}`,
      detail: `Leverage peaks at ${pct(stack.returns.maxLtv)} of value. Above roughly 75%, refinancing options narrow sharply and a modest cap rate move can eliminate the equity entirely.`,
      evidence: { maxLtv: stack.returns.maxLtv, totalDebt, commonEquity },
      recommendation:
        "Stress the exit cap before committing; consider a smaller senior tranche or a preferred equity slice in place of the top of the debt stack.",
    });
  }

  if (Number.isFinite(stack.returns.minDebtYield) && stack.returns.minDebtYield < 0.08) {
    push({
      code: "LOW_DEBT_YIELD",
      severity: stack.returns.minDebtYield < 0.07 ? "high" : "medium",
      category: "leverage",
      title: `Debt yield bottoms at ${pct(stack.returns.minDebtYield)}`,
      detail: `Debt yield — NOI divided by loan balance — reaches a low of ${pct(stack.returns.minDebtYield)}. Most lenders require 8–10% at origination and will not refinance below it regardless of how low rates go, because it is the one leverage test that does not depend on rate or cap rate assumptions.`,
      evidence: { minDebtYield: stack.returns.minDebtYield },
      recommendation:
        "Confirm the take-out lender's minimum debt yield now; a shortfall means a cash-in refinance at maturity.",
    });
  }

  /* ── Coverage ── */

  if (stack.covenantBreachYears.length > 0) {
    push({
      code: "DSCR_COVENANT_BREACH",
      severity: "critical",
      category: "coverage",
      title: "DSCR covenant breached in the base case",
      detail: `The base-case projection — before any stress — breaches a DSCR covenant in year(s) ${stack.covenantBreachYears.join(", ")}. This is an event of default, typically triggering a cash sweep and forfeiting distributions well before it becomes a foreclosure conversation.`,
      evidence: {
        breachYears: stack.covenantBreachYears.join(", "),
        minDscr: stack.returns.minDscr,
      },
      recommendation:
        "Restructure before closing: lower proceeds, longer interest-only, or negotiate the covenant. A base case that breaches has no margin at all.",
    });
  } else if (Number.isFinite(stack.returns.minDscr) && stack.returns.minDscr < 1.25) {
    push({
      code: "THIN_DSCR_CUSHION",
      severity: stack.returns.minDscr < 1.1 ? "high" : "medium",
      category: "coverage",
      title: `Minimum DSCR of ${stack.returns.minDscr.toFixed(2)}x`,
      detail: `Coverage bottoms at ${stack.returns.minDscr.toFixed(2)}x, net of capital reserves. Below about 1.25x there is little room for a vacancy spike or an expense surprise before distributions stop.`,
      evidence: { minDscr: stack.returns.minDscr },
      recommendation:
        "Size an operating reserve to cover at least twelve months of the shortfall implied by a 10% NOI decline.",
    });
  }

  if (stress) {
    const be = stress.breakEven;
    if (be.noiDeclineToBreachDscr !== null && be.noiDeclineToBreachDscr < 0.15) {
      push({
        code: "FRAGILE_COVERAGE",
        severity: be.noiDeclineToBreachDscr < 0.08 ? "critical" : "high",
        category: "coverage",
        title: `A ${pct(be.noiDeclineToBreachDscr)} NOI decline breaches the covenant`,
        detail: `It takes only a ${pct(be.noiDeclineToBreachDscr)} fall in NOI to trip the DSCR covenant. For context, national apartment NOI fell further than that in 2009, and a single large tenant rolling out can do it in one quarter.`,
        evidence: {
          noiDeclineToBreachDscr: be.noiDeclineToBreachDscr,
          noiDeclineToNegativeCashFlow: be.noiDeclineToNegativeCashFlow ?? "n/a",
        },
        recommendation:
          "Treat this as the binding constraint on proceeds. Reducing the loan until the break-even exceeds 20% is the cleanest fix.",
      });
    }

    if (be.capExpansionToWipeout !== null && be.capExpansionToWipeout < 200) {
      push({
        code: "EQUITY_WIPEOUT_RISK",
        severity: be.capExpansionToWipeout < 100 ? "critical" : "high",
        category: "market",
        title: `${bps(be.capExpansionToWipeout)} of cap rate expansion wipes out the equity`,
        detail: `Common equity is fully eliminated if exit cap rates widen by ${bps(be.capExpansionToWipeout)}. Cap rates moved more than 150bp between 2021 and 2023 across most property types, so this is a lived scenario rather than a theoretical one.`,
        evidence: {
          capExpansionToWipeout: be.capExpansionToWipeout,
          capExpansionToZeroProfit: be.capExpansionToZeroProfit ?? "n/a",
          exitCapRate: input.property.exitCapRate,
        },
        recommendation:
          "De-lever, or underwrite the exit at a cap rate at least 50bp wider than going-in and confirm the deal still clears its hurdle.",
      });
    }

    const mc = stress.monteCarlo;
    if (mc && mc.probabilityOfLoss > 0.2) {
      push({
        code: "HIGH_LOSS_PROBABILITY",
        severity: mc.probabilityOfLoss > 0.35 ? "critical" : "high",
        category: "returns",
        title: `${pct(mc.probabilityOfLoss)} probability of losing money`,
        detail: `Across ${mc.runs.toLocaleString("en-US")} correlated simulations, ${pct(mc.probabilityOfLoss)} of outcomes return less than the capital invested. The worst 5% of outcomes average a ${pct(mc.conditionalTailIrr)} IRR.`,
        evidence: {
          probabilityOfLoss: mc.probabilityOfLoss,
          conditionalTailIrr: mc.conditionalTailIrr,
          p5: mc.p5,
          p50: mc.p50,
          runs: mc.runs,
        },
        recommendation:
          "Present the distribution to investors, not just the base case. A deal with this tail needs either less leverage or a materially higher promised return.",
      });
    }

    if (mc && mc.probabilityOfCovenantBreach > 0.25) {
      push({
        code: "LIKELY_COVENANT_BREACH",
        severity: "high",
        category: "coverage",
        title: `${pct(mc.probabilityOfCovenantBreach)} chance of a covenant breach`,
        detail: `A quarter or more of simulated paths breach a DSCR covenant at some point in the hold. Breaches trigger cash sweeps, which halt distributions precisely when investors are already nervous.`,
        evidence: { probabilityOfCovenantBreach: mc.probabilityOfCovenantBreach },
        recommendation:
          "Negotiate a cure right — a sponsor paydown or letter of credit — into the loan documents before closing.",
      });
    }
  }

  /* ── Liquidity and maturity ── */

  if (stack.refinanceRequired) {
    push({
      code: "REFINANCE_RISK",
      severity: "high",
      category: "liquidity",
      title: `Debt matures in year ${stack.refinanceYear} — inside the hold`,
      detail: `At least one tranche matures in year ${stack.refinanceYear}, before the modelled disposition in year ${input.property.holdYears}. This model continues servicing that debt on its existing terms, which quietly assumes a refinance at today's rate. The real outcome depends on rates, debt yield, and lender appetite on that date.`,
      evidence: {
        refinanceYear: stack.refinanceYear ?? 0,
        holdYears: input.property.holdYears,
        minDebtYield: stack.returns.minDebtYield,
      },
      recommendation:
        "Model the refinance explicitly at a stressed rate, or buy an extension option now. Confirm the projected debt yield clears a take-out lender's minimum.",
    });
  }

  const allIO = input.debt.every(
    (d) =>
      d.amortization === "interest_only" ||
      (d.amortization === "io_then_amortizing" && d.ioYears >= input.property.holdYears),
  );
  if (totalDebt > 0 && allIO) {
    push({
      code: "NO_AMORTIZATION",
      severity: "medium",
      category: "liquidity",
      title: "No principal is repaid during the hold",
      detail:
        "Every tranche is interest-only for the full hold period. Cash-on-cash looks stronger, but the entire principal balloons at exit and none of the return comes from debt paydown — the deal depends completely on value appreciation.",
      evidence: {
        totalDebt,
        debtAtExit: stack.exit.debtPayoff,
        holdYears: input.property.holdYears,
      },
      recommendation:
        "Confirm the investors understand that amortization contributes nothing here, and stress the exit value accordingly.",
    });
  }

  if (input.property.capexReservePctOfNOI <= 0) {
    push({
      code: "NO_CAPEX_RESERVE",
      severity: "medium",
      category: "liquidity",
      title: "No ongoing capital reserve is underwritten",
      detail:
        "The model reserves nothing from NOI for recurring capital needs. Roofs, HVAC, turnover and tenant improvements are certainties, not contingencies; omitting them overstates both DSCR and distributable cash in every year.",
      evidence: { capexReservePctOfNOI: 0 },
      recommendation:
        "Underwrite a reserve — commonly 3–5% of NOI for multifamily, higher for commercial with rollover exposure.",
    });
  }

  /* ── Market assumptions ── */

  if (input.property.exitCapRate < goingIn) {
    const compression = (goingIn - input.property.exitCapRate) * 10_000;
    push({
      code: "EXIT_CAP_COMPRESSION_ASSUMED",
      severity: compression > 50 ? "high" : "medium",
      category: "market",
      title: `Underwriting assumes ${bps(compression)} of cap rate compression`,
      detail: `The exit cap of ${pct(input.property.exitCapRate)} is tighter than the going-in cap of ${pct(goingIn)}. That embeds ${bps(compression)} of multiple expansion into the return — a market call, not an operating result, and one that has gone the other way for most of the last three years.`,
      evidence: {
        goingInCapRate: goingIn,
        exitCapRate: input.property.exitCapRate,
        compressionBps: compression,
      },
      recommendation:
        "Re-run at an exit cap equal to or wider than going-in. If the deal only clears on compression, say so plainly in the investor materials.",
    });
  }

  /* ── Alignment ── */

  const gpCapitalShare =
    commonEquity > 0 ? input.commonEquity.gpContribution / commonEquity : 0;
  if (stack.waterfall.gpProfitShare > 0.25 && gpCapitalShare < 0.15) {
    push({
      code: "PROMOTE_HEAVY",
      severity: "medium",
      category: "alignment",
      title: `Sponsor takes ${pct(stack.waterfall.gpProfitShare)} of profit on ${pct(gpCapitalShare)} of capital`,
      detail: `The promote delivers the sponsor ${pct(stack.waterfall.gpProfitShare)} of total profit while funding ${pct(gpCapitalShare)} of the equity. That is not automatically wrong — promote is compensation for sourcing and execution — but it is worth stating in those terms so investors can price it.`,
      evidence: {
        gpProfitShare: stack.waterfall.gpProfitShare,
        gpCapitalShare,
        lpIrr: stack.waterfall.lpIrr,
        gpIrr: stack.waterfall.gpIrr,
      },
      recommendation:
        "Disclose the LP-versus-GP IRR split alongside the headline deal IRR; LPs earn the LP number, not the deal number.",
    });
  }

  /* ── Returns ── */

  const firstHurdle = [...input.waterfall].sort((a, b) => a.irrHurdle - b.irrHurdle)[0];
  if (
    firstHurdle &&
    Number.isFinite(stack.waterfall.lpIrr) &&
    stack.waterfall.lpIrr < firstHurdle.irrHurdle
  ) {
    push({
      code: "BELOW_PREFERRED_RETURN",
      severity: "high",
      category: "returns",
      title: `LP IRR of ${pct(stack.waterfall.lpIrr)} falls short of the ${pct(firstHurdle.irrHurdle)} preferred return`,
      detail: `Even in the base case the limited partners do not earn their preferred return. Unpaid pref typically accrues and compounds, so the shortfall grows rather than resolves, and the sponsor earns no promote at all.`,
      evidence: {
        lpIrr: stack.waterfall.lpIrr,
        preferredReturn: firstHurdle.irrHurdle,
        equityMultiple: stack.returns.equityMultiple,
      },
      recommendation:
        "Reprice the equity or restructure the deal. A base case below the pref means the structure, not the market, is the problem.",
    });
  }

  if (stack.returns.equityMultiple < 1) {
    push({
      code: "CAPITAL_LOSS",
      severity: "critical",
      category: "returns",
      title: `Base case returns ${stack.returns.equityMultiple.toFixed(2)}x — a loss of capital`,
      detail: `Total distributions fall short of the equity invested. This is the base case, before any stress is applied.`,
      evidence: {
        equityMultiple: stack.returns.equityMultiple,
        leveredIrr: stack.returns.leveredIrr,
        commonEquity,
      },
      recommendation: "Do not proceed on these assumptions.",
    });
  }

  if (findings.length === 0) {
    push({
      code: "NO_MATERIAL_FINDINGS",
      severity: "info",
      category: "structure",
      title: "No material structural risks detected",
      detail:
        "The stack balances, coverage holds through the modelled stresses, and leverage sits within conventional bounds. That is a statement about the assumptions supplied, not a prediction.",
      evidence: {
        minDscr: stack.returns.minDscr,
        maxLtv: stack.returns.maxLtv,
        leveredIrr: stack.returns.leveredIrr,
      },
      recommendation:
        "Pressure-test the NOI growth and exit cap inputs themselves — they drive more of the outcome than the structure does.",
    });
  }

  /* ── Scoring ── */

  const countsBySeverity: Record<FindingSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of findings) countsBySeverity[f.severity]++;

  const deduction = findings.reduce((s, f) => s + SEVERITY_WEIGHT[f.severity], 0);
  const riskScore = Math.max(0, Math.min(100, 100 - deduction));

  const headlineSeverity = findings.reduce<FindingSeverity>(
    (worst, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[worst] ? f.severity : worst),
    "info",
  );

  findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  return { findings, riskScore, headlineSeverity, countsBySeverity };
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECIN CAPACITY FINDINGS
   ═══════════════════════════════════════════════════════════════════════════

   Rules over a borrower-side capacity result. These implement the cross-domain
   dependency signals: the value is not in any single ratio but in catching
   where two domains quietly depend on the same dollar or the same assumption.

   Every finding carries confidence, materiality, the reviewer who must sign
   off, and what would invalidate it — because a finding that reaches a client
   has to survive review, not just be true.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Reserves net of every job already assigned to them. Mirrors the engine's
 *  helper so the findings layer stays free of engine imports (no cycle). */
function netReserves(l: LiquidityProfile): { unallocated: number; earmarked: number } {
  const earmarked =
    (l.earmarkedVacancyReserve ?? 0) +
    (l.earmarkedBridgeInterestReserve ?? 0) +
    (l.earmarkedInsuranceReserve ?? 0) +
    (l.earmarkedRetirementBuffer ?? 0);
  return { unallocated: l.totalLiquidReserves - earmarked, earmarked };
}

export function generateCapacityFindings(
  input: RealEstateCapitalScenarioInput,
  result: RealEstateCapitalScenarioResult,
  policy: RealEstatePolicy,
): Finding[] {
  const findings: Finding[] = [];
  const push = (f: Finding) => findings.push(f);
  const portfolio = result.metrics.portfolioMetrics;

  /* ── 8.1 Liquidity collision ── */
  const { unallocated, earmarked } = netReserves(input.liquidity);
  if (unallocated < 0) {
    push({
      code: "LIQUIDITY_COLLISION",
      severity: "critical",
      category: "liquidity",
      title: `Reserves are committed ${money(Math.abs(unallocated))} beyond what exists`,
      detail: `The same cash balance is being counted for more than one job. Earmarks total ${money(earmarked)} against ${money(input.liquidity.totalLiquidReserves)} of actual liquid reserves. A vacancy reserve, a bridge interest reserve, an insurance reserve and a retirement buffer cannot all be the same dollars. Until this is resolved, no strategy here can be described as adequately reserved.`,
      evidence: {
        totalLiquidReserves: input.liquidity.totalLiquidReserves,
        totalEarmarked: earmarked,
        unallocatedDeficit: unallocated,
      },
      recommendation:
        "Re-state which reserve each balance actually funds, or raise liquidity to cover the overlap, before sizing any new debt.",
      confidence: 1,
      materiality: 1,
      affectedMetric: "reserveMonths",
      requiredReviewer: "advisor",
      invalidatedBy: "A corrected reserve schedule showing separate, non-overlapping balances.",
    });
  }

  /* ── Reserve runway ── */
  const worstReserve = result.options.reduce(
    (m, o) => Math.min(m, o.scenarios.severe.reserveMonths),
    Infinity,
  );
  if (Number.isFinite(worstReserve) && worstReserve < policy.targetReserveMonths) {
    push({
      code: "INSUFFICIENT_RESERVES",
      severity: worstReserve < policy.targetReserveMonths / 2 ? "high" : "medium",
      category: "liquidity",
      title: `Severe-case reserves fall to ${worstReserve.toFixed(1)} months`,
      detail: `Against a policy target of ${policy.targetReserveMonths} months, the severe scenario leaves ${worstReserve.toFixed(1)} months of runway. Reserve depletion, not a missed payment, is what usually ends a leveraged real estate plan — the payment is missed because the reserve ran out first.`,
      evidence: {
        severeReserveMonths: worstReserve,
        policyTargetMonths: policy.targetReserveMonths,
        unallocatedReserves: unallocated,
      },
      recommendation:
        "Size proceeds to preserve the target runway, or fund an explicit interest reserve from the loan itself.",
      confidence: 0.9,
      materiality: 0.9,
      affectedMetric: "reserveMonths",
      requiredReviewer: "advisor",
      invalidatedBy: "Additional verified liquid reserves, or reduced proceeds.",
    });
  }

  /* ── 8.2 Refinance dependence ── */
  const bridges = result.options.filter(
    (o) => o.category === "bridge" || o.category === "hard_money",
  );
  for (const b of bridges) {
    const readiness = b.exitAnalysis?.takeoutReadiness;
    if (!readiness) continue;
    if (readiness.score < 0.6) {
      push({
        code: "UNTESTED_BRIDGE_EXIT",
        severity: readiness.score < 0.3 ? "critical" : "high",
        category: "liquidity",
        title: `${b.label}: take-out readiness scores ${(readiness.score * 100).toFixed(0)}%`,
        detail: `This bridge is repaid by a refinance that has not been shown to work under its own tests. ${readiness.blockers.length > 0 ? `Blockers: ${readiness.blockers.join("; ")}.` : ""} A bridge is only as sound as its exit — the loan does not care that the property improved if no lender will refinance it at maturity.`,
        evidence: {
          takeoutScore: readiness.score,
          refinanceProceeds: readiness.refinanceProceeds,
          payoffAtExit: b.exitAnalysis?.payoffAtExit ?? 0,
          exitCoverage: b.exitAnalysis?.exitCoverage ?? 0,
          passesLtv: readiness.passesLtv,
          passesDscr: readiness.passesDscr,
        },
        recommendation:
          "Do not proceed on this structure until the permanent take-out is tested at stressed value, rent, rate and seasoning assumptions — or secure a forward commitment.",
        confidence: 0.85,
        materiality: 1,
        affectedMetric: "exitCoverage",
        requiredReviewer: "lender",
        invalidatedBy: "A take-out term sheet or a stabilized appraisal supporting the refinance.",
      });
    }
    const coverage = b.exitAnalysis?.exitCoverage;
    if (coverage !== undefined && Number.isFinite(coverage) && coverage < policy.minimumBridgeExitCoverage) {
      push({
        code: "EXIT_COVERAGE_BELOW_POLICY",
        severity: coverage < 1 ? "critical" : "high",
        category: "liquidity",
        title: `${b.label}: exit coverage of ${coverage.toFixed(2)}x`,
        detail:
          coverage < 1
            ? `Projected exit proceeds do not cover the payoff at maturity. The shortfall must be funded in cash or the loan defaults.`
            : `Exit coverage of ${coverage.toFixed(2)}x is below the ${policy.minimumBridgeExitCoverage}x policy floor, leaving little room for a soft sale or appraisal miss.`,
        evidence: {
          exitCoverage: coverage,
          policyMinimum: policy.minimumBridgeExitCoverage,
          payoffAtExit: b.exitAnalysis?.payoffAtExit ?? 0,
        },
        recommendation: "Reduce bridge proceeds or extend the exit runway before closing.",
        confidence: 0.85,
        materiality: 1,
        affectedMetric: "exitCoverage",
        requiredReviewer: "lender",
        invalidatedBy: "A higher verified after-repair value or a committed take-out.",
      });
    }
  }

  /* ── 8.3 Collateral contagion ── */
  if (portfolio.crossCollateralizedCount > 1) {
    push({
      code: "COLLATERAL_CONTAGION",
      severity: portfolio.crossCollateralizedCount > 2 ? "high" : "medium",
      category: "structure",
      title: `${portfolio.crossCollateralizedCount} properties exposed to a single default`,
      detail: `Cross-collateralization converts a problem at one property into a portfolio event. ${money(portfolio.crossCollateralExposureValue)} of asset value sits behind shared collateral, so a default triggered by one asset's vacancy can reach the others and any household goal they support.`,
      evidence: {
        crossCollateralizedCount: portfolio.crossCollateralizedCount,
        exposureValue: portfolio.crossCollateralExposureValue,
        portfolioValue: portfolio.totalValue,
      },
      recommendation:
        "Prefer single-asset financing where the rate difference is small; the release provisions are worth more than the spread.",
      confidence: 0.9,
      materiality: 0.8,
      affectedMetric: "crossCollateralExposureValue",
      requiredReviewer: "attorney",
      invalidatedBy: "Loan documents showing individual release provisions per property.",
    });
  }

  /* ── 8.4 Tax use-of-proceeds integrity ── */
  const hasEquityLine = input.debtOptions.some(
    (o) => o.category === "heloc" || o.category === "home_equity_loan",
  );
  if (hasEquityLine) {
    push({
      code: "TAX_USE_OF_PROCEEDS_INTEGRITY",
      severity: "medium",
      category: "structure",
      title: "Use-of-proceeds tracing required for equity-line interest",
      detail:
        "Interest deductibility follows what the money was SPENT on, not what secured it. Without a clean use-of-proceeds ledger per draw, the deduction is unsupportable — and commingling a single personal expense into an investment draw can taint the tracing for the whole balance. Borrowed principal is never income, and interest is never a credit.",
      evidence: {
        equityLineOptions: input.debtOptions.filter(
          (o) => o.category === "heloc" || o.category === "home_equity_loan",
        ).length,
      },
      recommendation:
        "Open a dedicated account per draw, record the use of every dollar, and have the CPA confirm the characterization before any deduction is modelled as a benefit.",
      confidence: 1,
      materiality: 0.7,
      affectedMetric: "taxFlags",
      requiredReviewer: "cpa",
      invalidatedBy: "A CPA-reviewed tracing ledger for each draw.",
    });
  }

  /* ── 8.7 Rate-hedge mismatch ── */
  const variableOptions = input.debtOptions.filter((o) => o.rateType !== "fixed");
  const longHold = (input.assumptions.exitMonths ?? 0) > 36 || input.assumptions.exitMonths === undefined;
  if (variableOptions.length > 0 && longHold) {
    push({
      code: "RATE_HEDGE_MISMATCH",
      severity: "high",
      category: "market",
      title: "Variable-rate debt funding a long-duration rental strategy",
      detail: `${variableOptions.length} of the options carry a variable or hybrid rate while the strategy has no defined short exit. The asset's income resets slowly through leases; the debt resets immediately. That mismatch is what turns a covered property into an uncovered one without anything happening to the building.`,
      evidence: {
        variableOptionCount: variableOptions.length,
        exitMonths: input.assumptions.exitMonths ?? 0,
        rateShockConservativeBps: policy.rateShockBpsConservative,
        rateShockSevereBps: policy.rateShockBpsSevere,
      },
      recommendation:
        "Price a rate cap or swap, or plan a fixed-rate take-out with a tested trigger — not an intention.",
      confidence: 0.8,
      materiality: 0.85,
      affectedMetric: "dscr",
      requiredReviewer: "advisor",
      invalidatedBy: "A purchased rate cap, a fixed-rate conversion option, or a defined near-term exit.",
    });
  }

  /* ── 8.8 Insurance / real-estate liquidity coupling ── */
  if ((input.liquidity.earmarkedInsuranceReserve ?? 0) > 0 && bridges.length > 0) {
    push({
      code: "INSURANCE_REAL_ESTATE_COUPLING",
      severity: "medium",
      category: "liquidity",
      title: "Policy servicing and bridge interest draw on the same liquidity",
      detail:
        "A policy-loan or premium-finance obligation and a bridge interest reserve are both being funded from one household balance sheet, and both depend on similar forward assumptions. Modelled separately they each look survivable; modelled together they can fail in the same month.",
      evidence: {
        insuranceReserve: input.liquidity.earmarkedInsuranceReserve ?? 0,
        bridgeReserve: input.liquidity.earmarkedBridgeInterestReserve ?? 0,
        totalLiquidReserves: input.liquidity.totalLiquidReserves,
      },
      recommendation:
        "Run the policy-loan lapse stress and the bridge interest stress on one timeline before committing to either.",
      confidence: 0.7,
      materiality: 0.75,
      affectedMetric: "reserveMonths",
      requiredReviewer: "insurance",
      invalidatedBy: "A combined liquidity schedule showing both obligations independently funded.",
    });
  }

  /* ── 8.9 Estate-plan collateral conflict ── */
  const earmarkedProperties = input.properties.filter((p) => p.earmarkedForSuccession);
  if (earmarkedProperties.length > 0) {
    push({
      code: "ESTATE_PLAN_COLLATERAL_CONFLICT",
      severity: "high",
      category: "structure",
      title: `${earmarkedProperties.length} succession-earmarked propert${earmarkedProperties.length === 1 ? "y" : "ies"} pledged as collateral`,
      detail:
        "Property allocated to heirs, held in trust, or committed to a succession plan is being encumbered. Lender transfer restrictions and due-on-sale provisions can directly obstruct the transfer the estate plan depends on, and the conflict typically surfaces at the worst possible moment.",
      evidence: {
        earmarkedCount: earmarkedProperties.length,
        propertyIds: earmarkedProperties.map((p) => p.id).join(", "),
        entityTypes: Array.from(new Set(earmarkedProperties.map((p) => p.ownershipType))).join(", "),
      },
      recommendation:
        "Have the estate attorney review transfer and due-on-sale provisions against the trust and succession documents before closing.",
      confidence: 0.85,
      materiality: 0.9,
      affectedMetric: "ownership",
      requiredReviewer: "attorney",
      invalidatedBy: "Lender consent to the planned transfer, or substitution of different collateral.",
    });
  }

  /* ── 8.10 Behavioral complexity threshold ── */
  const entityCount = new Set(input.properties.map((p) => p.ownershipType)).size;
  const lienCount = input.properties.reduce((s, p) => s + p.liens.length, 0);
  const maturityCount = new Set(input.debtOptions.map((o) => o.termMonths)).size;
  const complexityScore =
    entityCount + lienCount + maturityCount + input.debtOptions.length + variableOptions.length;
  if (complexityScore > 12) {
    push({
      code: "BEHAVIORAL_COMPLEXITY_THRESHOLD",
      severity: complexityScore > 20 ? "high" : "medium",
      category: "alignment",
      title: `Operational complexity score of ${complexityScore}`,
      detail: `This plan spans ${entityCount} ownership structure(s), ${lienCount} existing lien(s), ${input.debtOptions.length} proposed instrument(s) and ${maturityCount} distinct maturity date(s). A theoretically superior structure is inferior in practice if it exceeds what the household and advisor can actually administer — missed maturities and lapsed covenants are administration failures, not market failures.`,
      evidence: {
        complexityScore,
        entityCount,
        lienCount,
        instrumentCount: input.debtOptions.length,
        maturityCount,
        variableRateCount: variableOptions.length,
      },
      recommendation:
        "Consolidate where the economics are close, and put every maturity, reset and covenant date on a single monitored calendar.",
      confidence: 0.7,
      materiality: 0.6,
      affectedMetric: "complexity",
      requiredReviewer: "advisor",
      invalidatedBy: "Consolidation, or a documented administration process with calendared reviews.",
    });
  }

  /* ── Lender maximum versus prudent maximum ── */
  for (const o of result.options) {
    const gap = o.maximumCollateralCapacity - o.recommendedMaximumPrudentCapacity;
    if (o.maximumCollateralCapacity > 0 && gap / o.maximumCollateralCapacity > 0.25) {
      push({
        code: "LENDER_VS_PRUDENT_GAP",
        severity: "medium",
        category: "leverage",
        title: `${o.label}: prudent capacity is ${money(gap)} below the lender maximum`,
        detail: `A lender may advance up to ${money(o.maximumCollateralCapacity)} here, but only ${money(o.recommendedMaximumPrudentCapacity)} survives the conservative stress on coverage, portfolio leverage and reserves. The gap is not unused capacity — it is the margin that keeps the plan solvent when assumptions move.`,
        evidence: {
          lenderMaximum: o.maximumCollateralCapacity,
          prudentMaximum: o.recommendedMaximumPrudentCapacity,
          gap,
          bindingConstraint: o.bindingConstraint,
        },
        recommendation:
          "Size to the prudent figure. Borrowing to the lender maximum transfers the entire margin of safety to the lender.",
        confidence: 0.9,
        materiality: 0.8,
        affectedMetric: "recommendedMaximumPrudentCapacity",
        requiredReviewer: "advisor",
        invalidatedBy: "Policy thresholds revised by an authorized advisor, with the change recorded.",
      });
    }
  }

  /* ── Capacity shortfall against the request ── */
  const shortfall = result.summary.shortfallAgainstRequest;
  if (shortfall !== null && shortfall > 0) {
    push({
      code: "CAPACITY_SHORTFALL",
      severity: "high",
      category: "leverage",
      title: `Requested proceeds exceed prudent capacity by ${money(shortfall)}`,
      detail: `The client is seeking ${money(input.requestedProceeds ?? 0)} but only ${money(result.summary.recommendedMaximumPrudentCapacity)} survives the conservative stress. The binding constraint is ${result.summary.bindingConstraint.replace(/_/g, " ")}.`,
      evidence: {
        requested: input.requestedProceeds ?? 0,
        prudentCapacity: result.summary.recommendedMaximumPrudentCapacity,
        shortfall,
        bindingConstraint: result.summary.bindingConstraint,
      },
      recommendation:
        "Either reduce the raise, add collateral or income, or accept a structure whose binding constraint is different — attacking the wrong constraint moves nothing.",
      confidence: 0.95,
      materiality: 1,
      affectedMetric: "recommendedMaximumPrudentCapacity",
      requiredReviewer: "advisor",
      invalidatedBy: "Additional qualifying property, verified rent increases, or revised policy thresholds.",
    });
  }

  /* ── Stale valuation ── */
  const undated = input.properties.filter((p) => !p.valueAsOf);
  if (undated.length > 0) {
    push({
      code: "UNDATED_VALUATION",
      severity: "low",
      category: "market",
      title: `${undated.length} propert${undated.length === 1 ? "y has" : "ies have"} no valuation date`,
      detail:
        "Every capacity figure in this analysis scales directly off property value. A value with no date cannot be aged or challenged, and a stale value silently overstates capacity across every option shown.",
      evidence: { undatedCount: undated.length, propertyIds: undated.map((p) => p.id).join(", ") },
      recommendation: "Record the valuation date and source, and re-run before any commitment.",
      confidence: 1,
      materiality: 0.4,
      affectedMetric: "value",
      requiredReviewer: "advisor",
      invalidatedBy: "A dated appraisal, AVM, or broker opinion on file.",
    });
  }

  /* ── Scoring ── */
  findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  return findings;
}
