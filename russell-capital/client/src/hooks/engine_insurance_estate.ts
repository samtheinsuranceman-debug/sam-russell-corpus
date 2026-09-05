// Interfaces for Insurance Needs
interface HumanLifeValueInput {
  annualIncome: number; // Annual gross income in USD
  yearsToRetirement: number; // Years until retirement
  inflationRate: number; // Annual inflation rate, e.g., 2.5 for 2024
  discountRate: number; // Discount rate, e.g., 4% for 2024
}

interface HumanLifeValueOutput {
  presentValue: number; // Present value of future income
}

interface CapitalNeedsInput {
  annualIncome: number;
  replacementYears: number; // Number of years to replace income
  incomeReplacementRatio: number; // E.g., 0.7 for 70%
  taxRate: number; // Effective tax rate, e.g., 25%
}

interface CapitalNeedsOutput {
  lumpSumNeeded: number; // Lump sum required
}

interface IncomeReplacementRatioInput {
  grossIncome: number;
  taxRate: number; // Federal and state tax rate
}

interface IncomeReplacementRatioOutput {
  adjustedIncome: number; // 60-80% of gross, post-tax
}

interface MortgagePayoffInput {
  principal: number; // Current mortgage principal
  annualInterestRate: number; // E.g., 6.5% for 2024
  remainingYears: number; // Years left on mortgage
}

interface MortgagePayoffOutput {
  payoffAmount: number; // Total amount needed to pay off
}

interface EducationFundingInput {
  currentCost: number; // Current annual cost per child
  yearsUntilNeeded: number; // Years until education starts
  inflationRate: number; // E.g., 3% for education costs in 2024
  yearsOfEducation: number; // E.g., 4 for college
}

interface EducationFundingOutput {
  futureCost: number; // Future lump sum needed
}

interface CoverageGapInput {
  currentCoverage: number; // Existing insurance coverage
  requiredCoverage: number; // Calculated required amount
}

interface CoverageGapOutput {
  gapAmount: number; // Difference in coverage
}

interface DisabilityIncomeInput {
  annualIncome: number;
  replacementRatio: number; // E.g., 60%
  disabilityPeriod: number; // Years of potential disability
  inflationRate: number;
}

interface DisabilityIncomeOutput {
  annualBenefitNeeded: number;
}

interface LongTermCareInput {
  state: string; // E.g., 'California', 'New York'
  annualCost: number; // Base annual cost, e.g., $50,000 for 2024
  inflationRate: number; // E.g., 3%
  yearsProjected: number; // Projection years
}

interface LongTermCareOutput {
  projectedAnnualCost: number;
}

interface LifeInsuranceComparisonInput {
  age: number; // Insured age
  coverageAmount: number; // Desired coverage
  termYears: number; // For term insurance
  annualPremiumTerm: number; // Estimated premium for term
  annualPremiumWhole: number; // For whole life
  annualPremiumUniversal: number; // For universal life
  interestRate: number; // E.g., 4% for 2024 cash value growth
}

interface LifeInsuranceComparisonOutput {
  totalCostTerm: number; // Total premiums for term
  cashValueWhole: number; // Projected cash value for whole
  cashValueUniversal: number; // For universal
}

interface UmbrellaLiabilityInput {
  assets: number; // Total net worth
  existingLiability: number; // Current liability coverage
  riskFactors: number; // Multiplier for risks, e.g., 2 for high risk
}

interface UmbrellaLiabilityOutput {
  recommendedCoverage: number; // Additional umbrella needed
}

// Interfaces for Estate Planning
interface FederalEstateTaxInput {
  estateValue: number; // Total estate value in USD
}

interface FederalEstateTaxOutput {
  taxDue: number; // Tax after 2024 exemption of $13,610,000
  exemptionUsed: number;
}

interface PortabilityElectionInput {
  deceasedEstate: number; // Deceased spouse's estate
  survivingEstate: number; // Surviving spouse's estate
}

interface PortabilityElectionOutput {
  dsueAmount: number; // Deceased Spousal Unused Exclusion
}

interface GSTTInput {
  transferAmount: number; // Amount transferred to skip generations
  exemption: number; // 2024 GSTT exemption, e.g., $13,610,000
}

