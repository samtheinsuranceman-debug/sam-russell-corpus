// ============================================================
// MYTH DEEP PAGES — /myth/:id/:sub (191 × 4 = 764 URLs):
// feels-real · receipts · instead · talk-someone-out.
// Composed from each exhibit's own data (claim, verdict, why,
// source, appeal) + its wing's psychology profile. Analysis is
// labeled as analysis; every factual verdict carries its source.
// ============================================================
import { useParams } from "wouter";
import { mythById, MYTH_VERDICT_META } from "@/lib/mythMuseum";
import { MYTH_WING, WING_PROFILES } from "@/lib/mythWings";
import { MYTH_SUBPAGES, type MythSubpageId } from "@shared/seo";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const SUB_LABELS: Record<MythSubpageId, string> = {
  "feels-real": "Why it feels real", receipts: "The receipts", instead: "What works instead", "talk-someone-out": "Talking someone out",
};

const H1S: Record<MythSubpageId, (n: string) => string> = {
  "feels-real": (n) => `Why ${n} feels so real`,
  receipts: (n) => `${n}: the receipts`,
  instead: (n) => `What actually works instead of ${n}`,
  "talk-someone-out": (n) => `How to talk someone you love out of ${n}`,
};

export default function MythDeep() {
  const params = useParams<{ id: string; sub: string }>();
  const m = mythById(params.id ?? "");
  const sub = (MYTH_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as MythSubpageId) : undefined;
  if (!m || !sub) return <NotFound />;
  const wingId = MYTH_WING[m.id];
  const wing = wingId ? WING_PROFILES[wingId] : undefined;
  const vmeta = MYTH_VERDICT_META[m.verdict];
  const verdictNice = m.verdict.charAt(0) + m.verdict.slice(1).toLowerCase();

  const sections: Record<MythSubpageId, React.ReactNode> = {
    "feels-real": (
      <>
        <Body>
          The verdict on {m.name} is {verdictNice.toLowerCase()} — the <Gold href={`/myth/${m.id}/receipts`}>receipts
          are one page over</Gold>. This page answers the harder question: why did it convince people anyway?
          Not fools. Smart people, sincere practitioners, maybe someone you love. The machinery below is
          standard-issue human equipment, and it's labeled as analysis — our read of the record.
        </Body>
        <H2>The specific seduction</H2>
        <Card accent={CHAMPAGNE}><CardText>{m.appeal}</CardText></Card>
        {wing && (
          <>
            <H2>The family pattern it belongs to</H2>
            <Body>
              {m.name} sits in the museum's <Gold href={`/wing/${wingId}`}>{wing.label}</Gold> wing, and the whole
              family runs one engine:
            </Body>
            <Card accent={EMBER}>
              <Label color={EMBER}>How the family claims to work</Label>
              <CardText>{wing.pattern}</CardText>
            </Card>
            <Card accent={EMBER}>
              <Label color={EMBER}>Why it feels like it works</Label>
              <CardText>{wing.seduction}</CardText>
            </Card>
            <Card accent={EMBER}>
              <Label color={EMBER}>The cultural hook — labeled analysis</Label>
              <CardText>{wing.hook}</CardText>
            </Card>
          </>
        )}
        <H2>The four machines under everything</H2>
        <Body>
          Across all 191 exhibits, the same four mechanisms do most of the convincing. <b>Regression to the mean:</b>{" "}
          people seek help at their worst, most states drift back toward baseline on their own, and whatever they were
          doing during the drift takes the credit. <b>The theater of effort:</b> rituals with steps and costs feel like
          they should work — effort feels like evidence, and isn't. <b>Testimonial economics:</b> the people it "worked"
          for talk forever; the people it failed go quietly. <b>Identity:</b> once you've paid for it and defended it at
          dinner, evidence against it feels like evidence against you — so the intelligent mind doesn't fold, it lawyers.
          Feeling those machines operate on you is trainable, and training it is the museum's whole purpose —{" "}
          <Gold href="/why-we-fall">the full essay is here</Gold>.
        </Body>
      </>
    ),
    receipts: (
      <>
        <Body>
          Museum rule: every wall label carries a receipt. Here is {m.name}'s — the claim as sold, the verdict, why it
          earned it, and a named source you can check without trusting us.
        </Body>
        <H2>The claim, as sold</H2>
        <Card accent={CHAMPAGNE}><CardText>{m.claim}</CardText></Card>
        <H2>The verdict</H2>
        <Card accent={vmeta?.color ?? EMBER}>
          <Label color={vmeta?.color ?? EMBER}>{m.verdict}</Label>
          <CardText>{vmeta?.note ?? ""}</CardText>
        </Card>
        <H2>Why it earned it</H2>
        <Card accent={EMBER}><CardText>{m.why}</CardText></Card>
        <H2>The named source</H2>
        <Card accent={JADE}>
          <CardText>{m.source}</CardText>
        </Card>
        <H2>The standard behind the verdict</H2>
        <Body>
          The bar is the same one we hold our own library to: controlled evidence, replication, and plausible mechanism —
          and a public <Gold href="/corrections">Corrections Ledger</Gold> for the day we get one wrong. A museum of other
          people's failed claims only earns trust if it's willing to hang its own. What the verdict is <b>not</b>: a claim
          that nobody ever felt better around {m.name} — people did, which is exactly what the{" "}
          <Gold href={`/myth/${m.id}/feels-real`}>feels-real page</Gold> explains without the product working.
        </Body>
      </>
    ),
    instead: (
      <>
        <Body>
          Tearing down without building is cheap. {m.name} attracted real people with real problems — the problem
          underneath the purchase was almost always legitimate. Here's where the evidence says that problem should
          actually be taken.
        </Body>
        <H2>The honest redirect</H2>
        {m.instead ? (
          <Card accent={JADE}>
            <Label color={JADE}>What holds up in this territory</Label>
            <CardText>{m.instead}</CardText>
          </Card>
        ) : (
          <Card accent={JADE}>
            <Label color={JADE}>Where the evidence points</Label>
            <CardText>
              No single protocol is the one-for-one replacement here — the honest answer is the library itself: 156
              interventions, each mapped to the specific capacity it builds, each carrying its peer-reviewed citation.
              Start from the problem, not the product.
            </CardText>
          </Card>
        )}
        <H2>How to route the underlying need</H2>
        <Body>
          The <Gold href="/protocols">protocol library</Gold> is organized by what each intervention actually builds —
          with the dose, the honest demands, and how long gains last. The <Gold href="/practices">54 keystone
          practices</Gold> cover the daily-habit layer. And if the need behind the purchase was clinical — real
          depression, real trauma, real crisis — the honest redirect is a licensed professional, not any website,
          including this one.
        </Body>
        <H2>The test any replacement must pass</H2>
        <Body>
          Before adopting anything in {m.name}'s place, run the museum's four questions: Is there controlled evidence,
          not testimony? Has it replicated? Is there a plausible mechanism? And does the seller tell you what it{" "}
          <b>doesn't</b> do? Everything in our library passes or it goes on the{" "}
          <Gold href="/corrections">Corrections Ledger</Gold> — the same standard that put {m.name} in the museum.
        </Body>
      </>
    ),
    "talk-someone-out": (
      <>
        <Body>
          Someone you care about believes in {m.name}. You have the receipts; they have a story. Go in armed with only
          the receipts and you will lose — not because you're wrong, but because belief defends identity, not data.
          Here's the sequence that actually works, adapted from what the persuasion literature keeps finding.
        </Body>
        <H2>Step one — don't open with the evidence</H2>
        <Body>
          Leading with "{verdictNice.toLowerCase()}" triggers the backfire: they've invested money, hope, and public
          statements, so your facts arrive as an attack on their judgment. Open with the problem instead — the thing
          that sent them to {m.name} in the first place was real. Say that first, and mean it.
        </Body>
        <H2>Step two — ask the calibration question</H2>
        <Body>
          The single most disarming question in the skeptic's toolkit: <b>"How would you know if it wasn't working?"</b>{" "}
          Not hostile, genuinely curious. Most believers have never been asked. The claim, as sold, was: "{m.claim}" —
          so what would failure look like? Let them sit with it. You're not planting doubt; you're lending them the
          measuring instrument.
        </Body>
        <H2>Step three — explain the feeling, not the fraud</H2>
        <Body>
          When they say "but it worked for me," don't argue the experience — explain its machinery, gently:{" "}
          {wing ? wing.seduction : "people seek help at their worst, most states drift back toward baseline on their own, and whatever they were doing during the drift takes the credit."}{" "}
          The magic sentence is "that would fool me too" — because it would, and saying so keeps their dignity intact.
        </Body>
        <H2>Step four — offer the receipts only when asked</H2>
        <Body>
          If the first three steps land, they'll ask what the evidence says. THEN hand them the{" "}
          <Gold href={`/myth/${m.id}/receipts`}>receipts page</Gold> — the verdict, and the named source: {m.source}.
          Let the source do the arguing; you stay the ally.
        </Body>
        <H2>Step five — never leave a vacuum</H2>
        <Body>
          A belief abandoned without a replacement grows back. Close with{" "}
          <Gold href={`/myth/${m.id}/instead`}>what actually works instead</Gold> — the real problem deserves a real
          protocol. And accept the honest limit: some people aren't ready, and pushing past that costs you the
          relationship without saving them the money. Leave the door open; the doubt you planted compounds quietly.
        </Body>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/myths">The Myth Museum</Gold>{" · "}<Gold href={`/myth/${m.id}`}>{m.name}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={H1S[sub](m.name)}
      videoLabel={`${m.name} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={`/myth/${m.id}`} subs={MYTH_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text={`Verdicts and findings on this page carry named sources; the psychology of belief is presented as analysis at the exhibit and wing level.`} />
      <DeepCta heading="Train the line this museum exercises." body="Spotting the machinery of false claims is a measurable intelligence. Find out where yours stands — along with the other 31 lines." />
    </DeepFrame>
  );
}
