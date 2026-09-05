// ============================================================
// ARCHETYPE HUB PAGES — /archetypes/research, /archetypes/blending,
// /archetypes/integrated. One component, routed three ways.
// ============================================================
import { useLocation, Link } from "wouter";
import { ARCHETYPES } from "@shared/archetypesData";
import { archBlendSlug, ARCH_BLENDS } from "@shared/seo";
import { DeepFrame, DeepDisclosure, DeepCta, Card, CardText, Body, H2, Label, Gold, EMBER, JADE, CHAMPAGNE, MUTED } from "@/components/DeepPage";

export default function ArchetypesLibrary() {
  const [location] = useLocation();
  const totalSources = ARCHETYPES.reduce((n, a) => n + a.sources.length, 0);
  const integrated = ARCHETYPES.filter((a) => a.kind === "integrated");
  const connection = ARCHETYPES.filter((a) => a.kind === "connection");
  const isolation = ARCHETYPES.filter((a) => a.kind === "isolation");

  if (location === "/archetypes/integrated") {
    return (
      <DeepFrame crumb={<><Gold href="/archetypes">The Archetypes</Gold>{" · "}The Positive Set</>}
        h1="The integrated archetypes: the versions worth becoming" videoLabel="The Integrated Archetypes">
        <Body>
          Most archetype content on the internet is a warning label. This page is the opposite: the{" "}
          {integrated.length} POSITIVE archetypes — configurations where the strong lines are developed AND the
          historically starved ones have been fed. These aren't fantasy profiles; each one carries the same cited
          research record as everything else on this site, including the measured growth numbers that show the
          climb is real.
        </Body>
        <H2>The set</H2>
        {integrated.map((a) => (
          <Card key={a.id} accent={JADE}>
            <Label color={JADE}>positive · integrated</Label>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "19px", color: "#F1EADB", margin: "0 0 4px" }}>
              <Link href={`/archetype/${a.id}`} style={{ color: "#F1EADB" }}>{a.name} →</Link>
            </p>
            <CardText>{a.pattern}</CardText>
          </Card>
        ))}
        <H2>How to use this page</H2>
        <Body>
          Every configuration archetype in the library has at least one integrated counterpart — the same engine,
          developed. Find the entry that describes your current shape on the{" "}
          <Gold href="/archetypes">main chart</Gold>, then find the integrated version of that shape here: the
          distance between the two IS your development plan, and each dossier's break-out page maps it with cited
          protocols. Positive archetypes can blend too — several of the{" "}
          <Gold href="/archetypes/blending">documented blends</Gold> are compound positives.
        </Body>
        <DeepDisclosure text={`Integrated entries carry the same cited sources and honest limitations as every other dossier.`} />
        <DeepCta heading="Which integrated archetype is your destination?" body="Measure your current configuration first — the route depends entirely on the starting point." />
      </DeepFrame>
    );
  }

  if (location === "/archetypes/blending") {
    return (
      <DeepFrame crumb={<><Gold href="/archetypes">The Archetypes</Gold>{" · "}Blending</>}
        h1="Can you be more than one archetype at once?" videoLabel="Archetype Blending">
        <Body>
          Yes. And probably you are. Here are the honest answers to the questions everyone asks — including the
          one where the honest answer is "nobody knows yet."
        </Body>
        <H2>Why blending is possible at all</H2>
        <Body>
          An archetype is not a box you're placed in — it's a recurring CONFIGURATION of the same 32 intelligence
          lines everyone carries. Two archetypes that share strong lines can absolutely coexist in one mind: the
          shared machinery powers both patterns. That's not a loophole; it's what configurations are. The
          type-you-are forever framing belongs to the personality-quiz industry — and parts of that industry are
          in our <Gold href="/myths">Myth Museum</Gold> for exactly that overclaim.
        </Body>
        <H2>What being two archetypes looks like</H2>
        <Body>
          From inside: context-switching. One configuration drives at work, another at home; one under pressure,
          another at rest. From outside: people who know you in one context describe a different person than
          people who know you in another — and both descriptions are accurate. Every one of the{" "}
          {ARCH_BLENDS.length.toLocaleString()} documented pairings has its own{" "}
          <Gold href={`/archetype-blend/${archBlendSlug(ARCH_BLENDS[0][0], ARCH_BLENDS[0][1])}`}>anatomy page</Gold>{" "}
          — where the mixture amplifies, where it argues with itself, and where it's doubly blind.
        </Body>
        <H2>Three at once?</H2>
        <Body>
          Possible — the configuration math allows it wherever three patterns can share lines — but each added
          archetype has to "pay rent" in shared machinery, so genuine triples should be proportionally rarer than
          pairs, and a claimed quadruple is usually a person reading four flattering descriptions. The disciplined
          check for a suspected triple: run the three-part verify test on each candidate separately (every dossier
          has one), and require all three to pass the witness test — not just feel true.
        </Body>
        <H2>How often does blending happen? The honest answer.</H2>
        <Card accent={EMBER}>
          <CardText>
            Nobody knows — including us, and we'll say it plainly rather than invent a statistic: no population
            has ever been measured across all 32 lines, so no real base rates exist for archetypes OR their
            blends. Anyone quoting you "23% of people are dual-archetype" made it up. When the founding cohort is
            scored, we will publish the first real distribution — how many members are pure types, pairs, and
            triples — with the numbers we actually measured, on this page.
          </CardText>
        </Card>
        <DeepDisclosure text={`Blend anatomies are computed from cited line configurations; all frequency language on this page is explicitly pre-data.`} />
        <DeepCta heading="One, two, or three — which are yours?" body="The assessment doesn't hand you a box. It hands you your actual 32-line configuration — and the archetypes it matches." />
      </DeepFrame>
    );
  }

  // /archetypes/research (default)
  return (
    <DeepFrame crumb={<><Gold href="/archetypes">The Archetypes</Gold>{" · "}The Science</>}
      h1="The science behind the archetypes" videoLabel="Archetype Research">
      <Body>
        "Archetype" is a word with baggage — mystics use it, marketers abuse it, and half the personality-quiz
        industry sells it. So this page states exactly what OUR archetypes are, what evidence sits under them
        ({totalSources.toLocaleString()} sources across {ARCHETYPES.length} entries), and what we refuse to claim.
      </Body>
      <H2>What an archetype is here — and isn't</H2>
      <Body>
        Here, an archetype is a <b style={{ color: "#F1EADB" }}>recurring configuration</b>: a documented pattern
        of strong lines carrying starved ones, with a researched trajectory. It is NOT a fixed type, a birth
        assignment, or a fortune. The difference is testable: types claim you can't change; our entries each carry
        a "measured gains" section, because the research record says configurations move — with development,
        feedback, and connection.
      </Body>
      <H2>The four bodies of evidence</H2>
      <Card accent={EMBER}>
        <Label color={EMBER}>Configuration research</Label>
        <CardText>The dark-side and strain patterns — derailed executives, hubris syndrome, burnout, gifted underachievement — each documented in its own literature, cited on its own dossier.</CardText>
      </Card>
      <Card accent={CHAMPAGNE}>
        <Label>Isolation research ({isolation.length} entries)</Label>
        <CardText>What disconnection does to any configuration: the mortality-class findings on loneliness and social ties, the unmatched-prodigy studies, the founder-alone literature.</CardText>
      </Card>
      <Card accent={JADE}>
        <Label color={JADE}>Connection & development research ({connection.length} entries)</Label>
        <CardText>The counter-case: EI training effects, peer and grouping studies, deliberate development — the evidence that starved lines are trainable and that matching matters.</CardText>
      </Card>
      <Card accent={JADE}>
        <Label color={JADE}>The integrated set</Label>
        <CardText>The {integrated.length} positive archetypes — developed configurations with the research on what builds them. The library's destinations: <Gold href="/archetypes/integrated">meet them here</Gold>.</CardText>
      </Card>
      <H2>How to identify yours — and what we refuse to claim</H2>
      <Body>
        Every dossier carries a three-part verify page (configuration test, trajectory test, witness test) —
        because self-recognition alone is Barnum-effect territory, and we run a museum on that. And the refusals,
        in writing: we don't claim archetypes are fixed, we don't quote population frequencies that don't exist
        yet (<Gold href="/archetypes/blending">details</Gold>), and no dossier outputs a number its sources can't
        defend. Sources with their limitations are printed on every entry — the same standard as the{" "}
        <Gold href="/protocols">protocol library</Gold>, policed by the same{" "}
        <Gold href="/corrections">Corrections Ledger</Gold>.
      </Body>
      <DeepDisclosure text={`This page describes the evidence architecture; each dossier carries its own citations with their honest limitations.`} />
      <DeepCta heading="Stop reading descriptions. Get measured." body="246 documented configurations. One of them — maybe a blend of two — is currently running your life. Find out which." />
    </DeepFrame>
  );
}
