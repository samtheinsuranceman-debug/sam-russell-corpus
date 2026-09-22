/**
 * AIStackPanel — "who am I actually talking to?"
 *
 * A narrow vertical column beside the advisor showing every model in the
 * stack: company, country, exact version, where it sits in that company's
 * range, the thinking budget, and — the part that matters — whether it is
 * really connected.
 *
 * Connection state comes from the server. Nothing in this file can make an
 * unconnected model look connected, which is the only reason the panel is
 * worth putting in front of a client.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Circle,
  Cpu,
  Globe,
  Info,
  Loader2,
  ShieldAlert,
} from "lucide-react";

type Connection = "live" | "configured" | "not_connected";

const CONNECTION_META: Record<Connection, { label: string; dot: string; text: string; ring: string }> = {
  live: { label: "Live", dot: "bg-emerald-400", text: "text-emerald-400", ring: "ring-emerald-400/30" },
  configured: { label: "Configured", dot: "bg-amber-400", text: "text-amber-400", ring: "ring-amber-400/30" },
  not_connected: { label: "Not connected", dot: "bg-slate-600", text: "text-slate-500", ring: "ring-slate-600/30" },
};

export default function AIStackPanel({ className }: { className?: string }) {
  const { data, isLoading } = trpc.aiStack.status.useQuery(undefined, { staleTime: 60_000 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <aside className={cn("rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/80 p-4", className)}>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking the AI stack…
        </div>
      </aside>
    );
  }
  if (!data) return null;

  const { counts, headline, models, advisor, registryVerifiedAsOf } = data;
  const liveModels = models.filter(m => m.connection === "live");
  const singleModel = counts.live === 1;

  return (
    <aside
      className={cn(
        "flex flex-col rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/80 backdrop-blur overflow-hidden",
        className,
      )}
      aria-label="AI stack transparency panel"
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[#1e3a5f]/50">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-500 shrink-0" />
          <h2 className="text-sm font-semibold text-white tracking-tight">The AI Stack</h2>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          Exactly what is analysing your situation.
        </p>
      </div>

      {/* Headline count — the honest number, stated before any list */}
      <div className="px-4 py-3 border-b border-[#1e3a5f]/40 bg-[#111827]/40">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white tabular-nums">{counts.live}</span>
          <span className="text-xs text-slate-500">
            of {counts.total} model{counts.total === 1 ? "" : "s"} answering
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{headline}</p>

        {counts.live === 0 && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-red-500/10 border border-red-500/25 px-2.5 py-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-px" />
            <p className="text-[11px] text-red-300 leading-relaxed">
              No model has answered yet this session. {advisor.name} cannot give analysis until one does.
            </p>
          </div>
        )}

        {singleModel && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2.5 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-px" />
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              One model, not a panel. Everything {advisor.name} tells you comes from a single system — there is no
              second opinion behind it yet.
            </p>
          </div>
        )}
      </div>

      {/* Model list */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e3a5f]/30">
        {[...liveModels, ...models.filter(m => m.connection !== "live")].map(model => {
          const meta = CONNECTION_META[model.connection as Connection];
          const open = expandedId === model.id;
          const dim = model.connection === "not_connected";

          return (
            <div key={model.id} className={cn("px-4 py-3", dim && "opacity-55")}>
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : model.id)}
                className="w-full text-left group"
                aria-expanded={open}
              >
                <div className="flex items-start gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ring-2", meta.dot, meta.ring)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-white truncate">{model.versionLabel}</span>
                      {model.isFlagship && !dim && (
                        <span className="shrink-0 rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          Top tier
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                      <span className="truncate">{model.provider}</span>
                      <span className="text-slate-700">·</span>
                      <span className={meta.text}>{meta.label}</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-600 shrink-0 mt-1 transition-transform group-hover:text-slate-400",
                      open && "rotate-180",
                    )}
                  />
                </div>
              </button>

              {open && (
                <dl className="mt-3 ml-3.5 space-y-2 border-l border-[#1e3a5f]/50 pl-3">
                  <Row icon={<Globe className="w-3 h-3" />} label="Based in" value={model.providerCountry} />
                  <Row label="Model ID" value={<code className="text-[10px] text-slate-400">{model.modelId}</code>} />
                  <Row label="Tier" value={tierText(model)} />
                  <Row label="Thinking" value={effortText(model.reasoningEffort)} />
                  {model.contextWindow && (
                    <Row label="Context" value={`${(model.contextWindow / 1000).toLocaleString()}K tokens`} />
                  )}
                  <Row label="Used for" value={model.role} />
                  {model.note && (
                    <div className="flex items-start gap-1.5 rounded-lg bg-[#111827]/70 border border-[#1e3a5f]/40 px-2.5 py-2 mt-2">
                      <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                      <p className="text-[10.5px] text-slate-400 leading-relaxed">{model.note}</p>
                    </div>
                  )}
                </dl>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1e3a5f]/50 bg-[#060a12]/60 space-y-2">
        <p className="text-[10.5px] text-slate-500 leading-relaxed">{advisor.disclosure}</p>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          Model tiers last verified {registryVerifiedAsOf}. These providers release new models
          frequently — a tier shown as "top" can be superseded within weeks.
        </p>
      </div>
    </aside>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-600">
        {icon}
        {label}
      </dt>
      <dd className="text-[11.5px] text-slate-300 leading-relaxed mt-0.5">{value}</dd>
    </div>
  );
}

function tierText(model: { isFlagship: boolean; tierRank: number; modelsInFamily: number; provider: string; verifiedAsOf: string }) {
  if (model.isFlagship) {
    return (
      <span>
        <span className="text-amber-400 font-medium">Most capable</span> of the {model.modelsInFamily} {model.provider} models
        recorded here.
      </span>
    );
  }
  return (
    <span>
      Tier {model.tierRank} of {model.modelsInFamily}.{" "}
      <span className="text-amber-400/80">Not {model.provider}'s most capable model.</span>
    </span>
  );
}

function effortText(effort: string) {
  const map: Record<string, { label: string; warn?: boolean }> = {
    minimal: { label: "Minimal — near-zero reasoning budget", warn: true },
    low: { label: "Low", warn: true },
    medium: { label: "Medium" },
    high: { label: "High" },
    maximum: { label: "Maximum" },
  };
  const m = map[effort] ?? { label: "Not reported" };
  return <span className={m.warn ? "text-amber-400/90" : undefined}>{m.label}</span>;
}

/**
 * Compact one-line version for headers and mobile, where the full column does
 * not fit. Tapping it should open the full panel.
 */
export function AIStackBadge({ onClick, className }: { onClick?: () => void; className?: string }) {
  const { data } = trpc.aiStack.status.useQuery(undefined, { staleTime: 60_000 });
  if (!data) return null;

  const live = data.counts.live;
  const tone = live === 0 ? "text-red-400" : live === 1 ? "text-amber-400" : "text-emerald-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#1e3a5f]/70 bg-[#0a0f1a]/80 px-2.5 py-1 text-[11px] text-slate-400 hover:border-amber-500/40 transition-colors",
        className,
      )}
      aria-label={`AI stack: ${live} models answering. Open details.`}
    >
      {live === 0 ? <Circle className="w-2.5 h-2.5" /> : <Check className="w-3 h-3" />}
      <span className={cn("font-medium tabular-nums", tone)}>{live}</span>
      <span className="hidden sm:inline">model{live === 1 ? "" : "s"} live</span>
    </button>
  );
}
