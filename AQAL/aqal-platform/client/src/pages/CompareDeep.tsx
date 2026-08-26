// ============================================================
// COMPARE DEEP PAGES — /compare/:a--vs--:b/:sub (1,084 × 2 =
// 2,168 URLs): verdict · switch. Every judgment on these pages
// is COMPUTED from the two protocols' scorecards (roles, lines,
// kind profiles, schedules, decay curves) — same data, same
// formula, printed side by side. Estimates never guarantees.
// ============================================================
import { useParams } from "wouter";
import { compareFromSlug, compareSlug, therapySlug, therapyDisplay, COMPARE_SUBPAGES, type CompareSubpageId } from "@shared/seo";
import { THERAPY_KIND } from "@shared/therapyKindMap";
import { KIND_PROFILES } from "@/lib/therapyKinds";
import { scoreFor } from "@shared/therapyScores";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const SUB_LABELS: Record<CompareSubpageId, string> = { verdict: "The verdict", switch: "When to switch" };

export default function CompareDeep() {
  const params = useParams<{ slug: string; sub: string }>();
  const pair = compareFromSlug(params.slug ?? "");
  const sub = (COMPARE_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as CompareSubpageId) : undefined;
  if (!pair || !sub) return <NotFound />;
  const [na, nb] = pair;
  const sa = scoreFor(na), sb = scoreFor(nb);
  if (!sa || !sb) return <NotFound />;
  const [da, db] = [na, nb].map((n) => therapyDisplay(n).split(" (")[0]);
  const [ka, kb] = [THERAPY_KIND[na] ?? "skill", THERAPY_KIND[nb] ?? "skill"];
  const base = `/compare/${compareSlug(na, nb)}`;
  const higher = sa.total >= sb.total ? { s: sa, d: da, n: na } : { s: sb, d: db, n: nb };
  const lower = sa.total >= sb.total ? { s: sb, d: db, n: nb } : { s: sa, d: da, n: na };
  const close = Math.abs(sa.total - sb.total) < 3;

  // Component-level winners drive the "choose X if" logic.
  const edge = (get: (s: NonNullable<typeof sa>) => number) => {
    const va = get(sa), vb = get(sb);
    return va === vb ? null : va > vb ? da : db;
  };
  const edges = {
    durability: edge((s) => s.components.durability),
    speed: edge((s) => s.components.speed),
    ease: edge((s) => s.components.ease),
    breadth: edge((s) => s.components.breadth),
    evidence: edge((s) => s.components.evidence),
  };

  const scoreRow = (d: string, s: typeof sa, kind: string) => (
    <Card accent={s === higher.s ? JADE : CHAMPAGNE}>
      <Label color={s === higher.s ? JADE : CHAMPAGNE}>{d} — {s.total}/100 (rank {s.rank})</Label>
      <CardText>
        {KIND_PROFILES[kind]?.label ?? kind} · targets {s.primaryLines.length ? s.primaryLines.join(", ") : s.secondaryLines.join(", ")} ·
        {" "}{s.schedule.minutes} min, {s.schedule.perWeek}, {s.schedule.course}
      </CardText>
    </Card>
  );

  const sections: Record<CompareSubpageId, React.ReactNode> = {
    verdict: (
      <>
        <Body>
          The <Gold href={base}>main comparison</Gold> lays the two side by side; this page renders the verdict — not
          "which is better" in the abstract (that question is malformed), but which one is better <b>for whom</b>,
          computed from both scorecards with the same open formula.
        </Body>
        <H2>The scorecards</H2>
        {scoreRow(da, sa, ka)}
        {scoreRow(db, sb, kb)}
        <H2>The verdict, honestly framed</H2>
        <Body>
          {close
            ? `On the composite formula these two are effectively tied (${sa.total} vs ${sb.total}) — which means the deciding vote belongs entirely to fit: your profile, your calendar, your tolerance for what each demands.`
            : `${higher.d} scores higher (${higher.s.total} vs ${lower.s.total}), driven mostly by its component edges below — but a composite is a summary, not a sentence: the right answer still flips person to person on fit.`}
        </Body>
        <H2>Choose {da} if…</H2>
        <Card accent={JADE}>
          <CardText>
            {[
              edges.durability === da ? "you want the gains that hold longer after you stop" : null,
              edges.speed === da ? "you need the earlier first effect" : null,
              edges.ease === da ? "your calendar and energy budget are the binding constraint" : null,
              edges.breadth === da ? "you want more lines lifted per hour invested" : null,
              edges.evidence === da ? "you want the stronger evidence base behind you" : null,
              `your profile flags ${sa.primaryLines.length ? sa.primaryLines.join(" or ") : sa.secondaryLines.join(" or ")} as the line to move`,
            ].filter(Boolean).join("; ")}.
          </CardText>
        </Card>
        <H2>Choose {db} if…</H2>
        <Card accent={JADE}>
          <CardText>
            {[
              edges.durability === db ? "you want the gains that hold longer after you stop" : null,
              edges.speed === db ? "you need the earlier first effect" : null,
              edges.ease === db ? "your calendar and energy budget are the binding constraint" : null,
              edges.breadth === db ? "you want more lines lifted per hour invested" : null,
              edges.evidence === db ? "you want the stronger evidence base behind you" : null,
              `your profile flags ${sb.primaryLines.length ? sb.primaryLines.join(" or ") : sb.secondaryLines.join(" or ")} as the line to move`,
            ].filter(Boolean).join("; ")}.
          </CardText>
        </Card>
        <H2>The likely gains, stated as bands</H2>
        <Card accent={EMBER}>
          <Label color={EMBER}>{da}</Label>
          <CardText>{sa.gainBand}</CardText>
        </Card>
        <Card accent={EMBER}>
          <Label color={EMBER}>{db}</Label>
          <CardText>{sb.gainBand}</CardText>
        </Card>
        <Body>
          And the tiebreaker that outranks every row above: which of these targets YOUR weakest load-bearing line.
          That's not a comparison question — it's a <Gold href="/assessment">measurement question</Gold>.
        </Body>
      </>
    ),
    switch: (
      <>
        <Body>
          You ran one of these and it didn't move. Before switching to the other, this page — because switching too
          early wastes a working protocol, and switching too late wastes a season.
        </Body>
        <H2>First: was it a real trial?</H2>
        <Body>
          Non-response only counts as data if the trial was real. The checklist for whichever you ran:{" "}
          <b>full dose</b> ({da}: {sa.schedule.minutes} min, {sa.schedule.perWeek} · {db}: {sb.schedule.minutes} min,{" "}
          {sb.schedule.perWeek}), <b>full course</b> ({da}: {sa.schedule.course} · {db}: {sb.schedule.course}), and{" "}
          <b>the right measure</b> — the mapped capacity, not a mood. An incomplete trial's honest verdict is
          "unfinished," not "failed."
        </Body>
        <H2>When switching makes sense</H2>
        <Body>
          The completed-course, full-dose, no-movement case is exactly what the switch exists for — non-response to
          one method is not non-response to all of them, and these two{" "}
          {ka === kb
            ? "share a mechanism family, so a genuine non-response to one modestly lowers the odds on its sibling: consider a cross-mechanism alternative too (each protocol's synergy page lists them)."
            : "work through different mechanism families — which is what makes this switch rational: a wall in one mechanism says little about the other door."}
        </Body>
        <H2>How to run the switch</H2>
        <Card accent={JADE}>
          <CardText>
            One: close the first trial formally — write the three-line summary (dose run, course completed, what
            moved/didn't). Two: rest the target line for a week or two; back-to-back protocols on one line blur the
            reading. Three: start the successor at ITS full schedule ({higher.d}'s is {higher.s.schedule.minutes} min,{" "}
            {higher.s.schedule.perWeek}) with the same baseline measure, so the comparison is clean. Four: pre-commit
            the judging date from its course length — {higher.s.schedule.course}.
          </CardText>
        </Card>
        <H2>The case for stacking instead</H2>
        <Body>
          If the first protocol produced PARTIAL movement, switching may be the wrong call entirely — partial
          response usually argues for keeping the responder and adding a cross-mechanism support, not replacing it.
          {" "}The <Gold href={`/protocol/${therapySlug(higher.n)}/synergy`}>synergy pages</Gold> map those
          combinations, and two consecutive partial responders often beat one full switch.
        </Body>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/protocols">Protocol Library</Gold>{" · "}<Gold href={base}>{da} vs {db}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={sub === "verdict" ? `${da} vs ${db}: the verdict` : `${da} vs ${db}: when to switch`}
      videoLabel={`${da} vs ${db} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={COMPARE_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text={`Verdicts are computed from both protocols' scorecards by the library's open formula (evidence 40%, durability 20%, breadth 15%, speed 15%, ease 10%); gain bands are literature-typical effect-size language.`} />
      <DeepCta heading={`${da} or ${db}? Your profile already knows.`} body="The comparison narrows it to two. The measurement picks the one — by finding which line is actually yours to fix." />
    </DeepFrame>
  );
}