interface GSTTOuput {
  taxDue: number;
}

interface ILITBenefitInput {
  policyDeathBenefit: number; // Life insurance death benefit
  estateValue: number; // Total estate
}

interface ILITBenefitOutput {
  estateReduction: number; // Reduction in taxable estate
}

interface GRATInput {
  initialContribution: number; // Amount contributed to GRAT
  annuityRate: number; // Annuity payment rate
  section7520Rate: number; // 2024 rate, e.g., 5.2%
  termYears: number;
}

interface GRATOutput {
  remainderInterest: number; // Value after term
}

interface CRUTTaxDeductionInput {
  trustValue: number; // Initial trust value
  payoutRate: number; // Annual payout rate, e.g., 5%
  section7520Rate: number; // E.g., 5.2%
}

interface CRUTTaxDeductionOutput {
  deductionAmount: number; // Tax deduction for donor
}

interface CRATPresentValueInput {
  annuityAmount: number; // Annual annuity
  termYears: number;
  section7520Rate: number; // E.g., 5.2%
}

interface CRATPresentValueOutput {
  presentValue: number;
}

interface FamilyLimitedPartnershipInput {
  assetValue: number; // Asset value before discount
  discountRate: number; // Typical discount, e.g., 20-30% for 2024
}

interface FamilyLimitedPartnershipOutput {
  discountedValue: number;
}

interface AnnualGiftTaxInput {
  giftsPerPerson: number; // Number of recipients
  giftAmountPerPerson: number; // Amount per person
  exclusionPerPerson: number; // 2024: $18,000
}

interface AnnualGiftTaxOutput {
  taxFreeAmount: number;
  taxableAmount: number;
}

interface UnifiedCreditInput {
  giftsMade: number; // Total gifts using unified credit
  estateValue: number;
  exemption: number; // 2024: $13,610,000
}

interface UnifiedCreditOutput {
  creditRemaining: number;
}

interface StateEstateTaxInput {
  state: string; // E.g., 'New York', 'California' (which has none)
  estateValue: number;
  stateExemption: number; // Varies, e.g., NY: $0 for inheritance tax
}

interface StateEstateTaxOutput {
  stateTaxDue: number;
}

interface TrustDistributionInput {
  trustValue: number;
  distributionRate: number; // Annual rate, e.g., 4%
  years: number;
  growthRate: number; // Assumed growth, e.g., 3%
}

interface TrustDistributionOutput {
  futureDistributions: number[]; // Array of annual distributions
}

// Insurance Needs Functions

export function calculateHumanLifeValue(input: HumanLifeValueInput): HumanLifeValueOutput {
  // Human Life Value: Present value of future income stream
  // Formula: PV = Σ (Income * (1 + inflation)^t / (1 + discount)^t) for t=1 to yearsToRetirement
  let pv = 0;
  for (let t = 1; t <= input.yearsToRetirement; t++) {
    pv += input.annualIncome * Math.pow(1 + input.inflationRate / 100, t) / Math.pow(1 + input.discountRate / 100, t);
  }
  return { presentValue: pv };
}

export function calculateCapitalNeeds(input: CapitalNeedsInput): CapitalNeedsOutput {
  // Capital Needs: Lump sum to generate annual income replacement
  // Adjusted for taxes: Net income = gross * ratio * (1 - taxRate)
  const netAnnualIncome = input.annualIncome * input.incomeReplacementRatio * (1 - input.taxRate / 100);
  const lumpSum = netAnnualIncome * ((1 - Math.pow(1 + 0.04, -input.replacementYears)) / 0.04); // Assuming 4% withdrawal rate for 2024
  return { lumpSumNeeded: lumpSum };
}

export function calculateIncomeReplacementRatio(input: IncomeReplacementRatioInput): IncomeReplacementRatioOutput {
  // Income Replacement Ratio: 60-80% of gross income, adjusted for taxes
  // Use midpoint 70% as base, adjust for taxes
  const grossAdjusted = input.grossIncome * 0.7; // 60-80% range
  const netAdjusted = grossAdjusted * (1 - input.taxRate / 100);
  return { adjustedIncome: netAdjusted };
}

