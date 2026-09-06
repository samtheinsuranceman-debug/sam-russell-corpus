// ============================================================
// MESSAGE CLIENT PANEL — email or text a client from their page. Pick a
// template (editable) or write freehand; every send is logged with its
// delivery outcome. No figures travel by message — the templates point the
// client back into the portal instead.
// ============================================================
import { useEffect, useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle2, XCircle, Ban } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Channel = "email" | "sms";

export function MessageClientPanel({ clientId, clientEmail, clientPhone }: { clientId: number; clientEmail?: string | null; clientPhone?: string | null }) {
  const utils = trpc.useUtils();
  const status = trpc.messages.status.useQuery();
  const templates = trpc.messages.templates.useQuery();
  const log = trpc.messages.list.useQuery({ clientId, limit: 20 });
  const [channel, setChannel] = useState<Channel>(clientEmail ? "email" : "sms");
  const [template, setTemplate] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const preview = trpc.messages.preview.useQuery({ clientId, channel, template }, { enabled: Boolean(template) });
  useEffect(() => {
    if (preview.data) { setSubject(preview.data.subject); setBody(preview.data.body); }
  }, [preview.data]);
  const send = trpc.messages.send.useMutation({
    onSuccess: (r) => {
      if (r.sent) toast.success(`${channel === "email" ? "Email" : "Text"} sent via ${r.via}`);
      else toast.error(r.reason ?? "Not sent");
      void utils.messages.list.invalidate({ clientId, limit: 20 });
      if (r.sent) { setBody(""); setSubject(""); setTemplate(""); }
    },
    onError: (e) => toast.error(e.message),
  });

  const configured = channel === "email" ? status.data?.emailConfigured : status.data?.smsConfigured;
  const hasAddress = channel === "email" ? Boolean(clientEmail) : Boolean(clientPhone);
  const canSend = Boolean(configured && hasAddress && body.trim() && !send.isPending);

  return (
    <div className="rc-card" aria-label="Message this client">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#3b82f6]" />
          <span className="font-semibold text-white">Message this client</span>
        </div>
        <div className="flex rounded-lg border border-[#12233e] bg-[#0f1e35] p-0.5 text-xs">
          {(["email", "sms"] as Channel[]).map((c) => (
            <button key={c} type="button" onClick={() => setChannel(c)} aria-pressed={channel === c}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 font-medium transition ${channel === c ? "bg-[#3b82f6]/20 text-[#c8d8ec]" : "text-[#7a95b8]"}`}>
              {c === "email" ? <Mail size={12} /> : <MessageSquare size={12} />} {c === "email" ? "Email" : "Text"}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-xs text-[#7a95b8]">
        {channel === "email" ? (clientEmail ? `To ${clientEmail}` : "No email on file") : (clientPhone ? `To ${clientPhone}` : "No mobile number on file")}
        {status.data && !configured && <span className="ml-2 text-amber-300">· {channel === "email" ? "mail transport" : "SMS transport"} not configured on the host</span>}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <select value={template} onChange={(e) => setTemplate(e.target.value)} aria-label="Message template"
          className="rounded-lg border border-[#12233e] bg-[#0f1e35] px-3 py-2 text-sm text-[#c8d8ec]">
          <option value="">Write my own…</option>
          {(templates.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <span className="self-center text-[11px] text-[#7a95b8]">Templates never include figures — they point the client into the portal.</span>
      </div>
      {channel === "email" && (
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject"
          className="mt-2 w-full rounded-lg border border-[#12233e] bg-[#0f1e35] px-3 py-2 text-sm text-[#c8d8ec]" />
      )}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={channel === "email" ? 6 : 3} aria-label="Message body"
        placeholder={channel === "email" ? "Your message…" : "Your text (keep it short; STOP handling is automatic)…"}
        className="mt-2 w-full rounded-lg border border-[#12233e] bg-[#0f1e35] px-3 py-2 text-sm text-[#c8d8ec]" />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-[#7a95b8]">{channel === "sms" ? `${body.length} characters` : "A plain-text copy and the compliance line are added automatically."}</span>
        <button type="button" disabled={!canSend}
          onClick={() => send.mutate({ clientId, channel, subject: channel === "email" ? subject || undefined : undefined, body, template: template || undefined })}
          className="flex items-center gap-1.5 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f6fd6] disabled:opacity-40">
          <Send size={14} /> {send.isPending ? "Sending…" : channel === "email" ? "Send email" : "Send text"}
        </button>
      </div>

      {(log.data?.length ?? 0) > 0 && (
        <div className="mt-4 border-t border-[#12233e] pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7a95b8]">Recent messages</p>
          <ul className="space-y-1.5 text-xs">
            {log.data!.map((m) => (
              <li key={m.id} className="flex items-start gap-2">
                {m.status === "sent" ? <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" /> : m.status === "suppressed" ? <Ban size={13} className="mt-0.5 shrink-0 text-amber-300" /> : <XCircle size={13} className="mt-0.5 shrink-0 text-rose-400" />}
                <span className="text-[#c8d8ec]">
                  <span className="uppercase text-[#7a95b8]">{m.channel}</span> · {new Date(m.createdAt).toLocaleString()} · {m.subject || m.body.slice(0, 60)}
                  {m.status !== "sent" && m.reason && <span className="text-[#7a95b8]"> — {m.reason}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
