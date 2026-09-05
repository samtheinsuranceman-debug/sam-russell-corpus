// ============================================================
// KIND DEEP PAGES — /kind/:id/:sub (11 × 3 = 33 URLs):
// choose · first-month · standards. Composed from the kind's
// profile, its playbook, and the therapies classified into it.
// ============================================================
import { useParams } from "wouter";
import { KIND_IDS, KIND_SUBPAGES, type KindSubpageId, therapySlug, therapyDisplay } from "@shared/seo";
import { THERAPY_KIND } from "@shared/therapyKindMap";
import { KIND_PROFILES } from "@/lib/therapyKinds";
import { KIND_PLAYBOOKS } from "@/lib/protocolSubpages";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const SUB_LABELS: Record<KindSubpageId, string> = { choose: "Choosing one", "first-month": "The first month", standards: "The standards" };

export default function KindDeep() {
  const params = useParams<{ id: string; sub: string }>();
  const id = params.id ?? "";
  const sub = (KIND_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as KindSubpageId) : undefined;
  if (!KIND_IDS.includes(id) || !sub) return <NotFound />;
  const prof = KIND_PROFILES[id];
  const play = KIND_PLAYBOOKS[id];
  if (!prof || !play) return <NotFound />;
  const cap = id.charAt(0).toUpperCase() + id.slice(1);
  const base = `/kind/${id}`;
  const members = Object.entries(THERAPY_KIND).filter(([, kind]) => kind === id).map(([therapy]) => therapy).slice(0, 8);

  const sections: Record<KindSubpageId, React.ReactNode> = {
    choose: (
      <>
        <Body>
          The {prof.label.toLowerCase()} family holds {Object.values(THERAPY_KIND).filter((kind) => kind === id).length} protocols
          in our library. Choosing between siblings inside one kind comes down to three honest questions — here they
          are, with the family roster underneath.
        </Body>
        <H2>The three deciding questions</H2>
        <Body>
          <b>One — which line is it aimed at?</b> Same kind, different targets: each protocol below is mapped to
          specific intelligence lines with its own citations. Match the protocol's primary line to YOUR weakest
          load-bearing line, not to the protocol's fame. <b>Two — does the dose fit your life?</b> The family's
          literature-typical schedule is: {prof.dose} If that schedule can't survive your actual calendar, a protocol
          you can complete beats a stronger one you'll abandon. <b>Three — can you pay what it demands?</b>{" "}
          {prof.intensity}
        </Body>
        <H2>The family roster</H2>
        {members.map((therapy) => (
          <Card key={therapy} accent={CHAMPAGNE}>
            <CardText>
              <Gold href={`/protocol/${therapySlug(therapy)}`}>{therapyDisplay(therapy).split(" (")[0]}</Gold> — full page with
              mapped lines, citations, dose, and its seven deep pages.
            </CardText>
          </Card>
        ))}
        <Body>
          The complete roster lives on the <Gold href={base}>main {id} page</Gold> — and head-to-head choices between
          two specific protocols have their own <Gold href="/protocols">comparison pages</Gold>.
        </Body>
      </>
    ),
    "first-month": (
      <>
        <Body>
          Whatever protocol you pick from the {prof.label.toLowerCase()} family, the first month follows the family's
          shape. Here it is — week one day by day, then the honest early curve.
        </Body>
        <H2>The first week, day by day</H2>
        {play.firstWeek.map((step) => (
          <Card key={step.day} accent={CHAMPAGNE}>
            <Label>{step.day}</Label>
            <CardText>{step.text}</CardText>
          </Card>
        ))}
        <H2>What the rest of the month looks like</H2>
        <Card accent={JADE}>
          <Label color={JADE}>{play.results[0].stage}</Label>
          <CardText>{play.results[0].text}</CardText>
        </Card>
        <Card accent={JADE}>
          <Label color={JADE}>{play.results[1].stage}</Label>
          <CardText>{play.results[1].text}</CardText>
        </Card>
        <Body>
          The full timeline — including where the literature places the real gains — lives on each protocol's own
          results page. And the family's five classic failure modes are worth reading before week two, on any member
          protocol's mistakes page.
        </Body>
      </>
    ),
    standards: (
      <>
        <Body>
          Every kind in the library is held to the same evidential bar, but each kind's evidence has its own honest
          shape. Here's how to read claims in the {prof.label.toLowerCase()} family — including ours.
        </Body>
        <H2>What this kind honestly is</H2>
        <Card accent={CHAMPAGNE}><CardText>{prof.what}</CardText></Card>
        <H2>The durability line — where sites usually lie</H2>
        <Card accent={EMBER}><CardText>{prof.durability}</CardText></Card>
        <H2>The bar every claim must clear</H2>
        <Body>
          Peer-reviewed evidence mapped to a specific capacity, a named citation on the page, literature-typical
          doses stated plainly, and demands admitted up front ({prof.intensity.split("—")[0].trim().toLowerCase()}).
          When a mapping fails its external audit, it goes on the public{" "}
          <Gold href="/corrections">Corrections Ledger</Gold>. The same standard that fills the{" "}
          <Gold href="/myths">Myth Museum</Gold> polices this family — which is exactly why you can use it.
        </Body>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/protocols">Protocol Library</Gold>{" · "}<Gold href={base}>{prof.label}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={sub === "choose" ? `Choosing a ${id} protocol` : sub === "first-month" ? `Your first month of ${id} work` : `The evidence standards for ${id} protocols`}
      videoLabel={`${cap} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={KIND_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text="Kind-level characterizations are literature-typical for the family." />
      <DeepCta heading={`Which ${id} protocol is yours?`} body="The family's best member for you depends on your weakest line — a measurement, not a guess." />
    </DeepFrame>
  );
}
