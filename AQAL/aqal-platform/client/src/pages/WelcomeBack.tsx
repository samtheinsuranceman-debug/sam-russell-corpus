// ============================================================
// WELCOME BACK — the comeback landing. Where the re-entry email
// points. One question, five minutes, zero guilt: the door back in
// is small on purpose.
// ============================================================
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { QUESTION_TITLES } from "@shared/questionTitles";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const LINE_C = "rgba(241,234,219,0.10)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

export default function WelcomeBack() {
  const { user, loading } = useAuth();
  const cur = trpc.assessment.current.useQuery(undefined, { enabled: !!user, retry: false });
  const done = (cur.data as any)?.completedQuestions ?? 0;
  const total = (cur.data as any)?.totalQuestions ?? 27;
  const nextTitle = QUESTION_TITLES[Math.min(done, QUESTION_TITLES.length - 1)];
  const finished = done >= total;

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[640px] mx-auto px-6 py-20 text-center">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: JADE, marginBottom: "14px" }}>
          Welcome back · the door is small on purpose
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.06, color: CREAM, margin: "0 0 14px" }}>
          No guilt. No catch-up.<br />Just one question.
        </h1>
        <p style={{ color: CREAM2, fontSize: "16px", lineHeight: 1.65, maxWidth: "36em", margin: "0 auto 10px" }}>
          Everything you already gave is safe — every answer, every word. You don&rsquo;t owe the machine an apology or a
          marathon. Five minutes on one question restarts the whole thing.
        </p>

        {!loading && !user && (
          <p style={{ color: CREAM2, fontSize: "14px", marginTop: "18px" }}>
            <Link href="/login" style={{ color: CHAMPAGNE }}>Sign in</Link> and we&rsquo;ll show you exactly where you left off.
          </p>
        )}

        {user && cur.data && !finished && (
          <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "16px", background: "rgba(224,198,140,0.04)", padding: "26px", margin: "26px 0 18px" }}>
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, marginBottom: "8px" }}>
              You left off at {done} of {total} · your next question is
            </p>
            <p style={{ ...serif, fontSize: "clamp(22px,3.5vw,30px)", color: CREAM, margin: "0 0 6px" }}>
              &ldquo;{nextTitle}&rdquo;
            </p>
            <p style={{ color: CREAM2, fontSize: "13.5px", marginBottom: "18px" }}>
              One answer. Ramble as long as you like — rambling is data.
            </p>
            <Link href="/assessment">
              <a className="inline-block px-6 py-3.5 rounded-lg font-bold" style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", background: CHAMPAGNE, color: INK }}>
                Answer it now — 5 minutes
              </a>
            </Link>
          </div>
        )}

        {user && finished && (
          <div style={{ border: `1px solid ${JADE}44`, borderRadius: "16px", background: "rgba(155,192,178,0.05)", padding: "26px", margin: "26px 0 18px" }}>
            <p style={{ ...serif, fontSize: "24px", color: CREAM, marginBottom: "10px" }}>
              Your assessment is complete.
            </p>
            <p style={{ color: CREAM2, fontSize: "14px", marginBottom: "18px" }}>
              The comeback you&rsquo;re looking for is in the work itself — your map, your clocks, your beliefs.
            </p>
            <Link href="/portal">
              <a className="inline-block px-6 py-3.5 rounded-lg font-bold" style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", background: JADE, color: INK }}>
                Open Mission Control
              </a>
            </Link>
          </div>
        )}

        <p style={{ ...mono, fontSize: "10.5px", color: MUTED }}>
          The people who finish aren&rsquo;t the ones who never stopped. They&rsquo;re the ones who came back.
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}
