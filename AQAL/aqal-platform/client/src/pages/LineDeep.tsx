// ============================================================
// LINE DEEP PAGES — /line/:slug/:sub (32 × 6 = 192 URLs):
// at-work · in-relationships · history · raise-it · self-check
// · never-tested. Composed from LINE_MEANING, LINE_ENCYCLOPEDIA,
// LINE_ROLE, keystone practices, and the mapped protocols.
// ============================================================
import { useParams } from "wouter";
import { lineFromSlug, lineSlug, LINE_SUBPAGES, type LineSubpageId, therapySlug, therapyDisplay } from "@shared/seo";
import { LINE_MEANING } from "@/lib/lineMeaning";
import { LINE_ENCYCLOPEDIA } from "@/lib/lineEncyclopedia";
import { LINE_ROLE } from "@/lib/linePairs";
import { keystoneForLine } from "@shared/keystonePractices";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const DISPLAY_TO_ENGINE: Record<string, string> = {
  "Bodily-Kinesthetic": "Kinesthetic", "Naturalist": "Naturalistic",
  "Financial": "Financial-Self-Management", "Systemic": "Systematic",
  "Emotional": "Empathic", "Rhetorical": "Influence",
};
const engineName = (display: string) => DISPLAY_TO_ENGINE[display] ?? display;

const SUB_LABELS: Record<LineSubpageId, string> = {
  "at-work": "At work", "in-relationships": "In relationships", history: "The history",
  "raise-it": "Raising it", "self-check": "Self-check", "never-tested": "Never tested",
};
const H1S: Record<LineSubpageId, (n: string) => string> = {
  "at-work": (n) => `${n} intelligence at work`,
  "in-relationships": (n) => `${n} intelligence in your relationships`,
  history: (n) => `The history of ${n} intelligence`,
  "raise-it": (n) => `How to raise your ${n} line`,
  "self-check": (n) => `The honest ${n} self-check`,
  "never-tested": (n) => `Why your ${n} line was never tested`,
};

