// ============================================================
// THE BELIEF PARADIGM — the second assessment
// ============================================================
// Formative beliefs elicited from the member's own spoken answers. Limiting
// beliefs (ember) carry research-grounded counter-evidence; empowering ones
// (jade) get reinforcement. The member decides — "I've revised this" is
// theirs to press, never ours.

import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const LINE_C = "rgba(241,234,219,0.10)";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";

const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

export default function Beliefs() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const q = trpc.beliefs.list.useQuery(undefined, { enabled: !!user, retry: false });
  const elicit = trpc.beliefs.elicit.useMutation({
    onSuccess: (r) => {
      if (r.ok) toast.success(`${r.added} belief${r.added === 1 ? "" : "s"} surfaced from your own words.`);
      else if (r.reason === "no-ai") toast.error("The AI panel isn't connected yet — beliefs need it to read your answers.");
      else if (r.reason === "too-few-answers") toast.error("Answer a few more assessment questions first — beliefs are read from your own words.");
      else if (r.reason === "none-found") toast.info("No new beliefs surfaced this pass.");
      else if (r.reason === "full") toast.info("Your belief board is full — revise or dismiss some to surface more.");
      else toast.error("Couldn't run the elicitation — try again.");
      utils.beliefs.list.invalidate();
    },
  });
  const setStatus = trpc.beliefs.setStatus.useMutation({ onSuccess: () => utils.beliefs.list.invalidate() });

  const active = (q.data ?? []).filter((b) => b.status === "active");
  const revised = (q.data ?? []).filter((b) => b.status === "revised");
  const limiting = active.filter((b) => b.kind === "limiting");
  const empowering = active.filter((b) => b.kind === "empowering");

  return (
    <div className="min-h-screen relative" style={{ background: INK }}>
      <PublicHeader />
      <div className="relative z-10 max-w-[900px] mx-auto px-[clamp(20px,5vw,56px)] py-[clamp(40px,6vw,80px)]">
        <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "14px" }}>
          The second assessment · your belief paradigm
        </div>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,52px)", lineHeight: 1.04, color: CREAM, margin: "0 0 12px" }}>
          The saboteur votes before you do.
        </h1>
        <p style={{ color: CREAM2, fontSize: "clamp(15px,1.6vw,17px)", lineHeight: 1.65, maxWidth: "44em", marginBottom: "10px" }}>
          Under every stalled goal sits a belief — usually installed decades ago, usually invisible, usually wrong. We
          read your formative beliefs out of <b style={{ color: CREAM }}>your own spoken answers</b>, then hold each one
          up against the research. The limiting ones get counter-evidence. The empowering ones get reinforced.{" "}
          <b style={{ color: CREAM }}>You look at the data and decide for yourself</b> — nobody argues you out of anything.
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginBottom: "28px" }}>
          Beliefs come second, right after your 32 lines — because the map is useless if the saboteur is still driving.
        </p>

        {!loading && !user && (
          <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "26px", color: CREAM2 }}>
            <Link href="/login" style={{ color: CHAMPAGNE }}>Sign in</Link> to open your belief board.
          </div>
        )}

        {user && (
          <>
            <button onClick={() => elicit.mutate()} disabled={elicit.isPending}
              style={{ ...mono, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "13px 22px", background: CHAMPAGNE, color: INK, border: 0, borderRadius: "8px", cursor: "pointer", fontWeight: 700, marginBottom: "28px" }}>
              {elicit.isPending ? "Reading your answers…" : q.data && q.data.length > 0 ? "Surface more beliefs" : "Surface my beliefs from my answers"}
            </button>

            {q.data && q.data.length === 0 && !elicit.isPending && (
              <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "26px", color: CREAM2 }}>
                Nothing surfaced yet. Answer assessment questions (the more you ramble, the more your operating beliefs
                show), then press the button — the panel reads <i>your</i> words, never a template.
              </div>
            )}

            {/* LIMITING — ember, with counter-evidence */}
            {limiting.length > 0 && (
              <div className="mb-8">
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: EMBER, marginBottom: "12px" }}>
                  ▼ Limiting — the beliefs working against your goals
                </p>
                <div className="space-y-4">
                  {limiting.map((b) => (
                    <div key={b.id} style={{ border: "1px solid rgba(226,96,74,0.35)", background: "rgba(226,96,74,0.05)", borderRadius: "14px", padding: "20px" }}>
                      <p style={{ ...serif, fontSize: "20px", color: CREAM, marginBottom: "4px" }}>&ldquo;{b.text}&rdquo;</p>
                      {b.touches && <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: "10px" }}>touches: {b.touches}</p>}
                      {b.evidence && (
                        <p style={{ fontSize: "14px", lineHeight: 1.6, color: CREAM2, marginBottom: "14px" }}>
                          <span style={{ color: EMBER, fontWeight: 600 }}>The evidence says: </span>{b.evidence}
                        </p>
                      )}
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => setStatus.mutate({ beliefId: b.id, status: "revised" })}
                          style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "9px 16px", background: JADE, color: INK, border: 0, borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}>
                          I&rsquo;ve looked at the evidence — I&rsquo;m revising this
                        </button>
                        <button onClick={() => setStatus.mutate({ beliefId: b.id, status: "dismissed" })}
                          style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "9px 16px", background: "transparent", color: MUTED, border: `1px solid ${LINE_C}`, borderRadius: "6px", cursor: "pointer" }}>
                          That&rsquo;s not my belief
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EMPOWERING — jade, reinforced */}
            {empowering.length > 0 && (
              <div className="mb-8">
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: JADE, marginBottom: "12px" }}>
                  ▲ Empowering — the beliefs carrying you (keep these loud)
                </p>
                <div className="space-y-4">
                  {empowering.map((b) => (
                    <div key={b.id} style={{ border: `1px solid ${JADE}44`, background: "rgba(155,192,178,0.05)", borderRadius: "14px", padding: "20px" }}>
                      <p style={{ ...serif, fontSize: "20px", color: CREAM, marginBottom: "4px" }}>&ldquo;{b.text}&rdquo;</p>
                      {b.evidence && (
                        <p style={{ fontSize: "14px", lineHeight: 1.6, color: CREAM2 }}>
                          <span style={{ color: JADE, fontWeight: 600 }}>Why it serves you: </span>{b.evidence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVISED — the trophy case */}
            {revised.length > 0 && (
              <div>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
                  ✓ Revised — beliefs you&rsquo;ve retired ({revised.length})
                </p>
                <div className="space-y-2">
                  {revised.map((b) => (
                    <p key={b.id} style={{ fontSize: "14px", color: MUTED, textDecoration: "line-through" }}>&ldquo;{b.text}&rdquo;</p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
