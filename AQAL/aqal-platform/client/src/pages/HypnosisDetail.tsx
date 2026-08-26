import { useParams } from "wouter";
import { hypnosisById, HYPNOSIS_TOPICS } from "@shared/hypnosisTopics";
import { DeepFrame, DeepDisclosure, DeepCta, Body, H2, Card, CardText, Label, Gold, EMBER, JADE, CHAMPAGNE } from "@/components/DeepPage";
import NotFound from "@/pages/NotFound";

export default function HypnosisDetail() {
  const params = useParams<{ id: string }>();
  const topic = hypnosisById(params.id ?? "");
  if (!topic) return <NotFound />;
  const index = HYPNOSIS_TOPICS.findIndex((entry) => entry.id === topic.id);
  const next = HYPNOSIS_TOPICS[(index + 1) % HYPNOSIS_TOPICS.length];

  return (
    <DeepFrame
      crumb={<><Gold href="/hypnosis">The Hypnosis Library</Gold>{" · "}Session {index + 1} of {HYPNOSIS_TOPICS.length}</>}
      h1={topic.title}
      videoLabel={`Hypnosis — ${topic.title}`}
    >
      <Body>
        An overt guided-rehearsal outline for <b style={{ color: "#F1EADB" }}>{topic.target.toLowerCase()}</b> — {topic.length}.
        The recording slot is a placeholder until a reviewed script, transcript, and audio file are supplied.
      </Body>
      <Card accent={EMBER}>
        <Label color={EMBER}>Before using any future recording</Label>
        <CardText>
          Use it only somewhere safe and interruption-free — never while driving, cycling, or operating equipment.
          Participation is voluntary: pause or stop at any time. If you feel distressed or disoriented, open your eyes,
          look around the room, name where you are and the current date, move your body, stop playback, and seek
          appropriate support. This is not medical treatment and is not a substitute for a licensed clinician.
        </CardText>
      </Card>
      <H2>What this session is for</H2>
      <Card accent={JADE}><CardText>{topic.purpose}</CardText></Card>
      <H2>The suggestion themes — stated openly</H2>
      <Card accent={CHAMPAGNE}>
        <Label>Every planned suggestion, in plain sight</Label>
        <CardText>{topic.suggestions}</CardText>
      </Card>
      <Body>
        That is the point of the overt approach: you read the planned suggestions before you hear them, decide whether
        they fit, and retain control throughout. Nothing should be slipped past you; a session that could not be read
        in advance would not belong in this library.
      </Body>
      <H2>The imagery</H2>
      <Card accent={JADE}><CardText>{topic.imagery}</CardText></Card>
      <H2>How to use the outline</H2>
      <Body>
        Pair any future recording with the real-world behavior it rehearses. Repetition does not guarantee a result;
        the session is a simulator, and the day is the practice field. If it serves a specific line, the line's{" "}
        <Gold href="/lines">full breakdown</Gold> and its mapped protocols provide the heavier equipment.
      </Body>
      <H2>The honest evidence frame</H2>
      <Card accent={EMBER}>
        <CardText>
          Guided imagery, relaxation, and mental rehearsal have bounded evidence for some contexts, but effects vary
          and do not justify claims of recovered memories, medical cures, covert influence, or guaranteed change.
          This page claims only voluntary state preparation and rehearsal that must transfer through real practice.
          Clinical conditions and condition-specific hypnosis belong with qualified licensed clinicians.
        </CardText>
      </Card>
      <Body>
        Next in the library: <Gold href={`/hypnosis/${next.id}`}>{next.title}</Gold> — or browse{" "}
        <Gold href="/hypnosis">all fifty sessions</Gold>.
      </Body>
      <DeepDisclosure text="The recording slot is intentionally empty until the owner supplies reviewed audio, transcript/captions, reviewer identity, review date, version, and change log. Suggestion content remains overt by design." />
      <DeepCta heading={`Is ${topic.target.toLowerCase()} your actual bottleneck?`} body="Fifty outlines, one map. The assessment tells you which rehearsal target is load-bearing for you." />
    </DeepFrame>
  );
}
