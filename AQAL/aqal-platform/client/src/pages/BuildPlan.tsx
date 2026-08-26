// ============================================================
// BUILD PLAN PAGES — /build/:line/:therapy/plan (223 URLs):
// the week-by-week working plan for building one capacity with
// one protocol — schedule from the scorecard, arc from the kind
// playbook, soil layer from the line's keystone practice.
// ============================================================
import { useParams } from "wouter";
import { engineLineFromSlug, engineLineSlug, therapyFromSlug, therapySlug, therapyDisplay } from "@shared/seo";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { scoreFor } from "@shared/therapyScores";
import { playbookFor } from "@/lib/protocolSubpages";
import { THERAPY_KIND } from "@shared/therapyKindMap";
import { keystoneForLine } from "@shared/keystonePractices";
import { DeepFrame, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

export default function BuildPlan() {
  const params = useParams<{ line: string; therapy: string }>();
  const line = engineLineFromSlug(params.line ?? "");
  const therapy = therapyFromSlug(params.therapy ?? "");
  if (!line || !therapy) return <NotFound />;
  const entry = THERAPY_LINE_MAP.find((t) => t.line === line && t.therapy === therapy);
  const sc = scoreFor(therapy);
  if (!entry || !sc) return <NotFound />;
  const display = therapyDisplay(therapy).split(" (")[0];
  const play = playbookFor(THERAPY_KIND[therapy] ?? "skill");
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
        one protocol ({display}), the schedule the literature actually ran, and the honest checkpoints.
      </Body>
      <H2>The target, precisely</H2>
      <Card accent={JADE}>
        <Label color={JADE}>{entry.role} mapping · {line}</Label>
        <CardText>{entry.capacity}</CardText>
      </Card>
      <H2>The operating schedule</H2>
      <Card accent={CHAMPAGNE}>
        <CardText>
          <b style={{ color: "#F1EADB" }}>{sc.schedule.minutes} minutes</b> per session ·{" "}
          <b style={{ color: "#F1EADB" }}>{sc.schedule.perWeek}</b> per week · course:{" "}
          <b style={{ color: "#F1EADB" }}>{sc.schedule.course}</b>
        </CardText>
      </Card>
      <Body>{sc.schedule.window}</Body>
      <H2>Week one, day by day</H2>
      {play.firstWeek.map((s) => (
        <Card key={s.day} accent={CHAMPAGNE}>
          <Label>{s.day}</Label>
          <CardText>{s.text}</CardText>
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
      {play.results.map((r) => (
        <Card key={r.stage} accent={JADE}>
          <Label color={JADE}>{r.stage}</Label>
          <CardText>{r.text}</CardText>
        </Card>
      ))}
      <H2>The two exits, defined in advance</H2>
      <Body>
        <b style={{ color: "#F1EADB" }}>Exit one — it worked:</b> at course end, shift to the maintenance dose
        ({sc.atrophy.maintenance.charAt(0).toLowerCase() + sc.atrophy.maintenance.slice(1)}) and let the{" "}
        <Gold href={`/protocol/${therapySlug(therapy)}/atrophy`}>decay curve</Gold> tell you what that protects.{" "}
        <b style={{ color: "#F1EADB" }}>Exit two — full dose, full course, no movement:</b> that's real data, not
        defeat — the <Gold href={`/protocol/${therapySlug(therapy)}/synergy`}>cross-mechanism alternatives</Gold>{" "}
        for {line} are mapped and cited. Likely gain if it lands: {sc.gainBand}
      </Body>
      <DeepDisclosure text={`The plan composes this protocol's scorecard schedule, its kind playbook, and the line's keystone practice.`} />
      <DeepCta heading={`Is ${line} actually your bottleneck?`} body="A season of disciplined building aimed at the wrong line is the expensive mistake. Measure all 32 first." />
    </DeepFrame>
  );
}
