// ============================================================
// SUPPORT WIDGET — the floating "something wrong?" box.
// Opens a message form; the text forwards straight to Sam
// (sam@russellcapitalsystems.com) via the support router.
// No mailto, no ticket system — a human reads it.
// ============================================================
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const LINE_C = "rgba(241,234,219,0.14)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;

export default function SupportWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState("");
  // Honeypot: invisible to humans, autofilled by dumb bots. A filled value
  // makes the server silently drop the message while reporting success.
  const [company, setCompany] = useState("");
  const send = trpc.support.send.useMutation({
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Sent — it goes straight to Sam. You'll hear back at the email you gave.");
        setMessage(""); setOpen(false);
      } else toast.error(r.error);
    },
    onError: () => toast.error("Couldn't send just now — try again in a minute."),
  });

  return (
    <>
      {/* Floating button — bottom-left so it never fights the scroll-to-top control */}
      <button onClick={() => setOpen(true)} aria-label="Contact support"
        className="fixed bottom-5 left-5 z-[9980] rounded-full shadow-lg"
        style={{ ...mono, fontSize: "11px", letterSpacing: "0.08em", padding: "12px 18px", background: INK2, color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}55`, cursor: "pointer" }}>
        ? Support
      </button>

      {open && (
        <div className="fixed inset-0 z-[9985] flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)} style={{ background: "rgba(10,8,5,0.75)" }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[480px] rounded-2xl p-6"
            style={{ background: `linear-gradient(180deg,${INK2},${INK})`, border: `1px solid ${CHAMPAGNE}44` }}>
            <div className="flex items-start justify-between mb-2">
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: CHAMPAGNE }}>
                Talk to a human
              </p>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ ...mono, color: MUTED, background: "none", border: 0, cursor: "pointer", fontSize: "15px" }}>✕</button>
            </div>
            <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.6, marginBottom: "14px" }}>
              Whatever's wrong or confusing — type it here. It forwards <b style={{ color: CREAM }}>directly to Sam</b>, not
              a ticket queue.
            </p>
            <input value={company} onChange={(e) => setCompany(e.target.value)} name="company" autoComplete="off" tabIndex={-1} aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }} />
            <textarea aria-label="Describe your problem" value={message} onChange={(e) => setMessage(e.target.value)} rows={5}
              placeholder="What's going on? The more specific, the faster the fix."
              style={{ width: "100%", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`, borderRadius: "10px", padding: "12px", fontSize: "14px", color: CREAM, outline: "none", resize: "vertical", marginBottom: "10px" }} />
            {!user && (
              <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} type="email"
                placeholder="Your email — so Sam can answer you"
                style={{ width: "100%", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`, borderRadius: "10px", padding: "11px 12px", fontSize: "13.5px", color: CREAM, outline: "none", marginBottom: "10px" }} />
            )}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => {
                  if (message.trim().length < 10) { toast.error("Give us at least a sentence to work with."); return; }
                  send.mutate({ message: message.trim(), replyTo: replyTo.trim() || undefined, company: company || undefined });
                }}
                disabled={send.isPending}
                style={{ ...mono, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, padding: "12px 20px", borderRadius: "8px", background: CHAMPAGNE, color: INK, border: 0, cursor: "pointer" }}>
                {send.isPending ? "Sending…" : "Send to Sam"}
              </button>
              <span style={{ ...mono, fontSize: "9.5px", color: MUTED }}>
                {user ? `replies go to ${user.email ?? "your account email"}` : "answered personally, usually same day"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