export function calculateMortgagePayoff(input: MortgagePayoffInput): MortgagePayoffOutput {
  // Mortgage Payoff: Future value of remaining payments
  // Formula: FV = P * [(1 + r)^n - 1] / r, where P is payment
  const monthlyRate = input.annualInterestRate / 12 / 100;
  const paymentsLeft = input.remainingYears * 12;
  const monthlyPayment = (input.principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -paymentsLeft));
  const payoff = input.principal * Math.pow(1 + monthlyRate, paymentsLeft) - (monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsLeft) - 1) / monthlyRate));
  return { payoffAmount: payoff };
}

export function calculateEducationFunding(input: EducationFundingInput): EducationFundingOutput {
  // Education Funding: Future cost inflated
  // Formula: Future Cost = Current Cost * (1 + inflation)^years * yearsOfEducation
  const futureAnnualCost = input.currentCost * Math.pow(1 + input.inflationRate / 100, input.yearsUntilNeeded);
  const totalFutureCost = futureAnnualCost * input.yearsOfEducation;
  return { futureCost: totalFutureCost };
}

export function calculateCoverageGap(input: CoverageGapInput): CoverageGapOutput {
  // Coverage Gap: Difference between required and existing coverage
  const gap = input.requiredCoverage - input.currentCoverage;
  return { gapAmount: gap > 0 ? gap : 0 };
}

export function calculateDisabilityIncome(input: DisabilityIncomeInput): DisabilityIncomeOutput {
  // Disability Income: Annual benefit needed
  // Formula: Annual Benefit = Annual Income * Ratio * Inflation adjustment
  const adjustedBenefit = input.annualIncome * input.replacementRatio * Math.pow(1 + input.inflationRate / 100, input.disabilityPeriod);
  return { annualBenefitNeeded: adjustedBenefit / input.disabilityPeriod };
}

export function projectLongTermCareCost(input: LongTermCareInput): LongTermCareOutput {
  // Long-Term Care Cost Projection: Varies by state, inflate base cost
  // 2024 averages: CA ~$100,000/year, NY ~$90,000/year
  let baseCost = 0;
  if (input.state === 'California') baseCost = 100000;
  else if (input.state === 'New York') baseCost = 90000;
  else baseCost = input.annualCost; // Default
  const projectedCost = baseCost * Math.pow(1 + input.inflationRate / 100, input.yearsProjected);
  return { projectedAnnualCost: projectedCost };
}

export function compareLifeInsurance(input: LifeInsuranceComparisonInput): LifeInsuranceComparisonOutput {
  // Life Insurance Comparison: Term (pure death benefit), Whole (cash value), Universal (flexible)
  const totalCostTerm = input.annualPremiumTerm * input.termYears;
  const cashValueWhole = input.coverageAmount * (1 + input.interestRate / 100) ** input.termYears;
  const cashValueUniversal = input.coverageAmount * (1 + input.interestRate / 100) ** (input.termYears * 0.8); // Universal grows slower
  return { totalCostTerm, cashValueWhole, cashValueUniversal };
}

export function assessUmbrellaLiability(input: UmbrellaLiabilityInput): UmbrellaLiabilityOutput {
  // Umbrella Liability: Recommend based on assets and risks
  // Formula: Recommended = Assets * riskFactors - existingLiability
  const recommended = input.assets * input.riskFactors - input.existingLiability;
  return { recommendedCoverage: recommended };
}

// Estate Planning Functions

export function calculateFederalEstateTax(input: FederalEstateTaxInput): FederalEstateTaxOutput {
  // Federal Estate Tax: 2024 exemption $13,610,000, rates up to 40%
  const exemption = 13610000;
  const taxableEstate = input.estateValue > exemption ? input.estateValue - exemption : 0;
  let taxDue = 0;
  if (taxableEstate > 0) {
    taxDue = taxableEstate * 0.40; // Simplified flat rate for 2024 over exemption
  }
  return { taxDue, exemptionUsed: Math.min(input.estateValue, exemption) };
}

export function calculatePortabilityElection(input: PortabilityElectionInput): PortabilityElectionOutput {
  // Portability: DSUE = Deceased exemption minus deceased estate
  const deceasedExemption = 13610000; // 2024
  const dsue = deceasedExemption - input.deceasedEstate;
  return { dsueAmount: dsue > 0 ? dsue : 0 };
}

