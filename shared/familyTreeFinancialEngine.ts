import { currentRules, TAX_RULES_2026 } from "./taxRules";
/**
 * SISTER INVENTION SI-014: Client Family Tree Financial Mapping
 * Patent Reference: Extends PAT-004 (Household Wealth Engine)
 * 
 * Maps multi-generational family financial relationships for
 * estate planning and wealth transfer optimization.
 */

export interface FamilyMember {
  id: string;
  name: string;
  relationship: "self" | "spouse" | "child" | "grandchild" | "parent" | "sibling" | "in-law" | "trust";
  age: number;
  income: number;
  netWorth: number;
  assets: { type: string; value: number; taxBasis: number }[];
  liabilities: number;
  taxBracket: number;
  hasLifeInsurance: boolean;
  lifeInsuranceDB: number;
  parentId: string | null;      // Links to parent in tree
  spouseId: string | null;
}

export interface WealthTransferPath {
  from: string;
  to: string;
  method: string;
  amount: number;
  taxCost: number;
  netTransfer: number;
  irsReference: string;
  efficiency: number;   // 0-100 (higher = more tax-efficient)
}

export interface GenerationSummary {
  generation: string;
  memberCount: number;
  totalNetWorth: number;
  totalIncome: number;
  totalInsurance: number;
  avgAge: number;
  wealthConcentration: number;  // % held by wealthiest member
}

export interface FamilyTreeResult {
  members: FamilyMember[];
  generations: GenerationSummary[];
  totalFamilyWealth: number;
  transferPaths: WealthTransferPath[];
  optimalTransferStrategy: string;
  totalTransferTaxSaved: number;
  estateTaxExposure: number;
  recommendations: string[];
}

/**
 * Analyze family financial tree and optimize wealth transfer
 */
