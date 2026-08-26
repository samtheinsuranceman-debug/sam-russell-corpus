import { useParams } from "wouter";
import { compareFromSlug, compareSlug, therapySlug, therapyDisplay, COMPARE_SUBPAGES, type CompareSubpageId } from "@shared/seo";
import { THERAPY_KIND } from "@shared/therapyKindMap";
import { KIND_PROFILES } from "@/lib/therapyKinds";
import { scoreFor, type TherapyScore } from "@shared/therapyScores";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const SUB_LABELS: Record<CompareSubpageId, string> = { verdict: "The verdict", switch: "When to switch" };

export default function CompareDeep() {
  const params = useParams<{ slug: string; sub: string }>();
  const pair = compareFromSlug(params.slug ?? "");
  const sub = (COMPARE_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as CompareSubpageId) : undefined;
  if (!pair || !sub) return <NotFound />;
  const [nameA, nameB] = pair;
  const scoreA = scoreFor(nameA);
  const scoreB = scoreFor(nameB);
  if (!scoreA || !scoreB) return <NotFound />;
  const [displayA, displayB] = [nameA, nameB].map((name) => therapyDisplay(name).split(" (")[0]);
  const [kindA, kindB] = [THERAPY_KIND[nameA] ?? "skill", THERAPY_KIND[nameB] ?? "skill"];
  const base = `/compare/${compareSlug(nameA, nameB)}`;
  const higher = scoreA.total >= scoreB.total ? { score: scoreA, display: displayA, name: nameA } : { score: scoreB, display: displayB, name: nameB };
  const lower = scoreA.total >= scoreB.total ? { score: scoreB, display: displayB } : { score: scoreA, display: displayA };
  const close = Math.abs(scoreA.total - scoreB.total) < 3;

  const edge = (get: (score: TherapyScore) => number) => {
    const a = get(scoreA);
    const b = get(scoreB);
    return a === b ? null : a > b ? displayA : displayB;
  };
  const edges = {
    durability: edge((score) => score.components.durability),
    speed: edge((score) => score.components.speed),
    ease: edge((score) => score.components.ease),
    breadth: edge((score) => score.components.breadth),
    evidence: edge((score) => score.components.evidence),
  };

  const scoreRow = (display: string, score: TherapyScore, kind: string) => (
    <Card accent={score === higher.score ? JADE : CHAMPAGNE}>
      <Label color={score === higher.score ? JADE : CHAMPAGNE}>{display} — {score.total}/100 (rank {score.rank})</Label>
      <CardText>
        {KIND_PROFILES[kind]?.label ?? kind} · targets {score.primaryLines.length ? score.primaryLines.join(", ") : score.secondaryLines.join(", ")} ·{" "}
        {score.schedule.minutes} min, {score.schedule.perWeek}, {score.schedule.course}
      </CardText>
    </Card>
  );

  const sections: Record<CompareSubpageId, React.ReactNode> = {
    verdict: (
      <>
        <Body>
          The <Gold href={base}>main comparison</Gold> lays the two side by side; this page renders the editorial verdict — not
          which is universally better, but which mapped profile may fit which constraint under the same open formula.
        </Body>
        <H2>The scorecards</H2>
        {scoreRow(displayA, scoreA, kindA)}
        {scoreRow(displayB, scoreB, kindB)}
        <H2>The verdict, honestly framed</H2>
        <Body>
          {close
            ? `On the composite formula these two are effectively tied (${scoreA.total} vs ${scoreB.total}); fit, calendar, and burden decide more than the aggregate score.`
            : `${higher.display} scores higher (${higher.score.total} vs ${lower.score.total}) in this editorial model, but the right choice can still flip by person and target.`}
        </Body>
        <H2>Choose {displayA} if…</H2>
        <Card accent={JADE}><CardText>{[
          edges.durability === displayA ? "you value modeled durability" : null,
          edges.speed === displayA ? "you value modeled speed" : null,
          edges.ease === displayA ? "burden is the binding constraint" : null,
          edges.breadth === displayA ? "you value mapped breadth" : null,
          edges.evidence === displayA ? "you value the stronger mapped evidence component" : null,
          `your profile flags ${scoreA.primaryLines.length ? scoreA.primaryLines.join(" or ") : scoreA.secondaryLines.join(" or ")} as the target`,
        ].filter(Boolean).join("; ")}.</CardText></Card>
        <H2>Choose {displayB} if…</H2>
        <Card accent={JADE}><CardText>{[
          edges.durability === displayB ? "you value modeled durability" : null,
          edges.speed === displayB ? "you value modeled speed" : null,
          edges.ease === displayB ? "burden is the binding constraint" : null,
          edges.breadth === displayB ? "you value mapped breadth" : null,
          edges.evidence === displayB ? "you value the stronger mapped evidence component" : null,
          `your profile flags ${scoreB.primaryLines.length ? scoreB.primaryLines.join(" or ") : scoreB.secondaryLines.join(" or ")} as the target`,
        ].filter(Boolean).join("; ")}.</CardText></Card>
        <H2>The gain language, stated as bands</H2>
        <Card accent={EMBER}><Label color={EMBER}>{displayA}</Label><CardText>{scoreA.gainBand}</CardText></Card>
        <Card accent={EMBER}><Label color={EMBER}>{displayB}</Label><CardText>{scoreB.gainBand}</CardText></Card>
      </>
    ),
    switch: (
      <>
        <Body>Before switching, determine whether the first attempt was a real trial. Switching too early discards incomplete data; switching too late can waste a season.</Body>
        <H2>Was it a real trial?</H2>
        <Body>
          A useful comparison requires the represented dose ({displayA}: {scoreA.schedule.minutes}, {scoreA.schedule.perWeek} · {displayB}: {scoreB.schedule.minutes}, {scoreB.schedule.perWeek}),
          the represented course ({displayA}: {scoreA.schedule.course} · {displayB}: {scoreB.schedule.course}), and the mapped capacity as the measure. An incomplete attempt is unfinished, not failed.
        </Body>
        <H2>When switching may make sense</H2>
        <Body>
          A completed course with no movement is a reason to review fit with an appropriate professional. These two protocols{" "}
          {kindA === kindB
            ? "share a mechanism family, so a cross-mechanism alternative may deserve review too."
            : "use different modeled mechanism families, which is why the comparison may be informative."}
        </Body>
        <H2>Document the handoff</H2>
        <Card accent={JADE}><CardText>
          Record the dose attempted, course completed, target measure, changes observed, and adverse effects. Use that record with a qualified provider when the protocol is clinical. Do not stop prescribed care or start a replacement solely from this page.
        </CardText></Card>
        <H2>The case for stacking instead</H2>
        <Body>
          A partial response may support reviewing an adjunct rather than replacing the responder. The{" "}
          <Gold href={`/protocol/${therapySlug(higher.name)}/synergy`}>synergy page</Gold> shows the library's mapped cross-mechanism options; it is educational, not a personal prescription.
        </Body>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/protocols">Protocol Library</Gold>{" · "}<Gold href={base}>{displayA} vs {displayB}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={sub === "verdict" ? `${displayA} vs ${displayB}: the verdict` : `${displayA} vs ${displayB}: when to switch`}
      videoLabel={`${displayA} vs ${displayB} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={COMPARE_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text="The verdict is an editorial composite over mapped library data, not a clinical recommendation or outcome guarantee. Per-study citations remain on each protocol's evidence page." />
      <DeepCta heading={`${displayA} or ${displayB}? Your profile narrows the question.`} body="The comparison shows modeled tradeoffs. Measurement identifies the line; qualified care handles clinical decisions." />
    </DeepFrame>
  );
}
