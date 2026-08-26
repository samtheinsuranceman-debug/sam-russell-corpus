// ============================================================
// CAPACITY DEEP PAGES — /capacity/:slug/:sub (8 × 3 = 24 URLs):
// signs · build · cost. The eight engine-only capacities, each
// composed from its authored axis + the protocols mapped to it.
// ============================================================
import { useParams } from "wouter";
import { engineLineFromSlug, engineLineSlug, CAPACITY_ONLY_LINES, CAPACITY_SUBPAGES, type CapacitySubpageId, therapySlug, therapyDisplay } from "@shared/seo";
import { CAPACITY_AXES } from "@/lib/capacityAxes";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const SUB_LABELS: Record<CapacitySubpageId, string> = { signs: "The signs", build: "Building it", cost: "The cost" };

export default function CapacitySub() {
  const params = useParams<{ slug: string; sub: string }>();
  const line = engineLineFromSlug(params.slug ?? "");
  const sub = (CAPACITY_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as CapacitySubpageId) : undefined;
  if (!line || !CAPACITY_ONLY_LINES.includes(line) || !sub) return <NotFound />;
  const axis = CAPACITY_AXES[line];
  if (!axis) return <NotFound />;
  const base = `/capacity/${engineLineSlug(line)}`;
  const rank = { PRIMARY: 0, SECONDARY: 1, TERTIARY: 2 } as Record<string, number>;
  const protocols = THERAPY_LINE_MAP.filter((t) => t.line === line)
    .sort((x, y) => rank[x.role] - rank[y.role]).slice(0, 5);

  const sections: Record<CapacitySubpageId, React.ReactNode> = {
    signs: (
      <>
        <Body>
          {line} is one of the eight capacities our engine scores that no display test ever has — which means most
          people carrying it strong, or bleeding from it weak, have never had either fact named. Here are the signs,
          both directions.
        </Body>
        <H2>What it is</H2>
        <Card accent={CHAMPAGNE}><CardText>{axis.what}</CardText></Card>
        <H2>What strong looks like</H2>
        <Card accent={JADE}><CardText>{axis.strong}</CardText></Card>
        <H2>What weak looks like</H2>
        <Card accent={EMBER}><CardText>{axis.weak}</CardText></Card>
        <H2>Why you've never been told which one you are</H2>
        <Body>
          {axis.missed} Recognition on this page is a hint, not a reading — the engine scores this capacity from how
          you actually talk through the <Gold href="/assessment">27 questions</Gold>, where it can't be performed.
        </Body>
      </>
    ),
    build: (
      <>
        <Body>
          {line} responds to training — the library maps {protocols.length} protocol{protocols.length === 1 ? "" : "s"} to
          this capacity, each with its citation. Strongest mappings first.
        </Body>
        {protocols.map((p) => (
          <Card key={p.therapy} accent={p.role === "PRIMARY" ? JADE : CHAMPAGNE}>
            <Label color={p.role === "PRIMARY" ? JADE : CHAMPAGNE}>{p.role}</Label>
            <CardText>
              <Gold href={`/protocol/${therapySlug(p.therapy)}`}>{therapyDisplay(p.therapy).split(" (")[0]}</Gold>
              {" — "}{p.capacity}
            </CardText>
          </Card>
        ))}
        <H2>The sequencing rule</H2>
        <Body>
          Same as everywhere in the <Gold href="/protocols">library</Gold>: one primary protocol at full dose, the
          keystone-practice layer underneath, and a season of patience. Whether {line} is actually YOUR
          weakest-load-bearing capacity — and worth the season — is what the{" "}
          <Gold href="/assessment">assessment</Gold> settles before you spend it.
        </Body>
      </>
    ),
    cost: (
      <>
        <Body>
          An unmeasured weak capacity doesn't feel like a weakness — it feels like bad luck, difficult people, and
          plans that keep almost working. Here's what weak {line} actually costs, named.
        </Body>
        <H2>The tax, itemized</H2>
        <Card accent={EMBER}><CardText>{axis.weak}</CardText></Card>
        <H2>Why it stays invisible</H2>
        <Body>
          {axis.missed} Invisible taxes are the expensive kind — you can't negotiate a bill you've never seen. That's
          the entire argument for scoring it: not the number itself, but the moment the recurring pattern in your
          life gets a name and stops being fate.
        </Body>
        <H2>The counterfactual</H2>
        <Card accent={JADE}><CardText>{axis.strong}</CardText></Card>
        <Body>
          That's the same life with the capacity trained — the <Gold href={`${base}/build`}>building page</Gold> maps
          the cited route from one paragraph to the other.
        </Body>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/protocols">Protocol Library</Gold>{" · "}<Gold href={base}>The {line} Capacity</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={sub === "signs" ? `The signs of strong (and weak) ${line}` : sub === "build" ? `Building the ${line} capacity` : `What weak ${line} quietly costs`}
      videoLabel={`${line} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={CAPACITY_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text={`Capacity axes are our engine's authored scoring definitions; protocol mappings carry their citations on each protocol page.`} />
      <DeepCta heading={`Is ${line} your hidden bottleneck?`} body="Eight capacities, scored but never displayed by any conventional test. The assessment reads all of them." />
    </DeepFrame>
  );
}
