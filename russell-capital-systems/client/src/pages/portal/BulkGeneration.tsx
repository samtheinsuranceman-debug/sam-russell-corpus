// @ts-nocheck
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Users,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpDown,
  Download,
  BarChart3,
  FileText,
  Save,
  Bell,
  Clock,
  Plus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { useClientData } from "@/contexts/ClientDataContext";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

export default function BulkGeneration() {
  const { clientData } = useClientData();
  const { data: schedules = [], refetch: refetchSchedules } = trpc.batchSchedule.list.useQuery();
  const createScheduleMut = trpc.batchSchedule.create.useMutation({ onSuccess: () => { refetchSchedules(); toast.success("Schedule created!"); setShowCreateSchedule(false); setNewName(""); setNewDesc(""); } });
  const updateScheduleMut = trpc.batchSchedule.update.useMutation({ onSuccess: () => { refetchSchedules(); toast.success("Schedule updated"); setEditingSchedule(null); } });
  const deleteScheduleMut = trpc.batchSchedule.delete.useMutation({ onSuccess: () => { refetchSchedules(); toast.success("Schedule deleted"); } });
  const [editingSchedule, setEditingSchedule] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: clientsData, isLoading: clientsLoading } = trpc.clients.list.useQuery();
  const clients = clientsData ?? [];

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [strategyYears, setStrategyYears] = useState<number>(1);
  const [solarEquity, setSolarEquity] = useState(false);
  const [iulYears, setIulYears] = useState<number>(20);
  const [autoRecommend, setAutoRecommend] = useState(true);
  const [sortField, setSortField] = useState<"netWorth" | "iulNetCash" | "clientName">("netWorth");
  const [sortAsc, setSortAsc] = useState(false);
  const [notifyOnSave, setNotifyOnSave] = useState(false);

  const bulkMutation = trpc.bulkGeneration.run.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.summary.successfulProjections} projections generated, ${data.summary.skipped} skipped`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const pdfMutation = trpc.bulkGeneration.exportPdf.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PDF report generated");
    },
    onError: (err) => {
      toast.error("Failed to generate PDF: " + err.message);
    },
  });

  const saveAllMutation = trpc.bulkGeneration.saveAll.useMutation({
    onSuccess: (data) => {
      const msg = data.notifiedCount > 0
        ? `${data.savedCount} strategies saved, ${data.notifiedCount} clients notified`
        : `${data.savedCount} strategies saved`;
      toast.success(msg);
    },
    onError: (err) => {
      toast.error("Failed to save: " + err.message);
    },
  });

  const eligibleClients = useMemo(
    () => clients.filter((c) => Number(c.iraBalance) > 0),
    [clients],
  );

  const toggleClient = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(eligibleClients.map((c) => c.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const handleRun = () => {
    if (selectedIds.size === 0) {
      toast.error("No clients selected");
      return;
    }
    bulkMutation.mutate({
      clientIds: Array.from(selectedIds),
      strategyYears,
      solarEquity,
      iulYears,
      autoRecommendCarrier: autoRecommend,
    });
  };

  const results = bulkMutation.data?.results ?? [];
  const summary = bulkMutation.data?.summary;

  const currentSettings = useMemo(() => ({
    strategyYears,
    solarEquity,
    iulYears,
    autoRecommendCarrier: autoRecommend,
  }), [strategyYears, solarEquity, iulYears, autoRecommend]);

  const sortedResults = useMemo(() => {
    const sorted = [...results];
    sorted.sort((a, b) => {
      if (sortField === "clientName") {
        return sortAsc
          ? a.clientName.localeCompare(b.clientName)
          : b.clientName.localeCompare(a.clientName);
      }
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [results, sortField, sortAsc]);

  const chartData = useMemo(() => {
    return sortedResults
      .filter((r) => !r.error)
      .slice(0, 20)
      .map((r) => ({
        name: r.clientName.length > 12 ? r.clientName.slice(0, 12) + "…" : r.clientName,
        "IUL Illustrated Policy Value": r.iulNetCash,
        "RE Equity": r.reEquity,
        "Roth Balance": r.rothBalance,
      }));
  }, [sortedResults]);

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = ["Client", "Age", "IRA Balance", "Income", "Carrier", "Strategy", "IUL Illustrated Policy Value", "RE Equity", "Rental Income", "Roth Balance", "Net Worth", "Status"];
    const rows = results.map((r) => [
      r.clientName, r.age, r.iraBalance, r.income, r.carrierName, r.strategyLabel,
      r.iulNetCash, r.reEquity, r.rentalIncome, r.rothBalance, r.netWorth, r.error || "OK",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-strategy-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!summary || results.length === 0) return;
    pdfMutation.mutate({
      results,
      summary,
      settings: currentSettings,
    });
  };

  const [bulk1035Loading, setBulk1035Loading] = useState(false);
  const handleBulk1035Export = async () => {
    if (results.length === 0) return;
    setBulk1035Loading(true);
    try {
      const entries = results.map((r) => ({
        clientName: r.clientName,
        stateCode: "FL" as const,
        contract: {
          accountValue: r.iraBalance,
          surrenderValue: Math.round(r.iraBalance * 0.88),
          yearsInForce: 5,
          surrenderPeriodYears: 10,
          surrenderPenaltyPct: 8,
          currentMonthlyIncome: Math.round(r.income / 12),
          carrierRating: "A+",
          carrierComdex: 82,
          rollupRate: 6.0,
          premiumBonusPct: 15,
          category: "FIA" as const,
          clientAge: r.age,
          accountType: "ira" as const,
          carrierName: r.carrierName,
          productName: r.strategyLabel,
          annualFees: 1.5,
          deathBenefitPct: 100,
        },
      }));
      const resp = await fetch("/api/generate-bulk-1035-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (!resp.ok) throw new Error("Failed to generate bulk 1035 PDF");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bulk_1035_Analysis_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Bulk 1035 analysis generated for ${entries.length} clients`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate bulk 1035 PDF");
    } finally {
      setBulk1035Loading(false);
    }
  };

  const handleSaveAll = () => {
    if (results.length === 0) return;
    saveAllMutation.mutate({
      results,
      settings: currentSettings,
      notifyClients: notifyOnSave,
      portalOrigin: window.location.origin,
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="BulkGeneration" />

        <ExecutiveSummary
          pageTitle="Bulk Generation"
          whatItDoes="This financial analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex financial analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="This tool reveals insights that most clients never see because they don\'t have access to institutional-grade analysis. The data here can change how you think about your entire financial picture."
          intent="To give you the same caliber of financial analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your financial analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how financial analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this financial analysis strategy interact with my other financial plans?",
            "What\'s the single biggest financial analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Bulk Generation" pageContext="Bulk Generation — financial analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This financial analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended financial analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={200000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Financial Clarity Score", doNothing: 40, recommended: 90, format: "percent" },
            { label: "Optimization Potential", doNothing: 0, recommended: 200000, format: "currency" },
            { label: "Decision Confidence", doNothing: 35, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on financial analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Header */}
        <div className="rc-page-header">
          <div>
            <h1 className="rc-page-title flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#22c55e]" />
              Bulk Strategy Generation
            </h1>
            <p className="rc-page-subtitle mt-1">
              Run projections for multiple clients at once using their profiles and recommended carriers
            </p>
          </div>
          {results.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button className="rc-btn rc-btn-ghost" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button
                className="rc-btn rc-btn-ghost" size="sm"
                onClick={handleExportPdf}
                disabled={pdfMutation.isPending}
              >
                <FileText className="h-4 w-4 mr-1" />
                {pdfMutation.isPending ? "Generating…" : "Download PDF"}
              </Button>
              <Button
                className="rc-btn rc-btn-ghost border-[#f0c040]/50 text-[#f0c040] hover:bg-[#f0c040]/10" size="sm"
                onClick={handleBulk1035Export}
                disabled={bulk1035Loading}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                {bulk1035Loading ? "Generating…" : "Bulk 1035 Analysis"}
              </Button>
              <ExportToSlides
                toolName="Bulk Strategy Generation"
                getSections={() => [
                  {
                    title: "Bulk Generation Summary",
                    items: [
                      { label: "Total Results", value: String(results.length) },
                      { label: "Successful Projections", value: String(summary?.successfulProjections ?? 0) },
                      { label: "Skipped", value: String(summary?.skipped ?? 0) },
                      { label: "Strategy Years", value: String(strategyYears) },
                      { label: "Solar Equity", value: solarEquity ? "Yes" : "No" },
                      { label: "IUL Years", value: String(iulYears) },
                    ]
                  }
                ]}
              />
              <Button
                size="sm"
                className="rc-btn rc-btn-primary"
                onClick={handleSaveAll}
                disabled={saveAllMutation.isPending || saveAllMutation.isSuccess}
              >
                <Save className="h-4 w-4 mr-1" />
                {saveAllMutation.isPending
                  ? "Saving…"
                  : saveAllMutation.isSuccess
                    ? `Saved ${saveAllMutation.data?.savedCount ?? 0}`
                    : "Save All Strategies"}
              </Button>
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Client Selection */}
          <div className="rc-card lg:col-span-2">
            <div className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-medium">
                  <Users className="h-4 w-4 inline mr-1 text-[#7a95b8]" />
                  Select Clients ({selectedIds.size} of {clients.length})
                </h3>
                <div className="flex gap-2">
                  <Button className="rc-btn rc-btn-ghost" size="sm" onClick={selectAll}>
                    Select Eligible ({eligibleClients.length})
                  </Button>
                  <Button className="rc-btn rc-btn-ghost" size="sm" onClick={selectNone}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <div className="max-h-64 overflow-y-auto space-y-1 border border-[#12233e] rounded-md p-2">
                {clientsLoading ? (
                  <p className="text-sm text-[#7a95b8] text-center py-4">Loading clients...</p>
                ) : clients.length === 0 ? (
                  <p className="text-sm text-[#7a95b8] text-center py-4">No clients found</p>
                ) : (
                  clients.map((c) => {
                    const ira = Number(c.iraBalance) || 0;
                    const hasIra = ira > 0;
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-[#12233e]/50 transition-colors ${
                          !hasIra ? "opacity-50" : ""
                        }`}
                      >
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleClient(c.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-[#c8d8ec]">{c.name}</span>
                          {!hasIra && (
                            <span className="text-xs text-[#f0c040] ml-2">(No IRA)</span>
                          )}
                        </div>
                        <span className="text-xs text-[#7a95b8]">
                          IRA: {fmt(ira)}
                        </span>
                        <span className="text-xs text-[#7a95b8]">
                          Age: {c.age || "—"}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="rc-card">
            <div className="pb-3">
              <h3 className="text-white text-sm font-medium">Batch Settings</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#c8d8ec]">Strategy Type</Label>
                <Select value={String(strategyYears)} onValueChange={v => setStrategyYears(Number(v))}>
                  <SelectTrigger className="rc-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1-Year Strategy</SelectItem>
                    <SelectItem value="2">2-Year Strategy</SelectItem>
                    <SelectItem value="3">3-Year Strategy</SelectItem>
                    <SelectItem value="4">4-Year Strategy</SelectItem>
                    <SelectItem value="5">5-Year Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#c8d8ec]">IUL Duration</Label>
                <Select value={String(iulYears)} onValueChange={v => setIulYears(Number(v))}>
                  <SelectTrigger className="rc-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Years</SelectItem>
                    <SelectItem value="18">18 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#c8d8ec]">Solar Equity</Label>
                <Switch checked={solarEquity} onCheckedChange={setSolarEquity} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#c8d8ec]">Auto-Recommend Carrier</Label>
                <Switch checked={autoRecommend} onCheckedChange={setAutoRecommend} />
              </div>
              {autoRecommend && (
                <p className="text-xs text-[#7a95b8]">
                  Each client gets their optimal carrier based on age and risk profile
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#12233e]">
                <Label className="text-xs flex items-center gap-1 text-[#c8d8ec]">
                  <Bell className="h-3 w-3 text-[#7a95b8]" /> Notify on Save
                </Label>
                <Switch checked={notifyOnSave} onCheckedChange={setNotifyOnSave} />
              </div>
              {notifyOnSave && (
                <p className="text-xs text-[#7a95b8]">
                  Clients with portal access will receive an email when strategies are saved
                </p>
              )}

              <Button
                className="w-full rc-btn rc-btn-primary"
                onClick={handleRun}
                disabled={bulkMutation.isPending || selectedIds.size === 0}
              >
                {bulkMutation.isPending ? (
                  <>Processing {selectedIds.size} clients...</>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-1" />
                    Run Batch ({selectedIds.size} clients)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rc-card">
              <div className="p-4 text-center">
                <p className="rc-stat-value text-[#22c55e]">{summary.successfulProjections}</p>
                <p className="rc-stat-label">Projections</p>
              </div>
            </div>
            <div className="rc-card">
              <div className="p-4 text-center">
                <p className="rc-stat-value text-[#f0c040]">{summary.skipped}</p>
                <p className="rc-stat-label">Skipped</p>
              </div>
            </div>
            <div className="rc-card">
              <div className="p-4 text-center">
                <p className="rc-stat-value text-[#22c55e]">{fmt(summary.totalNetWorth)}</p>
                <p className="rc-stat-label">Total Net Worth</p>
              </div>
            </div>
            <div className="rc-card">
              <div className="p-4 text-center">
                <p className="rc-stat-value text-[#3b82f6]">{fmt(summary.avgNetWorth)}</p>
                <p className="rc-stat-label">Avg Net Worth</p>
              </div>
            </div>
            <div className="rc-card">
              <div className="p-4 text-center">
                <p className="rc-stat-value text-[#a855f7] truncate">{summary.topClient}</p>
                <p className="rc-stat-label">Top Client</p>
              </div>
            </div>
          </div>
        )}

        {/* Save All Success Banner */}
        {saveAllMutation.isSuccess && saveAllMutation.data && (
          <div className="rc-card border-[#22c55e]/30 bg-[#22c55e]/5">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#22c55e] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#22c55e]">
                    {saveAllMutation.data.savedCount} strategies saved successfully
                  </p>
                  {saveAllMutation.data.notifiedCount > 0 && (
                    <p className="text-xs text-[#7a95b8] mt-0.5">
                      {saveAllMutation.data.notifiedCount} client{saveAllMutation.data.notifiedCount !== 1 ? "s" : ""} notified via email
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="rc-card">
            <div className="pb-2">
              <h3 className="text-white text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#7a95b8]" />
                Net Worth Breakdown by Client
              </h3>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#7a95b8" }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10, fill: "#7a95b8" }} tickFormatter={(v: number) => fmt(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px" }}
                    formatter={(value: number) => fmt(value)}
                  />
                  <Legend />
                  <Bar dataKey="IUL Illustrated Policy Value" stackId="a" fill="#22c55e" />
                  <Bar dataKey="RE Equity" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Roth Balance" stackId="a" fill="#a855f7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="rc-card">
            <div className="pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-medium">Results ({results.length} clients)</h3>
                <div className="flex gap-2">
                  <Button
                    className="rc-btn rc-btn-ghost" size="sm"
                    onClick={() => {
                      if (sortField === "clientName") setSortAsc(!sortAsc);
                      else { setSortField("clientName"); setSortAsc(true); }
                    }}
                  >
                    Name <ArrowUpDown className="h-3 w-3 ml-1" />
                  </Button>
                  <Button
                    className="rc-btn rc-btn-ghost" size="sm"
                    onClick={() => {
                      if (sortField === "netWorth") setSortAsc(!sortAsc);
                      else { setSortField("netWorth"); setSortAsc(false); }
                    }}
                  >
                    Net Worth <ArrowUpDown className="h-3 w-3 ml-1" />
                  </Button>
                  <Button
                    className="rc-btn rc-btn-ghost" size="sm"
                    onClick={() => {
                      if (sortField === "iulNetCash") setSortAsc(!sortAsc);
                      else { setSortField("iulNetCash"); setSortAsc(false); }
                    }}
                  >
                    IUL <ArrowUpDown className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#12233e] text-[#7a95b8]">
                      <th className="text-left py-2 px-2">Client</th>
                      <th className="text-right py-2 px-2">Age</th>
                      <th className="text-right py-2 px-2">IRA</th>
                      <th className="text-left py-2 px-2">Carrier</th>
                      <th className="text-right py-2 px-2">IUL Illustrated Policy Value (illustrated, non-guaranteed)</th>
                      <th className="text-right py-2 px-2">RE Equity</th>
                      <th className="text-right py-2 px-2">Rental Income</th>
                      <th className="text-right py-2 px-2">Roth</th>
                      <th className="text-right py-2 px-2 font-semibold">Net Worth</th>
                      <th className="text-center py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((r, i) => (
                      <tr
                        key={r.clientId}
                        className={`border-b border-[#12233e]/50 ${r.error ? "opacity-50" : ""} ${i === 0 && !r.error ? "bg-[#22c55e]/5" : ""}`}
                      >
                        <td className="py-2 px-2 font-medium text-[#c8d8ec]">{r.clientName}</td>
                        <td className="py-2 px-2 text-right text-[#c8d8ec]">{r.age}</td>
                        <td className="py-2 px-2 text-right text-[#c8d8ec]">{fmt(r.iraBalance)}</td>
                        <td className="py-2 px-2 text-xs text-[#7a95b8]">{r.carrierName || "—"}</td>
                        <td className="py-2 px-2 text-right text-[#22c55e]">{r.error ? "—" : fmt(r.iulNetCash)}</td>
                        <td className="py-2 px-2 text-right text-[#3b82f6]">{r.error ? "—" : fmt(r.reEquity)}</td>
                        <td className="py-2 px-2 text-right text-[#06b6d4]">{r.error ? "—" : fmt(r.rentalIncome)}</td>
                        <td className="py-2 px-2 text-right text-[#a855f7]">{r.error ? "—" : fmt(r.rothBalance)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-[#22c55e]">{r.error ? "—" : fmt(r.netWorth)}</td>
                        <td className="py-2 px-2 text-center">
                          {r.error ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[#f0c040]">
                              <AlertCircle className="h-3 w-3" /> {r.error}
                            </span>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-[#22c55e] mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!bulkMutation.data && !bulkMutation.isPending && (
          <div className="rc-card border-dashed border-[#12233e]">
            <div className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-[#7a95b8]/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#7a95b8]">No batch results yet</h3>
              <p className="text-sm text-[#7a95b8]/70 mt-1">
                Select clients, configure settings, and click "Run Batch" to generate projections
              </p>
            </div>
          </div>
        )}

        {/* Scheduled Batches */}
        <div className="rc-card">
          <div className="pb-3">
            <h3 className="text-white text-sm font-medium flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#3b82f6]" />
              Scheduled Batches
              <span className="rc-badge rc-badge-blue">NEW</span>
            </h3>
            <p className="text-sm text-[#7a95b8]">Set up recurring batch projections that run automatically</p>
          </div>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {schedules.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-[#12233e] bg-[#0d1a2e]">
                {editingSchedule === s.id ? (
                  <div className="space-y-2">
                    <input className="w-full text-sm bg-[#0d1a2e] border border-[#12233e] text-[#c8d8ec] rounded px-2 py-1" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Schedule name" />
                    <input className="w-full text-xs bg-[#0d1a2e] border border-[#12233e] text-[#c8d8ec] rounded px-2 py-1" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" />
                    <div className="flex gap-2">
                      <Button className="rc-btn rc-btn-primary text-xs" size="sm" onClick={() => updateScheduleMut.mutate({ id: s.id, name: editName, description: editDesc })}>Save</Button>
                      <Button className="rc-btn rc-btn-ghost text-xs" size="sm" onClick={() => setEditingSchedule(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#c8d8ec]">{s.name}</span>
                      <span className={`rc-badge ${!s.paused ? "rc-badge-green" : "rc-badge-red"}`}>{!s.paused ? "Active" : "Paused"}</span>
                    </div>
                    <p className="text-xs text-[#7a95b8]">{s.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Button className="rc-btn rc-btn-ghost text-xs" size="sm" onClick={() => { setEditingSchedule(s.id); setEditName(s.name); setEditDesc(s.description ?? ""); }}>Edit</Button>
                      <Button className={`rc-btn rc-btn-ghost text-xs ${!s.paused ? "text-red-400" : "text-[#22c55e]"}`} size="sm" onClick={() => updateScheduleMut.mutate({ id: s.id, paused: !s.paused })}>{!s.paused ? "Pause" : "Resume"}</Button>
                      <Button className="rc-btn rc-btn-ghost text-xs text-red-400" size="sm" onClick={() => deleteScheduleMut.mutate({ id: s.id })}>Delete</Button>
                    </div>
                  </>
                )}
              </div>
              ))}
              <div className="p-4 rounded-xl border border-dashed border-[#12233e] bg-[#0d1a2e]/50">
                {showCreateSchedule ? (
                  <div className="space-y-2">
                    <input className="w-full text-sm bg-[#0d1a2e] border border-[#12233e] text-[#c8d8ec] rounded px-2 py-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Schedule name (e.g. Friday Rate Check)" />
                    <input className="w-full text-xs bg-[#0d1a2e] border border-[#12233e] text-[#c8d8ec] rounded px-2 py-1" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" />
                    <div className="flex gap-2">
                      <Button className="rc-btn rc-btn-primary text-xs" size="sm" onClick={() => { if (!newName.trim()) { toast.error("Name required"); return; } createScheduleMut.mutate({ name: newName, description: newDesc || "Custom scheduled batch", templateType: "bulk-projection", frequency: "weekly" }); }}>Create</Button>
                      <Button className="rc-btn rc-btn-ghost text-xs" size="sm" onClick={() => setShowCreateSchedule(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[80px]">
                    <Button className="rc-btn rc-btn-ghost text-[#7a95b8]" size="sm" onClick={() => setShowCreateSchedule(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Create Schedule
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <PageInsights pageId="bulk-generation" />
      </div>
      <NAICDisclaimer variant="footer" showsProjections showsCashValues />
    
        <ComplianceFooter pageName="BulkGeneration" showsIUL showsTax showsEstate showsProjections />
      </AppShell>
  );
}
