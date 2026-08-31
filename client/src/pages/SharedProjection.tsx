import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from "recharts";
import {
  Shield, TrendingUp, DollarSign, Building, Home,
  Landmark, PiggyBank, Download, Clock, User,
} from "lucide-react";

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K`
  : `$${Math.round(n).toLocaleString()}`;
const fmtFull = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function SharedProjection() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const { data, isLoading, error } = trpc.sharedProjections.getByToken.useQuery(
    { token },
    { enabled: !!token, staleTime: Infinity }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22c55e] mx-auto mb-4" />
          <div className="text-[#7a95b8]">Loading projection...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield size={48} className="text-rose-400 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Projection Not Found</h1>
          <p className="text-[#7a95b8]">This link may be invalid or the projection may have been removed.</p>
        </div>
      </div>
    );
  }

  if (data.expired) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Clock size={48} className="text-amber-400 mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-[#7a95b8]">This projection link has expired. Please contact your advisor for an updated link.</p>
        </div>
      </div>
    );
  }

  const proj = data.data;
  if (!proj) return null;

  const result = proj.projectionData as any;
  const inputs = proj.inputData as any;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-[#1e3a5f] bg-[#0f2035]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#22c55e] flex items-center justify-center text-white font-bold text-sm">RC</div>
            <div>
              <div className="text-white font-semibold">Russell Capital Systems™</div>
              <div className="text-[#7a95b8] text-xs">Wealth Strategy Projection</div>
            </div>
          </div>
          <div className="text-right text-[#7a95b8] text-sm">
            <div>Prepared by {proj.advisorName}</div>
            <div>{new Date(proj.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Client Info */}
        <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-6">
          <div className="flex items-center gap-3 mb-4">
            <User size={20} className="text-[#22c55e]" />
            <h1 className="text-white text-xl font-bold">
              {proj.clientName ? `${proj.clientName}'s` : "Your"} Wealth Strategy Projection
            </h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[#7a95b8] text-xs">IRA Balance</div>
              <div className="text-white font-semibold">{fmt(inputs.iraBalance)}</div>
            </div>
            <div>
              <div className="text-[#7a95b8] text-xs">Home Equity</div>
              <div className="text-white font-semibold">{fmt(inputs.homeEquity)}</div>
            </div>
            <div>
              <div className="text-[#7a95b8] text-xs">Age</div>
              <div className="text-white font-semibold">{inputs.age}</div>
            </div>
            <div>
              <div className="text-[#7a95b8] text-xs">Tax Bracket</div>
              <div className="text-white font-semibold">{inputs.currentTaxBracket}%</div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {result.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-[#22c55e]" />
                <div className="text-[#7a95b8] text-xs">Total Wealth (Year 20)</div>
              </div>
              <div className="text-white text-xl font-bold">{fmt(result.summary.totalWealth)}</div>
            </div>
            <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-purple-400" />
                <div className="text-[#7a95b8] text-xs">IUL Account Value</div>
              </div>
              <div className="text-white text-xl font-bold">{fmt(result.summary.iulAccountValue)}</div>
            </div>
            <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building size={16} className="text-cyan-400" />
                <div className="text-[#7a95b8] text-xs">Real Estate Portfolio</div>
              </div>
              <div className="text-white text-xl font-bold">{fmt(result.summary.realEstateValue || 0)}</div>
            </div>
            <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Landmark size={16} className="text-amber-400" />
                <div className="text-[#7a95b8] text-xs">Roth Balance</div>
              </div>
              <div className="text-white text-xl font-bold">{fmt(result.summary.rothBalance || 0)}</div>
            </div>
          </div>
        )}

        {/* IUL Projection Table */}
        {result.iulProjection?.rows && (
          <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <PiggyBank size={16} className="text-[#22c55e]" /> IUL Projection — Year by Year
            </h2>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0f2035]">
                  <tr className="border-b border-[#1e3a5f]">
                    <th className="text-left py-2 text-[#7a95b8]">Year</th>
                    <th className="text-right py-2 text-[#7a95b8]">Premium</th>
                    <th className="text-right py-2 text-[#7a95b8]">Interest</th>
                    <th className="text-right py-2 text-[#7a95b8]">Account Value</th>
                    <th className="text-right py-2 text-[#7a95b8]">Surrender Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.iulProjection.rows.map((row: any) => (
                    <tr key={row.year} className="border-b border-[#1e3a5f]/50">
                      <td className="py-1.5 text-white">{row.year}</td>
                      <td className="text-right text-white">{fmtFull(row.premium)}</td>
                      <td className="text-right text-[#22c55e]">{fmtFull(row.interestEarned)}</td>
                      <td className="text-right text-white font-medium">{fmtFull(row.cashValue)}</td>
                      <td className="text-right text-[#7a95b8]">{fmtFull(row.surrenderValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STR Projection */}
        {result.strProjection?.rows && (
          <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Home size={16} className="text-cyan-400" /> Short-Term Rental Projection
            </h2>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#0f2035]">
                  <tr className="border-b border-[#1e3a5f]">
                    <th className="text-left py-2 text-[#7a95b8]">Year</th>
                    <th className="text-right py-2 text-[#7a95b8]">Property Value</th>
                    <th className="text-right py-2 text-[#7a95b8]">Gross Income</th>
                    <th className="text-right py-2 text-[#7a95b8]">Net Cash Flow</th>
                    <th className="text-right py-2 text-[#7a95b8]">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {result.strProjection.rows.map((row: any) => (
                    <tr key={row.year} className="border-b border-[#1e3a5f]/50">
                      <td className="py-1.5 text-white">{row.year}</td>
                      <td className="text-right text-white">{fmt(row.propertyValue)}</td>
                      <td className="text-right text-[#22c55e]">{fmt(row.grossIncome)}</td>
                      <td className="text-right text-cyan-400">{fmt(row.netCashFlow)}</td>
                      <td className="text-right text-[#7a95b8]">{fmt(row.equity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Roth Conversion */}
        {result.rothProjection && (
          <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Landmark size={16} className="text-amber-400" /> Roth Conversion Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[#7a95b8] text-xs">Conversion Amount</div>
                <div className="text-white font-semibold">{fmt(result.rothProjection.conversionAmount || 0)}</div>
              </div>
              <div>
                <div className="text-[#7a95b8] text-xs">Tax Cost</div>
                <div className="text-rose-400 font-semibold">{fmt(result.rothProjection.taxCost || 0)}</div>
              </div>
              <div>
                <div className="text-[#7a95b8] text-xs">Tax Savings</div>
                <div className="text-[#22c55e] font-semibold">{fmt(result.rothProjection.taxSavings || 0)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Wealth Growth Chart */}
        {result.wealthChart && (
          <div className="bg-[#0f2035] rounded-xl border border-[#1e3a5f] p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#22c55e]" /> 20-Year Wealth Growth
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.wealthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" stroke="#7a95b8" fontSize={11} />
                  <YAxis stroke="#7a95b8" fontSize={11} tickFormatter={(v: number) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmtFull(v)} contentStyle={{ background: '#0a1628', border: '1px solid #1e3a5f', borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="iulValue" name="IUL" fill="#22c55e" fillOpacity={0.1} stroke="#22c55e" strokeWidth={2} />
                  <Area type="monotone" dataKey="realEstateValue" name="Real Estate" fill="#06b6d4" fillOpacity={0.1} stroke="#06b6d4" strokeWidth={2} />
                  <Area type="monotone" dataKey="rothBalance" name="Roth" fill="#f59e0b" fillOpacity={0.1} stroke="#f59e0b" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-[#0f2035]/50 rounded-xl border border-[#1e3a5f]/50 p-4">
          <p className="text-[#7a95b8] text-xs leading-relaxed">
            <strong className="text-[#7a95b8]">Important Disclosure:</strong> This projection is for illustrative purposes only and does not constitute financial advice, a guarantee of future performance, or an offer to sell securities. Actual results will vary based on market conditions, policy terms, interest rates, and individual circumstances. IUL illustrations assume a consistent credited rate which is not guaranteed. Past performance does not guarantee future results. Consult with your financial advisor before making any investment decisions. Russell Capital Systems™ is not a registered investment advisor.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e3a5f] bg-[#0f2035] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-[#7a95b8] text-xs">Russell Capital Systems™ — Confidential Client Projection</div>
          <div className="text-[#7a95b8] text-xs">Expires {new Date(proj.expiresAt).toLocaleDateString()}</div>
        </div>
      </footer>
    </div>
  );
}
