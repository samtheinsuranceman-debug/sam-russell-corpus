// ============================================================
// BUILD DETAIL — /build/:lineSlug/:therapySlug — one page per
// (line, therapy) mapping entry (156). The narrowest, most
// intent-matched pages on the site: "building THIS capacity
// with THIS protocol" — the entry's own capacity, citation,
// and finding are the unique payload.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { engineLineFromSlug, therapyFromSlug, therapySlug, therapyDisplay, engineLineSlug, LINE_NAMES, lineSlug, compareSlug, COMPARE_PAIRS } from "@shared/seo";
import { kindFor, KIND_PROFILES, THERAPY_KIND } from "@/lib/therapyKinds";
import NotFound from "@/pages/NotFound";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const ENGINE_TO_DISPLAY: Record<string, string> = {
  Kinesthetic: "Bodily-Kinesthetic", Naturalistic: "Naturalist", Systematic: "Systemic",
  "Financial-Self-Management": "Financial", Empathic: "Emotional", Influence: "Rhetorical",
};

const ROLE_NOTE: Record<string, string> = {
  PRIMARY: "This is a PRIMARY mapping — building this capacity is what the protocol is FOR, not a side effect.",
  SECONDARY: "This is a SECONDARY mapping — the protocol targets something else first, but reliably lifts this capacity along the way.",
  TERTIARY: "This is an ADJUNCT mapping — a supportive contribution, best stacked beside a primary protocol for this line.",
};

function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

export default function BuildDetail() {
  const params = useParams<{ line: string; therapy: string }>();
  const line = engineLineFromSlug(params.line ?? "");
  const therapy = therapyFromSlug(params.therapy ?? "");
  if (!line || !therapy) return <NotFound />;
  const entry = THERAPY_LINE_MAP.find((e) => e.line === line && e.therapy === therapy);
  if (!entry) return <NotFound />;

  const display = therapyDisplay(therapy).split(" (")[0];
  const kind = kindFor(therapy);
  const kindLabel = KIND_PROFILES[THERAPY_KIND[therapy] ?? "skill"]?.label ?? "";
  const displayLine = ENGINE_TO_DISPLAY[line] ?? (LINE_NAMES.includes(line) ? line : undefined);
  // Alternatives: other protocols mapped to the same line.
  const alternatives = THERAPY_LINE_MAP.filter((e) => e.line === line && e.therapy !== therapy).slice(0, 4);
  // Comparisons that include this therapy.
  const comparisons = COMPARE_PAIRS.filter(([a, b]) => a === therapy || b === therapy).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[780px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Capacity building · <Link href={`/protocol/${therapySlug(therapy)}`} style={{ color: CHAMPAGNE }}>{display}</Link>
          {displayLine && <> · <Link href={`/line/${lineSlug(displayLine)}`} style={{ color: CHAMPAGNE }}>{displayLine} line</Link></>}
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(28px,4.8vw,44px)", lineHeight: 1.08, color: CREAM, margin: "0 0 12px" }}>
          Building the {line} capacity with {display}.
        </h1>
        <PageVideo label="this build path" />
        <p style={{ fontSize: "15.5px", lineHeight: 1.72, color: CREAM, margin: "0 0 8px" }}>
          The specific capacity this pairing develops: <b>{entry.capacity.charAt(0).toLowerCase() + entry.capacity.slice(1)}</b>.
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginBottom: "26px" }}>{kindLabel}</p>

        <div className="rounded-2xl p-6 mb-7" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
          <Label color={JADE}>The evidence for exactly this claim</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: CREAM2, margin: "0 0 8px" }}>{entry.finding}</p>
          <p style={{ ...mono, fontSize: "10.5px", lineHeight: 1.6, color: CREAM, margin: "0 0 4px" }}>{entry.cite}</p>
          {entry.doi && <p style={{ ...mono, fontSize: "10px", color: MUTED, margin: 0 }}>doi: {entry.doi}</p>}
        </div>

        <Label>How strong is the mapping?</Label>
        <p style={{ fontSize: "14.5px", lineHeight: 1.72, color: CREAM2, margin: "0 0 26px" }}>{ROLE_NOTE[entry.role]}</p>

        <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          <div className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label>The dose</Label>
            <p style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: 0 }}>{kind.dose}</p>
          </div>
          <div className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label>How long gains last</Label>
            <p style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: 0 }}>{kind.durability}</p>
          </div>
        </div>

        {alternatives.length > 0 && (
          <>
            <Label>Other roads to the same capacity</Label>
            <div className="mb-7">
              {alternatives.map((e) => (
                <p key={e.therapy} style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: "0 0 6px" }}>
                  <Link href={`/build/${engineLineSlug(line)}/${therapySlug(e.therapy)}`} style={{ color: CREAM, fontWeight: 700 }}>
                    {therapyDisplay(e.therapy).split(" (")[0]}
                  </Link>{" "}
                  <span style={{ ...mono, fontSize: "9.5px", color: MUTED }}>({e.role.toLowerCase()})</span>
                </p>
              ))}
            </div>
          </>
        )}

        {comparisons.length > 0 && (
          <>
            <Label>Head-to-head comparisons</Label>
            <div className="flex items-center gap-3 flex-wrap mb-8">
              {comparisons.map(([x, y]) => (
                <Link key={x + y} href={`/compare/${compareSlug(x, y)}`} style={{ ...mono, fontSize: "10.5px", color: CHAMPAGNE }}>
                  {therapyDisplay(x).split(" (")[0]} vs {therapyDisplay(y).split(" (")[0]}
                </Link>
              ))}
            </div>
          </>
        )}

        <p style={{ ...mono, fontSize: "10px", color: MUTED, lineHeight: 1.6, margin: "0 0 28px" }}>
          Citation as published in the mapped literature; DOI-level verification in progress —{" "}
          <Link href="/corrections" style={{ color: CHAMPAGNE }}>Corrections Ledger</Link>. Not medical advice; clinical
          protocols require qualified practitioners.
        </p>

        <div className="rounded-2xl p-7 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,26px)", color: CREAM, margin: "0 0 6px" }}>
            Is {line} the capacity YOUR profile needs?
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            The 32-line assessment finds your actual gating weakness before you invest months in the wrong repair.
            Free for the first 10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
