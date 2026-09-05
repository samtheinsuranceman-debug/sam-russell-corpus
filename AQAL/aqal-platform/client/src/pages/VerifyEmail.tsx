// ============================================================
// VERIFY EMAIL — the landing for the confirmation link.
// One mutation on arrival; clear success/failure; on to the portal.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

export default function VerifyEmail() {
  const token = new URLSearchParams(window.location.search).get("token");
  const [state, setState] = useState<"working" | "ok" | "fail">("working");
  const [error, setError] = useState("");
  const verify = trpc.freeAccess.verifyEmail.useMutation({
    onSuccess: (r) => { if (r.ok) setState("ok"); else { setState("fail"); setError(r.error); } },
    onError: () => { setState("fail"); setError("Something hiccuped — try the link once more."); },
  });
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (token && token.length === 64) verify.mutate({ token });
    else { setState("fail"); setError("That link is incomplete — open it exactly as it appears in the email."); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[480px] mx-auto px-6 py-28 text-center">
        {state === "working" && (
          <p style={{ ...mono, fontSize: "12px", letterSpacing: "0.2em", color: CHAMPAGNE }}>CONFIRMING…</p>
        )}
        {state === "ok" && (
          <>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: JADE, marginBottom: "12px" }}>Confirmed</p>
            <h1 style={{ ...serif, fontSize: "36px", color: CREAM, margin: "0 0 12px" }}>Your email is real.<br />Your spot is safe.</h1>
            <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.65, marginBottom: "24px" }}>
              Password recovery now works, your founding claim is anchored, and every report we ever send knows where home is.
            </p>
            <Link href="/portal" className="inline-block px-6 py-3.5 rounded-lg font-bold" style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", background: JADE, color: INK }}>
                Open Mission Control
              </Link>
          </>
        )}
        {state === "fail" && (
          <>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: EMBER, marginBottom: "12px" }}>Didn&rsquo;t take</p>
            <h1 style={{ ...serif, fontSize: "34px", color: CREAM, margin: "0 0 12px" }}>That link didn&rsquo;t verify.</h1>
            <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.65, marginBottom: "20px" }}>{error}</p>
            <p style={{ color: CREAM2, fontSize: "13.5px" }}>
              Sign in and use <b style={{ color: CHAMPAGNE }}>Resend the link</b> on your portal — a fresh one takes seconds.
            </p>
          </>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
