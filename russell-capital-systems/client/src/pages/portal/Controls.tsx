// ============================================================
// CONTROLS — the authority layer the Plan Ledger runs under, in one place:
// who may see what (consent), what agents may do (mandates), every proposed
// money movement and the firewall's verdict, the automations that react to
// the ledger, the signed advice log, values suggested by outside sources
// (health data, tax records) waiting for confirmation, and the versioned
// tax rules with a one-click recompute.
// ============================================================
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, KeyRound, Bot, Landmark, Workflow, FileSignature, Inbox, Scale } from "lucide-react";
import { CONSENT_SCOPES } from "@shared/consent";

const CARD = "rounded-2xl border border-violet-400/20 bg-white/[0.04]";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40";
const PRIMARY = "rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-40";
const INPUT = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white";
const TABS = [
  { id: "consent", label: "Consent", icon: KeyRound },
  { id: "mandates", label: "Mandates", icon: Bot },
  { id: "firewall", label: "Money firewall", icon: Landmark },
  { id: "automations", label: "Automations", icon: Workflow },
  { id: "advice", label: "Advice log", icon: FileSignature },
  { id: "suggestions", label: "Suggested values", icon: Inbox },
  { id: "rules", label: "Tax rules", icon: Scale },
] as const;
type Tab = (typeof TABS)[number]["id"];

const money = (c: number) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const when = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleString() : "—");

export default function Controls() {
  const [tab, setTab] = useState<Tab>("consent");
  return (
    <AppShell title="Controls">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80"><ShieldCheck size={12} className="mr-1 inline" /> The plan's authority layer</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Controls</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">Who may see your data, what agents may do with your money, every movement and the firewall's verdict, the automations that react to your ledger, the signed record of every piece of advice, values suggested by outside sources, and the tax rules in force. Every change here is sealed on your Plan Ledger.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tab === t.id ? "border-violet-400/60 bg-violet-500/20 text-white" : "border-white/10 text-slate-300 hover:bg-white/5"}`}><t.icon size={12} /> {t.label}</button>
            ))}
          </div>
        </div>
        {tab === "consent" && <ConsentTab />}
        {tab === "mandates" && <MandatesTab />}
        {tab === "firewall" && <FirewallTab />}
        {tab === "automations" && <AutomationsTab />}
        {tab === "advice" && <AdviceTab />}
        {tab === "suggestions" && <SuggestionsTab />}
        {tab === "rules" && <RulesTab />}
      </div>
    </AppShell>
  );
}

