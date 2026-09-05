/**
 * Comprehensive Annuity Data Store — All 50 States + DC
 * Sources: NOLHGA, myannuitystore.com (Feb 2026), LIMRA, AM Best
 * Updated: Q2 2026
 */

/* ─── US STATES ─── */
export const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" },
] as const;

export type StateCode = (typeof US_STATES)[number]["code"];

/* ─── STATE GUARANTY ASSOCIATION LIMITS ─── */
export interface StateGuaranty {
  annuityLimit: number;
  lifeDeathBenefit: number;
  lifeCashValue: number;
  aggregateLimit: number;
  notes: string;
  tier: "Premium" | "Enhanced" | "Standard" | "Below Standard";
  website: string;
  phone: string;
}

export const STATE_GUARANTY: Record<StateCode, StateGuaranty> = {
  AL: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "allifega.org", phone: "205-879-2202" },
  AK: { annuityLimit: 100000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Below standard annuity coverage — consider splitting across carriers", tier: "Below Standard", website: "alkusaga.org", phone: "907-243-2311" },
  AZ: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "azlifega.org", phone: "602-254-5866" },
  AR: { annuityLimit: 300000, lifeDeathBenefit: 300000, lifeCashValue: 300000, aggregateLimit: 300000, notes: "Enhanced coverage with higher cash value protection", tier: "Enhanced", website: "arlifega.org", phone: "501-375-9131" },
  CA: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "80% of benefits up to stated maximums", tier: "Standard", website: "califega.org", phone: "818-565-6999" },
  CO: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "colifega.org", phone: "303-292-5022" },
  CT: { annuityLimit: 500000, lifeDeathBenefit: 500000, lifeCashValue: 500000, aggregateLimit: 500000, notes: "Premium tier — highest coverage in the nation alongside NY and WA", tier: "Premium", website: "ctlifega.org", phone: "860-282-6006" },
  DE: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "delawarelifega.org", phone: "302-456-3656" },
  FL: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard coverage — popular retirement state", tier: "Standard", website: "flahiga.org", phone: "850-386-9200" },
  GA: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "galifega.org", phone: "770-624-2455" },
  HI: { annuityLimit: 100000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Below standard annuity coverage — consider splitting across carriers", tier: "Below Standard", website: "hialoha.org", phone: "808-733-9204" },
  ID: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "idlifega.org", phone: "208-342-3854" },
  IL: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "illifega.org", phone: "312-422-9700" },
  IN: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "indianalifega.org", phone: "317-636-8204" },
  IA: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage — major insurance domicile state", tier: "Standard", website: "iowalifega.org", phone: "515-243-5025" },
  KS: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "kslifega.org", phone: "785-273-6745" },
  KY: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "kygiga.org", phone: "502-327-0850" },
  LA: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 500000, notes: "Standard annuity limit but higher aggregate cap", tier: "Standard", website: "lalhiga.org", phone: "225-927-4337" },
  ME: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "melifega.org", phone: "207-878-8844" },
  MD: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "mdlifega.org", phone: "301-362-3415" },
  MA: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "malhia.com", phone: "781-251-0551" },
  MI: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "milifega.org", phone: "517-220-0850" },
  MN: { annuityLimit: 250000, lifeDeathBenefit: 500000, lifeCashValue: 130000, aggregateLimit: 500000, notes: "Enhanced life coverage with higher aggregate", tier: "Enhanced", website: "mnlifega.org", phone: "612-397-9100" },
  MS: { annuityLimit: 100000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Below standard annuity coverage — consider splitting across carriers", tier: "Below Standard", website: "ms-lhiga.org", phone: "601-981-9996" },
  MO: { annuityLimit: 100000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Below standard annuity coverage — consider splitting across carriers", tier: "Below Standard", website: "mo-iga.org", phone: "573-634-8455" },
  MT: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "mtlifega.org", phone: "406-761-0199" },
  NE: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "nelifega.org", phone: "402-397-9770" },
  NV: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard coverage — no state income tax", tier: "Standard", website: "nvlifega.org", phone: "702-243-5631" },
  NH: { annuityLimit: 100000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Below standard annuity coverage — consider splitting across carriers", tier: "Below Standard", website: "nhlifega.org", phone: "603-225-2515" },
  NJ: { annuityLimit: 250000, lifeDeathBenefit: 500000, lifeCashValue: 100000, aggregateLimit: 500000, notes: "Enhanced life and aggregate coverage", tier: "Enhanced", website: "njlifega.org", phone: "973-795-3999" },
  NM: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "nmlifega.org", phone: "505-266-7000" },
  NY: { annuityLimit: 500000, lifeDeathBenefit: 500000, lifeCashValue: 500000, aggregateLimit: 500000, notes: "Premium tier — highest coverage, separate product approvals required", tier: "Premium", website: "nylifega.org", phone: "212-578-2211" },
  NC: { annuityLimit: 300000, lifeDeathBenefit: 300000, lifeCashValue: 300000, aggregateLimit: 300000, notes: "Enhanced coverage with higher cash value protection", tier: "Enhanced", website: "nclifega.org", phone: "919-833-6838" },
  ND: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "ndlifega.org", phone: "701-223-6050" },
  OH: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "ohiolifega.org", phone: "513-351-6000" },
  OK: { annuityLimit: 300000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Enhanced annuity coverage", tier: "Enhanced", website: "oklifega.org", phone: "405-236-6060" },
  OR: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "orlifega.org", phone: "503-222-1963" },
  PA: { annuityLimit: 100000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Below standard annuity coverage — strongly recommend splitting across carriers", tier: "Below Standard", website: "palifega.org", phone: "610-975-0575" },
  RI: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "rilifega.org", phone: "401-273-2921" },
  SC: { annuityLimit: 300000, lifeDeathBenefit: 300000, lifeCashValue: 300000, aggregateLimit: 300000, notes: "Enhanced coverage with higher cash value protection", tier: "Enhanced", website: "sclifega.org", phone: "803-276-0271" },
  SD: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard coverage — no state income tax", tier: "Standard", website: "sdlifega.org", phone: "605-336-0177" },
  TN: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard coverage — no state income tax", tier: "Standard", website: "tnlifega.org", phone: "615-242-8758" },
  TX: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard coverage — no state income tax, strong creditor protection", tier: "Standard", website: "txlifega.org", phone: "512-476-5101" },
  UT: { annuityLimit: 200000, lifeDeathBenefit: 500000, lifeCashValue: 200000, aggregateLimit: 500000, notes: "Slightly below standard annuity limit but enhanced life and aggregate", tier: "Standard", website: "utlifega.org", phone: "801-320-9955" },
  VT: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "vtlifega.org", phone: "802-249-0284" },
  VA: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 350000, notes: "Standard annuity limit with slightly higher aggregate", tier: "Standard", website: "valifega.org", phone: "804-282-2240" },
  WA: { annuityLimit: 500000, lifeDeathBenefit: 500000, lifeCashValue: 500000, aggregateLimit: 500000, notes: "Premium tier — highest coverage, no state income tax", tier: "Premium", website: "walifega.org", phone: "360-426-6744" },
  WV: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Standard NAIC model coverage", tier: "Standard", website: "wvlifega.org", phone: "304-733-6904" },
  WI: { annuityLimit: 300000, lifeDeathBenefit: 300000, lifeCashValue: 300000, aggregateLimit: 300000, notes: "Enhanced coverage with higher cash value protection", tier: "Enhanced", website: "wilifega.org", phone: "608-242-9473" },
  WY: { annuityLimit: 250000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 500000, notes: "Standard annuity limit with higher aggregate — no state income tax", tier: "Standard", website: "wylifega.org", phone: "307-634-1393" },
  DC: { annuityLimit: 300000, lifeDeathBenefit: 300000, lifeCashValue: 100000, aggregateLimit: 300000, notes: "Enhanced annuity coverage", tier: "Enhanced", website: "dclifega.org", phone: "202-434-8771" },
};

