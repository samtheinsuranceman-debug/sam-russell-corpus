// ============================================================
// PROTOCOL SUB-PAGE — /protocol/:slug/:sub — seven deep pages
// under every protocol (156 × 7 = 1,092 URLs): first-week,
// evidence, dose, who-its-for, mistakes, results, stack.
// Content = the therapy's own mapped data (lines, capacities,
// citations, dose profile) + the kind-level playbook in
// protocolSubpages.ts, disclosed as kind-level. Honesty rules
// as everywhere: literature-typical, estimates never guarantees.
// ============================================================
import { Link, useParams } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";
import { THERAPY_LINE_MAP, type TherapyLineEntry } from "@shared/therapyLineMap";
import {
  THERAPY_NAMES, therapySlug, therapyFromSlug, therapyDisplay, LINE_NAMES,
  lineSlug, COMPARE_PAIRS, compareSlug, PROTOCOL_SUBPAGES, type ProtocolSubpageId,
} from "@shared/seo";
import { kindFor, KIND_PROFILES, THERAPY_KIND } from "@/lib/therapyKinds";
import { THERAPY_MEANING } from "@/lib/therapyMeaning";
import { playbookFor } from "@/lib/protocolSubpages";
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

const ENGINE_TO_DISPLAY: Record<string, string> = {
  Kinesthetic: "Bodily-Kinesthetic", Naturalistic: "Naturalist",
  Systematic: "Systemic", "Financial-Self-Management": "Financial",
  Empathic: "Emotional", Influence: "Rhetorical",
};
const displayFor = (engine: string): string | undefined =>
  ENGINE_TO_DISPLAY[engine] ?? (LINE_NAMES.includes(engine) ? engine : undefined);

export const SUBPAGE_LABELS: Record<ProtocolSubpageId, { nav: string; kicker: string; h1: (n: string) => string }> = {
  "first-week": { nav: "First week", kicker: "The starting protocol", h1: (n) => `Your first week of ${n}` },
  evidence: { nav: "Evidence", kicker: "The receipts", h1: (n) => `The evidence behind ${n}` },
  dose: { nav: "Dose", kicker: "Dose, schedule & course", h1: (n) => `The dose that makes ${n} work` },
  "who-its-for": { nav: "Who it's for", kicker: "Fit & readiness", h1: (n) => `Who ${n} is for — and who it isn't` },
  mistakes: { nav: "Mistakes", kicker: "The failure modes", h1: (n) => `The mistakes that waste ${n}` },
  results: { nav: "Results", kicker: "The honest timeline", h1: (n) => `What ${n} changes — and when` },
  stack: { nav: "Stack", kicker: "Combinations", h1: (n) => `What to stack with ${n}` },
};

function Label({ children, color = CHAMPAGNE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color, margin: "0 0 8px" }}>{children}</p>;
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ border: `1px solid ${LINE_C}`, borderLeft: accent ? `3px solid ${accent}` : `1px solid ${LINE_C}`, background: "rgba(241,234,219,0.02)" }}>
      {children}
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "14.5px", lineHeight: 1.72, color: CREAM2, margin: "0 0 14px" }}>{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ ...serif, fontSize: "26px", color: CREAM, margin: "30px 0 10px" }}>{children}</h2>;
}

// Kind-level disclosure — the same honesty pattern as TherapyDetail.
function Disclosure({ kindLabel }: { kindLabel: string }) {
  return (
    <p style={{ ...mono, fontSize: "10.5px", lineHeight: 1.7, color: MUTED, margin: "26px 0 0", borderTop: `1px solid ${LINE_C}`, paddingTop: "14px" }}>
      HONESTY NOTE — The guidance on this page is written at the level of its protocol kind ({kindLabel.toLowerCase()})
      and interpolated with this protocol's own mapped data. Characterizations are literature-typical, not personal
      guarantees; your numbers come from your assessment, not from a page.
    </p>
  );
}

