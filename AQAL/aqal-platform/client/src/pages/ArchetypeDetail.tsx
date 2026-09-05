// ============================================================
// ARCHETYPE DEEP PAGES — /archetype/:id (246 dossiers) and
// /archetype/:id/{verify,break-out} (492 subs). Every entry is
// rendered from its own cited research record: configuration,
// untreated trajectory, the connection/development case, the
// measured growth numbers, and the full source list.
// ============================================================
import { useParams } from "wouter";
import { archById, ARCH_SUBPAGES, type ArchSubpageId, lineSlug, LINE_NAMES, engineLineSlug, CAPACITY_ONLY_LINES, therapySlug, therapyDisplay, archBlendSlug, ARCH_BLENDS } from "@shared/seo";
import { keystoneForLine } from "@shared/keystonePractices";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE, MUTED } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const DISPLAY_TO_ENGINE: Record<string, string> = {
  "Bodily-Kinesthetic": "Kinesthetic", "Naturalist": "Naturalistic",
  "Financial": "Financial-Self-Management", "Systemic": "Systematic",
  "Emotional": "Empathic", "Rhetorical": "Influence",
};
const engineName = (n: string) => DISPLAY_TO_ENGINE[n] ?? n;

const KIND_LABEL: Record<string, { label: string; color: string; note: string }> = {
  archetype: { label: "Configuration archetype", color: EMBER, note: "a recurring strong/starved-line pattern with a documented trajectory" },
  integrated: { label: "POSITIVE · integrated archetype", color: JADE, note: "the developed configuration — the version worth becoming" },
  starvation: { label: "Starved-line profile", color: EMBER, note: "what the research says happens when one line goes unfed" },
  isolation: { label: "Isolation research", color: CHAMPAGNE, note: "the science of what disconnection does to a configuration" },
  connection: { label: "Connection research", color: JADE, note: "the science of what matching and development do" },
};

function LineChip({ name }: { name: string }) {
  if (LINE_NAMES.includes(name)) return <Gold href={`/line/${lineSlug(name)}`}>{name}</Gold>;
  if (CAPACITY_ONLY_LINES.includes(name)) return <Gold href={`/capacity/${engineLineSlug(name)}`}>{name}</Gold>;
  return <span style={{ color: "#F1EADB" }}>{name}</span>;
}

const SUB_LABELS: Record<string, string> = { verify: "Are you this one?", "break-out": "Breaking out" };

