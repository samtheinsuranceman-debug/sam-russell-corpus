/**
 * SISTER INVENTION SI-026: Automated Client Onboarding Workflow
 * Patent Reference: Extends PAT-015 (Practice Management Platform)
 * 
 * Streamlines new client intake with automated document collection,
 * needs analysis, and product recommendation workflow.
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  requiredDocuments: string[];
  estimatedMinutes: number;
  automatable: boolean;
}

export interface OnboardingProfile {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  dateOfBirth: string;
  ssn: string;           // Last 4 only for display
  address: string;
  occupation: string;
  employer: string;
  income: number;
  netWorth: number;
  dependents: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  investmentExperience: "none" | "limited" | "moderate" | "extensive";
  insuranceGoals: string[];
  existingPolicies: { type: string; carrier: string; premium: number }[];
}

export interface OnboardingResult {
  steps: OnboardingStep[];
  completionPercent: number;
  estimatedTimeRemaining: number;
  nextStep: OnboardingStep;
  documentsNeeded: string[];
  automatedActions: string[];
  recommendedProducts: string[];
}

/**
 * Generate onboarding workflow for new client
 */
export function generateOnboardingWorkflow(profile: OnboardingProfile): OnboardingResult {
  const steps: OnboardingStep[] = [
    {
      id: "intake",
      title: "Client Information Intake",
      description: "Collect personal, financial, and employment information",
      status: profile.clientName ? "completed" : "pending",
      requiredDocuments: ["Government ID", "Proof of Income (W-2 or Tax Return)"],
      estimatedMinutes: 15,
      automatable: true,
    },
    {
      id: "kyc",
      title: "Know Your Customer (KYC) Verification",
      description: "Verify identity and run background checks",
      status: "pending",
      requiredDocuments: ["Driver's License or Passport", "Utility Bill (address verification)"],
      estimatedMinutes: 5,
      automatable: true,
    },
    {
      id: "needs_analysis",
      title: "Financial Needs Analysis",
      description: "Comprehensive assessment of insurance and financial planning needs",
      status: "pending",
      requiredDocuments: ["Existing policy declarations", "Investment account statements", "Estate planning documents"],
      estimatedMinutes: 30,
      automatable: false,
    },
    {
      id: "risk_assessment",
      title: "Risk Tolerance Assessment",
      description: "Determine appropriate product recommendations based on risk profile",
      status: profile.riskTolerance ? "completed" : "pending",
      requiredDocuments: [],
      estimatedMinutes: 10,
      automatable: true,
    },
    {
      id: "product_recommendation",
      title: "Product Recommendation & Illustration",
      description: "Generate personalized product recommendations with illustrations",
      status: "pending",
      requiredDocuments: [],
      estimatedMinutes: 20,
      automatable: true,
    },
    {
      id: "compliance_docs",
      title: "Compliance Documentation",
      description: "Generate and collect required regulatory documents",
      status: "pending",
      requiredDocuments: ["Suitability form", "Disclosure acknowledgments"],
      estimatedMinutes: 15,
      automatable: true,
    },
    {
      id: "application",
      title: "Application Submission",
      description: "Complete and submit insurance application to carrier",
      status: "pending",
      requiredDocuments: ["Completed application", "Medical questionnaire", "Payment authorization"],
      estimatedMinutes: 20,
      automatable: false,
    },
    {
      id: "underwriting",
      title: "Underwriting Follow-Up",
      description: "Track application through underwriting process",
      status: "pending",
      requiredDocuments: ["Medical records (if requested)", "Lab results"],
      estimatedMinutes: 5,
      automatable: true,
    },
    {
      id: "policy_delivery",
      title: "Policy Delivery & Review",
      description: "Deliver policy, review coverage, and confirm understanding",
      status: "pending",
      requiredDocuments: ["Signed delivery receipt", "Free look acknowledgment"],
      estimatedMinutes: 30,
      automatable: false,
    },
    {
      id: "welcome",
      title: "Welcome & Ongoing Service Setup",
      description: "Set up client portal, schedule first annual review",
      status: "pending",
      requiredDocuments: [],
      estimatedMinutes: 10,
      automatable: true,
    },
  ];

  const completed = steps.filter(s => s.status === "completed").length;
  const completionPct = Math.round((completed / steps.length) * 100);
  const remaining = steps.filter(s => s.status !== "completed").reduce((s, step) => s + step.estimatedMinutes, 0);
  const nextStep = steps.find(s => s.status !== "completed") ?? steps[0];
  const docsNeeded = steps.filter(s => s.status !== "completed").flatMap(s => s.requiredDocuments);

  // Product recommendations based on profile
  const products: string[] = [];
  if (profile.income > 200000) products.push("Indexed Universal Life (IUL)");
  if (profile.income > 100000 && profile.dependents > 0) products.push("Term Life Insurance");
  if (profile.netWorth > 1000000) products.push("Estate Planning with ILIT");
  if (profile.income > 150000) products.push("Disability Income Insurance");
  if (profile.existingPolicies.length > 0) products.push("Policy Review & Optimization");
  if (products.length === 0) products.push("Comprehensive Financial Review");

  const automatedActions = [
    "Auto-generate KYC verification request",
    "Pre-fill application from intake data",
    "Auto-generate compliance document package",
    "Schedule underwriting follow-up reminders",
    "Auto-send welcome email with portal access",
  ];

  return {
    steps,
    completionPercent: completionPct,
    estimatedTimeRemaining: remaining,
    nextStep,
    documentsNeeded: Array.from(new Set(docsNeeded)),
    automatedActions,
    recommendedProducts: products,
  };
}
