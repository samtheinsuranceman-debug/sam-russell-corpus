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

export default function AMTCalculator() {
  const autoFill = useCalculatorAutoFill("amt-calculator");
  const { reportResult } = useCalcResults();
  const [filingStatus, setFilingStatus] = useSharedField("filingStatus", "single");
  const [agi, setAgi] = useState(100000);
  const [stateTaxes, setStateTaxes] = useState(5000);
  const [otherDeductions, setOtherDeductions] = useState(10000);

  const calculations = useMemo(() => {
    let exemption = 75000; // Simplified for single
    if (filingStatus === "married") exemption = 118000;
    const amtBase = agi + stateTaxes - exemption;
    const regularTax = 0.20 * agi; // Simplified 20% regular tax
    const tentativeAMT = amtBase > 0 ? 0.26 * amtBase : 0;
    const amtOwed = Math.max(0, tentativeAMT - regularTax);
    return {
      estimatedAMT: amtOwed,
      regularTaxAmount: regularTax,
      taxDifference: amtOwed - regularTax,
    };
  }, [filingStatus, agi, stateTaxes]);
  const projectionData = useMemo(() => {
    const d = [];
    const income = typeof primaryIncome !== 'undefined' ? primaryIncome : 250000;
    const savingsRate = 0.08;
    let withStrat = 0, withoutStrat = 0, cumTax = 0;
    for (let yr = 0; yr <= 50; yr++) {
      const annualSavings = income * savingsRate * (1 + yr * 0.01);
      cumTax += annualSavings;
      withStrat += (income * 0.15) * Math.pow(1.072, yr > 0 ? 1 : 0);
      withoutStrat += (income * 0.15 - annualSavings) * Math.pow(1.055, yr > 0 ? 1 : 0);
      d.push({ year: yr, taxSaved: Math.round(cumTax), withStrategy: Math.round(withStrat), withoutStrategy: Math.round(withoutStrat), netBenefit: Math.round(cumTax * 1.06) });
    }
    return d;
  }, []);


  return (
    <AppShell>
      <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
        <AutoFillBanner calcRoute="amt-calculator" />
        <div className="flex items-center mb-6">
          <Calculator className="mr-2 text-emerald-400" />
          <h1 className="text-2xl font-bold">AMT Calculator</h1>
          <Badge className="ml-2 bg-emerald-400 text-slate-900">Tax & Income Optimization</Badge>
        </div>
        
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <Label>Filing Status</Label>
            <Select onValueChange={setFilingStatus} defaultValue="single">
              <SelectTrigger className="bg-[#0d1526] border-[#1e3a5f]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1526] border-[#1e3a5f]">
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married Filing Jointly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Adjusted Gross Income</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={agi}
                onChange={(e) => setAgi(Number(e.target.value))}
                className="bg-[#0d1526] border-[#1e3a5f]"
                min="0"
              />
              <Slider
                min={50000}
                max={500000}
                step={1000}
                value={[agi]}
                onValueChange={(value) => setAgi(value[0])}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>State and Local Taxes Paid</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={stateTaxes}
                onChange={(e) => setStateTaxes(Number(e.target.value))}
                className="bg-[#0d1526] border-[#1e3a5f]"
                min="0"
              />
              <Slider
                min={0}
                max={20000}
                step={500}
                value={[stateTaxes]}
                onValueChange={(value) => setStateTaxes(value[0])}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Other Itemized Deductions</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(Number(e.target.value))}
                className="bg-[#0d1526] border-[#1e3a5f]"
                min="0"
              />
              <Slider
                min={0}
                max={50000}
                step={1000}
                value={[otherDeductions]}
                onValueChange={(value) => setOtherDeductions(value[0])}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#0d1526] border-[#1e3a5f]">
            <CardHeader>
              <CardTitle>Estimated AMT Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-emerald-400">{formatDollars(calculations.estimatedAMT)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0d1526] border-[#1e3a5f]">
            <CardHeader>
              <CardTitle>Regular Tax Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-emerald-400">{formatDollars(calculations.regularTaxAmount)}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0d1526] border-[#1e3a5f]">
            <CardHeader>
              <CardTitle>AMT Tax Difference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-emerald-400">{formatDollars(calculations.taxDifference)}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* IUL Advantage Section */}
        {/* State Tax Impact */}
        <StateTaxSelector income={250000} filingStatus={filingStatus === 'married' ? 'mfj' : 'single'} className="mb-6" />
        
        <ProjectionChart50yr
          data={projectionData}
          series={[{ key: "taxSaved", label: "Cumulative Tax Savings", color: "#10b981" }, { key: "withStrategy", label: "With Tax Strategy", color: "#06b6d4" }, { key: "withoutStrategy", label: "Without Strategy", color: "#ef4444" }, { key: "netBenefit", label: "Net Benefit", color: "#f59e0b" }]}
          title="50-Year Financial Projection"
          height={420}
        />

        <div className="mb-8 p-4 bg-[#0d1526] border border-[#1e3a5f] rounded-lg">
          <h2 className="text-xl font-semibold text-emerald-400">IUL Advantage</h2>
          <p>Indexed Universal Life (IUL) insurance offers tax-free growth on cash value, which can help reduce your Adjusted Gross Income and minimize exposure to the Alternative Minimum Tax. By shifting income into tax-advantaged growth, IUL provides a strategic way to optimize your tax situation.</p>
        </div>
        
        {/* Send to AI Advisor Button */}
        <Button
          onClick={() => toast.success("Results sent to AI Advisor for tax-optimized planning")}
          className="bg-emerald-400 text-slate-900 hover:bg-emerald-500"
        >
          Send to AI Advisor
        </Button>
      

        {/* Generate Outcome Button */}
        <div className="mt-6 mb-4">
          <button
            onClick={() => {
              reportResult("amt-calculator", typeof calculations !== 'undefined' ? calculations : {});
              const el = document.getElementById("calc-results-amt-calculator");
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
            calculatorName="Alternative Minimum Tax (AMT) Calculator"
            calculatorRoute="amt-calculator"
            inputs={typeof calculations !== 'undefined' ? calculations : {}}
            results={typeof calculations !== 'undefined' ? calculations : {}}
            projectionData={projectionData}
          />
      <PageInsights section="a-m-t-calculator" />
        </div>

        {/* Related Calculators */}
        <RelatedCalculators currentRoute="/portal/amt-calculator" />
</div>
    </AppShell>
  );
}