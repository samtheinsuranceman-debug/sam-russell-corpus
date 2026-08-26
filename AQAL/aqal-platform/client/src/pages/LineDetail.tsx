// ============================================================
// LINE DETAIL — /line/:slug — the full landing page for one of
// the 32 intelligence lines. No popup to block: a real URL with
// the whole story — what it is, the research, the odds you've
// ever been measured, what integrating it buys, what weakness
// costs, how it trains, and a film slot per line.
// Content: lineDeepDives (story) + lineEncyclopedia (facts) +
// shared therapy/keystone data (training). SEO: RouteMeta serves
// per-line titles; each page is in the sitemap.
// ============================================================
import { Link, useParams } from "wouter";
import { GoDeeper } from "@/components/DeepPage";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { LINE_ENCYCLOPEDIA, G_BAND_LABEL } from "@/lib/lineEncyclopedia";
import { LINE_DEEP } from "@/lib/lineDeepDives";
import { LINE_MEANING } from "@/lib/lineMeaning";
import { LINE_VIDEOS, toEmbed } from "@/lib/lineVideos";
import { dynamicsFor } from "@/lib/lineDynamics";
import { LINE_NAMES, LINE_SUBPAGES, lineSlug, lineFromSlug, therapySlug, pairSlug } from "@shared/seo";
import { keystoneForLine } from "@shared/keystonePractices";
import { therapiesForLine, THERAPY_THIN_LINES } from "@shared/therapyLineMap";
import NotFound from "@/pages/NotFound";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

// Display name → engine-taxonomy name, for pulling training protocols.
// Only confident mappings; unmapped lines simply omit the protocols block.
const DISPLAY_TO_ENGINE: Record<string, string> = {
  "Bodily-Kinesthetic": "Kinesthetic",
  "Naturalist": "Naturalistic",
  "Financial": "Financial-Self-Management",
  "Systemic": "Systematic",
  "Emotional": "Empathic",
  "Rhetorical": "Influence",
};
const engineName = (display: string) => DISPLAY_TO_ENGINE[display] ?? display;

function SectionLabel({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color, margin: "0 0 10px" }}>
      {children}
    </p>
  );
}