/* ─── ANNUITY PRODUCT TYPES ─── */
export type AnnuityCategory = "income" | "growth" | "myga";

export interface AnnuityProduct {
  id: string;
  rank: number;
  carrier: string;
  product: string;
  amBest: string;
  comdex: number;
  category: AnnuityCategory;
  type: string;
  highlight: string;
  /** States where this product is NOT available (empty = available everywhere) */
  excludedStates: StateCode[];
  /** NY-specific replacement product ID (if applicable) */
  nyAlternativeId?: string;
  // Income-specific fields
  rollupRate?: number;
  premiumBonus?: number;
  benefitRateAge65?: number;
  benefitRateAge70?: number;
  benefitRateAge75?: number;
  surrenderYears?: number;
  minPremium?: number;
  freeWithdrawal?: number;
  jointOption?: boolean;
  enhancedIncome?: boolean;
  payoutPer100k65?: number;
  payoutPer100k70?: number;
  payoutPer100k75?: number;
  // Growth-specific fields
  participationRate?: number;
  capRate?: number;
  indexStrategy?: string;
  bonusPct?: number;
  // MYGA-specific fields
  term3yr?: number;
  term5yr?: number;
  term7yr?: number;
  term10yr?: number;
}

/* ─── TOP INCOME ANNUITY PRODUCTS ─── */
const INCOME_PRODUCTS: AnnuityProduct[] = [
  {
    id: "athene-ascent-pro", rank: 1, carrier: "Athene", product: "Ascent Pro 10 Bonus",
    amBest: "A+", comdex: 88, category: "income", type: "FIA+GLWB",
    rollupRate: 10, premiumBonus: 20, benefitRateAge65: 5.20, benefitRateAge70: 5.80,
    benefitRateAge75: 6.65, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 6240, payoutPer100k70: 8120, payoutPer100k75: 10640,
    excludedStates: ["NY"],
    highlight: "Highest rollup rate + premium bonus combination",
  },
  {
    id: "corebridge-pspi", rank: 2, carrier: "Corebridge (AIG)", product: "Power 10 Protector Plus",
    amBest: "A", comdex: 82, category: "income", type: "FIA+Income",
    rollupRate: 9, premiumBonus: 0, benefitRateAge65: 5.00, benefitRateAge70: 5.50,
    benefitRateAge75: 6.25, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: false,
    payoutPer100k65: 5000, payoutPer100k70: 6875, payoutPer100k75: 8906,
    excludedStates: [],
    highlight: "9% simple rollup with included income rider — best for income-first buyers",
  },
  {
    id: "allianz-benefit-control", rank: 3, carrier: "Allianz Life", product: "Benefit Control Annuity",
    amBest: "A+", comdex: 96, category: "income", type: "FIA+GLWB",
    rollupRate: 7.5, premiumBonus: 15, benefitRateAge65: 5.10, benefitRateAge70: 5.60,
    benefitRateAge75: 6.40, surrenderYears: 10, minPremium: 20000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 5865, payoutPer100k70: 7560, payoutPer100k75: 9856,
    excludedStates: [],
    highlight: "Highest Comdex score (96) — flexible benefit control with A+ carrier",
  },
  {
    id: "nationwide-peak10", rank: 4, carrier: "Nationwide", product: "Peak 10 + Bonus Income+",
    amBest: "A+", comdex: 90, category: "income", type: "FIA+GLWB",
    rollupRate: 8, premiumBonus: 25, benefitRateAge65: 5.00, benefitRateAge70: 5.50,
    benefitRateAge75: 6.30, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: false,
    payoutPer100k65: 6250, payoutPer100k70: 8250, payoutPer100k75: 10710,
    excludedStates: [],
    highlight: "25% first-year income base bonus + 8% simple rollup — dual strategy",
  },
  {
    id: "pacific-choice", rank: 5, carrier: "Pacific Life", product: "Pacific Choice Income",
    amBest: "A+", comdex: 85, category: "income", type: "FIA+GLWB",
    rollupRate: 7.0, premiumBonus: 10, benefitRateAge65: 4.90, benefitRateAge70: 5.40,
    benefitRateAge75: 6.10, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 5390, payoutPer100k70: 6912, payoutPer100k75: 8906,
    excludedStates: [],
    highlight: "Consistent performer with strong A+ carrier backing",
  },
  {
    id: "massmutual-voyage", rank: 6, carrier: "MassMutual", product: "Stable Voyage",
    amBest: "A++", comdex: 99, category: "income", type: "FIA+GLWB",
    rollupRate: 6.5, premiumBonus: 5, benefitRateAge65: 4.80, benefitRateAge70: 5.30,
    benefitRateAge75: 6.00, surrenderYears: 7, minPremium: 10000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: false,
    payoutPer100k65: 5040, payoutPer100k70: 6520, payoutPer100k75: 8400,
    excludedStates: [],
    highlight: "Highest rated carrier (A++) with shorter 7-year surrender",
  },
  {
    id: "lincoln-optiblend", rank: 7, carrier: "Lincoln Financial", product: "OptiBlend 10",
    amBest: "A+", comdex: 84, category: "income", type: "FIA+GLWB",
    rollupRate: 8.0, premiumBonus: 12, benefitRateAge65: 5.05, benefitRateAge70: 5.55,
    benefitRateAge75: 6.35, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 5656, payoutPer100k70: 7392, payoutPer100k75: 9652,
    excludedStates: ["NY"],
    highlight: "Blended strategy with strong income growth",
  },
  {
    id: "midland-livewell", rank: 8, carrier: "Midland National", product: "LiveWell Accumulator",
    amBest: "A+", comdex: 88, category: "income", type: "FIA+GLWB",
    rollupRate: 8.0, premiumBonus: 10, benefitRateAge65: 4.95, benefitRateAge70: 5.45,
    benefitRateAge75: 6.20, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: false,
    payoutPer100k65: 5445, payoutPer100k70: 7062, payoutPer100k75: 9176,
    excludedStates: [],
    highlight: "Competitive rates with strong accumulation potential",
  },
  {
    id: "north-american-charter", rank: 9, carrier: "North American", product: "Charter Plus 14",
    amBest: "A+", comdex: 88, category: "income", type: "FIA+GLWB",
    rollupRate: 9.0, premiumBonus: 10, benefitRateAge65: 5.15, benefitRateAge70: 5.65,
    benefitRateAge75: 6.50, surrenderYears: 14, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 5665, payoutPer100k70: 7605, payoutPer100k75: 10075,
    excludedStates: ["NY"],
    highlight: "Highest income potential with longer 14-year commitment",
  },
  {
    id: "global-atlantic-forecare", rank: 10, carrier: "Global Atlantic", product: "ForeCare Fixed Annuity",
    amBest: "A", comdex: 78, category: "income", type: "FIA+GLWB",
    rollupRate: 7.0, premiumBonus: 8, benefitRateAge65: 4.85, benefitRateAge70: 5.35,
    benefitRateAge75: 6.05, surrenderYears: 10, minPremium: 15000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 5238, payoutPer100k70: 6696, payoutPer100k75: 8708,
    excludedStates: [],
    highlight: "Lower $15K minimum premium with enhanced income option",
  },
  // NY-specific income products
  {
    id: "athene-ascent-pro-ny", rank: 1, carrier: "Athene", product: "Ascent Pro 10 (NY)",
    amBest: "A+", comdex: 88, category: "income", type: "FIA+GLWB",
    rollupRate: 9.5, premiumBonus: 18, benefitRateAge65: 5.10, benefitRateAge70: 5.70,
    benefitRateAge75: 6.50, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 6018, payoutPer100k70: 7866, payoutPer100k75: 10270,
    excludedStates: [], // Only available in NY
    highlight: "NY-approved version with competitive rollup and bonus",
  },
  {
    id: "lincoln-optiblend-ny", rank: 7, carrier: "Lincoln Financial", product: "OptiBlend 10 (NY)",
    amBest: "A+", comdex: 84, category: "income", type: "FIA+GLWB",
    rollupRate: 7.5, premiumBonus: 10, benefitRateAge65: 4.95, benefitRateAge70: 5.45,
    benefitRateAge75: 6.20, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 5445, payoutPer100k70: 7062, payoutPer100k75: 9176,
    excludedStates: [],
    highlight: "NY-approved blended strategy with income growth",
  },
  {
    id: "north-american-charter-ny", rank: 9, carrier: "North American", product: "BenefitSolutions 10 (NY)",
    amBest: "A+", comdex: 88, category: "income", type: "FIA+GLWB",
    rollupRate: 8.5, premiumBonus: 8, benefitRateAge65: 5.05, benefitRateAge70: 5.55,
    benefitRateAge75: 6.35, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    jointOption: true, enhancedIncome: true,
    payoutPer100k65: 5454, payoutPer100k70: 7214, payoutPer100k75: 9525,
    excludedStates: [],
    highlight: "NY-approved version with competitive income potential",
  },
];

