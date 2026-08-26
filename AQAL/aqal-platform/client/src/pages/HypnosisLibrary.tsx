// ============================================================
// HYPNOSIS LIBRARY HUB — /hypnosis — the 50 guided sessions,
// grouped by family, honestly framed.
// ============================================================
import { Link } from "wouter";
import { HYPNOSIS_TOPICS, type HypnosisFamily } from "@shared/hypnosisTopics";
import { DeepFrame, DeepDisclosure, DeepCta, Body, H2, Card, CardText, Label, Gold, JADE, CHAMPAGNE, MUTED } from "@/components/DeepPage";

const FAMILY_LABELS: Record<HypnosisFamily, { label: string; blurb: string }> = {
  line: { label: "Line rehearsal", blurb: "Sixteen sessions, one per magnetic intelligence line — rehearsing the line's strongest move until it's yours." },
  state: { label: "State sessions", blurb: "On-demand states: sleep, focus, pre-performance calm, courage for the cold call." },
  future: { label: "Future-pacing", blurb: "Living the achieved goal in sensory detail — then walking backward to today's next action." },
  habit: { label: "Habit support", blurb: "Urge-surfing and pattern-interrupts for the loops that run on autopilot." },
  recover: { label: "Recovery", blurb: "After the argument, the rejection, the failure — metabolize it, keep the lesson, return." },
};

export default function HypnosisLibrary() {
  return (
    <DeepFrame
      crumb={<><Gold href="/practices">Keystone Practices</Gold>{" · "}The Hypnosis Library</>}
      h1="The Hypnosis Library: 50 guided sessions"
      videoLabel="The Hypnosis Library"
    >
      <Body>
        Fifty guided self-hypnosis and mental-rehearsal sessions — and an honest frame before a single induction:
        these are <b style={{ color: "#F1EADB" }}>overt</b> sessions. You choose one, you press play, you know
        exactly what it's doing — relaxation, guided imagery, rehearsal, future-pacing. That's the version of
        hypnosis with a real evidence base (strong for relaxation and rehearsal uses; the overclaimed versions live
        in our <Gold href="/myths">Myth Museum</Gold>, where they belong). Mental rehearsal is one of sport
        psychology's most replicated tools; these sessions apply it to the lines and goals this platform measures.
        None of this is medical treatment, and none of it substitutes for a licensed clinician.
      </Body>
      {(Object.keys(FAMILY_LABELS) as HypnosisFamily[]).map((fam) => (
        <div key={fam}>
          <H2>{FAMILY_LABELS[fam].label}</H2>
          <Body>{FAMILY_LABELS[fam].blurb}</Body>
          {HYPNOSIS_TOPICS.filter((t) => t.family === fam).map((t) => (
            <Card key={t.id} accent={JADE}>
              <Label color={JADE}>{t.target} · {t.length}</Label>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "18px", color: "#F1EADB", margin: "0 0 4px" }}>
                <Link href={`/hypnosis/${t.id}`} style={{ color: "#F1EADB" }}>{t.title}</Link>
              </p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: MUTED, margin: 0 }}>{t.purpose}</p>
            </Card>
          ))}
        </div>
      ))}
      <DeepDisclosure text={`Session pages carry the audio/video slot for each recording; the framing (overt, evidence-bounded, non-medical) is printed on every one.`} />
      <DeepCta heading="Which session should you start with?" body="The one aimed at your weakest line — which is a measurement, not a guess. The assessment names it." />
    </DeepFrame>
  );
}