function VideoSlot({ line }: { line: string }) {
  const embed = toEmbed(LINE_VIDEOS[line] ?? "");
  if (embed) {
    return (
      <div className="rounded-2xl overflow-hidden mb-12" style={{ border: `1px solid ${CHAMPAGNE}33`, aspectRatio: "16 / 9", background: "#000" }}>
        {embed.kind === "video"
          ? <video src={embed.src} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : <iframe src={embed.src} title={`${line} — film briefing`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ width: "100%", height: "100%", border: 0 }} loading="lazy" />}
      </div>
    );
  }
  return (
    <div className="rounded-2xl flex flex-col items-center justify-center mb-12"
      style={{ border: `1px dashed ${LINE_C}`, aspectRatio: "16 / 7", background: `linear-gradient(180deg,${INK2},${INK})` }}>
      <div style={{ width: "54px", height: "54px", borderRadius: "999px", border: `1px solid ${CHAMPAGNE}55`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
        <span style={{ color: CHAMPAGNE, fontSize: "18px", marginLeft: "3px" }}>▶</span>
      </div>
      <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.24em", textTransform: "uppercase", color: CHAMPAGNE, margin: 0 }}>
        Film briefing · in production
      </p>
      <p style={{ ...mono, fontSize: "9.5px", color: MUTED, marginTop: "6px" }}>
        the {line} line, on camera — coming to this page
      </p>
    </div>
  );
}

export default function LineDetail() {
  const params = useParams<{ slug: string }>();
  const name = lineFromSlug(params.slug ?? "");
  if (!name) return <NotFound />;
  const info = LINE_ENCYCLOPEDIA[name];
  const deep = LINE_DEEP[name];
  const meaning = LINE_MEANING[name];
  if (!info || !deep) return <NotFound />;

  const idx = LINE_NAMES.indexOf(name);
  const prev = LINE_NAMES[(idx + LINE_NAMES.length - 1) % LINE_NAMES.length];
  const next = LINE_NAMES[(idx + 1) % LINE_NAMES.length];
  const band = G_BAND_LABEL[info.g];
  const gVerdict =
    info.g === "g-cluster" ? "Part of general intelligence (g) — IQ tests DO measure this line."
    : info.g === "partially-linked" ? "Partially overlaps g — an IQ score hints at it but doesn't capture it."
    : "NOT part of general intelligence — an IQ test cannot see this line at all.";
  const oddsPct = Math.min(100, Math.max(0.4, (info.testedOdds / 1000) * 100));
  const eng = engineName(name);
  const keystone = keystoneForLine(eng);
  const dyn = dynamicsFor(name);
  const therapies = therapiesForLine(eng, 3);
  const thinEvidence = THERAPY_THIN_LINES.includes(eng);

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[820px] mx-auto px-6 py-14">

        {/* Hero */}
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Line {idx + 1} of 32 · <Link href="/lines" style={{ color: CHAMPAGNE }}>the full map</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(40px,7vw,68px)", lineHeight: 1.0, color: CREAM, margin: "0 0 14px" }}>
          {name}
        </h1>
        <p style={{ ...serif, fontSize: "clamp(19px,2.6vw,24px)", lineHeight: 1.35, color: CREAM2, margin: "0 0 18px" }}>
          {deep.hook}
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-10">
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: band.color, border: `1px solid ${band.color}55`, background: `${band.color}11` }}>
            {band.label}
          </span>
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: EMBER, border: `1px solid ${EMBER}44`, background: `${EMBER}0d` }}>
            ~{info.testedOdds.toLocaleString()} in 1,000 ever tested
          </span>
        </div>

        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, margin: "-24px 0 28px" }}>
          deep dives: <Link href={`/weak/${lineSlug(name)}`} style={{ color: CHAMPAGNE }}>the weak {name} line</Link> ·{" "}
          <Link href={`/gift/${lineSlug(name)}`} style={{ color: CHAMPAGNE }}>signs you're gifted here</Link>
        </p>

        <VideoSlot line={name} />

        {/* What it is */}
        <SectionLabel>What this line actually is</SectionLabel>
        <p style={{ fontSize: "16px", lineHeight: 1.75, color: CREAM, margin: "0 0 10px" }}>{info.def}</p>
        <p style={{ fontSize: "15px", lineHeight: 1.75, color: CREAM2, margin: "0 0 36px" }}>{deep.expanded}</p>

        {/* The measurement gap */}
        <div className="rounded-2xl p-6 mb-9" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
          <SectionLabel color={EMBER}>Have you ever been tested for this?</SectionLabel>
          <div className="flex items-baseline gap-2 flex-wrap" style={{ marginBottom: "8px" }}>
            <span style={{ ...serif, fontSize: "34px", color: CREAM, lineHeight: 1 }}>~{info.testedOdds.toLocaleString()} in 1,000</span>
            <span style={{ ...mono, fontSize: "10px", color: MUTED }}>adults have ever been formally measured on this line (our estimate)</span>
          </div>
          <div aria-hidden="true" style={{ height: "7px", borderRadius: "999px", background: "rgba(241,234,219,0.10)", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ height: "100%", width: `${oddsPct}%`, borderRadius: "999px", background: info.testedOdds >= 500 ? JADE : EMBER }} />
          </div>
          <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{info.everTested}</p>
        </div>

        {/* g relationship */}
        <SectionLabel>Where it stands with g — the IQ question</SectionLabel>
        <p style={{ fontSize: "15.5px", lineHeight: 1.7, color: CREAM, fontWeight: 600, margin: "0 0 6px" }}>{gVerdict}</p>
        <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 8px" }}>{info.gNote}</p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, margin: "0 0 36px" }}>
          full correlation map with sources: <Link href="/science" style={{ color: CHAMPAGNE }}>the science</Link> · exact r-values pinned by the <Link href="/corrections" style={{ color: CHAMPAGNE }}>open citation audit</Link>
        </p>

        {/* If you integrate it */}
        <div className="rounded-2xl p-6 mb-6" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
          <SectionLabel color={JADE}>If you measure it — and start using it on purpose</SectionLabel>
          <p style={{ fontSize: "15px", lineHeight: 1.78, color: CREAM2, margin: "0 0 10px" }}>{deep.integration}</p>
          <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>
            <b style={{ color: JADE }}>The short version:</b> {info.benefit}
          </p>
        </div>

        {/* If it stays weak */}
        <div className="rounded-2xl p-6 mb-9" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
          <SectionLabel color={EMBER}>If it's weak — and stays invisible</SectionLabel>
          <p style={{ fontSize: "15px", lineHeight: 1.78, color: CREAM2, margin: 0 }}>{deep.risk}</p>
        </div>

        {/* Can you train it */}
        <SectionLabel>Can it be trained?</SectionLabel>
        <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 14px" }}>{info.measurement}</p>
        {keystone && (
          <div className="rounded-xl p-5 mb-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 6px" }}>
              A keystone practice for this line
            </p>
            <p style={{ ...serif, fontSize: "18px", color: CREAM, margin: "0 0 4px" }}>{keystone.name}</p>
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: "0 0 4px" }}>{keystone.prescription}</p>
            <p style={{ ...mono, fontSize: "10px", color: MUTED, margin: 0 }}>evidence: {keystone.evidence} · horizon: {keystone.horizon}</p>
          </div>
        )}
        {therapies.length > 0 && (
          <div className="mb-3">
            <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 8px" }}>
              Protocols in the member library that lift this line{thinEvidence ? " · thin evidence — flagged honestly" : ""}
            </p>
            {therapies.map((t) => (
              <p key={t.therapy} style={{ fontSize: "13.5px", lineHeight: 1.6, color: CREAM2, margin: "0 0 6px" }}>
                <Link href={`/protocol/${therapySlug(t.therapy)}`} style={{ color: CREAM, fontWeight: 700 }}>{t.therapy}</Link> — {t.capacity}
              </p>
            ))}
          </div>
        )}
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, margin: "0 0 36px" }}>
          the full prescription library (6,500+ interventions) unlocks with your profile
        </p>

        {/* Research base */}
        <SectionLabel>The research behind it — peer-reviewed sources</SectionLabel>
        <div className="space-y-2 mb-4">
          {info.researchers.map((r) => (
            <p key={r.name} style={{ fontSize: "14px", lineHeight: 1.6, color: CREAM2, margin: 0 }}>
              <b style={{ color: CREAM }}>{r.name}</b> — {r.note}
            </p>
          ))}
        </div>
        <div className="space-y-3 mb-3">
          {deep.studies.map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...mono, fontSize: "11px", lineHeight: 1.6, color: CREAM, margin: "0 0 4px" }}>{s.cite}</p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: 0 }}>{s.finding}</p>
            </div>
          ))}
        </div>
        <p style={{ ...mono, fontSize: "10px", color: MUTED, lineHeight: 1.6, margin: "0 0 40px" }}>
          Honesty note: these are landmark works as cited in the literature; independent DOI-level verification of the
          full library is in progress and its results post to the <Link href="/corrections" style={{ color: CHAMPAGNE }}>Corrections Ledger</Link>.
        </p>

        {/* Power combinations teaser */}
        <SectionLabel>This line in combination</SectionLabel>
        <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: "0 0 10px" }}>
          Lines multiply — {name} paired with another strong line unlocks capabilities neither has alone. Explore its pairings:
        </p>
        <div className="flex items-center gap-3 flex-wrap mb-10">
          {[LINE_NAMES[(idx + 5) % 32], LINE_NAMES[(idx + 11) % 32], LINE_NAMES[(idx + 19) % 32]]
            .filter((n) => n !== name).slice(0, 3).map((n) => (
              <Link key={n} href={`/pair/${pairSlug(name, n)}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.06em", color: CHAMPAGNE }}>
                {name} × {n}
              </Link>
            ))}
          <Link href="/pairs" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
            all 496 pairings →
          </Link>
        </div>

        {/* What it could mean for you — the second page */}
        {meaning && (
          <>
            <SectionLabel>What this line could mean for you</SectionLabel>
            <div className="space-y-4 mb-8">
              <div className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9BC0B2", margin: "0 0 6px" }}>For your life and outcomes</p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{meaning.forYou}</p>
              </div>
              <div className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9BC0B2", margin: "0 0 6px" }}>Used consciously, every day</p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{meaning.lived}</p>
              </div>
              <div className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9BC0B2", margin: "0 0 6px" }}>What it changes for the people you love</p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{meaning.others}</p>
              </div>
              <div className="rounded-2xl p-6" style={{ border: `1px solid #E2604A44`, borderLeft: `3px solid #E2604A`, background: "rgba(226,96,74,0.05)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#E2604A", margin: "0 0 6px" }}>The cost of never measuring it</p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{meaning.cost}</p>
              </div>
              <div className="rounded-2xl p-6" style={{ border: `1px solid ${CHAMPAGNE}33`, borderLeft: `3px solid ${CHAMPAGNE}`, background: "rgba(224,198,140,0.04)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 6px" }}>How new is this science?</p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{meaning.history}</p>
              </div>
            </div>

            <SectionLabel>Two people, one line — how it lands differently</SectionLabel>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {meaning.personas.map((pe) => (
                <div key={pe.tag} className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
                  <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 6px" }}>{pe.tag}</p>
                  <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{pe.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="rounded-2xl p-7 mb-10 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(22px,3.4vw,30px)", color: CREAM, margin: "0 0 6px" }}>
            Where do YOU sit on the {name} line?
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            27 spoken questions. Eight AI labs score all 32 lines — this one included. Free for the first 10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 — claim a founding spot
          </Link>
        </div>

        {/* Interaction dossier: transparent framework interpretations, not diagnoses. */}
        {dyn && (
          <div className="mb-10">
            <SectionLabel color={JADE}>Signs you may be high in it</SectionLabel>
            <p style={{ fontSize: "14.5px", lineHeight: 1.72, color: CREAM2, margin: "0 0 8px" }}>
              A useful field signal is whether people repeatedly route these problems to you without being asked. That is
              not a measurement by itself. The strong-version description lives on{" "}
              <Link href={`/gift/${lineSlug(name)}`} style={{ color: CHAMPAGNE }}>the gifted-{name} page</Link>, and the
              structured five-question mirror is the{" "}
              <Link href={`/line/${lineSlug(name)}/self-check`} style={{ color: CHAMPAGNE }}>self-check</Link>.
            </p>
            <SectionLabel color={EMBER}>Signs you may be low in it</SectionLabel>
            <p style={{ fontSize: "14.5px", lineHeight: 1.72, color: CREAM2, margin: "0 0 16px" }}>
              Weak lines can feel like bad luck, difficult people, or plans that almost work. The itemized signs and costs
              are on <Link href={`/weak/${lineSlug(name)}`} style={{ color: CHAMPAGNE }}>the weak-{name} page</Link>.
            </p>
            <SectionLabel>Self-awareness &amp; self-control</SectionLabel>
            <p style={{ fontSize: "14.5px", lineHeight: 1.72, color: CREAM2, margin: "0 0 16px" }}>{dyn.selfReg}</p>
            <SectionLabel color={JADE}>The power trio — emergent property</SectionLabel>
            <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${LINE_C}`, borderLeft: `3px solid ${JADE}`, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: JADE, margin: "0 0 6px" }}>
                {name} ×{" "}
                <Link href={`/pair/${pairSlug(name, dyn.trio.partners[0])}`} style={{ color: JADE }}>{dyn.trio.partners[0]}</Link>
                {" × "}
                <Link href={`/pair/${pairSlug(name, dyn.trio.partners[1])}`} style={{ color: JADE }}>{dyn.trio.partners[1]}</Link>
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{dyn.trio.emergent}</p>
            </div>
            <SectionLabel color={EMBER}>The weakness cluster — when lows compound</SectionLabel>
            <div className="rounded-xl p-4 mb-4" style={{ border: `1px solid ${LINE_C}`, borderLeft: `3px solid ${EMBER}`, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: EMBER, margin: "0 0 6px" }}>
                weak {name} + weak {dyn.weakCluster.partners.join(" + weak ")}
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{dyn.weakCluster.failure}</p>
            </div>
            <SectionLabel color={EMBER}>If this is a controlling weakness</SectionLabel>
            <p style={{ fontSize: "14.5px", lineHeight: 1.72, color: CREAM2, margin: "0 0 8px" }}>{dyn.controlling}</p>
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: MUTED, margin: 0 }}>
              The <Link href="/weakness-finder" style={{ color: CHAMPAGNE }}>Master Weakness Finder</Link> helps you test
              that possibility as a working hypothesis. Trio and cluster dynamics are AQAL editorial framework
              interpretations built on each line's cited research profile; they are not diagnoses or guarantees.
            </p>
          </div>
        )}

        {/* Prev / next */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/line/${lineSlug(prev)}`} style={{ ...mono, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: CHAMPAGNE }}>
            ← {prev}
          </Link>
          <Link href="/lines" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
            all 32 lines
          </Link>
          <Link href={`/line/${lineSlug(next)}`} style={{ ...mono, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: CHAMPAGNE }}>
            {next} →
          </Link>
        </div>
      </div>
      <GoDeeper base={`/line/${lineSlug(name)}`} subs={LINE_SUBPAGES} labels={{ "at-work": "At work", "in-relationships": "In relationships", history: "The history", "raise-it": "Raising it", "self-check": "Self-check", "never-tested": "Never tested" }} />
      <PublicFooter />
    </div>
  );
}