export default function LineDeep() {
  const params = useParams<{ slug: string; sub: string }>();
  const name = lineFromSlug(params.slug ?? "");
  const sub = (LINE_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as LineSubpageId) : undefined;
  if (!name || !sub) return <NotFound />;
  const m = LINE_MEANING[name];
  const e = LINE_ENCYCLOPEDIA[name];
  const role = LINE_ROLE[name];
  if (!m || !e || !role) return <NotFound />;
  const base = `/line/${lineSlug(name)}`;
  const eng = engineName(name);
  const keystone = keystoneForLine(eng);
  const rank = { PRIMARY: 0, SECONDARY: 1, TERTIARY: 2 } as Record<string, number>;
  const protocols = THERAPY_LINE_MAP.filter((t) => t.line === eng)
    .sort((x, y) => rank[x.role] - rank[y.role]).slice(0, 4);

  const sections: Record<LineSubpageId, React.ReactNode> = {
    "at-work": (
      <>
        <Body>
          Every line has a native arena — the rooms where it stops being a personality trait and starts being the
          reason you get paid, promoted, or routed around. Here's {name}'s.
        </Body>
        <H2>The native arena</H2>
        <Card accent={JADE}>
          <Label color={JADE}>{name} — the {role.noun.toLowerCase()}</Label>
          <CardText>Where it earns: {role.arena}. What it contributes to everything it touches: {role.gives}</CardText>
        </Card>
        <H2>The career read</H2>
        <Body>
          In our framework, a strong {name} line is the {role.adj.toLowerCase()} edge — the person a team quietly
          routes {role.arena.split(",")[0].trim()} problems to, whether or not the org chart says so. If that routing
          keeps happening to you, that's field evidence of the line. If you keep routing those problems AWAY, read on.
        </Body>
        <H2>What the weak version costs professionally</H2>
        <Card accent={EMBER}><CardText>{m.cost}</CardText></Card>
        <H2>The pairing move</H2>
        <Body>
          Lines compound at work — {name} multiplied by the right partner line is worth more than either doubled.
          The <Gold href="/pairs">pairs library</Gold> maps all 31 of {name}'s pairings, each with what the
          combination unlocks and what half a pair quietly costs. Where you actually stand on this line — and which
          partner line you should be pairing it with — is the <Gold href="/assessment">assessment's</Gold> job.
        </Body>
      </>
    ),
    "in-relationships": (
      <>
        <Body>
          Intelligence lines don't stay at the office. {name} shapes how you love, fight, parent, and show up —
          usually without anyone in the house having a name for what they're experiencing. Here's that name.
        </Body>
        <H2>What the people around you experience</H2>
        <Card accent={CHAMPAGNE}><CardText>{m.others}</CardText></Card>
        <H2>Two people you may recognize at your own table</H2>
        <Card accent={JADE}>
          <Label color={JADE}>{m.personas[0].tag}</Label>
          <CardText>{m.personas[0].text}</CardText>
        </Card>
        <Card accent={JADE}>
          <Label color={JADE}>{m.personas[1].tag}</Label>
          <CardText>{m.personas[1].text}</CardText>
        </Card>
        <H2>The couple move</H2>
        <Body>
          The highest-leverage use of this page is reading it next to someone you love and asking which of you is
          carrying this line — because most couples run complementary maps and have spent years misreading the
          difference as a character flaw. Taking the <Gold href="/assessment">assessment</Gold> together and comparing
          all 32 lines is, members keep telling us, the best conversation they've had in years. If the line's gap is
          causing real damage, the <Gold href="/protocols">library's relational protocols</Gold> are the cited route.
        </Body>
      </>
    ),
    history: (
      <>
        <Body>
          Every line on this site has a paper trail — when the field first named it, who fought for it, and how long
          it took the testing industry to ignore it anyway. Here's {name}'s.
        </Body>
        <H2>When it entered the map</H2>
        <Card accent={CHAMPAGNE}><CardText>{m.history}</CardText></Card>
        <H2>The researchers behind it</H2>
        {e.researchers.map((r) => (
          <Card key={r.name} accent={JADE}>
            <Label color={JADE}>{r.name}</Label>
            <CardText>{r.note}</CardText>
          </Card>
        ))}
        <H2>How it's measured — and how rarely</H2>
        <Body>
          {e.measurement} {e.everTested} That gap — a line with real research behind it that almost nobody has ever
          been scored on — is the whole reason <Gold href={`${base}/never-tested`}>the never-tested page</Gold> exists,
          and the whole reason this platform does.
        </Body>
      </>
    ),
    "raise-it": (
      <>
        <Body>
          {name} is trainable — not infinitely, not overnight, but the cited library holds real protocols mapped to
          this line with real evidence behind each. Here's the honest toolkit, cheapest first.
        </Body>
        {keystone && (
          <>
            <H2>Start here — the keystone practice</H2>
            <Card accent={JADE}>
              <Label color={JADE}>{keystone.name} · {keystone.evidence} evidence · horizon: {keystone.horizon}</Label>
              <CardText>{keystone.prescription}</CardText>
            </Card>
          </>
        )}
        <H2>The mapped protocols</H2>
        {protocols.map((p) => (
          <Card key={p.therapy} accent={p.role === "PRIMARY" ? JADE : CHAMPAGNE}>
            <Label color={p.role === "PRIMARY" ? JADE : CHAMPAGNE}>{p.role}</Label>
            <CardText>
              <Gold href={`/protocol/${therapySlug(p.therapy)}`}>{therapyDisplay(p.therapy).split(" (")[0]}</Gold>
              {" — "}{p.capacity}
            </CardText>
          </Card>
        ))}
        <H2>What raising it buys</H2>
        <Body>{e.benefit}</Body>
        <Body>
          The sequencing rule from the <Gold href="/protocols">library</Gold> applies here: one primary protocol at a
          time, at full dose, with the keystone practice underneath it. And before spending a season on this line,
          confirm it's actually your weakest load-bearing one — <Gold href="/weakness-finder">the Master Weakness
          Finder</Gold> exists because disciplined effort aimed at the wrong line is the most expensive mistake in
          self-development.
        </Body>
      </>
    ),
    "self-check": (
      <>
        <Body>
          This is not a measurement — let's be honest about that up front. It's a structured mirror: the lived
          experience of a strong {name} line, and the questions that tell you whether you recognize it. The
          measurement is 27 spoken questions away.
        </Body>
        <H2>The inside experience of the strong version</H2>
        <Card accent={JADE}><CardText>{m.lived}</CardText></Card>
        <H2>Five honest questions</H2>
        <Body>
          Read these slowly. <b>One:</b> do people repeatedly bring you {role.arena.split(",")[0].trim()} problems
          without being asked? Routing is field evidence. <b>Two:</b> when you read the strong-version description
          above, did it feel like a description of you — or an aspiration? Those feel different, and you know which
          one you felt. <b>Three:</b> in the last month, name one concrete outcome this line produced. Strong lines
          leave receipts. <b>Four:</b> would the three people who know you best say this is your line? (Asking them is
          the cheapest audit available.) <b>Five:</b> have you ever been formally scored on it? {e.everTested}
        </Body>
        <H2>What the mirror can't do</H2>
        <Body>
          Self-report on your own intelligence lines runs into the oldest problem in psychometrics: the skill you'd
          need to judge accurately is often the skill being judged. That's not an insult — it's the reason
          instruments exist. The <Gold href="/assessment">assessment</Gold> scores this line from how you actually
          talk through 27 real questions, cross-checked by a panel of eight AI systems — with a confidence rating we
          show you honestly.
        </Body>
      </>
    ),
    "never-tested": (
      <>
        <Body>
          Here's a number to sit with: out of a thousand adults, our estimate is that about {e.testedOdds} have EVER
          been formally tested on the {name} line. Presented as an estimate, built from testing-industry reach —
          school, military, corporate, clinical — not a survey. This page explains the gap.
        </Body>
        <H2>Why the tests skipped it</H2>
        <Body>{e.measurement} {e.everTested}</Body>
        <H2>The IQ blind spot, precisely</H2>
        <Card accent={CHAMPAGNE}><CardText>{e.gNote}</CardText></Card>
        <Body>
          Translation: your IQ score — whatever it was — carried little to no information about this line. Not
          because IQ is fake, but because it measures a different slice. A sorting system that graded you at
          seventeen on four lines never looked here.
        </Body>
        <H2>What never measuring it has been costing</H2>
        <Card accent={EMBER}><CardText>{m.cost}</CardText></Card>
        <H2>What measuring it would change</H2>
        <Body>{m.forYou}</Body>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/lines">The 32 Lines</Gold>{" · "}<Gold href={base}>{name}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={H1S[sub](name)}
      videoLabel={`${name} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={LINE_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text={`Line profiles compose the cited research record with our framework's construals, and tested-rate figures are labeled estimates.`} />
      <DeepCta heading={`Where does your ${name} line actually stand?`} body="Recognition is not measurement. 27 spoken questions, eight AI graders, all 32 lines — including this one." />
    </DeepFrame>
  );
}
