// ============================================================
// GOAL DEEP PAGES — /goal/:keyword/:sub (96 × 2 = 192 URLs):
// plan · mistakes. Composed from the keystone practices whose
// goal keywords match — the same matching the goal engine runs.
// ============================================================
import { useParams } from "wouter";
import { goalFromSlug, goalSlug, GOAL_SUBPAGES, type GoalSubpageId } from "@shared/seo";
import { KEYSTONE_PRACTICES } from "@shared/keystonePractices";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const SUB_LABELS: Record<GoalSubpageId, string> = { plan: "The 30-day plan", mistakes: "The mistakes" };

export default function GoalDeep() {
  const params = useParams<{ g: string; sub: string }>();
  const goal = goalFromSlug(params.g ?? "");
  const sub = (GOAL_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as GoalSubpageId) : undefined;
  if (!goal || !sub) return <NotFound />;
  const cap = goal.charAt(0).toUpperCase() + goal.slice(1);
  const base = `/goal/${goalSlug(goal)}`;
  const tierRank = { Strong: 0, Moderate: 1, Emerging: 2 } as Record<string, number>;
  const matched = KEYSTONE_PRACTICES
    .filter((p) => (p.goalKeywords ?? []).includes(goal))
    .sort((a, b) => tierRank[a.evidence] - tierRank[b.evidence]);
  const first = matched[0], second = matched[1];

  const sections: Record<GoalSubpageId, React.ReactNode> = {
    plan: (
      <>
        <Body>
          "{cap}" is a goal; this page is a schedule. Thirty days, built from the {matched.length} evidence-matched
          keystone practice{matched.length === 1 ? "" : "s"} our engine maps to this goal — strongest evidence first,
          one habit installed at a time, measurement built in. Honest framing up front: this is the goal's
          general-purpose plan; the version matched to YOUR 32-line profile is what the{" "}
          <Gold href="/assessment">assessment</Gold> produces.
        </Body>
        <H2>Days 1–3 — take the baseline</H2>
        <Body>
          Write down where "{goal}" stands today in one measurable sentence — a number, a frequency, a concrete fact.
          Not "better" — a reading. Thirty days from now this sentence is the only honest judge of the plan.
        </Body>
        {first && (
          <>
            <H2>Days 1–14 — install the anchor practice</H2>
            <Card accent={JADE}>
              <Label color={JADE}>{first.name} · {first.evidence} evidence · horizon {first.horizon}</Label>
              <CardText>{first.prescription}</CardText>
            </Card>
            <Body>
              One practice, every day, minimum honest dose, bolted to a fixture in your day. Nothing else gets added
              until this survives two weeks — including one bad week.
            </Body>
          </>
        )}
        {second && (
          <>
            <H2>Days 15–30 — add the second layer</H2>
            <Card accent={CHAMPAGNE}>
              <Label>{second.name} · {second.evidence} evidence · horizon {second.horizon}</Label>
              <CardText>{second.prescription}</CardText>
            </Card>
          </>
        )}
        <H2>Day 30 — re-read the baseline</H2>
        <Body>
          Compare the day-one sentence to today's reading. Moved: keep the stack and let the horizons play out —
          most practice payoffs here run {first ? first.horizon.toLowerCase() : "weeks"}, so day 30 is a checkpoint,
          not a verdict. Didn't move: the plan gets rebuilt, not abandoned —{" "}
          {matched.length > 2 ? `the ${matched.length - 2} remaining matched practices are on the` : "the full list is on the"}{" "}
          <Gold href={base}>main {goal} page</Gold>, and the honest possibility is that "{goal}" is bottlenecked by a
          weak intelligence line no practice reaches — which is a <Gold href="/protocols">protocol</Gold> question,
          and a measurement question first.
        </Body>
      </>
    ),
    mistakes: (
      <>
        <Body>
          Goals in the "{goal}" territory fail in patterns — the same handful, decade after decade, motivation
          irrelevant. Here they are, so yours doesn't.
        </Body>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 1 — Starting with intensity instead of a baseline</Label>
          <CardText>Day one enthusiasm skips the measurement, and a goal without a baseline can't tell progress from mood. One measurable sentence before anything else — the <Gold href={`${base}/plan`}>30-day plan</Gold> opens with exactly this.</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 2 — Installing everything at once</Label>
          <CardText>{matched.length > 1 ? `There are ${matched.length} matched practices for this goal, and running all of them from day one produces one glorious Monday and an unrecoverable Thursday.` : "Even with one matched practice, stacking it on top of three other new habits kills them all."} One practice, two weeks, then the next. Boring is the feature.</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 3 — Judging inside the horizon</Label>
          <CardText>{first ? `The anchor practice here (${first.name}) pays on a "${first.horizon}" horizon.` : "Every practice here has a stated horizon."} Quitting at week two of a week-six effect is the single most common exit in the whole territory — decide the judging date on day one.</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 4 — Motivation as the plan</Label>
          <CardText>Motivation is weather. Anchors, if-then triggers, and a visible streak ledger are climate. Every practice page in the <Gold href="/practices">library</Gold> carries its installation instructions for exactly this reason.</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>Mistake 5 — Working the goal instead of the bottleneck</Label>
          <CardText>Sometimes "{goal}" isn't a habit problem — it's a weak intelligence line taxing everything the habits build. Disciplined effort aimed at the wrong layer is the expensive version of trying. The <Gold href="/weakness-finder">Master Weakness Finder</Gold> exists for exactly this diagnosis.</CardText>
        </Card>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/practices">Keystone Practices</Gold>{" · "}<Gold href={base}>{cap}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={sub === "plan" ? `${cap}: the 30-day plan` : `${cap}: the mistakes that sink it`}
      videoLabel={`${cap} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={GOAL_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text={`Plans compose the evidence-matched practices' own cited prescriptions; sequencing is library-level craft.`} />
      <DeepCta heading={`What's actually bottlenecking "${goal}" for you?`} body="A general plan beats no plan. A plan matched to your measured 32-line profile beats both." />
    </DeepFrame>
  );
}
