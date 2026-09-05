// ============================================================
// PAIR DETAIL — /pair/:slug — one page per unordered pair of
// intelligence lines (496 total). Composes both lines' real
// encyclopedia + deep-dive content with the hand-written role
// engine (linePairs.ts): what each gives the other, the
// multiplication, the two shadow configurations, rarity and
// independence math, and the evidence from both lines.
// ============================================================
import { Link, useParams } from "wouter";
import { GoDeeper } from "@/components/DeepPage";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { LINE_ENCYCLOPEDIA, G_BAND_LABEL } from "@/lib/lineEncyclopedia";
import { LINE_DEEP } from "@/lib/lineDeepDives";
import { LINE_ROLE } from "@/lib/linePairs";
import { LINE_NAMES, PAIR_SUBPAGES, lineSlug, pairFromSlug, pairSlug } from "@shared/seo";
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

// First one-to-two sentences of a longer passage.
function excerpt(text: string, sentences = 2): string {
  const parts = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return parts.slice(0, sentences).join(" ").trim();
}

export default function PairDetail() {
  const params = useParams<{ slug: string }>();
  const pair = pairFromSlug(params.slug ?? "");
  if (!pair) return <NotFound />;
  const [a, b] = pair;
  const ea = LINE_ENCYCLOPEDIA[a], eb = LINE_ENCYCLOPEDIA[b];
  const da = LINE_DEEP[a], db = LINE_DEEP[b];
  const ra = LINE_ROLE[a], rb = LINE_ROLE[b];
  if (!ea || !eb || !da || !db || !ra || !rb) return <NotFound />;

  const pairName = `The ${ra.adj} ${rb.noun}`;
  const bothIndep = (ea.g === "independent" || ea.g === "mostly-independent") && (eb.g === "independent" || eb.g === "mostly-independent");
  const bothG = ea.g === "g-cluster" && eb.g === "g-cluster";
  const independence = bothIndep
    ? "These two lines are essentially uncorrelated with g — and with each other's g-loading. Strength in one tells you nothing about the other, which is exactly why someone strong in BOTH is genuinely uncommon: the combination has to be built or found, never assumed."
    : bothG
    ? "Both lines sit in the g cluster, so they travel together more often than most pairs — people strong in one are often decent in the other. The rare and valuable version is extremity in both, plus the trained skill to run them as one system."
    : "One of these lines tracks g; the other largely doesn't. That makes this a bridging pair — it connects the tested, credentialed part of the mind to a capacity no exam ever graded. Bridges like this are where unfair advantages live, because the two sides rarely meet in one person.";
  // Odds BOTH lines were ever formally measured in one adult — a compound
  // of the two per-line estimates, labeled as the estimate it is.
  const bothTested = Math.max(1, Math.round((ea.testedOdds * eb.testedOdds) / 1000));

  // Adjacent pairs for internal linking: same first line, next few partners.
  const others = LINE_NAMES.filter((n) => n !== a && n !== b);
  const related = [others[LINE_NAMES.indexOf(a) % others.length], others[(LINE_NAMES.indexOf(b) + 7) % others.length], others[(LINE_NAMES.indexOf(a) + 13) % others.length]]
    .filter((n, i, arr) => n && arr.indexOf(n) === i).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[840px] mx-auto px-6 py-14">

        {/* Header */}
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Power combination · <Link href={`/line/${lineSlug(a)}`} style={{ color: CHAMPAGNE }}>{a}</Link> × <Link href={`/line/${lineSlug(b)}`} style={{ color: CHAMPAGNE }}>{b}</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(34px,6vw,58px)", lineHeight: 1.03, color: CREAM, margin: "0 0 10px" }}>
          {pairName}
        </h1>
        <PageVideo label="this combination" />
        <p style={{ ...serif, fontSize: "clamp(18px,2.4vw,22px)", lineHeight: 1.4, color: CREAM2, margin: "0 0 16px" }}>
          What happens when {ra.noun.toLowerCase() === rb.noun.toLowerCase() ? "two of a kind" : `the ${ra.noun} and the ${rb.noun}`} run in one mind —
          and what it costs when only half the pair showed up.
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-10">
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: G_BAND_LABEL[ea.g].color, border: `1px solid ${G_BAND_LABEL[ea.g].color}55`, background: `${G_BAND_LABEL[ea.g].color}0d` }}>
            {a}: {G_BAND_LABEL[ea.g].label}
          </span>
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: G_BAND_LABEL[eb.g].color, border: `1px solid ${G_BAND_LABEL[eb.g].color}55`, background: `${G_BAND_LABEL[eb.g].color}0d` }}>
            {b}: {G_BAND_LABEL[eb.g].label}
          </span>
        </div>

        {/* The two lines at a glance */}
        <div className="grid gap-3 mb-9" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {[{ n: a, e: ea, r: ra }, { n: b, e: eb, r: rb }].map(({ n, e, r }) => (
            <div key={n} className="rounded-xl p-5" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 4px" }}>
                the {r.noun} · earns its keep in {r.arena}
              </p>
              <p style={{ ...serif, fontSize: "20px", margin: "0 0 6px" }}>
                <Link href={`/line/${lineSlug(n)}`} style={{ color: CREAM }}>{n} →</Link>
              </p>
              <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: 0 }}>{e.def}</p>
            </div>
          ))}
        </div>

        {/* What each gives the other */}
        <div className="rounded-2xl p-6 mb-5" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
          <Label color={JADE}>What {a} gives {b}</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 14px" }}>
            <b style={{ color: CREAM }}>{ra.gives.charAt(0).toUpperCase() + ra.gives.slice(1)}.</b>{" "}
            Pointed into {rb.arena}, that contribution changes what the {b} line can attempt: {eb.benefit.charAt(0).toLowerCase() + eb.benefit.slice(1)}
          </p>
          <Label color={JADE}>What {b} gives {a}</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>
            <b style={{ color: CREAM }}>{rb.gives.charAt(0).toUpperCase() + rb.gives.slice(1)}.</b>{" "}
            Turned toward {ra.arena}, it does for {a} what {a} can't do for itself: {ea.benefit.charAt(0).toLowerCase() + ea.benefit.slice(1)}
          </p>
        </div>

        {/* The multiplication */}
        <Label>The multiplication — why 1 + 1 isn't 2 here</Label>
        <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: "0 0 30px" }}>
          Lines don't add; they gate each other. A {ra.noun.toLowerCase()} without {rb.gives.split(" — ")[0]} keeps hitting the
          same wall — brilliant in {ra.arena}, stuck the moment the game moves to {rb.arena}. Run together, each line
          covers precisely the terrain where the other is blind, which is why strong pairs outperform what either line's
          solo score predicts. This is what your report's Power Combinations section hunts for: not your two best
          numbers, but the two lines whose <i>coverage</i> multiplies.
        </p>

        {/* Shadow configurations */}
        <div className="rounded-2xl p-6 mb-9" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
          <Label color={EMBER}>The shadow configurations — half a pair is a liability</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 12px" }}>
            <b style={{ color: CREAM }}>Strong {a}, weak {b}:</b> {excerpt(db.risk)} A strong {a} line makes this MORE
            dangerous, not less — its competence buys credibility and momentum that the missing {b} line can't back up.
          </p>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>
            <b style={{ color: CREAM }}>Strong {b}, weak {a}:</b> {excerpt(da.risk)} The {b} line's gifts keep generating
            opportunities that the weak {a} line keeps failing to hold.
          </p>
        </div>

        {/* Rarity & independence */}
        <Label>How rare is this combination?</Label>
        <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 10px" }}>{independence}</p>
        <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: "0 0 30px" }}>
          <b style={{ color: CREAM }}>The measurement gap, squared:</b> by our per-line estimates, roughly{" "}
          <b style={{ color: EMBER }}>{bothTested.toLocaleString()} in 1,000,000</b> adults have ever been formally
          measured on BOTH of these lines. Whatever this pair looks like in you, the odds are overwhelming that nobody —
          including you — has ever seen it measured.
        </p>

        {/* Evidence */}
        <Label>The research behind both lines</Label>
        <div className="space-y-3 mb-3">
          {[da.studies[0], db.studies[0], da.studies[1] ?? db.studies[1]].filter(Boolean).map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...mono, fontSize: "11px", lineHeight: 1.6, color: CREAM, margin: "0 0 4px" }}>{s.cite}</p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: 0 }}>{s.finding}</p>
            </div>
          ))}
        </div>
        <p style={{ ...mono, fontSize: "10px", color: MUTED, lineHeight: 1.6, margin: "0 0 34px" }}>
          Full research bases on each line's page: <Link href={`/line/${lineSlug(a)}`} style={{ color: CHAMPAGNE }}>{a}</Link> ·{" "}
          <Link href={`/line/${lineSlug(b)}`} style={{ color: CHAMPAGNE }}>{b}</Link>. Pair-level interaction claims are
          our framework's synthesis, not a cited finding — flagged honestly, and challengeable on the{" "}
          <Link href="/corrections" style={{ color: CHAMPAGNE }}>Corrections Ledger</Link>.
        </p>

        {/* CTA */}
        <div className="rounded-2xl p-7 mb-10 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(21px,3.2vw,28px)", color: CREAM, margin: "0 0 6px" }}>
            Do you carry this pair?
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            The assessment measures both lines — and all 30 others — then hunts your Power Combinations for you.
            Free for the first 10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        {/* Related pairs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>related pairs:</span>
          {related.map((n) => (
            <Link key={n} href={`/pair/${pairSlug(a, n)}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.06em", color: CHAMPAGNE }}>
              {a} × {n}
            </Link>
          ))}
          <Link href="/pairs" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
            all 496 pairs
          </Link>
        </div>
      </div>
      <GoDeeper base={`/pair/${params.slug}`} subs={PAIR_SUBPAGES} labels={{ collide: "When they collide", train: "Training the pair", "at-work": "At work" }} />
      <PublicFooter />
    </div>
  );
}
