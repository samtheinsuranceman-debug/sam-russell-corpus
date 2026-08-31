// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  Scale,
  Printer,
  ClipboardCheck,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Save,
  Mail,
  FileSearch,
} from "lucide-react";
import { NumberInput } from "@/components/NumberInput";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis
} from "recharts";


interface ComplianceItem {
  id: string;
  category: string;
  requirement: string;
  status: "compliant" | "needs-review" | "non-compliant";
  notes: string;
  regulation: string;
}

const COMPLIANCE_CATEGORIES = [
  {
    name: "Suitability & Best Interest",
    items: [
      { requirement: "Client risk tolerance documented and scored", regulation: "NAIC Model #670" },
      { requirement: "Financial needs analysis completed", regulation: "NAIC Model #670" },
      { requirement: "Product suitability determination documented", regulation: "Reg BI / NAIC" },
      { requirement: "Alternative products considered and documented", regulation: "Reg BI" },
      { requirement: "Client's existing coverage reviewed", regulation: "NAIC Model #670" },
      { requirement: "Replacement analysis completed (if applicable)", regulation: "NAIC Model #613" },
    ],
  },
  {
    name: "IUL-Specific Disclosures",
    items: [
      { requirement: "Illustrated vs. non-guaranteed values clearly distinguished", regulation: "AG 49-B" },
      { requirement: "Policy loan interest rate and mechanics disclosed", regulation: "AG 49-B" },
      { requirement: "Cap rates, participation rates, and floor explained", regulation: "AG 49-B" },
      { requirement: "Surrender charges and schedule disclosed", regulation: "State Insurance Code" },
      { requirement: "Cost of insurance charges explained", regulation: "NAIC Model #582" },
      { requirement: "Illustration compliant with AG 49-B standards", regulation: "AG 49-B" },
    ],
  },
  {
    name: "Annuity Disclosures",
    items: [
      { requirement: "Surrender period and charges disclosed", regulation: "NAIC Model #245" },
      { requirement: "Guaranteed vs. non-guaranteed benefits explained", regulation: "NAIC Model #245" },
      { requirement: "Free withdrawal provisions disclosed", regulation: "NAIC Model #245" },
      { requirement: "Death benefit options explained", regulation: "State Insurance Code" },
      { requirement: "Income rider fees and guarantees disclosed", regulation: "NAIC Model #245" },
    ],
  },
  {
    name: "Anti-Money Laundering",
    items: [
      { requirement: "Client identity verified (CIP)", regulation: "USA PATRIOT Act" },
      { requirement: "Source of funds documented", regulation: "BSA/AML" },
      { requirement: "Suspicious activity monitoring in place", regulation: "FinCEN" },
      { requirement: "OFAC screening completed", regulation: "OFAC" },
    ],
  },
  {
    name: "Record Keeping",
    items: [
      { requirement: "Client meeting notes documented", regulation: "State Insurance Code" },
      { requirement: "Application copies retained", regulation: "NAIC Model #670" },
      { requirement: "Illustration copies provided and retained", regulation: "AG 49-B" },
      { requirement: "Correspondence records maintained", regulation: "State Insurance Code" },
      { requirement: "Complaint log maintained", regulation: "NAIC Model #884" },
    ],
  },
  {
    name: "Continuing Education",
    items: [
      { requirement: "State CE requirements current", regulation: "State Insurance Code" },
      { requirement: "Ethics CE completed", regulation: "State Insurance Code" },
      { requirement: "Product-specific training completed", regulation: "Carrier Requirements" },
      { requirement: "Anti-fraud training completed", regulation: "NAIC Model #680" },
    ],
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function AG49RateValidator() {
  const [illustratedRate, setIllustratedRate] = useState<number>(7.5);
  const [capRate, setCapRate] = useState<number>(10.5);
  const [parRate, setParRate] = useState<number>(100);
  const [floorRate, setFloorRate] = useState<number>(0);
  const [spreadRate, setSpreadRate] = useState<number>(0);
  const [statedLoanRate, setStatedLoanRate] = useState<number>(5.0);
  const [loanArbitrage, setLoanArbitrage] = useState<number>(0.5);
  const [bonusRate, setBonusRate] = useState<number>(0);
  const [multiplierRate, setMultiplierRate] = useState<number>(1.0);
  const [hasRun, setHasRun] = useState<boolean>(false);

  const AG49_MAX_ILLUSTRATED = 7.5;
  const AG49B_BONUS_LIMIT = 0.5;
  const AG49B_MULTIPLIER_LIMIT = 1.0;

  const validations = useMemo(() => {
    if (!hasRun) return [];
    const results: { id: string; label: string; value: string; limit: string; status: "pass" | "fail" | "warn"; regulation: string; detail: string }[] = [];

    results.push({
      id: "illustrated-rate",
      label: "Illustrated Crediting Rate",
      value: `${illustratedRate.toFixed(2)}%`,
      limit: `≤ ${AG49_MAX_ILLUSTRATED.toFixed(2)}%`,
      status: illustratedRate <= AG49_MAX_ILLUSTRATED ? "pass" : "fail",
      regulation: "AG 49-A §7",
      detail: illustratedRate <= AG49_MAX_ILLUSTRATED
        ? `Rate of ${illustratedRate.toFixed(2)}% is at or below the AG 49 maximum of ${AG49_MAX_ILLUSTRATED}%.`
        : `VIOLATION: Rate of ${illustratedRate.toFixed(2)}% exceeds the AG 49 maximum illustrated rate of ${AG49_MAX_ILLUSTRATED}%. This must be reduced.`,
    });

    results.push({
      id: "floor-rate",
      label: "Floor Rate (Minimum Guarantee)",
      value: `${floorRate.toFixed(2)}%`,
      limit: "≥ 0.00%",
      status: floorRate >= 0 ? "pass" : "fail",
      regulation: "AG 49-A §5",
      detail: floorRate >= 0
        ? `Floor of ${floorRate.toFixed(2)}% provides downside protection as required.`
        : `VIOLATION: Negative floor rate is not permitted under AG 49.`,
    });

    const effectiveMaxCredit = Math.min(capRate, illustratedRate);
    results.push({
      id: "cap-rate",
      label: "Cap Rate vs. Illustrated Rate",
      value: `Cap: ${capRate.toFixed(2)}%`,
      limit: `Cap ≥ Illustrated (${illustratedRate.toFixed(2)}%)`,
      status: capRate >= illustratedRate ? "pass" : "warn",
      regulation: "AG 49-A §7",
      detail: capRate >= illustratedRate
        ? `Cap rate of ${capRate.toFixed(2)}% supports the illustrated rate of ${illustratedRate.toFixed(2)}%.`
        : `WARNING: Cap rate of ${capRate.toFixed(2)}% is below the illustrated rate of ${illustratedRate.toFixed(2)}%. The effective credited rate would be capped.`,
    });

    results.push({
      id: "par-rate",
      label: "Participation Rate",
      value: `${parRate.toFixed(0)}%`,
      limit: "Documented",
      status: parRate > 0 && parRate <= 300 ? "pass" : "warn",
      regulation: "AG 49-A §6",
      detail: `Participation rate of ${parRate.toFixed(0)}% is documented. Current carrier-declared rate should be verified.`,
    });

    results.push({
      id: "spread",
      label: "Index Spread / Asset Fee",
      value: `${spreadRate.toFixed(2)}%`,
      limit: "Documented",
      status: spreadRate >= 0 ? "pass" : "warn",
      regulation: "AG 49-A §6",
      detail: `Spread of ${spreadRate.toFixed(2)}% reduces the effective credited rate. Ensure this matches the carrier's current declared spread.`,
    });

    results.push({
      id: "loan-rate",
      label: "Stated Policy Loan Rate",
      value: `${statedLoanRate.toFixed(2)}%`,
      limit: "Disclosed",
      status: statedLoanRate > 0 ? "pass" : "warn",
      regulation: "AG 49-B §8",
      detail: `Stated loan rate of ${statedLoanRate.toFixed(2)}% with net arbitrage spread of ${loanArbitrage.toFixed(2)}%. AG 49-B requires that loan arbitrage assumptions be disclosed and that illustrated loan arbitrage not exceed the benchmark index account earned rate.`,
    });

    results.push({
      id: "loan-arbitrage",
      label: "Loan Arbitrage Spread",
      value: `${loanArbitrage.toFixed(2)}%`,
      limit: "≤ Illustrated Rate",
      status: loanArbitrage <= illustratedRate && loanArbitrage >= 0 ? "pass" : "fail",
      regulation: "AG 49-B §8",
      detail: loanArbitrage <= illustratedRate
        ? `Arbitrage spread of ${loanArbitrage.toFixed(2)}% is within AG 49-B limits.`
        : `VIOLATION: Arbitrage spread exceeds the illustrated rate, which is not permitted under AG 49-B.`,
    });

    results.push({
      id: "bonus",
      label: "Illustration Bonus Rate",
      value: `${bonusRate.toFixed(2)}%`,
      limit: `≤ ${AG49B_BONUS_LIMIT.toFixed(2)}%`,
      status: bonusRate <= AG49B_BONUS_LIMIT ? "pass" : "fail",
      regulation: "AG 49-B §9",
      detail: bonusRate <= AG49B_BONUS_LIMIT
        ? `Bonus rate of ${bonusRate.toFixed(2)}% is within AG 49-B limits.`
        : `VIOLATION: Bonus rate of ${bonusRate.toFixed(2)}% exceeds the AG 49-B maximum of ${AG49B_BONUS_LIMIT}% for illustration purposes.`,
    });

    results.push({
      id: "multiplier",
      label: "Index Multiplier",
      value: `${multiplierRate.toFixed(2)}x`,
      limit: `≤ ${AG49B_MULTIPLIER_LIMIT.toFixed(2)}x`,
      status: multiplierRate <= AG49B_MULTIPLIER_LIMIT ? "pass" : "fail",
      regulation: "AG 49-B §9",
      detail: multiplierRate <= AG49B_MULTIPLIER_LIMIT
        ? `Multiplier of ${multiplierRate.toFixed(2)}x is within AG 49-B limits for illustration.`
        : `VIOLATION: Multiplier of ${multiplierRate.toFixed(2)}x exceeds the AG 49-B limit. Illustrations must use a multiplier of ${AG49B_MULTIPLIER_LIMIT}x or less.`,
    });

    return results;
  }, [hasRun, illustratedRate, capRate, parRate, floorRate, spreadRate, statedLoanRate, loanArbitrage, bonusRate, multiplierRate]);

  const rateComparisonData = [
    { name: 'Illustrated', rate: illustratedRate, max: AG49_MAX_ILLUSTRATED },
    { name: 'Cap', rate: capRate, max: 15 },
    { name: 'Floor', rate: floorRate, max: 5 },
    { name: 'Loan', rate: statedLoanRate, max: 8 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AG 49 / 49-B Rate Validator</CardTitle>
          <CardDescription>Validate your IUL illustration assumptions against current NAIC Actuarial Guideline 49 and 49-B requirements.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b pb-2">Core Rates</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Illustrated Crediting Rate (%)</Label>
                  <NumberInput value={illustratedRate} onChange={setIllustratedRate} min={0} max={15} step={0.1} />
                </div>
                <div>
                  <Label className="text-xs">Cap Rate (%)</Label>
                  <NumberInput value={capRate} onChange={setCapRate} min={0} max={20} step={0.1} />
                </div>
                <div>
                  <Label className="text-xs">Participation Rate (%)</Label>
                  <NumberInput value={parRate} onChange={setParRate} min={0} max={300} step={5} />
                </div>
                <div>
                  <Label className="text-xs">Floor Rate (%)</Label>
                  <NumberInput value={floorRate} onChange={setFloorRate} min={0} max={10} step={0.1} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b pb-2">Fees & Spreads</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Index Spread / Asset Fee (%)</Label>
                  <NumberInput value={spreadRate} onChange={setSpreadRate} min={0} max={5} step={0.1} />
                </div>
                <div>
                  <Label className="text-xs">Stated Policy Loan Rate (%)</Label>
                  <NumberInput value={statedLoanRate} onChange={setStatedLoanRate} min={0} max={10} step={0.1} />
                </div>
                <div>
                  <Label className="text-xs">Loan Arbitrage Spread (%)</Label>
                  <NumberInput value={loanArbitrage} onChange={setLoanArbitrage} min={0} max={5} step={0.1} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b pb-2">AG 49-B Specific</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Bonus Rate (%)</Label>
                  <NumberInput value={bonusRate} onChange={setBonusRate} min={0} max={5} step={0.1} />
                </div>
                <div>
                  <Label className="text-xs">Index Multiplier (x)</Label>
                  <NumberInput value={multiplierRate} onChange={setMultiplierRate} min={1} max={3} step={0.1} />
                </div>
              </div>
              <div className="pt-4">
                <Button className="w-full" onClick={() => setHasRun(true)}>
                  <Zap className="mr-2 h-4 w-4" /> Run Validation
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasRun && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Data Table 1: Validation Results */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Status</th>
                        <th className="px-4 py-3">Parameter</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3">Limit/Rule</th>
                        <th className="px-4 py-3">Regulation</th>
                        <th className="px-4 py-3 rounded-tr-lg">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validations.map((v, i) => (
                        <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            {v.status === "pass" ? <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Pass</Badge> :
                             v.status === "warn" ? <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"><AlertTriangle className="w-3 h-3 mr-1"/> Warn</Badge> :
                             <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"><AlertTriangle className="w-3 h-3 mr-1"/> Fail</Badge>}
                          </td>
                          <td className="px-4 py-3 font-medium">{v.label}</td>
                          <td className="px-4 py-3">{v.value}</td>
                          <td className="px-4 py-3">{v.limit}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{v.regulation}</td>
                          <td className="px-4 py-3 text-xs">{v.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rate Comparison vs Limits</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rateComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="rate" name="Input Rate" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="max" name="Max Allowed/Typical" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AG 49-B Arbitrage Check</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Year 1', illustrated: illustratedRate, arbitrage: loanArbitrage, loan: statedLoanRate },
                    { name: 'Year 10', illustrated: illustratedRate, arbitrage: loanArbitrage, loan: statedLoanRate },
                    { name: 'Year 20', illustrated: illustratedRate, arbitrage: loanArbitrage, loan: statedLoanRate },
                    { name: 'Year 30', illustrated: illustratedRate, arbitrage: loanArbitrage, loan: statedLoanRate },
                  ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', color: '#fff' }} />
                    <Legend />
                    <Area type="monotone" dataKey="illustrated" stackId="1" stroke="#8884d8" fill="#8884d8" name="Illustrated Rate" />
                    <Area type="monotone" dataKey="arbitrage" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Arbitrage" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function ComplianceReportGenerator() {
  const { user } = useAuth();
  
  const complianceAlerts = trpc.complianceAlerts.getAlerts.useQuery();
  const recentAudits = trpc.complianceAudit.getRecentAudits.useQuery();
  const complianceStats = trpc.complianceTracking.getStats.useQuery();
  const savedReports = trpc.reports.getSavedReports.useQuery();
  const userTeam = trpc.team.getTeamMembers.useQuery();
  const saveReportMutation = trpc.reports.saveReport.useMutation();

  const [clientName, setClientName] = useState("John Doe");
  const [advisorName, setAdvisorName] = useState(user?.name || "Jane Smith");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [productType, setProductType] = useState("iul");
  const [items, setItems] = useState<ComplianceItem[]>(() => {
    let initial: ComplianceItem[] = [];
    COMPLIANCE_CATEGORIES.forEach((cat) => {
      cat.items.forEach((item, i) => {
        initial.push({
          id: `${cat.name.replace(/\s+/g, '-')}-${i}`,
          category: cat.name,
          requirement: item.requirement,
          status: "needs-review",
          notes: "",
          regulation: item.regulation,
        });
      });
    });
    return initial;
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    COMPLIANCE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})
  );
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState<number>(50);

  const updateStatus = (id: string, status: ComplianceItem["status"]) => {
    setItems(prev => prev.map((item) => item.id === id ? { ...item, status } : item));
  };

  const updateNotes = (id: string, notes: string) => {
    setItems(prev => prev.map((item) => item.id === id ? { ...item, notes } : item));
  };

  const markAllCompliant = (categoryName: string) => {
    setItems(prev => prev.map((item) => item.category === categoryName ? { ...item, status: "compliant" } : item));
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  const summary = useMemo(() => {
    return items.reduce((acc, item) => {
      if (item.status === "compliant") acc.compliant++;
      else if (item.status === "needs-review") acc.needsReview++;
      else acc.nonCompliant++;
      return acc;
    }, { compliant: 0, needsReview: 0, nonCompliant: 0, total: items.length });
  }, [items]);

  const complianceScore = useMemo(() => {
    if (summary.total === 0) return 0;
    return Math.round((summary.compliant / summary.total) * 100);
  }, [summary]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />;
      case "needs-review": return <Clock className="h-5 w-5 text-amber-500 shrink-0" />;
      case "non-compliant": return <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground shrink-0" />;
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesSearch = item.requirement.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.regulation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.notes.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [items, filterStatus, searchQuery]);

  const categoryData = useMemo(() => {
    return COMPLIANCE_CATEGORIES.map((cat) => {
      const catItems = items.filter((i) => i.category === cat.name);
      const compliant = catItems.filter((i) => i.status === "compliant").length;
      return {
        name: cat.name,
        value: compliant,
        total: catItems.length,
        percentage: catItems.length > 0 ? Math.round((compliant / catItems.length) * 100) : 0
      };
    });
  }, [items]);

  const statusData = [
    { name: 'Compliant', value: summary.compliant, color: '#10b981' },
    { name: 'Needs Review', value: summary.needsReview, color: '#f59e0b' },
    { name: 'Non-Compliant', value: summary.nonCompliant, color: '#ef4444' },
  ];

  const trendData = [
    { month: 'Jan', score: 85, audits: 12 },
    { month: 'Feb', score: 88, audits: 15 },
    { month: 'Mar', score: 82, audits: 18 },
    { month: 'Apr', score: 90, audits: 14 },
    { month: 'May', score: 95, audits: 20 },
    { month: 'Jun', score: complianceScore, audits: 22 },
  ];

  const riskData = [
    { subject: 'Suitability', A: 120, B: 110, fullMark: 150 },
    { subject: 'Disclosures', A: 98, B: 130, fullMark: 150 },
    { subject: 'AML', A: 86, B: 130, fullMark: 150 },
    { subject: 'Record Keeping', A: 99, B: 100, fullMark: 150 },
    { subject: 'CE', A: 85, B: 90, fullMark: 150 },
    { subject: 'Marketing', A: 65, B: 85, fullMark: 150 },
  ];

  const recentAuditsData = recentAudits.data || [
    { id: '1', date: '2023-10-15', client: 'Alice Johnson', score: 95, status: 'Passed', reviewer: 'Admin' },
    { id: '2', date: '2023-10-12', client: 'Bob Smith', score: 82, status: 'Warning', reviewer: 'System' },
    { id: '3', date: '2023-10-10', client: 'Charlie Brown', score: 100, status: 'Passed', reviewer: 'Admin' },
    { id: '4', date: '2023-10-05', client: 'Diana Prince', score: 65, status: 'Failed', reviewer: 'Compliance Dept' },
  ];

  const alertsData = complianceAlerts.data || [
    { id: '1', severity: 'High', message: 'New AG 49-B regulations effective next month', date: '2023-10-20' },
    { id: '2', severity: 'Medium', message: '3 client files missing AML documentation', date: '2023-10-18' },
    { id: '3', severity: 'Low', message: 'CE requirements due for 5 team members', date: '2023-10-15' },
  ];

  const teamStatsData = userTeam.data || [
    { name: 'Jane Smith', role: 'Senior Advisor', score: 98, audits: 45 },
    { name: 'John Doe', role: 'Advisor', score: 92, audits: 32 },
    { name: 'Mike Johnson', role: 'Junior Advisor', score: 85, audits: 15 },
  ];

  const savedReportsData = savedReports.data || [
    { id: '1', name: 'Q3 Compliance Summary', date: '2023-09-30', type: 'Quarterly' },
    { id: '2', name: 'Annual AML Audit', date: '2023-01-15', type: 'Annual' },
    { id: '3', name: 'Monthly Suitability Review', date: '2023-10-01', type: 'Monthly' },
  ];

  const handleSaveReport = async () => {
    setIsExporting(true);
    try {
      await saveReportMutation.mutateAsync({
        title: `Compliance Report - ${clientName}`,
        data: { items, summary, clientName, advisorName, reportDate, productType },
        type: 'compliance'
      });
      setTimeout(() => setIsExporting(false), 1000);
    } catch (error) {
      console.error("Failed to save report", error);
      setIsExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance Center</h1>
            <p className="text-muted-foreground">Manage audits, validate illustrations, and generate compliance reports.</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides toolName="Report" getSections={() => [{ title: "Overview", content: "Report data" }]} />
            <Button variant="outline" onClick={() => setActiveTab("settings")}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
            <Button onClick={handleSaveReport} disabled={isExporting}>
              {isExporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Report
            </Button>
          </div>
        </div>

        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="text-sm text-muted-foreground mb-2">Overall Compliance Score</div>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" 
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - complianceScore / 100)}`}
                    className={complianceScore >= 90 ? "text-green-500" : complianceScore >= 70 ? "text-amber-500" : "text-red-500"}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{complianceScore}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="text-sm text-muted-foreground flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Compliant Items</div>
                <div className="text-4xl font-bold text-green-500 mt-2">{summary.compliant}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">Out of {summary.total} total requirements</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="text-sm text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2 text-amber-500"/> Needs Review</div>
                <div className="text-4xl font-bold text-amber-500 mt-2">{summary.needsReview}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">Requires attention before finalization</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="text-sm text-muted-foreground flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-red-500"/> Non-Compliant</div>
                <div className="text-4xl font-bold text-red-500 mt-2">{summary.nonCompliant}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">Immediate action required</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-background"><BarChart3 className="w-4 h-4 mr-2"/> Dashboard</TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-background"><ClipboardCheck className="w-4 h-4 mr-2"/> Checklist</TabsTrigger>
            <TabsTrigger value="validation" className="data-[state=active]:bg-background"><Scale className="w-4 h-4 mr-2"/> AG 49 Validator</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-background"><Settings className="w-4 h-4 mr-2"/> Settings</TabsTrigger>
            <TabsTrigger value="report" className="data-[state=active]:bg-background"><FileText className="w-4 h-4 mr-2"/> Full Report</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 2 Container */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><PieChartIcon className="w-5 h-5 mr-2"/> Compliance by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={150} fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', color: '#fff' }} />
                      <Bar dataKey="percentage" name="% Compliant" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.percentage >= 90 ? '#10b981' : entry.percentage >= 70 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 4 Container */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><TrendingUp className="w-5 h-5 mr-2"/> Historical Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis yAxisId="left" domain={[0, 100]} fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', color: '#fff' }} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="score" name="Avg Score" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                      <Line yAxisId="right" type="monotone" dataKey="audits" name="Audits Conducted" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Chart 5 Container */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Shield className="w-5 h-5 mr-2"/> Risk Assessment Profile</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
                      <PolarGrid opacity={0.2} />
                      <PolarAngleAxis dataKey="subject" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} opacity={0.5} />
                      <Radar name="Current Period" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Radar name="Previous Period" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Data Table 3 Container */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> Compliance Alerts</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">Message</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {alertsData.map((alert) => (
                          <tr key={alert.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={
                                alert.severity === 'High' ? 'border-red-500 text-red-500' : 
                                alert.severity === 'Medium' ? 'border-amber-500 text-amber-500' : 
                                'border-blue-500 text-blue-500'
                              }>{alert.severity}</Badge>
                            </td>
                            <td className="px-4 py-3">{alert.message}</td>
                            <td className="px-4 py-3 text-muted-foreground">{alert.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Table 2 Container */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center"><History className="w-5 h-5 mr-2"/> Recent Audits</CardTitle>
                <Button variant="outline" size="sm"><FileSearch className="w-4 h-4 mr-2"/> View All</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Reviewer</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentAuditsData.map((audit) => (
                        <tr key={audit.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3">{audit.date}</td>
                          <td className="px-4 py-3 font-medium">{audit.client}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-full bg-muted rounded-full h-2 mr-2 max-w-[100px]">
                                <div className={`h-2 rounded-full ${audit.score >= 90 ? 'bg-green-500' : audit.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${audit.score}%` }}></div>
                              </div>
                              <span>{audit.score}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={
                              audit.status === 'Passed' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 
                              audit.status === 'Warning' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 
                              'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                            }>{audit.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{audit.reviewer}</td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAudit(audit.id)}>View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            <Card className="mb-6 bg-muted/30 border-dashed">
              <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full relative">
                  <Input 
                    placeholder="Search requirements, regulations, or notes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  <FileSearch className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="needs-review">Needs Review</SelectItem>
                      <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => {
                    const allExpanded = Object.values(expandedCategories).every(v => v);
                    const newState = COMPLIANCE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: !allExpanded }), {});
                    setExpandedCategories(newState);
                  }}>
                    {Object.values(expandedCategories).every(v => v) ? <ChevronUp className="w-4 h-4 mr-2"/> : <ChevronDown className="w-4 h-4 mr-2"/>}
                    {Object.values(expandedCategories).every(v => v) ? "Collapse All" : "Expand All"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {COMPLIANCE_CATEGORIES.map((cat) => {
              const catItems = filteredItems.filter((i) => i.category === cat.name);
              if (catItems.length === 0) return null; // Skip empty categories after filtering
              
              const catCompliant = catItems.filter((i) => i.status === "compliant").length;
              const isExpanded = expandedCategories[cat.name];
              
              return (
                <Card key={cat.name} className="overflow-hidden transition-all duration-200">
                  <CardHeader className="bg-muted/20 cursor-pointer select-none" onClick={() => toggleCategory(cat.name)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground"/> : <ChevronUp className="w-5 h-5 text-muted-foreground"/>}
                        <div>
                          <CardTitle className="text-base">{cat.name}</CardTitle>
                          <CardDescription>{catCompliant}/{catItems.length} items compliant</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-muted rounded-full hidden sm:block">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(catCompliant/catItems.length)*100}%` }}></div>
                        </div>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); markAllCompliant(cat.name); }}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Mark All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="space-y-2 p-4 border-t">
                      {catItems.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                          <button onClick={() => {
                            const next = item.status === "needs-review" ? "compliant" : item.status === "compliant" ? "non-compliant" : "needs-review";
                            updateStatus(item.id, next);
                          }} className="mt-1 sm:mt-0 p-1 rounded-full hover:bg-background">
                            {statusIcon(item.status)}
                          </button>
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-sm font-medium">{item.requirement}</span>
                              <Badge variant="outline" className="text-[10px] bg-background">{item.regulation}</Badge>
                            </div>
                            <Input
                              placeholder="Add specific notes, evidence, or references..."
                              value={item.notes}
                              onChange={(e) => updateNotes(item.id, e.target.value)}
                              className="h-8 text-xs bg-background/50"
                            />
                          </div>
                          <div className="w-full sm:w-auto flex justify-end mt-2 sm:mt-0">
                            <Select value={item.status} onValueChange={v => updateStatus(item.id, v as ComplianceItem["status"])}>
                              <SelectTrigger className={`w-[140px] h-8 text-xs ${item.status === 'compliant' ? 'border-green-500/50' : item.status === 'non-compliant' ? 'border-red-500/50' : 'border-amber-500/50'}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="compliant"><div className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-2 text-green-500"/> Compliant</div></SelectItem>
                                <SelectItem value="needs-review"><div className="flex items-center"><Clock className="w-3 h-3 mr-2 text-amber-500"/> Needs Review</div></SelectItem>
                                <SelectItem value="non-compliant"><div className="flex items-center"><AlertTriangle className="w-3 h-3 mr-2 text-red-500"/> Non-Compliant</div></SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          {/* AG 49 Rate Validation Tab */}
          <TabsContent value="validation" className="space-y-4">
            <AG49RateValidator />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><FileText className="w-5 h-5 mr-2"/> Report Information</CardTitle>
                  <CardDescription>Basic details for the generated compliance report.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Client Name</Label>
                      <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Advisor/Company</Label>
                      <Input value={advisorName} onChange={(e) => setAdvisorName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Report Date</Label>
                      <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Product Type</Label>
                      <Select value={productType} onValueChange={setProductType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iul">Indexed Universal Life (IUL)</SelectItem>
                          <SelectItem value="annuity">Fixed Index Annuity (FIA)</SelectItem>
                          <SelectItem value="myga">Multi-Year Guaranteed Annuity (MYGA)</SelectItem>
                          <SelectItem value="term">Term Life Insurance</SelectItem>
                          <SelectItem value="whole">Whole Life Insurance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Shield className="w-5 h-5 mr-2"/> Compliance Settings</CardTitle>
                  <CardDescription>Configure specific rules and thresholds.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Notes for Non-Compliant</Label>
                        <p className="text-xs text-muted-foreground">Force advisors to add notes when marking items non-compliant.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-Flag High Risk Policies</Label>
                        <p className="text-xs text-muted-foreground">Automatically trigger secondary review for high-risk products.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Client Portal Sharing</Label>
                        <p className="text-xs text-muted-foreground">Allow sharing compliance summaries directly to client portal.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t space-y-4">
                    <Label>Minimum Passing Score Threshold (%)</Label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="50" max="100" 
                        value={riskScore} 
                        onChange={(e) => setRiskScore(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="font-bold w-12 text-right">{riskScore}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Reports scoring below this threshold will require compliance officer approval.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Full Report Tab */}
          <TabsContent value="report" className="space-y-4">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="border-b bg-muted/10 pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">Compliance Audit Report</h2>
                    <p className="text-muted-foreground mt-1 text-lg">{advisorName}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-lg font-bold ${complianceScore >= 90 ? 'bg-green-500/10 text-green-600' : complianceScore >= 70 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>
                      Score: {complianceScore}%
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 mt-6 text-sm">
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs uppercase tracking-wider">Client</span><span className="font-medium">{clientName}</span></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs uppercase tracking-wider">Date</span><span className="font-medium">{reportDate}</span></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs uppercase tracking-wider">Product Type</span><span className="font-medium uppercase">{productType}</span></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs uppercase tracking-wider">Status</span>
                    <span className="font-medium flex items-center">
                      {complianceScore >= 90 ? <><CheckCircle2 className="w-3 h-3 mr-1 text-green-500"/> Pass</> : 
                       complianceScore >= 70 ? <><AlertTriangle className="w-3 h-3 mr-1 text-amber-500"/> Review Required</> : 
                       <><AlertTriangle className="w-3 h-3 mr-1 text-red-500"/> Fail</>}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="p-6 rounded-xl bg-card border flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="text-4xl font-bold text-green-500 mb-2">{summary.compliant}</div>
                    <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Compliant</div>
                  </div>
                  <div className="p-6 rounded-xl bg-card border flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="text-4xl font-bold text-amber-500 mb-2">{summary.needsReview}</div>
                    <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Needs Review</div>
                  </div>
                  <div className="p-6 rounded-xl bg-card border flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="text-4xl font-bold text-red-500 mb-2">{summary.nonCompliant}</div>
                    <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Non-Compliant</div>
                  </div>
                </div>

                <div className="space-y-10">
                  {COMPLIANCE_CATEGORIES.map((cat) => {
                    const catItems = items.filter((i) => i.category === cat.name);
                    const catCompliant = catItems.filter((i) => i.status === "compliant").length;
                    const catScore = Math.round((catCompliant / catItems.length) * 100);
                    
                    return (
                      <div key={cat.name} className="break-inside-avoid">
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                          <h3 className="font-bold text-xl">{cat.name}</h3>
                          <Badge variant="outline" className={catScore === 100 ? 'border-green-500 text-green-500' : catScore >= 50 ? 'border-amber-500 text-amber-500' : 'border-red-500 text-red-500'}>
                            {catScore}% Compliant
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {catItems.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 text-sm p-3 rounded-md bg-muted/10">
                              <div className="mt-0.5">{statusIcon(item.status)}</div>
                              <div className="flex-1">
                                <div className="font-medium">{item.requirement}</div>
                                <div className="text-xs text-muted-foreground mt-1 font-mono">{item.regulation}</div>
                                {item.notes && (
                                  <div className="mt-2 p-2 bg-background rounded border text-xs italic text-muted-foreground">
                                    <span className="font-semibold not-italic text-foreground">Notes: </span>{item.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                  <p>This report was generated automatically by Russell Capital Systems™ Compliance Engine.</p>
                  <p className="mt-1">Report ID: COMP-{Math.random().toString(36).substring(2, 10).toUpperCase()} • Generated: {new Date().toLocaleString()}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t p-4 flex justify-between">
                <Button variant="outline"><Printer className="w-4 h-4 mr-2"/> Print Report</Button>
                <Button><Mail className="w-4 h-4 mr-2"/> Email to Compliance</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="compact" />
      </div>
    </AppShell>
  );
}

function History(props: any) {
  return <Clock {...props} />;
}

function Circle(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle></svg>;
}