function ConsentTab() {
  const utils = trpc.useUtils();
  const q = trpc.controls.consent.list.useQuery({}, { refetchOnWindowFocus: false });
  const [granteeType, setGranteeType] = useState<"person" | "agent" | "integration" | "advisor">("integration");
  const [granteeId, setGranteeId] = useState("integration:fhir");
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<string[]>(["health:coverage", "health:claims"]);
  const [purpose, setPurpose] = useState("");
  const [days, setDays] = useState(90);
  const grant = trpc.controls.consent.grant.useMutation({ onSuccess: (r) => { toast.success(r.description); utils.controls.consent.list.invalidate(); }, onError: (e) => toast.error(e.message) });
  const revoke = trpc.controls.consent.revoke.useMutation({ onSuccess: () => { toast.success("Consent revoked"); utils.controls.consent.list.invalidate(); }, onError: (e) => toast.error(e.message) });
  const toggle = (s: string) => setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  return (
    <div className="space-y-4">
      <div className={`${CARD} p-5`} aria-label="Grant consent">
        <p className="text-sm font-semibold text-white">Grant consent</p>
        <p className="mt-1 text-xs text-slate-400">Time-boxed and revocable. Nothing reads a scoped source without an active grant.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <select value={granteeType} onChange={(e) => setGranteeType(e.target.value as typeof granteeType)} className={INPUT} aria-label="Grantee type"><option value="person">Person</option><option value="agent">Agent</option><option value="integration">Integration</option><option value="advisor">Advisor</option></select>
          <input value={granteeId} onChange={(e) => setGranteeId(e.target.value)} placeholder="integration:fhir · integration:tax-feed · agent:harvesting · spouse@…" className={INPUT} aria-label="Grantee id" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className={INPUT} aria-label="Grantee label" />
          <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value))} className={INPUT} aria-label="Days until it expires" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(CONSENT_SCOPES).map(([s, d]) => (
            <button key={s} type="button" title={d.description} onClick={() => toggle(s)} className={`rounded-full border px-2 py-0.5 text-[11px] ${scopes.includes(s) ? "border-teal-400/60 bg-teal-500/20 text-white" : "border-white/10 text-slate-400"}`}>{d.label}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose (shown on the ledger)" className={`${INPUT} flex-1`} aria-label="Purpose" />
          <button type="button" className={PRIMARY} disabled={!granteeId || !scopes.length || grant.isPending} onClick={() => grant.mutate({ granteeType, granteeId, granteeLabel: label || undefined, scopes, purpose: purpose || undefined, expiresAt: new Date(Date.now() + days * 86_400_000).toISOString() })}>Grant</button>
        </div>
      </div>
      <div className={`${CARD} p-5`} aria-label="Consent grants">
        <p className="text-sm font-semibold text-white">Grants</p>
        {q.data?.grants.length === 0 && <p className="mt-2 text-xs text-slate-500">No consent grants yet. The health bridge and tax feed stay closed until you grant them.</p>}
        <ul className="mt-2 divide-y divide-white/5">
          {(q.data?.grants ?? []).map((g) => {
            const active = !g.revokedAt && (!g.expiresAt || new Date(g.expiresAt).getTime() > Date.now());
            return (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <span className={`mr-2 rounded-full border px-2 py-0.5 text-[10px] uppercase ${active ? "border-teal-400/40 text-teal-300" : "border-white/10 text-slate-500"}`}>{active ? "active" : g.revokedAt ? "revoked" : "expired"}</span>
                  <span className="font-medium text-white">{g.granteeLabel ?? g.granteeId}</span> <span className="text-slate-400">· {g.scopes.join(", ")}</span>
                  <p className="text-xs text-slate-500">{g.purpose ?? "—"} · from {when(g.startsAt)} · {g.expiresAt ? `until ${when(g.expiresAt)}` : "until revoked"}</p>
                </div>
                {active && <button type="button" className={BTN} onClick={() => revoke.mutate({ id: g.id, reason: "revoked from Controls" })}>Revoke</button>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function MandatesTab() {
  const utils = trpc.useUtils();
  const q = trpc.controls.mandates.list.useQuery({}, { refetchOnWindowFocus: false });
  const [agentId, setAgentId] = useState("agent:bill-pay");
  const [label, setLabel] = useState("");
  const [actions, setActions] = useState<string[]>(["pay"]);
  const [ceiling, setCeiling] = useState(2500);
  const [periodCeiling, setPeriodCeiling] = useState(10000);
  const [approvalAbove, setApprovalAbove] = useState(1000);
  const [days, setDays] = useState(180);
  const grant = trpc.controls.mandates.grant.useMutation({ onSuccess: (r) => { toast.success(r.description); utils.controls.mandates.list.invalidate(); }, onError: (e) => toast.error(e.message) });
  const revoke = trpc.controls.mandates.revoke.useMutation({ onSuccess: () => { toast.success("Mandate revoked"); utils.controls.mandates.list.invalidate(); }, onError: (e) => toast.error(e.message) });
  const toggle = (a: string) => setActions((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  return (
    <div className="space-y-4">
      <div className={`${CARD} p-5`} aria-label="Grant a mandate">
        <p className="text-sm font-semibold text-white">Grant a mandate</p>
        <p className="mt-1 text-xs text-slate-400">Bounded authority for an agent: which actions, up to what per action and per 30 days, and the line above which a person must approve.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="agent id, e.g. agent:bill-pay" className={INPUT} aria-label="Agent id" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (optional)" className={INPUT} aria-label="Mandate label" />
          <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value))} className={INPUT} aria-label="Days until it expires" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(q.data?.actions ?? ["transfer", "pay", "contribute", "withdraw", "notify"]).map((a) => (
            <button key={a} type="button" onClick={() => toggle(a)} className={`rounded-full border px-2 py-0.5 text-[11px] ${actions.includes(a) ? "border-indigo-400/60 bg-indigo-500/20 text-white" : "border-white/10 text-slate-400"}`}>{a}</button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <label className="text-xs text-slate-400">Per action ($)<input type="number" min={0} value={ceiling} onChange={(e) => setCeiling(Number(e.target.value))} className={`${INPUT} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-400">Per 30 days ($)<input type="number" min={0} value={periodCeiling} onChange={(e) => setPeriodCeiling(Number(e.target.value))} className={`${INPUT} mt-1 w-full`} /></label>
          <label className="text-xs text-slate-400">Approval above ($)<input type="number" min={0} value={approvalAbove} onChange={(e) => setApprovalAbove(Number(e.target.value))} className={`${INPUT} mt-1 w-full`} /></label>
          <div className="flex items-end"><button type="button" className={PRIMARY} disabled={!agentId || !actions.length || grant.isPending} onClick={() => grant.mutate({ agentId, label: label || undefined, actions: actions as never, ceilingCents: Math.round(ceiling * 100), periodCeilingCents: Math.round(periodCeiling * 100), periodDays: 30, approvalAboveCents: Math.round(approvalAbove * 100), expiresAt: new Date(Date.now() + days * 86_400_000).toISOString() })}>Grant mandate</button></div>
        </div>
      </div>
      <div className={`${CARD} p-5`} aria-label="Mandates">
        <p className="text-sm font-semibold text-white">Mandates</p>
        {q.data?.mandates.length === 0 && <p className="mt-2 text-xs text-slate-500">No mandates. Agents can propose money movements, but the firewall holds every one for you until a mandate exists.</p>}
        <ul className="mt-2 divide-y divide-white/5">
          {(q.data?.mandates ?? []).map((m) => {
            const active = !m.revokedAt && (!m.expiresAt || new Date(m.expiresAt).getTime() > Date.now());
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <span className={`mr-2 rounded-full border px-2 py-0.5 text-[10px] uppercase ${active ? "border-indigo-400/40 text-indigo-300" : "border-white/10 text-slate-500"}`}>{active ? "active" : m.revokedAt ? "revoked" : "expired"}</span>
                  <span className="font-medium text-white">{m.label ?? m.agentId}</span> <span className="text-slate-400">· {m.actions.join(", ")}{m.ceilingCents != null ? ` · ≤ ${money(m.ceilingCents)} each` : ""}{m.periodCeilingCents != null ? ` · ≤ ${money(m.periodCeilingCents)} / ${m.periodDays ?? 30}d` : ""}{m.approvalAboveCents != null ? ` · approve above ${money(m.approvalAboveCents)}` : ""}</span>
                  <p className="text-xs text-slate-500">{m.expiresAt ? `until ${when(m.expiresAt)}` : "until revoked"}</p>
                </div>
                {active && <button type="button" className={BTN} onClick={() => revoke.mutate({ id: m.id, reason: "revoked from Controls" })}>Revoke</button>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function FirewallTab() {
  const utils = trpc.useUtils();
  const policy = trpc.controls.firewall.policy.useQuery({}, { refetchOnWindowFocus: false });
  const queue = trpc.controls.firewall.queue.useQuery({ limit: 100 }, { refetchOnWindowFocus: false });
  const [holdAbove, setHoldAbove] = useState<string>("");
  const [reserve, setReserve] = useState<string>("");
  const [blocked, setBlocked] = useState("");
  const [cooling, setCooling] = useState(24);
  const [action, setAction] = useState<"transfer" | "pay" | "contribute" | "withdraw">("pay");
  const [amount, setAmount] = useState(500);
  const [counterparty, setCounterparty] = useState("");
  const [purpose, setPurpose] = useState("");
  const [asAgent, setAsAgent] = useState("");
  const refresh = () => { utils.controls.firewall.queue.invalidate(); utils.controls.firewall.policy.invalidate(); };
  const setPolicy = trpc.controls.firewall.setPolicy.useMutation({ onSuccess: () => { toast.success("Policy sealed on the ledger"); refresh(); }, onError: (e) => toast.error(e.message) });
  const propose = trpc.controls.firewall.propose.useMutation({ onSuccess: (r) => { toast[r.verdict.decision === "block" ? "error" : r.verdict.decision === "hold" ? "warning" : "success"](`${r.status}: ${r.verdict.reasons.join("; ")}`); refresh(); }, onError: (e) => toast.error(e.message) });
  const approve = trpc.controls.firewall.approve.useMutation({ onSuccess: () => { toast.success("Approved and executed"); refresh(); }, onError: (e) => toast.error(e.message) });
  const reject = trpc.controls.firewall.reject.useMutation({ onSuccess: () => { toast.success("Rejected"); refresh(); }, onError: (e) => toast.error(e.message) });
  const execute = trpc.controls.firewall.execute.useMutation({ onSuccess: () => { toast.success("Executed"); refresh(); }, onError: (e) => toast.error(e.message) });
  const reverse = trpc.controls.firewall.reverse.useMutation({ onSuccess: () => { toast.success("Reversed"); refresh(); }, onError: (e) => toast.error(e.message) });
  const p = policy.data;
  return (
    <div className="space-y-4">
      <div className={`${CARD} p-5`} aria-label="Firewall policy">
        <p className="text-sm font-semibold text-white">Policy</p>
        {p && <p className="mt-1 text-xs text-slate-400">Agents {p.requireMandate ? "need a mandate" : "need no mandate"} · hold above {p.holdAboveCents != null ? money(p.holdAboveCents) : "off"} · new payees wait {p.newPayeeCoolingHours}h · reserve floor {p.reserveFloorCents != null ? money(p.reserveFloorCents) : "off"} · blocked: {p.blockedCounterparties.length ? p.blockedCounterparties.join(", ") : "none"} · {p.reversalWindowHours}h reversal window</p>}
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <input value={holdAbove} onChange={(e) => setHoldAbove(e.target.value)} placeholder="Hold above ($)" className={INPUT} aria-label="Hold above" />
          <input value={reserve} onChange={(e) => setReserve(e.target.value)} placeholder="Reserve floor ($)" className={INPUT} aria-label="Reserve floor" />
          <input value={blocked} onChange={(e) => setBlocked(e.target.value)} placeholder="Blocked payees, comma-separated" className={INPUT} aria-label="Blocked payees" />
          <input type="number" min={0} max={720} value={cooling} onChange={(e) => setCooling(Number(e.target.value))} className={INPUT} aria-label="New payee cooling hours" />
          <button type="button" className={PRIMARY} disabled={setPolicy.isPending} onClick={() => setPolicy.mutate({ policy: { holdAboveCents: holdAbove ? Math.round(Number(holdAbove) * 100) : null, reserveFloorCents: reserve ? Math.round(Number(reserve) * 100) : null, blockedCounterparties: blocked.split(",").map((s) => s.trim()).filter(Boolean), newPayeeCoolingHours: cooling } })}>Save policy</button>
        </div>
      </div>
      <div className={`${CARD} p-5`} aria-label="Propose a movement">
        <p className="text-sm font-semibold text-white">Propose a movement</p>
        <p className="mt-1 text-xs text-slate-400">Test the firewall as yourself, or as an agent id to see what its mandate allows. Nothing leaves a bank: movements are recorded on the ledger until live rails are attached.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-6">
          <select value={action} onChange={(e) => setAction(e.target.value as typeof action)} className={INPUT} aria-label="Action"><option value="pay">pay</option><option value="transfer">transfer</option><option value="contribute">contribute</option><option value="withdraw">withdraw</option></select>
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={INPUT} aria-label="Amount ($)" />
          <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Counterparty" className={INPUT} aria-label="Counterparty" />
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" className={INPUT} aria-label="Purpose" />
          <input value={asAgent} onChange={(e) => setAsAgent(e.target.value)} placeholder="As agent id (optional)" className={INPUT} aria-label="As agent" />
          <button type="button" className={PRIMARY} disabled={!purpose || propose.isPending} onClick={() => propose.mutate({ action, amountCents: Math.round(amount * 100), counterparty: counterparty || undefined, purpose, asAgent: asAgent || undefined })}>Propose</button>
        </div>
      </div>
      <div className={`${CARD} p-5`} aria-label="Movement queue">
        <p className="text-sm font-semibold text-white">Movements</p>
        {queue.data?.length === 0 && <p className="mt-2 text-xs text-slate-500">Nothing proposed yet.</p>}
        <ul className="mt-2 divide-y divide-white/5">
          {(queue.data ?? []).map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div>
                <span className={`mr-2 rounded-full border px-2 py-0.5 text-[10px] uppercase ${m.status === "executed" ? "border-emerald-400/40 text-emerald-300" : m.status === "held" ? "border-amber-300/40 text-amber-200" : m.status === "blocked" || m.status === "rejected" ? "border-rose-400/40 text-rose-300" : "border-white/10 text-slate-400"}`}>{m.status}</span>
                <span className="font-medium text-white">{m.action} {money(m.amountCents)}{m.counterparty ? ` → ${m.counterparty}` : ""}</span> <span className="text-slate-400">· {m.purpose} · by {m.proposedByName ?? m.proposedBy}</span>
                <p className="text-xs text-slate-500">{m.reasons.join("; ")}{m.reversibleUntil ? ` · reversible until ${when(m.reversibleUntil)}` : ""}</p>
              </div>
              <div className="flex gap-2">
                {m.status === "held" && <button type="button" className={PRIMARY} onClick={() => approve.mutate({ id: m.id })}>Approve</button>}
                {m.status === "approved" && <button type="button" className={PRIMARY} onClick={() => execute.mutate({ id: m.id })}>Execute</button>}
                {(m.status === "held" || m.status === "approved") && <button type="button" className={BTN} onClick={() => reject.mutate({ id: m.id, reason: "rejected from Controls" })}>Reject</button>}
                {m.status === "executed" && m.reversibleUntil && new Date(m.reversibleUntil).getTime() > Date.now() && <button type="button" className={BTN} onClick={() => reverse.mutate({ id: m.id, reason: "reversed from Controls" })}>Reverse</button>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AutomationsTab() {
  const utils = trpc.useUtils();
  const q = trpc.controls.automations.list.useQuery({}, { refetchOnWindowFocus: false });
  const [name, setName] = useState("Tell me when a document lands");
  const [triggerKind, setTriggerKind] = useState("document");
  const [triggerKey, setTriggerKey] = useState("");
  const [actionType, setActionType] = useState<"notify" | "append_status" | "propose_movement">("notify");
  const [to, setTo] = useState("owner");
  const [body, setBody] = useState("Plan update: {{summary}}");
  const refresh = () => utils.controls.automations.list.invalidate();
  const create = trpc.controls.automations.create.useMutation({ onSuccess: () => { toast.success("Automation created"); refresh(); }, onError: (e) => toast.error(e.message) });
  const toggle = trpc.controls.automations.toggle.useMutation({ onSuccess: refresh, onError: (e) => toast.error(e.message) });
  const remove = trpc.controls.automations.remove.useMutation({ onSuccess: refresh, onError: (e) => toast.error(e.message) });
  const reverseRun = trpc.controls.automations.reverseRun.useMutation({ onSuccess: (r) => { toast[r.ok ? "success" : "warning"](r.detail); refresh(); }, onError: (e) => toast.error(e.message) });
  const params = actionType === "notify" ? { channel: "email", to, body } : actionType === "append_status" ? { key: "automation.note", summary: body } : { action: "pay", amountCents: 0, purpose: body };
  return (
    <div className="space-y-4">
      <div className={`${CARD} p-5`} aria-label="Create an automation">
        <p className="text-sm font-semibold text-white">Create an automation</p>
        <p className="mt-1 text-xs text-slate-400">When an event of this kind (and key) lands on your ledger, do this. Runs once per event; money actions go through the firewall under the automation's own mandate.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-6">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={`${INPUT} md:col-span-2`} aria-label="Automation name" />
          <select value={triggerKind} onChange={(e) => setTriggerKind(e.target.value)} className={INPUT} aria-label="Trigger kind">{["fact", "status", "document", "decision", "outcome", "journey", "message", "control", "consent", "mandate", "rules"].map((k) => <option key={k} value={k}>{k}</option>)}</select>
          <input value={triggerKey} onChange={(e) => setTriggerKey(e.target.value)} placeholder="Key or prefix* (optional)" className={INPUT} aria-label="Trigger key" />
          <select value={actionType} onChange={(e) => setActionType(e.target.value as typeof actionType)} className={INPUT} aria-label="Action"><option value="notify">notify</option><option value="append_status">append status</option><option value="propose_movement">propose movement</option></select>
          <button type="button" className={PRIMARY} disabled={!name || create.isPending} onClick={() => create.mutate({ name, triggerKind, triggerKey: triggerKey || undefined, actionType, actionParams: params })}>Create</button>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {actionType === "notify" && <input value={to} onChange={(e) => setTo(e.target.value)} placeholder='"owner" or an email' className={INPUT} aria-label="Recipient" />}
          <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Text · {{summary}} {{key}} {{value}}" className={`${INPUT} md:col-span-2`} aria-label="Action text" />
        </div>
      </div>
      <div className={`${CARD} p-5`} aria-label="Automations">
        <p className="text-sm font-semibold text-white">Automations</p>
        {q.data?.automations.length === 0 && <p className="mt-2 text-xs text-slate-500">None yet.</p>}
        <ul className="mt-2 divide-y divide-white/5">
          {(q.data?.automations ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div><span className="font-medium text-white">{a.name}</span> <span className="text-slate-400">· on {a.triggerKind}{a.triggerKey ? ` ${a.triggerKey}` : ""} → {a.actionType.replace("_", " ")}</span></div>
              <div className="flex gap-2">
                <button type="button" className={BTN} onClick={() => toggle.mutate({ id: a.id, enabled: !a.enabled })}>{a.enabled ? "Pause" : "Resume"}</button>
                <button type="button" className={BTN} onClick={() => remove.mutate({ id: a.id })}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={`${CARD} p-5`} aria-label="Automation runs">
        <p className="text-sm font-semibold text-white">Runs</p>
        {q.data?.runs.length === 0 && <p className="mt-2 text-xs text-slate-500">No runs yet.</p>}
        <ul className="mt-2 divide-y divide-white/5">
          {(q.data?.runs ?? []).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div><span className="mr-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-300">{r.status}</span><span className="text-slate-300">automation #{r.automationId} · {when(r.createdAt)}</span> <span className="text-xs text-slate-500">{JSON.stringify(r.result ?? {})}</span></div>
              {r.reversible && r.status === "ran" && <button type="button" className={BTN} onClick={() => reverseRun.mutate({ runId: r.id, reason: "reversed from Controls" })}>Reverse</button>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AdviceTab() {
  const q = trpc.controls.advice.log.useQuery({ limit: 50 }, { refetchOnWindowFocus: false });
  return (
    <div className={`${CARD} p-5`} aria-label="Signed advice log">
      <p className="text-sm font-semibold text-white">Signed advice log</p>
      <p className="mt-1 text-xs text-slate-400">Every answer the Financial Librarian gave: which voices spoke, which of your facts it saw (by key), the rule version, and a signature that proves the record has not changed.</p>
      {q.data?.length === 0 && <p className="mt-2 text-xs text-slate-500">No advice recorded yet. Ask the Financial Librarian a question.</p>}
      <ul className="mt-2 divide-y divide-white/5">
        {(q.data ?? []).map((a) => (
          <li key={a.id} className="py-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              {a.verified ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 px-2 py-0.5 text-[10px] text-emerald-300"><ShieldCheck size={11} /> verified</span> : <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 px-2 py-0.5 text-[10px] text-rose-300"><ShieldAlert size={11} /> {a.verification}</span>}
              <span className="text-xs text-slate-500">{when(a.occurredAt)} · {a.via} · rules {a.rulesVersion} · {a.voices.length ? a.voices.join(", ") : "offline"}</span>
            </div>
            <p className="mt-1 font-medium text-white">{a.question}</p>
            <p className="mt-1 text-slate-300">{a.answer}</p>
            <p className="mt-1 text-[11px] text-slate-500">Facts seen: {a.factsUsed.length} · {a.factsUsed.slice(0, 8).join(", ")}{a.factsUsed.length > 8 ? "…" : ""}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionsTab() {
  const utils = trpc.useUtils();
  const q = trpc.controls.suggestions.list.useQuery({}, { refetchOnWindowFocus: false });
  const [patientId, setPatientId] = useState("");
  const [taxpayerRef, setTaxpayerRef] = useState("");
  const [transcript, setTranscript] = useState("");
  const refresh = () => utils.controls.suggestions.list.invalidate();
  const decide = trpc.controls.suggestions.decide.useMutation({ onSuccess: refresh, onError: (e) => toast.error(e.message) });
  const health = trpc.controls.suggestions.importHealth.useMutation({ onSuccess: (r) => { toast.success(`${r.suggested} value${r.suggested === 1 ? "" : "s"} suggested from ${r.read.coverage + r.read.eob} records`); refresh(); }, onError: (e) => toast.error(e.message) });
  const feed = trpc.controls.suggestions.importTaxFeed.useMutation({ onSuccess: (r) => { toast.success(`${r.suggested} value${r.suggested === 1 ? "" : "s"} suggested${r.taxYear ? ` for ${r.taxYear}` : ""}`); refresh(); }, onError: (e) => toast.error(e.message) });
  const paste = trpc.controls.suggestions.importTranscript.useMutation({ onSuccess: (r) => { toast.success(`${r.suggested} value${r.suggested === 1 ? "" : "s"} suggested for ${r.taxYear}`); setTranscript(""); refresh(); }, onError: (e) => toast.error(e.message) });
  const pending = (q.data?.suggestions ?? []).filter((s) => s.status === "pending");
  const decided = (q.data?.suggestions ?? []).filter((s) => s.status !== "pending");
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${CARD} p-5`} aria-label="Health data bridge">
          <p className="text-sm font-semibold text-white">Health data (FHIR)</p>
          <p className="mt-1 text-xs text-slate-400">{q.data?.sources.fhir ? "Connected. Needs a consent grant for integration:fhir." : "Not configured on the host (FHIR_BASE_URL, FHIR_ACCESS_TOKEN)."}</p>
          <input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Patient id at the source" className={`${INPUT} mt-2 w-full`} aria-label="Patient id" />
          <button type="button" className={`${PRIMARY} mt-2`} disabled={!patientId || health.isPending} onClick={() => health.mutate({ patientId })}>Read coverage & claims</button>
        </div>
        <div className={`${CARD} p-5`} aria-label="Tax feed">
          <p className="text-sm font-semibold text-white">Tax fact feed</p>
          <p className="mt-1 text-xs text-slate-400">{q.data?.sources.taxFeed ? "Connected. Needs a consent grant for integration:tax-feed." : "Not configured on the host (TAX_FEED_URL)."}</p>
          <input value={taxpayerRef} onChange={(e) => setTaxpayerRef(e.target.value)} placeholder="Taxpayer reference at the provider" className={`${INPUT} mt-2 w-full`} aria-label="Taxpayer reference" />
          <button type="button" className={`${PRIMARY} mt-2`} disabled={!taxpayerRef || feed.isPending} onClick={() => feed.mutate({ taxpayerRef })}>Read tax record</button>
        </div>
        <div className={`${CARD} p-5`} aria-label="Paste a transcript">
          <p className="text-sm font-semibold text-white">IRS transcript</p>
          <p className="mt-1 text-xs text-slate-400">Paste the text of a return or account transcript. Only labelled lines are read.</p>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={3} placeholder="ADJUSTED GROSS INCOME: …" className={`${INPUT} mt-2 w-full`} aria-label="Transcript text" />
          <button type="button" className={`${PRIMARY} mt-2`} disabled={transcript.length < 20 || paste.isPending} onClick={() => paste.mutate({ text: transcript })}>Parse</button>
        </div>
      </div>
      <div className={`${CARD} p-5`} aria-label="Pending suggestions">
        <p className="text-sm font-semibold text-white">Waiting for your confirmation</p>
        {pending.length === 0 && <p className="mt-2 text-xs text-slate-500">Nothing pending. Values arrive here from outside sources and never enter your assessment until you accept them.</p>}
        <ul className="mt-2 divide-y divide-white/5">
          {pending.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div>
                <span className="font-medium text-white">{s.label ?? s.key}</span> <span className="text-slate-300">→ {String(s.value)}</span> {s.currentValue != null && <span className="text-xs text-slate-500">(now {String(s.currentValue)})</span>}
                <p className="text-xs text-slate-500">{s.source} · {s.sourceRef} · confidence {s.confidence}{s.note ? ` · ${s.note}` : ""}</p>
              </div>
              <div className="flex gap-2"><button type="button" className={PRIMARY} onClick={() => decide.mutate({ id: s.id, accept: true })}>Accept</button><button type="button" className={BTN} onClick={() => decide.mutate({ id: s.id, accept: false })}>Reject</button></div>
            </li>
          ))}
        </ul>
        {decided.length > 0 && <p className="mt-3 text-xs text-slate-500">{decided.length} decided earlier.</p>}
      </div>
    </div>
  );
}

function RulesTab() {
  const versions = trpc.controls.rules.versions.useQuery(undefined, { refetchOnWindowFocus: false });
  const picture = trpc.controls.rules.picture.useQuery({}, { refetchOnWindowFocus: false });
  const [from, setFrom] = useState("2025.rp-24-40+obbba");
  const [to, setTo] = useState("2026.rp-25-32");
  const diff = trpc.controls.rules.diff.useQuery({ from, to }, { refetchOnWindowFocus: false });
  const recompute = trpc.controls.rules.recompute.useMutation({ onSuccess: (r) => toast.success(r.summary), onError: (e) => toast.error(e.message) });
  const p = picture.data?.picture;
  const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
  const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return (
    <div className="space-y-4">
      <div className={`${CARD} p-5`} aria-label="Rule versions">
        <p className="text-sm font-semibold text-white">Rule sets in force · current {versions.data?.current}</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {(versions.data?.versions ?? []).map((v) => (
            <div key={v.version} className="rounded-xl border border-white/10 p-3 text-xs text-slate-300">
              <p className="font-semibold text-white">{v.version} · tax year {v.taxYear}</p>
              <p className="mt-1 text-slate-500">{v.source}</p>
              <p className="mt-1">Standard deduction: single {usd(v.standardDeduction.single)} · joint {usd(v.standardDeduction.joint)} · HoH {usd(v.standardDeduction.hoh)}</p>
              <p>401(k) {usd(v.retirement.deferral401k)} · catch-up 50+ {usd(v.retirement.catchUp50)} · 60–63 {usd(v.retirement.catchUp60to63)} · IRA {usd(v.retirement.ira)}</p>
              <p>Estate exclusion {usd(v.estateBasicExclusion)} · SALT cap {usd(v.salt.cap)} (phases down above {usd(v.salt.phaseDownStartMagi)} to {usd(v.salt.floor)})</p>
            </div>
          ))}
        </div>
      </div>
      <div className={`${CARD} p-5`} aria-label="Your picture">
        <p className="text-sm font-semibold text-white">Your federal picture under {picture.data?.rulesVersion}</p>
        {!p && <p className="mt-2 text-xs text-slate-500">Enter adjusted gross income and filing status in the Financial Assessment to see it.</p>}
        {p && (
          <div className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <Row k="Filing" v={p.filing} /><Row k="AGI" v={usd(p.agi)} />
            <Row k="Deduction" v={`${p.deductionMethod} ${usd(p.deduction)}`} /><Row k="SALT allowed" v={usd(p.saltAllowed)} />
            <Row k="Taxable income" v={usd(p.taxableIncome)} /><Row k="Federal tax" v={usd(p.federalTax)} />
            <Row k="Marginal rate" v={pct(p.marginalRate)} /><Row k="Effective on AGI" v={pct(p.effectiveRateOnAgi)} />
            <Row k="401(k) room" v={`${usd(p.retirement.deferral401k)}${p.retirement.catchUp ? ` + ${usd(p.retirement.catchUp)} catch-up` : ""}`} /><Row k="Estate exclusion" v={usd(p.estateBasicExclusion)} />
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-500">Directional, from AGI and the deductions in your assessment; your tax professional confirms every figure.</p>
      </div>
      <div className={`${CARD} p-5`} aria-label="Recompute">
        <p className="text-sm font-semibold text-white">What a rule change does to you</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={INPUT} aria-label="From version">{(versions.data?.versions ?? []).map((v) => <option key={v.version} value={v.version}>{v.version}</option>)}</select>
          <span className="text-slate-500">→</span>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={INPUT} aria-label="To version">{(versions.data?.versions ?? []).map((v) => <option key={v.version} value={v.version}>{v.version}</option>)}</select>
          <button type="button" className={PRIMARY} disabled={!p || recompute.isPending} onClick={() => recompute.mutate({ from, to })}>Recompute and seal on the ledger</button>
        </div>
        <p className="mt-2 text-xs text-slate-400">{diff.data?.length ?? 0} published figures differ between these rule sets.</p>
        <ul className="mt-1 max-h-48 overflow-auto text-[11px] text-slate-500">
          {(diff.data ?? []).slice(0, 40).map((c) => <li key={c.field}>{c.field}: {c.from == null ? "—" : c.from.toLocaleString("en-US")} → {c.to == null ? "—" : c.to.toLocaleString("en-US")}</li>)}
        </ul>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between border-b border-white/5 py-1"><span className="text-slate-400">{k}</span><span className="font-medium text-white">{v}</span></div>;
}
