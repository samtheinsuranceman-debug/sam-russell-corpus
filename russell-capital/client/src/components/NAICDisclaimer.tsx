import { AlertTriangle, Shield, Info } from "lucide-react";
import { useDisclaimer } from "@/contexts/DisclaimerContext";

/**
 * NAIC AG 49-A/B Compliance Disclaimer Component
 * 
 * Required on every page that displays IUL-related calculations, projections,
 * illustrations, or comparisons. Ensures regulatory compliance with:
 * - NAIC Actuarial Guideline 49-A (2020) and 49-B (2024)
 * - State insurance department illustration regulations
 * - SEC/FINRA guidance on non-securities product marketing
 */

type DisclaimerVariant = "full" | "compact" | "inline" | "footer";

interface NAICDisclaimerProps {
  /** Which variant to render */
  variant?: DisclaimerVariant;
  /** Additional context-specific disclaimer text */
  additionalText?: string;
  /** Whether the page shows historical index data */
  showsHistoricalData?: boolean;
  /** Whether the page shows projected/illustrated values */
  showsProjections?: boolean;
  /** Whether the page compares IUL to other products */
  showsComparisons?: boolean;
  /** Whether the page references policy loans */
  showsPolicyLoans?: boolean;
  /** Whether the page references cash/accumulation values */
  showsCashValues?: boolean;
  /** Custom className */
  className?: string;
}

const CORE_DISCLAIMER = "This material is for educational and illustrative purposes only and does not constitute a guarantee of future performance. Indexed Universal Life (IUL) insurance products are not securities and are not registered with the SEC. Policy values are subject to the claims-paying ability of the issuing insurance carrier. www.RussellCapitalSystems.com is owned and operated by Russell Holdings Management LLC.";

const HISTORICAL_DISCLAIMER = "Historical index performance data shown reflects what would have been credited to a hypothetical policy based on the index parameters displayed. Past index performance is not indicative of future results. Actual credited rates depend on the specific policy's cap rate, participation rate, floor, and spread at the time of each policy anniversary.";

const PROJECTION_DISCLAIMER = "Projected values are hypothetical illustrations based on assumed rates of return and are not guaranteed. Actual results will vary based on market conditions, policy charges, cost of insurance, and the financial strength of the issuing carrier. These illustrations comply with NAIC Actuarial Guideline 49-A and 49-B requirements.";

const COMPARISON_DISCLAIMER = "Product comparisons are simplified for educational purposes and may not reflect all features, benefits, limitations, or costs of each product type. IUL policies have costs including premium loads, cost of insurance charges, administrative fees, and surrender charges that affect policy values. Consult a licensed insurance professional for personalized recommendations.";

const POLICY_LOAN_DISCLAIMER = "Policy loans accrue interest and reduce the death benefit and cash surrender value. Loans that exceed the policy's cost basis may be subject to income tax. If a policy lapses with an outstanding loan, the loan amount may be treated as taxable income. Tax-free treatment of policy loans assumes the policy is not a Modified Endowment Contract (MEC).";

const CASH_VALUE_DISCLAIMER = "Accumulation values shown are hypothetical and reflect illustrated, non-guaranteed elements. Actual policy values will differ based on the timing and amount of premium payments, current interest crediting rates, policy charges, and cost of insurance. Surrender charges may apply during the early policy years.";

export function NAICDisclaimer({
  variant = "full",
  additionalText,
  showsHistoricalData = false,
  showsProjections = false,
  showsComparisons = false,
  showsPolicyLoans = false,
  showsCashValues = false,
  className = "",
}: NAICDisclaimerProps) {
  const { showDisclaimers } = useDisclaimer();
  if (!showDisclaimers) return null;

  if (variant === "inline") {
    return (
      <p className={`text-[10px] text-muted-foreground/60 italic ${className}`}>
        <Info className="w-3 h-3 inline mr-1 -mt-0.5" />
        {CORE_DISCLAIMER}
        {additionalText && ` ${additionalText}`}
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 ${className}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500/60 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-amber-500/80">Important Disclosure</p>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{CORE_DISCLAIMER}</p>
            {showsPolicyLoans && (
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{POLICY_LOAN_DISCLAIMER}</p>
            )}
            {additionalText && (
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{additionalText}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`mt-6 pt-4 border-t border-border/20 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-muted-foreground/40" />
          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Regulatory Compliance — NAIC AG 49-A/B</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{CORE_DISCLAIMER}</p>
          {showsHistoricalData && (
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{HISTORICAL_DISCLAIMER}</p>
          )}
          {showsProjections && (
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{PROJECTION_DISCLAIMER}</p>
          )}
          {showsPolicyLoans && (
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{POLICY_LOAN_DISCLAIMER}</p>
          )}
          {showsCashValues && (
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{CASH_VALUE_DISCLAIMER}</p>
          )}
          {showsComparisons && (
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{COMPARISON_DISCLAIMER}</p>
          )}
          {additionalText && (
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{additionalText}</p>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`mt-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-amber-500/60" />
        <p className="text-xs font-medium text-amber-500/80">Important Regulatory Disclosures — NAIC AG 49-A/B Compliance</p>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{CORE_DISCLAIMER}</p>
        {showsHistoricalData && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{HISTORICAL_DISCLAIMER}</p>
        )}
        {showsProjections && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{PROJECTION_DISCLAIMER}</p>
        )}
        {showsComparisons && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{COMPARISON_DISCLAIMER}</p>
        )}
        {showsPolicyLoans && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{POLICY_LOAN_DISCLAIMER}</p>
        )}
        {showsCashValues && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{CASH_VALUE_DISCLAIMER}</p>
        )}
        {additionalText && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{additionalText}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Small inline compliance badge for section headers
 */
export function ComplianceBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-500/70 border border-amber-500/15 ${className}`}>
      <Shield className="w-2.5 h-2.5" />
      NAIC AG 49 Compliant
    </span>
  );
}

export default NAICDisclaimer;
