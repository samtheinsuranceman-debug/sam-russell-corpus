// ============================================================
// PRACTICE DETAIL — /practice/:id — one page per keystone
// practice (54). The daily-practice counterpart to the clinical
// protocol pages: the prescription, the evidence tier, the
// horizon, the research basis, and what it lifts.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { KEYSTONE_PRACTICES, confidenceFromEvidence } from "@shared/keystonePractices";
import { LINE_NAMES, lineSlug } from "@shared/seo";
import NotFound from "@/pages/NotFound";

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

// A "lifts" tag sometimes matches a measured line (link it), sometimes names
// a broader capacity (render as plain tag).
function liftLink(tag: string) {
  const match = LINE_NAMES.find((n) => n.toLowerCase() === tag.toLowerCase());
  return match
    ? <Link key={tag} href={`/line/${lineSlug(match)}`} style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: "999px", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}55` }}>{match}</Link>
    : <span key={tag} style={{ ...mono, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 10px", borderRadius: "999px", color: MUTED, border: `1px solid ${LINE_C}` }}>{tag}</span>;
}

export default function PracticeDetail() {
  const params = useParams<{ id: string }>();
  const p = KEYSTONE_PRACTICES.find((k) => k.id === (params.id ?? ""));
  if (!p) return <NotFound />;
  const idx = KEYSTONE_PRACTICES.indexOf(p);
  const prev = KEYSTONE_PRACTICES[(idx + KEYSTONE_PRACTICES.length - 1) % KEYSTONE_PRACTICES.length];
  const next = KEYSTONE_PRACTICES[(idx + 1) % KEYSTONE_PRACTICES.length];
  const evColor = EVIDENCE_COLOR[p.evidence] ?? MUTED;
  const confidence = confidenceFromEvidence(p.evidence);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[780px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Keystone practice {idx + 1} of {KEYSTONE_PRACTICES.length} · <Link href="/practices" style={{ color: CHAMPAGNE }}>the full set</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(32px,5.5vw,52px)", lineHeight: 1.05, color: CREAM, margin: "0 0 12px" }}>
          {p.name}
        </h1>
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: evColor, border: `1px solid ${evColor}55`, background: `${evColor}0d` }}>
            evidence: {p.evidence} · confidence: {confidence}
          </span>
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: CREAM2, border: `1px solid ${LINE_C}` }}>
            horizon: {p.horizon}
          </span>
        </div>

        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 8px" }}>The prescription — do exactly this</p>
        <p style={{ ...serif, fontSize: "clamp(18px,2.6vw,23px)", lineHeight: 1.5, color: CREAM, margin: "0 0 26px" }}>{p.prescription}</p>

        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 8px" }}>Why it works — the research basis</p>
        <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 26px" }}>{p.researchBasis}</p>

        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 10px" }}>What it lifts</p>
        <div className="flex items-center gap-2 flex-wrap mb-8">{p.lifts.map(liftLink)}</div>

        <div className="rounded-2xl p-6 mb-10" style={{ border: `1px solid ${CHAMPAGNE}33`, background: "rgba(224,198,140,0.04)" }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 8px" }}>Where it lives in the member library</p>
          <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>
            Library section {p.section}: <b style={{ color: CREAM }}>{p.librarySection}</b>. Members get this practice
            prescribed when their profile flags the lines it lifts — with monthly ratings, swap suggestions when it
            isn't working, and the honest evidence tier always shown. Estimates, never guarantees.
          </p>
        </div>

        <div className="rounded-2xl p-7 mb-10 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,26px)", color: CREAM, margin: "0 0 6px" }}>
            Should this be one of YOUR keystones?
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            The 32-line assessment matches keystone practices to your actual profile. Free for the first 10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/practice/${prev.id}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>← {prev.name}</Link>
          <Link href="/protocols" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>clinical protocols</Link>
          <Link href={`/practice/${next.id}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>{next.name} →</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
