// ============================================================
// CAPACITY DETAIL — /capacity/:slug — landing pages for the
// eight engine capacities that have no /line/ display page.
// The axis definition is OUR framework (presented as framework);
// the protocols that build it carry their own citations from
// the therapy map.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { CAPACITY_AXES } from "@/lib/capacityAxes";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { engineLineFromSlug, engineLineSlug, therapySlug, therapyDisplay, CAPACITY_ONLY_LINES } from "@shared/seo";
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

function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

export default function CapacityDetail() {
  const params = useParams<{ slug: string }>();
  const name = engineLineFromSlug(params.slug ?? "");
  const axis = name ? CAPACITY_AXES[name] : undefined;
  if (!name || !axis || !CAPACITY_ONLY_LINES.includes(name)) return <NotFound />;
  const builders = THERAPY_LINE_MAP.filter((e) => e.line === name);
  const idx = CAPACITY_ONLY_LINES.indexOf(name);
  const prev = CAPACITY_ONLY_LINES[(idx + CAPACITY_ONLY_LINES.length - 1) % CAPACITY_ONLY_LINES.length];
  const next = CAPACITY_ONLY_LINES[(idx + 1) % CAPACITY_ONLY_LINES.length];

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[760px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          The hidden axes · capacity {idx + 1} of {CAPACITY_ONLY_LINES.length} · scored, never displayed — until now
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5.2vw,50px)", lineHeight: 1.06, color: CREAM, margin: "0 0 14px" }}>
          The {axis.name} Capacity
        </h1>
        <p style={{ fontSize: "15px", lineHeight: 1.8, color: CREAM2, margin: "0 0 22px" }}>{axis.what}</p>
        <p style={{ ...mono, fontSize: "10px", lineHeight: 1.7, color: MUTED, margin: "0 0 26px" }}>
          Framework, labeled as framework: this axis is how our scoring engine construes the capacity when reading your
          spoken evidence. The protocols below carry their own peer-reviewed citations.
        </p>

        <div className="rounded-2xl p-6 mb-6" style={{ border: `1px solid ${CHAMPAGNE}33`, borderLeft: `3px solid ${CHAMPAGNE}`, background: "rgba(224,198,140,0.04)" }}>
          <Label>Why nothing ever measured it in you</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: 0 }}>{axis.missed}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
            <Label color={JADE}>When it's strong</Label>
            <p style={{ fontSize: "13.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{axis.strong}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
            <Label color={EMBER}>What weakness costs</Label>
            <p style={{ fontSize: "13.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{axis.weak}</p>
          </div>
        </div>

        <Label>The protocols that build it — {builders.length} in the cited library</Label>
        <div className="space-y-3 mb-8">
          {builders.map((b) => (
            <div key={b.therapy} className="rounded-xl border p-5" style={{ borderColor: LINE_C, background: "rgba(241,234,219,0.02)" }}>
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                <Link href={`/protocol/${therapySlug(b.therapy)}`} style={{ ...serif, fontSize: "17px", color: CREAM }}>
                  {therapyDisplay(b.therapy).split(" (")[0]}
                </Link>
                <span style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.14em", color: b.role === "PRIMARY" ? JADE : MUTED }}>{b.role}</span>
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.7, color: CREAM2, margin: "0 0 6px" }}>{b.capacity}</p>
              <p style={{ ...mono, fontSize: "10px", lineHeight: 1.6, color: MUTED, margin: "0 0 8px" }}>{b.cite}</p>
              <Link href={`/build/${engineLineSlug(name)}/${therapySlug(b.therapy)}`} style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: CHAMPAGNE }}>
                Build {axis.name} with this →
              </Link>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-7 mb-8 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,26px)", color: CREAM, margin: "0 0 6px" }}>
            This capacity is in your scores. It's never been in your file.
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            The 32-line assessment scores the axes the tests you've taken structurally can't — from spoken evidence,
            by eight independent AI judges, with error bars shown.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/capacity/${engineLineSlug(prev)}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>← {prev}</Link>
          <Link href="/protocols" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>protocol library</Link>
          <Link href={`/capacity/${engineLineSlug(next)}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>{next} →</Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
