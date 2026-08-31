import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/NumberInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Flame, DollarSign, Shield, TrendingUp, Clock, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";

/* ─── TAX BRACKET DATA (2026 Federal) ─── */
const FEDERAL_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

function calcFederalTax(taxableIncome: number): number {
  let tax = 0;
  for (const bracket of FEDERAL_BRACKETS) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export interface OilGasResult {
  enabled: boolean;
  investmentAmount: number;
  annualReturn: number;
  lockupYears: number;
  annualIncome: number;
  year1TaxDeduction: number;
  year1TaxSavings: number;
  ongoingAnnualDepletion: number;
  principalReturnYear: number;
}

interface OilGasToggleProps {
  /** The user's taxable income (used for tax savings calculations) */
  taxableIncome?: number;
  /** Callback when O&G is toggled or settings change */
  onChange?: (result: OilGasResult) => void;
  /** Compact mode for embedding in tight spaces */
  compact?: boolean;
  /** Default investment amount */
  defaultInvestment?: number;
}

export function OilGasToggle({ taxableIncome = 250000, onChange, compact = false, defaultInvestment = 250000 }: OilGasToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState(defaultInvestment);
  const [annualReturn, setAnnualReturn] = useState(15);
  const [lockupYears, setLockupYears] = useState(10);

  const result = useMemo<OilGasResult>(() => {
    const annualIncome = Math.round(investmentAmount * (annualReturn / 100));
    const idcDeduction = Math.round(investmentAmount * 0.75);
    const tangibleYr1 = Math.round(investmentAmount * 0.15 / 7);
    const year1TaxDeduction = idcDeduction + tangibleYr1;
    const taxWithout = calcFederalTax(taxableIncome);
    const taxWith = calcFederalTax(Math.max(0, taxableIncome - year1TaxDeduction));
    const year1TaxSavings = taxWithout - taxWith;
    const ongoingAnnualDepletion = Math.round(annualIncome * 0.15);

    return {
      enabled,
      investmentAmount,
      annualReturn,
      lockupYears,
      annualIncome,
      year1TaxDeduction,
      year1TaxSavings,
      ongoingAnnualDepletion,
      principalReturnYear: lockupYears,
    };
  }, [enabled, investmentAmount, annualReturn, lockupYears, taxableIncome]);

  // Notify parent
  useState(() => {
    onChange?.(result);
  });

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    onChange?.({ ...result, enabled: checked });
  };

  const handleChange = (field: string, value: number) => {
    if (field === "investment") setInvestmentAmount(value);
    if (field === "return") setAnnualReturn(value);
    if (field === "lockup") setLockupYears(value);
    // onChange will be called via useMemo recalculation
    setTimeout(() => onChange?.(result), 0);
  };

  if (compact) {
    return (
      <div className={`relative rounded-xl transition-all duration-300 ${
        enabled
          ? "border-2 border-orange-400 bg-gradient-to-r from-orange-950/40 via-red-950/30 to-orange-950/40 shadow-lg shadow-orange-500/20 ring-1 ring-orange-400/30"
          : "border-2 border-orange-500/50 bg-gradient-to-r from-orange-950/20 via-transparent to-orange-950/20 shadow-md shadow-orange-500/10 hover:border-orange-400/70 hover:shadow-orange-500/20"
      }`}>
        {/* Top accent stripe */}
        <div className={`h-1 rounded-t-[10px] ${enabled ? "bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" : "bg-gradient-to-r from-orange-500/60 via-red-500/40 to-orange-500/60"}`} />

        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${enabled ? "bg-gradient-to-br from-orange-500 to-red-600 shadow-sm shadow-orange-500/30" : "bg-orange-500/20 border border-orange-500/40"}`}>
                <Flame className={`w-4 h-4 ${enabled ? "text-white" : "text-orange-400"}`} />
              </div>
              <Label className="text-sm font-bold cursor-pointer text-orange-300 hover:text-orange-200" onClick={() => handleToggle(!enabled)}>
                Oil & Gas Tax Optimization
              </Label>
              {enabled ? (
                <Badge className="bg-orange-600 text-white text-[10px] px-1.5 py-0 animate-pulse">Active</Badge>
              ) : (
                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] px-1.5 py-0">Click to Enable</Badge>
              )}
            </div>
            <Switch checked={enabled} onCheckedChange={handleToggle} />
          </div>
          {enabled && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-1.5 rounded bg-green-50 dark:bg-green-950/30">
                  <div className="text-muted-foreground">Annual Income</div>
                  <div className="font-bold text-green-600">{fmt(result.annualIncome)}</div>
                </div>
                <div className="text-center p-1.5 rounded bg-blue-50 dark:bg-blue-950/30">
                  <div className="text-muted-foreground">Yr 1 Tax Savings</div>
                  <div className="font-bold text-blue-600">{fmt(result.year1TaxSavings)}</div>
                </div>
                <div className="text-center p-1.5 rounded bg-amber-50 dark:bg-amber-950/30">
                  <div className="text-muted-foreground">Principal Back</div>
                  <div className="font-bold text-amber-600">Year {lockupYears}</div>
                </div>
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-orange-400 flex items-center gap-1 hover:underline hover:text-orange-300"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Hide details" : "Customize investment"}
              </button>
              {expanded && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-orange-500/20">
                  <div>
                    <Label className="text-[10px]">Investment</Label>
                    <NumberInput value={investmentAmount} onChange={v => handleChange("investment", v)} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Return %</Label>
                    <Select value={String(annualReturn)} onValueChange={v => handleChange("return", Number(v))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Lockup</Label>
                    <Select value={String(lockupYears)} onValueChange={v => handleChange("lockup", Number(v))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 yr</SelectItem>
                        <SelectItem value="11">11 yr</SelectItem>
                        <SelectItem value="12">12 yr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full-size version
  return (
    <div className={`relative rounded-xl transition-all duration-300 ${
      enabled
        ? "border-2 border-orange-400 shadow-lg shadow-orange-500/20 ring-1 ring-orange-400/30"
        : "border-2 border-orange-500/50 shadow-md shadow-orange-500/10 hover:border-orange-400/70 hover:shadow-orange-500/20"
    }`}>
      {/* Top accent stripe */}
      <div className={`h-1.5 rounded-t-[10px] ${enabled ? "bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" : "bg-gradient-to-r from-orange-500/60 via-red-500/40 to-orange-500/60"}`} />

      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enabled ? "bg-gradient-to-br from-orange-500 to-red-600 shadow-md shadow-orange-500/30" : "bg-orange-500/20 border-2 border-orange-500/40"}`}>
                <Flame className={`w-5 h-5 ${enabled ? "text-white" : "text-orange-400"}`} />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2 text-orange-300">
                  Oil & Gas Tax Optimization
                  {enabled ? (
                    <Badge className="bg-orange-600 text-white text-xs animate-pulse">Active</Badge>
                  ) : (
                    <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs">Click to Enable</Badge>
                  )}
                </h3>
                <p className="text-xs text-orange-200/60">
                  Add oil & gas drilling investment to optimize tax efficiency
                </p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={handleToggle} />
          </div>

          {enabled && (
            <div className="space-y-4 pt-4 border-t border-orange-500/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3" /> Investment</Label>
                  <NumberInput value={investmentAmount} onChange={v => handleChange("investment", v)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Annual Return</Label>
                  <Select value={String(annualReturn)} onValueChange={v => handleChange("return", Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12% (Conservative)</SelectItem>
                      <SelectItem value="15">15% (Target)</SelectItem>
                      <SelectItem value="18">18% (Optimistic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Lockup Period</Label>
                  <Select value={String(lockupYears)} onValueChange={v => handleChange("lockup", Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Years</SelectItem>
                      <SelectItem value="11">11 Years</SelectItem>
                      <SelectItem value="12">12 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <TrendingUp className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-600">{fmt(result.annualIncome)}</div>
                  <div className="text-[10px] text-muted-foreground">Annual O&G Income</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Shield className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-600">{fmt(result.year1TaxSavings)}</div>
                  <div className="text-[10px] text-muted-foreground">Year 1 Tax Savings</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <DollarSign className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-amber-600">{fmt(result.year1TaxDeduction)}</div>
                  <div className="text-[10px] text-muted-foreground">Year 1 Deduction</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                  <Clock className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-600">Year {lockupYears}</div>
                  <div className="text-[10px] text-muted-foreground">Principal Returns</div>
                </div>
              </div>

              <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/30 flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Note:</strong> Principal is locked for {lockupYears} years. O&G income ({fmt(result.annualIncome)}/yr) and
                  tax savings ({fmt(result.year1TaxSavings)} Year 1) are added to your overall strategy projection.
                  Beneficiaries inherit income + principal after lockup.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
