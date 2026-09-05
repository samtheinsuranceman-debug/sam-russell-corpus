// ============================================================
// THERAPY DETAIL — /protocol/:slug — one page per mapped
// protocol (92 total). Dense single-screen-plus layout:
// what it is, which lines it builds (with roles), the dose,
// the durability, how it compounds WITH a strength and a
// strength cluster, how it operates AGAINST the weakness
// cluster and the dominant weakness specifically, and the
// honest estimate — labeled as estimate, never guarantee.
// Facts: shared/therapyLineMap (capacity+cite+finding per line)
// + therapyKinds (dose/intensity/durability profiles).
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { THERAPY_MEANING } from "@/lib/therapyMeaning";
import { THERAPY_LINE_MAP, THERAPY_THIN_LINES, type TherapyLineEntry } from "@shared/therapyLineMap";
import { THERAPY_NAMES, therapySlug, therapyFromSlug, therapyDisplay, LINE_NAMES, lineSlug, COMPARE_PAIRS, compareSlug, engineLineSlug } from "@shared/seo";
import { kindFor, KIND_PROFILES, THERAPY_KIND } from "@/lib/therapyKinds";
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

// Engine-taxonomy line name → homepage display name that owns a /line page.
const ENGINE_TO_DISPLAY: Record<string, string> = {
  Kinesthetic: "Bodily-Kinesthetic", Naturalistic: "Naturalist",
  Systematic: "Systemic", "Financial-Self-Management": "Financial",
  Empathic: "Emotional", Influence: "Rhetorical",
};
const displayFor = (engine: string): string | undefined =>
  ENGINE_TO_DISPLAY[engine] ?? (LINE_NAMES.includes(engine) ? engine : undefined);

const ROLE_META: Record<string, { label: string; color: string; note: string }> = {
  PRIMARY:   { label: "PRIMARY", color: JADE, note: "builds this capacity directly — it's what the protocol is for" },
  SECONDARY: { label: "SECONDARY", color: CHAMPAGNE, note: "reliably lifts this line as a strong side effect" },
  TERTIARY:  { label: "ADJUNCT", color: MUTED, note: "supportive contribution alongside a primary protocol" },
};

function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

// The honest estimate, composed from the strongest mapped role.
function estimateFor(entries: TherapyLineEntry[], kindId: string): { verdict: string; body: string } {
  const hasPrimary = entries.some((e) => e.role === "PRIMARY");
  const lines = entries.map((e) => e.line).join(", ");
  if (hasPrimary) {
    return {
      verdict: "Strong candidate",
      body: `Our estimate — not a guarantee: for a person whose profile flags ${lines} and who completes the full dose, we'd expect a real, noticeable capacity gain — the peer-reviewed trials behind this page measured exactly that. The spread is honest too: some completers gain a lot, some modestly, a minority little. What moves you between those groups, per the literature: completing the course, doing the between-session work, and matching the protocol to the right weakness — which is precisely what your profile is for.`,
    };
  }
  return {
    verdict: "Solid supporting move",
    body: `Our estimate — not a guarantee: this protocol lifts ${lines} as a documented secondary effect rather than a direct target. Expect a supporting contribution — real, measured in trials, but smaller than a primary protocol aimed at the same line. Best used the way the library uses it: stacked alongside a primary protocol, where its effect compounds instead of carrying the load alone.`,
  };
}

