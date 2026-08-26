// ============================================================
// WING DETAIL — /wing/:id — one page per Myth Museum wing: the
// family's full anatomy (pattern, seduction, tells, American
// hook — analysis labeled as analysis) plus every exhibit that
// belongs to the wing, with verdicts.
// ============================================================
import { Link, useParams } from "wouter";
import { GoDeeper } from "@/components/DeepPage";
import { WING_SUBPAGES } from "@shared/seo";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { WING_PROFILES, MYTH_WING } from "@/lib/mythWings";
import { MYTHS, MYTH_VERDICT_META } from "@/lib/mythMuseum";
import { WING_IDS } from "@shared/seo";
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

export default function WingDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const wing = WING_PROFILES[id];
  if (!wing || !WING_IDS.includes(id)) return <NotFound />;
  const exhibits = MYTHS.filter((m) => MYTH_WING[m.id] === id);
  const idx = WING_IDS.indexOf(id);
  const prev = WING_IDS[(idx + WING_IDS.length - 1) % WING_IDS.length];
  const next = WING_IDS[(idx + 1) % WING_IDS.length];

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[760px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: EMBER, marginBottom: "10px" }}>
          The Myth Museum · wing {idx + 1} of {WING_IDS.length} · <Link href="/myths" style={{ color: CHAMPAGNE }}>full collection</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(28px,5vw,46px)", lineHeight: 1.08, color: CREAM, margin: "0 0 18px" }}>
          {wing.label}
        </h1>
        <PageVideo label={wing.label.split(" — ")[0]} />

        <div className="space-y-4 mb-8">
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
            <Label color={EMBER}>How the family claims to work</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.78, color: CREAM2, margin: 0 }}>{wing.pattern}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${CHAMPAGNE}33`, borderLeft: `3px solid ${CHAMPAGNE}`, background: "rgba(224,198,140,0.04)" }}>
            <Label>Why it feels like it works — the honest psychology</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.78, color: CREAM2, margin: 0 }}>{wing.seduction}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
            <Label color={JADE}>The tell-tale signs</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.78, color: CREAM2, margin: 0 }}>{wing.tell}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label color={MUTED}>The American hook — our analysis, labeled as analysis</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.78, color: CREAM2, margin: "0 0 8px" }}>{wing.hook}</p>
            <p style={{ ...mono, fontSize: "10px", color: MUTED, margin: 0 }}>
              Cultural interpretation, not a measured finding — the longer argument lives at{" "}
              <Link href="/why-we-fall" style={{ color: CHAMPAGNE }}>Why We Fall for It</Link>.
            </p>
          </div>
        </div>

        <Label>The exhibits in this wing — {exhibits.length} documented</Label>
        <div className="space-y-2 mb-8">
          {exhibits.map((m) => {
            const v = MYTH_VERDICT_META[m.verdict];
            return (
              <Link key={m.id} href={`/myth/${m.id}`}
                className="rounded-xl border p-4 block"
                style={{ borderColor: LINE_C, background: "rgba(241,234,219,0.02)" }}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span style={{ ...serif, fontSize: "16px", color: CREAM }}>{m.name}</span>
                  <span style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.12em", color: v.color }}>{m.verdict}</span>
                </div>
                <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: MUTED, margin: "4px 0 0" }}>&ldquo;{m.claim}&rdquo;</p>
              </Link>
            );
          })}
        </div>

        <div className="rounded-2xl p-7 mb-8 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,26px)", color: CREAM, margin: "0 0 6px" }}>
            Every wing sold a shortcut around measurement.
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            The 32-line assessment is the long way — spoken evidence, eight independent AI judges, error bars,
            and a public corrections trail.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/wing/${prev}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>← {WING_PROFILES[prev]?.label.split(" — ")[0]}</Link>
          <Link href="/why-we-fall" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>why we fall for it</Link>
          <Link href={`/wing/${next}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>{WING_PROFILES[next]?.label.split(" — ")[0]} →</Link>
        </div>
      </div>
      <GoDeeper base={`/wing/${params.id}`} subs={WING_SUBPAGES} labels={{ spot: "Spotting the pattern", escape: "Getting out" }} />
      <PublicFooter />
    </div>
  );
}