export default function ArchetypeDetail() {
  const params = useParams<{ id: string; sub?: string }>();
  const a = archById(params.id ?? "");
  const sub = params.sub ? ((ARCH_SUBPAGES as readonly string[]).includes(params.sub) ? (params.sub as ArchSubpageId) : undefined) : undefined;
  if (!a || (params.sub && !sub)) return <NotFound />;
  const kmeta = KIND_LABEL[a.kind] ?? KIND_LABEL.archetype;
  const base = `/archetype/${a.id}`;
  const blends = ARCH_BLENDS.filter(([x, y]) => x === a.id || y === a.id).slice(0, 6);
  const rank = { PRIMARY: 0, SECONDARY: 1, TERTIARY: 2 } as Record<string, number>;

  const main = (
    <>
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: "999px", color: kmeta.color, border: `1px solid ${kmeta.color}55`, background: `${kmeta.color}0d` }}>
          {kmeta.label}
        </span>
      </div>
      <Body>{kmeta.note.charAt(0).toUpperCase() + kmeta.note.slice(1)}. Everything on this page traces to the sources listed at the bottom — read them like a skeptic; that's what they're for.</Body>
      <H2>The configuration</H2>
      <Card accent={CHAMPAGNE}><CardText>{a.pattern}</CardText></Card>
      {(a.highLines.length > 0 || a.lowLines.length > 0) && (
        <Body>
          {a.highLines.length > 0 && <><b style={{ color: "#F1EADB" }}>Running hot:</b>{" "}
            {a.highLines.map((l, i) => <span key={l}>{i > 0 ? ", " : ""}<LineChip name={l} /></span>)}. </>}
          {a.lowLines.length > 0 && <><b style={{ color: "#F1EADB" }}>Starved:</b>{" "}
            {a.lowLines.map((l, i) => <span key={l}>{i > 0 ? ", " : ""}<LineChip name={l} /></span>)}.</>}
        </Body>
      )}
      <H2>Left alone — the documented trajectory</H2>
      <Card accent={EMBER}><CardText>{a.untreatedTrajectory}</CardText></Card>
      <H2>What development and connection change</H2>
      <Card accent={JADE}><CardText>{a.connectionCase}</CardText></Card>
      <H2>The measured gains</H2>
      <Card accent={JADE}><CardText>{a.growthMeasures}</CardText></Card>
      {blends.length > 0 && (
        <>
          <H2>This archetype in combination</H2>
          <Body>
            Profiles are rarely pure — <Gold href="/archetypes/blending">most people blend</Gold>. This entry's
            documented mixtures:{" "}
            {blends.map(([x, y], i) => {
              const other = x === a.id ? y : x;
              const o = archById(other);
              return <span key={other}>{i > 0 ? " · " : ""}<Gold href={`/archetype-blend/${archBlendSlug(x, y)}`}>with {o?.name ?? other}</Gold></span>;
            })}.
          </Body>
        </>
      )}
      <H2>The sources</H2>
      {a.sources.map((s, i) => (
        <Card key={i} accent={MUTED}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", lineHeight: 1.6, color: MUTED, margin: "0 0 6px" }}>{s.cite}</p>
          <CardText>{s.finding}</CardText>
        </Card>
      ))}
    </>
  );

  const verify = (
    <>
      <Body>
        Honest framing first: reading a profile and feeling recognized is a HINT, not a measurement — the
        Barnum effect is real, and this platform runs a <Gold href="/myths">whole museum</Gold> on tests that
        exploited it. So here is the disciplined way to check yourself against {a.name}.
      </Body>
      <H2>The three-part check</H2>
      <Body>
        <b style={{ color: "#F1EADB" }}>One — the configuration test.</b> This profile is
        {a.highLines.length ? <> strong lines ({a.highLines.join(", ")}) carrying</> : <> a pattern operating</>}
        {a.lowLines.length ? <> over starved ones ({a.lowLines.join(", ")})</> : null}. Don't ask "does the
        description flatter me" — ask whether THAT specific shape matches the evidence of your life: what people
        route to you, and what keeps mysteriously failing.{" "}
        <b style={{ color: "#F1EADB" }}>Two — the trajectory test.</b> Re-read the documented untreated
        trajectory on the <Gold href={base}>main page</Gold>. Does it read like your last five years? The
        trajectory is harder to fake-recognize than the strengths.{" "}
        <b style={{ color: "#F1EADB" }}>Three — the witness test.</b> Show the profile to the two people who
        know you best, without saying which entry you picked. If they pick the same one from the{" "}
        <Gold href="/archetypes">chart</Gold>, that's three independent reads converging.
      </Body>
      <H2>Can you be this AND something else?</H2>
      <Body>
        Yes — probably. Pure single-archetype profiles are the exception; most real minds blend two, and
        sometimes three, configurations that share lines. The <Gold href="/archetypes/blending">blending
        page</Gold> covers what that means and how often; this entry's specific mixtures are linked from the
        main page.
      </Body>
      <H2>The real answer</H2>
      <Body>
        All three checks passed? Then you have a strong hypothesis — and a hypothesis is exactly what the{" "}
        <Gold href="/assessment">assessment</Gold> exists to test: 27 spoken questions, eight AI graders, all 32
        lines scored with confidence shown. Self-recognition starts the search; measurement ends it.
      </Body>
    </>
  );

  const breakout = (
    <>
      <Body>
        {a.kind === "integrated"
          ? `${a.name} is a destination, not a trap — this page is the route TOWARD it, drawn from the same cited library as everything else here.`
          : `No archetype is a life sentence — the research on this page's main entry says the starved lines are trainable, and this is the honest route out.`}
      </Body>
      <H2>The development case, from the record</H2>
      <Card accent={JADE}><CardText>{a.connectionCase}</CardText></Card>
      {a.lowLines.length > 0 && (
        <>
          <H2>The starved lines — and the cited tools for each</H2>
          {a.lowLines.map((l) => {
            const eng = engineName(l);
            const key = keystoneForLine(eng);
            const prot = THERAPY_LINE_MAP.filter((t) => t.line === eng).sort((x, y) => rank[x.role] - rank[y.role])[0];
            return (
              <Card key={l} accent={CHAMPAGNE}>
                <Label><LineChip name={l} /></Label>
                <CardText>
                  {key ? <>Keystone practice: <b style={{ color: "#F1EADB" }}>{key.name}</b> ({key.evidence.toLowerCase()} evidence, horizon {key.horizon}). </> : null}
                  {prot ? <>Primary protocol: <Gold href={`/protocol/${therapySlug(prot.therapy)}`}>{therapyDisplay(prot.therapy).split(" (")[0]}</Gold> — {prot.capacity}</> : "Mapped protocols for this capacity are indexed in the library."}
                </CardText>
              </Card>
            );
          })}
        </>
      )}
      <H2>What the numbers say about the climb</H2>
      <Card accent={JADE}><CardText>{a.growthMeasures}</CardText></Card>
      <H2>The sequencing rule</H2>
      <Body>
        Same as everywhere in the <Gold href="/protocols">library</Gold>: one primary protocol at a time, aimed
        at the most load-bearing starved line, with the keystone practice underneath and the 30-day feedback
        loop measuring whether it's working. Which starved line is most load-bearing for YOU — and whether this
        archetype is even your configuration — is what the <Gold href="/assessment">assessment</Gold> settles
        before you spend a season on it. And the destination has a name: the{" "}
        <Gold href="/archetypes/integrated">integrated archetypes</Gold> are what these same configurations look
        like developed.
      </Body>
    </>
  );

  return (
    <DeepFrame
      crumb={<><Gold href="/archetypes">The Archetypes</Gold>{" · "}{sub ? <><Gold href={base}>{a.name}</Gold>{" · "}{SUB_LABELS[sub]}</> : a.name}</>}
      h1={sub === "verify" ? `Are you ${a.name}?` : sub === "break-out" ? (a.kind === "integrated" ? `Becoming ${a.name}` : `Breaking out of ${a.name}`) : a.name}
      videoLabel={`${a.name}${sub ? ` — ${SUB_LABELS[sub]}` : ""}`}
    >
      <SiblingNav base={base} subs={["verify", "break-out"]} current={sub ?? ""} labels={SUB_LABELS} />
      {sub === "verify" ? verify : sub === "break-out" ? breakout : main}
      <DeepDisclosure text={`Archetype entries compose cited findings with our framework's configuration construals; sources and their honest limitations are printed on the main dossier.`} />
      <DeepCta heading={sub ? `Hypothesis formed. Now measure it.` : `Is this your configuration?`} body="Recognition is a hint. 27 spoken questions and eight AI graders turn it into a measured answer — all 32 lines, confidence shown." />
    </DeepFrame>
  );
}