export default function ProtocolSubpage() {
  const params = useParams<{ slug: string; sub: string }>();
  const name = therapyFromSlug(params.slug ?? "");
  const sub = (PROTOCOL_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as ProtocolSubpageId) : undefined;
  if (!name || !sub) return <NotFound />;
  const entries = THERAPY_LINE_MAP.filter((t) => t.therapy === name);
  if (entries.length === 0) return <NotFound />;

  const display = therapyDisplay(name).split(" (")[0];
  const slug = therapySlug(name);
  const kindId = THERAPY_KIND[name] ?? "skill";
  const kind = kindFor(name);
  const kindLabel = KIND_PROFILES[kindId]?.label ?? kind.label;
  const play = playbookFor(kindId);
  const meaning = THERAPY_MEANING[kindId];
  const labels = SUBPAGE_LABELS[sub];
  const primary = entries.find((e) => e.role === "PRIMARY") ?? entries[0];

  const lineLink = (engine: string) => {
    const d = displayFor(engine);
    return d
      ? <Link href={`/line/${lineSlug(d)}`} style={{ color: CHAMPAGNE }}>{engine}</Link>
      : <span style={{ color: CREAM }}>{engine}</span>;
  };

  // Same-line neighbors, for the stack page: other protocols mapped to any
  // of this protocol's lines, strongest roles first, deduped.
  const neighbors: { therapy: string; line: string; role: string }[] = [];
  if (sub === "stack") {
    const seen = new Set<string>();
    const roleRank = { PRIMARY: 0, SECONDARY: 1, TERTIARY: 2 } as Record<string, number>;
    const pool = THERAPY_LINE_MAP
      .filter((t) => t.therapy !== name && entries.some((e) => e.line === t.line))
      .sort((a, b) => roleRank[a.role] - roleRank[b.role]);
    for (const t of pool) {
      if (seen.has(t.therapy)) continue;
      seen.add(t.therapy);
      neighbors.push({ therapy: t.therapy, line: t.line, role: t.role });
      if (neighbors.length >= 8) break;
    }
  }

  const sections: Record<ProtocolSubpageId, React.ReactNode> = {
    "first-week": (
      <>
        <Body>
          The distance between reading about {display} and being seven days into it is the distance that decides
          everything — most protocols are lost in that gap, not in month three. This page closes it: the
          {" "}{kindLabel.toLowerCase()} starting sequence, day by day, with this protocol's own targets plugged in.
        </Body>
        <H2>The seven-day sequence</H2>
        {play.firstWeek.map((s) => (
          <Card key={s.day} accent={CHAMPAGNE}>
            <Label>{s.day}</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{s.text}</p>
          </Card>
        ))}
        <H2>What this week is building</H2>
        <Body>
          {display} is mapped in this library for specific, cited capacities — not vague betterment. The machinery
          your first week sets up is aimed at:
        </Body>
        {entries.map((e) => (
          <Card key={e.line} accent={e.role === "PRIMARY" ? JADE : CHAMPAGNE}>
            <p style={{ ...serif, fontSize: "17px", margin: "0 0 4px" }}>{lineLink(e.line)}</p>
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: 0 }}>{e.capacity}</p>
          </Card>
        ))}
        <H2>The dose you're ramping toward</H2>
        <Body>{kind.dose}</Body>
        <Body>
          Week one is deliberately below that dose. The full schedule is the destination; the first week's only job
          is to still exist by day eight. The <Link href={`/protocol/${slug}/dose`} style={{ color: CHAMPAGNE }}>dose page</Link>{" "}
          carries the complete schedule, and the{" "}
          <Link href={`/protocol/${slug}/mistakes`} style={{ color: CHAMPAGNE }}>mistakes page</Link> covers what
          typically kills this kind of protocol in weeks two through four.
        </Body>
      </>
    ),
    evidence: (
      <>
        <Body>
          Every claim this library makes about {display} traces to a specific peer-reviewed study mapped to a
          specific capacity — that's the standard, and this page is where the receipts live. Read them the way a
          skeptic would; that's what they're for.
        </Body>
        <H2>The mapped studies</H2>
        {entries.map((e) => (
          <Card key={e.line} accent={e.role === "PRIMARY" ? JADE : CHAMPAGNE}>
            <Label color={e.role === "PRIMARY" ? JADE : CHAMPAGNE}>{e.role === "PRIMARY" ? "Primary target" : e.role === "SECONDARY" ? "Secondary effect" : "Adjunct effect"} · {e.line}</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM, margin: "0 0 8px" }}>{e.capacity}</p>
            <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: "0 0 8px" }}><b style={{ color: CREAM }}>Finding:</b> {e.finding}</p>
            <p style={{ ...mono, fontSize: "11px", lineHeight: 1.6, color: MUTED, margin: 0 }}>{e.cite}{e.doi ? ` · DOI: ${e.doi}` : ""}</p>
          </Card>
        ))}
        <H2>What this evidence does — and doesn't — show</H2>
        <Body>
          It shows that {display} developed the mapped capacities in the studied populations, under the studied
          doses. It does <b style={{ color: CREAM }}>not</b> show that every user gains, that gains are uniform, or
          that the protocol works at half the dose — no honest reading of any intervention literature supports those
          claims, and this library doesn't make them.
        </Body>
        <Body>
          {entries.some((e) => e.role === "PRIMARY")
            ? `The strongest mapping here is PRIMARY — the studies tie ${display} directly to its target capacity, which is the highest confidence tier this library assigns.`
            : `The mappings here are secondary or adjunct — documented effects, honestly smaller than a primary protocol aimed at the same lines. That's a reason to stack it well, not a reason to skip it.`}
          {" "}Citations sitewide are undergoing an external audit; anything that doesn't survive verification lands
          publicly on the <Link href="/corrections" style={{ color: CHAMPAGNE }}>Corrections Ledger</Link> — that's
          the deal we've made with you.
        </Body>
      </>
    ),
    dose: (
      <>
        <Body>
          Underdosing is the quietest way to fail a real protocol — running half the schedule, feeling nothing, and
          concluding it doesn't work. The trials that produced {display}'s evidence ran specific doses; this page is
          that schedule, stated plainly.
        </Body>
        <H2>The literature-typical dose</H2>
        <Card accent={JADE}>
          <Label color={JADE}>Dose & frequency</Label>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{kind.dose}</p>
        </Card>
        <Card accent={CHAMPAGNE}>
          <Label>What it honestly demands</Label>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{kind.intensity}</p>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>How long gains last</Label>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{kind.durability}</p>
        </Card>
        <H2>Minimum effective vs. full course</H2>
        <Body>
          The honest hierarchy: the full course at the stated frequency is what the outcome literature describes;
          a reduced-but-consistent dose beats an ambitious-but-broken one; and a dose below consistency is a
          placebo with a schedule. If life forces a cut, cut session length before you cut frequency — in almost
          every protocol kind, the rhythm carries more of the effect than the volume.
        </Body>
        <H2>Missed days, boosters, and stopping</H2>
        <Body>
          Missing once is noise; the failure mode is letting one miss become an exit (the{" "}
          <Link href={`/protocol/${slug}/mistakes`} style={{ color: CHAMPAGNE }}>mistakes page</Link> covers that
          machinery). Resume at the next scheduled slot, no make-ups, no penance. When the course ends, reread the
          durability line above and take it literally — it tells you whether this protocol is one you finish or one
          you keep, and budgeting for that on day one is cheaper than rediscovering it in a relapse.
        </Body>
      </>
    ),
    "who-its-for": (
      <>
        <Body>
          No protocol is for everyone — a sentence most wellness pages can't afford and this library is built on.
          Here's who {display} actually fits, in profile terms, and who should route differently.
        </Body>
        <H2>The profile that points here</H2>
        <Body>
          {display} earns its place for people whose assessment flags the lines it's mapped to. If any of these are
          weak in your profile, this page stops being general information:
        </Body>
        {entries.map((e) => {
          const d = displayFor(e.line);
          return (
            <Card key={e.line} accent={e.role === "PRIMARY" ? JADE : CHAMPAGNE}>
              <p style={{ ...serif, fontSize: "17px", margin: "0 0 4px" }}>{lineLink(e.line)}</p>
              <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: 0 }}>
                {e.capacity}
                {d ? <> · <Link href={`/weak/${lineSlug(d)}`} style={{ color: CHAMPAGNE }}>what a weak {e.line} line costs</Link></> : null}
              </p>
            </Card>
          );
        })}
        {meaning && (
          <>
            <H2>Two people who end up on this page</H2>
            {meaning.personas.map((p) => (
              <Card key={p.tag} accent={CHAMPAGNE}>
                <Label>{p.tag}</Label>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{p.text}</p>
              </Card>
            ))}
          </>
        )}
        <H2>Who should route differently</H2>
        <Card accent={EMBER}>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{play.caution}</p>
        </Card>
        <Body>
          And the honest catch-all: if your profile doesn't flag these lines, a different protocol will pay you more
          for the same effort. That's the entire argument for{" "}
          <Link href="/assessment" style={{ color: CHAMPAGNE }}>measuring before choosing</Link>.
        </Body>
      </>
    ),
    mistakes: (
      <>
        <Body>
          Protocols rarely fail because the method is wrong — the trials already screened for that. They fail in
          predictable, human ways, and {kindLabel.toLowerCase()} protocols fail in THESE ways specifically. Read
          this before week two, not after month two.
        </Body>
        <H2>The five that do the damage</H2>
        {play.mistakes.map((m, i) => (
          <Card key={m.name} accent={EMBER}>
            <Label color={EMBER}>Mistake {i + 1} — {m.name}</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{m.text}</p>
          </Card>
        ))}
        <H2>"Not working" vs. "not yet"</H2>
        <Body>
          The most expensive misread in the library. Before concluding {display} isn't working, check three things
          against this site's own pages: are you at the{" "}
          <Link href={`/protocol/${slug}/dose`} style={{ color: CHAMPAGNE }}>full dose</Link>, are you inside the
          honest <Link href={`/protocol/${slug}/results`} style={{ color: CHAMPAGNE }}>timeline</Link> (most
          protocols are declared failures at precisely the week the literature calls normal), and are you measuring
          the right thing — the mapped capacity, not a mood on a Tuesday. If all three check out and nothing has
          moved, THAT is real data: non-response to one protocol is not non-response to all of them, and the{" "}
          <Link href={`/protocol/${slug}/stack`} style={{ color: CHAMPAGNE }}>alternatives</Link> exist for exactly
          this case.
        </Body>
      </>
    ),
    results: (
      <>
        <Body>
          Here is the timeline the literature actually describes for {kindLabel.toLowerCase()} protocols — including
          the flat early stretch that most marketing edits out. Knowing the shape of the curve in advance is worth
          more than motivation; motivation runs out exactly where the curve is flattest.
        </Body>
        <H2>The honest timeline</H2>
        {play.results.map((r) => (
          <Card key={r.stage} accent={JADE}>
            <Label color={JADE}>{r.stage}</Label>
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{r.text}</p>
          </Card>
        ))}
        <H2>What "working" measurably means here</H2>
        <Body>
          Not glow — capacity. For {display}, the mapped outcome is{" "}
          <b style={{ color: CREAM }}>{primary.capacity.charAt(0).toLowerCase() + primary.capacity.slice(1)}</b>
          {entries.length > 1 ? `, with documented effects on ${entries.slice(1).map((e) => e.line).join(", ")} alongside` : ""}.
          That's what the studies measured, so that's what "results" means on this page.
        </Body>
        <H2>The spread, honestly</H2>
        <Body>
          Every real intervention has one: some completers gain a lot, most gain meaningfully, a minority gain
          little. What moves you between those groups, per the literature — completing the course, running the full
          dose, and aiming the protocol at a genuinely weak line — is exactly what{" "}
          <Link href="/assessment" style={{ color: CHAMPAGNE }}>your profile</Link> exists to get right. An estimate,
          never a guarantee; anyone who promises the right-hand tail is selling.
        </Body>
      </>
    ),
    stack: (
      <>
        <Body>
          Protocols compound. The library maps {display} to {entries.length === 1 ? "one line" : `${entries.length} lines`},
          and every one of those lines has other mapped protocols — which means real choices about what carries the
          load and what supports it.
        </Body>
        <H2>How to order a stack</H2>
        <Body>
          One rule does most of the work: <b style={{ color: CREAM }}>one primary protocol per weak line, adjuncts
          around it — never three primaries at once.</b>{" "}
          {entries.some((e) => e.role === "PRIMARY")
            ? `${display} is mapped PRIMARY here, so in a stack it's a load-bearer: give it the calendar priority and let lighter protocols support it.`
            : `${display} is mapped as a supporting protocol here — its best position is alongside a primary aimed at the same line, where its documented effect compounds instead of carrying the load alone.`}
        </Body>
        <H2>Protocols that share its lines</H2>
        {neighbors.map((n) => {
          const pairOk = COMPARE_PAIRS.some(([a, b]) => compareSlug(a, b) === compareSlug(name, n.therapy));
          return (
            <Card key={n.therapy} accent={n.role === "PRIMARY" ? JADE : CHAMPAGNE}>
              <Label color={n.role === "PRIMARY" ? JADE : CHAMPAGNE}>{n.role} on {n.line}</Label>
              <p style={{ ...serif, fontSize: "17px", margin: "0 0 4px" }}>
                <Link href={`/protocol/${therapySlug(n.therapy)}`} style={{ color: CREAM }}>{therapyDisplay(n.therapy).split(" (")[0]}</Link>
              </p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: MUTED, margin: 0 }}>
                {pairOk
                  ? <Link href={`/compare/${compareSlug(name, n.therapy)}`} style={{ color: CHAMPAGNE }}>head-to-head comparison with {display} →</Link>
                  : <>same line, different mechanism — a candidate for the supporting slot.</>}
              </p>
            </Card>
          );
        })}
        <H2>The pairing that's always legal</H2>
        <Body>
          Every stack in this library sits on the{" "}
          <Link href="/practices" style={{ color: CHAMPAGNE }}>keystone practices</Link> — sleep protection,
          implementation intentions, and the other small-dose habits that raise the yield of whatever protocol runs
          on top of them. They're the soil, not a competing crop. And which line deserves your one primary slot is
          a measurement question, not a vibes question:{" "}
          <Link href="/assessment" style={{ color: CHAMPAGNE }}>that's the assessment's job</Link>.
        </Body>
      </>
    ),
  };

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[860px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          <Link href="/protocols" style={{ color: CHAMPAGNE }}>Protocol Library</Link>
          {" · "}
          <Link href={`/protocol/${slug}`} style={{ color: CHAMPAGNE }}>{display}</Link>
          {" · "}{labels.kicker}
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.06, color: CREAM, margin: "0 0 12px" }}>
          {labels.h1(display)}
        </h1>
        <PageVideo label={`${display} — ${labels.nav}`} />

        {/* Sibling nav — the seven deep pages, one click apart */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {PROTOCOL_SUBPAGES.map((s) => (
            <Link key={s} href={`/protocol/${slug}/${s}`}
              style={{ ...mono, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", textDecoration: "none",
                color: s === sub ? INK : CHAMPAGNE, background: s === sub ? CHAMPAGNE : `${CHAMPAGNE}11`, border: `1px solid ${CHAMPAGNE}55` }}>
              {SUBPAGE_LABELS[s].nav}
            </Link>
          ))}
        </div>

        {sections[sub]}

        <Disclosure kindLabel={kindLabel} />

        <div className="mt-10 rounded-2xl p-6 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: `${CHAMPAGNE}0a` }}>
          <p style={{ ...serif, fontSize: "22px", color: CREAM, margin: "0 0 6px" }}>Is {display} even your protocol?</p>
          <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: CREAM2, margin: "0 0 14px" }}>
            The right protocol aimed at the wrong line is the most disciplined way to waste a season. Measure all 32 lines first.
          </p>
          <Link href="/assessment" style={{ ...mono, display: "inline-block", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "12px 22px", borderRadius: "6px", background: CHAMPAGNE, color: INK, textDecoration: "none", fontWeight: 600 }}>
            Begin the assessment
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
