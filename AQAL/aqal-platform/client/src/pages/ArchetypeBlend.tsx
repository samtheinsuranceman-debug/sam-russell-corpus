// ============================================================
// ARCHETYPE BLEND PAGES — /archetype-blend/:a--x--:b (1,272
// URLs): every meaningful pairing among the 100 real profiles.
// The blend analysis is COMPUTED from the two entries' line
// configurations: shared strong lines amplify, high-over-low
// crossings create the blend's internal tension. Frequency
// claims are handled honestly: no population data exists yet.
// ============================================================
import { useParams } from "wouter";
import { archBlendFromSlug, archById, archBlendSlug, lineSlug, LINE_NAMES, engineLineSlug, CAPACITY_ONLY_LINES } from "@shared/seo";
import { DeepFrame, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

function LineChip({ name }: { name: string }) {
  if (LINE_NAMES.includes(name)) return <Gold href={`/line/${lineSlug(name)}`}>{name}</Gold>;
  if (CAPACITY_ONLY_LINES.includes(name)) return <Gold href={`/capacity/${engineLineSlug(name)}`}>{name}</Gold>;
  return <span style={{ color: "#F1EADB" }}>{name}</span>;
}

export default function ArchetypeBlend() {
  const params = useParams<{ slug: string }>();
  const pair = archBlendFromSlug(params.slug ?? "");
  if (!pair) return <NotFound />;
  const a = archById(pair[0]);
  const b = archById(pair[1]);
  if (!a || !b) return <NotFound />;

  const sharedHigh = a.highLines.filter((l) => b.highLines.includes(l));
  const aOverB = a.highLines.filter((l) => b.lowLines.includes(l));
  const bOverA = b.highLines.filter((l) => a.lowLines.includes(l));
  const sharedLow = a.lowLines.filter((l) => b.lowLines.includes(l));
  const bothIntegrated = a.kind === "integrated" && b.kind === "integrated";
  const mixed = (a.kind === "integrated") !== (b.kind === "integrated");

  return (
    <DeepFrame
      crumb={<><Gold href="/archetypes">The Archetypes</Gold>{" · "}<Gold href="/archetypes/blending">Blends</Gold>{" · "}{a.name} × {b.name}</>}
      h1={`The blend: ${a.name} × ${b.name}`}
      videoLabel={`Blend — ${a.name} × ${b.name}`}
    >
      <Body>
        Can one person be both <Gold href={`/archetype/${a.id}`}>{a.name}</Gold> and{" "}
        <Gold href={`/archetype/${b.id}`}>{b.name}</Gold>? Yes — archetypes are configurations of the same 32
        lines, and configurations overlap. This page is the computed anatomy of that particular mixture.
      </Body>
      <H2>The two configurations</H2>
      <Card accent={a.kind === "integrated" ? JADE : CHAMPAGNE}>
        <Label color={a.kind === "integrated" ? JADE : CHAMPAGNE}>{a.name}{a.kind === "integrated" ? " · positive" : ""}</Label>
        <CardText>{a.pattern}</CardText>
      </Card>
      <Card accent={b.kind === "integrated" ? JADE : CHAMPAGNE}>
        <Label color={b.kind === "integrated" ? JADE : CHAMPAGNE}>{b.name}{b.kind === "integrated" ? " · positive" : ""}</Label>
        <CardText>{b.pattern}</CardText>
      </Card>
      <H2>Where the blend amplifies</H2>
      <Body>
        {sharedHigh.length > 0 ? (
          <>Both configurations run hot on{" "}
            {sharedHigh.map((l, i) => <span key={l}>{i > 0 ? ", " : ""}<LineChip name={l} /></span>)} — in a
            blended profile that shared engine gets double duty and double reinforcement: whichever archetype is
            "driving" on a given day, the same strong machinery powers it. That's the blend's signature talent, and
            usually the first thing other people notice.</>
        ) : (
          <>These two share no hot line — this blend's connection runs through the crossings below, which makes it
            rarer-shaped and more internally contrasted than most: two different engines in one chassis.</>
        )}
      </Body>
      {(aOverB.length > 0 || bOverA.length > 0) && (
        <>
          <H2>Where the blend argues with itself</H2>
          <Card accent={EMBER}>
            <CardText>
              {aOverB.length > 0 && <>{a.name}'s strength in{" "}
                {aOverB.map((l, i) => <span key={l}>{i > 0 ? ", " : ""}<LineChip name={l} /></span>)} sits exactly
                where {b.name} runs starved — so in a blended profile, one half of you compensates for the other,
                and under stress the starved half usually wins the argument. </>}
              {bOverA.length > 0 && <>{b.name}'s strength in{" "}
                {bOverA.map((l, i) => <span key={l}>{i > 0 ? ", " : ""}<LineChip name={l} /></span>)} covers{" "}
                {a.name}'s starved ground the same way — a built-in rescue that works until it's exhausted.</>}
              {" "}This internal tension is the blend's tell: people who carry it describe feeling like two
              different operators share the controls.
            </CardText>
          </Card>
        </>
      )}
      {sharedLow.length > 0 && (
        <>
          <H2>The compounded blind spot</H2>
          <Card accent={EMBER}>
            <CardText>
              Both configurations starve{" "}
              {sharedLow.map((l, i) => <span key={l}>{i > 0 ? ", " : ""}<LineChip name={l} /></span>)} — which
              means the blend has NO internal rescue there. A doubly-starved line is the closest thing a blend has
              to a guaranteed Power Weakness, and it's where the break-out work should almost certainly start:{" "}
              <Gold href={`/archetype/${a.id}/break-out`}>route one</Gold> ·{" "}
              <Gold href={`/archetype/${b.id}/break-out`}>route two</Gold>.
            </CardText>
          </Card>
        </>
      )}
      <H2>How often does this blend occur?</H2>
      <Body>
        Honest answer: nobody knows yet — including us. No population has ever been measured on all 32 lines, so
        no real base rates exist for any archetype blend, and any site that quotes you one is inventing it. What
        the configuration math says: blends sharing strong lines (like{" "}
        {sharedHigh.length > 0 ? "this one" : "many on the blending index"}) should be common, and triple blends —
        yes, <Gold href="/archetypes/blending">three at once is possible</Gold> — proportionally rarer. Once the
        founding cohort is scored, we'll publish the real distribution, on this page, with the numbers we actually
        measured. That's the deal.
      </Body>
      {bothIntegrated && (
        <Body>
          One more thing: both halves of this blend are <Gold href="/archetypes/integrated">integrated
          archetypes</Gold> — this is a compound POSITIVE, a description of a genuinely developed mind. If the
          verify checks point here, the work is maintenance and deployment, not repair.
        </Body>
      )}
      {mixed && (
        <Body>
          Note the asymmetry: one half of this blend is an <Gold href="/archetypes/integrated">integrated
          archetype</Gold> and one is a configuration under strain — which often describes a mind mid-journey:
          partly developed, partly still paying an old tax. The developed half is proof the other half can follow.
        </Body>
      )}
      <DeepDisclosure text={`Blend anatomy is computed from the two entries' cited line configurations; occurrence rates are explicitly unknown until the founding cohort produces real distribution data.`} />
      <DeepCta heading="Which halves are actually yours?" body="Blends are hypotheses until measured. 27 questions, eight AI graders, all 32 lines — then this page stops being speculation about you." />
    </DeepFrame>
  );
}