export default function TherapyDetail() {
  const params = useParams<{ slug: string }>();
  const name = therapyFromSlug(params.slug ?? "");
  if (!name) return <NotFound />;
  const entries = THERAPY_LINE_MAP.filter((t) => t.therapy === name);
  if (entries.length === 0) return <NotFound />;

  const display = therapyDisplay(name);
  const kind = kindFor(name);
  const kindLabel = KIND_PROFILES[THERAPY_KIND[name] ?? "skill"]?.label ?? kind.label;
  const primary = entries.find((e) => e.role === "PRIMARY") ?? entries[0];
  const targetLines = entries.map((e) => e.line);
  const anyThin = targetLines.some((l) => THERAPY_THIN_LINES.includes(l));
  const est = estimateFor(entries, THERAPY_KIND[name] ?? "skill");
  const meaning = THERAPY_MEANING[THERAPY_KIND[name] ?? "skill"];

  const idx = THERAPY_NAMES.indexOf(name);
  const prev = THERAPY_NAMES[(idx + THERAPY_NAMES.length - 1) % THERAPY_NAMES.length];
  const next = THERAPY_NAMES[(idx + 1) % THERAPY_NAMES.length];

  const lineLink = (engine: string) => {
    const d = displayFor(engine);
    return d
      ? <Link href={`/line/${lineSlug(d)}`} style={{ color: CHAMPAGNE }}>{engine}</Link>
      : <span style={{ color: CREAM }}>{engine}</span>;
  };

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[860px] mx-auto px-6 py-14">

        {/* Header */}
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Protocol {idx + 1} of {THERAPY_NAMES.length} · <Link href="/protocols" style={{ color: CHAMPAGNE }}>the full library index</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(32px,5.5vw,54px)", lineHeight: 1.04, color: CREAM, margin: "0 0 12px" }}>
          {display}
        </h1>
        <PageVideo label={display} />
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}55`, background: `${CHAMPAGNE}11` }}>
            {kindLabel}
          </span>
          {entries.map((e) => {
            const r = ROLE_META[e.role];
            return (
              <span key={e.line} style={{ ...mono, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: r.color, border: `1px solid ${r.color}55`, background: `${r.color}0d` }}>
                {r.label}: {e.line}
              </span>
            );
          })}
        </div>

        {/* What it is */}
        <p style={{ fontSize: "16px", lineHeight: 1.75, color: CREAM, margin: "0 0 8px" }}>{kind.what}</p>
        <p style={{ fontSize: "14.5px", lineHeight: 1.7, color: CREAM2, margin: "0 0 28px" }}>
          In this library, {display} is mapped for one job above all:{" "}
          <b style={{ color: CREAM }}>{primary.capacity.charAt(0).toLowerCase() + primary.capacity.slice(1)}</b>.
        </p>

        <div
          className="rounded-xl p-4 mb-8"
          style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}
        >
          <Label>Go deeper on this protocol</Label>
          <div className="flex items-center gap-2 flex-wrap">
            {([
              ["first-week", "Your first week"],
              ["evidence", "The evidence"],
              ["dose", "The dose"],
              ["who-its-for", "Who it's for"],
              ["mistakes", "The mistakes"],
              ["results", "Results timeline"],
              ["stack", "What to stack"],
              ["score", "Open scorecard"],
              ["synergy", "Options & synergy"],
              ["atrophy", "Durability"],
              ["daily-life", "Daily life"],
            ] as const).map(([subpage, label]) => (
              <Link
                key={subpage}
                href={`/protocol/${therapySlug(name)}/${subpage}`}
                style={{
                  ...mono,
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  color: CHAMPAGNE,
                  border: `1px solid ${CHAMPAGNE}55`,
                  background: `${CHAMPAGNE}0d`,
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* The lines it works on */}
        <Label>Which intelligence lines it works on</Label>
        <div className="space-y-3 mb-8">
          {entries.map((e) => {
            const r = ROLE_META[e.role];
            return (
              <div key={e.line} className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, borderLeft: `3px solid ${r.color}`, background: "rgba(241,234,219,0.02)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: r.color, margin: "0 0 4px" }}>
                  {r.label} · {r.note}
                </p>
                <p style={{ ...serif, fontSize: "18px", margin: "0 0 4px" }}>{lineLink(e.line)}</p>
                <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: 0 }}>{e.capacity}</p>
              </div>
            );
          })}
        </div>

        {/* Dose / intensity / durability */}
        <div className="grid gap-3 mb-9" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
          <div className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label>Dose & frequency</Label>
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: 0 }}>{kind.dose}</p>
          </div>
          <div className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label>Intensity — honestly</Label>
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: 0 }}>{kind.intensity}</p>
          </div>
          <div className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
            <Label>How long it lasts</Label>
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: 0 }}>{kind.durability}</p>
          </div>
        </div>

        {/* Direction one: with your strengths */}
        <div className="rounded-2xl p-6 mb-5" style={{ border: `1px solid ${JADE}44`, borderLeft: `3px solid ${JADE}`, background: "rgba(155,192,178,0.05)" }}>
          <Label color={JADE}>Direction one — run WITH a strength</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 10px" }}>
            <b style={{ color: CREAM }}>On an individual strength:</b> if {targetLines.length > 1 ? "one of these lines" : "this line"} is
            already strong in your profile, this protocol doesn't just maintain it — it converts it from a trait into an
            instrument. A strength you've trained deliberately behaves differently from one you were born lucky with:
            it holds under pressure, it deploys on command, and it stops being invisible to you. Strong lines run at
            maybe half their potential when they've never been worked consciously — this is how the other half gets opened.
          </p>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>
            <b style={{ color: CREAM }}>On a strength cluster:</b> strengths never operate alone — your top lines form a
            cluster that does your winning. Feeding {targetLines.length > 1 ? "these lines" : "this line"} feeds the cluster:
            capacity gains here free bandwidth the neighboring strengths currently spend compensating, which is why
            members often report a protocol's biggest effect showing up in a line it never directly touched. Your report
            maps the cluster; this protocol is one of its supply lines.
          </p>
        </div>

        {/* Direction two: against the weakness cluster */}
        <div className="rounded-2xl p-6 mb-9" style={{ border: `1px solid ${EMBER}44`, borderLeft: `3px solid ${EMBER}`, background: "rgba(226,96,74,0.05)" }}>
          <Label color={EMBER}>Direction two — run AGAINST the weakness cluster</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: "0 0 10px" }}>
            <b style={{ color: CREAM }}>On the dominant weakness:</b> weaknesses cluster too, and the cluster almost always
            has a governor — one dominant weakness with controlling influence over the rest. When your report flags{" "}
            {targetLines.length > 1 ? "one of these lines" : "this line"} as that governor, this protocol stops being
            self-improvement and becomes structural repair: build the governing capacity —{" "}
            {primary.capacity.charAt(0).toLowerCase() + primary.capacity.slice(1)} — and the weaknesses it was holding
            in place lose their anchor. That's why the library aims protocols at the master weakness first: one accurate
            intervention there outperforms five scattered ones.
          </p>
          <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>
            <b style={{ color: CREAM }}>On fragility — the honest stakes:</b> an unworked weakness cluster is how lives take
            devastating hits that were visible in advance: the crash arrives through the weakest line, at the worst time,
            and takes goals, savings, or relationships with it. Working this protocol against a flagged weakness is
            fragility reduction in the insurance sense — it doesn't promise the storm won't come; it changes what the
            storm finds when it arrives. Members' own Crash Signatures (the Black Box) show the same pattern from the
            other side: almost every recorded catastrophe ran through an unworked weak line.
          </p>
        </div>

        {/* Evidence */}
        <Label>The evidence — peer-reviewed, benchmark findings</Label>
        <div className="space-y-3 mb-3">
          {entries.map((e) => (
            <div key={e.line + e.cite.slice(0, 20)} className="rounded-xl p-4" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...mono, fontSize: "11px", lineHeight: 1.6, color: CREAM, margin: "0 0 4px" }}>{e.cite}</p>
              {e.doi && <p style={{ ...mono, fontSize: "10px", color: MUTED, margin: "0 0 5px" }}>doi: {e.doi}</p>}
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: CREAM2, margin: 0 }}>{e.finding}</p>
            </div>
          ))}
        </div>
        <p style={{ ...mono, fontSize: "10px", color: MUTED, lineHeight: 1.6, margin: "0 0 30px" }}>
          {anyThin ? "One or more mapped lines carry a thin-evidence flag. " : ""}
          Citations as published in the mapped literature; independent DOI-level verification is in progress and posts
          to the <Link href="/corrections" style={{ color: CHAMPAGNE }}>Corrections Ledger</Link>.
        </p>

        {/* Comparisons + capacity pages */}
        {(() => {
          const comps = COMPARE_PAIRS.filter(([x, y]) => x === name || y === name).slice(0, 4);
          return (comps.length > 0 || entries.length > 0) ? (
            <div className="mb-8">
              {comps.length > 0 && (
                <>
                  <Label>Compared head-to-head</Label>
                  <div className="flex items-center gap-3 flex-wrap mb-4">
                    {comps.map(([x, y]) => (
                      <Link key={x + y} href={`/compare/${compareSlug(x, y)}`} style={{ ...mono, fontSize: "10.5px", color: CHAMPAGNE }}>
                        {therapyDisplay(x).split(" (")[0]} vs {therapyDisplay(y).split(" (")[0]}
                      </Link>
                    ))}
                  </div>
                </>
              )}
              <Label>Capacity deep-dives</Label>
              <div className="flex items-center gap-3 flex-wrap">
                {entries.map((e) => (
                  <Link key={e.line} href={`/build/${engineLineSlug(e.line)}/${therapySlug(name)}`} style={{ ...mono, fontSize: "10.5px", color: CHAMPAGNE }}>
                    {display} for {e.line} →
                  </Link>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* What it could mean for you — the second page */}
        {meaning && (
          <>
            <Label>What committing to this could mean for you</Label>
            <div className="space-y-4 mb-8">
              <div className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9BC0B2", margin: "0 0 6px" }}>For your life and outcomes</p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{meaning.forYou}</p>
              </div>
              <div className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#9BC0B2", margin: "0 0 6px" }}>What it changes for the people around you</p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{meaning.ripple}</p>
              </div>
              <div className="rounded-2xl p-6" style={{ border: `1px solid #E2604A44`, borderLeft: `3px solid #E2604A`, background: "rgba(226,96,74,0.05)" }}>
                <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#E2604A", margin: "0 0 6px" }}>The cost of leaving the gap alone</p>
                <p style={{ fontSize: "14.5px", lineHeight: 1.75, color: CREAM2, margin: 0 }}>{meaning.cost}</p>
              </div>
            </div>

            <Label>Two people, one protocol — how it lands differently</Label>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              {meaning.personas.map((pe) => (
                <div key={pe.tag} className="rounded-2xl p-6" style={{ border: `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
                  <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: CHAMPAGNE, margin: "0 0 6px" }}>{pe.tag}</p>
                  <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{pe.text}</p>
                </div>
              ))}
            </div>
            <p style={{ ...mono, fontSize: "10px", lineHeight: 1.7, color: MUTED, margin: "0 0 28px" }}>
              These sections characterize this protocol's KIND ({kindLabel.toLowerCase()}) — honest generalizations from the
              family's literature, applied to this protocol's mapped capacity. Typical, never a personal guarantee.
            </p>
          </>
        )}

        {/* The honest estimate */}
        <div className="rounded-2xl p-6 mb-10" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <Label>The honest estimate — {est.verdict}</Label>
          <p style={{ fontSize: "14.5px", lineHeight: 1.78, color: CREAM2, margin: "0 0 10px" }}>{est.body}</p>
          <p style={{ ...mono, fontSize: "10.5px", color: MUTED, margin: 0 }}>
            Nothing on this page is a guarantee, a diagnosis, or medical advice. Clinical protocols require qualified
            practitioners. The study that matters most has a sample size of one — you — which is what measurement is for.
          </p>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-7 mb-10 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(21px,3.2vw,28px)", color: CREAM, margin: "0 0 6px" }}>
            Is this YOUR protocol? Your profile decides.
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            The 32-line assessment finds your master weakness and matches protocols to it — this one included, if it fits.
            Free for the first 10,000 founding members.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>

        {/* Prev / next */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href={`/protocol/${therapySlug(prev)}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>
            ← {therapyDisplay(prev).split(" (")[0]}
          </Link>
          <Link href="/protocols" style={{ ...mono, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED }}>
            all protocols
          </Link>
          <Link href={`/protocol/${therapySlug(next)}`} style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: CHAMPAGNE }}>
            {therapyDisplay(next).split(" (")[0]} →
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
