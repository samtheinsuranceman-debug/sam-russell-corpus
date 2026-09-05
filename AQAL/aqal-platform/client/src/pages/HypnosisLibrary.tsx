import { Link } from "wouter";
import { HYPNOSIS_TOPICS, type HypnosisFamily } from "@shared/hypnosisTopics";
import { DeepFrame, DeepDisclosure, DeepCta, Body, H2, Card, Label, Gold, JADE, CHAMPAGNE, MUTED } from "@/components/DeepPage";

const FAMILY_LABELS: Record<HypnosisFamily, { label: string; blurb: string }> = {
  line: { label: "Line rehearsal", blurb: "Sixteen sessions, one per magnetic intelligence line — rehearsing the line's strongest move until it becomes easier to deploy." },
  state: { label: "State sessions", blurb: "On-demand preparation for sleep readiness, focus, pre-performance calm, and ordinary courage under pressure." },
  future: { label: "Future-pacing", blurb: "Rehearsing an achieved goal in sensory detail, then walking backward to today's next concrete action." },
  habit: { label: "Habit support", blurb: "Urge-surfing and pattern interrupts for ordinary loops that otherwise run on autopilot." },
  recover: { label: "Recovery", blurb: "After an argument, rejection, or setback: settle, retain the useful lesson, and choose the next move." },
};

export default function HypnosisLibrary() {
  return (
    <DeepFrame
      crumb={<><Gold href="/practices">Keystone Practices</Gold>{" · "}The Hypnosis Library</>}
      h1="The Hypnosis Library: 50 guided sessions"
      videoLabel="The Hypnosis Library"
    >
      <Body>
        Fifty guided self-hypnosis and mental-rehearsal sessions — and an honest frame before a single recording:
        these are <b style={{ color: "#F1EADB" }}>overt</b> sessions. You choose one, you know its purpose,
        and every suggestion theme is printed before listening. The tools are relaxation, guided imagery,
        rehearsal, and future-pacing. Results vary, and these pages do not promise a personal outcome.
        They are not medical treatment and do not replace a licensed clinician.
      </Body>
      {(Object.keys(FAMILY_LABELS) as HypnosisFamily[]).map((family) => (
        <div key={family}>
          <H2>{FAMILY_LABELS[family].label}</H2>
          <Body>{FAMILY_LABELS[family].blurb}</Body>
          {HYPNOSIS_TOPICS.filter((topic) => topic.family === family).map((topic) => (
            <Card key={topic.id} accent={JADE}>
              <Label color={JADE}>{topic.target} · {topic.length}</Label>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "18px", color: "#F1EADB", margin: "0 0 4px" }}>
                <Link href={`/hypnosis/${topic.id}`} style={{ color: "#F1EADB" }}>{topic.title}</Link>
              </p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: MUTED, margin: 0 }}>{topic.purpose}</p>
            </Card>
          ))}
        </div>
      ))}
      <Card accent={CHAMPAGNE}>
        <Label color={CHAMPAGNE}>Recording status and safety</Label>
        <Body>
          Each session page currently carries a recording slot, topic outline, and transparent suggestion list — not
          fabricated audio. A recording should be added only with its transcript, playback controls, reviewer identity,
          review date, and safety language. Never listen while driving or operating equipment. If a session becomes
          uncomfortable, stop, open your eyes, orient to the room, and seek appropriate support.
        </Body>
      </Card>
      <DeepDisclosure text="Every session is overt, voluntary, evidence-bounded, non-medical, and subject to the clinical-review gates in the owner production roadmap before audio publication." />
      <DeepCta heading="Which session should you start with?" body="The one aimed at your weakest line — which is a measurement, not a guess. The assessment names it." />
    </DeepFrame>
  );
}