export function analyzeFamilyTree(members: FamilyMember[]): FamilyTreeResult {
  // Group by generation
  const genMap: Record<string, FamilyMember[]> = {};
  members.forEach(m => {
    const gen = m.relationship === "grandchild" ? "Gen 3"
      : m.relationship === "child" ? "Gen 2"
      : m.relationship === "parent" ? "Gen 0"
      : "Gen 1";
    if (!genMap[gen]) genMap[gen] = [];
    genMap[gen].push(m);
  });

  const generations: GenerationSummary[] = Object.entries(genMap).map(([gen, mems]) => {
    const totalNW = mems.reduce((s, m) => s + m.netWorth, 0);
    const maxNW = Math.max(...mems.map(m => m.netWorth));
    return {
      generation: gen,
      memberCount: mems.length,
      totalNetWorth: totalNW,
      totalIncome: mems.reduce((s, m) => s + m.income, 0),
      totalInsurance: mems.reduce((s, m) => s + m.lifeInsuranceDB, 0),
      avgAge: Math.round(mems.reduce((s, m) => s + m.age, 0) / mems.length),
      wealthConcentration: totalNW > 0 ? Math.round((maxNW / totalNW) * 100) : 0,
    };
  });

  const totalWealth = members.reduce((s, m) => s + m.netWorth, 0);

  // Calculate transfer paths
  const transferPaths: WealthTransferPath[] = [];
  const primaryMembers = members.filter(m => m.relationship === "self" || m.relationship === "spouse");
  const children = members.filter(m => m.relationship === "child");
  const grandchildren = members.filter(m => m.relationship === "grandchild");

  primaryMembers.forEach(parent => {
    // Annual exclusion gifts to children
    children.forEach(child => {
      const giftAmount = currentRules().annualGiftExclusion; // versioned rule set (was a 2024 literal)
      transferPaths.push({
        from: parent.name,
        to: child.name,
        method: "Annual Exclusion Gift",
        amount: giftAmount,
        taxCost: 0,
        netTransfer: giftAmount,
        irsReference: `IRC §2503(b) — $${giftAmount.toLocaleString("en-US")} annual exclusion per donee (Rev. Proc. 2025-32 for 2026)`,
        efficiency: 100,
      });
    });

    // 529 superfunding to grandchildren
    grandchildren.forEach(gc => {
      // 5-year superfunding: five times the annual exclusion (IRC §529(c)(2)(B)); 5 × $19,000 = $95,000 in 2026
      // (Rev. Proc. 2025-32, shared/taxRules.ts). Was 90,000 (5 × the 2024 $18,000).
      const amount529 = 5 * currentRules().annualGiftExclusion;
      transferPaths.push({
        from: parent.name,
        to: gc.name,
        method: "529 Plan Superfunding",
        amount: amount529,
        taxCost: 0,
        netTransfer: amount529,
        irsReference: `IRC §529 — 5-year gift tax averaging ($${(currentRules().annualGiftExclusion / 1000).toFixed(0)}K × 5)`,
        efficiency: 100,
      });
    });

    // ILIT for estate tax elimination
    if (parent.hasLifeInsurance) {
      transferPaths.push({
        from: parent.name,
        to: "ILIT (Irrevocable Life Insurance Trust)",
        method: "ILIT Transfer",
        amount: parent.lifeInsuranceDB,
        taxCost: 0,
        netTransfer: parent.lifeInsuranceDB,
        irsReference: "IRC §2042 — Life insurance excluded from estate via ILIT",
        efficiency: 100,
      });
    }

    // SLAT for spouse
    const spouse = members.find(m => m.id === parent.spouseId);
    if (spouse && parent.netWorth > 5000000) {
      // Capped at the 2026 basic exclusion, $15,000,000 (Rev. Proc. 2025-32; P.L. 119-21 §70106), shared/taxRules.ts. Was 13,610,000 (2024).
      const slatAmount = Math.min(parent.netWorth * 0.3, TAX_RULES_2026.estateBasicExclusion);
      transferPaths.push({
        from: parent.name,
        to: `SLAT for ${spouse.name}`,
        method: "Spousal Lifetime Access Trust",
        amount: slatAmount,
        taxCost: 0,
        netTransfer: slatAmount,
        irsReference: "IRC §2511, §2523 — SLAT uses lifetime exemption while retaining indirect access",
        efficiency: 95,
      });
    }

    // GRAT for appreciated assets
    const appreciatedAssets = parent.assets.filter(a => a.value > a.taxBasis * 1.5);
    appreciatedAssets.forEach(asset => {
      transferPaths.push({
        from: parent.name,
        to: "GRAT (Grantor Retained Annuity Trust)",
        method: "Zeroed-Out GRAT",
        amount: asset.value,
        taxCost: 0,
        netTransfer: Math.round(asset.value * 0.3), // ~30% remainder passes tax-free
        irsReference: "IRC §2702 — GRAT transfers appreciation above §7520 rate tax-free",
        efficiency: 90,
      });
    });

    // Dynasty trust for grandchildren
    if (grandchildren.length > 0 && parent.netWorth > 10000000) {
      const dynastyAmount = Math.min(parent.netWorth * 0.15, 5000000);
      transferPaths.push({
        from: parent.name,
        to: "Dynasty Trust",
        method: "GST-Exempt Dynasty Trust",
        amount: dynastyAmount,
        taxCost: 0,
        netTransfer: dynastyAmount,
        irsReference: "IRC §2601-§2663 — GST exemption shields multi-generational transfers",
        efficiency: 98,
      });
    }
  });

  // Estate tax exposure
  // Federal basic exclusion amount, 2026: $15,000,000 per person (Rev. Proc. 2025-32; IRC §2010(c)(3) as amended by
  // P.L. 119-21 §70106), read from shared/taxRules.ts. Was 13,610,000, the 2024 figure (Rev. Proc. 2023-34).
  const federalExemption = TAX_RULES_2026.estateBasicExclusion;
  const primaryNW = primaryMembers.reduce((s, m) => s + m.netWorth, 0);
  const taxableEstate = Math.max(0, primaryNW - federalExemption * primaryMembers.length);
  const estateTaxExposure = Math.round(taxableEstate * 0.40);

  const totalTaxSaved = transferPaths.reduce((s, p) => s + (p.amount - p.netTransfer === 0 ? p.amount * 0.40 : 0), 0);

  const recommendations: string[] = [];
  if (estateTaxExposure > 0) {
    recommendations.push(`Estate tax exposure: $${estateTaxExposure.toLocaleString()} — implement ILIT and SLAT strategies immediately`);
  }
  if (children.length > 0 && !transferPaths.some(p => p.method.includes("Annual"))) {
    recommendations.push(`Start annual exclusion gifting program to children ($${(currentRules().annualGiftExclusion / 1000).toFixed(0)}K/child/year)`);
  }
  if (grandchildren.length > 0) {
    recommendations.push("Consider 529 superfunding for grandchildren ($90K per grandchild, tax-free)");
  }
  if (primaryMembers.some(m => m.netWorth > 20000000)) {
    recommendations.push("Explore GRAT strategies for highly appreciated assets");
  }
  recommendations.push("Review beneficiary designations on all retirement accounts and insurance policies");

  return {
    members,
    generations,
    totalFamilyWealth: Math.round(totalWealth),
    transferPaths,
    optimalTransferStrategy: transferPaths.length > 0
      ? `${transferPaths.length} transfer strategies identified, saving an estimated $${Math.round(totalTaxSaved).toLocaleString()} in transfer taxes`
      : "No transfer optimization needed at current wealth levels",
    totalTransferTaxSaved: Math.round(totalTaxSaved),
    estateTaxExposure,
    recommendations,
  };
}