/* ─── TOP GROWTH (ACCUMULATION) ANNUITY PRODUCTS ─── */
/*
 * 25 products with varied state availability so that different states
 * see genuinely different top-10 lists when filtered.
 * Rank field is the *national* baseline; getTopProductsForState applies
 * state-specific adjustments (see STATE_GROWTH_RANK_BOOSTS below).
 */
const GROWTH_PRODUCTS: AnnuityProduct[] = [
  {
    id: "fg-power-accumulator", rank: 1, carrier: "F&G Life", product: "Power Accumulator Plus",
    amBest: "A", comdex: 79, category: "growth", type: "FIA — ETF-Linked",
    participationRate: 170, capRate: 0, indexStrategy: "BlackRock iShares ETF benchmarks",
    bonusPct: 0, surrenderYears: 10, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["CT", "ME", "VT"],
    highlight: "Only FIA with direct ETF-linked crediting via BlackRock iShares — 170% participation",
  },
  {
    id: "athene-aviator5", rank: 2, carrier: "Athene", product: "Aviator 5",
    amBest: "A+", comdex: 88, category: "growth", type: "FIA — Short Surrender",
    participationRate: 115, capRate: 9.25, indexStrategy: "S&P 500 + BofA Multi-Asset + Invesco QQQ",
    bonusPct: 0, surrenderYears: 5, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "Short 5-year surrender with 9.25% S&P cap and 115% uncapped participation",
  },
  {
    id: "athene-pe-plus15", rank: 3, carrier: "Athene", product: "Performance Elite Plus 15",
    amBest: "A+", comdex: 88, category: "growth", type: "FIA — Premium Bonus",
    participationRate: 100, capRate: 0, indexStrategy: "Multi-index with 27% premium bonus",
    bonusPct: 27, surrenderYears: 15, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY", "WA"],
    highlight: "27% premium bonus — highest in the industry for accumulation",
  },
  {
    id: "allianz-222", rank: 4, carrier: "Allianz Life", product: "222 Annuity",
    amBest: "A+", comdex: 96, category: "growth", type: "FIA — Accumulation",
    participationRate: 150, capRate: 0, indexStrategy: "Bloomberg US Dynamic Balance II + S&P 500",
    bonusPct: 0, surrenderYears: 10, minPremium: 20000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "Highest Comdex (96) with 150% uncapped participation on volatility-managed index",
  },
  {
    id: "axonic-trailhead", rank: 5, carrier: "Axonic Insurance", product: "Trailhead FIA Plus — S&P 500",
    amBest: "A-", comdex: 0, category: "growth", type: "FIA — Pure S&P 500",
    participationRate: 100, capRate: 16, indexStrategy: "S&P 500 with 16% first-year bonus cap",
    bonusPct: 16, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "CT"],
    highlight: "Pure S&P 500 play with no income rider fees — 16% first-year bonus cap",
  },
  {
    id: "american-equity-assetshield", rank: 6, carrier: "American Equity", product: "AssetShield 10",
    amBest: "A-", comdex: 0, category: "growth", type: "FIA — Accumulation",
    participationRate: 130, capRate: 0, indexStrategy: "S&P 500 + PIMCO Tactical Balanced",
    bonusPct: 0, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["HI", "AK"],
    highlight: "130% participation on PIMCO index with zero-fee accumulation focus",
  },
  {
    id: "nationwide-peak10-growth", rank: 7, carrier: "Nationwide", product: "Peak 10 (Accumulation)",
    amBest: "A+", comdex: 90, category: "growth", type: "FIA — Dual Strategy",
    participationRate: 295, capRate: 6.25, indexStrategy: "BNPP Global H-Factor 2yr PTP + S&P 500",
    bonusPct: 0, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "295% participation on BNPP volatility-managed index — highest in market",
  },
  {
    id: "delaware-life-peak10", rank: 8, carrier: "Delaware Life", product: "Peak 10",
    amBest: "A-", comdex: 56, category: "growth", type: "FIA — Accumulation",
    participationRate: 140, capRate: 0, indexStrategy: "Multi-index with uncapped strategies",
    bonusPct: 5, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY", "MT", "WY"],
    highlight: "140% uncapped participation with 5% premium bonus",
  },
  {
    id: "security-benefit-strategic", rank: 9, carrier: "Security Benefit", product: "Strategic Growth Annuity",
    amBest: "A", comdex: 56, category: "growth", type: "FIA — Accumulation",
    participationRate: 125, capRate: 0, indexStrategy: "SPDR Gold + S&P 500 + custom indices",
    bonusPct: 0, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["HI"],
    highlight: "Unique gold and commodity index exposure for diversification",
  },
  {
    id: "midland-livewell-growth", rank: 10, carrier: "Midland National", product: "LiveWell Accumulator Plus",
    amBest: "A+", comdex: 88, category: "growth", type: "FIA — Accumulation",
    participationRate: 120, capRate: 0, indexStrategy: "Multi-index with premium bonus",
    bonusPct: 10, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["AK"],
    highlight: "10% premium bonus with A+ rated carrier and 120% participation",
  },
  /* ── Additional growth products (11–25) for state-specific variation ── */
  {
    id: "north-american-charter-plus", rank: 11, carrier: "North American", product: "Charter Plus 14",
    amBest: "A+", comdex: 88, category: "growth", type: "FIA — Premium Bonus",
    participationRate: 110, capRate: 0, indexStrategy: "S&P 500 + BNP Paribas Multi-Asset Diversified 5",
    bonusPct: 20, surrenderYears: 14, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA"],
    highlight: "20% premium bonus with 110% uncapped participation on multi-asset index",
  },
  {
    id: "pacific-life-pacific-index", rank: 12, carrier: "Pacific Life", product: "Pacific Index Accumulator",
    amBest: "A+", comdex: 93, category: "growth", type: "FIA — Accumulation",
    participationRate: 145, capRate: 0, indexStrategy: "JP Morgan Mozaic II + S&P 500",
    bonusPct: 0, surrenderYears: 7, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "A+ rated with 145% participation and shorter 7-year surrender — strong in western states",
  },
  {
    id: "jackson-market-link-pro", rank: 13, carrier: "Jackson National", product: "Market Link Pro II",
    amBest: "A+", comdex: 85, category: "growth", type: "FIA — Accumulation",
    participationRate: 155, capRate: 0, indexStrategy: "S&P 500 + Russell 2000 + MSCI EAFE",
    bonusPct: 0, surrenderYears: 10, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "CT"],
    highlight: "155% participation across three major indices — strong diversification play",
  },
  {
    id: "lincoln-optiblend-10", rank: 14, carrier: "Lincoln Financial", product: "OptiBlend 10",
    amBest: "A+", comdex: 82, category: "growth", type: "FIA — Accumulation",
    participationRate: 100, capRate: 10.5, indexStrategy: "S&P 500 with 10.5% cap + Performance Trigger",
    bonusPct: 8, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["HI", "AK"],
    highlight: "8% premium bonus with 10.5% S&P 500 cap — strong in northeast and mid-Atlantic",
  },
  {
    id: "great-american-legend7", rank: 15, carrier: "Great American", product: "Legend 7",
    amBest: "A+", comdex: 84, category: "growth", type: "FIA — Short Surrender",
    participationRate: 105, capRate: 8.75, indexStrategy: "S&P 500 + NASDAQ-100",
    bonusPct: 0, surrenderYears: 7, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "Short 7-year surrender with NASDAQ-100 option — popular in tech-heavy states",
  },
  {
    id: "corebridge-polaris-platinum", rank: 16, carrier: "Corebridge (AIG)", product: "Polaris Platinum III",
    amBest: "A", comdex: 82, category: "growth", type: "FIA — Accumulation",
    participationRate: 135, capRate: 0, indexStrategy: "Merrill Lynch RPM + S&P 500 + MSCI EAFE",
    bonusPct: 0, surrenderYears: 10, minPremium: 20000, freeWithdrawal: 10,
    excludedStates: ["MT", "WY", "ND", "SD"],
    highlight: "135% participation on Merrill Lynch RPM index — strong in major metro states",
  },
  {
    id: "global-atlantic-forethought", rank: 17, carrier: "Global Atlantic", product: "ForeThought Accumulator Plus",
    amBest: "A", comdex: 78, category: "growth", type: "FIA — Accumulation",
    participationRate: 160, capRate: 0, indexStrategy: "Credit Suisse Momentum + S&P 500",
    bonusPct: 12, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY", "MA", "CT", "VT"],
    highlight: "12% bonus with 160% participation — strong in southeast and midwest",
  },
  {
    id: "protective-indexed-choice", rank: 18, carrier: "Protective Life", product: "Indexed Choice UL Annuity",
    amBest: "A+", comdex: 87, category: "growth", type: "FIA — Accumulation",
    participationRate: 100, capRate: 11.0, indexStrategy: "S&P 500 with 11% cap + fixed account",
    bonusPct: 5, surrenderYears: 10, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "A+ rated with 11% S&P cap and 5% bonus — strong in southern states",
  },
  {
    id: "transamerica-growth-choice", rank: 19, carrier: "Transamerica", product: "Growth Choice Plus",
    amBest: "A", comdex: 76, category: "growth", type: "FIA — Accumulation",
    participationRate: 140, capRate: 0, indexStrategy: "BofA Destinations + S&P 500",
    bonusPct: 8, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY", "WA", "OR"],
    highlight: "8% bonus with 140% uncapped participation — popular in midwest and south",
  },
  {
    id: "symetra-accumulator-elite", rank: 20, carrier: "Symetra", product: "Accumulator Elite 10",
    amBest: "A", comdex: 80, category: "growth", type: "FIA — Accumulation",
    participationRate: 115, capRate: 0, indexStrategy: "S&P 500 + MSCI EAFE + custom volatility index",
    bonusPct: 0, surrenderYears: 10, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "HI"],
    highlight: "Pacific NW carrier with international index exposure — strong in WA, OR, ID",
  },
  {
    id: "mass-mutual-stable-voyage", rank: 21, carrier: "MassMutual", product: "Stable Voyage FIA",
    amBest: "A++", comdex: 99, category: "growth", type: "FIA — Conservative Growth",
    participationRate: 100, capRate: 7.5, indexStrategy: "S&P 500 with 7.5% cap + fixed 3.25%",
    bonusPct: 0, surrenderYears: 7, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "Highest-rated carrier (A++/99 Comdex) — conservative growth with maximum safety",
  },
  {
    id: "new-york-life-secure-growth", rank: 22, carrier: "New York Life", product: "Secure Growth FIA",
    amBest: "A++", comdex: 99, category: "growth", type: "FIA — Conservative Growth",
    participationRate: 100, capRate: 8.0, indexStrategy: "S&P 500 with 8% cap + fixed 3.5%",
    bonusPct: 0, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A++ rated mutual carrier — top choice for safety-conscious accumulators",
  },
  {
    id: "sammons-accumulation-fia", rank: 23, carrier: "Sammons Financial", product: "Accumulation FIA 10",
    amBest: "A", comdex: 75, category: "growth", type: "FIA — Accumulation",
    participationRate: 165, capRate: 0, indexStrategy: "Barclays Atlas 5 + S&P 500",
    bonusPct: 15, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "NJ", "MA"],
    highlight: "15% bonus with 165% participation — strong in heartland states",
  },
  {
    id: "gaig-indexmark-7", rank: 24, carrier: "GAIG (Great American)", product: "IndexMark 7",
    amBest: "A+", comdex: 84, category: "growth", type: "FIA — Short Surrender",
    participationRate: 100, capRate: 9.5, indexStrategy: "S&P 500 + Barclays US Dynamic Balance",
    bonusPct: 0, surrenderYears: 7, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "HI", "AK"],
    highlight: "7-year surrender with 9.5% cap and dual-index strategy — strong in Ohio Valley",
  },
  {
    id: "athene-agility10-ny", rank: 25, carrier: "Athene", product: "Agility 10 (NY Approved)",
    amBest: "A+", comdex: 88, category: "growth", type: "FIA — NY Approved",
    participationRate: 105, capRate: 8.5, indexStrategy: "S&P 500 + BofA Multi-Asset",
    bonusPct: 0, surrenderYears: 10, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "NY-approved Athene product with 8.5% cap — designed for strict regulatory states",
  },
];

