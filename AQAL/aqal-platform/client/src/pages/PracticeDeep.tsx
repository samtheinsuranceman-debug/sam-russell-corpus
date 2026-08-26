// ============================================================
// PRACTICE DEEP PAGES — /practice/:id/:sub (54 × 4 = 216 URLs):
// start · evidence · mistakes · pair-with. Composed from each
// keystone practice's current data fields.
// ============================================================
import { useParams } from "wouter";
import { PRACTICE_SUBPAGES, type PracticeSubpageId, goalSlug, GOAL_KEYWORDS } from "@shared/seo";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const SUB_LABELS: Record<PracticeSubpageId, string> = {
  start: "Starting it", evidence: "The evidence", mistakes: "The mistakes", "pair-with": "Pair it with",
};
const H1S: Record<PracticeSubpageId, (name: string) => string> = {
  start: (name) => `Starting ${name} — the first two weeks`,
  evidence: (name) => `The evidence behind ${name}`,
  mistakes: (name) => `The mistakes that waste ${name}`,
  "pair-with": (name) => `What to pair with ${name}`,
};

const TIER_NOTE: Record<string, string> = {
  Strong: "Strong tier: multiple independent trials or meta-analytic support. This is as solid as behavioral-science evidence gets — which is still probabilistic, never a guarantee.",
  Moderate: "Moderate tier: real controlled evidence with some limitations — smaller samples, fewer replications, or effects that vary by population. Worth running; worth watching honestly.",
  Emerging: "Emerging tier: promising early evidence that hasn't accumulated replications yet. We include it because the mechanism is plausible and the cost is low — and we label it exactly this honestly.",
};

