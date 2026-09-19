/**
 * SISTER INVENTION SI-021: Automated Compliance Document Generator
 * Patent Reference: Extends PAT-015 (Practice Management Platform)
 * 
 * Auto-generates state-specific compliance forms, disclosures,
 * and suitability documentation for insurance transactions.
 */

export interface TransactionDetails {
  type: "new_business" | "replacement" | "exchange_1035" | "annuity" | "ltc";
  state: string;
  clientName: string;
  clientAge: number;
  clientIncome: number;
  clientNetWorth: number;
  productType: string;
  carrier: string;
  premium: number;
  isReplacement: boolean;
  existingPolicyCarrier?: string;
  existingPolicyType?: string;
  advisorName: string;
  advisorLicense: string;
  advisorNPN: string;
}

export interface ComplianceDocument {
  title: string;
  type: "disclosure" | "suitability" | "replacement" | "acknowledgment" | "notice";
  requiredBy: string;
  content: string;
  signatureRequired: boolean;
  clientSignature: boolean;
  advisorSignature: boolean;
  filingDeadline: string;
  regulatoryReference: string;
}

export interface CompliancePackage {
  documents: ComplianceDocument[];
  totalDocuments: number;
  stateSpecificRequirements: string[];
  filingInstructions: string[];
  complianceScore: number;      // 0-100
  missingDocuments: string[];
}

// State-specific replacement form requirements
const STATE_REQUIREMENTS: Record<string, string[]> = {
  VA: ["Replacement Notice (NAIC Model)", "Suitability Form", "Free Look Notice"],
  CA: ["Replacement Notice", "Suitability Questionnaire", "Senior Designation Disclosure"],
  TX: ["Replacement Notice", "Suitability Form", "Outline of Coverage"],
  FL: ["Replacement Notice", "Suitability Form", "Buyer's Guide"],
  NY: ["Replacement Notice (Reg 60)", "Suitability Form", "Policy Summary", "Buyer's Guide"],
  IL: ["Replacement Notice", "Suitability Form", "Free Look Notice"],
  PA: ["Replacement Notice", "Suitability Form", "Buyer's Guide"],
  NJ: ["Replacement Notice", "Suitability Form", "Senior Protection Notice"],
  MD: ["Replacement Notice", "Suitability Form", "Buyer's Guide"],
  NC: ["Replacement Notice", "Suitability Form", "Free Look Notice"],
};

/**
 * Generate compliance document package for a transaction
 */
export function generateCompliancePackage(transaction: TransactionDetails): CompliancePackage {
  const documents: ComplianceDocument[] = [];
  const stateReqs = STATE_REQUIREMENTS[transaction.state] ?? ["Replacement Notice", "Suitability Form"];

  // 1. Suitability Form (always required)
  documents.push({
    title: `Insurance Suitability Information Form — ${transaction.state}`,
    type: "suitability",
    requiredBy: `${transaction.state} Department of Insurance`,
    content: generateSuitabilityContent(transaction),
    signatureRequired: true,
    clientSignature: true,
    advisorSignature: true,
    filingDeadline: "At time of application",
    regulatoryReference: "NAIC Model Regulation 275-1 (Suitability in Annuity Transactions)",
  });

  // 2. Replacement Notice (if applicable)
  if (transaction.isReplacement) {
    documents.push({
      title: `Notice Regarding Replacement of Life Insurance — ${transaction.state}`,
      type: "replacement",
      requiredBy: `${transaction.state} DOI — NAIC Model 613`,
      content: generateReplacementContent(transaction),
      signatureRequired: true,
      clientSignature: true,
      advisorSignature: true,
      filingDeadline: "Before application submission",
      regulatoryReference: "NAIC Model Regulation 613 (Life Insurance and Annuity Replacement)",
    });
  }

  // 3. Free Look Notice
  documents.push({
    title: "Free Look Period Notice",
    type: "notice",
    requiredBy: `${transaction.state} Insurance Code`,
    content: `IMPORTANT NOTICE: You have the right to examine your policy for a period of ${transaction.clientAge >= 60 ? "30" : "10"} days from the date of delivery. If you are not satisfied, you may return the policy for a full refund of premium paid.\n\nClient: ${transaction.clientName}\nProduct: ${transaction.productType}\nCarrier: ${transaction.carrier}\nPremium: $${transaction.premium.toLocaleString()}\n\nThis notice is provided in accordance with ${transaction.state} insurance regulations.`,
    signatureRequired: true,
    clientSignature: true,
    advisorSignature: false,
    filingDeadline: "At policy delivery",
    regulatoryReference: `${transaction.state} Insurance Code — Free Look Provision`,
  });

  // 4. Buyer's Guide
  documents.push({
    title: `Life Insurance Buyer's Guide`,
    type: "disclosure",
    requiredBy: "NAIC",
    content: `BUYER'S GUIDE TO LIFE INSURANCE\n\nThis guide is designed to help you understand the basics of life insurance and how to compare policies.\n\nProduct Type: ${transaction.productType}\nCarrier: ${transaction.carrier}\nDeath Benefit: See illustration\nPremium: $${transaction.premium.toLocaleString()}/year\n\nIMPORTANT: This is not a contract. Please read your policy carefully.`,
    signatureRequired: false,
    clientSignature: false,
    advisorSignature: false,
    filingDeadline: "At or before policy delivery",
    regulatoryReference: "NAIC Life Insurance Buyer's Guide",
  });

  // 5. 1035 Exchange Form (if applicable)
  if (transaction.type === "exchange_1035") {
    documents.push({
      title: "IRC §1035 Tax-Free Exchange Request",
      type: "acknowledgment",
      requiredBy: "IRS / Carrier",
      content: `TAX-FREE EXCHANGE REQUEST\n\nPursuant to IRC §1035, I request a tax-free exchange from:\n\nExisting Policy: ${transaction.existingPolicyCarrier ?? "N/A"} — ${transaction.existingPolicyType ?? "N/A"}\nNew Policy: ${transaction.carrier} — ${transaction.productType}\n\nI understand that:\n1. This exchange is tax-free under IRC §1035\n2. Any outstanding loans may create a taxable event\n3. A new contestability period will apply\n4. Surrender charges may apply to the existing policy\n\nClient: ${transaction.clientName}\nAdvisor: ${transaction.advisorName} (NPN: ${transaction.advisorNPN})`,
      signatureRequired: true,
      clientSignature: true,
      advisorSignature: true,
      filingDeadline: "Before exchange processing",
      regulatoryReference: "IRC §1035 — Tax-free exchange of insurance contracts",
    });
  }

  // 6. Senior-specific disclosures
  if (transaction.clientAge >= 65) {
    documents.push({
      title: "Senior Client Disclosure and Acknowledgment",
      type: "disclosure",
      requiredBy: `${transaction.state} Senior Protection Regulation`,
      content: `SENIOR CLIENT DISCLOSURE\n\nAs a client age 65 or older, you have additional protections:\n\n1. Extended free look period (30 days)\n2. Right to have a trusted person present during sales presentation\n3. Suitability review by carrier compliance department\n4. Right to cancel within 30 days for full refund\n\nClient: ${transaction.clientName}, Age: ${transaction.clientAge}\nAdvisor: ${transaction.advisorName}\n\nI acknowledge that I have been informed of my rights as a senior policyholder.`,
      signatureRequired: true,
      clientSignature: true,
      advisorSignature: true,
      filingDeadline: "At time of application",
      regulatoryReference: "NAIC Suitability in Annuity Transactions Model Regulation — Senior Provisions",
    });
  }

  const stateSpecific = stateReqs.map(req => `${transaction.state}: ${req} — Required`);
  const missing = stateReqs.filter(req => !documents.some(d => d.title.toLowerCase().includes(req.toLowerCase().split(" ")[0])));
  const complianceScore = Math.round(((stateReqs.length - missing.length) / stateReqs.length) * 100);

  return {
    documents,
    totalDocuments: documents.length,
    stateSpecificRequirements: stateSpecific,
    filingInstructions: [
      "Submit all signed documents with application to carrier",
      `File replacement notice with ${transaction.state} DOI within 10 business days`,
      "Retain copies for 5 years minimum",
      "E-signatures accepted per UETA/ESIGN Act",
    ],
    complianceScore,
    missingDocuments: missing,
  };
}

