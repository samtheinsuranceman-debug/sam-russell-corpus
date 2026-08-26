import { useParams } from "wouter";
import { engineLineFromSlug, engineLineSlug, therapyFromSlug, therapySlug, therapyDisplay } from "@shared/seo";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { scoreFor } from "@shared/therapyScores";
import { playbookFor } from "@/lib/protocolSubpages";
import { THERAPY_KIND } from "@shared/therapyKindMap";
import { keystoneForLine } from "@shared/keystonePractices";
import { DeepFrame, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

export default function BuildPlan() {
  const params = useParams<{ line: string; therapy: string }>();
  const line = engineLineFromSlug(params.line ?? "");
  const therapy = therapyFromSlug(params.therapy ?? "");
  if (!line || !therapy) return <NotFound />;
  const entry = THERAPY_LINE_MAP.find((candidate) => candidate.line === line && candidate.therapy === therapy);
  const score = scoreFor(therapy);
  if (!entry || !score) return <NotFound />;
  const display = therapyDisplay(therapy).split(" (")[0];
  const playbook = playbookFor(THERAPY_KIND[therapy] ?? "skill");
  const keystone = keystoneForLine(line);
  const base = `/build/${engineLineSlug(line)}/${therapySlug(therapy)}`;

  return (
    <DeepFrame
      crumb={<><Gold href="/protocols">Protocol Library</Gold>{" · "}<Gold href={base}>{display} for {line}</Gold>{" · "}The plan</>}
      h1={`The ${line}-building plan: ${display}, week by week`}
      videoLabel={`${display} for ${line} — The plan`}
    >
      <Body>
        The <Gold href={base}>overview page</Gold> makes the case; this one is the calendar. One capacity ({line}),
        one protocol ({display}), the schedule represented in the library's kind-level model, and explicit checkpoints.
      </Body>
      <H2>The target, precisely</H2>
      <Card accent={JADE}>
        <Label color={JADE}>{entry.role} mapping · {line}</Label>
        <CardText>{entry.capacity}</CardText>
      </Card>
      <H2>The operating schedule</H2>
      <Card accent={CHAMPAGNE}>
        <CardText>
          <b style={{ color: "#F1EADB" }}>{score.schedule.minutes} minutes</b> per session ·{" "}
          <b style={{ color: "#F1EADB" }}>{score.schedule.perWeek}</b> per week · course:{" "}
          <b style={{ color: "#F1EADB" }}>{score.schedule.course}</b>
        </CardText>
      </Card>
      <Body>{score.schedule.window}</Body>
      <H2>Week one, day by day</H2>
      {playbook.firstWeek.map((step) => (
        <Card key={step.day} accent={CHAMPAGNE}>
          <Label>{step.day}</Label>
          <CardText>{step.text}</CardText>
        </Card>
      ))}
      {keystone && (
        <>
          <H2>The soil layer — run this underneath</H2>
          <Card accent={JADE}>
            <Label color={JADE}>{keystone.name} · {keystone.evidence} evidence · horizon {keystone.horizon}</Label>
            <CardText>{keystone.prescription}</CardText>
          </Card>
        </>
      )}
      <H2>The checkpoints</H2>
      {playbook.results.map((result) => (
        <Card key={result.stage} accent={JADE}>
          <Label color={JADE}>{result.stage}</Label>
          <CardText>{result.text}</CardText>
        </Card>
      ))}
      <H2>The two exits, defined in advance</H2>
      <Body>
        <b style={{ color: "#F1EADB" }}>Exit one — it worked:</b> at course end, shift to the represented maintenance dose
        ({score.atrophy.maintenance.charAt(0).toLowerCase() + score.atrophy.maintenance.slice(1)}) and let the{" "}
        <Gold href={`/protocol/${therapySlug(therapy)}/atrophy`}>decay curve</Gold> show what that aims to protect.{" "}
        <b style={{ color: "#F1EADB" }}>Exit two — full dose, full course, no movement:</b> treat that as data, not defeat;
        the <Gold href={`/protocol/${therapySlug(therapy)}/synergy`}>cross-mechanism alternatives</Gold> for {line} are mapped.
        The displayed gain language is a literature-typical editorial estimate, never a personal forecast: {score.gainBand}
      </Body>
      <DeepDisclosure text="This plan composes the library's scorecard schedule, kind playbook, and line keystone. It is educational planning material, not individualized clinical direction." />
      <DeepCta heading={`Is ${line} actually your bottleneck?`} body="A season of disciplined building aimed at the wrong line is expensive. Measure all 32 first." />
    </DeepFrame>
  );
}
