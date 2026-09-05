// FILE: client/src/pages/IndexBacktesterPage.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const IndexBacktesterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("selection");

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Index Backtester Portal</h1>
          <div className="bg-[#22c55e]/20 text-[#22c55e] px-4 py-2 rounded-lg text-sm">
            Page Insights Score: 95/100
          </div>
        </header>

        <Tabs defaultValue="selection" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#141925] border-[#22c55e]/30 w-full justify-start">
            <TabsTrigger value="selection" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Index Selection</TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Backtest Results</TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Strategy Comparison</TabsTrigger>
            <TabsTrigger value="capfloor" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Cap/Floor Analysis</TabsTrigger>
            <TabsTrigger value="outcome" className="data-[state=active]:bg-[#22c55e]/20 data-[state=active]:text-[#22c55e]">Generate Outcome</TabsTrigger>
          </TabsList>
          <TabsContent value="selection" className="mt-0">
            <Card className="bg-[#141925] border-[#22c55e]/30">
              <CardHeader><CardTitle>Index Selection</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Index Type</Label><Input className="bg-[#0a0f1a] border-[#22c55e]/30" placeholder="S&P 500" /></div>
                  <div><Label>Backtest Period (Years)</Label><Input className="bg-[#0a0f1a] border-[#22c55e]/30" placeholder="10" /></div>
                </div>
                <p className="text-gray-400 mt-4">Placeholder: Historical Data Loaded for S&P 500</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="results" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Backtest Results</CardTitle></CardHeader><CardContent><p className="text-gray-400">Backtest results will be displayed here.</p></CardContent></Card></TabsContent>
          <TabsContent value="comparison" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Strategy Comparison</CardTitle></CardHeader><CardContent><p className="text-gray-400">Strategy comparisons will be shown here.</p></CardContent></Card></TabsContent>
          <TabsContent value="capfloor" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Cap/Floor Analysis</CardTitle></CardHeader><CardContent><p className="text-gray-400">Cap and floor impact will be calculated here.</p></CardContent></Card></TabsContent>
          <TabsContent value="outcome" className="mt-0"><Card className="bg-[#141925] border-[#22c55e]/30"><CardHeader><CardTitle>Generate Outcome</CardTitle></CardHeader><CardContent><Button className="bg-[#22c55e] hover:bg-[#22c55e]/90">Generate Report</Button><p className="text-gray-400 mt-4">Outcome report will be generated here.</p></CardContent></Card></TabsContent>
        </Tabs>

        <Card className="bg-[#141925] border-[#22c55e]/30">
          <CardHeader><CardTitle>Cross-Tool Integration</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-400">Integrate with IUL Planner and FIA Calculator for index-linked product analysis.</p>
            <Button variant="outline" className="mt-4 border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10">Connect Tools</Button>
          </CardContent>
        </Card>

        <footer className="text-gray-500 text-sm mt-6">
          <p>Regulatory Disclaimer: Russell Capital Systems provides tools for life & annuity agents only. Not for use by series-licensed professionals. Backtest results are not indicative of future performance. Consult financial advisors for strategy implementation.</p>
        </footer>
      </div>
    </div>
  );
};

export default IndexBacktesterPage;