export default function PracticeDeep() {
  const params = useParams<{ id: string; sub: string }>();
  const practice = KEYSTONE_PRACTICES.find((entry) => entry.id === params.id);
  const sub = (PRACTICE_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as PracticeSubpageId) : undefined;
  if (!practice || !sub) return <NotFound />;
  const base = `/practice/${practice.id}`;
  const siblings = KEYSTONE_PRACTICES
    .filter((entry) => entry.id !== practice.id && entry.lifts.some((line) => practice.lifts.includes(line)))
    .slice(0, 5);
  const goals = (practice.goalKeywords ?? []).filter((goal) => GOAL_KEYWORDS.includes(goal)).slice(0, 6);

  const sections: Record<PracticeSubpageId, React.ReactNode> = {
    start: (
      <>
        <Body>
          A keystone practice lives or dies in its first two weeks — after that it's either furniture in your day or
          a memory. Here's how to install {practice.name} so it survives to its payoff horizon.
        </Body>
        <H2>The prescription, verbatim</H2>
        <Card accent={JADE}><CardText>{practice.prescription}</CardText></Card>
        <H2>Days 1–3 — anchor it</H2>
        <Body>
          Bolt it to something that already happens daily — after the coffee, before the commute, at the same desk.
          Practices scheduled for "when I have a moment" die by Thursday; practices bolted to fixtures survive.
          Decide the anchor now, write it as an if-then ("After X, I will {practice.name.toLowerCase()}"), and put the
          first week in your calendar.
        </Body>
        <H2>Days 4–14 — defend the floor, not the ceiling</H2>
        <Body>
          Run the minimum honest dose every day rather than the impressive dose some days. Keep a visible streak
          ledger. Miss once? Resume at the next slot — no make-ups, no penance; the trend line barely notices one
          miss, and it never recovers from quitting.
        </Body>
        <H2>The horizon to hold in mind</H2>
        <Body>
          This practice's honest payoff window is <b>{practice.horizon}</b> — commit to that window BEFORE you start,
          because the most common exit is week two of a week-{/\d/.test(practice.horizon) ? practice.horizon.match(/\d+/)?.[0] : "six"} effect.
          The <Gold href={`${base}/mistakes`}>mistakes page</Gold> covers the other exits.
        </Body>
      </>
    ),
    evidence: (
      <>
        <Body>
          Every practice in the keystone library carries an evidence tier and a research basis — stated plainly, so
          you know exactly how much weight the claim can bear. Here's {practice.name}'s.
        </Body>
        <H2>The headline finding</H2>
        <Card accent={JADE}><CardText>{practice.researchBasis}</CardText></Card>
        <H2>The tier, and what it honestly means</H2>
        <Card accent={practice.evidence === "Strong" ? JADE : practice.evidence === "Moderate" ? CHAMPAGNE : EMBER}>
          <Label color={practice.evidence === "Strong" ? JADE : practice.evidence === "Moderate" ? CHAMPAGNE : EMBER}>{practice.evidence} evidence</Label>
          <CardText>{TIER_NOTE[practice.evidence]}</CardText>
        </Card>
        <H2>What it's mapped to lift</H2>
        <Body>
          In our framework, {practice.name} bolsters: <b>{practice.lifts.join(", ")}</b>. Reading topic: {practice.librarySection}
          {" "}(Research Library §{practice.section}) — the <Gold href="/research">library shelf</Gold> this practice's literature lives on.
        </Body>
        <H2>What the evidence does not say</H2>
        <Body>
          No practice guarantees an outcome for an individual — tiers describe distributions, and you are one point
          in one. What the tier tells you is the honest bet: at this cost and this evidence level,
          the expected value justifies the run. When a claim in our library fails its audit, it lands on the public{" "}
          <Gold href="/corrections">Corrections Ledger</Gold> — this page plays by the same rule.
        </Body>
      </>
    ),
    mistakes: (
      <>
        <Body>
          Keystone practices are cheap to run and cheap to ruin. Across the whole library, the same five failure
          modes do almost all the damage — here they are, aimed at {practice.name}.
        </Body>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 1 — Quitting inside the horizon</Label>
          <CardText>This practice's honest window is {practice.horizon}. Quitting before the window closes isn't evidence it failed — it's an incomplete experiment billed as a result. Decide the end date on day one and judge nothing until it arrives.</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 2 — Dose creep after a good week</Label>
          <CardText>Doubling the dose in week two because week one felt great is how streaks break in week three. The prescription is the prescription: {practice.prescription.split(".")[0]}. Raise it only after the current dose survives a bad week.</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 3 — No trigger</Label>
          <CardText>A practice without an anchor is a daily negotiation, and you will eventually lose one. If-then it to a fixture in your day and remove the decision entirely — the implementation-intentions literature is the strongest in the whole library on exactly this move.</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 4 — Measuring feelings instead of behavior</Label>
          <CardText>The tracked variable is "did I run it," not "did today feel transformative." Effects at the {practice.evidence.toLowerCase()} tier arrive as trend lines, not lightning. Log the reps; let the trend do the judging.</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 5 — Running it as a substitute</Label>
          <CardText>Practices raise the soil; they don't do the surgery. If the underlying gap is a genuinely weak line — or a clinical matter — {practice.name} supports the real protocol, it doesn't replace it. The <Gold href="/protocols">protocol library</Gold> is the next room over.</CardText>
        </Card>
      </>
    ),
    "pair-with": (
      <>
        <Body>
          Practices compound when they share a target. {practice.name} is mapped to lift <b>{practice.lifts.join(", ")}</b> —
          here's what stacks cleanly with it.
        </Body>
        <H2>Practices that share its targets</H2>
        {siblings.length ? siblings.map((sibling) => (
          <Card key={sibling.id} accent={JADE}>
            <Label color={JADE}>{sibling.evidence} evidence · horizon {sibling.horizon}</Label>
            <CardText><Gold href={`/practice/${sibling.id}`}>{sibling.name}</Gold> — {sibling.prescription.split(".")[0]}.</CardText>
          </Card>
        )) : (
          <Body>No other keystone practice shares this one's exact targets — it holds its lane alone, which makes the protocol pairing below the real stack.</Body>
        )}
        <H2>The stacking rule</H2>
        <Body>
          One new practice at a time. Install {practice.name}, let it survive two honest weeks, then add ONE companion from
          the list above — never three at once. Practices are the soil layer; a full <Gold href="/protocols">protocol</Gold>
          aimed at your weakest line is the crop.
        </Body>
        {goals.length > 0 && (
          <>
            <H2>The goals this practice serves</H2>
            <Body>
              {practice.name} shows up in the evidence-matched plans for:{" "}
              {goals.map((goal, index) => (
                <span key={goal}>{index > 0 ? " · " : ""}<Gold href={`/goal/${goalSlug(goal)}`}>{goal}</Gold></span>
              ))}.
            </Body>
          </>
        )}
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/practices">Keystone Practices</Gold>{" · "}<Gold href={base}>{practice.name}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={H1S[sub](practice.name)}
      videoLabel={`${practice.name} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={PRACTICE_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text="Practice guidance composes this practice's own cited fields with library-level installation craft." />
      <DeepCta heading="Is this the practice your profile would prescribe?" body="54 practices, one map. Measure all 32 lines and get the plan matched to your actual weakest link." />
    </DeepFrame>
  );
}
