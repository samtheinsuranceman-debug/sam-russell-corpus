/**
 * SISTER INVENTION SI-006: Real-Time Tax Code Change Impact Simulator
 * Patent Reference: Extends PAT-007 (Tax Bracket Optimization)
 * 
 * Models proposed tax legislation impact on client portfolios
 * before laws are enacted.
 */

export interface TaxScenario {
  name: string;
  description: string;
  changes: TaxChange[];
  effectiveYear: number;
  sunsetYear: number | null;
  probability: number;  // 0-100% likelihood of enactment
}

export interface TaxChange {
  category: "income" | "capital_gains" | "estate" | "corporate" | "deduction" | "credit";
  description: string;
  currentValue: number;
  proposedValue: number;
  affectedBrackets: string[];
}

export interface ClientTaxProfile {
  annualIncome: number;
  capitalGains: number;
  estateValue: number;
  businessIncome: number;
  itemizedDeductions: number;
  charitableGiving: number;
  stateIncomeTax: number;
  propertyTax: number;
  mortgageInterest: number;
  dependents: number;
  filingStatus: "single" | "married_joint" | "married_separate" | "head_of_household";
  projectionYears: number;
}

export interface TaxImpactYear {
  year: number;
  currentLawTax: number;
  proposedLawTax: number;
  annualImpact: number;
  cumulativeImpact: number;
}

export interface ScenarioImpact {
  scenario: TaxScenario;
  yearlyImpact: TaxImpactYear[];
  totalImpact: number;
  avgAnnualImpact: number;
  mostImpactedArea: string;
  mitigationStrategies: string[];
}

export interface TaxSimulatorResult {
  scenarios: ScenarioImpact[];
  worstCaseImpact: number;
  bestCaseImpact: number;
  probabilityWeightedImpact: number;
  urgentActions: string[];
  irsReferences: string[];
}

// Pre-built tax scenarios based on current legislative proposals
const BUILT_IN_SCENARIOS: TaxScenario[] = [
  {
    name: "TCJA Sunset (2026)",
    description: "Tax Cuts and Jobs Act provisions expire, reverting to pre-2018 rates",
    changes: [
      { category: "income", description: "Top rate reverts 37% → 39.6%", currentValue: 0.37, proposedValue: 0.396, affectedBrackets: ["$578,126+"] },
      { category: "estate", description: "Estate exemption halved ~$13.6M → ~$7M", currentValue: 13610000, proposedValue: 7000000, affectedBrackets: ["All estates"] },
      { category: "deduction", description: "SALT deduction cap removed ($10K → unlimited)", currentValue: 10000, proposedValue: 999999, affectedBrackets: ["Itemizers"] },
      { category: "deduction", description: "Standard deduction reduced", currentValue: 29200, proposedValue: 24800, affectedBrackets: ["All filers"] },
    ],
    effectiveYear: 2026,
    sunsetYear: null,
    probability: 65,
  },
  {
    name: "Wealth Tax Proposal",
    description: "Annual tax on unrealized gains for ultra-high-net-worth individuals",
    changes: [
      { category: "capital_gains", description: "Unrealized gains tax on $100M+ net worth", currentValue: 0, proposedValue: 0.25, affectedBrackets: ["$100M+ net worth"] },
      { category: "capital_gains", description: "Capital gains rate increase to 39.6%", currentValue: 0.20, proposedValue: 0.396, affectedBrackets: ["$1M+ income"] },
    ],
    effectiveYear: 2027,
    sunsetYear: null,
    probability: 15,
  },
  {
    name: "Corporate Rate Increase",
    description: "Corporate tax rate increase from 21% to 28%",
    changes: [
      { category: "corporate", description: "Corporate rate 21% → 28%", currentValue: 0.21, proposedValue: 0.28, affectedBrackets: ["All C-Corps"] },
    ],
    effectiveYear: 2027,
    sunsetYear: null,
    probability: 25,
  },
  {
    name: "Carried Interest Reform",
    description: "Eliminate carried interest loophole for fund managers",
    changes: [
      { category: "capital_gains", description: "Carried interest taxed as ordinary income", currentValue: 0.20, proposedValue: 0.37, affectedBrackets: ["Fund managers"] },
    ],
    effectiveYear: 2026,
    sunsetYear: null,
    probability: 35,
  },
  {
    name: "Step-Up Basis Elimination",
    description: "Remove stepped-up basis at death for inherited assets",
    changes: [
      { category: "estate", description: "No step-up in basis at death (over $1M exemption)", currentValue: 1, proposedValue: 0, affectedBrackets: ["Inherited assets > $1M"] },
      { category: "capital_gains", description: "Heirs pay CG on full appreciation", currentValue: 0, proposedValue: 0.20, affectedBrackets: ["All heirs"] },
    ],
    effectiveYear: 2027,
    sunsetYear: null,
    probability: 20,
  },
];

export function getBuiltInScenarios(): TaxScenario[] {
  return [...BUILT_IN_SCENARIOS];
}

/**
 * Simulate tax code changes on client portfolio
 */
