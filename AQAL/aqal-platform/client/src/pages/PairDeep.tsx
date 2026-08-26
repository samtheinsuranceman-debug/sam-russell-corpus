// ============================================================
// PAIR DEEP PAGES — /pair/:slug/:sub (496 × 3 = 1,488 URLs):
// collide · train · at-work. Composed from each line's own
// authored data: LINE_ROLE (what each line gives), LINE_MEANING
// (lived/others/cost), keystone practices, and mapped protocols
// — so every pair page is built from its two real halves.
// ============================================================
import { useParams } from "wouter";
import { pairFromSlug, pairSlug, lineSlug, PAIR_SUBPAGES, type PairSubpageId, therapySlug, therapyDisplay } from "@shared/seo";
import { LINE_ROLE } from "@/lib/linePairs";
import { LINE_MEANING } from "@/lib/lineMeaning";
import { keystoneForLine } from "@shared/keystonePractices";
import { THERAPY_LINE_MAP } from "@shared/therapyLineMap";
import { DeepFrame, SiblingNav, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

const DISPLAY_TO_ENGINE: Record<string, string> = {
  "Bodily-Kinesthetic": "Kinesthetic", "Naturalist": "Naturalistic",
  "Financial": "Financial-Self-Management", "Systemic": "Systematic",
  "Emotional": "Empathic", "Rhetorical": "Influence",
};
const engineName = (display: string) => DISPLAY_TO_ENGINE[display] ?? display;

const SUB_LABELS: Record<PairSubpageId, string> = {
  collide: "When they collide", train: "Training the pair", "at-work": "At work",
};
const H1S: Record<PairSubpageId, (a: string, b: string) => string> = {
  collide: (a, b) => `When ${a} and ${b} collide`,
  train: (a, b) => `Training ${a} and ${b} together`,
  "at-work": (a, b) => `${a} × ${b} at work`,
};

function protocolsFor(display: string, n: number) {
  const eng = engineName(display);
  const rank = { PRIMARY: 0, SECONDARY: 1, TERTIARY: 2 } as Record<string, number>;
  return THERAPY_LINE_MAP.filter((t) => t.line === eng)
    .sort((x, y) => rank[x.role] - rank[y.role]).slice(0, n);
}

export default function PairDeep() {
  const params = useParams<{ slug: string; sub: string }>();
  const pr = pairFromSlug(params.slug ?? "");
  const sub = (PAIR_SUBPAGES as readonly string[]).includes(params.sub ?? "") ? (params.sub as PairSubpageId) : undefined;
  if (!pr || !sub) return <NotFound />;
  const [a, b] = pr;
  const ra = LINE_ROLE[a], rb = LINE_ROLE[b];
  const ma = LINE_MEANING[a], mb = LINE_MEANING[b];
  if (!ra || !rb || !ma || !mb) return <NotFound />;
  const base = `/pair/${pairSlug(a, b)}`;

  const halfCard = (name: string, role: typeof ra, text: string, accent: string) => (
    <Card accent={accent}>
      <Label color={accent}>{name} — the {role.noun.toLowerCase()}</Label>
      <CardText>{text}</CardText>
    </Card>
  );

  const sections: Record<PairSubpageId, React.ReactNode> = {
    collide: (
      <>
        <Body>
          The <Gold href={base}>main pair page</Gold> covers what {a} × {b} unlocks when both lines run strong. This
          page covers the other configuration — the one most people actually live in: one line carrying, the other
          line quietly failing, and the carry disguising the failure.
        </Body>
        <H2>Strong {a}, weak {b}</H2>
        {halfCard(a, ra, `What the strong half keeps delivering: ${ra.gives}`, JADE)}
        <Card accent={EMBER}>
          <Label color={EMBER}>What the weak {b} half is costing meanwhile</Label>
          <CardText>{mb.cost}</CardText>
        </Card>
        <H2>Strong {b}, weak {a}</H2>
        {halfCard(b, rb, `What the strong half keeps delivering: ${rb.gives}`, JADE)}
        <Card accent={EMBER}>
          <Label color={EMBER}>What the weak {a} half is costing meanwhile</Label>
          <CardText>{ma.cost}</CardText>
        </Card>
        <H2>Why the imbalance hides</H2>
        <Body>
          A strong line is loud and a weak partner is quiet — the wins get attributed to talent and the losses get
          attributed to luck, timing, or other people. That's why strong-weak pairs stall careers at ninety percent:
          the engine revs, the wheels slip, and nobody checks the axle. The repair math is friendly, though: raising
          the weak partner one honest notch typically pays more than pushing the strong line further, because the
          strong line finally gets traction. The <Gold href={`${base}/train`}>training page</Gold> maps exactly that
          move — and which half is actually your weak one is a{" "}
          <Gold href="/assessment">measurement question</Gold>, not a feeling.
        </Body>
      </>
    ),
    train: (
      <>
        <Body>
          You don't train a pair by splitting your effort in half — you train the weaker partner until the stronger
          one gets traction, then alternate. Here is the honest toolkit for both halves of {a} × {b}, drawn from the
          same cited library as everything else on this site.
        </Body>
        {[{ n: a }, { n: b }].map(({ n }) => {
          const key = keystoneForLine(engineName(n));
          const prot = protocolsFor(n, 3);
          return (
            <div key={n}>
              <H2>Raising the {n} half</H2>
              {key && (
                <Card accent={JADE}>
                  <Label color={JADE}>The keystone practice — {key.name} ({key.evidence.toLowerCase()} evidence)</Label>
                  <CardText>{key.prescription}</CardText>
                </Card>
              )}
              {prot.map((p) => (
                <Card key={p.therapy} accent={CHAMPAGNE}>
                  <Label>{p.role} protocol</Label>
                  <CardText>
                    <Gold href={`/protocol/${therapySlug(p.therapy)}`}>{therapyDisplay(p.therapy).split(" (")[0]}</Gold>
                    {" — "}{p.capacity}
                  </CardText>
                </Card>
              ))}
            </div>
          );
        })}
        <H2>The sequencing rule</H2>
        <Body>
          One primary protocol at a time, aimed at the weaker half — never two primaries at once (the{" "}
          <Gold href="/protocols">library's standing rule</Gold>). Run the weaker line's protocol at full dose while
          the stronger line coasts on maintenance; when the gap closes a notch, swap. Which half is weaker — and by
          how much — is exactly what your <Gold href="/assessment">32-line profile</Gold> measures; guessing it wrong
          means a season of disciplined effort aimed at the wrong half.
        </Body>
      </>
    ),
    "at-work": (
      <>
        <Body>
          Every pairing has a native habitat — the rooms where its combination stops being abstract and starts being
          a paycheck. Here's where {a} × {b} earns, built from what each half actually contributes.
        </Body>
        <H2>What each half brings to the table</H2>
        <Card accent={JADE}>
          <Label color={JADE}>{a} — the {ra.noun.toLowerCase()}'s contribution</Label>
          <CardText>Native arena: {ra.arena}. What it hands the partner line: {ra.gives}</CardText>
        </Card>
        <Card accent={JADE}>
          <Label color={JADE}>{b} — the {rb.noun.toLowerCase()}'s contribution</Label>
          <CardText>Native arena: {rb.arena}. What it hands the partner line: {rb.gives}</CardText>
        </Card>
        <H2>The rooms where the pair compounds</H2>
        <Body>
          Put those two contributions in one head and you get someone valuable precisely where those arenas overlap —
          where {ra.arena.split(",")[0].trim()} meets {rb.arena.split(",")[0].trim()}. In our framework, that overlap
          is this pair's professional edge: the {ra.adj.toLowerCase()} {rb.noun.toLowerCase()}.
        </Body>
        <H2>How it reads to the people around you</H2>
        <Card accent={CHAMPAGNE}>
          <Label>{a}, from the outside</Label>
          <CardText>{ma.others}</CardText>
        </Card>
        <Card accent={CHAMPAGNE}>
          <Label>{b}, from the outside</Label>
          <CardText>{mb.others}</CardText>
        </Card>
        <H2>The honest caveat</H2>
        <Body>
          A pair page describes the configuration, not your configuration — whether YOU run this pair strong-strong
          or strong-weak changes everything on this page, including whether the edge above is real or aspirational.
          The <Gold href={`${base}/collide`}>collision page</Gold> shows the strong-weak version;{" "}
          <Gold href="/assessment">the assessment</Gold> shows which one you're living.
        </Body>
      </>
    ),
  };

  return (
    <DeepFrame
      crumb={<><Gold href="/pairs">Power Combinations</Gold>{" · "}<Gold href={base}>{a} × {b}</Gold>{" · "}{SUB_LABELS[sub]}</>}
      h1={H1S[sub](a, b)}
      videoLabel={`${a} × ${b} — ${SUB_LABELS[sub]}`}
    >
      <SiblingNav base={base} subs={PAIR_SUBPAGES} current={sub} labels={SUB_LABELS} />
      {sections[sub]}
      <DeepDisclosure text={`Pair dynamics are our framework's construal, composed from each line's cited research profile.`} />
      <DeepCta heading={`Which version of ${a} × ${b} are you running?`} body="Strong-strong, strong-weak, weak-weak — the same pair, three different lives. Measure all 32 lines and see your actual configuration." />
    </DeepFrame>
  );
}
