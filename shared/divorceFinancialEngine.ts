/**
 * SISTER INVENTION SI-012: Divorce Financial Impact Modeling
 * Patent Reference: Extends PAT-004 (Household Wealth Engine)
 * 
 * Models financial impact of divorce on insurance policies,
 * estate plans, and wealth distribution.
 */

import { ruleForState, divisionSentence, RULES_VERSION } from "./divorceStateRules";

export interface DivorceInput {
  totalMaritalAssets: number;
  totalMaritalDebt: number;
  spouse1Income: number;
  spouse2Income: number;
  yearsMarried: number;
  state: string;
  childrenCount: number;
  childrenAges: number[];
  lifeInsurancePolicies: { owner: string; insured: string; beneficiary: string; cashValue: number; deathBenefit: number }[];
  retirementAccounts: { owner: string; value: number; type: string }[];
  realEstate: { value: number; mortgage: number; equity: number }[];
  businessInterests: { owner: string; value: number }[];
}

export interface DivorceScenario {
  name: string;
  /** True only when the split is the regime's statutory starting point (community property → 50/50). Never true for a negotiated ratio. */
  statutory: boolean;
  /** Where the ratio comes from, in one sentence — the statute, or the fact that no statute produces it. */
  basis: string;
  spouse1Share: number;
  spouse2Share: number;
  childSupport: number;
  alimony: number;
  alimonyYears: number;
  taxImpact: number;
  insuranceChanges: string[];
  estateChanges: string[];
}

export interface DivorceResult {
  scenarios: DivorceScenario[];
  /** The state's division sentence from the rules table — regime, presumption, and what is NOT promised. */
  stateBasis: string;
  /** Version of shared/divorceStateRules.ts the result was computed against. */
  rulesVersion: string;
  /** What a reader must not conclude from these figures. Carried onto every result so no view can drop it. */
  neverPrinted: readonly string[];
  totalMaritalEstate: number;
  equitableSplit: number;
  insuranceRecommendations: string[];
  estateRecommendations: string[];
  childSupportEstimate: number;
  alimonyEstimate: number;
  qdroRequired: boolean;
  irsReferences: string[];
  urgentActions: string[];
}

/**
 * Model divorce financial impact
 */