export function simulateTaxChanges(
  client: ClientTaxProfile,
  scenarios?: TaxScenario[]
): TaxSimulatorResult {
  const activeScenarios = scenarios ?? BUILT_IN_SCENARIOS;

  const results: ScenarioImpact[] = activeScenarios.map(scenario => {
    const yearlyImpact: TaxImpactYear[] = [];
    let cumulativeImpact = 0;
    let mostImpactedArea = "";
    let maxAreaImpact = 0;

    for (let y = 1; y <= client.projectionYears; y++) {
      const year = new Date().getFullYear() + y;
      const income = client.annualIncome * Math.pow(1.03, y);
      const cg = client.capitalGains * Math.pow(1.02, y);

      // Current law tax
      let currentTax = income * 0.37 + cg * 0.20;
      currentTax += Math.min(client.stateIncomeTax + client.propertyTax, 10000) * -0.37; // SALT cap benefit

      // Proposed law tax
      let proposedTax = currentTax;
      let inEffect = year >= scenario.effectiveYear && (!scenario.sunsetYear || year <= scenario.sunsetYear);

      if (inEffect) {
        scenario.changes.forEach(change => {
          let impact = 0;
          switch (change.category) {
            case "income":
              impact = income * (change.proposedValue - change.currentValue);
              break;
            case "capital_gains":
              impact = cg * (change.proposedValue - change.currentValue);
              break;
            case "estate":
              if (change.description.includes("exemption")) {
                const currentExposure = Math.max(0, client.estateValue - change.currentValue) * 0.40;
                const proposedExposure = Math.max(0, client.estateValue - change.proposedValue) * 0.40;
                impact = (proposedExposure - currentExposure) / client.projectionYears;
              }
              break;
            case "corporate":
              impact = client.businessIncome * (change.proposedValue - change.currentValue);
              break;
            case "deduction":
              if (change.description.includes("SALT")) {
                const currentSALT = Math.min(client.stateIncomeTax + client.propertyTax, change.currentValue);
                const proposedSALT = Math.min(client.stateIncomeTax + client.propertyTax, change.proposedValue);
                impact = -(proposedSALT - currentSALT) * 0.37; // Negative = savings
              }
              break;
          }
          proposedTax += impact;

          if (Math.abs(impact) > maxAreaImpact) {
            maxAreaImpact = Math.abs(impact);
            mostImpactedArea = change.category;
          }
        });
      }

      const annualImpact = proposedTax - currentTax;
      cumulativeImpact += annualImpact;

      yearlyImpact.push({
        year,
        currentLawTax: Math.round(currentTax),
        proposedLawTax: Math.round(proposedTax),
        annualImpact: Math.round(annualImpact),
        cumulativeImpact: Math.round(cumulativeImpact),
      });
    }

    const totalImpact = cumulativeImpact;
    const avgAnnual = totalImpact / client.projectionYears;

    // Mitigation strategies
    const mitigations: string[] = [];
    if (scenario.changes.some(c => c.category === "estate")) {
      mitigations.push("Accelerate lifetime gifting before exemption reduction");
      mitigations.push("Fund ILIT with IUL to replace estate tax exposure");
      mitigations.push("Establish SLAT/GRAT structures before sunset");
    }
    if (scenario.changes.some(c => c.category === "income")) {
      mitigations.push("Maximize Roth conversions at current lower rates");
      mitigations.push("Accelerate income into current tax year if rates increase");
      mitigations.push("Increase tax-deferred contributions (401k, defined benefit)");
    }
    if (scenario.changes.some(c => c.category === "capital_gains")) {
      mitigations.push("Harvest gains at current lower rates");
      mitigations.push("Use Opportunity Zone deferrals (IRC §1400Z-2)");
      mitigations.push("Shift to tax-free growth vehicles (IUL, municipal bonds)");
    }

    return {
      scenario,
      yearlyImpact,
      totalImpact: Math.round(totalImpact),
      avgAnnualImpact: Math.round(avgAnnual),
      mostImpactedArea,
      mitigationStrategies: mitigations,
    };
  });

  const worstCase = Math.max(...results.map(r => r.totalImpact));
  const bestCase = Math.min(...results.map(r => r.totalImpact));
  const probWeighted = results.reduce((s, r) => s + r.totalImpact * (r.scenario.probability / 100), 0);

  const urgentActions: string[] = [];
  const tcjaSunset = results.find(r => r.scenario.name.includes("TCJA"));
  if (tcjaSunset && tcjaSunset.totalImpact > 50000) {
    urgentActions.push(`URGENT: TCJA sunset could cost $${tcjaSunset.totalImpact.toLocaleString()} — act before 2026`);
  }
  if (client.estateValue > 7000000) {
    urgentActions.push("Estate exemption may halve in 2026 — complete gifting strategies NOW");
  }
  urgentActions.push("Schedule annual tax planning review to adapt to legislative changes");

  return {
    scenarios: results,
    worstCaseImpact: Math.round(worstCase),
    bestCaseImpact: Math.round(bestCase),
    probabilityWeightedImpact: Math.round(probWeighted),
    urgentActions,
    irsReferences: [
      "IRC §1 — Income tax rates and brackets",
      "IRC §1(h) — Capital gains rates",
      "IRC §2001 — Estate tax rates",
      "IRC §164(b)(6) — SALT deduction limitation",
      "IRC §2010(c) — Unified credit (estate exemption)",
      "P.L. 115-97 (TCJA) — Sunset provisions",
    ],
  };
}
