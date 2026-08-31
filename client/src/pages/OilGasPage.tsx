// FILE: client/src/pages/OilGasPage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OilGasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("analysis");

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Oil & Gas Investment Portal</h1>
          <div className="bg-[#22c55e]/20 text-[#22c55e] px-4 py-2 rounded-lg text-sm">
            Page Insights Score: 88/100
          </div>
        </header>

        <Tabs defaultValue="analysis" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#141925] border-[#22c55e]/30 w-full justify-start">
            <TabsTrigger value="analysis" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Investment Analysis</TabsTrigger>
            <TabsTrigger value="deductions" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Tax Deductions</TabsTrigger>
            <TabsTrigger value="cashflow" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Cash Flow</TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Risk Assessment</TabsTrigger>
            <TabsTrigger value="myga" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">MYGA Offset</TabsTrigger>
            <TabsTrigger value="outcome" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Generate Outcome</TabsTrigger>
          </TabsList>
          <TabsContent value="analysis" className="mt-0">
            <Card className="bg-[#141925] border-[#22c55e]/30">
              <CardHeader><CardTitle>Investment Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Investment Amount ($)</Label><Input className="bg-[#0a0f1a] border-[#22c55e]/30" placeholder="100,000" /></div>
                  <div><Label>Projected ROI (%)</Label><Input className="bg-[#0a0f1a] border-[#22c55e]/30" placeholder="8.0" /></div>
                </div>
                <p className="text-gray-400 mt-4">Placeholder: Projected Return - $8,000/Year</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="deductions" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Tax Deductions (IDC 100% Year 1)</CardTitle></CardHeader><CardContent><p className="text-gray-400">Deduction impact will be calculated here.</p></CardContent></Card></TabsContent>
          <TabsContent value="cashflow" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader><CardContent><p className="text-gray-400">Cash flow projections will be shown here.</p></CardContent></Card></TabsContent>
          <TabsContent value="risk" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Risk Assessment</CardTitle></CardHeader><CardContent><p className="text-gray-400">Risk metrics will be displayed here.</p></CardContent></Card></TabsContent>
          <TabsContent value="myga" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>MYGA Offset</CardTitle></CardHeader><CardContent><p className="text-gray-400">MYGA offset strategies will be shown here.</p></CardContent></Card></TabsContent>
          <TabsContent value="outcome" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Generate Outcome</CardTitle></CardHeader><CardContent><Button className="bg-[#22c55e] hover:bg-[#22c55e]/90">Generate Report</Button><p className="text-gray-400 mt-4">Outcome report will be generated here.</p></CardContent></Card></TabsContent>
        </Tabs>

        <Card className="bg-[#141925] border-[#22c55e]/30">
          <CardHeader><CardTitle>Cross-Tool Integration</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-400">Integrate with Fixed Annuity Calculator and Tax Impact Analyzer for full analysis.</p>
            <Button variant="outline" className="mt-4 border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10">Connect Tools</Button>
          </CardContent>
        </Card>

        <footer className="text-gray-500 text-sm mt-6">
          <p>Regulatory Disclaimer: Russell Capital Systems provides tools for life & annuity agents only. Not for use by series-licensed professionals. Oil & gas investments carry significant risk. Consult tax and financial advisors before investing.</p>
        </footer>
      </div>
    </div>
  );
};

export default OilGasPage;
