/**
 * ClientIntelligenceSummary — Collapsible panel showing everything the platform
 * knows about the selected client.  Pulls from 6 data sources:
 *   1. ClientDataContext (fact-finder)
 *   2. CalcResults (calculator outputs + Financial Health Score)
 *   3. Unified Data Bus (cross-feature data)
 *   4. AI Brain (recommendations)
 *   5. Experience system (engagement)
 *   6. Financial DNA (personality — via Data Bus)
 *
 * Appears on every COMBO page via the <ComboPageWrapper> layout.
 */
import { useState, useMemo } from "react";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import {
  ChevronDown,
  ChevronRight,
  User,
  Heart,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────────────────────── */
const fmt = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
      ? `$${(v / 1_000).toFixed(0)}K`
      : `$${v.toFixed(0)}`;

const pct = (v: number) => `${Math.round(v)}%`;

/* ── sub-sections ────────────────────────────────────────────────────── */
function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-2 px-3 text-xs font-semibold text-white/70 hover:text-white transition-colors"
      >
        <Icon className="w-3.5 h-3.5" />
        {title}
        {open ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
      </button>
      {open && <div className="px-3 pb-3 space-y-1">{children}</div>}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-white/50">{label}</span>
      <span className={highlight ? "text-emerald-400 font-semibold" : "text-white/80"}>{value}</span>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────── */
export function ClientIntelligenceSummary({ className = "" }: { className?: string }) {
  const { data: client, selectedClientId, loading: clientLoading } = useClientData();
  const { results, getFinancialHealthScore } = useCalcResults();
  const { getAllEntries, getTotalDataPoints } = useUnifiedDataBus();

  // Memoize expensive computations
  const healthScore = useMemo(() => getFinancialHealthScore(), [getFinancialHealthScore]);
  const dataBusEntries = useMemo(() => getAllEntries(), [getAllEntries]);
  const totalDataPoints = useMemo(() => getTotalDataPoints(), [getTotalDataPoints]);
  const calculatorsUsed = useMemo(() => Object.keys(results).length, [results]);

  // Data completeness calculation
  const completeness = useMemo(() => {
    if (!client) return 0;
    const fields = [
      client.annualIncome,
      client.age,
      client.state,
      client.homeValue,
      client.mortgageBalance,
      client.iraBalance,
      client.k401Balance,
      client.lifeInsuranceCv,
      client.retirementAge,
      client.riskTolerance,
    ];
    const filled = fields.filter((f) => f && f !== 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [client]);

  // Risk gaps from data bus
  const riskGaps = useMemo(() => {
    const gaps: string[] = [];
    if (client) {
      if (!client.hasLTC) gaps.push("No Long-Term Care coverage");
      if (client.lifeInsuranceCv === 0 && client.lifeInsuranceDb === 0) gaps.push("No Life Insurance");
      if (client.iraBalance === 0 && client.k401Balance === 0 && client.rothBalance === 0) gaps.push("No retirement accounts");
      if (client.mortgageBalance > client.homeValue * 0.8) gaps.push("High LTV ratio (>80%)");
      if (client.annualIncome > 0 && client.cashSavings < client.monthlyExpenses * 3) gaps.push("Emergency fund < 3 months");
    }
    return gaps;
  }, [client]);

  // Net worth calculation
  const netWorth = useMemo(() => {
    if (!client) return 0;
    const assets =
      client.cashSavings +
      client.taxableInvestments +
      client.realEstateEquity +
      client.iraBalance +
      client.rothBalance +
      client.k401Balance +
      client.lifeInsuranceCv +
      client.annuityValue;
    const liabilities = client.mortgageBalance + client.otherDebt + client.schoolDebt + client.spouseSchoolDebt;
    return assets - liabilities;
  }, [client]);

  if (!selectedClientId && !clientLoading) {
    return (
      <div className={`bg-slate-900/60 border border-white/10 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-amber-400 text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-semibold">No Client Selected</span>
        </div>
        <p className="text-white/40 text-xs mt-2">
          Select a client from the sidebar to see personalized intelligence across all features.
        </p>
      </div>
    );
  }

  if (clientLoading) {
    return (
      <div className={`bg-slate-900/60 border border-white/10 rounded-xl p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{client?.clientName || "Client"}</h3>
              <p className="text-[10px] text-white/40">
                {client?.age ? `Age ${client.age}` : ""} {client?.state ? `• ${client.state}` : ""}{" "}
                {client?.filingStatus ? `• ${client.filingStatus}` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40">Net Worth</div>
            <div className="text-sm font-bold text-emerald-400">{fmt(netWorth)}</div>
          </div>
        </div>
        {/* Data Completeness Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-white/40 mb-1">
            <span>Profile Completeness</span>
            <span>{pct(completeness)}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                completeness >= 80 ? "bg-emerald-500" : completeness >= 50 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <Section title="Financial Profile" icon={User} defaultOpen={true}>
        {client && (
          <>
            <Row label="Annual Income" value={fmt(client.annualIncome + client.spouseIncome)} highlight />
            <Row label="Monthly Expenses" value={fmt(client.monthlyExpenses)} />
            <Row label="Home Value" value={fmt(client.homeValue)} />
            <Row label="Mortgage" value={fmt(client.mortgageBalance)} />
            <Row label="IRA + 401k" value={fmt(client.iraBalance + client.k401Balance)} />
            <Row label="Roth" value={fmt(client.rothBalance)} />
            <Row label="Life Insurance CV" value={fmt(client.lifeInsuranceCv)} />
            <Row label="Risk Tolerance" value={`${client.riskTolerance}/10`} />
          </>
        )}
      </Section>

      {/* Financial Health Section */}
      <Section title="Financial Health" icon={Heart} defaultOpen={true}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`text-2xl font-black ${
              healthScore.overall >= 70
                ? "text-emerald-400"
                : healthScore.overall >= 40
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {healthScore.overall}
          </div>
          <div className="text-[10px] text-white/40">
            / 100 overall
            <br />
            {healthScore.calculatorsUsed} calculators used
          </div>
        </div>
        <Row label="Tax Efficiency" value={pct(healthScore.categories.taxEfficiency)} />
        <Row label="Retirement Ready" value={pct(healthScore.categories.retirementReadiness)} />
        <Row label="Risk Protection" value={pct(healthScore.categories.riskProtection)} />
        <Row label="Estate Prep" value={pct(healthScore.categories.estatePreparedness)} />
        <Row label="Wealth Growth" value={pct(healthScore.categories.wealthGrowth)} />
        <Row label="Debt Mgmt" value={pct(healthScore.categories.debtManagement)} />
      </Section>

      {/* Risk Gaps Section */}
      {riskGaps.length > 0 && (
        <Section title={`Risk Gaps (${riskGaps.length})`} icon={AlertTriangle} defaultOpen={true}>
          {riskGaps.map((gap, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-red-400/80">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {gap}
            </div>
          ))}
        </Section>
      )}

      {/* Intelligence Section */}
      <Section title="Platform Intelligence" icon={Brain} defaultOpen={false}>
        <Row label="Data Bus Entries" value={String(dataBusEntries.length)} />
        <Row label="Total Data Points" value={String(totalDataPoints)} />
        <Row label="Calculators Run" value={String(calculatorsUsed)} />
        {healthScore.insights.slice(0, 3).map((insight, i) => (
          <div key={i} className="flex items-start gap-2 text-[10px] text-blue-400/70 mt-1">
            <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />
            {insight}
          </div>
        ))}
      </Section>
    </div>
  );
}

export default ClientIntelligenceSummary;
