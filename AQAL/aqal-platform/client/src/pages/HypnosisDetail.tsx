// ============================================================
// HYPNOSIS SESSION PAGES — /hypnosis/:id (50 URLs) — one page
// per guided session: purpose, suggestion themes, imagery, how
// to use, the honest evidence frame, and the recording slot.
// ============================================================
import { useParams, Link } from "wouter";
import { hypnosisById, HYPNOSIS_TOPICS } from "@shared/hypnosisTopics";
import { DeepFrame, DeepDisclosure, DeepCta, Body, H2, Card, CardText, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

export default function HypnosisDetail() {
  const params = useParams<{ id: string }>();
  const t = hypnosisById(params.id ?? "");
  if (!t) return <NotFound />;
  const idx = HYPNOSIS_TOPICS.findIndex((x) => x.id === t.id);
  const next = HYPNOSIS_TOPICS[(idx + 1) % HYPNOSIS_TOPICS.length];

  return (
    <DeepFrame
      crumb={<><Gold href="/hypnosis">The Hypnosis Library</Gold>{" · "}Session {idx + 1} of {HYPNOSIS_TOPICS.length}</>}
      h1={t.title}
      videoLabel={`Hypnosis — ${t.title}`}
    >
      <Body>
        A guided session for <b style={{ color: "#F1EADB" }}>{t.target.toLowerCase()}</b> — {t.length}, best with
        headphones, eyes closed, somewhere you won't be interrupted. Never while driving.
      </Body>
      <H2>What this session is for</H2>
      <Card accent={JADE}><CardText>{t.purpose}</CardText></Card>
      <H2>The suggestion themes — stated openly</H2>
      <Card accent={CHAMPAGNE}>
        <Label>Every suggestion in this session, in plain sight</Label>
        <CardText>{t.suggestions}</CardText>
      </Card>
      <Body>
        That's the whole point of the overt approach: you read the suggestions BEFORE you hear them, agree with
        them, and then let the relaxed state do what relaxed states are good at — rehearsing the agreed thing
        deeply. Nothing is slipped past you; a session you couldn't read in advance wouldn't be on this site.
      </Body>
      <H2>The imagery</H2>
      <Card accent={JADE}><CardText>{t.imagery}</CardText></Card>
      <H2>How to use it</H2>
      <Body>
        Daily or near-daily for two to three weeks is where mental-rehearsal protocols show their effects — one
        listen is a nice nap. Pair it with the real-world rep it rehearses (the session is the simulator; the day
        is the flight). If it serves a specific line, the line's{" "}
        <Gold href="/lines">full breakdown</Gold> and its protocols are the heavier equipment.
      </Body>
      <H2>The honest evidence frame</H2>
      <Card accent={EMBER}>
        <CardText>
          Guided imagery and mental rehearsal carry a real, replicated literature (sport psychology's most-used
          tool); relaxation protocols likewise. Hypnosis beyond that — recovered memories, medical cures, covert
          influence — is Myth Museum material, and we've shelved it there. This session claims only what the
          bounded evidence supports: state change now, rehearsal that transfers with practice. Not medical
          treatment; clinical conditions belong with licensed clinicians.
        </CardText>
      </Card>
      <Body>
        Next in the library: <Gold href={`/hypnosis/${next.id}`}>{next.title}</Gold> — or browse{" "}
        <Gold href="/hypnosis">all fifty sessions</Gold>.
      </Body>
      <DeepDisclosure text={`Session content is overt by design — every suggestion theme is printed above the recording that delivers it.`} />
      <DeepCta heading={`Is ${t.target.toLowerCase()} your actual bottleneck?`} body="Fifty sessions, one map. The assessment tells you which session is load-bearing for you." />
    </DeepFrame>
  );
}
