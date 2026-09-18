// ============================================================
// CONNECTIONS — every outside platform the site can use, grouped, with a
// real on/off state read from the host environment (never the values), what
// each one is wired to, and the variables that switch it on. The owner can
// fire a test event to prove Zapier / Make / n8n / Slack are listening.
// ============================================================
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plug, CheckCircle2, Circle, Send, Radio, ExternalLink } from "lucide-react";

const CARD = "rounded-2xl border border-white/10 bg-white/[0.04]";
const CATEGORY_LABEL: Record<string, string> = { ai: "AI team", voice: "Voice & video", messaging: "Messaging", data: "Financial data", crm: "CRM", billing: "Billing", automation: "Automation (receives the ledger)", analytics: "Analytics & support", hosting: "Hosting", documents: "Documents" };
const ORDER = ["automation", "messaging", "crm", "data", "ai", "voice", "billing", "analytics", "hosting", "documents"];

export default function Connections() {
  const status = trpc.integrations.status.useQuery(undefined, { refetchOnWindowFocus: false });
  const [note, setNote] = useState("");
  const test = trpc.integrations.testEvent.useMutation({
    onSuccess: (r) => toast[r.attempted ? "success" : "warning"](r.attempted ? `Delivered ${r.delivered} of ${r.attempted} (${[...r.targets, r.slack ? "slack" : ""].filter(Boolean).join(", ")})` : "No receivers configured — set ZAPIER_HOOK_URL, MAKE_HOOK_URL, N8N_HOOK_URL, EVENT_WEBHOOK_URLS or SLACK_WEBHOOK_URL"),
    onError: (e) => toast.error(e.message),
  });
  const d = status.data;
  const groups = ORDER.map((cat) => ({ cat, items: (d?.integrations ?? []).filter((i) => i.category === cat) })).filter((g) => g.items.length);

  return (
    <AppShell title="Connections">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400"><Plug size={12} className="mr-1 inline" /> Platform connections</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Connections</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">Every outside platform the site can use. A connection is on when its variables are set in the host's environment panel; values never appear here. The Plan Ledger is the spine: every event it records is sent to the automation receivers below.</p>
          {d && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 px-2 py-0.5">{d.configuredCount} of {d.total} on</span>
              <span>AI voices: {d.live.aiProviders.length ? d.live.aiProviders.join(", ") : "none"}</span>
              <span>Email: {d.live.messaging.email}</span>
              <span>SMS: {d.live.messaging.sms}</span>
              <span>Benchmarks: {d.live.fred ? "FRED live" : "reference values"}</span>
              <span>CRM: {d.live.hubspot ? "HubSpot" : "off"}</span>
            </div>
          )}
        </div>

        <div className={`${CARD} p-5`} aria-label="Ledger receivers">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200"><Radio size={12} className="mr-1 inline" /> Ledger receivers</p>
              <p className="mt-1 text-sm text-slate-300">
                {d?.live.bus.targets.length ? `Sending to ${d.live.bus.targets.join(", ")}` : "No webhook receivers yet"}{d?.live.bus.slack ? " · Slack on" : ""} · kinds: {d?.live.bus.kinds.join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Test note (optional)" aria-label="Test note" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
              <button type="button" onClick={() => test.mutate({ note: note || undefined })} disabled={test.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-40"><Send size={14} /> Send test event</button>
            </div>
          </div>
        </div>

        {status.isLoading && <p className="text-sm text-slate-400">Reading the host configuration…</p>}
        {groups.map((g) => (
          <section key={g.cat} aria-label={CATEGORY_LABEL[g.cat]}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{CATEGORY_LABEL[g.cat] ?? g.cat}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {g.items.map((i) => (
                <div key={i.id} className={`${CARD} p-4 ${i.configured ? "border-emerald-400/30" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-semibold text-white">{i.configured ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Circle size={15} className="text-slate-600" />}{i.name}</p>
                      <p className="mt-1 text-sm text-slate-300">{i.purpose}</p>
                      <p className="mt-1 text-xs text-slate-500">Wired to: {i.wiredTo}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${i.configured ? "border-emerald-400/40 text-emerald-300" : "border-white/10 text-slate-500"}`}>{i.configured ? "on" : i.mode}</span>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-slate-400">{i.envKeys.join(" · ")}{i.optionalKeys?.length ? <span className="text-slate-600"> · optional: {i.optionalKeys.join(", ")}</span> : null}</p>
                  {!i.configured && i.missing.length > 0 && <p className="mt-1 text-[11px] text-amber-300/80">Set {i.missing.join(", ")} on the host to switch on.</p>}
                  {i.docs && <a href={i.docs} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] text-sky-300 hover:underline">Setup guide <ExternalLink size={10} /></a>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
