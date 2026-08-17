// ============================================================
// RESET PASSWORD — both halves of the flow on one page.
// No token in the URL → request form (email me the link).
// ?token=… → set a new password with it.
// ============================================================
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const LINE_C = "rgba(241,234,219,0.14)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const inputStyle = {
  width: "100%", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`,
  borderRadius: "10px", padding: "13px 14px", fontSize: "15px", color: CREAM, outline: "none",
} as const;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [sent, setSent] = useState(false);

  const request = trpc.freeAccess.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: () => setSent(true), // same face either way — no account enumeration
  });
  const reset = trpc.freeAccess.resetPassword.useMutation({
    onSuccess: (r) => {
      if (r.ok) { toast.success("Password changed — sign in with the new one."); navigate("/login"); }
      else toast.error(r.error);
    },
  });

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[440px] mx-auto px-6 py-24">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          Founding account · password reset
        </p>

        {!token && (
          <>
            <h1 style={{ ...serif, fontSize: "34px", color: CREAM, margin: "0 0 10px" }}>Locked out? Fixable.</h1>
            {!sent ? (
              <>
                <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.65, marginBottom: "20px" }}>
                  Enter the email you claimed your founding spot with. If it&rsquo;s in our books, a reset link is on its
                  way — good for one hour.
                </p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                <button
                  onClick={() => { if (!email.includes("@")) { toast.error("Enter the email you signed up with."); return; } request.mutate({ email: email.trim() }); }}
                  disabled={request.isPending}
                  className="mt-4 w-full cursor-pointer"
                  style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "14px", borderRadius: "10px", background: CHAMPAGNE, color: INK, border: 0 }}>
                  {request.isPending ? "Sending…" : "Email me the reset link"}
                </button>
              </>
            ) : (
              <p style={{ color: JADE, fontSize: "14.5px", lineHeight: 1.65 }}>
                Done. If that email has a founding account, the link is in its inbox now — check spam if it hides. The
                link lives for one hour.
              </p>
            )}
          </>
        )}

        {token && (
          <>
            <h1 style={{ ...serif, fontSize: "34px", color: CREAM, margin: "0 0 10px" }}>Choose your new password.</h1>
            <p style={{ color: CREAM2, fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
              Eight characters minimum. Make it yours — this key opens your whole map.
            </p>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" style={{ ...inputStyle, marginBottom: "10px" }} />
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Same password, again" style={inputStyle} />
            <button
              onClick={() => {
                if (pw.length < 8) { toast.error("Eight characters minimum."); return; }
                if (pw !== pw2) { toast.error("The two entries don't match."); return; }
                reset.mutate({ token, newPassword: pw });
              }}
              disabled={reset.isPending}
              className="mt-4 w-full cursor-pointer"
              style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "14px", borderRadius: "10px", background: CHAMPAGNE, color: INK, border: 0 }}>
              {reset.isPending ? "Saving…" : "Set the new password"}
            </button>
          </>
        )}

        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginTop: "22px" }}>
          <Link href="/login"><a style={{ color: CHAMPAGNE }}>← Back to sign in</a></Link>
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}
