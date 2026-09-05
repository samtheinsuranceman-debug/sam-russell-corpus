import { Shield, Scale, Building2, FileText, ExternalLink } from "lucide-react";
import { useDisclaimer } from "@/contexts/DisclaimerContext";

/**
 * ComplianceFooter — Universal compliance footer for ALL calculator/financial pages.
 * 
 * Combines:
 *   1. NAIC AG 49-A/B citations with source links
 *   2. Russell Holdings Management LLC ownership statement
 *   3. Context-specific disclaimers based on page content type
 *   4. SEC/FINRA non-securities clarification
 * 
 * Drop this at the bottom of every financial calculator page.
 * It respects the global disclaimer toggle from DisclaimerContext.
 */

interface ComplianceFooterProps {
  /** Page name for citation reference */
  pageName?: string;
  /** Shows IUL-specific NAIC AG 49 disclaimers */
  showsIUL?: boolean;
  /** Shows annuity-related disclaimers */
  showsAnnuity?: boolean;
  /** Shows tax-related disclaimers */
  showsTax?: boolean;
  /** Shows estate/beneficiary disclaimers */
  showsEstate?: boolean;
  /** Shows projected/illustrated values */
  showsProjections?: boolean;
  /** Shows historical data */
  showsHistoricalData?: boolean;
  /** Shows policy loan information */
  showsPolicyLoans?: boolean;
  /** Additional context-specific text */
  additionalText?: string;
  className?: string;
}

const SECTIONS = {
  ownership: {
    icon: Building2,
    title: "Ownership & Operation",
    text: "www.RussellCapitalSystems.com is owned and operated by Russell Holdings Management LLC. Russell Capital Solutions™ is a registered trademark of Russell Holdings Management LLC. All content, tools, calculators, and financial illustrations provided on this platform are proprietary to Russell Holdings Management LLC.",
  },
  naic: {
    icon: Scale,
    title: "NAIC Regulatory Compliance",
    text: "All indexed universal life (IUL) illustrations on this platform comply with the National Association of Insurance Commissioners (NAIC) Actuarial Guideline 49-A (adopted 2020) and Actuarial Guideline 49-B (adopted 2024). These guidelines establish maximum illustrated rates, benchmark index account requirements, and supplemental illustration standards for IUL products.",
    source: "Source: NAIC Model Regulation Service, AG 49-A/B — www.naic.org",
  },
  nonSecurities: {
    icon: Shield,
    title: "Securities Disclaimer",
    text: "Insurance products including Indexed Universal Life (IUL), Fixed Indexed Annuities (FIA), and Multi-Year Guaranteed Annuities (MYGA) are NOT securities and are NOT registered with the Securities and Exchange Commission (SEC). These products are regulated by state insurance departments. Policy values and guarantees are subject to the claims-paying ability of the issuing insurance carrier.",
  },
  projections: {
    icon: FileText,
    title: "Projection & Illustration Disclaimer",
    text: "All projected values, hypothetical illustrations, and scenario analyses shown on this platform are for educational and illustrative purposes only and do not constitute a guarantee of future performance. Actual results will vary based on market conditions, policy charges, cost of insurance, carrier financial strength, and individual circumstances. Past index performance is not indicative of future results.",
  },
  tax: {
    icon: Scale,
    title: "Tax Information Disclaimer",
    text: "Tax information provided is for general educational purposes only and should not be construed as tax advice. Tax laws are complex and subject to change. Consult a qualified tax professional regarding your specific situation. State tax rates and rules vary by jurisdiction. Federal tax brackets shown reflect current IRS schedules and may change with future legislation.",
  },
  annuity: {
    icon: Shield,
    title: "Annuity Product Disclaimer",
    text: "Annuity products are long-term financial vehicles designed for retirement purposes. Withdrawals prior to age 59½ may be subject to a 10% federal tax penalty. Surrender charges may apply during the early years of the contract. Guarantees are backed by the financial strength and claims-paying ability of the issuing insurance company, not by any government agency.",
  },
  estate: {
    icon: FileText,
    title: "Estate Planning Disclaimer",
    text: "Estate planning information is general in nature and should not be considered legal advice. Estate tax laws, exemption amounts, and planning strategies vary by state and are subject to legislative changes. Consult qualified legal and financial professionals for advice specific to your situation.",
  },
  policyLoans: {
    icon: Shield,
    title: "Policy Loan Disclaimer",
    text: "Policy loans accrue interest and reduce the death benefit and cash surrender value. Loans exceeding the policy's cost basis may be subject to income tax. If a policy lapses with an outstanding loan, the loan amount may be treated as taxable income. Tax-free treatment of policy loans assumes the policy is not a Modified Endowment Contract (MEC).",
  },
};

export function ComplianceFooter({
  pageName,
  showsIUL = false,
  showsAnnuity = false,
  showsTax = false,
  showsEstate = false,
  showsProjections = true,
  showsHistoricalData = false,
  showsPolicyLoans = false,
  additionalText,
  className = "",
}: ComplianceFooterProps) {
  const { showDisclaimers } = useDisclaimer();
  if (!showDisclaimers) return null;

  // Always show: ownership, nonSecurities, projections
  // Conditionally show: naic (IUL), tax, annuity, estate, policyLoans
  const activeSections = [
    SECTIONS.ownership,
    ...(showsIUL ? [SECTIONS.naic] : []),
    SECTIONS.nonSecurities,
    ...(showsProjections ? [SECTIONS.projections] : []),
    ...(showsTax ? [SECTIONS.tax] : []),
    ...(showsAnnuity ? [SECTIONS.annuity] : []),
    ...(showsEstate ? [SECTIONS.estate] : []),
    ...(showsPolicyLoans ? [SECTIONS.policyLoans] : []),
  ];

  return (
    <footer className={`mt-8 pt-6 border-t border-border/20 ${className}`} role="contentinfo" aria-label="Compliance disclosures">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-amber-500/60" />
        <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest">
          Regulatory Compliance & Disclosures
        </span>
        {pageName && (
          <span className="text-[9px] text-muted-foreground/40 ml-auto">
            {pageName}
          </span>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {activeSections.map((section, i) => (
          <div key={i} className="flex items-start gap-2">
            <section.icon className="w-3 h-3 text-muted-foreground/40 mt-0.5 shrink-0" />
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-0.5">
                {section.title}
              </p>
              <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                {section.text}
              </p>
              {(section as any).source && (
                <p className="text-[9px] text-amber-500/40 mt-0.5 italic">
                  {(section as any).source}
                </p>
              )}
            </div>
          </div>
        ))}

        {additionalText && (
          <div className="flex items-start gap-2">
            <FileText className="w-3 h-3 text-muted-foreground/40 mt-0.5 shrink-0" />
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
              {additionalText}
            </p>
          </div>
        )}
      </div>

      {/* Bottom line */}
      <div className="mt-4 pt-3 border-t border-border/10 flex items-center justify-between">
        <p className="text-[9px] text-muted-foreground/30">
          © {new Date().getFullYear()} Russell Holdings Management LLC d/b/a Russell Capital Solutions™. All rights reserved.
        </p>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/30">
          <Shield className="w-2.5 h-2.5" />
          <span>NAIC AG 49-A/B Compliant</span>
        </div>
      </div>
    </footer>
  );
}

export default ComplianceFooter;
