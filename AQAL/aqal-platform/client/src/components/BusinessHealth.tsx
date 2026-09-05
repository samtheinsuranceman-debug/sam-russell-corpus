import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const pct = (r: number | null) => (r === null ? "—" : `${(r * 100).toFixed(1)}%`);
const usd = (cents: number | null) => (cents === null ? "—" : `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const ms = (n: number | null) => (n === null ? "—" : `${Math.round(n)} ms`);

const STAGE_LABEL: Record<string, string> = {
  landing_view: "Landing views",
  assessment_start: "Assessments started",
  assessment_complete: "Assessments completed",
  checkout_start: "Checkouts started",
  subscription_created: "Subscriptions",
};

function GoNoGoBadge({ pass }: { pass: boolean | null }) {
  if (pass === null) return <span className="text-xs font-mono text-muted-foreground/60">NO DATA</span>;
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${pass ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
      {pass ? "GO" : "NO-GO"}
    </span>
  );
}

function Tile({ label, value, badge, sub }: { label: string; value: string; badge?: React.ReactNode; sub?: string }) {
  return (
    <Card className="p-4 bg-secondary border-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{label}</span>
        {badge}
      </div>
      <div className="text-2xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground/60 mt-1">{sub}</div>}
    </Card>
  );
}

export default function BusinessHealth() {
  const [days, setDays] = useState(30);
  const funnel = trpc.admin.funnel.useQuery({ days }, { enabled: true });
  const utils = trpc.useUtils();

  const [spend, setSpend] = useState({ amount: "", channel: "", note: "" });
  const addSpend = trpc.admin.addMarketingSpend.useMutation({
    onSuccess: () => { toast.success("Marketing spend recorded"); setSpend({ amount: "", channel: "", note: "" }); utils.admin.funnel.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const d = funnel.data;
  const goByMetric = Object.fromEntries((d?.goNoGo ?? []).map((r) => [r.metric, r]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Business Health</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map((n) => (
            <Button key={n} size="sm" variant={days === n ? "default" : "outline"} onClick={() => setDays(n)}>{n}d</Button>
          ))}
        </div>
      </div>

      {funnel.isLoading && <p className="text-muted-foreground/60 text-sm">Loading…</p>}
      {d && (
        <>
          {/* The three go/no-go numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Tile
              label="Assessment → Paid"
              value={pct(d.funnel.conversion.completeToPaid)}
              badge={<GoNoGoBadge pass={goByMetric["assessment→paid conversion"]?.pass ?? null} />}
              sub={`target ≥ ${(0.05 * 100).toFixed(0)}%`}
            />
            <Tile
              label="CAC"
              value={usd(d.cacCents)}
              badge={<GoNoGoBadge pass={goByMetric["CAC (cents)"]?.pass ?? null} />}
              sub={`spend ${usd(d.spendCents)} · ${d.funnel.counts.subscription_created} new subs · target ≤ $150`}
            />
            <Tile
              label="Month-2 Churn"
              value={pct(d.retention.churnRate)}
              badge={<GoNoGoBadge pass={goByMetric["month-2 churn"]?.pass ?? null} />}
              sub={`${d.retention.eligible} eligible · target ≤ 30%`}
            />
          </div>

          {/* Funnel stages */}
          <Card className="p-5 bg-secondary border-border">
            <h3 className="text-sm font-semibold text-white mb-3">Funnel — last {d.days} days</h3>
            <div className="space-y-2">
              {d.stages.map((stage) => {
                const count = (d.funnel.counts as Record<string, number>)[stage] ?? 0;
                const top = d.funnel.counts.landing_view || Math.max(1, count);
                const width = Math.min(100, (count / Math.max(1, top)) * 100);
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className="w-44 text-xs text-muted-foreground/70">{STAGE_LABEL[stage] ?? stage}</div>
                    <div className="flex-1 h-6 rounded bg-white/5 overflow-hidden">
                      <div className="h-full bg-primary/40" style={{ width: `${width}%` }} />
                    </div>
                    <div className="w-16 text-right text-sm font-mono text-white">{count}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground/60 font-mono">
              start→complete {pct(d.funnel.conversion.startToComplete)} · complete→paid {pct(d.funnel.conversion.completeToPaid)} · landing→paid {pct(d.funnel.conversion.landingToPaid)}
            </div>
          </Card>

          {/* Scoring pipeline health */}
          <Card className="p-5 bg-secondary border-border">
            <h3 className="text-sm font-semibold text-white mb-3">Scoring pipeline (last {d.days}d)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {(["llm", "stt"] as const).map((k) => {
                const h = d.pipeline[k];
                return (
                  <div key={k} className="rounded border border-border p-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground/70 mb-1">{k === "llm" ? "LLM scoring" : "Speech-to-text"}</div>
                    <div className="font-mono text-white text-xs space-y-0.5">
                      <div>runs: {h.count}</div>
                      <div>errors: {pct(h.errorRate)}</div>
                      <div>p50: {ms(h.p50Ms)} · p95: {ms(h.p95Ms)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Marketing spend entry (for CAC) */}
          <Card className="p-5 bg-secondary border-border">
            <h3 className="text-sm font-semibold text-white mb-1">Record marketing spend</h3>
            <p className="text-[11px] text-muted-foreground/60 mb-3">CAC = spend ÷ new subscribers in the window. Enter spend as it happens.</p>
            <div className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-[11px] text-muted-foreground/60 mb-1">Amount (USD)</label>
                <Input value={spend.amount} onChange={(e) => setSpend({ ...spend, amount: e.target.value })} placeholder="500" className="w-28 bg-background" />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground/60 mb-1">Channel</label>
                <Input value={spend.channel} onChange={(e) => setSpend({ ...spend, channel: e.target.value })} placeholder="meta / google" className="w-40 bg-background" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] text-muted-foreground/60 mb-1">Note</label>
                <Input value={spend.note} onChange={(e) => setSpend({ ...spend, note: e.target.value })} placeholder="optional" className="bg-background" />
              </div>
              <Button
                onClick={() => {
                  const amountCents = Math.round(parseFloat(spend.amount) * 100);
                  if (!Number.isFinite(amountCents) || amountCents < 0) { toast.error("Enter a valid amount"); return; }
                  addSpend.mutate({ periodStart: Date.now(), amountCents, channel: spend.channel || undefined, note: spend.note || undefined });
                }}
                disabled={addSpend.isPending}
              >
                Add spend
              </Button>
            </div>
          </Card>

          <p className="text-[11px] text-muted-foreground/50">
            Go/no-go gate: don't scale paid marketing until all three read GO on real data — assessment→paid ≥ 5%, CAC ≤ $150, month-2 churn ≤ 30%.
          </p>
        </>
      )}
    </div>
  );
}