/**
 * State-specific ranking adjustments for growth products.
 * Positive numbers = boost (lower rank number = higher position).
 * Products not listed keep their national baseline rank.
 * This creates genuinely different top-10 lists per state based on:
 * - Carrier regional strength & licensing
 * - State regulatory preferences
 * - Historical sales volume in that state
 * - Guaranty association tier compatibility
 */
const STATE_GROWTH_RANK_BOOSTS: Partial<Record<StateCode, Record<string, number>>> = {
  // Florida — retiree-heavy, prefers high participation + bonus products
  FL: { "athene-pe-plus15": -3, "fg-power-accumulator": -1, "protective-indexed-choice": -8, "global-atlantic-forethought": -7 },
  // Texas — large market, diverse preferences, bonus products popular
  TX: { "north-american-charter-plus": -5, "transamerica-growth-choice": -9, "midland-livewell-growth": -4, "sammons-accumulation-fia": -12 },
  // California — strict regulation, prefers high-rated carriers
  CA: { "allianz-222": -3, "pacific-life-pacific-index": -8, "mass-mutual-stable-voyage": -12, "new-york-life-secure-growth": -11 },
  // New York — strictest regulation, limited product availability
  NY: { "athene-agility10-ny": -20, "mass-mutual-stable-voyage": -15, "new-york-life-secure-growth": -14, "allianz-222": -2 },
  // Ohio — Great American home state, midwest preferences
  OH: { "gaig-indexmark-7": -15, "great-american-legend7": -8, "nationwide-peak10-growth": -3, "lincoln-optiblend-10": -5 },
  // Pennsylvania — conservative, prefers A+ carriers
  PA: { "lincoln-optiblend-10": -7, "nationwide-peak10-growth": -2, "mass-mutual-stable-voyage": -10, "new-york-life-secure-growth": -9 },
  // Illinois — large market, Jackson National strong
  IL: { "jackson-market-link-pro": -7, "nationwide-peak10-growth": -2, "midland-livewell-growth": -3, "allianz-222": -1 },
  // Arizona — retiree destination, bonus products popular
  AZ: { "athene-pe-plus15": -2, "fg-power-accumulator": -1, "protective-indexed-choice": -7, "north-american-charter-plus": -4 },
  // Georgia — southeast hub, Protective Life home state
  GA: { "protective-indexed-choice": -12, "global-atlantic-forethought": -6, "corebridge-polaris-platinum": -5, "transamerica-growth-choice": -8 },
  // North Carolina — financial hub, diverse preferences
  NC: { "protective-indexed-choice": -8, "lincoln-optiblend-10": -4, "corebridge-polaris-platinum": -3, "nationwide-peak10-growth": -1 },
  // Virginia — DC metro influence, conservative preferences
  VA: { "mass-mutual-stable-voyage": -10, "new-york-life-secure-growth": -9, "lincoln-optiblend-10": -5, "nationwide-peak10-growth": -2 },
  // Washington — Symetra home state, strict regulation
  WA: { "symetra-accumulator-elite": -14, "pacific-life-pacific-index": -6, "mass-mutual-stable-voyage": -8, "new-york-life-secure-growth": -7 },
  // Oregon — Pacific NW, Symetra strong
  OR: { "symetra-accumulator-elite": -12, "pacific-life-pacific-index": -5, "allianz-222": -1, "mass-mutual-stable-voyage": -6 },
  // Colorado — western state, growth-oriented
  CO: { "pacific-life-pacific-index": -5, "fg-power-accumulator": -1, "jackson-market-link-pro": -3, "allianz-222": -1 },
  // Michigan — midwest, auto industry wealth
  MI: { "jackson-market-link-pro": -8, "nationwide-peak10-growth": -2, "lincoln-optiblend-10": -3, "midland-livewell-growth": -2 },
  // New Jersey — strict regulation, high net worth
  NJ: { "mass-mutual-stable-voyage": -12, "new-york-life-secure-growth": -10, "allianz-222": -2, "lincoln-optiblend-10": -4 },
  // Connecticut — premium guaranty state, conservative
  CT: { "mass-mutual-stable-voyage": -15, "new-york-life-secure-growth": -13, "allianz-222": -3, "lincoln-optiblend-10": -5 },
  // Massachusetts — strict regulation, MassMutual home state
  MA: { "mass-mutual-stable-voyage": -18, "new-york-life-secure-growth": -12, "allianz-222": -2, "lincoln-optiblend-10": -4 },
  // Iowa — insurance capital, North American/Sammons home
  IA: { "north-american-charter-plus": -8, "sammons-accumulation-fia": -14, "midland-livewell-growth": -5, "fg-power-accumulator": -1 },
  // Minnesota — Allianz strong, conservative preferences
  MN: { "allianz-222": -3, "mass-mutual-stable-voyage": -8, "midland-livewell-growth": -3, "nationwide-peak10-growth": -1 },
  // Wisconsin — midwest, conservative
  WI: { "nationwide-peak10-growth": -3, "midland-livewell-growth": -4, "allianz-222": -2, "mass-mutual-stable-voyage": -6 },
  // Indiana — midwest, Nationwide strong
  IN: { "nationwide-peak10-growth": -4, "midland-livewell-growth": -3, "lincoln-optiblend-10": -3, "gaig-indexmark-7": -5 },
  // Tennessee — southeast, growth-oriented
  TN: { "protective-indexed-choice": -8, "global-atlantic-forethought": -5, "transamerica-growth-choice": -6, "north-american-charter-plus": -3 },
  // South Carolina — retiree destination
  SC: { "protective-indexed-choice": -9, "athene-pe-plus15": -2, "global-atlantic-forethought": -4, "fg-power-accumulator": -1 },
  // Nevada — no state income tax, growth-focused
  NV: { "fg-power-accumulator": -1, "athene-pe-plus15": -2, "pacific-life-pacific-index": -4, "jackson-market-link-pro": -3 },
  // Alabama — southeast, conservative
  AL: { "protective-indexed-choice": -12, "global-atlantic-forethought": -5, "midland-livewell-growth": -2, "north-american-charter-plus": -3 },
  // Missouri — midwest hub
  MO: { "north-american-charter-plus": -4, "sammons-accumulation-fia": -8, "nationwide-peak10-growth": -2, "midland-livewell-growth": -3 },
  // Maryland — DC metro, high net worth
  MD: { "mass-mutual-stable-voyage": -8, "new-york-life-secure-growth": -7, "lincoln-optiblend-10": -4, "corebridge-polaris-platinum": -3 },
  // Kentucky — southeast/midwest border
  KY: { "nationwide-peak10-growth": -3, "gaig-indexmark-7": -6, "protective-indexed-choice": -5, "midland-livewell-growth": -2 },
  // Louisiana — southeast, bonus products popular
  LA: { "athene-pe-plus15": -2, "global-atlantic-forethought": -5, "protective-indexed-choice": -6, "transamerica-growth-choice": -4 },
  // Oklahoma — heartland, Sammons strong
  OK: { "sammons-accumulation-fia": -12, "north-american-charter-plus": -5, "midland-livewell-growth": -3, "transamerica-growth-choice": -4 },
  // Kansas — heartland
  KS: { "sammons-accumulation-fia": -10, "north-american-charter-plus": -4, "midland-livewell-growth": -3, "security-benefit-strategic": -4 },
  // Nebraska — midwest, Sammons territory
  NE: { "sammons-accumulation-fia": -13, "midland-livewell-growth": -5, "north-american-charter-plus": -4, "nationwide-peak10-growth": -2 },
  // Arkansas — southeast
  AR: { "protective-indexed-choice": -7, "global-atlantic-forethought": -4, "north-american-charter-plus": -3, "transamerica-growth-choice": -5 },
  // Mississippi — southeast
  MS: { "protective-indexed-choice": -10, "global-atlantic-forethought": -5, "transamerica-growth-choice": -6, "midland-livewell-growth": -2 },
  // Idaho — Pacific NW
  ID: { "symetra-accumulator-elite": -10, "pacific-life-pacific-index": -4, "fg-power-accumulator": -1, "allianz-222": -1 },
  // Utah — western, growth-oriented
  UT: { "pacific-life-pacific-index": -5, "fg-power-accumulator": -1, "jackson-market-link-pro": -3, "allianz-222": -1 },
  // New Mexico — southwest
  NM: { "pacific-life-pacific-index": -4, "protective-indexed-choice": -5, "north-american-charter-plus": -3, "fg-power-accumulator": -1 },
  // Hawaii — limited carrier availability
  HI: { "pacific-life-pacific-index": -8, "mass-mutual-stable-voyage": -10, "new-york-life-secure-growth": -9, "allianz-222": -2 },
  // Alaska — limited carrier availability
  AK: { "mass-mutual-stable-voyage": -12, "new-york-life-secure-growth": -10, "allianz-222": -2, "nationwide-peak10-growth": -1 },
  // Montana — rural, limited availability
  MT: { "mass-mutual-stable-voyage": -10, "new-york-life-secure-growth": -8, "allianz-222": -2, "nationwide-peak10-growth": -1 },
  // Wyoming — rural, limited availability
  WY: { "mass-mutual-stable-voyage": -10, "new-york-life-secure-growth": -8, "allianz-222": -2, "security-benefit-strategic": -3 },
  // North Dakota — rural, Sammons territory
  ND: { "sammons-accumulation-fia": -10, "midland-livewell-growth": -5, "mass-mutual-stable-voyage": -6, "nationwide-peak10-growth": -2 },
  // South Dakota — no state income tax, growth-focused
  SD: { "sammons-accumulation-fia": -10, "midland-livewell-growth": -5, "fg-power-accumulator": -1, "security-benefit-strategic": -3 },
  // West Virginia — Appalachian, conservative
  WV: { "nationwide-peak10-growth": -4, "gaig-indexmark-7": -6, "protective-indexed-choice": -5, "lincoln-optiblend-10": -3 },
  // Delaware — small state, financial hub
  DE: { "lincoln-optiblend-10": -6, "mass-mutual-stable-voyage": -8, "new-york-life-secure-growth": -7, "corebridge-polaris-platinum": -3 },
  // Rhode Island — New England, conservative
  RI: { "mass-mutual-stable-voyage": -12, "new-york-life-secure-growth": -10, "allianz-222": -2, "lincoln-optiblend-10": -4 },
  // New Hampshire — New England
  NH: { "mass-mutual-stable-voyage": -10, "new-york-life-secure-growth": -8, "allianz-222": -2, "lincoln-optiblend-10": -3 },
  // Vermont — New England, strict regulation
  VT: { "mass-mutual-stable-voyage": -14, "new-york-life-secure-growth": -12, "allianz-222": -3, "lincoln-optiblend-10": -4 },
  // Maine — New England
  ME: { "mass-mutual-stable-voyage": -12, "new-york-life-secure-growth": -10, "allianz-222": -2, "lincoln-optiblend-10": -3 },
  // DC — federal employees, conservative
  DC: { "mass-mutual-stable-voyage": -12, "new-york-life-secure-growth": -10, "lincoln-optiblend-10": -5, "corebridge-polaris-platinum": -3 },
};

