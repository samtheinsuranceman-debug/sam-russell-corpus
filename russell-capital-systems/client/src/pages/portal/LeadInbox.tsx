// ============================================================
// LEAD INBOX (owner-gated) — read and triage prospects captured by the
// homepage AI concierge / Tax & Savings Estimate. This is the ONLY place
// the illustrative advisor figures are shown; they never reach the public.
// ============================================================
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, Clock, AlertTriangle, User, Inbox, Download, Search, Send, MessageSquare, CheckCircle2, XCircle, Ban, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import type { LeadStatus } from "@shared/leadTypes";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "client"];
const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "#22c55e", contacted: "#f59e0b", qualified: "#38bdf8", client: "#a78bfa",
};

const usd = (n?: number | null) =>
  typeof n === "number" ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";
const pct = (n?: number | null) => (typeof n === "number" ? `${(n * 100).toFixed(1)}%` : "—");

export default function LeadInbox() {
  const utils = trpc.useUtils();
  const list = trpc.leads.list.useQuery({ limit: 200 });
  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => { void utils.leads.list.invalidate(); },
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  const allLeads = list.data ?? [];
  const q = search.trim().toLowerCase();
  const leads = allLeads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (!q) return true;
    const hay = [l.firstName, l.lastName, l.email, l.phone, l.question, l.bestTimeToContact]
      .filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });
  const selected = leads.find((l) => l.id === selectedId) ?? leads[0] ?? null;

  type Lead = (typeof leads)[number];
  const exportCsv = () => {
    if (leads.length === 0) return;
    const cell = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      const s = typeof v === "object" ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const cols: Array<{ h: string; get: (l: Lead) => unknown }> = [
      { h: "id", get: (l) => l.id },
      { h: "createdAt", get: (l) => l.createdAt },
      { h: "lastSeenAt", get: (l) => l.lastSeenAt },
      { h: "status", get: (l) => l.status },
      { h: "firstName", get: (l) => l.firstName },
      { h: "lastName", get: (l) => l.lastName },
      { h: "email", get: (l) => l.email },
      { h: "phone", get: (l) => l.phone },
      { h: "bestTimeToContact", get: (l) => l.bestTimeToContact },
      { h: "question", get: (l) => l.question },
      { h: "consentedAt", get: (l) => l.consentedAt },
      { h: "lastIp", get: (l) => l.lastIp },
      { h: "w2Income", get: (l) => l.factFinder?.w2Income },
      { h: "estimatedTaxes", get: (l) => l.factFinder?.estimatedTaxes },
      { h: "spouseIncome", get: (l) => l.factFinder?.spouseIncome },
      { h: "spouseTaxes", get: (l) => l.factFinder?.spouseTaxes },
      { h: "studentDebt", get: (l) => l.factFinder?.studentDebt },
      { h: "studentDebtRate", get: (l) => l.factFinder?.studentDebtRate },
      { h: "homeEquity", get: (l) => l.factFinder?.homeEquity },
      { h: "mortgageBalance", get: (l) => l.factFinder?.mortgageBalance },
      { h: "mortgageInterestOnlyMonthly", get: (l) => l.factFinder?.mortgageInterestOnlyMonthly },
      { h: "mortgageYearsRemaining", get: (l) => l.factFinder?.mortgageYearsRemaining },
      { h: "taxDeferredSelf", get: (l) => l.factFinder?.taxDeferredSelf },
      { h: "taxDeferredSpouse", get: (l) => l.factFinder?.taxDeferredSpouse },
      { h: "liquidInvestments", get: (l) => l.factFinder?.liquidInvestments },
      { h: "liquidTaxability", get: (l) => l.factFinder?.liquidTaxability },
      { h: "goals", get: (l) => l.factFinder?.goals },
      { h: "illustrative_rothBase", get: (l) => l.analysis?.advisorFigures?.rothConversionBase },
      { h: "illustrative_rothReference", get: (l) => l.analysis?.advisorFigures?.illustrativeRothTaxValue },
      { h: "illustrative_interestOnlyExposure", get: (l) => l.analysis?.advisorFigures?.lifetimeInterestOnlyExposure },
      { h: "illustrative_interestSaved", get: (l) => l.analysis?.advisorFigures?.illustrativeInterestPotentiallySaved },
      { h: "illustrative_equityFirstStep", get: (l) => l.analysis?.advisorFigures?.equityDeployedFirstStep },
      { h: "illustrative_oilGasDeduction", get: (l) => l.analysis?.advisorFigures?.oilGasDeduction },
      { h: "illustrative_oilGasTaxOffset", get: (l) => l.analysis?.advisorFigures?.illustrativeOilGasTaxOffset },
      { h: "illustrative_blendedRate", get: (l) => l.analysis?.advisorFigures?.blendedTaxRateUsed },
    ];
    const header = cols.map((c) => c.h).join(",");
    const rows = leads.map((l) => cols.map((c) => cell(c.get(l))).join(","));
    // Prepend a note row so the file is self-documenting on its illustrative nature.
    const note = cell("Illustrative, assumption-based figures for advisor review only — not projections, guarantees, or advice.");
    const csv = `${note}\n${header}\n${rows.join("\n")}`;
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rcs-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const ff = selected?.factFinder ?? null;
  const fig = selected?.analysis?.advisorFigures ?? null;

  return (
    <AppShell title="Lead Inbox">
      <div className="rc-page-header">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Inbox size={22} className="text-emerald-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Homepage Lead Inbox</h1>
              <p className="text-sm text-slate-400">Prospects from the AI concierge and Tax &amp; Savings Estimate. Figures are illustrative — for advisor review only.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={leads.length === 0}
            className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40"
          >
            <Download size={15} /> Export CSV{leads.length > 0 ? ` (${leads.length})` : ""}
          </button>
        </div>
      </div>

      {list.isLoading ? (
        <p className="p-6 text-slate-400">Loading leads…</p>
      ) : allLeads.length === 0 ? (
        <p className="p-6 text-slate-400">No leads captured yet. (If you expect some, confirm the database has been migrated with <code>pnpm db:push</code>.)</p>
      ) : (
        <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, or question…"
              aria-label="Search leads"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-emerald-400"
            />
          </div>
          <label className="text-xs text-slate-400">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
              aria-label="Filter by status"
              className="ml-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="all">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <span className="text-xs text-slate-500">{leads.length} of {allLeads.length}</span>
        </div>

        {leads.length === 0 ? (
          <p className="p-6 text-slate-400">No leads match your filters.</p>
        ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* List */}
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {leads.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedId(l.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === l.id ? "border-emerald-400/50 bg-emerald-400/10" : "border-slate-700 bg-slate-900/50 hover:border-slate-500"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <User size={14} className="text-slate-400" />
                    {[l.firstName, l.lastName].filter(Boolean).join(" ") || "Anonymous"}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: STATUS_COLOR[l.status], border: `1px solid ${STATUS_COLOR[l.status]}55` }}>{l.status}</span>
                </div>
                <div className="mt-1 truncate text-xs text-slate-400">{l.email || l.phone || "no contact"}</div>
                <div className="mt-1 text-[10px] text-slate-500">{new Date(l.lastSeenAt).toLocaleString()}</div>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected && (
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{[selected.firstName, selected.lastName].filter(Boolean).join(" ") || "Anonymous visitor"}</h2>
                  <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-300">
                    {selected.email && <span className="flex items-center gap-1.5"><Mail size={13} /> {selected.email}</span>}
                    {selected.phone && <span className="flex items-center gap-1.5"><Phone size={13} /> {selected.phone}</span>}
                    {selected.bestTimeToContact && <span className="flex items-center gap-1.5"><Clock size={13} /> {selected.bestTimeToContact}</span>}
                  </div>
                </div>
                <label className="text-xs text-slate-400">
                  Status
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus.mutate({ id: selected.id, status: e.target.value as LeadStatus })}
                    className="mt-1 block rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-white"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              {selected.question && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-200">
                  <span className="text-xs font-semibold uppercase text-slate-400">Their question</span>
                  <p className="mt-1">{selected.question}</p>
                </div>
              )}

              {/* Fact-finder */}
              <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">Fact-finder</p>
              <div className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <Row label="W-2 income" value={usd(ff?.w2Income)} />
                <Row label="Estimated taxes" value={usd(ff?.estimatedTaxes)} />
                <Row label="Spouse income" value={usd(ff?.spouseIncome)} />
                <Row label="Spouse taxes" value={usd(ff?.spouseTaxes)} />
                <Row label="Student debt" value={usd(ff?.studentDebt)} />
                <Row label="Student loan rate" value={ff?.studentDebtRate != null ? `${ff.studentDebtRate}%` : "—"} />
                <Row label="Home equity" value={usd(ff?.homeEquity)} />
                <Row label="Mortgage balance" value={usd(ff?.mortgageBalance)} />
                <Row label="Interest-only / month" value={usd(ff?.mortgageInterestOnlyMonthly)} />
                <Row label="Mortgage years left" value={ff?.mortgageYearsRemaining != null ? String(ff.mortgageYearsRemaining) : "—"} />
                <Row label="Tax-deferred (self)" value={usd(ff?.taxDeferredSelf)} />
                <Row label="Tax-deferred (spouse)" value={usd(ff?.taxDeferredSpouse)} />
                <Row label="Liquid investments" value={usd(ff?.liquidInvestments)} />
                <Row label="Liquid taxability" value={ff?.liquidTaxability ?? "—"} />
              </div>
              {ff?.goals && <p className="mt-3 text-sm text-slate-300"><span className="text-xs font-semibold uppercase text-slate-400">Goals: </span>{ff.goals}</p>}

              {/* Advisor figures */}
              <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">Illustrative advisor figures</p>
              <div className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <Row label="Roth conversion base" value={usd(fig?.rothConversionBase)} />
                <Row label="Roth reference (47% frame)" value={usd(fig?.illustrativeRothTaxValue)} />
                <Row label="Lifetime interest-only exposure" value={usd(fig?.lifetimeInterestOnlyExposure)} />
                <Row label="Interest potentially saved" value={usd(fig?.illustrativeInterestPotentiallySaved)} />
                <Row label="Accelerated payoff" value={fig ? `${fig.acceleratedPayoffYearsLow}–${fig.acceleratedPayoffYearsHigh} yrs` : "—"} />
                <Row label="Equity first step (yr 1 IUL)" value={usd(fig?.equityDeployedFirstStep)} />
                <Row label="Oil & gas assumed" value={usd(fig?.oilGasInvestmentAssumed)} />
                <Row label="Oil & gas deduction" value={usd(fig?.oilGasDeduction)} />
                <Row label="Oil & gas tax offset" value={usd(fig?.illustrativeOilGasTaxOffset)} />
                <Row label="Blended rate used" value={pct(fig?.blendedTaxRateUsed)} />
              </div>

              {selected.analysis?.rothCaveat && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/[.06] p-3 text-xs text-amber-100/80">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
                  <span>{selected.analysis.rothCaveat}</span>
                </div>
              )}
              {selected.analysis?.disclaimer && (
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{selected.analysis.disclaimer}</p>
              )}
              {selected.lastIp && <p className="mt-3 text-[10px] text-slate-600">Last IP: {selected.lastIp}</p>}

              <LeadMessaging leadId={selected.id} email={selected.email} phone={selected.phone} status={selected.status} />
            </div>
          )}
        </div>
        )}
        </>
      )}
    </AppShell>
  );
}

