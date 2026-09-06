// ============================================================
// CLIENT LEDGER PANEL — the advisor's view of a client's chain: messages,
// decisions, notes and outcomes, sealed in order. The advisor appends a
// decision here; it is the one record every report and journey derives from.
// ============================================================
import { useState } from "react";
import { BookOpenCheck, ShieldCheck, ShieldAlert, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Kind = "decision" | "note" | "assumption" | "outcome";

export function ClientLedgerPanel({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const timeline = trpc.ledger.timeline.useQuery({ clientId, limit: 50 }, { refetchOnWindowFocus: false });
  const verify = trpc.ledger.verify.useQuery({ clientId }, { refetchOnWindowFocus: false });
  const [kind, setKind] = useState<Kind>("decision");
  const [text, setText] = useState("");
  const append = trpc.ledger.append.useMutation({
    onSuccess: (r) => {
      if (r.recorded) { toast.success("Recorded in the ledger"); setText(""); }
      else toast.error("Not recorded — database not configured");
      void utils.ledger.timeline.invalidate({ clientId, limit: 50 });
      void utils.ledger.verify.invalidate({ clientId });
    },
    onError: (e) => toast.error(e.message),
  });
  const events = timeline.data?.events ?? [];

  return (
    <div className="rc-card" aria-label="Plan ledger">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpenCheck size={16} className="text-[#a78bfa]" />
          <span className="font-semibold text-white">Plan Ledger</span>
          <span className="text-xs text-[#7a95b8]">{timeline.data?.total ?? 0} sealed entries</span>
        </div>
        {verify.data && (verify.data.ok
          ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck size={13} /> chain verified</span>
          : <span className="inline-flex items-center gap-1 text-xs text-rose-400"><ShieldAlert size={13} /> chain broken at #{verify.data.brokenAtSeq}</span>)}
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} aria-label="Entry kind" className="rounded-lg border border-[#12233e] bg-[#0f1e35] px-3 py-2 text-sm text-[#c8d8ec]">
          <option value="decision">Decision</option><option value="assumption">Assumption</option><option value="note">Note</option><option value="outcome">Outcome</option>
        </select>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What was decided, assumed, or observed…" aria-label="Ledger entry"
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) append.mutate({ clientId, kind, summary: text.trim() }); }}
          className="flex-1 rounded-lg border border-[#12233e] bg-[#0f1e35] px-3 py-2 text-sm text-[#c8d8ec]" />
        <button type="button" disabled={!text.trim() || append.isPending} onClick={() => append.mutate({ clientId, kind, summary: text.trim() })}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#a78bfa] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#c4b5fd] disabled:opacity-40"><Plus size={14} /> Record</button>
      </div>
      {events.length > 0 && (
        <ol className="mt-4 space-y-1.5 text-xs">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-2 border-b border-[#12233e] pb-1.5">
              <span className="mt-0.5 shrink-0 rounded-full border border-[#12233e] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#7a95b8]">{e.kind}</span>
              <span className="text-[#c8d8ec]">{e.summary}<span className="text-[#7a95b8]"> · {new Date(e.occurredAt).toLocaleString()}{e.actorName ? ` · ${e.actorName}` : ""} · #{e.seq}</span></span>
            </li>
          ))}
        </ol>
      )}
      {events.length === 0 && !timeline.isLoading && <p className="mt-3 text-xs text-[#7a95b8]">No entries yet. Messages you send and decisions you record land here, sealed in order.</p>}
    </div>
  );
}