/* ─── STATE-SPECIFIC MYGA RANKING BOOSTS ─── */
/**
 * Negative values = boost (move up in ranking), positive = penalize (move down).
 * States with strong insurance regulation prefer A-rated carriers; Sun Belt states
 * may see higher-rate B++ carriers rank higher due to broader availability.
 */
const STATE_MYGA_RANK_BOOSTS: Partial<Record<StateCode, Record<string, number>>> = {
  // Sun Belt / Southeast — high-rate carriers available, boost them
  FL: { "american-equity-myga": -8, "aspida-myga": -7, "global-atlantic-myga": -5, "midland-myga": -4 },
  TX: { "midland-myga": -10, "north-american-myga": -8, "american-equity-myga": -6, "athene-myga": -5 },
  GA: { "american-equity-myga": -7, "aspida-myga": -6, "fg-myga": -5, "global-atlantic-myga": -4 },
  SC: { "atlantic-coast-myga": -6, "american-equity-myga": -5, "aspida-myga": -4 },
  NC: { "american-equity-myga": -6, "global-atlantic-myga": -5, "midland-myga": -4 },
  AL: { "american-equity-myga": -7, "heartland-national-myga": -3, "nassau-life-myga": -2 },
  TN: { "american-equity-myga": -6, "midland-myga": -5, "aspida-myga": -4 },
  LA: { "american-equity-myga": -7, "midland-myga": -5, "fg-myga": -3 },
  MS: { "american-equity-myga": -7, "heartland-national-myga": -3 },
  AR: { "american-equity-myga": -6, "midland-myga": -4 },
  // Midwest — Sammons/Midland strong, balanced mix
  IA: { "midland-myga": -10, "north-american-myga": -8, "american-equity-myga": -6, "nationwide-myga": -3 },
  OH: { "nationwide-myga": -8, "midland-myga": -6, "american-equity-myga": -5, "lincoln-myga": -3 },
  IN: { "midland-myga": -7, "american-equity-myga": -6, "jackson-myga": -4, "nationwide-myga": -3 },
  IL: { "midland-myga": -6, "american-equity-myga": -5, "jackson-myga": -4, "nationwide-myga": -3 },
  MI: { "jackson-myga": -8, "midland-myga": -5, "american-equity-myga": -4, "nationwide-myga": -3 },
  MN: { "midland-myga": -7, "north-american-myga": -5, "american-equity-myga": -4 },
  WI: { "midland-myga": -6, "american-equity-myga": -5, "nationwide-myga": -3 },
  MO: { "midland-myga": -7, "american-equity-myga": -5, "north-american-myga": -4 },
  NE: { "midland-myga": -8, "north-american-myga": -6, "american-equity-myga": -4 },
  KS: { "midland-myga": -7, "north-american-myga": -5, "american-equity-myga": -4 },
  ND: { "midland-myga": -6, "north-american-myga": -5 },
  SD: { "midland-myga": -6, "north-american-myga": -5 },
  // Northeast — prefer A-rated safety carriers
  PA: { "massmutual-myga": -10, "guardian-myga": -8, "athene-myga": -6, "lincoln-myga": -4, "protective-myga": -3 },
  NJ: { "massmutual-myga": -9, "guardian-myga": -7, "athene-myga": -5, "pacific-life-myga": -3 },
  CT: { "massmutual-myga": -10, "guardian-myga": -8, "athene-myga": -6, "nationwide-myga": -4 },
  MA: { "massmutual-myga": -10, "guardian-myga": -8, "pacific-life-myga": -5, "athene-myga": -4 },
  NH: { "massmutual-myga": -8, "guardian-myga": -6, "athene-myga": -4 },
  VT: { "massmutual-myga": -8, "guardian-myga": -6, "athene-myga": -4 },
  ME: { "massmutual-myga": -8, "guardian-myga": -6, "athene-myga": -4 },
  RI: { "massmutual-myga": -8, "guardian-myga": -6, "athene-myga": -4 },
  DE: { "massmutual-myga": -7, "guardian-myga": -5, "athene-myga": -4, "lincoln-myga": -3 },
  MD: { "massmutual-myga": -7, "guardian-myga": -5, "athene-myga": -4, "corebridge-myga": -3 },
  VA: { "massmutual-myga": -6, "guardian-myga": -5, "athene-myga": -4, "lincoln-myga": -3 },
  // West Coast — strict regulation, A-rated preferred
  CA: { "massmutual-myga": -10, "guardian-myga": -8, "pacific-life-myga": -7, "athene-myga": -5, "nationwide-myga": -4 },
  WA: { "massmutual-myga": -10, "guardian-myga": -8, "pacific-life-myga": -7, "athene-myga": -5 },
  OR: { "massmutual-myga": -9, "guardian-myga": -7, "pacific-life-myga": -6, "athene-myga": -4 },
  // Mountain West
  CO: { "midland-myga": -6, "athene-myga": -5, "american-equity-myga": -4, "nationwide-myga": -3 },
  AZ: { "midland-myga": -5, "american-equity-myga": -6, "athene-myga": -4, "aspida-myga": -3 },
  NV: { "midland-myga": -5, "american-equity-myga": -6, "athene-myga": -4 },
  UT: { "midland-myga": -6, "north-american-myga": -5, "athene-myga": -4 },
  NM: { "midland-myga": -5, "american-equity-myga": -4, "athene-myga": -3 },
  ID: { "midland-myga": -5, "north-american-myga": -4, "athene-myga": -3 },
  MT: { "midland-myga": -5, "north-american-myga": -4 },
  WY: { "midland-myga": -5, "north-american-myga": -4 },
  // Other
  HI: { "pacific-life-myga": -8, "massmutual-myga": -6, "athene-myga": -4 },
  AK: { "pacific-life-myga": -6, "massmutual-myga": -5, "athene-myga": -4 },
  OK: { "midland-myga": -6, "american-equity-myga": -5, "north-american-myga": -4 },
  KY: { "midland-myga": -5, "american-equity-myga": -4, "nationwide-myga": -3 },
  WV: { "midland-myga": -5, "nationwide-myga": -4, "athene-myga": -3 },
  DC: { "massmutual-myga": -8, "guardian-myga": -6, "athene-myga": -5, "corebridge-myga": -3 },
};

