// ============================================================
// GIFT LINE — /gift/:slug — one page per line (32), written for
// the person who suspects they're strong here and was never
// told: the signs, why school missed it, what it's worth, the
// shadow side of unexamined strength, and the best pairings.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { LINE_ENCYCLOPEDIA, G_BAND_LABEL } from "@/lib/lineEncyclopedia";
import { LINE_DEEP } from "@/lib/lineDeepDives";
import { LINE_ROLE } from "@/lib/linePairs";
import { lineFromSlug, lineSlug, pairSlug, LINE_NAMES } from "@shared/seo";
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

export default function GiftLine() {
  const params = useParams<{ slug: string }>();
  const name = lineFromSlug(params.slug ?? "");
  if (!name) return <NotFound />;
  const info = LINE_ENCYCLOPEDIA[name];
  const deep = LINE_DEEP[name];
  const role = LINE_ROLE[name];
  if (!info || !deep || !role) return <NotFound />;
  const idx = LINE_NAMES.indexOf(name);
  const partners = [LINE_NAMES[(idx + 5) % 32], LINE_NAMES[(idx + 11) % 32], LINE_NAMES[(idx + 19) % 32]].filter((n) => n !== name).slice(0, 3);
  const band = G_BAND_LABEL[info.g];
  const schoolMissed = info.g !== "g-cluster";

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[780px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: JADE, marginBottom: "10px" }}>
          The gifted line series · <Link href={`/line/${lineSlug(name)}`} style={{ color: CHAMPAGNE }}>the full {name} page</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5.2vw,50px)", lineHeight: 1.06, color: CREAM, margin: "0 0 12px" }}>
          Signs you&rsquo;re gifted on the {name} line — and nobody ever told you.
        </h1>
        <PageVideo label="this gift" />
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: CREAM2, margin: "0 0 26px" }}>
          {deep.expanded}
        </p>

        <Label color={JADE}>Why school never caught it</Label>
        <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 6px" }}>
          {schoolMissed
            ? `This line sits outside the narrow band schools test — ${band.label.toLowerCase()}. A report card literally has no row for it, which is how people carry a genuine gift for decades believing they're ordinary.`
            : `This line IS in the band schools test — so if you're strong here you probably have the grades to show it. What school never showed you is the other 31 lines around it, or how this strength behaves as part of a system.`}
        </p>
        <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: "0 0 26px" }}>
          {info.everTested} By our estimate, only <b style={{ color: EMBER }}>~{info.testedOdds.toLocaleString()} in 1,000</b>{" "}
          adults were ever formally measured here.
        </p>

        <div className="rounded-2xl p-6 mb-7" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
          <Label color={JADE}>What this gift is worth — deployed on purpose</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: "0 0 8px" }}>{deep.integration}</p>
          <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>
            In any partnership or team, this line makes you <b style={{ color: CREAM }}>the {role.noun}</b> — {role.gives}.
          </p>
        </div>

        <div className="rounded-2xl p-6 mb-8" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
          <Label color={EMBER}>The shadow of an unexamined gift</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>
            A strength you&rsquo;ve never measured runs itself: it over-deploys where it doesn&rsquo;t belong, hides the weaknesses
            beside it, and builds an identity you never chose. The strongest line in an unmeasured profile is usually the
            one making the profile&rsquo;s biggest mistakes — with total confidence. Measurement doesn&rsquo;t shrink a gift;
            it gives it a steering wheel.
          </p>
        </div>

        <Label>Where this gift multiplies — its best pairings</Label>
        <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: "0 0 10px" }}>
          Lines multiply. {name} paired with a second strong line produces capabilities neither has alone:
        </p>
        <div className="flex items-center gap-3 flex-wrap mb-9">
          {partners.map((n) => (
            <Link key={n} href={`/pair/${pairSlug(name, n)}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.06em", color: CHAMPAGNE }}>
              {name} × {n}
            </Link>
          ))}
          <Link href="/pairs" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>all pairings →</Link>
        </div>

        <div className="rounded-2xl p-7 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,27px)", color: CREAM, margin: "0 0 6px" }}>
            Suspicion isn&rsquo;t a score. Get the number.
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            The 32-line assessment measures this line against the other 31 — and finds the combinations your profile
            actually carries. Free for the first 10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        <p style={{ ...mono, fontSize: "10px", color: MUTED, marginTop: "20px" }}>
          the other side: <Link href={`/weak/${lineSlug(name)}`} style={{ color: CHAMPAGNE }}>the weak {name} line — signs and repair →</Link>
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}
