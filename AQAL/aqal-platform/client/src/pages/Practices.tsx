// ============================================================
// PRACTICES INDEX — /practices — the 54 keystone practices,
// each linking to its full page. Daily-practice counterpart to
// the clinical protocol library.
// ============================================================
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { GOAL_KEYWORDS, goalSlug } from "@shared/seo";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const EVIDENCE_COLOR: Record<string, string> = { Strong: JADE, Moderate: CHAMPAGNE, Emerging: EMBER };

export default function Practices() {
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[900px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          Keystone Practices · {KEYSTONE_PRACTICES.length} in the set · honest evidence tiers on every one
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,48px)", color: CREAM, margin: "0 0 10px" }}>
          The daily moves that hold everything up.
        </h1>
        <PageVideo label="the keystone practices" />
        <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.7, marginBottom: "8px" }}>
          Clinical protocols repair; keystone practices maintain and build. Each carries a concrete prescription, its
          research basis, an honest evidence tier, and the time horizon before you should expect to feel it. The{" "}
          <Link href="/assessment" style={{ color: CHAMPAGNE }}>assessment</Link> matches them to your profile.
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginBottom: "28px" }}>
          also see: <Link href="/protocols" style={{ color: CHAMPAGNE }}>the 92 clinical protocols</Link> · <Link href="/pairs" style={{ color: CHAMPAGNE }}>the 496 line pairings</Link>
        </p>

        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: JADE, marginBottom: "8px" }}>
          Or start from your goal
        </p>
        <div className="flex gap-1.5 flex-wrap mb-8">
          {GOAL_KEYWORDS.slice(0, 28).map((k) => (
            <Link key={k} href={`/goal/${goalSlug(k)}`}
              style={{ ...mono, fontSize: "10px", letterSpacing: "0.05em", padding: "6px 11px", borderRadius: "999px", color: CREAM2, border: `1px solid ${LINE_C}`, textDecoration: "none" }}>
              {k}
            </Link>
          ))}
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {KEYSTONE_PRACTICES.map((p) => (
            <Link key={p.id} href={`/practice/${p.id}`} className="rounded-xl p-4 block"
              style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)", textDecoration: "none" }}>
              <span style={{ ...serif, fontSize: "16.5px", color: CREAM, display: "block", marginBottom: "4px" }}>{p.name}</span>
              <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: EVIDENCE_COLOR[p.evidence] ?? MUTED }}>
                {p.evidence} evidence · {p.horizon}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