/* ─── TOP MYGA PRODUCTS ─── */
const MYGA_PRODUCTS: AnnuityProduct[] = [
  // ── Highest Rate Tier (B/B+ rated, 5.75%–6.30%) ──
  {
    id: "american-gulf-myga", rank: 1, carrier: "American Gulf", product: "Anchor MYGA 5",
    amBest: "B++", comdex: 55, category: "myga", type: "MYGA",
    term3yr: 5.80, term5yr: 6.30, term7yr: 6.10, term10yr: 5.90,
    surrenderYears: 0, minPremium: 20000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA", "CT", "MA"],
    highlight: "Highest national 5-year MYGA rate at 6.30% — B++ rated",
  },
  {
    id: "wichita-national-myga", rank: 2, carrier: "Wichita National", product: "Security 5",
    amBest: "B+", comdex: 48, category: "myga", type: "MYGA",
    term3yr: 5.70, term5yr: 6.25, term7yr: 6.00, term10yr: 5.80,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA", "CT", "MA", "OR"],
    highlight: "6.25% 5-year rate — among highest nationally, B+ rated",
  },
  {
    id: "canvas-puritan-myga", rank: 3, carrier: "Canvas / Puritan Life", product: "Future Fund 5",
    amBest: "B++", comdex: 52, category: "myga", type: "MYGA",
    term3yr: 5.50, term5yr: 6.00, term7yr: 5.80, term10yr: 5.65,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA"],
    highlight: "6.00% 5-year rate with low $10K minimum — B++ rated",
  },
  {
    id: "heartland-national-myga", rank: 4, carrier: "Heartland National", product: "Secure Rate 5",
    amBest: "B++", comdex: 50, category: "myga", type: "MYGA",
    term3yr: 5.40, term5yr: 5.90, term7yr: 5.70, term10yr: 5.55,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA"],
    highlight: "5.90% 5-year rate with low minimum premium — B++ rated",
  },
  {
    id: "revol-one-myga", rank: 5, carrier: "Revol One", product: "DirectGrowth MYGA 5",
    amBest: "B++", comdex: 51, category: "myga", type: "MYGA",
    term3yr: 5.35, term5yr: 5.85, term7yr: 5.65, term10yr: 5.50,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA", "CT"],
    highlight: "5.85% 5-year rate — strong mid-tier option, B++ rated",
  },
  {
    id: "baltimore-life-myga", rank: 6, carrier: "Baltimore Life", product: "IQumulate 5",
    amBest: "B++", comdex: 53, category: "myga", type: "MYGA",
    term3yr: 5.30, term5yr: 5.80, term7yr: 5.60, term10yr: 5.45,
    surrenderYears: 0, minPremium: 15000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA"],
    highlight: "5.80% 5-year rate from established carrier — B++ rated",
  },
  {
    id: "ohio-state-life-myga", rank: 7, carrier: "Ohio State Life", product: "Nex MYGA 5",
    amBest: "B+", comdex: 47, category: "myga", type: "MYGA",
    term3yr: 5.25, term5yr: 5.75, term7yr: 5.55, term10yr: 5.40,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA", "CT", "MA", "OR"],
    highlight: "5.75% 5-year rate with low minimum — B+ rated",
  },
  {
    id: "mountain-life-myga", rank: 8, carrier: "Mountain Life", product: "Secure Summit 5",
    amBest: "B-", comdex: 38, category: "myga", type: "MYGA",
    term3yr: 5.25, term5yr: 5.75, term7yr: 5.50, term10yr: 5.35,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA", "CT", "MA", "OR", "FL", "TX"],
    highlight: "5.75% rate but B- rating — higher risk, limited state availability",
  },
  {
    id: "atlantic-coast-myga", rank: 9, carrier: "Atlantic Coast Life", product: "Safe Haven 5",
    amBest: "B", comdex: 42, category: "myga", type: "MYGA",
    term3yr: 5.15, term5yr: 5.65, term7yr: 5.45, term10yr: 5.30,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY", "CA", "WA", "CT"],
    highlight: "5.65% 5-year rate — solid mid-tier with B rating",
  },
  {
    id: "nassau-life-myga", rank: 10, carrier: "Nassau Life", product: "Nassau Simple Annuity 5",
    amBest: "B++", comdex: 58, category: "myga", type: "MYGA",
    term3yr: 4.70, term5yr: 5.10, term7yr: 5.00, term10yr: 4.90,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "5.10% 5-year rate with simple structure — B++ rated",
  },
  // ── A-Rated Safety Tier (A- to A++, 4.30%–5.45%) ──
  {
    id: "aspida-myga", rank: 11, carrier: "Aspida Life", product: "Synergy Choice MYGA 5",
    amBest: "A-", comdex: 75, category: "myga", type: "MYGA",
    term3yr: 4.60, term5yr: 5.00, term7yr: 4.90, term10yr: 4.80,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "A- rated, backed by Ares Management ($400B+ AUM) — 5.00% 5-year",
  },
  {
    id: "american-equity-myga", rank: 12, carrier: "American Equity", product: "GuaranteeShield 5",
    amBest: "A-", comdex: 76, category: "myga", type: "MYGA",
    term3yr: 4.90, term5yr: 5.45, term7yr: 5.35, term10yr: 5.25,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "Highest A-rated MYGA at 5.45% — strong value for safety-conscious clients",
  },
  {
    id: "midland-myga", rank: 13, carrier: "Midland National", product: "Guarantee Pro 5",
    amBest: "A+", comdex: 90, category: "myga", type: "MYGA",
    term3yr: 4.45, term5yr: 4.85, term7yr: 4.75, term10yr: 4.65,
    surrenderYears: 0, minPremium: 20000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A+ rated Sammons subsidiary — 4.85% with strong rate consistency",
  },
  {
    id: "athene-myga", rank: 14, carrier: "Athene", product: "Max Rate 5 MYGA",
    amBest: "A+", comdex: 88, category: "myga", type: "MYGA",
    term3yr: 4.40, term5yr: 4.80, term7yr: 4.70, term10yr: 4.60,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A+ rated with 4.80% — Apollo-backed, $250B+ in assets",
  },
  {
    id: "massmutual-myga", rank: 15, carrier: "MassMutual", product: "Premier Voyage 5",
    amBest: "A++", comdex: 95, category: "myga", type: "MYGA",
    term3yr: 4.30, term5yr: 4.70, term7yr: 4.60, term10yr: 4.50,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A++ rated (highest safety) — 4.70% from $300B+ mutual carrier",
  },
  {
    id: "guardian-myga", rank: 16, carrier: "Guardian Life", product: "Fixed Target 5",
    amBest: "A++", comdex: 97, category: "myga", type: "MYGA",
    term3yr: 4.25, term5yr: 4.65, term7yr: 4.55, term10yr: 4.45,
    surrenderYears: 0, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A++ rated, COMDEX 97 — among safest carriers in the industry",
  },
  {
    id: "north-american-myga", rank: 17, carrier: "North American", product: "Guarantee Choice 5",
    amBest: "A+", comdex: 91, category: "myga", type: "MYGA",
    term3yr: 4.20, term5yr: 4.60, term7yr: 4.50, term10yr: 4.40,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A+ rated Sammons subsidiary — $25B+ in assets, COMDEX 91",
  },
  {
    id: "corebridge-myga", rank: 18, carrier: "Corebridge (AIG)", product: "Corebridge MYGA 5",
    amBest: "A", comdex: 87, category: "myga", type: "MYGA",
    term3yr: 4.10, term5yr: 4.50, term7yr: 4.40, term10yr: 4.30,
    surrenderYears: 0, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A rated, COMDEX 87 — former AIG subsidiary with deep reserves",
  },
  {
    id: "pacific-life-myga", rank: 19, carrier: "Pacific Life", product: "Pacific Secure MYGA 5",
    amBest: "A+", comdex: 93, category: "myga", type: "MYGA",
    term3yr: 4.05, term5yr: 4.45, term7yr: 4.35, term10yr: 4.25,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A+ rated, COMDEX 93 — West Coast powerhouse with flexible options",
  },
  {
    id: "nationwide-myga", rank: 20, carrier: "Nationwide", product: "MyPath MYGA 5",
    amBest: "A+", comdex: 91, category: "myga", type: "MYGA",
    term3yr: 4.00, term5yr: 4.40, term7yr: 4.30, term10yr: 4.20,
    surrenderYears: 0, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A+ rated, COMDEX 91 — strong renewal rate history",
  },
  {
    id: "lincoln-myga", rank: 21, carrier: "Lincoln Financial", product: "Lincoln MYGA 5",
    amBest: "A+", comdex: 88, category: "myga", type: "MYGA",
    term3yr: 3.95, term5yr: 4.35, term7yr: 4.25, term10yr: 4.15,
    surrenderYears: 0, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "A+ rated, COMDEX 88 — established carrier with strong financials",
  },
  {
    id: "protective-myga", rank: 22, carrier: "Protective Life", product: "Protective MYGA 5",
    amBest: "A+", comdex: 89, category: "myga", type: "MYGA",
    term3yr: 3.90, term5yr: 4.30, term7yr: 4.20, term10yr: 4.10,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A+ rated, COMDEX 89 — Dai-ichi Life subsidiary with global backing",
  },
  {
    id: "global-atlantic-myga", rank: 23, carrier: "Global Atlantic", product: "ForeCare MYGA 5",
    amBest: "A", comdex: 84, category: "myga", type: "MYGA",
    term3yr: 4.50, term5yr: 4.95, term7yr: 4.85, term10yr: 4.75,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A rated, COMDEX 84 — KKR-backed with LTC waiver included",
  },
  {
    id: "fg-myga", rank: 24, carrier: "F&G Life", product: "SafePath MYGA 5",
    amBest: "A", comdex: 82, category: "myga", type: "MYGA",
    term3yr: 4.45, term5yr: 4.90, term7yr: 4.80, term10yr: 4.70,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: [],
    highlight: "A rated, COMDEX 82 — Fidelity National subsidiary with nursing home waiver",
  },
  {
    id: "jackson-myga", rank: 25, carrier: "Jackson National", product: "Jackson MYGA 5",
    amBest: "A", comdex: 85, category: "myga", type: "MYGA",
    term3yr: 4.15, term5yr: 4.55, term7yr: 4.45, term10yr: 4.35,
    surrenderYears: 0, minPremium: 25000, freeWithdrawal: 10,
    excludedStates: ["NY"],
    highlight: "A rated, COMDEX 85 — $300B+ in assets, strong variable annuity heritage",
  },
  // ── NY-Specific Products ──
  {
    id: "sbli-select-choice-ny", rank: 1, carrier: "SBLI USA", product: "Select Choice 1 (5) NY",
    amBest: "A-", comdex: 72, category: "myga", type: "MYGA",
    term3yr: 4.50, term5yr: 4.90, term7yr: 4.80, term10yr: 4.70,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 0,
    excludedStates: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"],
    highlight: "Highest NY-approved 5-year MYGA at 4.90% — no free withdrawal",
  },
  {
    id: "sbli-select-choice3-ny", rank: 2, carrier: "SBLI USA", product: "Select Choice 3 (5) NY",
    amBest: "A-", comdex: 72, category: "myga", type: "MYGA",
    term3yr: 4.45, term5yr: 4.85, term7yr: 4.75, term10yr: 4.65,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"],
    highlight: "NY-approved 4.85% with 10% free withdrawal — A- rated",
  },
  {
    id: "athene-myga-ny", rank: 3, carrier: "Athene", product: "Max Rate 5 MYGA NY",
    amBest: "A+", comdex: 88, category: "myga", type: "MYGA",
    term3yr: 4.35, term5yr: 4.80, term7yr: 4.70, term10yr: 4.60,
    surrenderYears: 0, minPremium: 10000, freeWithdrawal: 10,
    excludedStates: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"],
    highlight: "A+ rated NY-approved MYGA at 4.80% — Apollo-backed safety",
  },
];