export function calculateGSTT(input: GSTTInput): GSTTOuput {
  // GSTT: Tax on transfers skipping generations, 2024 rate 40% over exemption
  const exemption = 13610000;
  const taxableTransfer = input.transferAmount > exemption ? input.transferAmount - exemption : 0;
  const taxDue = taxableTransfer * 0.40;
  return { taxDue };
}

export function calculateILITBenefit(input: ILITBenefitInput): ILITBenefitOutput {
  // ILIT Benefit: Reduces taxable estate by death benefit amount
  const estateReduction = input.policyDeathBenefit;
  return { estateReduction };
}

export function calculateGRATRemainder(input: GRATInput): GRATOutput {
  // GRAT Remainder: Using Section 7520 rate for 2024, e.g., 5.2%
  const futureValue = input.initialContribution * Math.pow(1 + input.section7520Rate / 100, input.termYears);
  const remainder = futureValue - (input.annuityRate * input.initialContribution * ((1 - Math.pow(1 + input.section7520Rate / 100, -input.termYears)) / (input.section7520Rate / 100)));
  return { remainderInterest: remainder };
}

export function calculateCRUTTaxDeduction(input: CRUTTaxDeductionInput): CRUTTaxDeductionOutput {
  // CRUT Tax Deduction: Present value of remainder interest
  const remainderFactor = 1 - (input.payoutRate / input.section7520Rate);
  const deductionAmount = input.trustValue * remainderFactor;
  return { deductionAmount };
}

export function calculateCRATPresentValue(input: CRATPresentValueInput): CRATPresentValueOutput {
  // CRAT Present Value: Annuity stream discounted
  let pv = 0;
  for (let t = 1; t <= input.termYears; t++) {
    pv += input.annuityAmount / Math.pow(1 + input.section7520Rate / 100, t);
  }
  return { presentValue: pv };
}

export function calculateFamilyLimitedPartnership(input: FamilyLimitedPartnershipInput): FamilyLimitedPartnershipOutput {
  // Family Limited Partnership: Apply discount for valuation
  const discountedValue = input.assetValue * (1 - input.discountRate / 100);
  return { discountedValue };
}

export function optimizeAnnualGiftTax(input: AnnualGiftTaxInput): AnnualGiftTaxOutput {
  // Annual Gift Tax: Optimize using 2024 exclusion of $18,000 per person
  const taxFree = input.giftsPerPerson * input.exclusionPerPerson;
  const taxable = input.giftAmountPerPerson * input.giftsPerPerson - taxFree;
  return { taxFreeAmount: taxFree, taxableAmount: taxable > 0 ? taxable : 0 };
}

export function trackUnifiedCredit(input: UnifiedCreditInput): UnifiedCreditOutput {
  // Unified Credit: Track remaining after gifts and estate
  const totalExemptionUsed = input.giftsMade + Math.min(input.estateValue, input.exemption);
  const creditRemaining = input.exemption - totalExemptionUsed;
  return { creditRemaining: creditRemaining > 0 ? creditRemaining : 0 };
}

export function calculateStateEstateTax(input: StateEstateTaxInput): StateEstateTaxOutput {
  // State Estate Tax: Varies by state, e.g., NY has rates up to 16%
  let stateTaxDue = 0;
  if (input.state === 'New York') {
    const nyExemption = 0; // NY has no exemption for inheritance
    stateTaxDue = input.estateValue * 0.16; // Simplified
  } else if (input.state === 'Massachusetts') {
    stateTaxDue = Math.max(0, input.estateValue - 2000000) * 0.12; // Example for MA
  } // Add more states as needed
  return { stateTaxDue };
}

export function modelTrustDistribution(input: TrustDistributionInput): TrustDistributionOutput {
  // Trust Distribution: Project annual distributions with growth
  const distributions: number[] = [];
  let currentValue = input.trustValue;
  for (let year = 1; year <= input.years; year++) {
    const distribution = currentValue * (input.distributionRate / 100);
    currentValue = (currentValue - distribution) * (1 + input.growthRate / 100);
    distributions.push(distribution);
  }
  return { futureDistributions: distributions };
}