function generateSuitabilityContent(t: TransactionDetails): string {
  return `INSURANCE SUITABILITY INFORMATION FORM\nState: ${t.state}\n\nCLIENT INFORMATION:\nName: ${t.clientName}\nAge: ${t.clientAge}\nAnnual Income: $${t.clientIncome.toLocaleString()}\nNet Worth: $${t.clientNetWorth.toLocaleString()}\n\nPRODUCT INFORMATION:\nType: ${t.productType}\nCarrier: ${t.carrier}\nAnnual Premium: $${t.premium.toLocaleString()}\nPremium-to-Income Ratio: ${((t.premium / t.clientIncome) * 100).toFixed(1)}%\n\nSUITABILITY ANALYSIS:\n- Premium is ${t.premium / t.clientIncome < 0.15 ? "within" : "ABOVE"} recommended 15% of income guideline\n- Client age ${t.clientAge >= 65 ? "triggers senior suitability review" : "within standard parameters"}\n- Replacement: ${t.isReplacement ? "YES — additional disclosure required" : "No"}\n\nADVISOR CERTIFICATION:\nI certify that I have made reasonable efforts to obtain the above information and that the recommended product is suitable.\n\nAdvisor: ${t.advisorName}\nLicense: ${t.advisorLicense}\nNPN: ${t.advisorNPN}`;
}

function generateReplacementContent(t: TransactionDetails): string {
  return `NOTICE REGARDING REPLACEMENT OF LIFE INSURANCE OR ANNUITY\n\nIMPORTANT: You are being asked to replace existing insurance coverage.\n\nEXISTING COVERAGE:\nCarrier: ${t.existingPolicyCarrier ?? "N/A"}\nType: ${t.existingPolicyType ?? "N/A"}\n\nPROPOSED REPLACEMENT:\nCarrier: ${t.carrier}\nType: ${t.productType}\nPremium: $${t.premium.toLocaleString()}\n\nIMPORTANT CONSIDERATIONS:\n1. You may incur surrender charges on your existing policy\n2. A new contestability period (typically 2 years) will apply\n3. You may lose valuable benefits or guarantees\n4. Your new policy may have different terms and conditions\n5. There may be tax consequences\n\nYOU HAVE THE RIGHT TO:\n- Compare both policies before making a decision\n- Contact your existing carrier for current policy values\n- Cancel the replacement within the free look period\n\nClient: ${t.clientName}\nAdvisor: ${t.advisorName} (NPN: ${t.advisorNPN})`;
}
