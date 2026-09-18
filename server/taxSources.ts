// ============================================================
// THE TAX AUTHORITY PANEL — the sources the tax optimisation schedule
// rests on, weighted by credentialing (statute and regulations above
// rulings above explanations above practitioner standards above
// commentary), track record and consistency, on the same panel machinery
// as the tax forecasters and the forgiveness authorities
// (server/forecastSources.ts). The claims are the 2026 parameters the
// catalogue uses, each a cited figure with its as-of date, so the same
// scoring and harvest paths can keep them current: when the 2027 revenue
// procedure lands, the council harvests it and the owner approves the new
// figures into the panel.
// ============================================================
import { type ClaimSeed, type SourceDef, registerPanel } from "./forecastSources";

export const TAX_SOURCES: SourceDef[] = [
  { id: "tax-irc", name: "Internal Revenue Code and Treasury Regulations", org: "United States Code (LII) / eCFR", url: "https://www.law.cornell.edu/uscode/text/26", horizonYears: 1, publishes: "The statute and the regulations that implement it", method: "Primary law", defaults: { evidence: 1, trackRecord: 0.5, consistency: 0.9 } },
  { id: "tax-irs-rp", name: "IRS revenue procedures, notices and rulings", org: "Internal Revenue Service", url: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf", horizonYears: 1, publishes: "Inflation-adjusted amounts, plan limits, procedural guidance", method: "Agency guidance", defaults: { evidence: 0.95, trackRecord: 0.5, consistency: 0.9 } },
  { id: "tax-congress", name: "Enacted law (One Big Beautiful Bill Act)", org: "Congress.gov", url: "https://www.congress.gov/bill/119th-congress/house-bill/1/text", horizonYears: 1, publishes: "Enrolled statutory text", method: "Primary law", defaults: { evidence: 1, trackRecord: 0.5, consistency: 0.9 } },
  { id: "tax-crs", name: "Tax Provisions in H.R. 1 (R48550)", org: "Congressional Research Service", url: "https://www.congress.gov/crs_external_products/R/PDF/R48550/R48550.2.pdf", horizonYears: 1, publishes: "Section-by-section explanation of the 2025 law", method: "Nonpartisan legislative analysis", defaults: { evidence: 0.85, trackRecord: 0.5, consistency: 0.8 } },
  { id: "tax-jct", name: "Joint Committee on Taxation", org: "U.S. Congress", url: "https://www.jct.gov/", horizonYears: 10, publishes: "Revenue estimates, technical explanations, the Blue Book", method: "Official congressional scorekeeper", defaults: { evidence: 0.85, trackRecord: 0.5, consistency: 0.8 } },
  { id: "tax-court", name: "United States Tax Court", org: "U.S. Tax Court", url: "https://www.ustaxcourt.gov/", horizonYears: 1, publishes: "Opinions on what the statute permits (captives, conservation easements, substance)", method: "Adjudication", defaults: { evidence: 1, trackRecord: 0.5, consistency: 0.8 } },
  { id: "tax-ssa", name: "Medicare premiums and IRMAA", org: "Social Security Administration", url: "https://www.ssa.gov/benefits/medicare/medicare-premiums.html", horizonYears: 1, publishes: "IRMAA thresholds and premiums by year", method: "Agency schedule", defaults: { evidence: 0.95, trackRecord: 0.5, consistency: 0.9 } },
  { id: "tax-aicpa", name: "The Tax Adviser and AICPA tax standards", org: "AICPA", url: "https://www.thetaxadviser.com/", horizonYears: 1, publishes: "Practitioner standards and analysis", method: "Professional body", defaults: { evidence: 0.7, trackRecord: 0.5, consistency: 0.7 } },
  { id: "tax-bloomberg", name: "Tax Management Portfolios", org: "Bloomberg Tax", url: "https://pro.bloombergtax.com/", horizonYears: 1, publishes: "Treatise-level analysis by topic", method: "Practitioner treatise", defaults: { evidence: 0.7, trackRecord: 0.5, consistency: 0.7 } },
  { id: "tax-checkpoint", name: "Checkpoint", org: "Thomson Reuters", url: "https://tax.thomsonreuters.com/", horizonYears: 1, publishes: "Analysis and state conformity tracking", method: "Practitioner research service", defaults: { evidence: 0.7, trackRecord: 0.5, consistency: 0.7 } },
  { id: "tax-kitces", name: "Kitces.com", org: "Nerd's Eye View", url: "https://www.kitces.com/", horizonYears: 1, publishes: "Planning analysis for advisers (Roth, IRMAA, insurance)", method: "Expert commentary", defaults: { evidence: 0.6, trackRecord: 0.5, consistency: 0.7 } },
  { id: "tax-foundation", name: "Tax Foundation", org: "Tax Foundation", url: "https://taxfoundation.org/", horizonYears: 10, publishes: "Analysis of enacted and proposed tax law; historical tables", method: "Policy analysis; published assumptions", defaults: { evidence: 0.6, trackRecord: 0.5, consistency: 0.6 } },
  { id: "tax-cbo", name: "Congressional Budget Office", org: "CBO", url: "https://www.cbo.gov/", horizonYears: 10, publishes: "Cost and distribution of tax provisions", method: "Nonpartisan scorekeeper", defaults: { evidence: 0.9, trackRecord: 0.5, consistency: 0.7 } },
];
registerPanel(TAX_SOURCES);

const RP2532 = "IRS Rev. Proc. 2025-32 (2026 inflation adjustments)";
const N2567 = "IRS Notice 2025-67 (2026 retirement plan limits)";
const OBBBA = "Pub. L. 119-21 (One Big Beautiful Bill Act), July 4, 2025";
const CRS = "CRS R48550, Tax Provisions in H.R. 1";
const seed = (sourceId: string, metric: string, value: number, unit: string, citation: string, note: string | null = null): ClaimSeed => ({ sourceId, metric, horizonYear: 2026, value: String(value), unit, baseValue: null, direction: 0, burdenMultiplier: null, asOf: "2025-11-01", citation, note });

/** The 2026 parameters as claims: measurements (direction 0) the catalogue reads; the harvest keeps them current. */
export const TAX_CLAIM_SEEDS: ClaimSeed[] = [
  seed("tax-irs-rp", "s179_limit_usd", 2_560_000, "$", RP2532), seed("tax-irs-rp", "s179_phaseout_start_usd", 4_090_000, "$", RP2532),
  seed("tax-irs-rp", "s831b_premium_limit_usd", 2_900_000, "$", RP2532, "Micro-captive premium ceiling for 2026"),
  seed("tax-irs-rp", "s461l_limit_single_usd", 256_000, "$", RP2532), seed("tax-irs-rp", "s461l_limit_joint_usd", 512_000, "$", RP2532),
  seed("tax-irs-rp", "s199a_threshold_joint_usd", 403_500, "$", RP2532), seed("tax-irs-rp", "s199a_threshold_single_usd", 201_775, "$", RP2532),
  seed("tax-irs-rp", "bracket_37_single_usd", 640_600, "$ taxable income", RP2532), seed("tax-irs-rp", "bracket_37_joint_usd", 768_700, "$ taxable income", RP2532),
  seed("tax-irs-rp", "standard_deduction_single_usd", 16_100, "$", "IRS, tax inflation adjustments for tax year 2026 (news release)"),
  { ...seed("tax-irs-rp", "hsa_family_usd", 8_750, "$", "IRS Rev. Proc. 2025-19"), asOf: "2025-05-01" }, { ...seed("tax-irs-rp", "hsa_self_usd", 4_400, "$", "IRS Rev. Proc. 2025-19"), asOf: "2025-05-01" },
  seed("tax-irs-rp", "s402g_deferral_usd", 24_500, "$", N2567), seed("tax-irs-rp", "s415c_additions_usd", 72_000, "$", N2567), seed("tax-irs-rp", "s415b_benefit_usd", 290_000, "$", N2567), seed("tax-irs-rp", "catchup_60_63_usd", 11_250, "$", N2567), seed("tax-irs-rp", "s401a17_comp_limit_usd", 360_000, "$", N2567),
  { ...seed("tax-congress", "bonus_depreciation_pct", 100, "%", `${OBBBA} §70301 (property acquired after Jan. 19, 2025; permanent)`), asOf: "2025-07-04" },
  { ...seed("tax-congress", "qsbs_per_issuer_cap_usd", 15_000_000, "$", `${OBBBA} §70431`), asOf: "2025-07-04" }, { ...seed("tax-congress", "qsbs_gross_assets_usd", 75_000_000, "$", `${OBBBA} §70431`), asOf: "2025-07-04" },
  { ...seed("tax-congress", "charitable_floor_pct_agi", 0.5, "% of contribution base", `${OBBBA} §70425, IRC §170(b)(1)(I)`), asOf: "2025-07-04" }, { ...seed("tax-congress", "itemized_value_cap_top_bracket_pct", 35, "cents per dollar", `${OBBBA} §70112, new IRC §68; ${CRS}`), asOf: "2025-07-04" },
  { ...seed("tax-congress", "salt_cap_usd", 40_400, "$", `${OBBBA}; IRS 2026 inflation adjustments`), asOf: "2025-11-01" },
  { ...seed("tax-congress", "estate_basic_exclusion_usd", 15_000_000, "$", `${OBBBA}; IRS IRB 2026-29`), asOf: "2025-07-04" }, { ...seed("tax-irs-rp", "annual_gift_exclusion_usd", 19_000, "$", "IRS IRB 2026-29"), asOf: "2025-11-01" },
  { ...seed("tax-crs", "oz_rural_stepup_pct", 30, "%", `${CRS}; ${OBBBA} §111102`), asOf: "2025-07-04" }, { ...seed("tax-crs", "s174a_small_business_receipts_usd", 31_000_000, "$", `${CRS}; ${OBBBA} §70302`), asOf: "2025-07-04" },
  { ...seed("tax-ssa", "irmaa_first_tier_single_usd", 109_000, "$ MAGI", "SSA, 2026 Medicare premiums"), asOf: "2025-11-01" }, { ...seed("tax-ssa", "irmaa_first_tier_joint_usd", 218_000, "$ MAGI", "SSA, 2026 Medicare premiums"), asOf: "2025-11-01" },
  { ...seed("tax-irs-rp", "captive_listed_loss_ratio_pct", 30, "%", "T.D. 10029 (Jan. 14, 2025), Treas. Reg. §1.6011-10"), asOf: "2025-01-14" }, { ...seed("tax-irs-rp", "captive_toi_loss_ratio_pct", 60, "%", "T.D. 10029, Treas. Reg. §1.6011-11"), asOf: "2025-01-14" },
];
