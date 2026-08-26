// ============================================================
// WING DEEP PAGES — /wing/:id/:sub (12 × 2 = 24 URLs):
// spot · escape. Composed from the wing's psychology profile
// and its member exhibits.
// ============================================================
import { useParams } from "wouter";
import { WING_IDS, WING_SUBPAGES, type WingSubpageId } from "@shared/seo";
import { WING_PROFILES, MYTH_WING } from "@/lib/mythWings";
import { MYTHS } from "@/lib/mythMuseum";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const SUB_LABELS: Record<WingSubpageId, string> = { spot: "Spotting the pattern", escape: "Getting out" };

export default function WingDeep() {
  const params = useParams<{ id: string; sub: string }>();
  const id = params.id ?? "";
  const sub = (WING_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as WingSubpageId) : undefined;
  const wing = WING_PROFILES[id];
  if (!WING_IDS.includes(id) || !wing || !sub) return <NotFound />;
  const base = `/wing/${id}`;
  const members = MYTHS.filter((m) => MYTH_WING[m.id] === id).slice(0, 6);
  // Wing labels are long gallery titles ("The Gadget Gallery — Energy
  // Fields, Frequencies & Devices"); headlines use the short half.
  const shortLabel = wing.label.split("—")[0].trim();
  const family = shortLabel.replace(/^the\s+/i, "").toLowerCase();

  const sections: Record<WingSubpageId, React.ReactNode> = {
    spot: (
      <>
        <Body>
          The {family} family keeps reinventing itself under new names — the exhibits change, the
          machinery doesn't. Learn the machinery once and you'll recognize the next rebrand before it reaches your
          wallet.
        </Body>
        <H2>How the family claims to work</H2>
        <Card accent={CHAMPAGNE}><CardText>{wing.pattern}</CardText></Card>
        <H2>The tell-tale signs</H2>
        <Card accent={EMBER}>
          <Label color={EMBER}>Red flags that mark the family</Label>
          <CardText>{wing.tell}</CardText>
        </Card>
        <H2>The field test</H2>
        <Body>
          When you meet a new product that smells like this wing, run four questions: Is there controlled evidence,
          not testimony? Has it replicated? Is there a plausible mechanism? Does the seller say what it{" "}
          <b>doesn't</b> do? The family's members fail at least three of four — every documented case is in{" "}
          <Gold href={base}>the wing</Gold>.
        </Body>
        <H2>Documented members</H2>
        {members.map((m) => (
          <Card key={m.id} accent={EMBER}>
            <CardText>
              <Gold href={`/myth/${m.id}`}>{m.name}</Gold> — {m.verdict.toLowerCase()};{" "}
              <Gold href={`/myth/${m.id}/receipts`}>receipts here</Gold>.
            </CardText>
          </Card>
        ))}
      </>
    ),
    escape: (
      <>
        <Body>
          Getting out of a {family} commitment is harder than avoiding one — because by the time
          you're questioning it, you've invested money, identity, and public statements. This page is the exit ramp,
          built for yourself or for <Gold href="/myths">someone you love</Gold>.
        </Body>
        <H2>Name the grip honestly</H2>
        <Card accent={CHAMPAGNE}>
          <Label>Why it feels like it works — the honest psychology</Label>
          <CardText>{wing.seduction}</CardText>
        </Card>
        <Body>
          That machinery working on you is not a verdict on your intelligence — it's standard-issue human equipment,
          and the exit begins the moment you can feel it operating. "That would fool me too" is the sentence that
          opens the door.
        </Body>
        <H2>The exit sequence</H2>
        <Body>
          <b>One — run the calibration question on yourself:</b> "How would I know if this wasn't working?" Write the
          answer down before the next purchase. <b>Two — check the receipts:</b> every member exhibit carries a named
          source — read the one for yours. <b>Three — price the real need:</b> the problem that sent you here was
          legitimate; the product just doesn't treat it. <b>Four — replace, don't just quit:</b> a belief abandoned
          without a replacement grows back. Every exhibit's{" "}
          <Gold href="/protocols">what-works-instead page</Gold> routes the underlying need to the cited library —
          and if the need is clinical, to a licensed professional.
        </Body>
        <H2>The cultural pull you're swimming against</H2>
        <Card accent={EMBER}>
          <Label color={EMBER}>The hook — labeled analysis</Label>
          <CardText>{wing.hook}</CardText>
        </Card>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/myths">The Myth Museum</Gold>{" · "}<Gold href={base}>{shortLabel}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={sub === "spot" ? `How to spot the ${family} pattern` : `Getting out of the ${family} trap`}
      videoLabel={`${shortLabel} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={WING_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text={`Family verdicts carry named sources on each exhibit; the psychology and cultural analysis are labeled as analysis.`} />
      <DeepCta heading="Immunity to this wing is a trainable line." body="Spotting manipulation is one of the 32 intelligences we measure. Find out where yours stands." />
    </DeepFrame>
  );
}