const STEP_LABEL: Record<string, string> = {
  sms_1h: "Text · 1 hour after capture", email_day1: "Email · day 1 (what happens next)", email_day3: "Email · day 3 (three questions)",
  sms_day5: "Text · day 5 (ready when you are)", email_day7: "Email · day 7 (still here)",
};
const FOLLOWUP_COLOR: Record<string, string> = { pending: "text-sky-300", sent: "text-emerald-400", skipped: "text-slate-500", failed: "text-rose-400", cancelled: "text-slate-500" };

/** Email/text the lead by hand, and see the automated sequence's state. */
function LeadMessaging({ leadId, email, phone, status }: { leadId: number; email?: string | null; phone?: string | null; status: LeadStatus }) {
  const utils = trpc.useUtils();
  const info = trpc.leads.followups.useQuery({ id: leadId });
  const transport = trpc.messages.status.useQuery();
  const [channel, setChannel] = useState<"email" | "sms">(email ? "email" : "sms");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const send = trpc.leads.message.useMutation({
    onSuccess: (r) => {
      if (r.sent) { toast.success(`${channel === "email" ? "Email" : "Text"} sent via ${r.via}`); setBody(""); setSubject(""); }
      else toast.error(r.reason ?? "Not sent");
      void utils.leads.followups.invalidate({ id: leadId });
    },
    onError: (e) => toast.error(e.message),
  });
  const configured = channel === "email" ? transport.data?.emailConfigured : transport.data?.smsConfigured;
  const hasAddress = channel === "email" ? Boolean(email) : Boolean(phone);
  const followups = info.data?.followups ?? [];
  const messages = info.data?.messages ?? [];
  const pending = followups.filter((f) => f.status === "pending").length;

  return (
    <div className="mt-6 border-t border-slate-800 pt-5" aria-label="Lead messaging">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-300"><MessageSquare size={14} /> Reach out</p>
        <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-0.5 text-xs">
          {(["email", "sms"] as const).map((c) => (
            <button key={c} type="button" onClick={() => setChannel(c)} aria-pressed={channel === c}
              className={`rounded-md px-3 py-1.5 font-medium transition ${channel === c ? "bg-sky-400/20 text-white" : "text-slate-400"}`}>
              {c === "email" ? "Email" : "Text"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {channel === "email" ? (email ? `To ${email}` : "No email given") : (phone ? `To ${phone}` : "No mobile number given")}
        {transport.data && !configured && <span className="ml-2 text-amber-300">· {channel === "email" ? "mail" : "SMS"} transport not configured on the host</span>}
      </p>
      {channel === "email" && (
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-400" />
      )}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={channel === "email" ? 5 : 3} aria-label="Message to lead"
        placeholder={channel === "email" ? "Your message — no figures; invite them to a call." : "Short text — STOP handling is automatic."}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-400" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">Sending by hand stops the automated sequence.</span>
        <button type="button" disabled={!configured || !hasAddress || !body.trim() || send.isPending}
          onClick={() => send.mutate({ id: leadId, channel, subject: channel === "email" ? subject || undefined : undefined, body })}
          className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-40">
          <Send size={14} /> {send.isPending ? "Sending…" : channel === "email" ? "Send email" : "Send text"}
        </button>
      </div>

      <p className="mt-5 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <CalendarClock size={14} /> Automated follow-up sequence
        {pending > 0 && <span className="rounded-full border border-sky-400/40 px-2 py-0.5 text-[10px] normal-case text-sky-300">{pending} pending</span>}
      </p>
      {followups.length === 0 ? (
        <p className="text-xs text-slate-500">{status === "new" ? "No sequence scheduled (captured before automation was enabled, or no contact details)." : "Sequence not needed — a human has taken over."}</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {followups.map((f) => (
            <li key={f.id} className="flex items-center justify-between border-b border-slate-800 py-1">
              <span className="text-slate-300">{STEP_LABEL[f.step] ?? f.step}</span>
              <span className={FOLLOWUP_COLOR[f.status] ?? "text-slate-400"}>
                {f.status}{f.status === "pending" ? ` · ${new Date(f.scheduledFor).toLocaleString()}` : f.sentAt ? ` · ${new Date(f.sentAt).toLocaleString()}` : f.reason ? ` · ${f.reason}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      {messages.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Messages sent</p>
          <ul className="space-y-1.5 text-xs">
            {messages.map((m) => (
              <li key={m.id} className="flex items-start gap-2">
                {m.status === "sent" ? <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" /> : m.status === "suppressed" ? <Ban size={13} className="mt-0.5 shrink-0 text-amber-300" /> : <XCircle size={13} className="mt-0.5 shrink-0 text-rose-400" />}
                <span className="text-slate-300"><span className="uppercase text-slate-500">{m.channel}</span> · {new Date(m.createdAt).toLocaleString()} · {m.subject || m.body.slice(0, 70)}{m.status !== "sent" && m.reason ? <span className="text-slate-500"> — {m.reason}</span> : null}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 py-1">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
