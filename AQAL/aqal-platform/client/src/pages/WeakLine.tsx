// ============================================================
// WEAK LINE — /weak/:slug — one page per line (32), written for
// the problem-aware searcher: the signs of a weak line, what it
// costs left invisible, why nobody ever told you, and the
// repair plan. Composes the line's real risk narrative,
// encyclopedia facts, keystone practice, and mapped protocols.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { LINE_ENCYCLOPEDIA } from "@/lib/lineEncyclopedia";
import { LINE_DEEP } from "@/lib/lineDeepDives";
import { lineFromSlug, lineSlug, therapySlug } from "@shared/seo";
import { keystoneForLine } from "@shared/keystonePractices";
import { therapiesForLine } from "@shared/therapyLineMap";
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

const DISPLAY_TO_ENGINE: Record<string, string> = {
  "Bodily-Kinesthetic": "Kinesthetic", "Naturalist": "Naturalistic", "Financial": "Financial-Self-Management",
  "Systemic": "Systematic", "Emotional": "Empathic", "Rhetorical": "Influence",
};

function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

export default function WeakLine() {
  const params = useParams<{ slug: string }>();
  const name = lineFromSlug(params.slug ?? "");
  if (!name) return <NotFound />;
  const info = LINE_ENCYCLOPEDIA[name];
  const deep = LINE_DEEP[name];
  if (!info || !deep) return <NotFound />;
  const eng = DISPLAY_TO_ENGINE[name] ?? name;
  const keystone = keystoneForLine(eng);
  const therapies = therapiesForLine(eng, 3);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[780px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: EMBER, marginBottom: "10px" }}>
          The weak line series · <Link href={`/line/${lineSlug(name)}`} style={{ color: CHAMPAGNE }}>the full {name} page</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5.2vw,50px)", lineHeight: 1.06, color: CREAM, margin: "0 0 12px" }}>
          The weak {name} line: signs, costs, and the repair plan.
        </h1>
        <PageVideo label="this weak line" />
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: CREAM2, margin: "0 0 28px" }}>
          {info.def} When this line is weak — and almost nobody has ever had it measured — it doesn&rsquo;t feel like weakness.
          It feels like bad luck, other people&rsquo;s fault, or just how life is. Here is what it actually looks like.
        </p>

        <div className="rounded-2xl p-6 mb-7" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
          <Label color={EMBER}>What weak looks like from inside</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: 0 }}>{deep.risk}</p>
        </div>

        <Label>Why nobody ever told you</Label>
        <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 6px" }}>{info.everTested}</p>
        <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: "0 0 28px" }}>
          By our estimate, only <b style={{ color: EMBER }}>~{info.testedOdds.toLocaleString()} in 1,000</b> adults have
          ever been formally measured on this line. A weakness no instrument ever touched isn&rsquo;t a character flaw —
          it&rsquo;s an unread gauge. The repair starts with a reading.
        </p>

        <Label color={JADE}>The repair plan — what actually moves this line</Label>
        <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: CREAM2, margin: "0 0 14px" }}>{info.measurement}</p>
        {keystone && (
          <div className="rounded-xl p-5 mb-3" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
            <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: JADE, margin: "0 0 5px" }}>
              Start here — the keystone practice
            </p>
            <p style={{ ...serif, fontSize: "18px", color: CREAM, margin: "0 0 4px" }}>
              <Link href={`/practice/${keystone.id}`} style={{ color: CREAM }}>{keystone.name} →</Link>
            </p>
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: "0 0 4px" }}>{keystone.prescription}</p>
            <p style={{ ...mono, fontSize: "9.5px", color: MUTED, margin: 0 }}>evidence: {keystone.evidence} · horizon: {keystone.horizon}</p>
          </div>
        )}
        {therapies.length > 0 && (
          <div className="mb-7">
            <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "10px 0 8px" }}>
              The clinical-grade options
            </p>
            {therapies.map((t) => (
              <p key={t.therapy} style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: "0 0 6px" }}>
                <Link href={`/protocol/${therapySlug(t.therapy)}`} style={{ color: CREAM, fontWeight: 700 }}>{t.therapy}</Link> — {t.capacity}
              </p>
            ))}
          </div>
        )}

        <Label color={JADE}>What repair buys you</Label>
        <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: "0 0 30px" }}>{deep.integration}</p>

        <div className="rounded-2xl p-7 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,27px)", color: CREAM, margin: "0 0 6px" }}>
            First: find out if this is actually YOUR weak line.
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            Self-diagnosis from a web page is how people spend a year fixing the wrong thing. The 32-line assessment
            locates your real master weakness — this line or another — and prescribes in order. Free for the first
            10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        <p style={{ ...mono, fontSize: "10px", color: MUTED, marginTop: "20px" }}>
          the other side: <Link href={`/gift/${lineSlug(name)}`} style={{ color: CHAMPAGNE }}>signs you&rsquo;re GIFTED on the {name} line →</Link>
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}
