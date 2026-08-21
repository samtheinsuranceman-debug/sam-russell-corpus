// ============================================================
// PROTOCOLS INDEX — /protocols — the public map of the 92
// mapped, citation-backed protocols, grouped by kind. Each
// links to its full page; each shows which lines it targets.
// ============================================================
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { THERAPY_NAMES, therapySlug, therapyDisplay } from "@shared/seo";
import { KIND_PROFILES, THERAPY_KIND } from "@/lib/therapyKinds";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const KIND_ORDER = ["psychotherapy", "mindfulness", "skill", "somatic", "physical", "relational", "community", "expressive", "psychedelic", "neuromodulation", "lifestyle"];

export default function Protocols() {
  const byKind: Record<string, string[]> = {};
  for (const n of THERAPY_NAMES) {
    const k = THERAPY_KIND[n] ?? "skill";
    (byKind[k] ??= []).push(n);
  }
  const linesFor = (n: string) => THERAPY_LINE_MAP.filter((t) => t.therapy === n).map((t) => t.line);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[900px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          The Protocol Library · {THERAPY_NAMES.length} mapped · every one citation-backed
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,48px)", color: CREAM, margin: "0 0 10px" }}>
          The protocols, in the open.
        </h1>
        <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.7, marginBottom: "8px" }}>
          Every protocol here is mapped to the specific intelligence lines it builds, with the peer-reviewed study
          behind each mapping on its page. What we can't do publicly is tell you <i>which ones are yours</i> — that's
          what the <Link href="/assessment" style={{ color: CHAMPAGNE }}>32-line assessment</Link> is for: it finds your
          master weakness and matches the library to it.
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginBottom: "30px" }}>
          the full member library holds 6,500+ interventions; these {THERAPY_NAMES.length} are the audited therapy-channel core
        </p>

        {KIND_ORDER.filter((k) => byKind[k]?.length).map((k) => (
          <div key={k} className="mb-8">
            <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: JADE, marginBottom: "10px" }}>
              {KIND_PROFILES[k].label} · {byKind[k].length}
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {byKind[k].map((n) => (
                <Link key={n} href={`/protocol/${therapySlug(n)}`}
                  className="rounded-xl p-4 block"
                  style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)", textDecoration: "none" }}>
                  <span style={{ ...serif, fontSize: "16.5px", color: CREAM, display: "block", marginBottom: "4px" }}>
                    {therapyDisplay(n).split(" (")[0]}
                  </span>
                  <span style={{ ...mono, fontSize: "9.5px", color: MUTED, letterSpacing: "0.06em" }}>
                    {linesFor(n).join(" · ")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <PublicFooter />
    </div>
  );
}