/* ─── ALL PRODUCTS COMBINED ─── */
export const ALL_ANNUITY_PRODUCTS: AnnuityProduct[] = [
  ...INCOME_PRODUCTS,
  ...GROWTH_PRODUCTS,
  ...MYGA_PRODUCTS,
];

/* ─── STATE-BASED PRODUCT MATCHING ─── */

/**
 * Get top annuity products available in a specific state, ranked by category.
 * Handles NY-specific product swaps and state exclusions.
 */
export function getTopProductsForState(
  stateCode: StateCode,
  category: AnnuityCategory,
  limit = 10
): AnnuityProduct[] {
  const isNY = stateCode === "NY";

  // Step 1: Filter by state availability
  const filtered = ALL_ANNUITY_PRODUCTS
    .filter(p => p.category === category)
    .filter(p => {
      // For NY, include NY-specific products and exclude non-NY products
      if (isNY) {
        if (p.id.endsWith("-ny")) return true;
        if (p.excludedStates.includes("NY")) return false;
        return true;
      }
      // For non-NY states, exclude NY-specific products
      if (p.id.endsWith("-ny")) return false;
      return !p.excludedStates.includes(stateCode);
    });

  // Step 2: Apply state-specific ranking adjustments for growth and myga products
  const boosts = category === "growth"
    ? (STATE_GROWTH_RANK_BOOSTS[stateCode] || {})
    : category === "myga"
      ? (STATE_MYGA_RANK_BOOSTS[stateCode] || {})
      : {};

  const products = filtered
    .map(p => {
      const boost = boosts[p.id] || 0;
      return { ...p, rank: p.rank + boost };
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    // Re-number ranks 1..N for clean display
    .map((p, idx) => ({ ...p, rank: idx + 1 }));

  return products;
}

/**
 * Get the guaranty association info for a state.
 */
export function getStateGuaranty(stateCode: StateCode): StateGuaranty {
  return STATE_GUARANTY[stateCode] || STATE_GUARANTY.FL;
}

/**
 * Get the state name from code.
 */
export function getStateName(stateCode: StateCode): string {
  return US_STATES.find(s => s.code === stateCode)?.name || stateCode;
}

/**
 * Calculate how many carriers a client should split across based on premium and state limit.
 */
export function getCarrierSplitRecommendation(
  premium: number,
  stateCode: StateCode
): { splitCount: number; perCarrier: number; recommendation: string } {
  const guaranty = getStateGuaranty(stateCode);
  const limit = guaranty.annuityLimit;

  if (premium <= limit) {
    return {
      splitCount: 1,
      perCarrier: premium,
      recommendation: `Your premium of ${formatCurrency(premium)} is within ${getStateName(stateCode)}'s ${formatCurrency(limit)} guaranty limit. Single carrier is fine.`,
    };
  }

  const splitCount = Math.ceil(premium / limit);
  const perCarrier = Math.ceil(premium / splitCount);

  return {
    splitCount,
    perCarrier,
    recommendation: `Consider splitting ${formatCurrency(premium)} across ${splitCount} carriers (${formatCurrency(perCarrier)} each) to stay within ${getStateName(stateCode)}'s ${formatCurrency(limit)} guaranty limit per carrier.`,
  };
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/**
 * Get a summary of all products for a state — used by the Annuity Memory admin page.
 */
export function getFullStateReport(stateCode: StateCode) {
  const guaranty = getStateGuaranty(stateCode);
  const stateName = getStateName(stateCode);
  const incomeProducts = getTopProductsForState(stateCode, "income", 10);
  const growthProducts = getTopProductsForState(stateCode, "growth", 10);
  const mygaProducts = getTopProductsForState(stateCode, "myga", 10);

  return {
    stateCode,
    stateName,
    guaranty,
    incomeProducts,
    growthProducts,
    mygaProducts,
    totalProducts: incomeProducts.length + growthProducts.length + mygaProducts.length,
  };
}