export function modelDivorceImpact(input: DivorceInput): DivorceResult {
  const netEstate = input.totalMaritalAssets - input.totalMaritalDebt;
  const equitableSplit = netEstate / 2;

  // Community property vs equitable distribution — from the rules table, never a list typed here.
  const stateCode = String(input.state ?? "").trim().toUpperCase();
  const rule = ruleForState(stateCode);
  const isCommunityProperty = rule?.regime === "community";
  const stateBasis = rule
    ? divisionSentence(stateCode)
    : `No rule is on file for "${input.state}". Treated as equitable distribution with no presumed ratio; nothing below is statutory.`;
  const NOT_STATUTORY = "No state statute produces this ratio; it is a negotiated or illustrative division.";

  // Child support estimate (income shares model)
  const combinedIncome = input.spouse1Income + input.spouse2Income;
  const baseSupport = combinedIncome * (input.childrenCount === 1 ? 0.17 : input.childrenCount === 2 ? 0.25 : 0.29);
  const childSupport = Math.round(baseSupport * (input.spouse1Income / combinedIncome));

  // Alimony estimate
  const incomeGap = Math.abs(input.spouse1Income - input.spouse2Income);
  const alimonyYears = Math.min(Math.floor(input.yearsMarried / 3), 15);
  const alimony = Math.round(incomeGap * 0.30);

  // Scenarios
  const scenarios: DivorceScenario[] = [
    {
      name: isCommunityProperty ? "50/50 Community Property Split" : "Equitable Distribution (50/50) — ILLUSTRATIVE ONLY",
      statutory: isCommunityProperty,
      basis: isCommunityProperty
        ? `${rule!.name} is a community-property state: marital property divides equally by doctrine.`
        : `${rule ? rule.name : "This state"} divides property equitably with no statutory ratio; the even split is illustrative, not presumed. ${NOT_STATUTORY}`,
      spouse1Share: equitableSplit,
      spouse2Share: equitableSplit,
      childSupport,
      alimony,
      alimonyYears,
      taxImpact: Math.round(equitableSplit * 0.05),
      insuranceChanges: ["Update beneficiary designations on all policies", "Remove ex-spouse from group coverage"],
      estateChanges: ["Revoke existing will and create new one", "Update trust beneficiaries", "Remove ex-spouse as POA"],
    },
    {
      name: "Negotiated Settlement (60/40)",
      statutory: false,
      basis: NOT_STATUTORY,
      spouse1Share: Math.round(netEstate * 0.6),
      spouse2Share: Math.round(netEstate * 0.4),
      childSupport,
      alimony: Math.round(alimony * 0.8),
      alimonyYears: Math.max(1, alimonyYears - 2),
      taxImpact: Math.round(netEstate * 0.6 * 0.05),
      insuranceChanges: ["Negotiate life insurance as alimony security", "Transfer policy ownership via QDRO"],
      estateChanges: ["Create new estate plan immediately", "Establish children's trust"],
    },
    {
      name: "Mediated Settlement",
      statutory: false,
      basis: NOT_STATUTORY,
      spouse1Share: Math.round(netEstate * 0.55),
      spouse2Share: Math.round(netEstate * 0.45),
      childSupport: Math.round(childSupport * 0.9),
      alimony: Math.round(alimony * 0.7),
      alimonyYears: Math.max(1, alimonyYears - 3),
      taxImpact: Math.round(netEstate * 0.55 * 0.04),
      insuranceChanges: ["Maintain existing policies during mediation", "Agree on coverage requirements for children"],
      estateChanges: ["Temporary estate freeze during proceedings", "Update beneficiaries post-settlement"],
    },
  ];

  const qdroRequired = input.retirementAccounts.length > 0;

  const insuranceRecs: string[] = [
    "Immediately update beneficiary designations on ALL life insurance policies",
    "Consider ILIT to protect death benefit from ex-spouse claims",
    "Maintain adequate coverage for child support obligations",
    "Review health insurance options (COBRA, marketplace, employer)",
    "Consider term insurance to secure alimony obligations",
  ];

  const estateRecs: string[] = [
    "Execute new will within 30 days of divorce finalization",
    "Update all trust documents and beneficiary designations",
    "Remove ex-spouse from power of attorney and healthcare proxy",
    "Review and update retirement account beneficiaries (QDRO)",
    "Consider new IUL policy for estate replacement",
  ];

  const urgentActions: string[] = [
    "URGENT: Freeze joint accounts to prevent asset dissipation",
    "Document all marital assets and debts immediately",
    "Obtain QDRO for retirement account division",
    "Update beneficiary designations within 30 days",
    "Consult with divorce financial analyst (CDFA)",
  ];

  return {
    scenarios,
    stateBasis,
    rulesVersion: RULES_VERSION.version,
    neverPrinted: RULES_VERSION.neverPrinted,
    totalMaritalEstate: Math.round(netEstate),
    equitableSplit: Math.round(equitableSplit),
    insuranceRecommendations: insuranceRecs,
    estateRecommendations: estateRecs,
    childSupportEstimate: childSupport,
    alimonyEstimate: alimony,
    qdroRequired,
    irsReferences: [
      "IRC §71 — Alimony tax treatment (pre-2019 agreements)",
      "IRC §1041 — Tax-free transfers between spouses incident to divorce",
      "IRC §414(p) — Qualified Domestic Relations Order (QDRO)",
      "IRC §2516 — Gift tax treatment of property settlements",
      "IRC §121 — Home sale exclusion (may be affected by divorce)",
    ],
    urgentActions,
  };
}
