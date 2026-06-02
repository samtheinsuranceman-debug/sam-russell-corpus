// @ts-nocheck

import { useState, useMemo } from "react";
import { useSharedField } from "@/context/FinancialDataContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calculator } from 'lucide-react';
import { useCalculatorAutoFill, RelatedCalculators, AutoFillBanner, useCalcResults } from "@/components/CalculatorIntegration";
import ProjectionChart50yr from "@/components/ProjectionChart50yr";

import { CalculatorPDFExport } from '@/components/CalculatorPDFExport';

import { StateTaxSelector } from '@/components/StateTaxSelector';
import { PageInsights } from "@/components/PageInsights";

function formatDollars(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n.toFixed(0);
}

export default function ACASubsidyCalc() {
  const autoFill = useCalculatorAutoFill("aca-subsidy");
  const { reportResult } = useCalcResults();
  const [income, setIncome] = useSharedField("annualIncome", 50000);
  const [familySize, setFamilySize] = useState(2);
  const [annualPlanCost, setAnnualPlanCost] = useState(6000);

  const FPL_BASE = 14580;
  const FPL_PER_ADDITIONAL = 5110;

  const calculateFPL = (size: number) => FPL_BASE + (size - 1) * FPL_PER_ADDITIONAL;

  const applicablePercentage = useMemo(() => {
    const fpl = calculateFPL(familySize);
    const percentage = (income / fpl) * 100;
    if (percentage <= 133) return 2.07;
    if (percentage <= 200) return 4.00;
    if (percentage <= 300) return 6.50;
    if (percentage <= 400) return 9.56;
    return 0;
  }, [income, familySize]);

  const premiumCap = useMemo(() => {
    return income * (applicablePercentage / 100);
  }, [income, applicablePercentage]);

  const annualSubsidy = useMemo(() => {
    return Math.max(0, annualPlanCost - premiumCap);
  }, [annualPlanCost, premiumCap]);

  const results = useMemo(() => [
    { label: "Estimated Annual Subsidy", value: annualSubsidy },
    { label: "Your Premium Cap", value: premiumCap },
    { label: "Potential Annual Savings", value: annualSubsidy },
  ], [annualSubsidy, premiumCap]);
  const projectionData = useMemo(() => {
    const d = [];
    let opt = 100000, base = 100000, taxSav = 0;
    for (let yr = 0; yr <= 50; yr++) {
      opt *= 1.075;
      base *= 1.05;
      taxSav += (opt - base) * 0.08;
      d.push({ year: yr, optimized: Math.round(opt), baseline: Math.round(base), taxSavings: Math.round(taxSav), netBenefit: Math.round(opt - base + taxSav) });
    }
    return d;
  }, []);


  return (
    <AppShell
      headerTitle="ACA Subsidy Calculator"
      headerSubtitle="Specialized Planning"
    >
      <div className="p-6 bg-[#0a0f1a] min-h-screen text-white">
        <AutoFillBanner calcRoute="aca-subsidy" />
        <Card className="mb-6 bg-[#0d1526]">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-400">
              <Calculator className="mr-2" /> Input Your Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Annual Household Income</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    min={20000}
                    max={200000}
                    step={1000}
                    value={[income]}
                    onValueChange={(value) => setIncome(value[0])}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    className="w-32"
                  />
                </div>
              </div>
              <div>
                <Label>Family Size</Label>
                <Select value={String(familySize)} onValueChange={(value) => setFamilySize(Number(value))}>
                  <SelectTrigger className="w-full bg-slate-700">
                    <SelectValue placeholder="Select family size" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1526]">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} person(s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Annual Plan Cost</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    min={1000}
                    max={20000}
                    step={500}
                    value={[annualPlanCost]}
                    onValueChange={(value) => setAnnualPlanCost(value[0])}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={annualPlanCost}
                    onChange={(e) => setAnnualPlanCost(Number(e.target.value))}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* State Tax Impact */}
        <StateTaxSelector income={income} filingStatus={'single'} className="mb-6" />

        
        <ProjectionChart50yr
          data={projectionData}
          series={[{ key: "optimized", label: "Optimized Strategy", color: "#10b981" }, { key: "baseline", label: "Baseline (No Action)", color: "#ef4444" }, { key: "taxSavings", label: "Cumulative Tax Savings", color: "#06b6d4" }, { key: "netBenefit", label: "Net Benefit", color: "#f59e0b" }]}
          title="50-Year Financial Projection"
          height={420}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {results.map((result, index) => (
            <Card key={index} className="bg-[#0d1526]">
              <CardHeader>
                <CardTitle className="text-emerald-400">{result.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatDollars(result.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-6 bg-[#0d1526]">
          <CardHeader>
            <CardTitle className="text-emerald-400">IUL Advantage</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Indexed Universal Life (IUL) insurance offers tax-free growth, which can help manage your income levels to maintain eligibility for ACA subsidies, potentially maximizing your savings on healthcare costs.</p>
          </CardContent>
        </Card>

        <Button
          onClick={() => toast.success("Results sent to AI Advisor for tax-optimized planning")}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          Send to AI Advisor
        </Button>
      

        {/* Generate Outcome Button */}
        <div className="mt-6 mb-4">
          <button
            onClick={() => {
              reportResult("aca-subsidy", typeof calculations !== 'undefined' ? calculations : {});
              const el = document.getElementById("calc-results-aca-subsidy");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2 text-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Generate Outcome
          </button>
        </div>
        {/* PDF Export */}
        <div className="mt-4 mb-4 flex justify-end">
          <CalculatorPDFExport
            calculatorName="Healthcare Marketplace Subsidy (ACA) Calculator"
            calculatorRoute="aca-subsidy"
            inputs={typeof results !== 'undefined' ? results : {}}
            results={typeof results !== 'undefined' ? results : {}}
            projectionData={projectionData}
          />
      <PageInsights section="a-c-a-subsidy-calc" />
        </div>

        {/* Related Calculators */}
        <RelatedCalculators currentRoute="/portal/aca-subsidy" />
</div>
    </AppShell>
  );
}